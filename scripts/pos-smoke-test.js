import { Readable } from 'stream'

import iposWebhook from '../api/pos/ipos-webhook.js'
import goposWebhook from '../api/pos/gopos-webhook.js'
import subiektBridge from '../api/pos/subiekt-bridge.js'
import dotykackaPoll from '../api/pos/dotykacka-poll.js'

function makeRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: '',
    setHeader(k, v) {
      this.headers[String(k).toLowerCase()] = v
    },
    end(chunk) {
      if (chunk) this.body += String(chunk)
      this.ended = true
    },
  }
  return res
}

function makeReq({ method, headers, query, json }) {
  const raw = json != null ? Buffer.from(JSON.stringify(json), 'utf8') : Buffer.from('', 'utf8')
  const req = Readable.from(raw.length ? [raw] : [])
  req.method = method
  req.headers = headers || {}
  req.query = query || {}
  return req
}

async function runCase(name, fn) {
  try {
    await fn()
    process.stdout.write(`OK ${name}\n`)
  } catch (e) {
    process.stderr.write(`FAIL ${name}: ${e?.message || e}\n`)
    process.exitCode = 1
  }
}

await runCase('ipos missing store_id', async () => {
  const req = makeReq({ method: 'POST', json: [] })
  const res = makeRes()
  await iposWebhook(req, res)
  if (res.statusCode !== 400) throw new Error(`expected 400, got ${res.statusCode}`)
})

await runCase('gopos missing signature', async () => {
  const req = makeReq({ method: 'POST', query: { store_id: 'x' }, json: { type: 'stock.updated', items: [] } })
  const res = makeRes()
  await goposWebhook(req, res)
  if (res.statusCode !== 500 && res.statusCode !== 401) throw new Error(`expected 401/500, got ${res.statusCode}`)
})

await runCase('subiekt missing store_id', async () => {
  const req = makeReq({ method: 'POST', json: [] })
  const res = makeRes()
  await subiektBridge(req, res)
  if (res.statusCode !== 400) throw new Error(`expected 400, got ${res.statusCode}`)
})

await runCase('dotykacka poll no env', async () => {
  const req = makeReq({ method: 'GET', json: null })
  const res = makeRes()
  await dotykackaPoll(req, res)
  if (res.statusCode !== 500) throw new Error(`expected 500, got ${res.statusCode}`)
})

