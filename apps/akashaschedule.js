import plugin from '../../../lib/plugins/plugin.js'
import schedule from "node-schedule";
import fs from 'fs'
let redblueball_time = '0 0 12 * * ? *'
export class akashakaijiang extends plugin {
	constructor() {
		super({
			/** 功能名称 */
			name: '虚空抽奖',
			/** 功能描述 */
			dsc: '定时生成号码',
			/** https://oicqjs.github.io/oicq/#events */
			event: 'message',
			/** 优先级，数字越小等级越高 */
			priority: 1000,
			rule: [
				{
					/** 命令正则匹 配 */
					reg: "^#?双色球开奖$", //匹配消息正则，命令正则
					/** 执行方法 */
					fnc: 'redblueball'
				}
			]
		})
	}
	/**
	 * 
	 * @param e oicq传递的事件参数e
	 */
    async redblueball(e){
        if(!e.isMaster)
            return
        redblueball_start();
        e.reply(`手动开奖成功,请检查本插件resources/qylp/lottery.json`)
    }
}
//这个是获取一个6~7点的时间，到了时间则执行任务
schedule.scheduleJob(redblueball_time, function () {
	redblueball_start();
}
);

async function redblueball_start() {
    const lotterypath = `plugins/akasha-terminal-plugin/resources/qylp`
    let filename = `lottery.json`
    if (!fs.existsSync(lotterypath + "/" + filename)) {//如果文件不存在
        fs.writeFileSync(lotterypath + "/" + filename, JSON.stringify({//创建文件
        }));
    }
    var redballarr = []
    for(;;){
        let redballnum = Math.round(Math.random()*32 + 1)//生成1到33随机数
        if(redballarr.includes(redballnum))
            redballarr = []//含有重复数字则重新开始
        if(redballnum<10){
            redballnum = "0" + redballnum//小于10改为01,02形式
        }
        redballarr.push(redballnum)
        if(redballarr.length == 6){
            let buytime = `${new Date().getFullYear()}-${new Date().getMonth() + 1}-${new Date().getDate()}`
            var ssqjson = JSON.parse(fs.readFileSync(lotterypath + "/" + filename, "utf8"));//读取文件
            let blueballnum =  Math.round(Math.random()*15 + 1)
            if(blueballnum<10)
            blueballnum = "0" + blueballnum
            let ssqdata = {
                redball: redballarr,
                blueball: blueballnum,
                time: buytime
            }
            let title = "RBB"
            ssqjson[title] = ssqdata
            fs.writeFileSync(lotterypath + "/" + filename, JSON.stringify(ssqjson, null, "\t"));//写入文件
            break//有六个不同数字时结束
        }
    }
}
