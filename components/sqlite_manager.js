import fs from 'fs'
import { createRequire } from 'module'
import { sqliteFilePath, dataDir } from './common-lib/paths.js'

const require = createRequire(import.meta.url)

let db = null
let DatabaseCtor = null
let sqliteInitError = null
let sqliteWarningLogged = false

function ensureDir (dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function classifySQLiteError (error) {
  const message = String(error?.message || error || '').toLowerCase()
  if (!message) return 'unknown'
  if (message.includes('better-sqlite3') || message.includes('.node') || message.includes('module did not self-register') || message.includes('was compiled against a different node.js version') || message.includes('node_module_version') || message.includes('invalid elf header') || message.includes('dlopen') || message.includes('module version mismatch')) {
    return 'native-module'
  }
  if (message.includes('gyp') || message.includes('node-gyp') || message.includes('msbuild') || message.includes('c++') || message.includes('build from source') || message.includes('cl.exe') || message.includes('make failed')) {
    return 'build-toolchain'
  }
  if (message.includes('permission denied') || message.includes('eacces') || message.includes('eperm')) {
    return 'permission'
  }
  if (message.includes('no such file or directory') || message.includes('cannot find module')) {
    return 'missing-dependency'
  }
  if (message.includes('sqlite') || message.includes('database')) {
    return 'database-runtime'
  }
  return 'unknown'
}

function buildSQLiteRecoveryHints (category) {
  const hints = [
    '执行 pnpm i 安装依赖',
    '执行 pnpm approve-builds 允许原生模块构建',
    '必要时执行 npm run install-sqlite 重新构建 better-sqlite3'
  ]

  if (category === 'native-module') {
    hints.push(`确认当前 Node.js ${process.version} 与 better-sqlite3 ABI 兼容`)
  } else if (category === 'build-toolchain') {
    hints.push('若在 Windows 缺少原生编译环境，请先安装可用的 C++ 构建工具后再重试')
  }

  return hints
}

function getSQLiteStatusSnapshot () {
  const error = sqliteInitError
  const category = classifySQLiteError(error)
  const available = !!db
  const degraded = !available
  return {
    available,
    degraded,
    initialized: !!db,
    hasDriver: !!DatabaseCtor,
    error,
    errorCategory: error ? category : null,
    reason: error?.message || null,
    nodeVersion: process.version,
    recoveryHints: error ? buildSQLiteRecoveryHints(category) : []
  }
}

function getSQLiteWarningMessage () {
  const status = getSQLiteStatusSnapshot()
  if (status.available) return ''
  const reason = status.reason || 'unknown error'
  const hintText = status.recoveryHints.length ? `；恢复建议：${status.recoveryHints.join('；')}` : ''
  return `[Akasha SQLite] SQLite 后端不可用，当前以降级模式运行。原因: ${reason}${hintText}`
}

function logSQLiteUnavailable (error) {
  if (sqliteWarningLogged) return
  sqliteWarningLogged = true
  console.warn(getSQLiteWarningMessage())
}

function loadDatabaseCtor () {
  if (DatabaseCtor) return DatabaseCtor
  try {
    const mod = require('better-sqlite3')
    DatabaseCtor = mod?.default || mod
    sqliteInitError = null
    return DatabaseCtor
  } catch (error) {
    sqliteInitError = error
    logSQLiteUnavailable(error)
    return null
  }
}

export function initSQLite () {
  if (db) return db
  const SQLiteDatabase = loadDatabaseCtor()
  if (!SQLiteDatabase) return null

  try {
    ensureDir(dataDir)
    const file = sqliteFilePath()
    db = new SQLiteDatabase(file)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
    createTables()
    ensureSchema()
    sqliteInitError = null
    return db
  } catch (error) {
    db = null
    sqliteInitError = error
    logSQLiteUnavailable(error)
    return null
  }
}

export function getDB () {
  if (!db) return initSQLite()
  return db
}

export function isSQLiteAvailable () {
  if (db) return true
  if (sqliteInitError) return false
  return loadDatabaseCtor() !== null
}

export function getSQLiteInitError () {
  return sqliteInitError
}

export function getSQLiteStatus () {
  return getSQLiteStatusSnapshot()
}

export function isSQLiteDegradedMode () {
  return !getSQLiteStatusSnapshot().available
}

export function getSQLiteWarning () {
  return getSQLiteWarningMessage()
}

function createTables () {
  const d = db
  if (!d) return
  d.exec(`
    CREATE TABLE IF NOT EXISTS users (
      user_id TEXT NOT NULL,
      group_id TEXT NOT NULL,
      s TEXT DEFAULT '',
      wait INTEGER DEFAULT 0,
      money INTEGER DEFAULT 0,
      love INTEGER DEFAULT 0,
      level INTEGER DEFAULT 0,
      PRIMARY KEY (user_id, group_id)
    );

    CREATE TABLE IF NOT EXISTS battle (
      user_id TEXT NOT NULL,
      group_id TEXT NOT NULL,
      experience INTEGER DEFAULT 0,
      level INTEGER DEFAULT 0,
      levelname TEXT DEFAULT '无等级',
      privilege INTEGER DEFAULT 0,
      attack INTEGER DEFAULT 0,
      defense INTEGER DEFAULT 0,
      speed INTEGER DEFAULT 0,
      PRIMARY KEY (user_id, group_id)
    );

    CREATE TABLE IF NOT EXISTS place_state (
      user_id TEXT NOT NULL,
      group_id TEXT NOT NULL,
      place TEXT DEFAULT 'home',
      placetime INTEGER DEFAULT 0,
      PRIMARY KEY (user_id, group_id)
    );

    CREATE TABLE IF NOT EXISTS house_state (
      user_id TEXT NOT NULL,
      group_id TEXT NOT NULL,
      name TEXT DEFAULT '小破屋',
      space INTEGER DEFAULT 6,
      price INTEGER DEFAULT 500,
      loveup REAL DEFAULT 1,
      PRIMARY KEY (user_id, group_id)
    );

    CREATE TABLE IF NOT EXISTS xiaoqie_state (
      user_id TEXT NOT NULL,
      group_id TEXT NOT NULL,
      data_json TEXT NOT NULL,
      PRIMARY KEY (user_id, group_id)
    );

    CREATE TABLE IF NOT EXISTS inventory (
      user_id TEXT NOT NULL,
      group_id TEXT NOT NULL,
      item_id TEXT NOT NULL,
      item_json TEXT NOT NULL,
      ts INTEGER DEFAULT (strftime('%s','now')),
      PRIMARY KEY (user_id, group_id, item_id)
    );

    CREATE TABLE IF NOT EXISTS signin (
      user_id TEXT NOT NULL,
      group_id TEXT NOT NULL,
      streak INTEGER DEFAULT 0,
      last_signed TEXT,
      PRIMARY KEY (user_id, group_id)
    );

    CREATE TABLE IF NOT EXISTS boosts (
      user_id TEXT NOT NULL,
      group_id TEXT NOT NULL,
      type TEXT NOT NULL,
      value INTEGER DEFAULT 0,
      PRIMARY KEY (user_id, group_id, type)
    );

    CREATE TABLE IF NOT EXISTS workshop (
      user_id TEXT NOT NULL,
      group_id TEXT NOT NULL,
      level INTEGER DEFAULT 1,
      slots INTEGER DEFAULT 1,
      data_json TEXT,
      PRIMARY KEY (user_id, group_id)
    );

    CREATE TABLE IF NOT EXISTS synthesis_history (
      user_id TEXT NOT NULL,
      group_id TEXT NOT NULL,
      ts INTEGER NOT NULL,
      record_json TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_synth_history ON synthesis_history(user_id, group_id, ts);

    CREATE TABLE IF NOT EXISTS relationship (
      user_id TEXT NOT NULL,
      group_id TEXT NOT NULL,
      data_json TEXT,
      PRIMARY KEY (user_id, group_id)
    );

    CREATE TABLE IF NOT EXISTS global_state (
      state_key TEXT PRIMARY KEY,
      data_json TEXT NOT NULL,
      updated_at INTEGER DEFAULT (strftime('%s','now'))
    );

    CREATE TABLE IF NOT EXISTS quest (
      user_id TEXT NOT NULL,
      group_id TEXT NOT NULL,
      data_json TEXT,
      PRIMARY KEY (user_id, group_id)
    );

    CREATE TABLE IF NOT EXISTS work_history (
      user_id TEXT NOT NULL,
      group_id TEXT NOT NULL,
      data_json TEXT NOT NULL,
      updated_at INTEGER DEFAULT (strftime('%s','now')),
      PRIMARY KEY (user_id, group_id)
    );
  `)
}

function ensureColumn (table, column, definition) {
  const d = db
  if (!d) return
  const columns = d.prepare(`PRAGMA table_info(${table})`).all()
  if (!columns.some(col => col.name === column)) {
    d.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`)
  }
}

function ensureSchema () {
  ensureColumn('users', 's', "TEXT DEFAULT ''")
  ensureColumn('users', 'wait', 'INTEGER DEFAULT 0')
  ensureColumn('battle', 'experience', 'INTEGER DEFAULT 0')
  ensureColumn('battle', 'levelname', "TEXT DEFAULT '无等级'")
  ensureColumn('battle', 'privilege', 'INTEGER DEFAULT 0')
}

export default { initSQLite, getDB, isSQLiteAvailable, getSQLiteInitError, getSQLiteStatus, isSQLiteDegradedMode, getSQLiteWarning }
