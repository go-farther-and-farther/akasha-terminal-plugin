import fs from 'node:fs'
import { BotApi } from './model/api/api.js';
import { Data, Version } from './components/index.js'
//import Ver from './components/Version.js'
import chalk from 'chalk'//用粉笔写；用白垩粉擦
import { initializeFileLockSystem, getFileLockSystemStatus } from './components/FileLockInitializer.js'
import { get as getCache, set as setCache } from './components/cache.js'
import { getSQLiteStatus, getSQLiteWarning } from './components/sqlite_manager.js'

if (!global.segment) {
  try {
    global.segment = (await import("oicq")).segment
  } catch {
    try {
      global.segment = (await import("icqq")).segment
    } catch {
      global.segment = {
        at: qq => `[CQ:at,qq=${qq}]`,
        image: url => `[CQ:image,file=${url}]`
      }
    }
  }
}

const files = fs.readdirSync('./plugins/akasha-terminal-plugin/apps').filter(file => file.endsWith('.js'))//以js结束的文件被读取
const apps = await BotApi.Index.toindex({ indexName: 'apps' });
let ret = []

if (Bot?.logger?.info) {
    Bot.logger.info('🌱🌱🌱🌱🌱🌱🌱🌱')
    Bot.logger.info(chalk.green(`(🍀Akasha-Terminal-Plugin🍀):"虚空插件"初始化.....`))
    Bot.logger.info(chalk.yellow(`┎┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┒`))
    Bot.logger.info(chalk.yellow(`┃`)+chalk.green(`      ⋏    ┅┅┅┅┳┅┅┅┅  ┎┅┅┅┅┅┅┒ `)+chalk.yellow(`┃`))
    Bot.logger.info(chalk.yellow(`┃`)+chalk.green(`     / \\       ┋      ┃      ┃ `)+chalk.yellow(`┃`))
    Bot.logger.info(chalk.yellow(`┃`)+chalk.green(`    /───\\      ┋      ┠┅┅┅┅┅┅┚ `)+chalk.yellow(`┃`))
    Bot.logger.info(chalk.yellow(`┃`)+chalk.green(`   /     \\     ┋      ┃        `)+chalk.yellow(`┃`))
    Bot.logger.info(chalk.yellow(`┃`)+chalk.green(`  /       \\    ┋      ┃        `)+chalk.yellow(`┃`))
    Bot.logger.info(chalk.yellow(`┖┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┚`))

    // 初始化文件锁系统
    Bot.logger.info(chalk.cyan(`(🍀Akasha-Terminal-Plugin🍀): 正在初始化文件锁系统...`))
    try {
        const fileLockInitialized = await initializeFileLockSystem()
        if (fileLockInitialized) {
            Bot.logger.info(chalk.green(`(🍀Akasha-Terminal-Plugin🍀): 文件锁系统初始化成功 🔒`))
            const status = getFileLockSystemStatus()
            Bot.logger.info(chalk.cyan(`(🍀Akasha-Terminal-Plugin🍀): 文件锁系统运行时间: ${status.uptime}ms`))
        } else {
            Bot.logger.warn(chalk.yellow(`(🍀Akasha-Terminal-Plugin🍀): 文件锁系统初始化失败，将使用传统文件操作`))
        }
    } catch (error) {
        Bot.logger.error(chalk.red(`(🍀Akasha-Terminal-Plugin🍀): 文件锁系统初始化异常:`), error)
        Bot.logger.warn(chalk.yellow(`(🍀Akasha-Terminal-Plugin🍀): 将使用传统文件操作模式`))
    }

    // 初始化SQLite
    try {
        const sqliteStatus = getSQLiteStatus()
        if (!sqliteStatus.available) {
            const sqliteWarning = getSQLiteWarning()
            Bot.logger.warn(chalk.yellow(`(🍀Akasha-Terminal-Plugin🍀): ${sqliteWarning}`))
        } else {
            Bot.logger.info(chalk.green(`(🍀Akasha-Terminal-Plugin🍀): SQLite 后端可用`))
        }
    } catch (error) {
        Bot.logger.warn(chalk.yellow(`(🍀Akasha-Terminal-Plugin🍀): SQLite 状态检查失败，将以兼容模式运行`))
    }

    Bot.logger.warn(chalk.blue(`(🍀Akasha-Terminal-Plugin🍀):若出现README.md中未提及的问题,请联系我们!!!`))
    Bot.logger.info(chalk.green('(🍀Akasha-Terminal-Plugin🍀):"初始化完成,祝您游玩愉快!🌴'))
    Bot.logger.info('🌴🌴🌴🌴🌴🌴🌴🌴')
} else {
    console.log(`正在载入"🌱虚空插件"~`)
    try {
        const fileLockInitialized = await initializeFileLockSystem()
        if (fileLockInitialized) {
            console.log('文件锁系统初始化成功 🔒')
        } else {
            console.warn('文件锁系统初始化失败，将使用传统文件操作')
        }
    } catch (error) {
        console.error('文件锁系统初始化异常:', error)
        console.warn('将使用传统文件操作模式')
    }
    try {
        const sqliteStatus = getSQLiteStatus()
        if (!sqliteStatus.available) {
            console.warn(getSQLiteWarning())
        } else {
            console.log('SQLite 后端可用')
        }
    } catch (error) {
        console.warn('SQLite 状态检查失败，将以兼容模式运行')
    }
}


if (!await getCache(`akasha:notice:deltime`)) {
    await setCache(`akasha:notice:deltime`, "600")
}


// files.forEach((file) => {//forEach() 方法用于调用数组的每个元素，并将元素传递给回调函数。
//     ret.push(import(`./apps/${file}`))
// })//把file放入

// ret = await Promise.allSettled(ret)

// let apps = {}
// //遍历apps目录文件
// for (let i in files) {
//     let name = files[i].replace('.js', '')
//     if (ret[i].status != 'fulfilled') {
//         logger.error(`虚空插件载入apps应用出现错误：${logger.red(name)}`)
//         logger.error(ret[i].reason)
//         continue//报错就跳过本次循环,防止报错的插件被写入
//     }
//     apps[name] = ret[i].value[Object.keys(ret[i].value)[0]]
// }
export { apps }

