import fs from 'node:fs'
import { Data, Version } from './components/index.js'
//import Ver from './components/Version.js'
import chalk from 'chalk'//用粉笔写；用白垩粉擦

const files = fs.readdirSync('./plugins/akasha-terminal-plugin/apps').filter(file => file.endsWith('.js'))//以js结束的文件被读取

let ret = []

if (Bot?.logger?.info) {
    Bot.logger.info(chalk.green('------^-^------'))
    Bot.logger.info(chalk.yellow(`虚空插件${Version.version}初始化~`))
    Bot.logger.info(chalk.green('---------------'))
} else {
    console.log(`虚空插件${Version.version}初始化~`)
}//这个改自碎月和喵喵


if (!await redis.get(`akasha:notice:deltime`)) {
    await redis.set(`akasha:notice:deltime`, "600")
}


files.forEach((file) => {//forEach() 方法用于调用数组的每个元素，并将元素传递给回调函数。
    ret.push(import(`./apps/${file}`))
})//把file放入

ret = await Promise.allSettled(ret)

let apps = {}
for (let i in files) {//有点看不懂
    let name = files[i].replace('.js', '')

    if (ret[i].status != 'fulfilled') {
        logger.error(`载入插件错误：${logger.red(name)}`)
        logger.error(ret[i].reason)
        continue
    }
    apps[name] = ret[i].value[Object.keys(ret[i].value)[0]]
}
export { apps }

