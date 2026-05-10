import { getDB, isSQLiteAvailable, getSQLiteInitError, getSQLiteStatus, getSQLiteWarning } from './sqlite_manager.js'
import fs from 'fs/promises'
import Ajv from 'ajv'
import path from 'path'
import { pluginRoot } from './common-lib/paths.js'

const locks = new Map()
function withLock (key, fn) {
  const prev = locks.get(key) || Promise.resolve()
  const next = prev.then(() => fn()).catch(err => { throw err })
  locks.set(key, next.finally(() => { if (locks.get(key) === next) locks.delete(key) }))
  return next
}

const SQLITE_UNAVAILABLE_ERROR_CODE = 'SQLITE_UNAVAILABLE'

function createSQLiteUnavailableError () {
  const rootError = getSQLiteInitError()
  const error = new Error(rootError?.message || 'SQLite backend unavailable')
  error.code = SQLITE_UNAVAILABLE_ERROR_CODE
  if (rootError) error.cause = rootError
  return error
}

function requireDB () {
  const db = getDB()
  if (!db) throw createSQLiteUnavailableError()
  return db
}

export function isSQLiteBackendAvailable () {
  return isSQLiteAvailable()
}

export function getSQLiteBackendStatus () {
  return getSQLiteStatus()
}

export function getSQLiteBackendWarning () {
  return getSQLiteWarning()
}

// 载入并编译 JSON Schema（用于读写时校验）
const ajv = new Ajv({ allErrors: true, strict: false })
const validators = new Map()
let schemasLoaded = false
let schemasLoading = null

async function loadSchema (name, filename) {
  try {
    const full = path.join(pluginRoot, 'data', 'schemas', filename)
    const txt = await fs.readFile(full, 'utf-8')
    const json = JSON.parse(txt)
    validators.set(name, ajv.compile(json))
  } catch {}
}

async function ensureSchemasLoaded () {
  if (schemasLoaded) return
  if (!schemasLoading) {
    schemasLoading = Promise.all([
      loadSchema('user', 'user.json'),
      loadSchema('inventory_item', 'inventory_item.json'),
      loadSchema('workshop', 'workshop.json'),
      loadSchema('synthesis_record', 'synthesis_record.json'),
      loadSchema('relationship', 'relationship.json'),
      loadSchema('signin', 'signin.json'),
      loadSchema('boost', 'boost.json'),
      loadSchema('quest', 'quest.json')
    ]).finally(() => {
      schemasLoaded = true
      schemasLoading = null
    })
  }
  await schemasLoading
}

function normalizeHomeState (data) {
  return {
    s: data?.s || '',
    wait: Number(data?.wait || 0),
    money: Number(data?.money || 0),
    love: Number(data?.love || 0),
    level: Number(data?.level || 0)
  }
}

function normalizeBattleState (data) {
  return {
    experience: Number(data?.experience || 0),
    level: Number(data?.level || 0),
    levelname: data?.levelname || '无等级',
    Privilege: Number((data?.Privilege ?? data?.privilege) || 0),
    attack: Number(data?.attack || 0),
    defense: Number(data?.defense || 0),
    speed: Number(data?.speed || 0)
  }
}

function normalizeWorkHistory (data) {
  return Array.isArray(data) ? data : []
}

function normalizeRelationshipState (data) {
  return {
    couples: data?.couples && typeof data.couples === 'object' ? data.couples : {},
    shops: data?.shops && typeof data.shops === 'object' ? data.shops : {},
    adventures: data?.adventures && typeof data.adventures === 'object' ? data.adventures : {},
    love_bank: data?.love_bank && typeof data.love_bank === 'object' ? data.love_bank : {}
  }
}

function normalizeXiaoqieState (data) {
  return {
    fuck: Array.isArray(data?.fuck) ? data.fuck : [],
    fucktime: Number(data?.fucktime || 0),
    kun: Number(data?.kun || 0)
  }
}

