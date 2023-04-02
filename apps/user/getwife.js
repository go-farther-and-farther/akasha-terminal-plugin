//随便写的,大佬勿喷 初版@鸢:随机娶群友，指定娶群友
import { BotApi, AlemonApi, plugin } from '../../model/api/api.js'
import fs from 'fs'
import Config from '../../model/Config.js'
import { segment } from "oicq";
import moment from "moment"
import command from '../../components/command.js'
import akasha_data from '../../components/akasha_data.js'
const dirpath2 = "plugins/akasha-terminal-plugin/data/UserData";//文件夹路径
let Magnification = await command.getConfig("duel_cfg", "Magnification");

const giftpath = `plugins/akasha-terminal-plugin/resources/qylp/giftthing.json`
const housepath = `plugins/akasha-terminal-plugin/resources/qylp/house.json`
const lotterypath = `plugins/akasha-terminal-plugin/resources/qylp/lottery.json`
const currentTime = moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
let cdTime = Number(await command.getConfig("wife_cfg", "sjcd")) * 60;//随机娶群友冷却
let cdTime2 = Number(await command.getConfig("wife_cfg", "qqcd")) * 60;//强娶冷却
let cdTime3 = Number(await command.getConfig("wife_cfg", "dgcd")) * 60;//打工冷却
let cdTime4 = Number(await command.getConfig("wife_cfg", "bbcd")) * 60;//抱抱冷却
let cdTime5 = Number(await command.getConfig("wife_cfg", "ggcd")) * 60;//逛街冷却
let cdTime6 = Number(await command.getConfig("wife_cfg", "qlpcd")) * 60;//抢老婆冷却
let cdTime7 = Number(await command.getConfig("wife_cfg", "poorcd")) * 60;//低保冷却
let cdTime8 = Number(await command.getConfig("wife_cfg", "RBBgetcd")) * 60;//获取虚空彩球的cd
let qqwife = await command.getConfig("wife_cfg", "qqwife");//强娶概率
let sjwife = await command.getConfig("wife_cfg", "sjwife");//随机概率
let gifttime = await command.getConfig("wife_cfg", "gifttime");//逛街换地上限
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
                reg: '^#?(强娶|娶)$',
                fnc: 'wife2'
            },
            {
                reg: '^#?抢老婆$',
                fnc: 'ntr'
            },
            {
                reg: '^#?(抢劫|抢银行)$',
                fnc: 'Robbery'
            },
            {
                reg: '^#?我愿意$',
                fnc: 'yy'
            },
            {
                reg: '^#?我拒绝$',
                fnc: 'jj'
            },
            {
                reg: '^#?(闹离婚|甩掉|分手)$',
                fnc: 'breakup'
            },
            {
                reg: '^#?踢出银啪$',
                fnc: 'nofuck'
            },
            {
                reg: '^#?退出银啪$',
                fnc: 'fuckno'
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
                reg: '^#?住所改名',
                fnc: 'namedhouse'
            },
            {
                reg: '^#?看房$',
                fnc: 'gethouse'
            },
            {
                reg: '^#?买房[0-9]{1,}$',
                fnc: 'buyhouse'
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
                reg: '^#?回家$',
                fnc: 'gohome'
            },
            {
                reg: '^#?获取虚空彩球([0-9][0-9](?:\\s)){6}[0-9][0-9]$',
                fnc: 'lottery1'
            },
            {
                reg: '^#?我的彩票$',
                fnc: 'readRBB'
            },
            {
                reg: '^#?虚空彩球兑换$',
                fnc: 'useRBB'
            },
            {
                reg: '^#?(拥抱|抱抱)(.*)$',
                fnc: 'touch'
            },
            {
                reg: '^#?开始银啪$',
                fnc: 'fk'
            },
            {
                reg: '^#?(群cp|cp列表)$',
                fnc: 'cplist'
            },
            {
                reg: '^#?领取低保$',
                fnc: 'poor'
            },
            {
                reg: '^#?上交存款[0-9]{1,}$',
                fnc: 'Transfer_money'
            },
            {
                reg: '^#?(虚空)(时间重置|重置时间)$',
                fnc: 'delREDIS'
            },
            {
                reg: '^#?虚空清除无效存档$',
                fnc: 'delerrdata'
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
        var inpajson = await akasha_data.getQQYUserxiaoqie(id, inpajson, filename, false)
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
        var battlejson = await akasha_data.getQQYUserBattle(id, battlejson, false)
        let UserPAF = battlejson[id].Privilege
        let lastTime = await redis.ttl(`akasha:whois-my-wife2-cd:${e.group_id}:${e.user_id}`);
        if (lastTime !== -2 && !UserPAF) {
            e.reply([
                segment.at(e.user_id), "\n",
                `等会儿哦！(*/ω＼*)`, "\n",
                `该命令还有${lastTime / 60}分钟cd`
            ]);
            return
        }
        if (await this.is_killed(e, `wife2`, true) == true) return
        let sex = await Bot.pickFriend(e.user_id).sex
        let ex = ''
        if (sex == 'male') {
            ex = '小姐'
        }
        else if (sex == 'female') {
            ex = '先生'
        }
        if (e.msg.includes("强娶")) {
            if (homejson[id].money <= 50) {
                e.reply(`金币不足,你只剩下${homejson[id].money}金币了...还是去打工赚钱吧!`)
                return
            }
            if(homejson[id].s == e.at || (inpajson[id].fuck).includes(e.at))
              return e.reply(`对方已经属于你了哦`)
            var gailv = Math.round(Math.random() * 9);
            if (gailv < qqwife || UserPAF) {
                e.reply([
                    segment.at(id), "\n",
                    segment.image(`https://q1.qlogo.cn/g?b=qq&s=0&nk=${id}`), "\n",
                    `恭喜你！`, "\n",
                    `在茫茫人海中，你成功强娶到了${name}!`,
                    "\n", segment.image(`https://q1.qlogo.cn/g?b=qq&s=0&nk=${e.at}`), "\n",
                ])
                await redis.set(`akasha:whois-my-wife2-cd:${e.group_id}:${e.user_id}`, currentTime, {
                    EX: cdTime2
                });
                if (!homejson[id].s == 0) {
                    e.reply(`你已经有老婆了,你可以纳妾!?,这位${name}就成功被你纳入了!`)
                    inpajson[id].fuck.push(e.at)
                }
                else if(!homejson[id].s){
                  homejson[id].s = e.at
                  homejson[id].love = Math.round(Math.random() * (40 - 10) + 10)
                }
            }
            else if (gailv >= qqwife) {
                var sbcf = Math.round(Math.random() * (20 - 10) + 10)
                homejson[id].money -= sbcf
                e.reply(`很遗憾,你没能成功将${she_he}娶走,${she_he}报警,你被罚款${sbcf}`)
                await redis.set(`akasha:whois-my-wife2-cd:${e.group_id}:${e.user_id}`, currentTime, {
                    EX: cdTime2
                });
            }
            homejson[id].money -= 50
            await akasha_data.getQQYUserHome(id, homejson, filename, true)
            await akasha_data.getQQYUserxiaoqie(id, inpajson, filename, true)
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
    //银啪
    async fk(e){
        var id = e.user_id
        var filename = e.group_id + `.json`
        var homejson = await akasha_data.getQQYUserHome(id, homejson, filename, false)
        var inpajson = await akasha_data.getQQYUserxiaoqie(id, inpajson, filename, false)
        if(!homejson[id].s) return e.reply(`你没有老婆,也没有小妾,你隔这开什么inpact??导管吗`)
        if(homejson[id].s && !(inpajson[id].fuck).includes(homejson[id].s))
          inpajson[id].fuck.push(homejson[id].s)
        var ren = (inpajson[id].fuck).length
        let msg = []
        if(!inpajson[id].kun){
          inpajson[id].kun = Math.round(Math.random()*11 + 1)
          msg.push(`你还没有牛牛,让神赐予你吧`)
          msg.push(`恭喜你,你的牛牛初始值为${inpajson[id].kun}cm`)
        }
        let kunup = ren * (Math.round(Math.random()*1 + 1)/10)
        inpajson[id].kun += kunup
        inpajson[id].fucktime++
        msg.push(`这是银啪剧情,目前还没写`)
        msg.push(`你本次邀请了${ren}位群友参加银啪,\n牛牛长长了${kunup}cm,\n目前为${inpajson[id].kun}cm`)
        await akasha_data.getQQYUserxiaoqie(id, inpajson, filename, true)
        Config.getforwardMsg(msg, e)
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
        if (await this.is_killed(e, `ntr`, true) == true) return
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
        var battlejson = await akasha_data.getQQYUserBattle(id, battlejson, false)
        let UserPAF = battlejson[id].Privilege
        let lastTime = await redis.ttl(`akasha:wife-ntr-cd:${e.group_id}:${e.user_id}`);
        if (lastTime !== -2 && !UserPAF) {
            e.reply([
                segment.at(e.user_id), "\n",
                `等会儿哦！(*/ω＼*)`, "\n",
                `该命令还有${lastTime / 60}分cd`
            ]);
            return
        }
        var good = Math.round(homejson[e.user_id].money / (1.5 * homejson[e.at].love + homejson[e.at].money) * 100)
        var gailv = Math.round(Math.random() * 99)
        if (UserPAF) return await this.ntrT()//有权能直接抢走
        //这里用了和决斗一样的数据
        let is_win = await this.duel(e)
        if (is_win) {
            setTimeout(() => {
                e.reply(`你的金币数为：${homejson[id].money},\n对方的金币数为：${homejson[e.at].money},\n对方老婆对对方的好感度为：${homejson[e.at].love},决斗赢了,你的成功率为：${good}+10%`)
            }, 2000);
            good += 10
        }
        else {
            setTimeout(() => {
                e.reply(`你的金币数为：${homejson[id].money},\n对方的金币数为：${homejson[e.at].money},\n对方老婆对对方的好感度为：${homejson[e.at].love},决斗输了,你的成功率为：${good}-10%`)
            }, 2000);
            good -= 10
        }
        if (homejson[e.at].love >= 5000) {
            setTimeout(() => {
                e.reply(`他们之间已是休戚与共,伉俪情深,你是无法夺走他老婆的!`)
            }, 3000);
            await this.ntrF(e, e.user_id, e.at)
        }
        else if (good > gailv)
            await this.ntrT(e, e.user_id, e.at)
        else
            await this.ntrF(e, e.user_id, e.at)
        await redis.set(`akasha:wife-ntr-cd:${e.group_id}:${e.user_id}`, currentTime, {
            EX: cdTime6
        });
        return true;
    }
    //打劫或者抢银行
    async Robbery(e) {
        var id = e.user_id
        var at = e.at
        var filename = e.group_id + `.json`
        var homejson = await akasha_data.getQQYUserHome(id, homejson, filename, false)
        let home_template = {
            "s": 0,
            "wait": 0,
            "money": 10000,
            "love": 0
        }
        if (!homejson.hasOwnProperty('银行')) homejson["银行"] = home_template
        if (e.atme || e.atall) {
            e.reply(`6🙂`)
            return
        }
        if (!e.at) {
            e.reply(`你想抢谁的钱呢?at出来!默认你抢银行了!`)
            var at = "银行"
        }
        // 判断是不是被干掉了
        if (await this.is_killed(e, `ntr`, true) == true) return
        if (homejson['银行'].money <= 100) {
            e.reply('银行没钱了，上面拨款了！')
            homejson['银行'].money = 1000
        }
        if (homejson[at].money <= 100) {
            e.reply(`虽然但是,对方在这里没有钱(${homejson[id].money})啊!(￣_,￣ ),要不你给点?`)
            return
        }
        if (homejson[id].money >= 5000) {
            e.reply(`你已经有钱({${homejson[id].money})了还抢别人的???`)
            return
        }
        if (homejson[id].s != 0) {
            e.reply(`你有老婆还出来抢钱，不怕她不要你了?`)
            return
        }
        var battlejson = await akasha_data.getQQYUserBattle(id, battlejson, false)
        let UserPAF = battlejson[id].Privilege
        let lastTime = await redis.ttl(`akasha:wife-Robbery-cd:${e.group_id}:${e.user_id}`);
        if (lastTime !== -2 && !UserPAF) {
            e.reply([
                segment.at(e.user_id), "\n",
                `等会儿哦！(*/ω＼*)`, "\n",
                `该命令还有${lastTime / 60}分cd`
            ]);
            return
        }
        // var good = Math.round(homejson[e.user_id].money / (1.5 * homejson[e.at].love + homejson[e.at].money) * 100)
        var good = 30
        var gailv = Math.round(Math.random() * 99)
        // if (UserPAF) return await this.ntrT2()//有权能直接抢走
        //这里用了和决斗一样的数据
        // let is_win = await this.duel(e)
        // if (is_win) {
        //     setTimeout(() => {
        //         e.reply(`你的金币数为：${homejson[id].money},\n对方的金币数为：${homejson[e.at].money},\n对方老婆对对方的好感度为：${homejson[e.at].love},决斗赢了,你的成功率为：${good}+10%`)
        //     }, 2000);
        //     good += 10
        // }
        // else {
        //     setTimeout(() => {
        //         e.reply(`你的金币数为：${homejson[id].money},\n对方的金币数为：${homejson[e.at].money},\n对方老婆对对方的好感度为：${homejson[e.at].love},决斗输了,你的成功率为：${good}-10%`)
        //     }, 2000);
        //     good -= 10
        // }
        // if (homejson[e.at].love >= 5000) {
        //     setTimeout(() => {
        //         e.reply(`他们之间已是休戚与共,伉俪情深,你是无法夺走他的钱的!`)
        //     }, 3000);
        //     await this.ntrF2(e, e.user_id, e.at)
        // }
        if (good > gailv) { await this.ntrT(e, e.user_id, at, 'Robbery') }
        else { await this.ntrF(e, e.user_id, e.at, 'Robbery') }
        await redis.set(`akasha:wife-Robbery-cd:${e.group_id}:${e.user_id}`, currentTime, {
            EX: cdTime6
        });
        return true;
    }
    //抢老婆失败时调用
    async ntrF(e, jia, yi, key = 'ntr') {
        var id = e.user_id
        var filename = e.group_id + `.json`
        var homejson = await akasha_data.getQQYUserHome(id, homejson, filename, false)
        if (key == 'ntr') {
            var pcj = Math.round((homejson[yi].love / 10) + (homejson[jia].money / 3) + 100)//赔偿金
            setTimeout(() => {
                e.reply([
                    segment.at(jia), "\n",
                    `对方报警,你需要赔偿${pcj}金币,;金币不足将会被关禁闭`, "\n",
                ])
            }, 4000);
        }
        if (key == 'Robbery') {
            var pcj = Math.round(100 + Math.random() * 100)
            setTimeout(() => {
                e.reply([
                    segment.at(jia), "\n",
                    `你抢劫被抓到,你需要赔偿${pcj}金币,;金币不足将会被关禁闭`, "\n",
                ])
            }, 4000);
        }
        var jbtime = (pcj - homejson[jia].money) * 10//禁闭时间

        if (homejson[jia].money < pcj) {
            homejson[yi].money += homejson[jia].money
            homejson[jia].money = 0
            await redis.set(`akasha:wife-jinbi-cd:${e.group_id}:${jia}`, currentTime, {
                EX: jbtime
            });
            setTimeout(() => {
                e.reply(`恭喜你,你的金币不足,因此赔光了还被关禁闭${jbtime / 60}分`)
            }, 5000);
        }
        if (homejson[jia].money >= pcj) {
            homejson[yi].money += pcj
            homejson[jia].money -= pcj
            setTimeout(() => {
                e.reply(`你成功清赔款${pcj}金币!`)
            }, 6000);
        }
        await akasha_data.getQQYUserHome(id, homejson, filename, true)
    }
    //抢老婆成功时调用
    async ntrT(e, jia, yi, key = 'ntr') {
        var id = e.user_id
        var filename = e.group_id + `.json`
        var homejson = await akasha_data.getQQYUserHome(id, homejson, filename, false)
        if (key == 'ntr') {
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
        }
        if (key == 'Robbery') {
            e.reply([
                segment.at(yi), "\n",
                `很遗憾!由于你的疏忽,你的钱抢走了!!!`
            ])
            money = 100 + 100 * Math.random()
            homejson[yi].money -= money
            homejson[jia].money += money

        }
        await akasha_data.getQQYUserHome(id, homejson, filename, true)
    }
    //愿意
    async yy(e) {
        var id = e.user_id
        var filename = e.group_id + `.json`
        var homejson = await akasha_data.getQQYUserHome(id, homejson, filename, false)
        var inpajson = await akasha_data.getQQYUserxiaoqie(id, inpajson, filename, false)
        if (await this.is_killed(e, `yy`, false) == true) return
        if (e.atme || e.atall) {
            e.reply(`6🙂`)
            return
        }
        if (!e.at) {
            e.reply(`请at你愿意嫁给的人哦(˵¯͒〰¯͒˵)`)
            return
        }
        id = e.at
        if (homejson[id].wait == 0) {
            e.reply(`对方还未向任何人求婚呢,就不要捣乱了`)
            return
        }
        if (homejson[id].wait !== e.user_id) {
            e.reply(`你不是${homejson[id].wait},就不要捣乱了`)
            return
        }
        if (!homejson[id].s == 0) {
            e.reply(`对方已经有老婆了,所以你成为了对方的小妾!!!`)
            inpajson[id].fuck.push(e.user_id)
            homejson[id].wait = 0
        }
        else if(!homejson[id].s){
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
          e.reply(`既然你们是两情相愿,你们现在的老婆就是彼此啦,给你们发了红包哦`)
        }
        await akasha_data.getQQYUserHome(id, homejson, filename, true)
        await akasha_data.getQQYUserxiaoqie(id, inpajson, filename, true)
        return true;
    }
    //拒绝
    async jj(e) {
        var id = e.at
        var filename = e.group_id + `.json`
        var homejson = await akasha_data.getQQYUserHome(id, homejson, filename, false)
        if (await this.is_killed(e, `jj`, false) == true) return
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
        var inpajson = await akasha_data.getQQYUserxiaoqie(id, inpajson, filename, false)
        if (await this.is_killed(e, `wife`, false) == true) return
        if (homejson[id].money <= 30) {
            e.reply(`金币不足,你只剩下${homejson[id].money}金币了...还是去打工赚钱吧!`)
            return
        }
        var battlejson = await akasha_data.getQQYUserBattle(id, battlejson, false)
        let UserPAF = battlejson[id].Privilege
        let lastTime = await redis.ttl(`akasha:whois-my-wife-cd:${e.group_id}:${e.user_id}`);
        if (lastTime !== -2 && !UserPAF) {
            e.reply([
                segment.at(e.user_id), "\n",
                `等会儿哦！(*/ω＼*)`, "\n",
                `该命令还有${lastTime / 60}分cd`
            ]);
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
        femaleList = femaleList.filter(item => { return item.user_id != e.user_id })
        femaleList = femaleList.filter(item => { return item.user_id != Bot.uin })
        var gailv = Math.round(Math.random() * 9);
        let wife = {}

        for (let i = 0; i < 2; i++) {
            const random = Math.round(Math.random() * (femaleList.length - 1))
            wife = femaleList[random];
            break;
        }
        let msg = []
        if (gailv < sjwife || UserPAF) {
            let sexStr = ''
            if (wife.sex == 'male') {
                sexStr = '男'
            }
            else {//不是男的或者未知就当女朋友
                sexStr = '女'
            }
            console.log(wife);
            let she_he = await this.people(e, 'sex', wife.user_id)//用people函数获取性别称呼
            let name = await this.people(e, 'nickname', wife.user_id)//用people函数获取昵称
            msg = [
                segment.at(e.user_id), "\n",
                `${name}答应了你哦！(*/ω＼*)`, "\n",
                `今天你的${sexStr}朋友是`, "\n",
                segment.image(`https://q1.qlogo.cn/g?b=qq&s=0&nk=${wife.user_id}`), "\n",
                `【${name}}】 (${wife.user_id}) `, "\n",
                `来自【${e.group_name}】`, "\n",
                `要好好对待${she_he}哦！`,
            ]
            if (!homejson[id].s == 0) {
                e.reply(`你已经有老婆了,对方成为了你的小妾!!!`)
                inpajson[id].fuck.push(wife.user_id)
            }
            else if(!homejson[id].s){    
              homejson[id].s = wife.user_id
              homejson[id].money -= 30
              homejson[id].love = Math.round(Math.random() * (70 - 1) + 1)
            }
            await redis.set(`akasha:whois-my-wife-cd:${e.group_id}:${e.user_id}`, currentTime, {
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
            await redis.set(`akasha:whois-my-wife-cd:${e.group_id}:${e.user_id}`, currentTime, {
                EX: cdTime
            });
        }
        await akasha_data.getQQYUserHome(id, homejson, filename, true)
        await akasha_data.getQQYUserxiaoqie(id, inpajson, filename, true)
        e.reply(msg);
        return true;
    }
    //主动分手/甩掉对方
    async breakup(e) {
        var id = e.user_id
        var filename = e.group_id + `.json`
        var homejson = await akasha_data.getQQYUserHome(id, homejson, filename, false)
        if (await this.is_killed(e, `breakup`, false) == true) return
        if (e.msg.includes("分手") || e.msg.includes("闹离婚")) {
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
    //移除自己的银啪成员
    async nofuck(e){
        if (!e.at) {
            e.reply(`请at你不想邀请银啪的人`)
            return
        }
        var id = e.user_id
        var filename = e.group_id + `.json`
        var inpajson = await akasha_data.getQQYUserxiaoqie(id, inpajson, filename, false)
        inpajson[id].fuck = (inpajson[id].fuck).filter(item => item != e.at)//去掉老婆
        await akasha_data.getQQYUserxiaoqie(id, inpajson, filename, true)
        e.reply(`${e.at}已被你踢出了银啪!`)
    }
    //退出他人的银啪行列
    async fuckno(e){
        if (!e.at) {
            e.reply(`请at你不想加入银啪的人`)
            return
        }
        var id = e.at
        var filename = e.group_id + `.json`
        var inpajson = await akasha_data.getQQYUserxiaoqie(id, inpajson, filename, false)
        inpajson[id].fuck = (inpajson[id].fuck).filter(item => item != e.user_id)//去掉老婆
        await akasha_data.getQQYUserxiaoqie(id, inpajson, filename, true)
        e.reply(`你成功退出了${e.at}的银啪!`)
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
        var inpajson = await akasha_data.getQQYUserxiaoqie(id, inpajson, filename, false)
        //如果有人被@
        if (e.at) id = e.at
        //获取你是哪些人的老婆
        let iswife_list = []
        //遍历这个群里面所以人
        for (let j of Object.keys(homejson)) {
            //若果这个人的老婆 == id
            if (homejson[j].s == id)
                iswife_list.push(Number(j))
        }
        //你的钱,你的房子
        var msg_house = `你现在还剩下${homejson[id].money}金币\n你的住所信息为\n名字：${housejson[id].name}\n容量：${housejson[id].space}\n价值：${housejson[id].price}金币\n好感倍率：${housejson[id].loveup}`
        //你对老婆的好感
        var msg_love3 = ""
        //开头语
        var msgstart = ""
        //有老婆的
        if (homejson[id].s !== 0) {
            //用is_she函数判断下这个人是男是女
            var she_he = await this.people(e, 'sex', homejson[id].s)
            //用is_she函数获取昵称
            var name = await this.people(e, 'nickname', homejson[id].s)
            //你的老婆和好感度
            var msg_love2 = `${she_he}对你的好感度为：${homejson[id].love}\n`
            //两情相悦的
            if (iswife_list.includes(Number(homejson[id].s))) {
                let mywife = homejson[id].s
                msgstart = `两心靠近是情缘,更是吸引;\n两情相悦是喜欢,更是眷恋。\n和你两情相悦的人是${name},\n`,
                    msg_love3 = `你对${she_he}的好感为${homejson[mywife].love}\n`
                //把喜欢你的人从这个数组去除
                iswife_list.slice(iswife_list.indexOf(homejson[id].s), 1)
            }
            //不是两情相悦的的
            else {
                msgstart = `你的群友老婆是${name}\n`
            }
        }
        //单身的
        else {
            msgstart = `现在的你还是一位单身贵族，没有老婆哦\n`
            //单身的没有msg_love2，就是没有老婆
        }
        //对msg_love处理
        //喜欢你的人
        let msg_love = '喜欢你但是你不喜欢的人有：\n'
        if (!iswife_list.length == 0) {
            var notlqxyk = iswife_list.filter(item => item != Number(homejson[id].s))//去掉老婆
            for (let i of notlqxyk)
                msg_love = msg_love + `${i}\n好感度为：${homejson[i].love}\n`
            msg_love = msg_love + `快去处理一下吧\n`
        }
        else msg_love = '喜欢你但是你不喜欢的人有：\n一个也没有\n'
        //查询银啪人员
        let inpamsg = [`可以与你银啪的有\n`]
        for(let inpa of inpajson[id].fuck){
            inpamsg.push(`${inpa}\n`)
        }
        inpamsg.push(`你已经发起了${inpajson[id].fucktime}`)
        var msg = []
        //最后回复信息
        if (homejson[id].s !== 0) {
            msg.push([
                segment.at(id), "\n",
                segment.image(`https://q1.qlogo.cn/g?b=qq&s=0&nk=${[id]}`), "\n",
                msgstart,
                segment.image(`https://q1.qlogo.cn/g?b=qq&s=0&nk=${[homejson[id].s]}`), "\n",
                msg_love2,
                msg_love3,
            ])
            msg.push(msg_love)
            msg.push(msg_house)
            msg.push(inpamsg)
            Config.getforwardMsg(msg, e)
        }
        else {
            msg.push([
                segment.at(id), "\n",
                segment.image(`https://q1.qlogo.cn/g?b=qq&s=0&nk=${[id]}`), "\n",
                msgstart,
            ])
            msg.push(msg_love)
            msg.push(msg_house)
            Config.getforwardMsg(msg, e)
        }

        return true;
    }
    //打工
    async getmoney(e) {
        if (await this.is_jinbi(e) == true) return
        var id = e.user_id
        var filename = e.group_id + `.json`
        var homejson = await akasha_data.getQQYUserHome(id, homejson, filename, false)
        var battlejson = await akasha_data.getQQYUserBattle(id, battlejson, false)
        let UserPAF = battlejson[id].Privilege
        let lastTime = await redis.ttl(`akasha:wife-getmoney-cd:${e.group_id}:${e.user_id}`);
        if (lastTime !== -2 && !UserPAF) {
            e.reply([
                segment.at(e.user_id), "\n",
                `等会儿哦！(*/ω＼*)`, "\n",
                `该命令还有${lastTime / 60}分cd`
            ]);
            return
        }
        if (await this.is_killed(e, `getmoney`, false) == true) return
        await redis.set(`akasha:wife-getmoney-cd:${e.group_id}:${e.user_id}`, currentTime, {
            EX: cdTime3
        });
        homejson[id].money += Math.round(Math.random() * 100 + 100)
        if (e.is_friend) { homejson[id].money += 0.2 * Math.round(Math.random() * 100 + 100) }
        if (e.is_admin || e.is_owner) { homejson[id].money += 0.2 * Math.round(Math.random() * 100 + 100) }
        if (e.isMaster) { homejson[id].money += 0.4 * Math.round(Math.random() * 100 + 100) }
        await akasha_data.getQQYUserHome(id, homejson, filename, true)
        setTimeout(() => {
            e.reply(`恭喜你!现在你有${homejson[id].money}金币了,是管理员或者好友有金币加成哦!`)
        }, 2000);
        return true;
    }
    //看房
    async gethouse(e) {
        var housething = JSON.parse(fs.readFileSync(housepath, "utf8"));//读取文件
        var msg = '欢迎光临\n请过目\n'
        for (let i of Object.keys(housething)) {
            msg += `id: ${i}\n${housething[i].name}\n容量: ${housething[i].space}\n价格: ${housething[i].price}\n好感增幅: ${housething[i].loveup}\n`
        }
        e.reply(msg)
        return true
    }
    //买房,可以给别人买
    async buyhouse(e) {
        var housething = JSON.parse(fs.readFileSync(housepath, "utf8"));//读取文件
        var id = e.user_id
        var filename = e.group_id + `.json`
        var homejson = await akasha_data.getQQYUserHome(id, homejson, filename, false)
        var housejson = await akasha_data.getQQYUserHouse(id, housejson, filename, false)
        var msg = e.msg.replace(/(买房|#)/g, "").replace(/[\n|\r]/g, "，").trim()
        if (homejson[id].money < housething[msg].price) {
            e.reply(`金币不足`)
            return
        }
        if (await this.is_killed(e, 'buyhouse', true) == true) return
        if (e.at) id = e.at
        homejson[e.user_id].money -= housething[msg].price
        housejson[id].space += housething[msg].space
        housejson[id].loveup += housething[msg].loveup
        housejson[id].price += housething[msg].price
        await akasha_data.getQQYUserHome(id, homejson, filename, true)
        await akasha_data.getQQYUserHouse(id, housejson, filename, true)
        e.reply(`购买成功,你本次为${id}消费${housething[msg].price}金币`)
        return true;
    }
    //住所改名
    async namedhouse(e) {
        var id = e.user_id
        var filename = e.group_id + `.json`
        var homejson = await akasha_data.getQQYUserHome(id, homejson, filename, false)
        var housejson = await akasha_data.getQQYUserHouse(id, housejson, filename, false)
        var msg = e.msg.replace(/(住所改名|#)/g, "").replace(/[\n|\r]/g, "，").trim()
        var shifu = housejson[id].space * 10
        if (homejson[id].money < shifu) {
            e.reply(`金币不足,需要${shifu}金币`)
            return
        }
        homejson[id].money -= shifu
        housejson[id].name = msg
        await akasha_data.getQQYUserHome(id, homejson, filename, true)
        await akasha_data.getQQYUserHouse(id, housejson, filename, true)
        e.reply(`改名"${msg}"成功`)
        return true;
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
        var battlejson = await akasha_data.getQQYUserBattle(id, battlejson, false)
        let UserPAF = battlejson[id].Privilege
        let lastTime = await redis.ttl(`akasha:wife-gift-cd:${e.group_id}:${e.user_id}`);
        if (lastTime !== -2 && !UserPAF) {
            e.reply([
                segment.at(e.user_id), "\n",
                `等会儿哦！(*/ω＼*)`, "\n",
                `该命令还有${lastTime / 60}分cd`
            ]);
            return
        }
        if (placejson[id].place !== "home") {
            e.reply([
                segment.at(id), "\n",
                `你不在家,不能进行逛街,当前位置为：${placejson[id].place}`
            ])
            return
        }
        if (await this.is_killed(e, 'gift', true) == true) { return }
        var placeid = Math.round(Math.random() * (Object.keys(giftthing.placename).length - 1))//随机获取一个位置id
        var placemsg = giftthing.start[placeid + 1]//获取消息
        e.reply([
            segment.at(id), "\n",
            `${placemsg}\n`,
            `你选择[进去看看]还是[去下一个地方]?`
        ])
        placejson[id].place = giftthing.placename[placeid]
        await akasha_data.getQQYUserPlace(id, placejson, filename, true)//保存位置
        await redis.set(`akasha:wife-gift-cd:${e.group_id}:${e.user_id}`, currentTime, {
            EX: cdTime5
        });
        return true;
    }
    //逛街事件结束
    async gift_continue(e) {
        if (await this.is_jinbi(e) == true) return
        if (await this.is_MAXEX(e, 'gift') == true) return
        var id = e.user_id
        var filename = e.group_id + `.json`
        var homejson = await akasha_data.getQQYUserHome(id, homejson, filename, false)
        var placejson = await akasha_data.getQQYUserPlace(id, placejson, filename, false)
        var housejson = await akasha_data.getQQYUserHouse(id, housejson, filename, false)
        if (homejson[e.user_id].money <= 0) {
            e.reply(`金币都没了,还是别进去了吧`)
            return
        }
        var giftthing = JSON.parse(fs.readFileSync(giftpath, "utf8"));//读取位置资源文件
        if (placejson[id].place == "home") {
            e.reply([
                segment.at(id), "\n",
                `你在家,先逛街出去吧`
            ])
            return
        }
        if (homejson[id].s == 0) {//如果json中不存在该用户或者老婆s为0
            e.reply(`醒醒,你还在这里没有老婆!!`)
            return
        }
        if (placejson[id].place == "any")
            return
        if (await this.is_killed(e, 'gift', true) == true) { return }
        var userplacename = placejson[id].place//获取玩家位置名A
        var placemodle = giftthing[userplacename]//获取位置资源中的位置A的数据B
        var placeid = Math.round(Math.random() * (Object.keys(placemodle).length - 1) + 1)//随机从B中选择一个位置id
        var placemsg = placemodle[placeid].msg//获取消息
        e.reply(`${placemsg}`)
        placejson[id].place = "any"
        placejson[id].placetime++
        homejson[id].money += placemodle[placeid].money
        homejson[id].love += Math.round(placemodle[placeid].love * housejson[id].loveup)
        setTimeout(() => {
            e.reply([
                segment.at(id), "\n",
                `恭喜你,你本次的行动结果为,金币至${homejson[id].money},好感度至${homejson[id].love}\n你可以选择[去下一个地方]或者[回家]\n当前剩余行动点${gifttime - placejson[id].placetime}`
            ])
        }, 2000)
        await akasha_data.getQQYUserHome(id, homejson, filename, true)
        await akasha_data.getQQYUserPlace(id, placejson, filename, true)//保存位置
        if (await this.is_fw(e, homejson) == true) return
        return true;
    }
    //逛街事件继续
    async gift_over(e) {
        if (await this.is_jinbi(e) == true) return
        var id = e.user_id
        var filename = e.group_id + `.json`
        var homejson = await akasha_data.getQQYUserHome(id, homejson, filename, false)
        var placejson = await akasha_data.getQQYUserPlace(id, placejson, filename, false)
        var giftthing = JSON.parse(fs.readFileSync(giftpath, "utf8"));//读取位置资源文件
        if (placejson[id].place == "home") {
            e.reply([
                segment.at(id), "\n",
                `你在家,先逛街出去吧`
            ])
            return
        }
        if (await this.is_killed(e, 'gift', true) == true) { return }
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
    //回家
    async gohome(e) {
        if (await this.is_jinbi(e) == true) return
        var id = e.user_id
        var filename = e.group_id + `.json`
        var placejson = await akasha_data.getQQYUserPlace(id, placejson, filename, false)
        if (placejson[id].place == "home") {
            e.reply([
                segment.at(id), "\n",
                `你已经在家了`
            ])
            return
        }
        if (await this.is_killed(e, 'gohome', true) == true) { return }
        e.reply([
            segment.at(id), "\n",
            `你回到了家`
        ])
        placejson[id].place = "home"
        placejson[id].placetime = 0
        await akasha_data.getQQYUserPlace(id, placejson, filename, true)//保存位置
        return true;
    }
    //买虚空彩球
    async lottery1(e) {
        var id = e.user_id
        let myRBB = await redis.keys(`akasha:wife-lottery1:${e.group_id}:${id}:*`, (err, data) => { });
        myRBB = myRBB.toString().split(":")
        if (myRBB.length == 7) {
            e.reply([
                segment.at(id), "\n",
                `你买过了`
            ])
            return
        }
        var battlejson = await akasha_data.getQQYUserBattle(id, battlejson, false)
        let UserPAF = battlejson[id].Privilege
        let lastTime = await redis.ttl(`akasha:wife-lottery1-cd:${e.group_id}:${id}`);
        if (lastTime !== -2 && !UserPAF) {
            e.reply([
                segment.at(e.user_id), "\n",
                `等会儿哦！(*/ω＼*)`, "\n",
                `该命令还有${lastTime / 60}分cd`
            ]);
            return
        }
        var filename = e.group_id + `.json`
        var homejson = await akasha_data.getQQYUserHome(id, homejson, filename, false)
        var placejson = await akasha_data.getQQYUserPlace(id, placejson, filename, false)
        if (placejson[id].place !== "SportsLottery") {
            e.reply([
                segment.at(id), "\n",
                `你不在游乐场店周围,当前位置为：${placejson[id].place}`
            ])
            return
        }
        var msg = e.msg.replace(/(获取虚空彩球|#)/g, "").replace(/[\n|\r]/g, "")
        var haoma = msg.split(" ")
        var redball = haoma.slice(0, -1)
        var blueball = haoma[6]
        console.log(haoma)
        console.log(redball)
        console.log(blueball)
        if (blueball > 16 || redball.length !== new Set(redball).size) {
            e.reply(`输入有误,篮球不能超过16,红球不能含有重复号码`)
            return
        }
        for (var b = 0; b < haoma.length; b++) {
            if (haoma[b] > 33 || haoma[b] == '00') {
                e.reply(`输入有误,红球号码不能超过33,号码不能为00`)
                return
            }
        }
        if (homejson[id].money < 300)
            return e.reply(`金币不足,需要300金币`)
        let buytime = `${new Date().getFullYear()}-${new Date().getMonth() + 1}-${new Date().getDate()}`
        let ssqdata = `红${redball.toString()}蓝${blueball}时间${buytime}`
        console.log(`${id}获取虚空彩球${ssqdata}`)
        await redis.set(`akasha:wife-lottery1:${e.group_id}:${id}:${redball.toString()}:${blueball}:${buytime}`, currentTime, {
            EX: 86400
        });
        homejson[id].money -= 300
        await akasha_data.getQQYUserHome(id, homejson, filename, true)
        await redis.set(`akasha:wife-lottery1-cd:${e.group_id}:${id}`, currentTime, {
            EX: cdTime8
        });
        e.reply(`你选择了${ssqdata}`)
        return true;
    }
    //看看自己的虚空彩球
    async readRBB(e) {
        let myRBB = await redis.keys(`akasha:wife-lottery1:${e.group_id}:${e.user_id}:*`, (err, data) => { });
        myRBB = myRBB.toString().split(":")
        console.log(myRBB)
        switch (myRBB.length) {
            case 1:
                e.reply(`你还没买或已过期`)
                break
            case 7:
                e.reply(`你的虚空彩球为红球${myRBB[4]},蓝球${myRBB[5]},购买时间${myRBB[6]},有效期24小时`)
                break
            default:
                e.reply(`存在错误数据,请联系管理者[清除老婆数据]`)
        }
        return true;
    }
    //兑换虚空彩球
    async useRBB(e) {
        var id = e.user_id
        var filename = e.group_id + `.json`
        var homejson = await akasha_data.getQQYUserHome(id, homejson, filename, false)
        var AmyRBB = await redis.keys(`akasha:wife-lottery1:${e.group_id}:${e.user_id}:*`, (err, data) => { });
        var myRBB = AmyRBB.toString().split(":")
        if (myRBB.length == 1) {
            e.reply(`你还没买或已过期`)
            return
        }
        if (myRBB.length == 7) {
            var trueRBBjson = JSON.parse(fs.readFileSync(lotterypath, "utf8"));//读取文件
            let title = "RBB"
            var trueR = (trueRBBjson[title].redball).toString().split(",")
            var trueB = trueRBBjson[title].blueball
            var trueTime = trueRBBjson[title].time
            console.log(trueR)
            console.log(trueB)
            var lastR = []
            var myR = myRBB[4].split(",")
            console.log(myR)
            var myB = myRBB[5].toString()
            console.log(myB)
            var mytime = myRBB[6]
            console.log(`购买时间${mytime}当前开奖时间${trueTime}`)
            if (mytime !== trueTime)
                return e.reply(`未开奖或已过期`)
            trueR.some(function (i) {
                if (myR.includes(i))
                    lastR.push(i)
            })
            console.log(lastR)
            switch (lastR.length) {
                case 6:
                    if (myB == trueB) {
                        e.reply(`恭喜你!!!获得一等奖50万金币!!!`)
                        homejson[id].money += 5000000
                    }
                    else {
                        homejson[id].money += 200000
                        e.reply(`恭喜你!!!获得二等奖20万金币!!!`)
                    }
                    break
                case 5:
                    if (myB == trueB) {
                        e.reply(`恭喜你!!!获得三等奖5万金币!!!`)
                        homejson[id].money += 50000
                    }
                    else {
                        homejson[id].money += 20000
                        e.reply(`恭喜你!!!获得四等奖2万金币!!!`)
                    }
                    break
                case 4:
                    if (myB == trueB) {
                        e.reply(`恭喜你!!!获得四等奖2万金币!!!`)
                        homejson[id].money += 20000
                    }
                    else {
                        homejson[id].money += 1000
                        e.reply(`恭喜你!!!获得五等奖1千金币!!!`)
                    }
                    break
                case 3:
                    if (myB == trueB) {
                        e.reply(`恭喜你!!!获得五等奖1千金币!!!`)
                        homejson[id].money += 1000
                    }
                    else {
                        homejson[id].money += 6
                        e.reply(`安慰奖6个金币!`)
                    }
                    break
                case 2:
                    if (myB == trueB) {
                        e.reply(`恭喜你!!!获得六等奖5百金币!!!`)
                        homejson[id].money += 500
                    }
                    else {
                        homejson[id].money += 6
                        e.reply(`安慰奖6个金币!`)
                    }
                    break
                case 1:
                    if (myB == trueB) {
                        e.reply(`恭喜你!!!获得六等奖5百金币!!!`)
                        homejson[id].money += 500
                    }
                    else {
                        homejson[id].money += 6
                        e.reply(`安慰奖6个金币!`)
                    }
                    break
                default:
                    e.reply(`一个也没中`)
            }
            await akasha_data.getQQYUserHome(id, homejson, filename, true)
        }
        else {
            e.reply(`存在错误数据,请联系管理者[清除老婆数据]`)
        }
        await redis.del(AmyRBB);
        e.reply(`成功兑换,请查看你的信息`)
        return true;
    }
    //抱抱,有千分之一的概率被干掉
    async touch(e) {
        if (await this.is_jinbi(e) == true) return
        var id = e.user_id
        var filename = e.group_id + `.json`
        var homejson = await akasha_data.getQQYUserHome(id, homejson, filename, false)
        var housejson = await akasha_data.getQQYUserHouse(id, housejson, filename, false)
        if (await this.is_killed(e, 'touch', false) == true) { return }
        if (e.atme || e.atall) {
            e.reply(`不可以这样！`)
            return
        }
        if (homejson[id].s == 0) {//如果json中不存在该用户或者老婆s为0
            e.reply(`醒醒,你还在这里没有老婆!!`)
            return
        }
        if (e.at && e.at != homejson[id].s) {
            e.reply(`醒醒,这不是你老婆!!!`)
            return
        }
        var battlejson = await akasha_data.getQQYUserBattle(id, battlejson, false)
        let UserPAF = battlejson[id].Privilege
        let lastTime = await redis.ttl(`akasha:wife-touch-cd:${e.group_id}:${e.user_id}`);
        if (lastTime !== -2 && !UserPAF) {
            e.reply([
                segment.at(e.user_id), "\n",
                `等会儿哦！(*/ω＼*)`, "\n",
                `该命令还有${lastTime / 60}分cd`
            ]);
            return
        }
        await redis.set(`akasha:wife-touch-cd:${e.group_id}:${e.user_id}`, currentTime, {
            EX: cdTime4
        });
        homejson[id].love += Math.round((Math.random() * 30 + 45) * housejson[id].loveup)
        await akasha_data.getQQYUserHome(id, homejson, filename, true)
        e.reply(`恭喜你,你老婆对你的好感上升到了${homejson[id].love}!`)
        return true;
    }
    //查看本群所有cp
    async cplist(e) {
        var id = e.user_id
        var filename = e.group_id + `.json`
        var homejson = await akasha_data.getQQYUserHome(id, homejson, filename, false)
        let msg = [`群全部cp:`]
        let memberMap = await e.group.getMemberMap();
        let arrMember = Array.from(memberMap.values());
        let idlist = []
        let namelist = []
        for (let i = 0; i < arrMember.length; i++) {
            idlist[i] = arrMember[i].user_id
            namelist[arrMember[i].user_id] = arrMember[i].nickname
            if (arrMember[i].card !== '')
                namelist[arrMember[i].user_id] = arrMember[i].card
        }
        //我这里的做法是，把user_id和nickname格外取出来，因为arrMember里面是按照顺序排列的，不能使用arrMember[id]
        for (let i of Object.keys(homejson)) {
            if (idlist.includes(homejson[i].s)) {
                var she_he = await this.people(e, 'sex', Number(i))
                msg.push([
                    `[${namelist[i]}]`,
                    segment.image(`https://q1.qlogo.cn/g?b=qq&s=0&nk=${[i]}`),
                    `和${she_he}的老婆[${namelist[homejson[i].s]}]`,
                    segment.image(`https://q1.qlogo.cn/g?b=qq&s=0&nk=${[homejson[i].s]}`)
                ])
            }
        }
        // 转发发送
        let forwardMsg = msg
        Config.getforwardMsg(forwardMsg, e)
        return true;
    }
    //500以内可以领取低保
    async poor(e) {
        var id = e.user_id
        var battlejson = await akasha_data.getQQYUserBattle(id, battlejson, false)
        let UserPAF = battlejson[id].Privilege
        let lastTime = await redis.ttl(`akasha:wife-poor-cd:${e.group_id}:${id}`);
        if (lastTime !== -2 && !UserPAF) {
            e.reply([
                segment.at(id), "\n",
                `等会儿哦！(*/ω＼*)`, "\n",
                `该命令还有${lastTime / 60}分cd`
            ]);
            return
        }
        var filename = e.group_id + `.json`
        var homejson = await akasha_data.getQQYUserHome(id, homejson, filename, false)
        if (homejson[id].money < 500) {
            homejson[id].money += 500
            e.reply(`成功领取500金币`)
            await akasha_data.getQQYUserHome(id, homejson, filename, true)
            await redis.set(`akasha:wife-poor-cd:${e.group_id}:${id}`, currentTime, {
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
        var id2 = homejson[id].s
        homejson = await akasha_data.getQQYUserHome(id2, homejson, filename, false)  //给老婆创建存档
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
                ])
                homejson[id].money -= shifu
                homejson[id2].money += yingfu
                homejson[id].love += Math.round((yingfu / 10) * housejson[id].loveup)
                akasha_data.getQQYUserHome(id, homejson, filename, true)
                akasha_data.getQQYUserHome(id2, homejson, filename, true)
            }
        }, 1500)
        return true;
    }
    //清除所有人的本插件redis数据或者指定某个人的
    async delREDIS(e) {
        if (e.isMaster) {
            let cddata = await redis.keys(`akasha:*:${e.group_id}:*`, (err, data) => { });
            if (e.at) {
                cddata = await redis.keys(`akasha:*:${e.group_id}:${e.at}`, (err, data) => { });
                e.reply(`成功重置${e.at}的时间`)
            }
            else {
                e.reply(`成功清除本群所有人的的时间`)
            }
            await redis.del(cddata);
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
        var inpajson = await akasha_data.getQQYUserxiaoqie(id, inpajson, filename, false)
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
            var she_he = '她'
            if (lp.sex == 'male')
                she_he = '他'
            return she_he
        }
        if (keys == 'nickname') {
            var name = lp.nickname
            if (lp.card !== '')
                name = lp.card
            return name
        }

    }
    //看看你是不是在关禁闭
    async is_jinbi(e) {
        let jinbi = await redis.ttl(`akasha:wife-jinbi-cd:${e.group_id}:${e.user_id}`);
        if (jinbi !== -2) {
            e.reply([
                segment.at(e.user_id), "\n",
                `你已经被关进禁闭室了!!!时间到了自然放你出来\n你还需要被关${jinbi / 60}分钟`
            ])
            return true
        }
        return false
    }
    //看看你会不会被干掉,key是事件名称,globaldeath是全局千分之一死亡
    async is_killed(e, keys, globaldeath) {
        var id = e.user_id
        var filename = e.group_id + `.json`
        var homejson = await akasha_data.getQQYUserHome(id, homejson, filename, false)
        var housejson = await akasha_data.getQQYUserHouse(id, housejson, filename, false)
        let kill = Math.round(Math.random() * 999)
        if (kill == 6 && globaldeath) {
            e.reply([`触发千分之一的概率事件!!!,\n`,
                `很遗憾的告诉你,发生了意外,你失去了你所有的金币你的住所...失去了你的老婆...真是离谱(划掉)遗憾啊,\n`, "\n",
                `你,是否愿意重来呢?`, "\n",
                `即使,金钱,好感...一切都要重新开始吗?`, "\n",
                `做出你的选择吧!`
            ])
            homejson[id].money = 0
            homejson[id].love = 0
            homejson[id].s = 0
            housejson[id].price = 0
            housejson[id].space = 0
            housejson[id].loveup = 1
            await akasha_data.getQQYUserHome(id, homejson, filename, true)
            await akasha_data.getQQYUserHouse(id, housejson, filename, true)
            return true
        }
        if (keys == "buyhouse" && kill < 10) {
            homejson[id].money = 0
            await akasha_data.getQQYUserHome(id, homejson, filename, true)
            e.reply([
                `很遗憾的告诉你,\n`,
                `你被骗的苦茶子都没了`
            ])
            return true
        }
        if (keys == "getmoney") {
            if (kill < 300) {
                homejson[id].money += 100
                e.reply(`老板看你挺卖力,发了100奖金给你`)
            }
            if (kill >= 600) {
                homejson[id].money -= 50
                e.reply(`摸鱼被发现了,罚款50`)
            }
            await akasha_data.getQQYUserHome(id, homejson, filename, true)
        }
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
    //判断行为次数是否上限
    async is_MAXEX(e, keys) {
        var id = e.user_id
        var filename = e.group_id + `.json`
        var placejson = await akasha_data.getQQYUserPlace(id, placejson, filename, false)
        if (placejson[e.user_id].placetime >= gifttime && keys == 'gift') {
            e.reply(`单次逛街行动上限,你回了家`)
            placejson[id].place = "home"
            placejson[id].placetime = 0
            await akasha_data.getQQYUserPlace(id, placejson, filename, true)
            return true
        }
        else return false;
    }
    //抢老婆决斗
    async duel(e) {
        console.log("用户命令：", e.msg);
        let user_id = e.user_id;
        let user_id2 = e.at; //获取当前at的那个人
        var battlejson = await akasha_data.getQQYUserBattle(user_id, battlejson, false)
        var battlejson = await akasha_data.getQQYUserBattle(user_id2, battlejson, false)
        let level = battlejson[user_id].level
        let level2 = battlejson[user_id2].level
        let user_id2_nickname = null
        for (let msg of e.message) { //赋值给user_id2_nickname
            if (msg.type === 'at') {
                user_id2_nickname = msg.text//获取at的那个人的昵称
                break;
            }
        }
        if (!level)
            level = 0
        if (!level2)
            level2 = 0
        let filename1 = `${user_id}.json`;
        let filename2 = `${user_id2}.json`;
        let num13 = 0
        let num14 = 0
        let num15 = 0
        let num23 = 0
        let num24 = 0
        let num25 = 0
        if (fs.existsSync(dirpath2 + "/" + filename1)) {
            var json1 = JSON.parse(fs.readFileSync(dirpath2 + "/" + filename1, "utf8"));
            if (json1.hasOwnProperty(3))
                num13 = Object.keys(json1[3]).length
            if (json1.hasOwnProperty(4))
                num14 = Object.keys(json1[4]).length
            if (json1.hasOwnProperty(5))
                num15 = Object.keys(json1[5]).length
        }
        if (fs.existsSync(dirpath2 + "/" + filename2)) {
            var json2 = JSON.parse(fs.readFileSync(dirpath2 + "/" + filename2, "utf8"));
            if (json2.hasOwnProperty(3))
                num23 = Object.keys(json2[3]).length
            if (json2.hasOwnProperty(4))
                num24 = Object.keys(json2[4]).length
            if (json2.hasOwnProperty(5))
                num25 = Object.keys(json2[5]).length
        }
        //读取文件
        var win_level = level - level2
        let win = 50 + Magnification * win_level + num13 + num14 * 2 + num15 * 3 - num23 - num24 * 2 - num25 * 3
        let random = Math.random() * 100//禁言随机数
        //提示
        e.reply([segment.at(e.user_id),
        `你的境界为${battlejson[user_id].levelname}\n${user_id2_nickname}的境界为${battlejson[user_id2].levelname}\n决斗开始!战斗力意义系数${Magnification},境界差${win_level},你的获胜概率是${win}`]);//发送消息
        //判断
        let is_win = false
        if (win > random) {//判断是否成功
            is_win = true
        }
        return is_win;
    }
    //删除错误存档
    async delerrdata(e) {
        var id = e.user_id
        var filename = e.group_id + `.json`
        var homejson = await akasha_data.getQQYUserHome(id, homejson, filename, false)
        let wifearr = []//所有人的的老婆
        //找出所有人的老婆,转为String型
        for (let data of Object.keys(homejson)) {
            if (await homejson[data].s !== 0)
                wifearr.push(String(homejson[data].s))
        }
        console.log(`所有人的老婆`, wifearr)
        let memberMap = await e.group.getMemberMap();
        let arrMember = []
        for (let aaa of memberMap) {
            arrMember.push(String(aaa[1].user_id))
        }
        console.log(`群成员`, arrMember)
        //找出不在群的老婆
        let deadwife = wifearr.filter(item => !arrMember.includes(item))
        console.log(`不在的老婆`, deadwife)
        //找出这些已退群的老婆的拥有者
        let widedeadid = Object.keys(homejson).filter(item => deadwife.includes(String(homejson[item].s)))
        console.log(`这些老婆的拥有者`, widedeadid)
        //找出不在群的用户
        let deadid = Object.keys(homejson).filter(item => !arrMember.includes(item))
        console.log(`不在群的用户`, deadid)
        let chick = 0
        //把老婆跑了的用户老婆删除
        for (let shit of widedeadid) {
            homejson[shit].s = 0
            chick++
        }
        //删掉不在群的用户
        let ikun = 0
        for (let errid of deadid) {
            delete (homejson[errid])
            ikun++
        }
        await akasha_data.getQQYUserHome(id, homejson, filename, true)
        e.reply(`清除本群无效/错误存档成功,\n本次共错误退群存档${ikun}个,\n删除错误的老婆${chick}位`)
        return true
    }
}