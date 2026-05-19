import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import iposWebhook from '../api/pos/ipos-webhook.js';
import goposWebhook from '../api/pos/gopos-webhook.js';
import subiektBridge from '../api/pos/subiekt-bridge.js';
import dotykackaPoll from '../api/pos/dotykacka-poll.js';
import { getPrisma } from './prisma.js';

dotenv.config();

const app = express();
app.set('trust proxy', true);
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required (Postgres).');
}
const prisma = getPrisma();

const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'qwerty';
const ADMIN_SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const BOOKING_IP_TTL_MS = Math.max(
  1,
  Number(process.env.BOOKING_IP_TTL_HOURS || 24) * 60 * 60 * 1000
);

function normalizeIp(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (raw.startsWith('::ffff:')) return raw.slice('::ffff:'.length);
  return raw;
}

function getClientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.trim()) {
    const first = xff.split(',')[0]?.trim();
    return normalizeIp(first);
  }
  return normalizeIp(req.ip);
}

const hashPassword = (password) => {
  const salt = crypto.randomBytes(16);
  const key = crypto.scryptSync(String(password), salt, 32);
  return `${salt.toString('hex')}:${key.toString('hex')}`;
};

const verifyPassword = (password, stored) => {
  if (!stored || typeof stored !== 'string') return false;
  const [saltHex, keyHex] = stored.split(':');
  if (!saltHex || !keyHex) return false;
  const salt = Buffer.from(saltHex, 'hex');
  const expected = Buffer.from(keyHex, 'hex');
  const actual = crypto.scryptSync(String(password), salt, expected.length);
  if (expected.length !== actual.length) return false;
  return crypto.timingSafeEqual(expected, actual);
};

const ensureAdminConfig = async () => {
  const existing = await prisma.adminConfig.findUnique({ where: { id: 'default' } });
  if (existing) return;
  await prisma.adminConfig.create({
    data: {
      id: 'default',
      passwordHash: hashPassword(DEFAULT_ADMIN_PASSWORD),
    },
  });
};

await ensureAdminConfig();

// Normal JSON parsing for other routes
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(cors());

// --- ROUTES ---

app.all('/api/pos/ipos-webhook', (req, res) => iposWebhook(req, res));
app.all('/api/pos/gopos-webhook', (req, res) => goposWebhook(req, res));
app.all('/api/pos/subiekt-bridge', (req, res) => subiektBridge(req, res));
app.all('/api/pos/dotykacka-poll', (req, res) => dotykackaPoll(req, res));

