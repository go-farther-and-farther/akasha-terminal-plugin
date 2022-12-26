import plugin from '../../../lib/plugins/plugin.js'
import cfg from '../../../lib/config/config.js'
import { segment } from "oicq";
import fs from 'fs'
import moment from "moment"
const dirpath = "plugins/akasha-terminal-plugin/data/tset"
var filename = `idcard.json`
const currentTime = moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
const cdTime = 60 //默认为1分钟
if (!fs.existsSync(dirpath)) {//如果文件夹不存在
    fs.mkdirSync(dirpath);//创建文件夹
}
//如果文件不存在，创建文件
if (!fs.existsSync(dirpath + "/" + filename)) {
    fs.writeFileSync(dirpath + "/" + filename, JSON.stringify({
    }))
}
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
                fnc: 'idcard'
            }
            ]
        })
    }
    async idcard(e) {//随机娶
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

        var the_idcard = arrMember.filter(item => {
            return item.user_id == e.at
        })
        let the_id = the_idcard[0]
        //提前出来需要查询的人
        let msg = `我帮你查到了哦！(*/ω＼*)\n"群号": ${the_id.group_id}\n"QQ号": ${the_id.user_id}\n"昵称": ${the_id.nickname}\n"群名片": ${the_id.card}\n"性别": ${the_id.sex}\n"age": ${the_id.age}\n"地区": ${the_id.area}\n"加入时间": ${the_id.join_time}\n"最后发言时间": ${the_id.last_sent_time}\n"level": ${the_id.level}\n"rank": ${the_id.rank}\n"role": ${the_id.role}\n"title": ${the_id.title}\n"title_expire_time": ${the_id.title_expire_time}\n"shutup_time": ${the_id.shutup_time}\n"update_time": ${the_id.update_time}`
        //fs.writeFileSync(dirpath + "/" + filename, JSON.stringify(arrMember, null, "\t"));//写入文件
        await redis.set(`lql:idcard-cd:${e.user_id}`, currentTime, {
            EX: cdTime
        });
        e.reply(msg);

        return true;
    }
}