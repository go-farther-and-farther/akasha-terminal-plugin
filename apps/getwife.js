//随便写的,大佬勿喷 初版@鸢:随机娶群友，指定娶群友
import plugin from '../../../lib/plugins/plugin.js'
import fs from 'fs'
import { segment } from "oicq";
import moment from "moment"
import command from '../components/command.js'
import akasha_data from '../components/akasha_data.js'
const giftpath = `plugins/akasha-terminal-plugin/resources/qylp/giftthing.json`
const housepath = `plugins/akasha-terminal-plugin/resources/qylp/house.json`
const currentTime = moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
let cdTime = Number(await command.getConfig("wife_cfg", "sjcd")) * 60;//随机娶群友冷却
let cdTime2 = Number(await command.getConfig("wife_cfg", "qqcd")) * 60;//强娶冷却
let cdTime3 = Number(await command.getConfig("wife_cfg", "dgcd")) * 60;//打工冷却
let cdTime4 = Number(await command.getConfig("wife_cfg", "bbcd")) * 60;//抱抱冷却
let cdTime5 = Number(await command.getConfig("wife_cfg", "ggcd")) * 60;//逛街冷却
let cdTime6 = Number(await command.getConfig("wife_cfg", "qlpcd")) * 60;//抢老婆冷却
let cdTime7 = Number(await command.getConfig("wife_cfg", "poorcd")) * 60;//抢老婆冷却
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
                reg: "^#?(娶群友|娶老婆|娶群友老婆|娶群主|找老公)$",
                fnc: 'wife'
            },
            {
                reg: '^#?(创建老婆|找老婆)$',
                fnc: 'creat'
            },
            {
                reg: '^#?(强娶|娶)(.*)$',
                fnc: 'wife2'
            },
            {
                reg: '^#?抢老婆(.*)$',
                fnc: 'ntr'
            },
            {
                reg: '^#?我愿意',
                fnc: 'yy'
            },
            {
                reg: '^#?我拒绝',
                fnc: 'jj'
            },
            {
                reg: '^#?(闹离婚|甩掉|分手)',
                fnc: 'breakup'
            },
            {
                reg: '^#?(家庭信息|我的(老婆|老公|对象))(.*)$',
                fnc: 'read'
            },
            {
                reg: '^#?打工赚钱$',
                fnc: 'getmoney'
            },
            {
                reg: '^#?看房$',
                fnc: 'gethouse'
            },
            {
                reg: '^#?逛街$',
                fnc: 'gift'
            },
            {
                reg: '^#?进去看看$',
                fnc: 'gift_continue'
            },
            {
                reg: '^#?去下一个地方$',
                fnc: 'gift_over'
            },
            {
                reg: '^#?(拥抱|抱抱)(.*)$',
                fnc: 'touch'
            },
            {
                reg: '^#?(群cp|cp列表)$',
                fnc: 'cp'
            },
            {
                reg: '^#?领取低保$',
                fnc: 'poor'
            },
            {
                reg: '^#?上交存款',
                fnc: 'Transfer_money'
            },
            {
                reg: '^#?清除老婆冷却$',
                fnc: 'delcd'
            }
            ]
        })
    }
    //创建存档
    async creat(e) {

        var id = e.user_id
        await this.creat_(e, id)
        e.reply(`好`)
        return true;
    }
    //指定强娶/娶
    async wife2(e) {
        if (await this.is_jinbi(e) == true) return
        console.log(e)
        var id = e.user_id
        var filename = e.group_id + `.json`
        var homejson = await akasha_data.getQQYUserHome(id, homejson, filename, false)
        if (!e.at && !e.atme) {
            e.reply(`请at你的情人哦`)
            return
        }
        if (e.atme || e.atall) {
            e.reply(`不可以这样！`)
            return
        }
        if (homejson[e.user_id].money <= 0) {
            e.reply(`金币都没了,你不能娶老婆`)
            return
        }
        let she_he = await this.people(e, 'sex', e.at)//用is_she函数判断下这个人是男是女  
        let name = await this.people(e, 'nickname', e.at)//用is_she函数获取昵称
        let iswife_list = await this.is_wife(e, e.at)
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
        let lastTime = await redis.get(`potato:whois-my-wife2-cd:${e.group_id}:${e.user_id}`);
        if (lastTime) {
            let tips = [
                segment.at(e.user_id), "\n",
                `等会儿哦！(*/ω＼*)`, "\n",
                `该命令有${cdTime2}秒cd`
            ]
            e.reply(tips);
            return
        }
        if (await this.is_killed(e, homejson, `wife2`) == true) return
        let sex = await Bot.pickFriend(e.user_id).sex
        let ex = ''
        if (sex == 'male') {
            ex = '小姐'
        }
        else if (sex == 'female') {
            ex = '先生'
        }
        if (!homejson[id].s == 0) {
            e.reply(`你似乎已经有老婆了,要不分手?`)
            return
        }
        if (e.msg.includes("强娶")) {
            if (homejson[id].money <= 50) {
                e.reply(`金币不足,你只剩下${homejson[id].money}金币了...还是去打工赚钱吧!`)
                return
            }
            var gailv = Math.round(Math.random() * 9);
            if (gailv < qqwife) {
                homejson[id].s = e.at
                let user_id2_nickname = null
                for (let msg of e.message) { //赋值给user_id2_nickname
                    if (msg.type === 'at') {
                        user_id2_nickname = msg.text//获取at的那个人的昵称
                        break;
                    }
                }
                user_id2_nickname = user_id2_nickname.replace('@', '')
                homejson[id].money -= 50
                homejson[id].love = Math.round(Math.random() * (40 - 10) + 10)
                e.reply([
                    segment.at(id), "\n",
                    segment.image(`https://q1.qlogo.cn/g?b=qq&s=0&nk=${id}`), "\n",
                    `恭喜你！`, "\n",
                    `在茫茫人海中，你成功强娶到了${name}!`,
                    "\n", segment.image(`https://q1.qlogo.cn/g?b=qq&s=0&nk=${e.at}`), "\n",
                ])
                await redis.set(`potato:whois-my-wife2-cd:${e.group_id}:${e.user_id}`, currentTime, {
                    EX: cdTime2
                });
            }
            else if (gailv >= qqwife) {
                var sbcf = Math.round(Math.random() * (20 - 10) + 10)
                homejson[id].money -= sbcf
                e.reply(`很遗憾,你没能成功将${she_he}娶走,${she_he}报警,你被罚款${sbcf}`)
                await redis.set(`potato:whois-my-wife2-cd:${e.group_id}:${e.user_id}`, currentTime, {
                    EX: cdTime2
                });
            }
            await akasha_data.getQQYUserHome(id, homejson, filename, true)
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
        homejson[id].wait = e.at
        await akasha_data.getQQYUserHome(id, homejson, filename, true)
        return true;
    }
    //抢老婆
    async ntr(e) {
        var id = e.user_id
        var filename = e.group_id + `.json`
        var homejson = await akasha_data.getQQYUserHome(id, homejson, filename, false)
        if (e.atme || e.atall) {
            e.reply(`6🙂`)
            return
        }
        if (!e.at) {
            e.reply(`你想抢谁的老婆呢?at出来!`)
            return
        }
        if (await this.is_killed(e, homejson, `ntr`) == true) return
        if (homejson[e.at].s == 0) {
            e.reply("虽然但是,对方在这里没有老婆啊!(￣_,￣ ),要不你俩试试?")
            return
        }
        if (homejson[id].s != 0) {
            e.reply(`你已经有老婆了还抢别人的???`)
            return
        }
        if (homejson[id].money <= 0) {
            e.reply(`金币都没有你还有脸抢老婆?`)
            return
        }
        let lastTime = await redis.get(`potato:wife-ntr-cd:${e.group_id}:${e.user_id}`);
        if (lastTime) {
            let tips = [
                segment.at(e.user_id), "\n",
                `等会儿哦！(*/ω＼*)`, "\n",
                `该命令有${cdTime6}秒cd`
            ]
            e.reply(tips);
            return
        }
        var good = homejson[e.user_id].money / (1.5 * homejson[e.at].love + homejson[e.at].money) * 100
        var gailv = Math.round(Math.random() * 99)
        await e.reply(`你的金币数为：${homejson[id].money},\n对方的金币数为：${homejson[e.at].money},\n对方老婆对对方的好感度为：${homejson[e.at].love},你的成功率为：${good}%`)
        if (homejson[e.at].love >= 5000) {
            e.reply(`他们之间已是休戚与共,伉俪情深,你是无法夺走他老婆的!`)
            await this.ntrF(e, e.user_id, e.at)
        }
        else if (good > gailv)
            await this.ntrT(e, e.user_id, e.at)
        else
            await this.ntrF(e, e.user_id, e.at)
        await redis.set(`potato:wife-ntr-cd:${e.group_id}:${e.user_id}`, currentTime, {
            EX: cdTime6
        });
        return true;
    }
    //抢老婆失败时调用
    async ntrF(e, jia, yi) {
        var id = e.user_id
        var filename = e.group_id + `.json`
        var homejson = await akasha_data.getQQYUserHome(id, homejson, filename, false)
        var pcj = Math.round((homejson[yi].love / 10) + (homejson[jia].money / 3) + 100)//赔偿金
        var jbtime = (pcj - homejson[jia].money) * 10//禁闭时间
        e.reply([
            segment.at(jia), "\n",
            `对方报警,你需要赔偿${pcj}金币,;金币不足将会被关禁闭`, "\n",
        ])
        if (homejson[jia].money < pcj) {
            homejson[yi].money += homejson[jia].money
            homejson[jia].money = 0
            await redis.set(`potato:wife-jinbi-cd:${jia}`, currentTime, {
                EX: jbtime
            });
            e.reply(`恭喜你,你的金币不足,因此赔光了还被关禁闭${jbtime}秒`)
        }
        if (homejson[jia].money >= pcj) {
            homejson[yi].money += pcj
            homejson[jia].money -= pcj
            e.reply(`你成功清赔款${pcj}金币!`)
        }
        await akasha_data.getQQYUserHome(id, homejson, filename, true)
    }
    //抢老婆成功时调用
    async ntrT(e, jia, yi) {
        var id = e.user_id
        var filename = e.group_id + `.json`
        var homejson = await akasha_data.getQQYUserHome(id, homejson, filename, false)
        if ((homejson[jia].money > (homejson[yi].love * 1.5)) && (homejson[jia].money > homejson[yi].money))
            e.reply([
                segment.at(yi), "\n",
                `很遗憾!由于你老婆对你的好感并不是很高,对方又太有钱了!你的老婆被人抢走了!!!`
            ])
        else {
            e.reply([
                segment.at(yi), "\n",
                `很遗憾!由于你的疏忽,你的老婆被人抢走了!!!`
            ])
        }
        homejson[jia].s = homejson[yi].s
        homejson[jia].love = 6
        homejson[yi].s = 0
        homejson[yi].love = 0
        await akasha_data.getQQYUserHome(id, homejson, filename, true)
    }
    //愿意
    async yy(e) {
        var id = e.at
        var filename = e.group_id + `.json`
        var homejson = await akasha_data.getQQYUserHome(id, homejson, filename, false)
        if (await this.is_killed(e, homejson, `yy`) == true) return
        if (e.atme || e.atall) {
            e.reply(`6🙂`)
            return
        }
        if (!e.at) {
            e.reply(`请at你愿意嫁给的人哦(˵¯͒〰¯͒˵)`)
            return
        }
        if (homejson[id].wait == 0) {
            e.reply(`对方还未向任何人求婚呢,就不要捣乱了`)
            return
        }
        if (homejson[id].wait !== e.user_id) {
            e.reply(`你不是${homejson[id].wait},就不要捣乱了`)
            return
        }
        e.reply([
            segment.at(e.user_id), "\n",
            segment.at(id), "\n",
            '相亲相爱幸福永，同德同心幸福长。愿你俩情比海深！祝福你们新婚愉快，幸福美满，激情永在，白头偕老！',
        ])
        homejson[id].s = e.user_id
        homejson[id].wait = 0
        homejson[id].money += 20
        homejson[id].love = Math.round(Math.random() * (100 - 60) + 60)
        id = e.user_id
        homejson[id].s = e.at
        homejson[id].wait = 0
        homejson[id].money += 20
        homejson[id].love = Math.round(Math.random() * (100 - 60) + 60)
        await akasha_data.getQQYUserHome(id, homejson, filename, true)
        e.reply(`既然你们是两情相愿,你们现在的老婆就是彼此啦,给你们发了红包哦`)
        return true;
    }
    //拒绝
    async jj(e) {
        var id = e.at
        var filename = e.group_id + `.json`
        var homejson = await akasha_data.getQQYUserHome(id, homejson, filename, false)
        if (await this.is_killed(e, homejson, `yy`) == true) return
        if (e.atme || e.atall) {
            e.reply(`6🙂`)
            return
        }
        if (!e.at) {
            e.reply(`请at你想拒绝的人哦(˵¯͒〰¯͒˵)`)
            return
        }
        if (homejson[id].wait == 0) {
            e.reply(`对方还未向任何人求婚呢,就不要捣乱了`)
            return
        }
        if (homejson[id].wait !== e.user_id) {
            e.reply(`你不是${homejson[id].wait},就不要捣乱了`)
            return
        }
        e.reply([
            segment.at(id), "\n",
            '天涯何处无芳草，何必单恋一枝花，下次再努力点吧！(˵¯͒〰¯͒˵)',
        ])
        homejson[id].wait = 0
        await akasha_data.getQQYUserHome(id, homejson, filename, true)
        return true;
    }
    //随机娶
    async wife(e) {
        if (await this.is_jinbi(e) == true) return
        var id = e.user_id
        var filename = e.group_id + `.json`
        var homejson = await akasha_data.getQQYUserHome(id, homejson, filename, false)
        if (await this.is_killed(e, homejson, `wife`) == true) return
        if (!homejson[id].s == 0) {
            e.reply(`你似乎已经有爱人了,要不分手?`)
            return
        }
        if (homejson[id].money <= 30) {
            e.reply(`金币不足,你只剩下${homejson[id].money}金币了...还是去打工赚钱吧!`)
            return
        }
        let lastTime = await redis.get(`potato:whois-my-wife-cd:${e.group_id}:${e.user_id}`);
        if (lastTime) {
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
            msg1 = '系统检测到您为男性，'
        }
        else {
            msg1 = '系统检测到您为女性，'
        }
        if (e.msg.includes('娶') || e.msg.includes('老婆')) {
            sex = 'female'
            msg1 = msg1 + '正在按照您的要求寻找老婆！'
        }
        else {
            sex = 'male'
            msg1 = msg1 + '正在按照您的要求寻找老公！'
        }
        //e.reply(msg1)
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
        femaleList = femaleList.filter(item => { return item.user_id != e.user_id && item.user_id != Bot.uin })
        var gailv = Math.round(Math.random() * 9);
        let wife = {}

        for (let i = 0; i < 2; i++) {
            const random = Math.round(Math.random() * (femaleList.length - 1))
            wife = femaleList[random];
            break;
        }
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
            let name = await this.people(e, 'nickname', wife.user_id)//用is_she函数获取昵称
            msg = [
                segment.at(e.user_id), "\n",
                `${wife.nickname}答应了你哦！(*/ω＼*)`, "\n",
                `今天你的${cp}朋友是`, "\n",
                segment.image(`https://q1.qlogo.cn/g?b=qq&s=0&nk=${wife.user_id}`), "\n",
                `【${name}}】 (${wife.user_id}) `, "\n",
                `来自【${e.group_name}】`, "\n",
                `要好好对待${py}哦！`,
            ]
            homejson[id].s = wife.user_id
            homejson[id].money -= 30
            homejson[id].love = Math.round(Math.random() * (70 - 1) + 1)
            await redis.set(`potato:whois-my-wife-cd:${e.group_id}:${e.user_id}`, currentTime, {
                EX: cdTime
            });
        }
        else if (gailv >= sjwife) {
            var dsp = Math.round(Math.random() * (20 - 10) + 10)
            msg = [
                segment.at(e.user_id), "\n",
                `好遗憾，你谁也没娶到,${dsp}金币打水漂了!`
            ]
            homejson[id].money -= dsp
            await redis.set(`potato:whois-my-wife-cd:${e.group_id}:${e.user_id}`, currentTime, {
                EX: cdTime
            });
        }
        await akasha_data.getQQYUserHome(id, homejson, filename, true)
        setTimeout(() => {
            e.reply(msg);
        }, 3000);
        return true;
    }
    //主动分手/甩掉对方
    async breakup(e) {
        var id = e.user_id
        var filename = e.group_id + `.json`
        var homejson = await akasha_data.getQQYUserHome(id, homejson, filename, false)
        if (await this.is_killed(e, homejson, `breakup`) == true) return
        if (e.msg == "分手" || e.msg == "闹离婚") {
            if (homejson[id].s == 0) {//如果json中不存在该用户或者老婆s为0
                e.reply(`醒醒,你根本在这里没有老婆!!`)
                return
            }
            let she_he = await this.people(e, 'sex', homejson[id].s)//用is_she函数判断下这个人是男是女
            homejson[id].s = 0
            homejson[id].love = 0
            homejson[id].money - homejson[id].money / 5
            await akasha_data.getQQYUserHome(id, homejson, filename, true)
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
        if (homejson[id].s === cnm) {
            homejson[id].s = 0
            homejson[id].love = 0
            await akasha_data.getQQYUserHome(id, homejson, filename, true)
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
        }//@了所有人和机器人
        var id = e.user_id
        var filename = e.group_id + `.json`
        //读取家庭和房子信息
        var homejson = await akasha_data.getQQYUserHome(id, homejson, filename, false)
        var housejson = await akasha_data.getQQYUserHouse(id, housejson, filename, false)
        //如果有人被@
        if (e.at) id = e.at
        //获取你是哪些人的老婆
        let iswife_list = []
        //遍历这个群里面所以人
        for (let j of Object.keys(homejson)) {
            //若果这个人的老婆 == id
            if (homejson[j].s == id)
                iswife_list.push(j)
        }
        //你的钱,你的房子
        let msg_house = [`你现在还剩下${homejson[id].money}金币\n`,
        `你的住所信息为\n名字：${housejson[id].name}\n容量：${housejson[id].space}\n价值：${housejson[id].price}金币\n好感倍率：${housejson[id].loveup}`]
        //最后发送的信息
        let msg = []


        //有老婆的
        if (homejson[id].s !== 0) {
            //用is_she函数判断下这个人是男是女
            let she_he = await this.people(e, 'sex', homejson[id].s)
            //用is_she函数获取昵称
            let name = await this.people(e, 'nickname', homejson[id].s)
            //你的老婆和好感度
            var msg_love2 = [
                `${she_he}对你的好感度为：${homejson[id].love}\n`
            ]
            //两情相悦的
            if (iswife_list.includes(homejson[id].s)) {
                msg = [
                    `两心靠近是情缘,更是吸引;\n两情相悦是喜欢,更是眷恋。\n`,
                    `和你两情相悦的人是${name},\n希望你和${she_he}的爱情能够天长地久\n`,
                    `${she_he}对你的好感度为：${homejson[id].love}\n`]
                //把喜欢你的人从这个数组去除
                iswife_list.slice(iswife_list.indexOf(homejson[id].s), 1)
            }
            //不是两情相悦的的
            else {
                msg = [
                    `你的群友老婆是${name}\n`,]
            }
        }
        //单身的
        else {
            msg = [
                `现在的你还是一位单身贵族，没有老婆哦\n`
            ]
            //单身的没有msg_love2，就是没有老婆

        }
        //对msg_love处理
        //喜欢你的人
        let msg_love = '喜欢你但是你不喜欢的人有：\n'
        if (!iswife_list.length == 0) {
            for (let i of iswife_list)
                msg_love = msg_love + `${i}\n好感度为：${homejson[i].love}\n`
            msg_love = msg_love + `快去处理一下吧\n`
        }
        else msg_love = '喜欢你但是你不喜欢的人有：\n一个也没有\n'

        //最后回复信息
        if (homejson[id].s !== 0) {
            msg = msg + msg_love2 + msg_love + msg_house
            e.reply([segment.at(id), segment.at(homejson[id].s), "\n", segment.image(`https://q1.qlogo.cn/g?b=qq&s=0&nk=${homejson[id].s}`), "\n", msg])
        }
        else {
            msg = msg + msg_love + msg_house
            e.reply([segment.at(id), "\n", msg])
        }

        return true;
    }
    //打工
    async getmoney(e) {
        if (await this.is_jinbi(e) == true) return
        var id = e.user_id
        var filename = e.group_id + `.json`
        var homejson = await akasha_data.getQQYUserHome(id, homejson, filename, false)
        if (await this.is_killed(e, homejson, `getmoney`) == true) return
        let lastTime2 = await redis.get(`potato:wife-getmoney-cd:${e.group_id}:${e.user_id}`);
        if (lastTime2) {
            e.reply([
                segment.at(e.user_id), "\n",
                `等会儿哦！(*/ω＼*)`, "\n",
                `该命令有${cdTime3}秒cd`
            ]);
            return
        }
        await redis.set(`potato:wife-getmoney-cd:${e.group_id}:${e.user_id}`, currentTime, {
            EX: cdTime3
        });
        homejson[id].money += Math.round(Math.random() * 50 + 50)
        await akasha_data.getQQYUserHome(id, homejson, filename, true)
        e.reply(`恭喜你!现在你有${homejson[id].money}金币了!`)
        return true;
    }
    //看房
    async gethouse(e) {
        var housething = JSON.parse(fs.readFileSync(housepath, "utf8"));//读取文件
        var msg = '欢迎光临\n请过目\n'
        for (let i of Object.keys(housething)) {
            msg += `名${housething[i].name}\n容量：${housething[i].space}\n价格${housething[i].price}\n好感增幅${housething[i].loveup}\n`
        }
        e.reply(msg)
        return true
    }
    //逛街
    async gift(e) {
        if (await this.is_jinbi(e) == true) return
        var id = e.user_id
        var filename = e.group_id + `.json`
        var homejson = await akasha_data.getQQYUserHome(id, homejson, filename, false)
        var placejson = await akasha_data.getQQYUserPlace(id, placejson, filename, false)
        var giftthing = JSON.parse(fs.readFileSync(giftpath, "utf8"));//读取文件
        if (homejson[id].s == 0) {//如果json中不存在该用户或者老婆s为0
            e.reply(`醒醒,你还在这里没有老婆!!`)
            return
        }
        let lastTime5 = await redis.get(`potato:wife-gift-cd:${e.group_id}:${e.user_id}`);
        if (lastTime5) {
            e.reply([
                segment.at(e.user_id), "\n",
                `等会儿哦！(*/ω＼*)`, "\n",
                `该命令有${cdTime5}秒cd`
            ]);
            return
        }
        await redis.set(`potato:wife-gift-cd:${e.group_id}:${e.user_id}`, currentTime, {
            EX: cdTime5
        });
        if (placejson[id].place !== "home") {
            e.reply([
                segment.at(id), "\n",
                `你不在家,不能进行逛街,当前位置为：${placejson[id].place}`
            ])
            return
        }
        if (await this.is_killed(e, homejson, 'gift') == true) { return }
        var placeid = Math.round(Math.random() * (Object.keys(giftthing.placename).length - 1))//随机获取一个位置id
        var placemsg = giftthing.start[placeid + 1]//获取消息
        e.reply([
            segment.at(id), "\n",
            `${placemsg}\n`,
            `你选择[进去看看]还是[去下一个地方]?`
        ])
        placejson[id].place = giftthing.placename[placeid]
        await akasha_data.getQQYUserPlace(id, placejson, filename, true)//保存位置
        return true;
    }
    //逛街事件结束
    async gift_continue(e) {
        if (await this.is_jinbi(e) == true) return
        var id = e.user_id
        var filename = e.group_id + `.json`
        var homejson = await akasha_data.getQQYUserHome(id, homejson, filename, false)
        var placejson = await akasha_data.getQQYUserPlace(id, placejson, filename, false)
        var housejson = await akasha_data.getQQYUserHouse(id, housejson, filename, false)
        if (homejson[e.user_id].money <= 0) {
            e.reply(`金币都没了,还是别进去了吧`)
            return
        }
        if (placejson[id].place == "home") return//在家直接终止
        var giftthing = JSON.parse(fs.readFileSync(giftpath, "utf8"));//读取位置资源文件
        if (placejson[id].place == "home") {
            e.reply([
                segment.at(id), "\n",
                `你在家,先逛街出去吧,当前位置为：${placejson[id].place}`
            ])
            return
        }
        if (await this.is_killed(e, homejson, 'gift') == true) { return }
        var userplacename = placejson[id].place//获取玩家位置名A
        var placemodle = giftthing[userplacename]//获取位置资源中的位置A的数据B
        var placeid = Math.round(Math.random() * (Object.keys(placemodle).length - 1) + 1)//随机从B中选择一个位置id
        var placemsg = placemodle[placeid].msg//获取消息
        e.reply(`${placemsg}`)
        placejson[id].place = "home"
        placejson[id].placetime = 0
        homejson[id].money += placemodle[placeid].money
        homejson[id].love += Math.round(placemodle[placeid].love * housejson[id].loveup)
        setTimeout(() => {
            e.reply([
                segment.at(id), "\n",
                `恭喜你,你本次的行动结果为,金币至${homejson[id].money},好感度至${homejson[id].love}`
            ])
        }, 1000)
        await akasha_data.getQQYUserHome(id, homejson, filename, true)
        await akasha_data.getQQYUserPlace(id, placejson, filename, true)//保存位置
        if (await this.is_fw(e, homejson) == true) return
    }
    //逛街事件继续
    async gift_over(e) {
        if (await this.is_jinbi(e) == true) return
        if (await this.is_MAXEX(e) == true) return
        var id = e.user_id
        var filename = e.group_id + `.json`
        var homejson = await akasha_data.getQQYUserHome(id, homejson, filename, false)
        var placejson = await akasha_data.getQQYUserPlace(id, placejson, filename, false)
        if (placejson[id].place == "home") return//在家直接终止
        var giftthing = JSON.parse(fs.readFileSync(giftpath, "utf8"));//读取位置资源文件
        if (placejson[id].place == "home") {
            e.reply([
                segment.at(id), "\n",
                `你在家,先逛街出去吧,当前位置为：${placejson[id].place}`
            ])
            return
        }
        if (await this.is_killed(e, homejson, 'gift') == true) { return }
        var placeid = Math.round(Math.random() * (Object.keys(giftthing.placename).length - 1))//随机获取一个位置id
        var placemsg = giftthing.start[placeid + 1]//获取消息
        e.reply([
            segment.at(id), "\n",
            `${placemsg}\n`,
            `你选择[进去看看]还是[去下一个地方]?`
        ])
        placejson[id].place = giftthing.placename[placeid]
        placejson[id].placetime++
        await akasha_data.getQQYUserPlace(id, placejson, filename, true)//保存位置
        if (await this.is_fw(e, homejson) == true) return
    }
    //抱抱,有千分之一的概率被干掉
    async touch(e) {
        if (await this.is_jinbi(e) == true) return
        var id = e.user_id
        var filename = e.group_id + `.json`
        var homejson = await akasha_data.getQQYUserHome(id, homejson, filename, false)
        var housejson = await akasha_data.getQQYUserHouse(id, housejson, filename, false)
        if (await this.is_killed(e, homejson, 'touch') == true) { return }
        if (e.atme || e.atall) {
            e.reply(`不可以这样！`)
            return
        }
        if (homejson[id].s == 0) {//如果json中不存在该用户或者老婆s为0
            e.reply(`醒醒,你还在这里没有老婆!!`)
            return
        }
        if (!e.at && !e.atme) {
            e.reply([
                segment.at(homejson[id].s), "\n",
                `他摸了摸你`,
            ])
        }
        if (e.at && e.at != homejson[id].s) {
            e.reply(`醒醒,这不是你老婆!!!`)
            return
        }
        let lastTime4 = await redis.get(`potato:wife-touch-cd:${e.group_id}:${e.user_id}`);
        if (lastTime4) {
            e.reply([
                segment.at(e.user_id), "\n",
                `等会儿哦！(*/ω＼*)`, "\n",
                `该命令有${cdTime4}秒cd`
            ]);
            return
        }
        await redis.set(`potato:wife-touch-cd:${e.group_id}:${e.user_id}`, currentTime, {
            EX: cdTime4
        });
        homejson[id].love += Math.round((Math.random() * 30 + 45) * housejson[id].loveup)
        await akasha_data.getQQYUserHome(id, homejson, filename, true)
        e.reply(`恭喜你,你老婆对你的好感上升到了${homejson[id].love}!`)
        return true;
    }
    //查看本群所有cp
    async cp(e) {
        var id = e.user_id
        var filename = e.group_id + `.json`
        var homejson = await akasha_data.getQQYUserHome(id, homejson, filename, false)
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
        for (let i of Object.keys(homejson)) {
            if (idlist.includes(homejson[i].s))
                msg = msg + `${namelist[i]}   和他的老婆${namelist[homejson[i].s]}   \n`
        }
        e.reply(msg)
        return true;
    }
    //500以内可以领取低保
    async poor(e) {
        let lastTime = await redis.get(`potato:wife-poor-cd:${e.group_id}:${e.user_id}`);
        if (lastTime) {
            let tips = [
                segment.at(e.user_id), "\n",
                `等会儿哦！(*/ω＼*)`, "\n",
                `该命令有${cdTime7}秒cd`
            ]
            e.reply(tips);
            return
        }
        var id = e.user_id
        var filename = e.group_id + `.json`
        var homejson = await akasha_data.getQQYUserHome(id, homejson, filename, false)
        if (homejson[id].money < 500) {
            e.reply(`领取成功,你现在有500金币了`)
            homejson[id].money = 500
            await akasha_data.getQQYUserHome(id, homejson, filename, true)
            await redis.set(`potato:wife-poor-cd:${e.group_id}:${e.user_id}`, currentTime, {
                EX: cdTime7
            });
            return
        }
        if (homejson[id].money >= 500) {
            e.reply(`这就是有钱人的嘴脸吗`)
        }
        return true
    }
    //转账功能
    async Transfer_money(e) {
        var id = e.user_id
        var filename = e.group_id + `.json`
        var homejson = await akasha_data.getQQYUserHome(id, homejson, filename, false)
        var housejson = await akasha_data.getQQYUserHouse(id, housejson, filename, false)
        if (homejson[id].s == 0) {
            e.reply([
                segment.at(id), "\n",
                `你暂时在这里没有老婆哦,不用上交了`
            ])
            return
        }
        if (homejson[id].money <= 0) {
            e.reply([
                segment.at(id), "\n",
                `你自己已经很穷了,上交个啥?`
            ])
            return
        }
        var msg = e.msg.replace(/(上交存款|#)/g, "").replace(/[\n|\r]/g, "，").trim()
        if (isNaN(msg)) {
            e.reply(`${msg}不是有效值`)
            return
        }
        var id2 = homejson[id].s
        var homejson = await akasha_data.getQQYUserHome(id2, homejson, filename, false)  //给老婆创建存档
        var yingfu = Math.round(msg)
        var shifu = Math.round(yingfu * 1.1)
        e.reply([
            segment.at(id), "\n",
            `您本次应付需要${yingfu}金币,实付需要${shifu}`
        ])
        setTimeout(() => {
            if (homejson[id].money < shifu) {
                e.reply([
                    segment.at(id), "\n",
                    `你的金币不足,上交失败`
                ])
                return
            }
            else if (homejson[id].money >= shifu) {
                e.reply([
                    segment.at(id), "\n",
                    `上交成功\n`,
                    `老婆对你的好感上升了${Math.round(yingfu / 10)}`,
                    segment.at(id2), "\n",
                    `你的爱人向你上交了${yingfu}金币`
                ])
                homejson[id].money -= shifu
                homejson[id2].money += yingfu
                homejson[id2].love += Math.round((yingfu / 10) * housejson[id].loveup)
                akasha_data.getQQYUserHome(id, homejson, filename, true)
            }
        }, 1500)
        return true;
    }
    //清除所有人的冷却或者指定某个人的
    async delcd(e) {
        if (e.isMaster) {
            let cddata = await redis.keys(`potato:*:${e.group_id}:*`, (err, data) => { });
            await redis.del(cddata);
            e.reply("成功清除本群冷却")
            return true;
        }
    }
    //下面的都是函数,调用时需使用awiat等待以免异步执行---------------------------------------------------------//
    //创建存档
    async creat_(e, id) {
        var id = e.user_id
        var filename = e.group_id + `.json`
        var homejson = await akasha_data.getQQYUserHome(id, homejson, filename, false)
        var placejson = await akasha_data.getQQYUserPlace(id, placejson, filename, false)
        var housejson = await akasha_data.getQQYUserHouse(id, housejson, filename, false)
    }
    //看看你是哪些人的老婆函数
    async is_wife(e, id) {
        var filename = e.group_id + `.json`
        var homejson = await akasha_data.getQQYUserHome(id, homejson, filename, false)
        let wifelist = []//看看这个Id是哪些人的老婆
        for (let i of Object.keys(homejson)) {//读取json里面的对象名
            if (homejson[i].s == id)//如果有人的老婆是是这个id
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
            let name = lp.card
            return name
        }

    }
    //看看你是不是在关禁闭
    async is_jinbi(e) {
        let jinbi = await redis.get(`potato:wife-jinbi-cd:${e.group_id}:${e.user_id}`);
        if (jinbi) {
            e.reply([
                segment.at(e.user_id), "\n",
                `你已经被关进禁闭室了!!!时间到了自然放你出来`
            ])
            return true
        }
        return false
    }
    //看看你会不会被干掉
    async is_killed(e, homejson, category) {
        var id = e.user_id
        var filename = e.group_id + `.json`
        var homejson = await akasha_data.getQQYUserHome(id, homejson, filename, false)
        let kill = Math.round(Math.random() * 999)
        if (kill == 6) {
            e.reply([`触发千分之一的概率事件!!!,\n`,
                `很遗憾的告诉你,发生了意外,你失去了你所有的金币...你,失去了你的老婆...真是离谱(划掉)遗憾啊,\n`, "\n",
                `你,是否愿意重来呢?`, "\n",
                `即使,金钱,好感...一切都要重新开始吗?`, "\n",
                `做出你的选择吧!`
            ])
            homejson[id].money = 0
            homejson[id].love = 0
            homejson[id].s = 0
            await akasha_data.getQQYUserHome(id, homejson, filename, true)
            return true
        }
        /*if (kill < 100) {
            homejson[id].money -= 100
                e.reply(`触发十分之一的概率事件!!!`)
            setTimeout(() => {
                e.reply('虽然不知道为什么,但是你的计划泡汤了,还没了100金币')
            }, 3000);//设置延迟
            return true
        }*/
        return false
    }
    //判断好感度是否双方都小于等于0,是则拆散,单向老婆则只失去老婆
    async is_fw(e, homejson) {
        var id = e.user_id
        var filename = e.group_id + `.json`
        var homejson = await akasha_data.getQQYUserHome(id, homejson, filename, false)
        /*let id2 = homejson[id].s
        if(homejson[id2].s == id && (homejson[id2].love <= 0||homejson[id].love <= 0)){
            e.reply(`很遗憾,由于你们有一方对对方的好感太低,你们的感情走到了尽头`)
            homejson[id].love = 0
            homejson[id].s = 0
            homejson[id2].love = 0
            homejson[id2].s = 0
                return true;
        }
        */
        if (homejson[id].love <= 0) {
            e.reply(`很遗憾,由于你老婆对你的好感太低,你老婆甩了你`)
            homejson[id].love = 0
            homejson[id].s = 0
            await akasha_data.getQQYUserHome(id, homejson, filename, true)
            return true;
        }
        return false;
    }
    //判断逛街时侯的位置更换次数是否超出,超出则强制回家
    async is_MAXEX(e) {
        var id = e.user_id
        var filename = e.group_id + `.json`
        var placejson = await akasha_data.getQQYUserPlace(id, placejson, filename, false)
        if (placejson[e.user_id].placetime >= 5) {
            e.reply(`单次逛街行动上限,你们啥也没干回了家`)
            placejson[id].place = "home"
            placejson[id].placetime = 0
            await akasha_data.getQQYUserPlace(id, placejson, filename, true)
            return true
        }
        else return false;
    }
}