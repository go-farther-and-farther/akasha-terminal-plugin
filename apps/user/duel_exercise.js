import { BotApi, AlemonApi, plugin } from '../../model/api/api.js'
import fs from "fs";
import cfg from '../../../../lib/config/config.js'
import moment from "moment"
const currentTime = moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
//项目路径
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

let cdtime_exercise = 30 * 60 //命令间隔时间，单位分钟，这是修炼的冷却时间#初始为30分钟
let cdtime_break = 30 * 60//命令间隔时间，单位分钟，这是突破的冷却时间#初始为30分钟

// 境界配置表：[等级, 名称, 突破所需经验]
const LEVEL_TABLE = [
    { level: 0,  name: '无内力',       exp: 0 },
    { level: 1,  name: '小乘境初期',   exp: 5 },
    { level: 2,  name: '小乘境中期',   exp: 10 },
    { level: 3,  name: '小乘境后期',   exp: 20 },
    { level: 4,  name: '小乘境巅峰',   exp: 30 },
    { level: 5,  name: '大乘境初期',   exp: 40 },
    { level: 6,  name: '大乘境中期',   exp: 55 },
    { level: 7,  name: '大乘境后期',   exp: 70 },
    { level: 8,  name: '大乘境巅峰',   exp: 85 },
    { level: 9,  name: '宗师境初期',   exp: 100 },
    { level: 10, name: '宗师境中期',   exp: 125 },
    { level: 11, name: '宗师境后期',   exp: 150 },
    { level: 12, name: '宗师境巅峰',   exp: 175 },
    { level: 13, name: '至臻境初期',   exp: 200 },
    { level: 14, name: '至臻境中期',   exp: 230 },
    { level: 15, name: '至臻境后期',   exp: 260 },
    { level: 16, name: '至臻境巅峰',   exp: 290 },
    { level: 17, name: '仙境初期',     exp: 320 },
    { level: 18, name: '仙境中期',     exp: 360 },
    { level: 19, name: '仙境后期',     exp: 400 },
    { level: 20, name: '仙境巅峰',     exp: 450 },
    { level: 21, name: '神境初期',     exp: 500 },
    { level: 22, name: '神境中期',     exp: 560 },
    { level: 23, name: '神境后期',     exp: 620 },
    { level: 24, name: '神境巅峰',     exp: 700 },
    { level: 25, name: '天仙境初期',   exp: 780 },
    { level: 26, name: '天仙境中期',   exp: 870 },
    { level: 27, name: '天仙境后期',   exp: 960 },
    { level: 28, name: '天仙境巅峰',   exp: 1060 },
    { level: 29, name: '道仙境初期',   exp: 1160 },
    { level: 30, name: '道仙境中期',   exp: 1280 },
    { level: 31, name: '道仙境后期',   exp: 1400 },
    { level: 32, name: '道仙境巅峰',   exp: 1550 },
    { level: 33, name: '混沌境初期',   exp: 1700 },
    { level: 34, name: '混沌境中期',   exp: 1880 },
    { level: 35, name: '混沌境后期',   exp: 2060 },
    { level: 36, name: '混沌境巅峰',   exp: 2260 },
]

const MAX_LEVEL = LEVEL_TABLE.length - 1  // 36
const PRESTIGE_BASE_EXP = 2260             // 返璞归真后每重所需经验基数
const PRESTIGE_EXP_STEP = 200              // 返璞归真每重递增经验

// 获取境界名称
function getLevelName(level) {
    if (level >= 0 && level <= MAX_LEVEL) {
        return LEVEL_TABLE[level].name
    }
    if (level > MAX_LEVEL) {
        let重数 = level - MAX_LEVEL
        return `返璞归真第${重数}重`
    }
    return '无内力'
}

