import plugin from '../../../lib/plugins/plugin.js'
import fs from 'fs'
import cfg from '../../../lib/config/config.js'
import { segment } from "oicq";
import sex from "oicq";
import moment from "moment"
const dirpath = "plugins/akasha-terminal-plugin/data/qylp"
const currentTime = moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
const cdTime = 60 //随机娶群友时间,默认为1分钟
export class idcard extends plugin {
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