const requireAdmin = (req, res, next) => {
  const token = req.headers['x-admin-token'];
const bookingStreams = new Set();

function sseSend(res, event, data) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

function broadcastBooking(event, payload) {
  for (const res of bookingStreams) {
    try {
      sseSend(res, event, payload);
    } catch {}
  }
}

  if (typeof token !== 'string' || !token.trim()) return res.status(401).json({ error: 'Unauthorized' });
  prisma.adminSession
    .findUnique({ where: { token: token.trim() } })
    .then((session) => {
    .findUnique({ where: { token: token.trim() } })
    .then((session) => {
      if (!session) return res.status(401).json({ error: 'Unauthorized' });
      if (session.expiresAt.getTime() <= Date.now()) {
        return prisma.adminSession
          .delete({ where: { token: session.token } })
          .then(() => res.status(401).json({ error: 'Unauthorized' }))
          .catch(() => res.status(401).json({ error: 'Unauthorized' }));
      }
      next();
    })
    .catch(() => res.status(401).json({ error: 'Unauthorized' }));
};

const requireAdminStream = (req, res, next) => {
  const tokenFromHeader = req.headers['x-admin-token'];
  const tokenFromQuery = req.query?.token;
  const token = typeof tokenFromHeader === 'string' && tokenFromHeader.trim() ? tokenFromHeader.trim() : tokenFromQuery;
  if (typeof token !== 'string' || !token.trim()) return res.status(401).json({ error: 'Unauthorized' });
  prisma.adminSession
    .findUnique({ where: { token: token.trim() } })
    .then((session) => {
      if (!session) return res.status(401).json({ error: 'Unauthorized' });
      if (session.expiresAt.getTime() <= Date.now()) {
        return prisma.adminSession
          .delete({ where: { token: session.token } })
          .then(() => res.status(401).json({ error: 'Unauthorized' }))
          .catch(() => res.status(401).json({ error: 'Unauthorized' }));
      }
      next();
    })
    .catch(() => res.status(401).json({ error: 'Unauthorized' }));
};

app.post('/api/admin/login', async (req, res) => {
  const { password } = req.body || {};
  try {
    const config = await prisma.adminConfig.findUnique({ where: { id: 'default' } });
    const ok = verifyPassword(password, config?.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Unauthorized' });
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + ADMIN_SESSION_TTL_MS);
    await prisma.adminSession.create({ data: { token, expiresAt } });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/admin/change-password', requireAdmin, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!newPassword || String(newPassword).length < 4) return res.status(400).json({ error: 'Invalid new password' });
  try {
    const config = await prisma.adminConfig.findUnique({ where: { id: 'default' } });
    const ok = verifyPassword(currentPassword, config?.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Unauthorized' });
    await prisma.adminConfig.update({
      where: { id: 'default' },
      data: { passwordHash: hashPassword(newPassword) },
    });
    await prisma.adminSession.deleteMany({});
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + ADMIN_SESSION_TTL_MS);
    await prisma.adminSession.create({ data: { token, expiresAt } });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/catalog/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    res.json({ categories });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/catalog/products', async (req, res) => {
  const { category } = req.query;
  try {
    const where = {
      active: true,
      ...(typeof category === 'string' && category.trim()
        ? { category: { slug: category.trim() } }
        : {}),
    };

    const products = await prisma.product.findMany({
      where,
      include: {
        images: { orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] },
        variants: { where: { active: true }, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] },
        category: true,
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
    res.json({ products });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/catalog/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] },
        variants: { where: { active: true }, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] },
        category: true,
      },
    });
    if (!product || !product.active) return res.status(404).json({ error: 'Not found' });
    res.json({ product });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/bookings/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!booking) return res.status(404).json({ error: 'Not found' });
    res.json({ booking });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/bookings/create', async (req, res) => {
  const ip = getClientIp(req);
  if (!ip) return res.status(400).json({ error: 'Missing IP' });

  const { customerName, phone, notes, pickupTime, items, currency, subtotal, total } = req.body || {};

  if (!customerName || !String(customerName).trim()) return res.status(400).json({ error: 'customerName is required' });
  if (!phone || !String(phone).trim()) return res.status(400).json({ error: 'phone is required' });
  if (!pickupTime || !String(pickupTime).trim()) return res.status(400).json({ error: 'pickupTime is required' });
  if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'items is required' });

  const now = Date.now();
  const existing = await prisma.bookingIpLimit.findUnique({ where: { ip } }).catch(() => null);
  if (existing && existing.createdAt && existing.createdAt.getTime() > now - BOOKING_IP_TTL_MS) {
    return res.status(429).json({ error: 'Z jednego IP można złożyć tylko jedną rezerwację na 24h.' });
  }

  let booking;
  try {
    const pickup = new Date(String(pickupTime).trim());
    if (!Number.isFinite(pickup.getTime())) return res.status(400).json({ error: 'Invalid pickupTime' });

    const normalizedItems = Array.isArray(items)
      ? items
          .map((x) => (x && typeof x === 'object' ? x : null))
          .filter(Boolean)
          .map((x) => ({
            productId: String(x.productId),
            variantId: x.variantId ? String(x.variantId) : null,
            productName: String(x.productName || ''),
            variantName: x.variantName ? String(x.variantName) : null,
            image: x.image ? String(x.image) : null,
            unitPrice: Number(x.unitPrice) || 0,
            quantity: Math.max(1, Math.trunc(Number(x.quantity) || 1)),
          }))
          .filter((x) => x.productId && x.productName)
      : [];

    if (normalizedItems.length === 0) return res.status(400).json({ error: 'items is required' });

    booking = await prisma.booking.create({
      data: {
        customerName: String(customerName).trim(),
        phone: String(phone).trim(),
        notes: notes ? String(notes).trim() : null,
        pickupTime: pickup,
        currency: currency ? String(currency) : 'PLN',
        subtotal: Number(subtotal) || 0,
        total: Number(total) || Number(subtotal) || 0,
        paymentStatus: 'pay_at_counter',
        bookingStatus: 'confirmed',
        items: {
          create: normalizedItems,
        },
      },
      include: { items: true },
    });
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }

  await prisma.bookingIpLimit
    .upsert({
      where: { ip },
      create: { ip, bookingId: booking.id },
      update: { bookingId: booking.id, createdAt: new Date() },
    })
    .catch(() => {});

  res.json({ booking });
  broadcastBooking('upsert', booking);
});

