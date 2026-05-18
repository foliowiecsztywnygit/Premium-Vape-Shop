export const BUSINESS = {
  name: 'Premium Vape Shop Ursynów',
  addressLine1: 'Belgradzka 14/lokal u11',
  addressLine2: '02-793 Warszawa',
  phone: '797 745 829',
  timezone: 'Europe/Warsaw',
  hours: {
    1: { open: '10:00', close: '21:00' },
    2: { open: '10:00', close: '21:00' },
    3: { open: '10:00', close: '21:00' },
    4: { open: '10:00', close: '21:00' },
    5: { open: '10:00', close: '21:00' },
    6: { open: '10:00', close: '21:00' },
  },
  social: {
    facebook: 'https://www.facebook.com/profile.php?id=61588453594670',
    instagram: 'https://www.instagram.com/premiumvapeshopursynow',
  },
  googleRating: {
    rating: 5.0,
    reviewsCount: 16,
  },
  featuredReviews: [
    {
      author: 'Maksymilian Zajączkowski',
      text: 'Bardzo dobre ceny i liquidy pierwsza klasa 🤝 Najlepszy gość na ursynowie 💪',
      stars: 5,
    },
    {
      author: 'Johnny Silverhand',
      text: 'Bardzo fajny sklep, miła obsługa, zawsze na najwyższym poziomie. Mega polecam!!',
      stars: 5,
    },
    {
      author: 'Janusz Bierzak',
      text: 'Super obsługa, wszytko fajnie doradzone i przede wszytkim lokalizacja super :)',
      stars: 5,
    },
  ],
}

export const SHOP_CATEGORIES = [
  'Liquidy',
  'E-papierosy',
  'Grzałki',
  'Kardridże',
  'Jednorazówki',
  'Wielorazówki',
  'Akcesoria',
  'Bongo',
  'Shisha',
  'Tytoń',
  'Melasa',
  'Susz CBD',
]

function parseTimeToMinutes(value) {
  const [h, m] = value.split(':').map((x) => Number(x))
  return h * 60 + m
}

function getWarsawParts(date) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: BUSINESS.timezone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date)

  const weekday = parts.find((p) => p.type === 'weekday')?.value
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 0)
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? 0)

  return { weekday, hour, minute }
}

function weekdayShortToIndex(weekday) {
  const map = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 0 }
  return map[weekday] ?? null
}

export function getOpenStatus(date = new Date()) {
  const { weekday, hour, minute } = getWarsawParts(date)
  const dayIndex = weekdayShortToIndex(weekday)
  const dayHours = dayIndex != null ? BUSINESS.hours[dayIndex] : null

  if (!dayHours) {
    return { isOpen: false, label: 'Zamknięte', closesAt: null, opensAt: null }
  }

  const nowMinutes = hour * 60 + minute
  const openMinutes = parseTimeToMinutes(dayHours.open)
  const closeMinutes = parseTimeToMinutes(dayHours.close)

  const isOpen = nowMinutes >= openMinutes && nowMinutes < closeMinutes

  if (isOpen) {
    return {
      isOpen: true,
      label: `Otwarte · do ${dayHours.close}`,
      closesAt: dayHours.close,
      opensAt: dayHours.open,
    }
  }

  const opensAt = nowMinutes < openMinutes ? dayHours.open : null
  return {
    isOpen: false,
    label: opensAt ? `Zamknięte · otwarcie ${opensAt}` : 'Zamknięte',
    closesAt: dayHours.close,
    opensAt: dayHours.open,
  }
}