// 获取突破到下一级所需经验
function getRequiredExp(level) {
    if (level >= 0 && level < MAX_LEVEL) {
        return LEVEL_TABLE[level + 1].exp
    }
    if (level >= MAX_LEVEL) {
        return PRESTIGE_BASE_EXP + (level - MAX_LEVEL) * PRESTIGE_EXP_STEP
    }
    return 0
}
export class duel_exercise extends plugin {//修炼
    constructor() {
        super({
            /** 功能名称 */
            name: '修炼',
            /** 功能描述 */
            dsc: '',
            event: 'message',
            /** 优先级，数字越小等级越高 */
            priority: 1000,
            rule: [
                {
                    /** 命令正则匹配 */
                    reg: "^#(发起|开始)?(晨练|早|锻炼|早睡|睡觉|修炼|服用丹药)(.*)$", //匹配消息正则，命令正则
                    /** 执行方法 */
                    fnc: 'exercise'
                },
                {
                    /** 命令正则匹配 */
                    reg: "^#闭关突破$", //匹配消息正则，命令正则
                    /** 执行方法 */
                    fnc: 'break'
                },
                {
                    /** 命令正则匹配 */
                    reg: "^#(决斗|武侠)境界列表$", //匹配消息正则，命令正则
                    /** 执行方法 */
                    fnc: 'list'
                }
            ]
        })
    }
    /**
     * 
     */
    async list(e) {
        let msg = '【决斗境界列表】\n'
        let currentTier = ''
        for (let i = 1; i <= MAX_LEVEL; i++) {
            const tier = LEVEL_TABLE[i].name.replace(/初期|中期|后期|巅峰/, '')
            if (tier !== currentTier) {
                currentTier = tier
                msg += `\n【${tier}】\n`
            }
            msg += `  Lv.${i} ${LEVEL_TABLE[i].name} (需${LEVEL_TABLE[i].exp}内力)\n`
        }
        msg += `\n【返璞归真】\n  Lv.${MAX_LEVEL}+ 返璞归真第X重 (每重+${PRESTIGE_EXP_STEP}内力)`
        e.reply(msg)
    }
    /**
     * 
     */
    async break(e) {
        console.log("用户命令：", e.msg);
        let user_id = e.user_id;
        if (!fs.existsSync(dirpath)) {
            fs.mkdirSync(dirpath);
        }
        if (!fs.existsSync(dirpath + "/" + filename)) {
            fs.writeFileSync(dirpath + "/" + filename, JSON.stringify({}));
        }
        const json = JSON.parse(fs.readFileSync(dirpath + "/" + filename));
        if (!json.hasOwnProperty(user_id)) {
            json[user_id] = Template
        }

        let lastTime_break = await redis.get(`duel:break-cd:${e.user_id}`);
        if (lastTime_break) {
            const seconds = moment(currentTime).diff(moment(lastTime_break), 'seconds')
            let tips = [
                segment.at(e.user_id), "\n",
                `你刚刚进行了一次突破!(*/ω＼*)`, "\n",
                `冷却中：${cdtime_break - seconds}s`
            ]
            e.reply(tips);
            return
        }

        let level = json[user_id].level
        let exp = json[user_id].experience

        // 检查经验是否足够突破到下一级
        let requiredExp = getRequiredExp(level)
        if (exp < requiredExp) {
            e.reply(`修为不足,还差${requiredExp - exp}内力,请再接再厉`)
            return
        }

        // 经验不足5级时降为0级
        if (exp < 5) {
            json[user_id].level = 0
            level = 0
        }

        await redis.set(`duel:break-cd:${e.user_id}`, currentTime, {
            EX: cdtime_break
        });

        // 同步当前境界名称
        json[user_id].levelname = getLevelName(level)

        if (json[user_id].experience < 1) {
            json[user_id].experience = 0
        }

        // 突破概率：等级越高越难
        let gailv
        if (level <= 16) {
            gailv = 100 - level * 3
        } else if (level <= MAX_LEVEL) {
            gailv = Math.max(5, 52 - level)
        } else {
            gailv = Math.max(2, 10 - (level - MAX_LEVEL))
        }

        let waitTime = Math.min(3 * (level + 1), 60) // 最长等60秒
        e.reply(`当前境界${json[user_id].levelname},需要时间${waitTime}s,突破成功概率${gailv}%,开始突破......`)

        let i = Math.random() * 100
        if (i > gailv) {
            setTimeout(() => {
                e.reply('突破失败，请努力修行')
            }, waitTime * 1000);
        } else {
            json[user_id].level++
            json[user_id].levelname = getLevelName(json[user_id].level)
            setTimeout(() => {
                e.reply(`突破成功，当前境界${json[user_id].levelname}`)
            }, waitTime * 1000);
        }
        fs.writeFileSync(dirpath + "/" + filename, JSON.stringify(json, null, "\t"));
        return true;
    }
    /**
     * 
     */
    async exercise(e) {
        console.log("用户命令：", e.msg);
        let user_id = e.user_id;
        let lastTime_exercise = await redis.get(`duel:exercise-cd:${e.user_id}`);
        //let masterList = cfg.masterQQ
        if (lastTime_exercise) {//&& !masterList.includes(e.user_id)
            const seconds = moment(currentTime).diff(moment(lastTime_exercise), 'seconds')
            let tips = [
                segment.at(e.user_id), "\n",
                `你刚刚进行了一次锻炼!(*/ω＼*)`, "\n",
                `冷却中：${cdtime_exercise - seconds}s`
            ]
            e.reply(tips);
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

        await redis.set(`duel:exercise-cd:${e.user_id}`, currentTime, {
            EX: cdtime_exercise
        });
        // 同步境界名称
        json[user_id].levelname = getLevelName(json[user_id].level)
        const date = new Date();
        let experience_ = 0
        let hours = date.getHours()
        //早上好
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
        }
        //睡觉，会被禁言
        else if (e.msg.includes('睡觉') || e.msg.includes('早睡')) {
            if (hours >= 20 && hours <= 22) {
                e.group.muteMember(user_id, 60 * 60 * 8); //禁言
                experience_ = Math.round(5 + 5 * Math.random())
                json[user_id].experience += experience_
                e.reply([segment.at(user_id),
                `\n🎉早睡早起好习惯，恭喜你获得了${experience_}点内力！\n你的内力为:${json[user_id].experience}\n你的境界为${json[user_id].levelname}`]);//发送消息
            }
            else if (hours >= 12 && hours <= 14) {
                e.group.muteMember(user_id, 60 * 60 * 1); //禁言
                experience_ = Math.round(3 + 3 * Math.random())
                json[user_id].experience += experience_
                e.reply([segment.at(user_id),
                `\n🎉恭喜你获得了${experience_}点内力，睡个午觉吧！\n你的内力为:${json[user_id].experience}\n你的境界为${json[user_id].levelname}`]);//发送消息
            } else if (hours > 23 || hours <= 5) {
                e.group.muteMember(user_id, 60 * 60 * 6); //禁言
                experience_ = Math.round(3 + 3 * Math.random())
                json[user_id].experience += experience_
                e.reply([segment.at(user_id),
                `\n现在睡觉一点也不早了，你只获得了${experience_}点内力，快去睡觉吧！\n你的内力为:${json[user_id].experience}\n你的境界为${json[user_id].levelname}`]);//发送消息
            }
            return
        }
        //服用丹药
        else if (e.msg.includes('丹药')) {
            if (e.isMaster) {
                json[user_id].experience += 100
                e.reply([segment.at(user_id),
                `\n服用丹药成功，你获得了100点内力！\n你的内力为:${json[user_id].experience}\n你的境界为${json[user_id].levelname}`]);
            }
            else {
                json[user_id].experience -= 1
                e.reply([segment.at(user_id),
                `\n没有得到祝福，你服用丹药失败，走火入魔损失了1点内力！\n你的内力为:${json[user_id].experience}\n你的境界为${json[user_id].levelname}`]);
            }
        }
        //正常情
        else if (hours >= 6 && hours <= 8) {
            experience_ = Math.round(2 + 2 * Math.random())
            json[user_id].experience += experience_
            e.reply([segment.at(user_id),
            `\n🎉恭喜你获得了${experience_}点内力,一日之计在于晨，清晨修炼效果更好哦！\n你的内力为:${json[user_id].experience}\n你的境界为${json[user_id].levelname}`]);//发送消息
        } else if (hours >= 8 && hours <= 20) {
            experience_ = Math.round(1 + 2 * Math.random())
            json[user_id].experience += experience_
            e.reply([segment.at(user_id),
            `\n🎉恭喜你获得了${experience_}点内力！\n你的内力为:${json[user_id].experience}\n你的境界为${json[user_id].levelname}`]);//发送消息
        } else {
            experience_ = Math.round(1 + 1 * Math.random())
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

export { getLevelName, getRequiredExp, MAX_LEVEL, LEVEL_TABLE }
