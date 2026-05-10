
const memory = new Map()

function now () { return Date.now() }

export function isRedisAvailable () {
  return !!(global.redis && typeof global.redis.get === 'function')
}

export async function get (key) {
  try {
    if (global.redis) {
      const val = await global.redis.get(key)
      if (val != null) return JSON.parse(val)
    }
  } catch {}
  const entry = memory.get(key)
  if (!entry) return null
  if (entry.exp && entry.exp < now()) { memory.delete(key); return null }
  return entry.val
}

export async function set (key, value, ttlMs = 0) {
  try {
    if (global.redis) {
      const payload = JSON.stringify(value)
      if (ttlMs > 0) {
        await global.redis.set(key, payload, 'PX', ttlMs)
      } else {
        await global.redis.set(key, payload)
      }
    }
  } catch {}
  const exp = ttlMs > 0 ? now() + ttlMs : 0
  memory.set(key, { val: value, exp })
}

export async function del (key) {
  try { if (global.redis) await global.redis.del(key) } catch {}
  memory.delete(key)
}

export async function keys (pattern) {
  try {
    if (global.redis && typeof global.redis.keys === 'function') {
      const values = await global.redis.keys(pattern)
      return Array.isArray(values) ? values : []
    }
  } catch {}
  const matcher = new RegExp(`^${String(pattern)
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')}$`)
  return [...memory.keys()].filter(key => matcher.test(key))
}

export async function exists (key) {
  if (global.redis && typeof global.redis.exists === 'function') {
    try {
      return await global.redis.exists(key)
    } catch {}
  }
  const entry = memory.get(key)
  if (!entry) return 0
  if (entry.exp && entry.exp < now()) {
    memory.delete(key)
    return 0
  }
  return 1
}

export async function ttl (key) {
  if (global.redis && typeof global.redis.ttl === 'function') {
    try { return await global.redis.ttl(key) } catch {}
  }
  const entry = memory.get(key)
  if (!entry) return -2
  if (!entry.exp) return -1
  const remainMs = entry.exp - now()
  if (remainMs <= 0) {
    memory.delete(key)
    return -2
  }
  return Math.ceil(remainMs / 1000)
}

export async function setWithEX (key, value, seconds) {
  if (!seconds) return false
  try {
    if (global.redis) {
      await global.redis.set(key, JSON.stringify(value), { EX: seconds })
    }
  } catch {}
  memory.set(key, { val: value, exp: now() + seconds * 1000 })
  return true
}
