import plugin from '../../../lib/plugins/plugin.js'
import { segment } from "oicq";
import fs from "fs";
import schedule from "node-schedule";
import cfg from '../../../lib/config/config.js'
//项目路径
let exerciseCD = {};
//如果报错请删除Yunzai/data/目录中akasha文件夹
const dirpath = "plugins/akasha-terminal-plugin/data/";//文件夹路径
var filename = `battle.json`;//文件名
let Template = {//创建该用户
    "experience": 0,
    "level": 0,
    "Privilege": 0,
};
var experience_ = 10
//配置一些有意思的参数
let Cooling_time = 300 //命令间隔时间，单位分钟，这是锻炼的冷却时间#初始为300分钟
export class exercise extends plugin {//锻炼
    constructor() {
        super({
            /** 功能名称 */
            name: '锻炼',
            /** 功能描述 */
            dsc: '',
            /** https://oicqjs.github.io/oicq/#events */
            event: 'message',
            /** 优先级，数字越小等级越高 */
            priority: 1000,
            rule: [
                {
                    /** 命令正则匹配 */
                    reg: "^#(发起|开始)?(晨练|早|锻炼|早睡|睡觉|锻炼)(.*)$", //匹配消息正则，命令正则
                    /** 执行方法 */
                    fnc: 'exercise'
                }
            ]
        })
    }
    /**
     * 
     * @param e oicq传递的事件参数e
     */
    async exercise(e) {
        console.log("用户命令：", e.msg);
        let user_id = e.user_id;
        if (exerciseCD[user_id]) { //判定是否在冷却中
            e.reply(`你刚刚进行了一次锻炼，请耐心一点，等待${Cooling_time}分钟后再次锻炼吧！`);
            return;
        }
        if (!fs.existsSync(dirpath)) {//如果文件夹不存在
            fs.mkdirSync(dirpath);//创建文件夹
        }
        if (!fs.existsSync(dirpath + "/" + filename)) {//如果文件不存在
            fs.writeFileSync(dirpath + "/" + filename, JSON.stringify({//创建文件
            }));
        }
        const json = JSON.parse(fs.readFileSync(dirpath + "/" + filename));//读取文件
        if (!json.hasOwnProperty(user_id)) {//如果json中不存在该用户
            json[user_id] = Template
        }
        for (let i of cfg.masterQQ) { //给所有主人发福利******************************
            if (!json.hasOwnProperty(user_id)) {//如果json中不存在该用户
                json[i] = Template
            }
            json[i].experience++
        }
        exerciseCD[user_id] = true;
        exerciseCD[user_id] = setTimeout(() => {//冷却时间
            if (exerciseCD[user_id]) {
                delete exerciseCD[user_id];
            }
        }, Cooling_time * 1000 * 60);
        json[user_id].experience += experience_
        //json[user_id].level = floor(Sqrt(json[user_id].experience))
        e.reply([segment.at(user_id),
        `\n恭喜你获得了${experience_}点经验！\n你的经验为:${json[user_id].experience}\n你的等级为${json[user_id].level}`]);//发送消息
        fs.writeFileSync(dirpath + "/" + filename, JSON.stringify(json, null, "\t"));//写入文件
        return true;
    }
}
