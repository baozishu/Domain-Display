import { getDb } from "@/lib/db"

// Domain services
export async function getDomains() {
  const db = await getDb()
  const domains = await db.all(`SELECT * FROM domains`)

  // Convert to camelCase for frontend
  return domains.map((domain) => ({
    id: domain.id,
    name: domain.name,
    extension: domain.extension,
    status: domain.status,
    registrar: domain.registrar,
    registrarIcon: domain.registrar_icon,
    registrationTime: domain.registration_time,
    expirationTime: domain.expiration_time,
    purchaseUrl: domain.purchase_url,
  }))
}

export async function getDomainById(id: string) {
  const db = await getDb()
  const domain = await db.get(`SELECT * FROM domains WHERE id = ?`, [id])

  if (!domain) return null

  // Convert to camelCase for frontend
  return {
    id: domain.id,
    name: domain.name,
    extension: domain.extension,
    status: domain.status,
    registrar: domain.registrar,
    registrarIcon: domain.registrar_icon,
    registrationTime: domain.registration_time,
    expirationTime: domain.expiration_time,
    purchaseUrl: domain.purchase_url,
  }
}

// Sold domain services
export async function getSoldDomains() {
  const db = await getDb()
  const domains = await db.all(`SELECT * FROM sold_domains`)

  // Convert to camelCase for frontend
  return domains.map((domain) => ({
    id: domain.id,
    name: domain.name,
    extension: domain.extension,
    status: domain.status,
    soldTo: domain.sold_to,
    soldDate: domain.sold_date,
  }))
}

export async function getSoldDomainById(id: string) {
  const db = await getDb()
  const domain = await db.get(`SELECT * FROM sold_domains WHERE id = ?`, [id])

  if (!domain) return null

  // Convert to camelCase for frontend
  return {
    id: domain.id,
    name: domain.name,
    extension: domain.extension,
    status: domain.status,
    soldTo: domain.sold_to,
    soldDate: domain.sold_date,
  }
}

// Friendly link services
export async function getFriendlyLinks() {
  const db = await getDb()
  return db.all(`SELECT * FROM friendly_links`)
}

export async function getFriendlyLinkById(id: string) {
  const db = await getDb()
  return db.get(`SELECT * FROM friendly_links WHERE id = ?`, [id])
}

// Site settings services
export async function getSiteSettings() {
  const db = await getDb()
  const settings = await db.get(`SELECT * FROM site_settings WHERE id = 'default'`)

  if (!settings) return null

  // Convert to camelCase for frontend
  return {
    siteName: settings.site_name,
    logoType: settings.logo_type,
    logoText: settings.logo_text,
    logoImage: settings.logo_image,
    favicon: settings.favicon,
  }
}

// Registrar icon services
export async function getRegistrarIcons() {
  const db = await getDb()
  const icons = await db.all(`SELECT name, svg FROM registrar_icons`)

  // Convert to object with name as key
  return icons.reduce((acc, icon) => {
    acc[icon.name] = icon.svg
    return acc
  }, {})
}

// Auth services
export async function getAuthStatus() {
  const db = await getDb()
  const auth = await db.get(`SELECT is_logged_in FROM auth WHERE id = 'admin'`)
  return auth ? Boolean(auth.is_logged_in) : false
}

export async function verifyPassword(password: string) {
  const db = await getDb()
  const auth = await db.get(`SELECT password FROM auth WHERE id = 'admin'`)
  return auth && auth.password === password
}

