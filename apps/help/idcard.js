//随便写的,大佬勿喷 初版@鸢:随机娶群友，指定娶群友
//1.1.0优化版@尘埃未定:添加我愿意/我拒绝的对象判定，修复bug，66到69行为单次只能主持一场的限制
//1.1.1修复部分描述错误
//1.1.2增加强娶,增加成功与失败的概率
//1.2保存老婆,添加分手和查看老婆功能,仅对强娶与指定娶有效
//1.2.1修复误触,所有娶群友方式都会记录保存,添加甩掉功能
//1.2.2修复恶劣bug，增加存档创建指令，画饼金钱与好感
//1.2.3修复以下问题
/*
会随机到自己
甚至bot自己
容易搞男同百合
 能娶同一个老婆
刷新不及时
金币为负数

有事找大佬们,没事找我2113752439
有什么新的建议可以提出来
*/
import plugin from '../../../lib/plugins/plugin.js'
import fs from 'fs'
import cfg from '../../../lib/config/config.js'
import { segment } from "oicq";
import sex from "oicq";
import moment from "moment"
import command from '../components/command.js'
const dirpath = "plugins/akasha-terminal-plugin/data/qylp"
const currentTime = moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
const cdTime = 60 //随机娶群友时间,默认为1分钟
let qqwife = await command.getConfig("wife_cfg", "qqwife");//强娶概率
let sjwife = await command.getConfig("wife_cfg", "sjwife");//随机概率
export class qqy extends plugin {
    constructor() {
        super({
            name: '查水表',
            dsc: '查水表',
            /** https://oicqjs.github.io/oicq/#events */
            event: 'message',
            priority: 66,
            rule: [{
                /** 命令正则匹配 */
                reg: "^#?(查水表|查户口|查身份证)(.*)$",//随机娶一位群友
                /** 执行方法 */
                fnc: 'Wife'
            }
            ]
        })
    }
    async idcard(e) {//随机娶
        var id = e.user_id
        let lastTime = await redis.get(`lql:idcard-cd:${e.user_id}`);
        let masterList = cfg.masterQQ
        if (lastTime && !masterList.includes(e.user_id)) {
            const seconds = moment(currentTime).diff(moment(lastTime), 'seconds')
            let tips = [
                segment.at(e.user_id), "\n",
                `等会儿哦！(*/ω＼*)`, "\n",
                `冷却中：${cdTime - seconds}s`
            ]
            e.reply(tips);
            return
        }
        let memberMap = await e.group.getMemberMap();
        let arrMember = Array.from(memberMap.values());
        let msg = []
        msg = [
            segment.at(e.user_id), "\n",
            `帮你查到了${wife.nickname}哦！(*/ω＼*)`, "\n",
            arrMember[e.at],
        ]
        fs.writeFileSync(dirpath + "/" + filename, JSON.stringify(json, null, "\t"));//写入文件
        await redis.set(`lql:idcard-cd:${e.user_id}`, currentTime, {
            EX: cdTime
        });
        e.reply(msg);
        return true;
    }
}