export async function getUserHome (userId, groupId) {
  const row = requireDB().prepare('SELECT s,wait,money,love,level FROM users WHERE user_id=? AND group_id=?').get(String(userId), String(groupId || 'global'))
  if (!row) return normalizeHomeState()
  return normalizeHomeState(row)
}

export async function saveUserHome (userId, groupId, data) {
  const key = `users:${groupId}:${userId}`
  return withLock(key, async () => {
    await ensureSchemasLoaded()
    const normalized = normalizeHomeState(data)
    validateOrThrow('user', { money: normalized.money, love: normalized.love, level: normalized.level })
    requireDB().prepare('INSERT INTO users (user_id,group_id,s,wait,money,love,level) VALUES (?,?,?,?,?,?,?) ON CONFLICT(user_id,group_id) DO UPDATE SET s=excluded.s,wait=excluded.wait,money=excluded.money,love=excluded.love,level=excluded.level')
      .run(String(userId), String(groupId || 'global'), String(normalized.s || ''), normalized.wait, normalized.money, normalized.love, normalized.level)
    return true
  })
}

export async function getUserBattle (userId, groupId) {
  const row = requireDB().prepare('SELECT experience,level,levelname,privilege,attack,defense,speed FROM battle WHERE user_id=? AND group_id=?').get(String(userId), String(groupId || 'global'))
  if (!row) return normalizeBattleState()
  return normalizeBattleState(row)
}

export async function getUserPlace (userId, groupId) {
  const row = requireDB().prepare('SELECT place,placetime FROM place_state WHERE user_id=? AND group_id=?').get(String(userId), String(groupId || 'global'))
  if (!row) return { place: 'home', placetime: 0 }
  return { place: row.place || 'home', placetime: Number(row.placetime || 0) }
}

export async function saveUserPlace (userId, groupId, data) {
  const key = `place:${groupId}:${userId}`
  return withLock(key, async () => {
    requireDB().prepare('INSERT INTO place_state (user_id,group_id,place,placetime) VALUES (?,?,?,?) ON CONFLICT(user_id,group_id) DO UPDATE SET place=excluded.place,placetime=excluded.placetime')
      .run(String(userId), String(groupId || 'global'), String(data?.place || 'home'), Number(data?.placetime || 0))
    return true
  })
}

export async function getUserHouse (userId, groupId) {
  const row = requireDB().prepare('SELECT name,space,price,loveup FROM house_state WHERE user_id=? AND group_id=?').get(String(userId), String(groupId || 'global'))
  if (!row) return { name: '小破屋', space: 6, price: 500, loveup: 1 }
  return {
    name: row.name || '小破屋',
    space: Number(row.space || 6),
    price: Number(row.price || 500),
    loveup: Number(row.loveup || 1)
  }
}

export async function saveUserHouse (userId, groupId, data) {
  const key = `house:${groupId}:${userId}`
  return withLock(key, async () => {
    requireDB().prepare('INSERT INTO house_state (user_id,group_id,name,space,price,loveup) VALUES (?,?,?,?,?,?) ON CONFLICT(user_id,group_id) DO UPDATE SET name=excluded.name,space=excluded.space,price=excluded.price,loveup=excluded.loveup')
      .run(
        String(userId),
        String(groupId || 'global'),
        String(data?.name || '小破屋'),
        Number(data?.space || 6),
        Number(data?.price || 500),
        Number(data?.loveup || 1)
      )
    return true
  })
}

export async function getUserXiaoqie (userId, groupId) {
  const row = requireDB().prepare('SELECT data_json FROM xiaoqie_state WHERE user_id=? AND group_id=?').get(String(userId), String(groupId || 'global'))
  if (!row?.data_json) return normalizeXiaoqieState()
  try {
    return normalizeXiaoqieState(JSON.parse(row.data_json))
  } catch {
    return normalizeXiaoqieState()
  }
}