app.get('/api/admin/bookings', requireAdmin, async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      include: { items: true },
      orderBy: [{ createdAt: 'desc' }],
      take: 100,
    });
    res.json({ bookings });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/admin/bookings/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { bookingStatus } = req.body || {};
  if (bookingStatus != null && !String(bookingStatus).trim()) return res.status(400).json({ error: 'Invalid bookingStatus' });
  try {
    const booking = await prisma.booking.update({
      where: { id },
      data: {
        ...(bookingStatus != null ? { bookingStatus: String(bookingStatus).trim() } : {}),
      },
      include: { items: true },
    });
    res.json({ booking });
    broadcastBooking('upsert', booking);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/admin/bookings/stream', requireAdminStream, async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();
  res.write('event: ready\ndata: {}\n\n');

  bookingStreams.add(res);
  req.on('close', () => {
    bookingStreams.delete(res);
  });
});

app.get('/api/admin/inventory', requireAdmin, async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: [{ name: 'asc' }],
      take: 200,
      select: {
        id: true,
        name: true,
        sku: true,
        ean: true,
        externalPosId: true,
        stockQuantity: true,
        isAvailable: true,
      },
    });
    res.json({ products });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/admin/inventory/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { stockQuantity, isAvailable } = req.body || {};
  try {
    const patch = {
      ...(stockQuantity != null && Number.isFinite(Number(stockQuantity))
        ? { stockQuantity: Math.max(0, Math.trunc(Number(stockQuantity))) }
        : {}),
      ...(typeof isAvailable === 'boolean' ? { isAvailable } : {}),
    };
    const product = await prisma.product.update({
      where: { id },
      data: patch,
      select: {
        id: true,
        name: true,
        sku: true,
        ean: true,
        externalPosId: true,
        stockQuantity: true,
        isAvailable: true,
      },
    });
    res.json({ product });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/admin/pos-settings', requireAdmin, async (req, res) => {
  const storeId = typeof req.query?.storeId === 'string' && req.query.storeId.trim() ? req.query.storeId.trim() : 'default';
  try {
    const settings = await prisma.posSetting.findMany({
      where: { storeId },
      orderBy: [{ posProvider: 'asc' }],
    });
    res.json({ storeId, settings });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/admin/pos-settings', requireAdmin, async (req, res) => {
  const { storeId, posProvider, apiToken, warehouseId, webhookSecret } = req.body || {};
  if (!storeId || !String(storeId).trim()) return res.status(400).json({ error: 'storeId is required' });
  if (!posProvider || !String(posProvider).trim()) return res.status(400).json({ error: 'posProvider is required' });
  try {
    const setting = await prisma.posSetting.upsert({
      where: {
        storeId_posProvider: {
          storeId: String(storeId).trim(),
          posProvider: String(posProvider).trim(),
        },
      },
      create: {
        storeId: String(storeId).trim(),
        posProvider: String(posProvider).trim(),
        apiToken: apiToken != null && String(apiToken).trim() ? String(apiToken) : null,
        warehouseId: warehouseId != null && String(warehouseId).trim() ? String(warehouseId) : null,
        webhookSecret: webhookSecret != null && String(webhookSecret).trim() ? String(webhookSecret) : null,
        lastSyncAt: null,
      },
      update: {
        apiToken: apiToken !== undefined ? (apiToken != null && String(apiToken).trim() ? String(apiToken) : null) : undefined,
        warehouseId:
          warehouseId !== undefined ? (warehouseId != null && String(warehouseId).trim() ? String(warehouseId) : null) : undefined,
        webhookSecret:
          webhookSecret !== undefined ? (webhookSecret != null && String(webhookSecret).trim() ? String(webhookSecret) : null) : undefined,
      },
    });
    res.json({ setting });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/admin/categories', requireAdmin, async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    res.json({ categories });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/admin/products', requireAdmin, async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        images: { orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] },
        variants: { orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] },
        category: true,
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
    res.json({ products });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/admin/categories', requireAdmin, async (req, res) => {
  const { slug, name, sortOrder, active } = req.body || {};
  if (!slug || !name) return res.status(400).json({ error: 'slug and name are required' });
  try {
    const category = await prisma.category.create({
      data: {
        slug,
        name,
        sortOrder: Number.isFinite(Number(sortOrder)) ? Number(sortOrder) : 0,
        active: typeof active === 'boolean' ? active : true,
      },
    });
    res.json({ category });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/admin/categories/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { slug, name, sortOrder, active } = req.body || {};
  if (slug != null && !String(slug).trim()) return res.status(400).json({ error: 'Invalid slug' });
  if (name != null && !String(name).trim()) return res.status(400).json({ error: 'Invalid name' });
  try {
    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(slug != null ? { slug: String(slug).trim() } : {}),
        ...(name != null ? { name: String(name).trim() } : {}),
        ...(sortOrder != null && Number.isFinite(Number(sortOrder)) ? { sortOrder: Number(sortOrder) } : {}),
        ...(typeof active === 'boolean' ? { active } : {}),
      },
    });
    res.json({ category });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/admin/categories/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.product.updateMany({
      where: { categoryId: id },
      data: { categoryId: null },
    });
    await prisma.category.delete({ where: { id } });
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/admin/products', requireAdmin, async (req, res) => {
  const { slug, name, description, basePrice, currency, active, sortOrder, categoryId, images, variants, sku, ean, externalPosId } =
    req.body || {};
  if (!slug || !name) return res.status(400).json({ error: 'slug and name are required' });
  if (!Number.isFinite(Number(basePrice))) return res.status(400).json({ error: 'basePrice is required' });
  try {
    const product = await prisma.product.create({
      data: {
        slug,
        name,
        description: description || null,
        basePrice: Number(basePrice),
        currency: currency || 'PLN',
        active: typeof active === 'boolean' ? active : true,
        sortOrder: Number.isFinite(Number(sortOrder)) ? Number(sortOrder) : 0,
        categoryId: categoryId || null,
        sku: sku != null && String(sku).trim() ? String(sku).trim() : null,
        ean: ean != null && String(ean).trim() ? String(ean).trim() : null,
        externalPosId: externalPosId != null && String(externalPosId).trim() ? String(externalPosId).trim() : null,
        images: {
          create: Array.isArray(images)
            ? images
                .filter((x) => x?.url)
                .map((x, idx) => ({
                  url: String(x.url),
                  alt: x.alt ? String(x.alt) : null,
                  sortOrder: Number.isFinite(Number(x.sortOrder)) ? Number(x.sortOrder) : idx,
                }))
            : [],
        },
        variants: {
          create: Array.isArray(variants)
            ? variants
                .filter((x) => x?.name)
                .map((x, idx) => ({
                  name: String(x.name),
                  sku: x.sku ? String(x.sku) : null,
                  price: x.price != null && Number.isFinite(Number(x.price)) ? Number(x.price) : null,
                  active: typeof x.active === 'boolean' ? x.active : true,
                  sortOrder: Number.isFinite(Number(x.sortOrder)) ? Number(x.sortOrder) : idx,
                }))
            : [],
        },
      },
      include: {
        images: { orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] },
        variants: { where: { active: true }, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] },
        category: true,
      },
    });
    res.json({ product });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/admin/products/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, description, basePrice, currency, active, sortOrder, categoryId, sku, ean, externalPosId } = req.body || {};
  try {
    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(name != null ? { name } : {}),
        ...(description !== undefined ? { description: description || null } : {}),
        ...(basePrice != null && Number.isFinite(Number(basePrice)) ? { basePrice: Number(basePrice) } : {}),
        ...(currency != null ? { currency } : {}),
        ...(typeof active === 'boolean' ? { active } : {}),
        ...(sortOrder != null && Number.isFinite(Number(sortOrder)) ? { sortOrder: Number(sortOrder) } : {}),
        ...(categoryId !== undefined ? { categoryId: categoryId || null } : {}),
        ...(sku !== undefined ? { sku: sku != null && String(sku).trim() ? String(sku).trim() : null } : {}),
        ...(ean !== undefined ? { ean: ean != null && String(ean).trim() ? String(ean).trim() : null } : {}),
        ...(externalPosId !== undefined
          ? { externalPosId: externalPosId != null && String(externalPosId).trim() ? String(externalPosId).trim() : null }
          : {}),
      },
      include: {
        images: { orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] },
        variants: { where: { active: true }, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] },
        category: true,
      },
    });
    res.json({ product });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/admin/products/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.product.delete({ where: { id } });
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, '..', 'dist');

if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get(/^(?!\/api\/).*/, (req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
