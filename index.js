import fs from 'node:fs'
import { BotApi } from './model/api/api.js';
import { Data, Version } from './components/index.js'
//import Ver from './components/Version.js'
import chalk from 'chalk'//用粉笔写；用白垩粉擦

if (!global.segment) {
  global.segment = (await import("oicq")).segment
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
    Bot.logger.warn(chalk.blue(`(🍀Akasha-Terminal-Plugin🍀):若出现README.md中未提及的问题,请联系我们!!!`))
    Bot.logger.info(chalk.green('(🍀Akasha-Terminal-Plugin🍀):"初始化完成,祝您游玩愉快!🌴'))
    Bot.logger.info('🌴🌴🌴🌴🌴🌴🌴🌴')
} else {
    console.log(`正在载入"🌱虚空插件"~`)
}


if (!await redis.get(`akasha:notice:deltime`)) {
    await redis.set(`akasha:notice:deltime`, "600")
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