export async function saveUserXiaoqie (userId, groupId, data) {
  const key = `xiaoqie:${groupId}:${userId}`
  return withLock(key, async () => {
    const normalized = normalizeXiaoqieState(data)
    requireDB().prepare('INSERT INTO xiaoqie_state (user_id,group_id,data_json) VALUES (?,?,?) ON CONFLICT(user_id,group_id) DO UPDATE SET data_json=excluded.data_json')
      .run(String(userId), String(groupId || 'global'), JSON.stringify(normalized))
    return true
  })
}

export async function saveUserBattle (userId, groupId, data) {
  const key = `battle:${groupId}:${userId}`
  return withLock(key, async () => {
    const normalized = normalizeBattleState(data)
    requireDB().prepare('INSERT INTO battle (user_id,group_id,experience,level,levelname,privilege,attack,defense,speed) VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT(user_id,group_id) DO UPDATE SET experience=excluded.experience,level=excluded.level,levelname=excluded.levelname,privilege=excluded.privilege,attack=excluded.attack,defense=excluded.defense,speed=excluded.speed')
      .run(String(userId), String(groupId || 'global'), normalized.experience, normalized.level, normalized.levelname, normalized.Privilege, normalized.attack, normalized.defense, normalized.speed)
    return true
  })
}

export async function loadUserInventory (userId, groupId) {
  const rows = requireDB().prepare('SELECT item_id,item_json FROM inventory WHERE user_id=? AND group_id=?').all(String(userId), String(groupId || 'global'))
  return rows.map(r => ({ id: r.item_id, ...JSON.parse(r.item_json) }))
}

export async function saveUserInventory (userId, groupId, items) {
  const key = `inventory:${groupId}:${userId}`
  return withLock(key, async () => {
    await ensureSchemasLoaded()
    const db = requireDB()
    const del = db.prepare('DELETE FROM inventory WHERE user_id=? AND group_id=?')
    del.run(String(userId), String(groupId || 'global'))
    const ins = db.prepare('INSERT INTO inventory (user_id,group_id,item_id,item_json,ts) VALUES (?,?,?,?,?)')
    const ts = Math.floor(Date.now() / 1000)
    const tx = db.transaction((list) => {
      for (const it of list) {
        const id = String(it.id || it.item_id || Math.random().toString(36).slice(2))
        try { validateOrThrow('inventory_item', it) } catch {}
        ins.run(String(userId), String(groupId || 'global'), id, JSON.stringify(it), ts)
      }
    })
    tx(items || [])
    return true
  })
}

export async function getSignIn (userId, groupId) {
  const row = requireDB().prepare('SELECT streak,last_signed FROM signin WHERE user_id=? AND group_id=?').get(String(userId), String(groupId || 'global'))
  if (!row) return { streak: 0, todaySigned: false }
  const today = new Date().toLocaleDateString()
  return { streak: Number(row.streak || 0), todaySigned: row.last_signed === today }
}

export async function setSignIn (userId, groupId, streak) {
  const key = `signin:${groupId}:${userId}`
  return withLock(key, async () => {
    await ensureSchemasLoaded()
    const today = new Date().toLocaleDateString()
    validateOrThrow('signin', { streak: Number(streak || 0), lastSigned: today })
    requireDB().prepare('INSERT INTO signin (user_id,group_id,streak,last_signed) VALUES (?,?,?,?) ON CONFLICT(user_id,group_id) DO UPDATE SET streak=excluded.streak,last_signed=excluded.last_signed')
      .run(String(userId), String(groupId || 'global'), Number(streak || 0), today)
    return true
  })
}

export async function getBoost (userId, groupId, type) {
  const row = requireDB().prepare('SELECT value FROM boosts WHERE user_id=? AND group_id=? AND type=?').get(String(userId), String(groupId || 'global'), String(type))
  return Number(row?.value || 0)
}

export async function setBoost (userId, groupId, type, value) {
  const key = `boost:${type}:${groupId}:${userId}`
  return withLock(key, async () => {
    await ensureSchemasLoaded()
    validateOrThrow('boost', { type: String(type), value: Number(value || 0) })
    requireDB().prepare('INSERT INTO boosts (user_id,group_id,type,value) VALUES (?,?,?,?) ON CONFLICT(user_id,group_id,type) DO UPDATE SET value=excluded.value')
      .run(String(userId), String(groupId || 'global'), String(type), Number(value || 0))
    return true
  })
}

