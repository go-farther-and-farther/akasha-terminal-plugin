//随便写的,大佬勿喷 初版@鸢:随机娶群友，指定娶群友
import plugin from '../../../lib/plugins/plugin.js'
import fs from 'fs'
import cfg from '../../../lib/config/config.js'
import { segment } from "oicq";
import moment from "moment"
import command from '../components/command.js'
import akasha_data from '../components/akasha_data.js'
const Userpath = "plugins/akasha-terminal-plugin/data/qylp"
const giftpath = `plugins/akasha-terminal-plugin/resources/qylp/giftthing.json`
const currentTime = moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
var filename = `qylp.json`
var placefilename = `place.json`
var place_template = {
    "place": "home",
    "placetime": 0
}
//如果文件夹不存在,创建文件夹
if (!fs.existsSync(Userpath)) {
    fs.mkdirSync(Userpath);
}
//如果文件不存在，创建文件
if (!fs.existsSync(Userpath + "/" + filename)) {
    fs.writeFileSync(Userpath + "/" + filename, JSON.stringify({
    }))
}
let cdTime = Number(await command.getConfig("wife_cfg", "sjcd")) * 60;//随机娶群友冷却
let cdTime2 = Number(await command.getConfig("wife_cfg", "qqcd")) * 60;//强娶冷却
let cdTime3 = Number(await command.getConfig("wife_cfg", "dgcd")) * 60;//打工冷却
let cdTime4 = Number(await command.getConfig("wife_cfg", "bbcd")) * 60;//抱抱冷却
let cdTime5 = Number(await command.getConfig("wife_cfg", "ggcd")) * 60;//逛街冷却
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
                reg: "^#?(娶群友|娶老婆|娶群友老婆|娶群主|找老公)$",//随机娶一位群友
                /** 执行方法 */
                fnc: 'wife'
            },
            {
                reg: '^#?(创建老婆|我也要娶群友|你们都是我老婆|加入群老婆|找老婆)$', //加载老婆存档
                fnc: 'creat'
            },
            {
                reg: '^#?(强娶|娶)(.*)$', //指定求婚或者强娶一位群友
                fnc: 'wife2'
            },
            {
                reg: '^#?抢老婆(.*)$', //抢老婆!
                fnc: 'ntr'
            },
            {
                reg: '^#?我愿意', //配合求婚需要at向你求婚的人
                fnc: 'yy'
            },
            {
                reg: '^#?我拒绝', //配合求婚需要at向你求婚的人
                fnc: 'jj'
            },
            {
                reg: '^#?(闹离婚|甩掉|分手)', //娶过老婆的需要分手才可以继续娶老婆,甩掉at的人可以把你从ta的老婆里移除掉
                fnc: 'breakup'
            },
            {
                reg: '^#?(家庭信息|我的(老婆|老公|对象))(.*)$', //看看自己老婆是谁
                fnc: 'read'
            },
            {
                reg: '^#?打工赚钱$', //获取金币
                fnc: 'getmoney'
            },
            {
                reg: '^#?逛街$', //获取金币
                fnc: 'gift'
            },
            {
                reg: '^#?进去看看$', //获取金币
                fnc: 'gift_continue'
            },
            {
                reg: '^#?去下一个地方$', //获取金币
                fnc: 'gift_over'
            },
            {
                reg: '^#?(拥抱|抱抱)(.*)$', //抱抱
                fnc: 'touch'
            },
            {
                reg: '^#?(群cp|cp列表)$', //抱抱
                fnc: 'cp'
            },
            {
                reg: '^#?清除老婆冷却$', //抱抱
                fnc: 'delcd'
            }
            ]
        })
    }
    //创建存档
    async creat(e) {
        var id = e.user_id
        this.creat_wife(e, id)
    }
    //指定强娶/娶
    async wife2(e) {
        if (await this.is_jinbi(e) == true) return
        console.log(e)
        var id = e.user_id
        var json = JSON.parse(fs.readFileSync(Userpath + "/" + filename, "utf8"));//读取文件
        if (!json.hasOwnProperty(id)) {//如果json中不存在该用户
            this.creat(e)
            e.reply(`你还没有老婆存档，我帮你创建好了！`)
        }
        if (!e.at && !e.atme) {
            e.reply(`请at你的情人哦`)
            return
        }
        if (e.atme || e.atall) {
            e.reply(`不可以这样！`)
            return
        }
        let she_he = await this.people(e, 'sex', e.at)//用is_she函数判断下这个人是男是女     
        let iswife_list = await this.is_wife(e.at)
        if (iswife_list.length > 0) {
            let msg = `已经人喜欢${she_he}了哦！让${she_he}先处理一下！\n喜欢${she_he}的人有：`
            for (let i of iswife_list) {
                msg = msg + `\n${i}`
            }
            msg = msg + `\n你可以使用'#抢老婆@...'哦！`
            e.reply(msg)
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
                `该命令有${cdTime2}秒cd`
            ]
            e.reply(tips);
            return
        }
        if (await this.is_killed(e, json, `wife2`) == true) return
        let sex = await Bot.pickFriend(e.user_id).sex
        let ex = ''
        if (sex == 'male') {
            ex = '小姐'
        }
        else if (sex == 'female') {
            ex = '先生'
        }
        if (!json[id].s == 0) {
            e.reply(`你似乎已经有老婆了,要不分手?`)
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
                let user_id2_nickname = null
                for (let msg of e.message) { //赋值给user_id2_nickname
                    if (msg.type === 'at') {
                        user_id2_nickname = msg.text//获取at的那个人的昵称
                        break;
                    }
                }
                user_id2_nickname = user_id2_nickname.replace('@', '')
                json[id].money -= 50
                json[id].love = Math.round(Math.random() * (40 - 10) + 10)
                e.reply([
                    segment.at(id), "\n",
                    segment.image(`https://q1.qlogo.cn/g?b=qq&s=0&nk=${id}`), "\n",
                    `恭喜你！`, "\n",
                    `在茫茫人海中，你成功强娶到了${user_id2_nickname}!`,
                    "\n", segment.image(`https://q1.qlogo.cn/g?b=qq&s=0&nk=${e.at}`), "\n",
                ])
                fs.writeFileSync(Userpath + "/" + filename, JSON.stringify(json, null, "\t"));//写入文件
                await redis.set(`potato:whois-my-wife2-cd:${e.user_id}`, currentTime, {
                    EX: cdTime2
                });
            }
            else if (gailv >= qqwife) {
                var sbcf = Math.round(Math.random() * (20 - 10) + 10)
                json[id].money -= sbcf
                fs.writeFileSync(Userpath + "/" + filename, JSON.stringify(json, null, "\t"));//写入文件
                e.reply(`很遗憾,你没能成功将${she_he}娶走,${she_he}报警,你被罚款${sbcf}`)
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
            `那么这位${ex}，你愿意嫁给ta吗？at并发送【我愿意】或者【我拒绝】，回应${she_he}哦！`,
        ])
        json[id].wait = e.at
        fs.writeFileSync(Userpath + "/" + filename, JSON.stringify(json, null, "\t"));//写入文件
        return true;
    }
    //抢老婆
    async ntr(e) {
        if (await this.is_jinbi(e) == true) return
        var json = JSON.parse(fs.readFileSync(Userpath + "/" + filename, "utf8"));//读取文件
        if (!json.hasOwnProperty(e.user_id)) {//如果json中不存在该用户
            this.creat(e)
            e.reply(`你还没有老婆存档，我帮你创建好了！`)
        }
        if (e.atme || e.atall) {
            e.reply(`6🙂`)
            return
        }
        if (!e.at) {
            e.reply(`你想抢谁的老婆呢?at出来!`)
            return
        }
        if (await this.is_killed(e, json, `ntr`) == true) return
        if (json[e.at].s == 0) {
            e.reply("虽然但是,对方没有老婆啊!(￣_,￣ ),要不你俩试试?")
            return
        }
        if (json[e.user_id].s != 0) {
            e.reply(`你已经有老婆了还抢别人的???`)
            return
        }
        var good = json[e.user_id].money / (1.5 * json[e.at].love + json[e.at].money)
        var gailv = Math.random() * 99
        if (json[e.at].love >= 5000) {
            e.reply(`他们之间已是休戚与共,伉俪情深,你是无法夺走他老婆的!`)
            await this.ntrF(e, e.user_id, e.at)
        }
        if (json[e.at].love < 5000 && json[e.at] >= 2500) {
            if (good > 1.6 || gailv >= 90)
                await this.ntrT(e, e.user_id, e.at)
            else
                await this.ntrF(e, e.user_id, e.at)
        }
        if (json[e.at].love < 2500 && json[e.at] >= 1000) {
            if (good > 1.3 || gailv >= 80)
                await this.ntrT(e, e.user_id, e.at)
            else
                await this.ntrF(e, e.user_id, e.at)
        }
        if (json[e.at].love < 1000 && json[e.at] >= 500) {
            if (good > 1 || gailv >= 70)
                await this.ntrT(e, e.user_id, e.at)
            else
                await this.ntrF(e, e.user_id, e.at)
        }
        if (json[e.at].love < 500) {
            if (gailv >= 50)
                await this.ntrT(e, e.user_id, e.at)
            else
                await this.ntrF(e, e.user_id, e.at)
        }
        return true;
    }
    //抢老婆失败时调用
    async ntrF(e, jia, yi) {
        var json = JSON.parse(fs.readFileSync(Userpath + "/" + filename, "utf8"));//读取文件
        var pcj = Math.round((json[yi].love / 10) + (json[jia].money / 3) + 100)//赔偿金
        var jbtime = (pcj - json[jia].money) * 10//禁闭时间
        e.reply([
            segment.at(jia), "\n",
            `对方报警,你需要赔偿${pcj}金币,;金币不足将会被关禁闭`, "\n",
        ])
        if (json[jia].money < pcj) {
            json[yi].money = json[jia].money
            json[jia].money = 0
            await redis.set(`potato:wife-jinbi-cd:${jia}`, currentTime, {
                EX: jbtime
            });
            e.reply(`恭喜你,你的金币不足,因此赔光了还被关禁闭${jbtime}秒`)
        }
        if (json[jia].money >= pcj) {
            json[yi].money += pcj
            json[jia].money -= pcj
            e.reply(`你成功清赔款${pcj}金币!`)
        }
        fs.writeFileSync(Userpath + "/" + filename, JSON.stringify(json, null, "\t"));//写入文件
    }
    //抢老婆成功时调用
    async ntrT(e, jia, yi) {
        var json = JSON.parse(fs.readFileSync(Userpath + "/" + filename, "utf8"));//读取文件
        if ((json[jia].money > (json[yi].love * 1.5)) && (json[jia].money > json[yi].money))
            e.reply([
                segment.at(yi), "\n",
                `很遗憾!由于你老婆对你的好感并不是很高,对方又太有钱了!你的老婆被人抢走了!!!`
            ])
        if (json[jia].money <= (json[yi].love * 1.5))
            e.reply([
                segment.at(yi), "\n",
                `很遗憾!由于你的疏忽,你的老婆被人抢走了!!!`
            ])
        json[jia].s = json[yi].s
        json[jia].love = 6
        json[yi].s = 0
        json[yi].love = 0
        fs.writeFileSync(Userpath + "/" + filename, JSON.stringify(json, null, "\t"));//写入文件
    }
    //愿意
    async yy(e) {
        var id = e.at
        var json = JSON.parse(fs.readFileSync(Userpath + "/" + filename, "utf8"));//读取文件
        if (!json.hasOwnProperty(e.user_id)) {//如果json中不存在该用户
            this.creat(e)
            e.reply(`你还没有老婆存档，我帮你创建好了！`)
        }
        if (await this.is_killed(e, json, `yy`) == true) return
        if (e.atme || e.atall) {
            e.reply(`6🙂`)
            return
        }
        if (!e.at) {
            e.reply(`请at你愿意嫁给的人哦(˵¯͒〰¯͒˵)`)
            return
        }
        if (json[id].wait == 0) {
            e.reply(`对方还未向任何人求婚呢,就不要捣乱了`)
            return
        }
        if (json[id].wait !== e.user_id) {
            e.reply(`你不是${json[id].wait},就不要捣乱了`)
            return
        }
        e.reply([
            segment.at(e.user_id), "\n",
            segment.at(id), "\n",
            '相亲相爱幸福永，同德同心幸福长。愿你俩情比海深！祝福你们新婚愉快，幸福美满，激情永在，白头偕老！',
        ])
        json[id].s = e.user_id
        json[id].wait = 0
        json[id].money += 20
        json[id].love = Math.round(Math.random() * (100 - 60) + 60)
        id = e.user_id
        json[id].s = e.at
        json[id].wait = 0
        json[id].money += 20
        json[id].love = Math.round(Math.random() * (100 - 60) + 60)
        fs.writeFileSync(Userpath + "/" + filename, JSON.stringify(json, null, "\t"));//写入文件
        e.reply(`既然你们是两情相愿,你们现在的老婆就是彼此啦,给你们发了红包哦`)
        return true;
    }
    //拒绝
    async jj(e) {
        var id = e.at
        var json = JSON.parse(fs.readFileSync(Userpath + "/" + filename, "utf8"));//读取文件
        if (!json.hasOwnProperty(e.user_id)) {//如果json中不存在该用户
            this.creat(e)
            e.reply(`你还没有老婆存档，我帮你创建好了！`)
        }
        if (await this.is_killed(e, json, `yy`) == true) return
        if (e.atme || e.atall) {
            e.reply(`6🙂`)
            return
        }
        if (!e.at) {
            e.reply(`请at你想拒绝的人哦(˵¯͒〰¯͒˵)`)
            return
        }
        if (json[id].wait == 0) {
            e.reply(`对方还未向任何人求婚呢,就不要捣乱了`)
            return
        }
        if (json[id].wait !== e.user_id) {
            e.reply(`你不是${json[id].wait},就不要捣乱了`)
            return
        }
        e.reply([
            segment.at(id), "\n",
            '天涯何处无芳草，何必单恋一枝花，下次再努力点吧！(˵¯͒〰¯͒˵)',
        ])
        json[id].wait = 0
        fs.writeFileSync(Userpath + "/" + filename, JSON.stringify(json, null, "\t"));//写入文件
        return true;
    }
    //随机娶
    async wife(e) {
        if (await this.is_jinbi(e) == true) return
        var id = e.user_id
        var json = JSON.parse(fs.readFileSync(Userpath + "/" + filename, "utf8"));//读取文件
        if (!json.hasOwnProperty(id)) {//如果json中不存在该用户
            this.creat(e)
            e.reply(`你还没有老婆存档，我帮你创建好了！`)
        }
        if (await this.is_killed(e, json, `wife`) == true) return
        if (!json[id].s == 0) {
            e.reply(`你似乎已经有爱人了,要不分手?`)
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
                `该命令有${cdTime}秒cd`
            ]
            e.reply(tips);
            return
        }
        let sex = 'female'
        let msg1 = ''
        if (await Bot.pickFriend(e.user_id).sex == 'female') {
            msg1 = '系统检测到您为女性，'
        }
        else {
            msg1 = '系统检测到您为女性，'
        }
        if (e.msg.includes('娶') || e.msg.includes('老婆')) {
            sex = 'female'
            msg1 = msg + '正在按照您的要求寻找老婆！'
        }
        else {
            sex = 'male'
            msg1 = msg + '正在按照您的要求寻找老公！'
        }
        e.reply(msg1)

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
                py = `他`
            }
            else if (wife.sex == 'female') {
                py = `她`
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
            fs.writeFileSync(Userpath + "/" + filename, JSON.stringify(json, null, "\t"));//写入文件
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
            fs.writeFileSync(Userpath + "/" + filename, JSON.stringify(json, null, "\t"));//写入文件
            await redis.set(`potato:whois-my-wife-cd:${e.user_id}`, currentTime, {
                EX: cdTime
            });
        }
        setTimeout(() => {
            e.reply(msg);
        }, 3000);
        return true;
    }
    //主动分手/甩掉对方
    async breakup(e) {
        var id = e.user_id
        var json = JSON.parse(fs.readFileSync(Userpath + "/" + filename, "utf8"));//读取文件
        if (!json.hasOwnProperty(id)) {//如果json中不存在该用户
            this.creat(e)
            e.reply(`你还没有老婆存档，我帮你创建好了！`)
        }
        if (await this.is_killed(e, json, `breakup`) == true) return
        if (e.msg == "分手" || e.msg == "闹离婚") {
            if (!json.hasOwnProperty(id)) {//如果json中不存在该用户
                e.reply(`你还没有老婆存档。我帮你创建吧`)
                this.creat(e)
                return
            }
            if (json[id].s == 0) {//如果json中不存在该用户或者老婆s为0
                e.reply(`醒醒,你根本没有老婆!!`)
                return
            }
            let she_he = await this.people(e, 'sex', json[id].s)//用is_she函数判断下这个人是男是女
            json[id].s = 0
            json[id].love = 0
            json[id].money - json[id].money / 5
            fs.writeFileSync(Userpath + "/" + filename, JSON.stringify(json, null, "\t"));//写入文件
            e.reply(`成功分手!,${she_he}对你的好感荡然无存!现在你可以去娶下一个老婆了(呸!渣男..￣へ￣)`)
            return
        }
        if (!e.at) {
            e.reply(`请顺带at你想要甩掉的人(怎么会有强娶这种设定?(っ °Д °;)っ)`)
            return
        }
        if (e.atme || e.atall) {
            e.reply(`6🙂`)
            return
        }
        id = e.at
        let she_he = await this.people(e, 'sex', e.at)//用is_she函数判断下这个人是男是女
        var cnm = e.user_id
        if (json[id].s === cnm) {
            json[id].s = 0
            json[id].love = 0
            fs.writeFileSync(Userpath + "/" + filename, JSON.stringify(json, null, "\t"));//写入文件
            e.reply(`成功把${she_he}甩掉!,并表示不要再来纠缠你了.${she_he}差点哭死...,`)
            return
        }
        e.reply(`你不是${she_he}老婆或${she_he}根本没老婆`)
        return true;
    }
    //家庭信息，可以@别人
    async read(e) {
        if (e.atme || e.atall) {
            e.reply(`不可以这样！`)
            return
        }
        var id = e.user_id
        if (e.at) id = e.at
        var json = JSON.parse(fs.readFileSync(Userpath + "/" + filename, "utf8"));//读取文件
        if (!json.hasOwnProperty(id)) {//如果json中不存在该用户
            this.creat(e)
            e.reply(`你还没有老婆存档，我帮你创建好了！`)
        }
        let iswife_list = []
        for (let j of Object.keys(json)) {
            if (json[j].s == id)
                iswife_list.push(j)
        }
        var msg = '喜欢你的人有：'
        if (!iswife_list.length == 0) {
            for (let i of iswife_list) {
                msg = msg + [
                    `\n${i}`, "\n",
                    `好感度为${json[i].love}`
                ]
            }
        }
        else {
            msg = '喜欢你的人一个也没有'
        }
        if (json[id].s == 0 && iswife_list.length == 0) {//如果json中不存在该用户或者老婆s为0
            e.reply([`醒醒,你还没有老婆,也没有人喜欢你!!\n你现在还剩下${json[id].money}金币`])
            return
        }
        if (json[id].s == 0 && !iswife_list.length == 0) {//自己没有老婆的，但是有人喜欢
            e.reply([
                `醒醒,你还没有老婆!!\n`,
                `你现在还剩下${json[id].money}金币\n${msg}`
            ])
            return
        }
        let she_he = await this.people(e, 'sex', json[id].s)//用is_she函数判断下这个人是男是女
        let name = await this.people(e, 'nickname', json[id].s)//用is_she函数获取昵称
        if (iswife_list.includes(json[id].s)) {//两情相悦的
            e.reply([segment.at(id), segment.at(json[id].s), "\n",
                `两心靠近是情缘,更是吸引;两情相悦是喜欢,更是眷恋。\n`,
            `你的群友老婆是${name},${she_he}也喜欢你\n`,
            segment.image(`https://q1.qlogo.cn/g?b=qq&s=0&nk=${json[id].s}`), "\n",
            `${she_he}对你的好感度为${json[id].love}\n`,
            `你对${she_he}的好感度为${json[json[id].s].love}\n`,
            `你现在还剩下${json[id].money}金币`])
        }
        else if (!json[id].s == 0) {//只有喜欢的人的
            e.reply([segment.at(id), "\n",
            `你的群友老婆是${name}\n`,
            segment.image(`https://q1.qlogo.cn/g?b=qq&s=0&nk=${json[id].s}`), "\n",
            `${she_he}对你的好感度为${json[id].love}\n`,
            `你现在还剩下${json[id].money}金币\n${msg}`])
        }
        return true;
    }
    //打工
    async getmoney(e) {
        if (await this.is_jinbi(e) == true) return
        var id = e.user_id
        var json = JSON.parse(fs.readFileSync(Userpath + "/" + filename, "utf8"));//读取文件
        if (!json.hasOwnProperty(id)) {//如果json中不存在该用户
            this.creat(e)
            e.reply(`你还没有老婆存档，我帮你创建好了！`)
        }
        if (await this.is_killed(e, json, `getmoney`) == true) return
        let lastTime2 = await redis.get(`potato:wife-getmoney-cd:${e.user_id}`);
        if (lastTime2) {
            const seconds = moment(currentTime).diff(moment(lastTime2), 'seconds')
            e.reply([
                segment.at(e.user_id), "\n",
                `等会儿哦！(*/ω＼*)`, "\n",
                `该命令有${cdTime3}秒cd`
            ]);
            return
        }
        await redis.set(`potato:wife-getmoney-cd:${e.user_id}`, currentTime, {
            EX: cdTime3
        });
        json[id].money += Math.round(Math.random() * 50 + 50)
        fs.writeFileSync(Userpath + "/" + filename, JSON.stringify(json, null, "\t"));//写入文件
        e.reply(`恭喜你!现在你有${json[id].money}金币了!`)
        return true;
    }
    //逛街(大概没bug了)
    async gift(e) {
        if (await this.is_jinbi(e) == true) return
        var id = e.user_id
        var json = JSON.parse(fs.readFileSync(Userpath + "/" + filename, "utf8"));//读取文件
        var placejson = await akasha_data.getLPUser(id, placejson, place_template, placefilename, false)//创建玩家初始数据
        var giftthing = JSON.parse(fs.readFileSync(giftpath, "utf8"));//读取文件
        if (!json.hasOwnProperty(id)) {//如果json中不存在该用户
            this.creat(e)
            e.reply(`你还没有老婆存档，我帮你创建好了！`)
        }
        if (await this.is_killed(e, json, 'gift') == true) { return }
        if (json[id].s == 0) {//如果json中不存在该用户或者老婆s为0
            e.reply(`醒醒,你还没有老婆!!`)
            return
        }
        let lastTime5 = await redis.get(`potato:wife-gift-cd:${e.user_id}`);
        let masterList = cfg.masterQQ
        if (lastTime5 && !masterList.includes(e.user_id)) {
            const seconds = moment(currentTime).diff(moment(lastTime5), 'seconds')
            e.reply([
                segment.at(e.user_id), "\n",
                `等会儿哦！(*/ω＼*)`, "\n",
                `该命令有${cdTime5}秒cd`
            ]);
            return
        }
        await redis.set(`potato:wife-gift-cd:${e.user_id}`, currentTime, {
            EX: cdTime5
        });
        var placeid = Math.round(Math.random() * (Object.keys(giftthing.placename).length - 1) + 1)//随机获取一个位置id
        var placemsg = giftthing.start[placeid]//获取消息
        e.reply([
            `${placemsg}\n`,
            `你选择[进去看看]还是[去下一个地方]?`
        ])
        placejson[id].place = giftthing.placename[placeid]
        await akasha_data.getLPUser(id, placejson, place_template, placefilename, true)//保存位置
        fs.writeFileSync(Userpath + "/" + filename, JSON.stringify(json, null, "\t"));//写入文件
        return true;
    }
    //逛街事件继续(全是bug)
    async gift_continue(e) {
        e.reply("功能测试中")
        if (await this.is_jinbi(e) == true) return
        var id = e.user_id
        var placejson = await akasha_data.getLPUser(id, placejson, place_template, placefilename, false)//读取玩家数据
        if (placejson[id].place == "home") return//在家直接终止
        var giftthing = JSON.parse(fs.readFileSync(giftpath, "utf8"));//读取位置资源文件
        if (await this.is_killed(e, json, 'gift') == true) { return }
        var userplacename = placejson[id].place//获取玩家位置名A
        var placemodle = giftthing[userplacename]//获取位置资源中的位置A的数据B
        var placemsgid = Math.round(Math.random() * (Object.keys(placemodle) - 1) + 1)//随机从B中选择一个位置id
        var placemsg = giftthing[userplacename[placemsgid]].msg//获取消息
        e.reply(`${placemsg}`)
        placejson[id].place = "home"
        placejson[id].placetime = 0
        await akasha_data.getLPUser(id, placejson, place_template, placefilename, true)//保存位置
        if (await this.is_fw(e, json) == true) return
    }
    //逛街事件停止(大概没bug)
    async gift_over(e) {
        e.reply("功能测试中")
        if (await this.is_jinbi(e) == true) return
        if (await this.is_MAXEX(e) == true) return
        var id = e.user_id
        var placejson = await akasha_data.getLPUser(id, placejson, place_template, placefilename, false)//读取玩家数据
        if (placejson[id].place == "home") return//在家直接终止
        var giftthing = JSON.parse(fs.readFileSync(giftpath, "utf8"));//读取位置资源文件
        if (await this.is_killed(e, json, 'gift') == true) { return }
        var placeid = Math.round(Math.random() * (Object.keys(giftthing.placename).length - 1) + 1)//随机获取一个位置id
        var placemsg = giftthing.start[placeid]//获取消息
        e.reply([
            `${placemsg}\n`,
            `你选择[进去看看]还是[去下一个地方]?`
        ])
        placejson[id].place = giftthing.placename[placeid]
        placejson[id].placetime++
        await akasha_data.getLPUser(id, placejson, place_template, placefilename, true)//保存位置
        if (await this.is_fw(e, json) == true) return
    }
    //抱抱,有千分之一的概率被干掉
    async touch(e) {
        if (await this.is_jinbi(e) == true) return
        var id = e.user_id
        var json = JSON.parse(fs.readFileSync(Userpath + "/" + filename, "utf8"));//读取文件
        if (!json.hasOwnProperty(id)) {//如果json中不存在该用户
            this.creat(e)
            e.reply(`你还没有老婆存档，我帮你创建好了！`)
        }
        if (await this.is_killed(e, json, 'touch') == true) { return }
        if (e.atme || e.atall) {
            e.reply(`不可以这样！`)
            return
        }
        if (json[id].s == 0) {//如果json中不存在该用户或者老婆s为0
            e.reply(`醒醒,你还没有老婆!!`)
            return
        }
        if (!e.at && !e.atme) {
            e.reply([
                segment.at(json[id].s), "\n",
                `他摸了摸你`,
            ])
        }
        if (e.at && e.at != json[id].s) {
            e.reply(`醒醒,这不是你老婆!!!`)
            return
        }
        let lastTime4 = await redis.get(`potato:wife-touch-cd:${e.user_id}`);
        if (lastTime4) {
            const seconds = moment(currentTime).diff(moment(lastTime4), 'seconds')
            e.reply([
                segment.at(e.user_id), "\n",
                `等会儿哦！(*/ω＼*)`, "\n",
                `该命令有${cdTime4}秒cd`
            ]);
            return
        }
        await redis.set(`potato:wife-touch-cd:${e.user_id}`, currentTime, {
            EX: cdTime4
        });
        json[id].love += Math.round(Math.random() * 30 + 45)
        fs.writeFileSync(Userpath + "/" + filename, JSON.stringify(json, null, "\t"));//写入文件
        e.reply(`恭喜你,你老婆对你的好感上升到了${json[id].love}!`)
        return true;
    }
    //查看本群所有cp
    async cp(e) {
        var json = JSON.parse(fs.readFileSync(Userpath + "/" + filename, "utf8"));//读取文件
        let msg = `群全部cp:\n`
        let memberMap = await e.group.getMemberMap();
        let arrMember = Array.from(memberMap.values());
        let idlist = []
        let namelist = []
        for (let i = 0; i < arrMember.length; i++) {
            idlist[i] = arrMember[i].user_id
            namelist[arrMember[i].user_id] = arrMember[i].nickname
        }
        //我这里的做法是，把user_id和nickname格外取出来，因为arrMember里面是按照顺序排列的，不能使用arrMember[id]
        //e.reply('如果你看到这个，说明现在还在测试,测试者快要疯掉了')
        for (let i of Object.keys(json)) {
            if (idlist.includes(json[i].s))
                msg = msg + `${namelist[i]}   和他的老婆${namelist[json[i].s]}   \n`
        }
        e.reply(msg)
        return true;
    }
    //清除所有人的冷却
    async delcd(e) {
        if (e.isMaster) {
            let cddata = await redis.keys('potato:*', (err, data) => { });
            await redis.del(cddata);
            e.reply("清除成功")
            return true;
        }
    }
    //下面的都是函数,调用时需使用awiat等待以免异步执行---------------------------------------------------------//
    //创建存档
    async creat_wife(e, id) {
        var id = e.user_id
        var data = {
            "s": 0,
            "wait": 0,
            "money": 100,
            "love": 0
        }

        var json = JSON.parse(fs.readFileSync(Userpath + "/" + filename, "utf8"));//读取文件
        if (!json.hasOwnProperty(id)) {//如果json中不存在该用户
            json[id] = data
            fs.writeFileSync(Userpath + "/" + filename, JSON.stringify(json, null, "\t"));//写入文件
            e.reply(`创建成功,你现在的金币为100`)
            return
        }
        e.reply(`你已经有老婆存档了`)
    }
    //看看你是哪些人的老婆函数
    async is_wife(id) {
        var json = JSON.parse(fs.readFileSync(Userpath + "/" + filename, "utf8"));//读取文件
        //console.log(json)
        let wifelist = []//看看这个Id是哪些人的老婆
        for (let i of Object.keys(json)) {//读取json里面的对象名
            if (json[i].s == id)//如果有人的老婆是是这个id
                wifelist.push(i)
        }
        return wifelist
    }
    //群成员资料函数
    async people(e, keys, id) {
        let memberMap = await e.group.getMemberMap();
        let arrMember = Array.from(memberMap.values());
        var this_one = arrMember.filter(item => {
            return item.user_id == id
            //用过滤器返回了user_id==id的人
        })
        var lp = this_one[0]
        if (keys == 'sex') {
            let she_he = '他'
            if (lp.sex == 'female')
                she_he = '她'
            return she_he
        }
        if (keys == 'nickname') {
            let name = lp.nickname
            return name
        }

    }
    //看看你是不是在关禁闭
    async is_jinbi(e) {
        let jinbi = await redis.get(`potato:wife-jinbi-cd:${e.user_id}`);
        if (jinbi) {
            const seconds = moment(currentTime).diff(moment(jinbi), 'seconds')
            e.reply([
                segment.at(e.user_id), "\n",
                `你已经被关进禁闭室了!!!时间到了自然放你出来`
            ])
            return true
        }
        return false
    }
    //看看你会不会被干掉
    async is_killed(e, json, category) {
        let id = e.user_id
        let kill = Math.round(Math.random() * 999)
        if (kill == 6) {
            e.reply([`触发千分之一的概率事件!!!,\n`,
                `很遗憾的告诉你,发生了意外,你失去了你所有的金币...你,失去了你的老婆...真是离谱(划掉)遗憾啊,\n`, "\n",
                `你,是否愿意重来呢?`, "\n",
                `即使,金钱,好感...一切都要重新开始吗?`, "\n",
                `做出你的选择吧!`
            ])
            json[id].money = 0
            json[id].love = 0
            json[id].s = 0
            fs.writeFileSync(Userpath + "/" + filename, JSON.stringify(json, null, "\t"));//写入文件
            return true
        }
        if (kill < 100) {
            json[id].money -= 100
            fs.writeFileSync(Userpath + "/" + filename, JSON.stringify(json, null, "\t"));//写入文件
            e.reply(`触发十分之一的概率事件!!!`)
            setTimeout(() => {
                e.reply('但是现在是公测阶段，惩罚变成了损失金币100')
            }, 3000);//设置延迟
            return true
        }
        return false
    }
    //判断好感度是否双方都小于等于0,是则拆散,单向老婆则只失去老婆
    async is_fw(e, json) {
        let id = e.user_id
        /*let id2 = json[id].s
        if(json[id2].s == id && (json[id2].love <= 0||json[id].love <= 0)){
            e.reply(`很遗憾,由于你们有一方对对方的好感太低,你们的感情走到了尽头`)
            json[id].love = 0
            json[id].s = 0
            json[id2].love = 0
            json[id2].s = 0
            fs.writeFileSync(Userpath + "/" + filename, JSON.stringify(json, null, "\t"));//写入文件
            return true;
        }
        */
        if (json[id].love <= 0) {
            e.reply(`很遗憾,由于你老婆对你的好感太低,你老婆甩了你`)
            json[id].love = 0
            json[id].s = 0
            fs.writeFileSync(Userpath + "/" + filename, JSON.stringify(json, null, "\t"));//写入文件
            return true;
        }
        return false;
    }
    //判断逛街时侯的位置更换次数是否超出,超出则强制回家
    async is_MAXEX(e) {
        var id = e.user_id
        var placejson = await akasha_data.getLPUser(id, placejson, place_template, placefilename, false)//读取玩家数据
        if (placejson[e.user_id].placetime >= 5) {
            e.reply * (`单次逛街行动上限,你们回了家`)
            placejson[id].place = "home"
            placejson[id].placetime = 0
            await akasha_data.getLPUser(id, placejson, place_template, placefilename, true)//保存
            return true
        }
        else return false;
    }
}