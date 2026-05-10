import { BotApi, AlemonApi, plugin } from '../../model/api/api.js'
import fs from "fs";
import { getLevelName, getRequiredExp, MAX_LEVEL } from './duel_exercise.js'
//项目路径
//如果报错请删除Yunzai/data/目录中akasha文件夹
const dirpath = "plugins/akasha-terminal-plugin/data/";//文件夹路径
var filename = `battle`;//文件名
if (filename.indexOf(".json") == -1) {//如果文件名不包含.json
    filename = filename + ".json";//添加.json
}
let Template = {//创建该用户
    "experience": 0,
    "level": 0,
    "levelname": '无等级',
    "Privilege": 0,
};

export class duel_seelevel extends plugin {
    constructor() {
        super({
            /** 功能名称 */
            name: '我的等级',
            /** 功能描述 */
            dsc: '',
            event: 'message',
            /** 优先级，数字越小等级越高 */
            priority: 1000,
            rule: [
                {
                    reg: "^#我的(等级|经验)$",
                    fnc: 'seelevel'
                },
                {
                    reg: "^#我的(境界)$",
                    fnc: 'seelevel2'
                }
            ]
        })
    }

    async seelevel(e) {
        let user_id = e.user_id;
        if (!fs.existsSync(dirpath)) {
            fs.mkdirSync(dirpath);
        }
        if (!fs.existsSync(dirpath + "/" + filename)) {
            fs.writeFileSync(dirpath + "/" + filename, JSON.stringify({}));
        }
        var json = JSON.parse(fs.readFileSync(dirpath + "/" + filename, "utf8"));
        if (!json.hasOwnProperty(user_id)) {
            json[e.user_id] = { ...Template }
        }
        if (json[e.user_id].experience < 1) {
            json[e.user_id].experience = 0
        }
        // 同步境界名称
        json[e.user_id].levelname = getLevelName(json[e.user_id].level)
        e.reply(`你的等级是${json[e.user_id].level},你的经验是${json[e.user_id].experience},是否是开挂${json[e.user_id].Privilege}`)
        fs.writeFileSync(dirpath + "/" + filename, JSON.stringify(json, null, "\t"));
        return
    }

    async seelevel2(e) {
        let user_id = e.user_id;
        if (!fs.existsSync(dirpath)) {
            fs.mkdirSync(dirpath);
        }
        if (!fs.existsSync(dirpath + "/" + filename)) {
            fs.writeFileSync(dirpath + "/" + filename, JSON.stringify({}));
        }
        var json = JSON.parse(fs.readFileSync(dirpath + "/" + filename, "utf8"));
        if (!json.hasOwnProperty(user_id)) {
            json[e.user_id] = { ...Template }
        }
        if (json[e.user_id].experience < 1) {
            json[e.user_id].experience = 0
        }
        // 同步境界名称
        json[e.user_id].levelname = getLevelName(json[e.user_id].level)
        let nextExp = getRequiredExp(json[e.user_id].level)
        let need = nextExp - json[e.user_id].experience
        let tips = need > 0 ? `\n距离下一次突破还差${need}内力` : '\n修为已足，可以尝试突破！'
        e.reply(`你的境界是${json[e.user_id].levelname},你的内力是${json[e.user_id].experience},是否是开挂${json[e.user_id].Privilege}${tips}`)
        fs.writeFileSync(dirpath + "/" + filename, JSON.stringify(json, null, "\t"));
        return
    }
}