export async function consumeBoost (userId, groupId, type, amount = 1) {
  const key = `boost:${type}:${groupId}:${userId}`
  return withLock(key, async () => {
    const cur = await getBoost(userId, groupId, type)
    if (cur <= 0) return false
    await setBoost(userId, groupId, type, Math.max(0, cur - amount))
    return true
  })
}

export async function getWorkshop (userId, groupId) {
  const row = requireDB().prepare('SELECT level,slots,data_json FROM workshop WHERE user_id=? AND group_id=?').get(String(userId), String(groupId || 'global'))
  if (!row) return { level: 1, slots: 1 }
  const extra = row.data_json ? JSON.parse(row.data_json) : {}
  return { level: Number(row.level || 1), slots: Number(row.slots || 1), ...extra }
}

export async function saveWorkshop (userId, groupId, data) {
  const key = `workshop:${groupId}:${userId}`
  return withLock(key, async () => {
    await ensureSchemasLoaded()
    validateOrThrow('workshop', { level: Number(data.level || 1), slots: Number(data.slots || 1), data })
    requireDB().prepare('INSERT INTO workshop (user_id,group_id,level,slots,data_json) VALUES (?,?,?,?,?) ON CONFLICT(user_id,group_id) DO UPDATE SET level=excluded.level,slots=excluded.slots,data_json=excluded.data_json')
      .run(String(userId), String(groupId || 'global'), Number(data.level || 1), Number(data.slots || 1), JSON.stringify(data))
    return true
  })
}

export async function getSynthesisHistory (userId, groupId) {
  const rows = requireDB().prepare('SELECT ts,record_json FROM synthesis_history WHERE user_id=? AND group_id=? ORDER BY ts ASC').all(String(userId), String(groupId || 'global'))
  return rows.map(r => ({ ts: Number(r.ts), ...JSON.parse(r.record_json) }))
}

export async function saveSynthesisHistory (userId, groupId, list) {
  const key = `synthesis:${groupId}:${userId}`
  return withLock(key, async () => {
    const db = requireDB()
    const del = db.prepare('DELETE FROM synthesis_history WHERE user_id=? AND group_id=?')
    del.run(String(userId), String(groupId || 'global'))
    const ins = db.prepare('INSERT INTO synthesis_history (user_id,group_id,ts,record_json) VALUES (?,?,?,?)')
    const tx = db.transaction((records) => {
      for (const rec of records) ins.run(String(userId), String(groupId || 'global'), Number(rec.ts || Date.now()), JSON.stringify(rec))
    })
    tx(list || [])
    return true
  })
}

export async function recordSynthesis (userId, groupId, record) {
  await ensureSchemasLoaded()
  try { validateOrThrow('synthesis_record', record) } catch {}
  const ins = requireDB().prepare('INSERT INTO synthesis_history (user_id,group_id,ts,record_json) VALUES (?,?,?,?)')
  ins.run(String(userId), String(groupId || 'global'), Number(record.ts || Date.now()), JSON.stringify(record))
  return true
}

export async function getRelationship (userId, groupId) {
  const row = requireDB().prepare('SELECT data_json FROM relationship WHERE user_id=? AND group_id=?').get(String(userId), String(groupId || 'global'))
  return row?.data_json ? JSON.parse(row.data_json) : null
}

export async function setRelationship (userId, groupId, data) {
  const key = `relationship:${groupId}:${userId}`
  return withLock(key, async () => {
    await ensureSchemasLoaded()
    try { validateOrThrow('relationship', data) } catch {}
    requireDB().prepare('INSERT INTO relationship (user_id,group_id,data_json) VALUES (?,?,?) ON CONFLICT(user_id,group_id) DO UPDATE SET data_json=excluded.data_json')
      .run(String(userId), String(groupId || 'global'), JSON.stringify(data))
    return true
  })
}

