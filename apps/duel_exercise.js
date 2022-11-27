import plugin from '../../../lib/plugins/plugin.js'
import { segment } from "oicq";
import fs from "fs";
import schedule from "node-schedule";
import cfg from '../../../lib/config/config.js'
//项目路径
let exerciseCD = {};
let exerciseCD_ = {};
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
//配置一些有意思的参数
let Cooling_time2 = 30 //命令间隔时间，单位分钟，这是修炼的冷却时间#初始为300分钟
let Cooling_time3 = 30 //命令间隔时间，单位分钟，这是突破的冷却时间#初始为30分钟
export class duel_exercise extends plugin {//修炼
    constructor() {
        super({
            /** 功能名称 */
            name: '修炼',
            /** 功能描述 */
            dsc: '',
            /** https://oicqjs.github.io/oicq/#events */
            event: 'message',
            /** 优先级，数字越小等级越高 */
            priority: 1000,
            rule: [
                {
                    /** 命令正则匹配 */
                    reg: "^#(发起|开始)?(晨练|早|锻炼|早睡|睡觉|修炼)(.*)$", //匹配消息正则，命令正则
                    /** 执行方法 */
                    fnc: 'exercise'
                },
                {
                    /** 命令正则匹配 */
                    reg: "^#闭关突破$", //匹配消息正则，命令正则
                    /** 执行方法 */
                    fnc: 'exercise_'
                }
            ]
        })
    }
    /**
     * 
     * @param e oicq传递的事件参数e
     */
    async exercise_(e) {
        console.log("用户命令：", e.msg); console.log("用户命令：", e.msg);
        let user_id = e.user_id;
        if (exerciseCD[user_id] && !(user_id == 2859167710)) { //判定是否在冷却中
            e.reply(`你刚刚进行了一次突破，请耐心一点，等待${Cooling_time3}分钟后再次突破吧！`);
            return;
        }
        if (json[user_id].experience < 5) json[user_id].level = 0
        else if (json[user_id].experience < 10 && json[user_id].level >= 1) {
            e.reply('修为不足,请再接再厉')
            return
        }
        else if (json[user_id].experience < 20 && json[user_id].level >= 2) {
            e.reply('修为不足,请再接再厉')
            return
        }
        else if (json[user_id].experience < 30 && json[user_id].level >= 3) {
            e.reply('修为不足,请再接再厉')
            return
        }
        else if (json[user_id].experience < 40 && json[user_id].level >= 4) {
            e.reply('修为不足,请再接再厉')
            return
        }

        else if (json[user_id].experience < 65 && json[user_id].level >= 5) {
            e.reply('修为不足,请再接再厉')
            return
        }
        else if (json[user_id].experience < 70 && json[user_id].level >= 6) {
            e.reply('修为不足,请再接再厉')
            return
        }
        else if (json[user_id].experience < 85 && json[user_id].level >= 7) {
            e.reply('修为不足,请再接再厉')
            return
        }
        else if (json[user_id].experience < 100 && json[user_id].level >= 8) {
            e.reply('修为不足,请再接再厉')
            return
        }

        else if (json[user_id].experience < 125 && json[user_id].level >= 9) {
            e.reply('修为不足,请再接再厉')
            return
        }
        else if (json[user_id].experience < 150 && json[user_id].level >= 10) {
            e.reply('修为不足,请再接再厉')
            return
        }
        else if (json[user_id].experience < 175 && json[user_id].level >= 11) {
            e.reply('修为不足,请再接再厉')
            return
        }
        else if (json[user_id].experience < 200 && json[user_id].level >= 12) {
            e.reply('修为不足,请再接再厉')
            return
        }

        else if (json[user_id].experience < 230 && json[user_id].level >= 13) {
            e.reply('修为不足,请再接再厉')
            return
        }
        else if (json[user_id].experience < 260 && json[user_id].level >= 14) {
            e.reply('修为不足,请再接再厉')
            return
        }
        else if (json[user_id].experience < 290 && json[user_id].level >= 15) {
            e.reply('修为不足,请再接再厉')
            return
        }
        else if (json[user_id].experience < 320 && json[user_id].level >= 16) {
            e.reply('修为不足,请再接再厉')
            return
        }
        else if (json[user_id].experience >= 320 && json[user_id].level < 16 + (json[user_id].experience - 320) / 80) {
            e.reply('修为不足,请再接再厉')
            return
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
        exerciseCD_[user_id] = true;
        exerciseCD_[user_id] = setTimeout(() => {//冷却时间
            if (exerciseCD_[user_id]) {
                delete exerciseCD_[user_id];
            }
        }, Cooling_time3 * 1000 * 60);
        if (json[user_id].experience < 1) {
            json[user_id].experience = 0
        }//当内力小于1时，自动归零


        let gailv = 100 - json[user_id].level * 5
        e.reply(`当前境界${json[user_id].level},突破成功概率${gailv},开始突破......`)
        let i = Math.random() * 100
        if (i < gailv) {
            setTimeout(() => {//延迟5秒
                e.reply('突破失败，请努力修行')
            }, 3000 * (json[user_id.level] + 1));//设置延时
        }
        else {
            json[user_id].level++
            if (json[user_id].level == 0) json[user_id].levelname = '无内力'
            else if (json[user_id].level == 1) json[user_id].levelname = '小乘境初期'
            else if (json[user_id].level == 2) json[user_id].levelname = '小乘境中期'
            else if (json[user_id].level == 3) json[user_id].levelname = '小乘境后期'
            else if (json[user_id].level == 4) json[user_id].levelname = '小乘境巅峰'
            else if (json[user_id].level == 5) json[user_id].levelname = '大乘境初期'
            else if (json[user_id].level == 6) json[user_id].levelname = '大乘境中期'
            else if (json[user_id].level == 7) json[user_id].levelname = '大乘境后期'
            else if (json[user_id].level == 8) json[user_id].levelname = '大乘境巅峰'
            else if (json[user_id].level == 9) json[user_id].levelname = '宗师境初期'
            else if (json[user_id].level == 10) json[user_id].levelname = '宗师境中期'
            else if (json[user_id].level == 11) json[user_id].levelname = '宗师境后期'
            else if (json[user_id].level == 12) json[user_id].levelname = '宗师境巅峰'
            else if (json[user_id].level == 13) json[user_id].levelname = '至臻境初期'
            else if (json[user_id].level == 14) json[user_id].levelname = '至臻境中期'
            else if (json[user_id].level == 15) json[user_id].levelname = '至臻境后期'
            else if (json[user_id].level == 16) json[user_id].levelname = '至臻境巅峰'
            else if (json[user_id].level > 16) json[user_id].levelname = '返璞归真'
            setTimeout(() => {//延迟5秒
                e.reply(`突破成功，当前境界${json[user_id].levelname}`)
            }, 3000 * (json[user_id.level] + 1));//设置延时        
        }
        fs.writeFileSync(dirpath + "/" + filename, JSON.stringify(json, null, "\t"));//写入文件
        return true;
    }
    /**
     * 
     * @param e oicq传递的事件参数e
     */
    async exercise(e) {
        console.log("用户命令：", e.msg);
        let user_id = e.user_id;
        if (exerciseCD[user_id] && !(user_id == 2859167710)) { //判定是否在冷却中
            e.reply(`你刚刚进行了一次修炼，请耐心一点，等待${Cooling_time2}分钟后再次修炼吧！`);
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
        // for (let i of cfg.masterQQ) { //给所有主人发福利******************************
        //     if (!json.hasOwnProperty(user_id)) {//如果json中不存在该用户
        //         json[i] = Template
        //     }
        //     json[i].experience++
        // }
        exerciseCD[user_id] = true;
        exerciseCD[user_id] = setTimeout(() => {//冷却时间
            if (exerciseCD[user_id]) {
                delete exerciseCD[user_id];
            }
        }, Cooling_time2 * 1000 * 60);
        const date = new Date();
        let experience_ = 0
        let hours = date.getHours()
        if (e.msg.includes('早') || e.msg.includes('晨练')) {
            if (hours >= 6 && hours <= 8) {
                experience_ = Math.round(3 + 2 * Math.random())
                json[user_id].experience += experience_
                e.reply([segment.at(user_id),
                `\n恭喜你获得了${experience_}点内力,一日之计在于晨，清晨修炼效果更好哦！\n你的内力为:${json[user_id].experience}\n你的境界为${json[user_id].levelname}`]);
            }
            else {
                experience_ = Math.round(1 + 1 * Math.random())
                json[user_id].experience += experience_
                e.reply([segment.at(user_id),
                `\n现在一点也不早了，你只或得了${experience_}点内力。\n你的内力为:${json[user_id].experience}\n你的境界为${json[user_id].levelname}`]);
            }
            return
        } else if (e.msg.includes('睡觉') || e.msg.includes('早睡')) {
            if (hours >= 20 && hours <= 22) {
                e.group.muteMember(user_id, 60 * 60 * 8); //禁言
                experience_ = Math.round(3 + 3 * Math.random())
                json[user_id].experience += experience_
                e.reply([segment.at(user_id),
                `\n🎉早睡早起好习惯，恭喜你获得了${experience_}点内力！\n你的内力为:${json[user_id].experience}\n你的境界为${json[user_id].levelname}`]);//发送消息
            }
            else if (hours >= 12 && hours <= 14) {
                e.group.muteMember(user_id, 60 * 60 * 1); //禁言
                experience_ = Math.round(1 + 2 * Math.random())
                json[user_id].experience += experience_
                e.reply([segment.at(user_id),
                `\n🎉感谢你获得了${experience_}点内力，睡个午觉吧！\n你的内力为:${json[user_id].experience}\n你的境界为${json[user_id].levelname}`]);//发送消息
            } else if (hours > 23 || hours <= 5) {
                e.group.muteMember(user_id, 60 * 60 * 8); //禁言
                experience_ = Math.round(1 + 2 * Math.random())
                json[user_id].experience += experience_
                e.reply([segment.at(user_id),
                `\n现在睡觉一点也不早了，你只获得了${experience_}点内力，快去睡觉吧！\n你的内力为:${json[user_id].experience}\n你的境界为${json[user_id].levelname}`]);//发送消息
            }
            return
        }
        if (hours >= 6 && hours <= 8) {
            experience_ = Math.round(3 + 2 * Math.random())
            json[user_id].experience += experience_
            e.reply([segment.at(user_id),
            `\n🎉恭喜你获得了${experience_}点内力,一日之计在于晨，清晨修炼效果更好哦！\n你的内力为:${json[user_id].experience}\n你的境界为${json[user_id].levelname}`]);//发送消息
        } else if (hours >= 8 && hours <= 20) {
            experience_ = Math.round(1 + 2 * Math.random())
            json[user_id].experience += experience_
            e.reply([segment.at(user_id),
            `\n🎉恭喜你获得了${experience_}点内力！\n你的内力为:${json[user_id].experience}\n你的境界为${json[user_id].levelname}`]);//发送消息
        } else {
            experience_ = 1
            json[user_id].experience += experience_
            e.reply([segment.at(user_id),
            `\n由于熬夜，你只获得了${experience_}点内力！\n你的内力为:${json[user_id].experience}\n你的境界为${json[user_id].levelname}`]);//发送消息
        }
        if (e.isMaster) {//如果是主人，额外送两倍
            e.reply('给主人发放了额外奖励哦！')
            json[user_id].experience += experience_ * 2
        }
        fs.writeFileSync(dirpath + "/" + filename, JSON.stringify(json, null, "\t"));//写入文件
        return true;
    }
}
