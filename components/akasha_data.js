import fs from "fs";
const dirpath = "plugins/akasha-terminal-plugin/data"
const QQYpath = "plugins/akasha-terminal-plugin/data/qylp"
const QQYhomepath = "plugins/akasha-terminal-plugin/data/qylp/UserHome"
const QQYincapath = "plugins/akasha-terminal-plugin/data/qylp/UserYinPa"
const QQYplacepath = "plugins/akasha-terminal-plugin/data/qylp/UserPlace"
const QQYhousepath = "plugins/akasha-terminal-plugin/data/qylp/UserHouse"

// 文件锁：防止并发写入同一文件导致数据丢失
const _fileLocks = new Map()
async function _acquireLock(filePath) {
    while (_fileLocks.has(filePath)) {
        await _fileLocks.get(filePath)
    }
    let release
    _fileLocks.set(filePath, new Promise(r => release = r))
    return release
}
function _readJSON(filePath) {
    try {
        return JSON.parse(fs.readFileSync(filePath, "utf8"))
    } catch {
        return {}
    }
}
function _writeJSON(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, "\t"))
}

function isValidId(id) {
    return id && id !== '0' && id !== 0 && id !== 'undefined' && id !== 'null' &&
        !(typeof id === 'string' && id.length < 5)
}