export async function getGlobalState (key, defaultValue = null) {
  const row = requireDB().prepare('SELECT data_json FROM global_state WHERE state_key=?').get(String(key))
  if (!row?.data_json) return defaultValue
  try {
    return JSON.parse(row.data_json)
  } catch {
    return defaultValue
  }
}

export async function setGlobalState (key, data) {
  const normalized = key === 'relationship_data' ? normalizeRelationshipState(data) : data
  return withLock(`global:${key}`, async () => {
    requireDB().prepare('INSERT INTO global_state (state_key,data_json,updated_at) VALUES (?,?,strftime(\'%s\',\'now\')) ON CONFLICT(state_key) DO UPDATE SET data_json=excluded.data_json,updated_at=excluded.updated_at')
      .run(String(key), JSON.stringify(normalized))
    return true
  })
}

export async function getRelationshipData () {
  return normalizeRelationshipState(await getGlobalState('relationship_data', null))
}

export async function saveRelationshipData (data) {
  return await setGlobalState('relationship_data', normalizeRelationshipState(data))
}

export async function getQuest (userId, groupId) {
  const row = requireDB().prepare('SELECT data_json FROM quest WHERE user_id=? AND group_id=?').get(String(userId), String(groupId || 'global'))
  return row?.data_json ? JSON.parse(row.data_json) : { points: 0, completed: [], active: [] }
}

export async function setQuest (userId, groupId, data) {
  const key = `quest:${groupId}:${userId}`
  return withLock(key, async () => {
    await ensureSchemasLoaded()
    validateOrThrow('quest', data)
    requireDB().prepare('INSERT INTO quest (user_id,group_id,data_json) VALUES (?,?,?) ON CONFLICT(user_id,group_id) DO UPDATE SET data_json=excluded.data_json')
      .run(String(userId), String(groupId || 'global'), JSON.stringify(data))
    return true
  })
}

export async function getWorkHistory (userId, groupId) {
  const row = requireDB().prepare('SELECT data_json FROM work_history WHERE user_id=? AND group_id=?').get(String(userId), String(groupId || 'global'))
  if (!row?.data_json) return []
  try {
    return normalizeWorkHistory(JSON.parse(row.data_json))
  } catch {
    return []
  }
}

export async function saveWorkHistory (userId, groupId, data) {
  const key = `work_history:${groupId}:${userId}`
  return withLock(key, async () => {
    const normalized = normalizeWorkHistory(data)
    requireDB().prepare('INSERT INTO work_history (user_id,group_id,data_json,updated_at) VALUES (?,?,?,strftime(\'%s\',\'now\')) ON CONFLICT(user_id,group_id) DO UPDATE SET data_json=excluded.data_json,updated_at=excluded.updated_at')
      .run(String(userId), String(groupId || 'global'), JSON.stringify(normalized))
    return true
  })
}

function validateOrThrow (name, data) {
  const validate = validators.get(name)
  if (!validate) return true
  const ok = validate(data)
  if (!ok) {
    const err = new Error(`Schema validation failed for ${name}`)
    err.code = 'DATA_INTEGRITY_ERROR'
    err.details = validate.errors || []
    throw err
  }
  return true
}

export default {
  getUserHome,
  saveUserHome,
  getUserBattle,
  saveUserBattle,
  getUserPlace,
  saveUserPlace,
  getUserHouse,
  saveUserHouse,
  getUserXiaoqie,
  saveUserXiaoqie,
  loadUserInventory,
  saveUserInventory,
  getSignIn,
  setSignIn,
  getBoost,
  setBoost,
  consumeBoost,
  getWorkshop,
  saveWorkshop,
  getSynthesisHistory,
  saveSynthesisHistory,
  recordSynthesis,
  getRelationship,
  setRelationship,
  getGlobalState,
  setGlobalState,
  getRelationshipData,
  saveRelationshipData,
  getQuest,
  setQuest,
  getWorkHistory,
  isSQLiteBackendAvailable,
  getSQLiteBackendStatus,
  getSQLiteBackendWarning
}
