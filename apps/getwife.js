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
var filename = `qylp.json`
if (!fs.existsSync(dirpath)) {//如果文件夹不存在
    fs.mkdirSync(dirpath);//创建文件夹
}
//如果文件不存在，创建文件
if (!fs.existsSync(dirpath + "/" + filename)) {
    fs.writeFileSync(dirpath + "/" + filename, JSON.stringify({
    }))
}
const cdTime = 10 * 60 //随机娶群友时间,默认为10分钟
const cdTime2 = 10 * 30 //强娶冷却，默认5分钟
const cdTime3 = 10 * 120 //获取金币冷却，默认20分钟
const cdTime4 = 60 * 60 * 3 //获取金币冷却，默认180分钟
let qqwife = await command.getConfig("wife_cfg", "qqwife");//强娶概率
let sjwife = await command.getConfig("wife_cfg", "sjwife");//随机概率
export class qqy extends plugin {
    constructor() {
        super({
            name: '娶群友',
            dsc: '娶群友',
            /** https://oicqjs.github.io/oicq/#events */
            event: 'message',
            priority: 66,
            rule: [{
                /** 命令正则匹配 */
                reg: "^#?(娶群友|娶老婆|娶群友老婆)$",//随机娶一位群友
                /** 执行方法 */
                fnc: 'Wife'
            },
            {
                /** 命令正则匹配 */
                reg: '^#?(创建老婆|我也要娶群友|你们都是我老婆|加入群老婆|找老婆)$', //加载老婆存档
                /** 执行方法 */
                fnc: 'creat'
            },
            {
                /** 命令正则匹配 */
                reg: '^#?(强娶|娶)(.*)$', //指定求婚或者强娶一位群友
                /** 执行方法 */
                fnc: 'wife2'
            },
            {
                /** 命令正则匹配 */
                reg: '^#?我愿意', //配合求婚需要at向你求婚的人
                /** 执行方法 */
                fnc: 'yy'
            },
            {
                /** 命令正则匹配 */
                reg: '^#?我拒绝', //配合求婚需要at向你求婚的人
                /** 执行方法 */
                fnc: 'jj'
            },
            {
                /** 命令正则匹配 */
                reg: '^#?(闹离婚|甩掉|分手)', //娶过老婆的需要分手才可以继续娶老婆,甩掉at的人可以把你从他的老婆里移除掉
                /** 执行方法 */
                fnc: 'fs'
            },
            {
                /** 命令正则匹配 */
                reg: '^#?(家庭信息|我的(老婆|老公|对象))$', //看看自己老婆是谁
                /** 执行方法 */
                fnc: 'read'
            },
            {
                /** 命令正则匹配 */
                reg: '^#?打工赚钱$', //获取金币
                /** 执行方法 */
                fnc: 'getmoney'
            },
            {
                /** 命令正则匹配 */
                reg: '^#?逛超(商|市)$', //获取金币
                /** 执行方法 */
                fnc: 'gift'
            },
            {
                /** 命令正则匹配 */
                reg: '^#?(拥抱|抱抱)(.*)$', //抱抱
                /** 执行方法 */
                fnc: 'touch'
            }
            ]
        })
    }
    async creat(e) {//创建存档
        var data = {
            "s": 0,
            "wait": 0,
            "money": 100,
            "love": 0
        }
        var id = e.user_id
        var json = JSON.parse(fs.readFileSync(dirpath + "/" + filename, "utf8"));//读取文件
        if (!json.hasOwnProperty(id)) {//如果json中不存在该用户
            json[id] = data
            fs.writeFileSync(dirpath + "/" + filename, JSON.stringify(json, null, "\t"));//写入文件
            e.reply(`创建成功,你现在的金币为100`)
            return
        }
        e.reply(`你已经有老婆存档了`)
        return true;
    }
    async wife2(e) {//强行娶
        console.log(e)
        var id = e.user_id
        var json = JSON.parse(fs.readFileSync(dirpath + "/" + filename, "utf8"));//读取文件
        if (!json.hasOwnProperty(id)) {//如果json中不存在该用户
            e.reply("你还没有老婆存档。使用 #创建老婆|#找老婆 来加载吧")
            return
        }
        if (!e.at && !e.atme) {
            e.reply("请at你的情人哦")
            return
        }
        if (e.atme || e.atall) {
            e.reply("不可以这样！")
            return
        }
        if (this.is_wife(e.at)) {
            e.reply("可是人家已经有自己的情人了！")
            return
        }
        //-------------------------------------------------------------------
        let lastTime = await redis.get(`potato:whois-my-wife2-cd:${e.user_id}`);
        let masterList = cfg.masterQQ
        if (lastTime && !masterList.includes(e.user_id)) {
            const seconds = moment(currentTime).diff(moment(lastTime), 'seconds')
            let tips = [
                segment.at(e.user_id), "\n",
                `等会儿哦！(*/ω＼*)`, "\n",
                `冷却中：${cdTime2 - seconds}s`
            ]
            e.reply(tips);
            return
        }
        let sex = await Bot.pickFriend(e.user_id).sex
        let ex = ''
        if (sex == 'male') {
            ex = '小姐'
        }
        else if (sex == 'female') {
            ex = '先生'
        }
        if (!json[id].s == 0) {
            e.reply("你似乎已经有老婆了,要不分手?")
            return
        }
        if (e.msg.includes("强娶")) {
            if (json[id].money <= 50) {
                e.reply(`金币不足,你只剩下${json[id].money}金币了...还是去打工赚钱吧!`)
                return
            }
            var gailv = Math.round(Math.random() * 9);
            if (gailv < qqwife) {
                json[id].s = e.at
                json[id].money -= 50
                json[id].love = Math.round(Math.random() * (40 - 10) + 10)
                e.reply([
                    segment.at(id), "\n",
                    segment.image(`https://q1.qlogo.cn/g?b=qq&s=0&nk=${id}`), "\n",
                    `恭喜你！`, "\n",
                    `在茫茫人海中，你成功强娶到了${e.at}!`,
                    "\n", segment.image(`https://q1.qlogo.cn/g?b=qq&s=0&nk=${e.at}`), "\n",
                ])
                fs.writeFileSync(dirpath + "/" + filename, JSON.stringify(json, null, "\t"));//写入文件
                await redis.set(`potato:whois-my-wife2-cd:${e.user_id}`, currentTime, {
                    EX: cdTime2
                });
            }
            else if (gailv >= qqwife) {
                var sbcf = Math.round(Math.random() * (20 - 10) + 10)
                json[id].money -= sbcf
                fs.writeFileSync(dirpath + "/" + filename, JSON.stringify(json, null, "\t"));//写入文件
                e.reply(`很遗憾,你没能成功将对方娶走,对方报警,你被罚款${sbcf}`)
                await redis.set(`potato:whois-my-wife2-cd:${e.user_id}`, currentTime, {
                    EX: cdTime2
                });
            }
            return
        }
        e.reply([
            segment.at(e.at), "\n",
            segment.image(`https://q1.qlogo.cn/g?b=qq&s=0&nk=${e.at}`), "\n",
            segment.at(id), "\n",
            segment.image(`https://q1.qlogo.cn/g?b=qq&s=0&nk=${id}`), "\n",
            `向你求婚：‘亲爱的${ex}您好！`, "\n",
            `在茫茫人海中，能够与${ex}相遇相知相恋，我深感幸福，守护你是我今生的选择，我想有个自己的家，一个有你的家,嫁给我好吗？’`, "\n",
            segment.at(e.at), "\n",
            `那么这位${ex}，你愿意嫁给ta吗？at并发送【我愿意】或者【我拒绝】，回应对方哦！`,
        ])
        json[id].wait = e.at
        fs.writeFileSync(dirpath + "/" + filename, JSON.stringify(json, null, "\t"));//写入文件
        return true;
    }
    async yy(e) {//愿意
        if (e.atme || e.atall) {
            e.reply("6🙂")
            return
        }
        if (!e.at) {
            e.reply("请at你愿意嫁给的人哦(˵¯͒〰¯͒˵)")
            return
        }
        var id = e.at
        var json = JSON.parse(fs.readFileSync(dirpath + "/" + filename, "utf8"));//读取文件
        var fk = json[id].wait
        if (fk === e.user_id) {
            e.reply([
                segment.at(e.user_id), "\n",
                segment.at(id), "\n",
                '相亲相爱幸福永，同德同心幸福长。愿你俩情比海深！祝福你们新婚愉快，幸福美满，激情永在，白头偕老！',
            ])
            json[id].s = e.user_id
            json[id].wait = 0
            json[id].money += 20
            josn[e.user_id].money += 20
            json[id].love = Math.round(Math.random() * (100 - 60) + 60)
            fs.writeFileSync(dirpath + "/" + filename, JSON.stringify(json, null, "\t"));//写入文件
            return
        }
        e.reply(`你不是${json[id].wait},就不要捣乱了`)
        return true;
    }
    async jj(e) {//拒绝
        if (e.atme || e.atall) {
            e.reply("6🙂")
            return
        }
        if (!e.at) {
            e.reply("请at你想拒绝的人哦(˵¯͒〰¯͒˵)")
            return
        }
        var id = e.at
        var json = JSON.parse(fs.readFileSync(dirpath + "/" + filename, "utf8"));//读取文件
        var fk = json[id].wait
        if (fk === e.user_id) {
            e.reply([
                segment.at(id), "\n",
                '天涯何处无芳草，何必单恋一枝花，下次再努力点吧！(˵¯͒〰¯͒˵)',
            ])
            json[id].wait = 0
            fs.writeFileSync(dirpath + "/" + filename, JSON.stringify(json, null, "\t"));//写入文件
            return
        }
        e.reply(`你不是${json[id].wait},就不要捣乱了`)
        return true;
    }
    async Wife(e) {//随机娶
        var id = e.user_id
        var json = JSON.parse(fs.readFileSync(dirpath + "/" + filename, "utf8"));//读取文件
        if (!json.hasOwnProperty(id)) {//如果json中不存在该用户
            e.reply("你还没有老婆存档。使用 #创建老婆 来加载吧")
            return
        }
        if (!json[id].s == 0) {
            e.reply("你似乎已经有爱人了,要不分手?")
            return
        }
        if (json[id].money <= 30) {
            e.reply(`金币不足,你只剩下${json[id].money}金币了...还是去打工赚钱吧!`)
            return
        }
        let lastTime = await redis.get(`potato:whois-my-wife-cd:${e.user_id}`);
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
        let sex = 'female'
        if (await Bot.pickFriend(e.user_id).sex == 'female') {
            sex = 'male'
        }

        let memberMap = await e.group.getMemberMap();
        let arrMember = Array.from(memberMap.values());
        //读取memberMap中的值，赋值给一个数组arrMember
        //FILTER 函数基于布尔值 (True/False) 数组筛选数组

        //只读取sex属性为sex的
        var femaleList = arrMember.filter(item => {
            return item.sex == sex
        })
        //异性过少则读取无性别
        if (femaleList.length < 2) {
            const unknownList = arrMember.filter(item => {
                return item.sex == 'unknown'
            })
            unknownList.map(item => {
                femaleList.push(item)
            })
        }
        //写个过滤器删掉bot和发起人

        femaleList = femaleList.filter(item => { return item.user_id != e.user_id && item.user_id != e.at })
        var gailv = Math.round(Math.random() * 9);
        let wife = {}

        for (let i = 0; i < 2; i++) {
            const random = Math.round(Math.random() * (femaleList.length - 1))
            wife = femaleList[random];
            break;
        }
        console.log(wife);
        let msg = []
        if (gailv < sjwife) {
            let sexStr = ''
            if (wife.sex == 'male') {
                sexStr = '男'
            }
            else if (wife.sex == 'female') {
                sexStr = '女'
            }
            console.log(wife);
            let cp = sexStr
            let py = ''
            if (wife.sex == 'male') {
                py = '他'
            }
            else if (wife.sex == 'female') {
                py = '她'
            }
            msg = [
                segment.at(e.user_id), "\n",
                `${wife.nickname}答应了你哦！(*/ω＼*)`, "\n",
                `今天你的${cp}朋友是`, "\n", segment.image(`https://q1.qlogo.cn/g?b=qq&s=0&nk=${wife.user_id}`), "\n",
                `【${wife.nickname}】 (${wife.user_id}) `, "\n",
                `来自【${e.group_name}】`, "\n",
                `要好好对待${py}哦！`,
            ]
            json[id].s = wife.user_id
            json[id].money -= 30
            json[id].love = Math.round(Math.random() * (70 - 1) + 1)
            fs.writeFileSync(dirpath + "/" + filename, JSON.stringify(json, null, "\t"));//写入文件
            await redis.set(`potato:whois-my-wife-cd:${e.user_id}`, currentTime, {
                EX: cdTime
            });
        }
        else if (gailv >= sjwife) {
            var dsp = Math.round(Math.random() * (20 - 10) + 10)
            msg = [
                segment.at(e.user_id), "\n",
                `好遗憾，你谁也没娶到,${dsp}金币打水漂了!`
            ]
            json[id].money -= dsp
            fs.writeFileSync(dirpath + "/" + filename, JSON.stringify(json, null, "\t"));//写入文件
            await redis.set(`potato:whois-my-wife-cd:${e.user_id}`, currentTime, {
                EX: cdTime
            });
        }
        e.reply(msg);
        return true;
    }
    async fs(e) {//分手
        var id = e.user_id
        var json = JSON.parse(fs.readFileSync(dirpath + "/" + filename, "utf8"));//读取文件
        if (e.msg == "分手" || e.msg == "闹离婚") {
            if (!json.hasOwnProperty(id)) {//如果json中不存在该用户
                e.reply("你还没有老婆存档。使用 #创建老婆 来加载吧")
                return
            }
            if (json[id].s == 0) {//如果json中不存在该用户或者老婆s为0
                e.reply("醒醒,你根本没有老婆!!")
                return
            }
            json[id].s = 0
            json[id].love = 0
            fs.writeFileSync(dirpath + "/" + filename, JSON.stringify(json, null, "\t"));//写入文件
            e.reply("成功分手!,对方对你的好感荡然无存!现在你可以去娶下一个老婆了(呸!渣男..￣へ￣)")
            return
        }
        if (!e.at) {
            e.reply("请顺带at你想要甩掉的人(怎么会有强娶这种设定?(っ °Д °;)っ)")
            return
        }
        if (e.atme || e.atall) {
            e.reply("6🙂")
            return
        }
        id = e.at
        var cnm = e.user_id
        if (json[id].s === cnm) {
            json[id].s = 0
            json[id].love = 0
            fs.writeFileSync(dirpath + "/" + filename, JSON.stringify(json, null, "\t"));//写入文件
            e.reply(`成功把对方甩掉!,并表示不要再来纠缠你了.对方差点哭死...,`)
            return
        }
        e.reply("你不是对方老婆或对方根本没老婆")
        return true;
    }
    async read(e) {//看自己的老婆
        var id = e.user_id
        var json = JSON.parse(fs.readFileSync(dirpath + "/" + filename, "utf8"));//读取文件
        if (!json.hasOwnProperty(id)) {//如果json中不存在该用户
            e.reply("你还没有老婆存档。使用 #创建老婆 来加载吧")
            return
        }
        if (json[id].s == 0) {//如果json中不存在该用户或者老婆s为0
            e.reply("醒醒,你还没有老婆!!")
            return
        }
        var lp = json[id].s
        e.reply([
            segment.at(e.user_id), "\n",
            `你的群友老婆是${lp}`, "\n",
            segment.image(`https://q1.qlogo.cn/g?b=qq&s=0&nk=${lp}`), "\n",
            `对方对你的好感度为${json[id].love}`,
            `你现在还剩下${json[id].money}金币`,
        ])
        return true;
    }
    async getmoney(e) {//打工冷却20分钟，赚到40-80块钱
        var id = e.user_id
        var json = JSON.parse(fs.readFileSync(dirpath + "/" + filename, "utf8"));//读取文件
        if (!json.hasOwnProperty(id)) {//如果json中不存在该用户
            e.reply("你还没有老婆存档。使用 #创建老婆 来加载吧")
            return
        }
        let lastTime2 = await redis.get(`potato:wife-getmoney-cd:${e.user_id}`);
        if (lastTime2) {
            const seconds = moment(currentTime).diff(moment(lastTime2), 'seconds')
            e.reply([
                segment.at(e.user_id), "\n",
                `等会儿哦！(*/ω＼*)`, "\n",
                `冷却中：${cdTime3 - seconds}s`
            ]);
            return
        }
        await redis.set(`potato:wife-getmoney-cd:${e.user_id}`, currentTime, {
            EX: cdTime3
        });
        json[id].money += Math.round(Math.random() * 40 + 40)
        fs.writeFileSync(dirpath + "/" + filename, JSON.stringify(json, null, "\t"));//写入文件
        e.reply(`恭喜你!现在你有${json[id].money}金币了!`)
        return true;
    }
    async gift(e) {//花30-90买30-90好感度
        var id = e.user_id
        var json = JSON.parse(fs.readFileSync(dirpath + "/" + filename, "utf8"));//读取文件
        if (!json.hasOwnProperty(id)) {//如果json中不存在该用户
            e.reply("你还没有老婆存档。使用 #创建老婆 来加载吧")
            return
        }
        if (json[id].s == 0) {//如果json中不存在该用户或者老婆s为0
            e.reply("醒醒,你还没有老婆!!")
            return
        }
        let price = Math.round(Math.random() * 60 + 30)

        if (json[id].money <= price) {
            e.reply(`需要${price}金币,你只剩下${json[id].money}金币了...还是去打工赚钱吧!`)
            return
        }
        json[id].money -= price
        json[id].love += Math.round(Math.random() * 60 + 30)
        fs.writeFileSync(dirpath + "/" + filename, JSON.stringify(json, null, "\t"));//写入文件
        e.reply(`恭喜你,你老婆对你的好感上升到了${json[id].love}!,你的金币还剩下${json[id].money}`)
        return true;
    }
    async touch(e) {//直接获得45-75好感度
        var id = e.user_id
        var json = JSON.parse(fs.readFileSync(dirpath + "/" + filename, "utf8"));//读取文件
        if (!json.hasOwnProperty(id)) {//如果json中不存在该用户
            e.reply("你还没有老婆存档。使用 #创建老婆 来加载吧")
            return
        }
        if (e.atme || e.atall) {
            e.reply("不可以这样！")
            return
        }
        if (json[id].s == 0) {//如果json中不存在该用户或者老婆s为0
            e.reply("醒醒,你还没有老婆!!")
            return
        }
        if (!e.at && !e.atme) {
            e.reply("请at你的情人哦")
            return
        }
        if (e.at != json[id].s) {
            e.reply("醒醒,这不是你老婆!!!")
            return
        }
        let lastTime4 = await redis.get(`potato:wife-touch-cd:${e.user_id}`);
        if (lastTime4) {
            const seconds = moment(currentTime).diff(moment(lastTime4), 'seconds')
            e.reply([
                segment.at(e.user_id), "\n",
                `等会儿哦！(*/ω＼*)`, "\n",
                `冷却中：${cdTime4 - seconds}s`
            ]);
            return
        }
        await redis.set(`potato:wife-touch-cd:${e.user_id}`, currentTime, {
            EX: cdTime4
        });
        json[id].love += Math.round(Math.random() * 30 + 45)
        fs.writeFileSync(dirpath + "/" + filename, JSON.stringify(json, null, "\t"));//写入文件
        e.reply(`恭喜你,你老婆对你的好感上升到了${json[id].love}!}`)
        return true;
    }
    async is_wife(id) {
        var json = JSON.parse(fs.readFileSync(dirpath + "/" + filename, "utf8"));//读取文件
        console.log(json)
        for (let i of Object.keys(json)) {
            if (i == id)
                return true
        }
        return false
    }
}