//这两个函数都是用来读取和保存json数据的
async function getUser(id, json, Template, filename, is_save) {
    const filePath = dirpath + "/" + filename
    if (!is_save) {
        const release = await _acquireLock(filePath)
        try {
            if (!fs.existsSync(dirpath)) fs.mkdirSync(dirpath)
            if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, '{}')
            json = _readJSON(filePath)
            if (!json.hasOwnProperty(id)) {
                json[id] = Template
            }
            return json
        } finally { release() }
    } else {
        const release = await _acquireLock(filePath)
        try { _writeJSON(filePath, json) } finally { release() }
        return json
    }
}
async function getUser2(user_id, json, dirname, is_save) {
    const filePath = dirpath + `/${dirname}/${user_id}.json`
    if (is_save) {
        const release = await _acquireLock(filePath)
        try { _writeJSON(filePath, json) } finally { release() }
    } else {
        const release = await _acquireLock(filePath)
        try {
            if (!fs.existsSync(dirpath)) fs.mkdirSync(dirpath)
            const dir = dirpath + `/${dirname}/`
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
            if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, '{}')
            return _readJSON(filePath)
        } finally { release() }
    }
}
async function getQQYUserBattle(id, json, is_save) {
    if (!isValidId(id)) {
        console.warn(`[getQQYUserBattle] 无效的用户ID: ${id}`);
        return {};
    }
    const battlefilename = `battle.json`
    const filePath = dirpath + "/" + battlefilename
    if (!is_save) {
        const release = await _acquireLock(filePath)
        try {
            if (!fs.existsSync(dirpath)) fs.mkdirSync(dirpath)
            if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, '{}')
            json = _readJSON(filePath)
            if (!json.hasOwnProperty(id)) {
                json[id] = { experience: 0, level: 0, levelname: '无等级', Privilege: 0 }
                _writeJSON(filePath, json)
            }
            return json
        } finally { release() }
    } else {
        const release = await _acquireLock(filePath)
        try { _writeJSON(filePath, json) } finally { release() }
        return json
    }
}
async function getQQYUserPlace(id, json, filename, is_save) {
    if (!isValidId(id)) {
        console.warn(`[getQQYUserPlace] 无效的用户ID: ${id}`);
        return {};
    }
    const filePath = QQYplacepath + "/" + filename
    if (!is_save) {
        const release = await _acquireLock(filePath)
        try {
            if (!fs.existsSync(QQYpath)) fs.mkdirSync(QQYpath)
            if (!fs.existsSync(QQYplacepath)) fs.mkdirSync(QQYplacepath)
            if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, '{}')
            json = _readJSON(filePath)
            if (!json.hasOwnProperty(id)) {
                json[id] = { place: "home", placetime: 0 }
                _writeJSON(filePath, json)
            }
            return json
        } finally { release() }
    } else {
        const release = await _acquireLock(filePath)
        try { _writeJSON(filePath, json) } finally { release() }
        return json
    }
}
async function getQQYUserxiaoqie(id, json, filename, is_save){
    if (!isValidId(id)) {
        console.warn(`[getQQYUserxiaoqie] 无效的用户ID: ${id}`);
        return {};
    }
    const filePath = QQYincapath + "/" + filename
    if (!is_save) {
        const release = await _acquireLock(filePath)
        try {
            if (!fs.existsSync(QQYpath)) fs.mkdirSync(QQYpath)
            if (!fs.existsSync(QQYincapath)) fs.mkdirSync(QQYincapath)
            if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, '{}')
            json = _readJSON(filePath)
            if (!json.hasOwnProperty(id)) {
                json[id] = { fuck: [], fucktime: 0, kun: 0 }
                _writeJSON(filePath, json)
            }
            return json
        } finally { release() }
    } else {
        const release = await _acquireLock(filePath)
        try { _writeJSON(filePath, json) } finally { release() }
        return json
    }
}
async function getQQYUserHome(id, json, filename, is_save) {
    if (!isValidId(id)) {
        console.warn(`[getQQYUserHome] 无效的用户ID: ${id}`);
        return {};
    }
    const filePath = QQYhomepath + "/" + filename
    if (!is_save) {
        const release = await _acquireLock(filePath)
        try {
            if (!fs.existsSync(QQYpath)) fs.mkdirSync(QQYpath)
            if (!fs.existsSync(QQYhomepath)) fs.mkdirSync(QQYhomepath)
            if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, '{}')
            json = _readJSON(filePath)
            if (!json.hasOwnProperty(id)) {
                json[id] = { s: 0, wait: 0, money: 100, love: 0 }
            }
            _writeJSON(filePath, json)
            if (json[id] && json[id].money2) {
                json[id].money10 = parseInt(json[id].money2, 2)
                if (json[id].money > json[id].money10) { json[id].money = json[id].money10 }
                else { json[id].money10 = json[id].money }
            }
            if (json[id] && json[id].love2) {
                json[id].love10 = parseInt(json[id].love2, 2)
                if (json[id].love > json[id].love10) { json[id].love = json[id].love10 }
                else { json[id].love10 = json[id].love }
            }
            return json
        } finally { release() }
    } else {
        const release = await _acquireLock(filePath)
        try {
            if (!json || !json[id]) {
                json = json || {}
                json[id] = { s: 0, wait: 0, money: 100, love: 0 }
            }
            json[id].money2 = Number(json[id].money || 0).toString(2)
            json[id].love2 = Number(json[id].love || 0).toString(2)
            _writeJSON(filePath, json)
        } finally { release() }
        return json
    }
}
async function getQQYUserHouse(id, json, filename, is_save) {
    if (!isValidId(id)) {
        console.warn(`[getQQYUserHouse] 无效的用户ID: ${id}`);
        return {};
    }
    const filePath = QQYhousepath + "/" + filename
    if (!is_save) {
        const release = await _acquireLock(filePath)
        try {
            if (!fs.existsSync(QQYpath)) fs.mkdirSync(QQYpath)
            if (!fs.existsSync(QQYhousepath)) fs.mkdirSync(QQYhousepath)
            if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, '{}')
            json = _readJSON(filePath)
            if (!json.hasOwnProperty(id)) {
                json[id] = { name: "小破屋", space: 6, price: 500, loveup: 1 }
                _writeJSON(filePath, json)
            }
            return json
        } finally { release() }
    } else {
        const release = await _acquireLock(filePath)
        try { _writeJSON(filePath, json) } finally { release() }
        return json
    }
}
async function saveQQYUserBattle(id, json) {
    if (!isValidId(id)) return json;
    return await getQQYUserBattle(id, json, true)
}

async function saveQQYUserHome(id, json, filename) {
    if (!isValidId(id)) return json;
    return await getQQYUserHome(id, json, filename, true)
}

async function saveQQYUserPlace(id, json, filename) {
    if (!isValidId(id)) return json;
    return await getQQYUserPlace(id, json, filename, true)
}

async function saveQQYUserHouse(id, json, filename) {
    if (!isValidId(id)) return json;
    return await getQQYUserHouse(id, json, filename, true)
}

async function saveQQYUserxiaoqie(id, json, filename) {
    if (!isValidId(id)) return json;
    return await getQQYUserxiaoqie(id, json, filename, true)
}

export default {
    getUser, getQQYUserBattle, getQQYUserPlace, getQQYUserxiaoqie, getQQYUserHome, getQQYUserHouse, getUser2,
    saveQQYUserBattle, saveQQYUserHome, saveQQYUserPlace, saveQQYUserHouse, saveQQYUserxiaoqie
}