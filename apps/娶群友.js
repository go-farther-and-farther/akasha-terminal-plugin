//随便写的,大佬勿喷 初版@鸢:随机娶群友，指定娶群友
//1.1.0优化版@尘埃未定:添加我愿意/我拒绝的对象判定，修复bug，66到69行为单次只能主持一场的限制
//1.1.1修复部分描述错误
//1.1.2增加强娶,增加成功与失败的概率
//1.2保存老婆,添加分手和查看老婆功能,仅对强娶与指定娶有效
//1.2.1修复误触,所有娶群友方式都会记录保存,添加甩掉功能
//1.2.2修复恶劣bug，增加存档创建指令，画饼金钱与好感
/*
有事找大佬们,没事找我2113752439
有什么新的建议可以提出来
*/
import plugin from '../../../lib/plugins/plugin.js'
import fs from 'fs'
import cfg from '../../../lib/config/config.js'
import {segment} from "oicq";
import sex from "oicq";
import moment from "moment"
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
const cdTime = 10*60 //wifecd时间,默认为10分钟
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
                reg: "^#?娶群友$",//随机娶一位群友
				/** 执行方法 */
				fnc: 'Wife'
				},
                {
                /** 命令正则匹配 */
                reg: '^#?(创建老婆|我也要娶群友|你们都是我老婆|加入群老婆)$', //加载老婆存档
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
                reg: '^#?(闹离婚|甩掉)', //娶过老婆的需要分手才可以继续娶老婆,甩掉at的人可以把你从他的老婆里移除掉
                /** 执行方法 */
                fnc: 'fs'
                },
                {
                /** 命令正则匹配 */
                reg: '^#?我的群友老婆$', //看看自己老婆是谁
                /** 执行方法 */
                fnc: 'read'
                }
                ]
        })
    }
async creat(e){
    var data = {
    "s": 0,
    "wait": 0,
    "money": 100,
    "love": 0
    }
    var id = e.user_id
    var json = JSON.parse(fs.readFileSync(dirpath + "/" + filename, "utf8"));//读取文件
    if(!json.hasOwnProperty(id)) {//如果json中不存在该用户
        json[id] = data
        fs.writeFileSync(dirpath + "/" + filename, JSON.stringify(json, null, "\t"));//写入文件
        e.reply("创建成功。你可以使用娶老婆。娶@，强娶@等功能了")
        return
    }
    e.reply(`你已经有老婆存档了`)
    return true;
}
async wife2(e) {
    console.log(e)
    var id = e.user_id
    var json = JSON.parse(fs.readFileSync(dirpath + "/" + filename, "utf8"));//读取文件
    if(!json.hasOwnProperty(id)) {//如果json中不存在该用户
        e.reply("你还没有老婆存档。使用 #创建老婆 来加载吧")
        return
    }
    if(!e.at && !e.atme){
        e.reply("请at你的情人哦")
        return
    }
    if (e.atme || e.atall){
        e.reply("不可以这样！")
        return
    }
    let lastTime = await redis.get(`potato:whois-my-wife-cd:${e.user_id}`);
    let masterList = cfg.masterQQ
    if (lastTime && !masterList.includes(e.user_id)) {
        const seconds = moment(currentTime).diff(moment(lastTime), 'seconds')
        let tips = [
            segment.at(e.user_id), "\n",
            `等会儿哦！(*/ω＼*)`, "\n",
            `冷却中：${cdTime-seconds}s`
        ]
        e.reply(tips);
        return
    }
    let sex=await Bot.pickFriend(e.user_id).sex
    let ex=''
    if(sex=='male'){
        ex='小姐'
    }
    else if (sex=='female'){
        ex='先生'
    }
    if(!json[id].s == 0){
        e.reply("你似乎已经有爱人了,要不分手?")
        return
    }
    if(e.msg.includes("强娶")){
        var gailv = Math.round(Math.random() * 9); 
        if(gailv>=7){
            json[id].s = e.at
            e.reply([
                segment.at(id),"\n",
                segment.image(`https://q1.qlogo.cn/g?b=qq&s=0&nk=${id}`), "\n",
                `恭喜你！`,"\n",
                `在茫茫人海中，你成功强娶到了${e.at}!`,
                "\n",segment.image(`https://q1.qlogo.cn/g?b=qq&s=0&nk=${e.at}`), "\n",
            ])
            fs.writeFileSync(dirpath + "/" + filename, JSON.stringify(json, null, "\t"));//写入文件
            await redis.set(`potato:whois-my-wife-cd:${e.user_id}`, currentTime, {
            EX: cdTime
            });
        }
        else if(gailv<7){
            e.reply("很遗憾,你没能成功将对方娶走")
            await redis.set(`potato:whois-my-wife-cd:${e.user_id}`, currentTime, {
            EX: cdTime
            });
        }
        return
    }
    e.reply([
    segment.at(e.at),"\n",
    segment.image(`https://q1.qlogo.cn/g?b=qq&s=0&nk=${e.at}`), "\n",
    segment.at(id),"\n",
    segment.image(`https://q1.qlogo.cn/g?b=qq&s=0&nk=${id}`), "\n",
    `向你求婚：‘亲爱的${ex}您好！`,"\n",
    `在茫茫人海中，能够与${ex}相遇相知相恋，我深感幸福，守护你是我今生的选择，我想有个自己的家，一个有你的家,嫁给我好吗？’`,"\n",
    segment.at(e.at),"\n",
    `那么这位${ex}，你愿意嫁给ta吗？at并发送【我愿意】或者【我拒绝】，回应对方哦！`,
    ])
    json[id].wait = e.at
    fs.writeFileSync(dirpath + "/" + filename, JSON.stringify(json, null, "\t"));//写入文件
    return true;
}
async yy(e) {
    if(e.atme || e.atall){
        e.reply("6🙂")
        return
    }
    if(!e.at){
        e.reply("请at你愿意嫁给的人哦(˵¯͒〰¯͒˵)")
        return
    }
    var id = e.at
    var json = JSON.parse(fs.readFileSync(dirpath + "/" + filename, "utf8"));//读取文件
    var fk = json[id].wait
    if(fk===e.user_id){
        e.reply([
        segment.at(e.user_id),"\n",
        segment.at(id),"\n",
        '相亲相爱幸福永，同德同心幸福长。愿你俩情比海深！祝福你们新婚愉快，幸福美满，激情永在，白头偕老！',
        ])
        json[id].s = e.user_id
        json[id].wait = 0
        fs.writeFileSync(dirpath + "/" + filename, JSON.stringify(json, null, "\t"));//写入文件
        return
    }
    e.reply(`你不是${json[id].wait},就不要捣乱了`)
    return true;
}
async jj(e) {
    if(e.atme || e.atall){
        e.reply("6🙂")
        return
    }
    if(!e.at){
        e.reply("请at你想拒绝的人哦(˵¯͒〰¯͒˵)")
        return
    }
    var id = e.at
    var json = JSON.parse(fs.readFileSync(dirpath + "/" + filename, "utf8"));//读取文件
    var fk = json[id].wait
    if(fk===e.user_id){
        e.reply([
        segment.at(id),"\n",
        '天涯何处无芳草，何必单恋一枝花，下次再努力点吧！(˵¯͒〰¯͒˵)',
        ])
        json[id].wait = 0
        fs.writeFileSync(dirpath + "/" + filename, JSON.stringify(json, null, "\t"));//写入文件
        return
    }
    e.reply(`你不是${json[id].wait},就不要捣乱了`)
    return true;
}
async Wife(e) {
    var id = e.user_id
    var json = JSON.parse(fs.readFileSync(dirpath + "/" + filename, "utf8"));//读取文件
    if(!json.hasOwnProperty(id)) {//如果json中不存在该用户
        e.reply("你还没有老婆存档。使用 #创建老婆 来加载吧")
        return
    }
    if(!json[id].s == 0){
        e.reply("你似乎已经有爱人了,要不分手?")
        return
    }
    let lastTime = await redis.get(`potato:whois-my-wife-cd:${e.user_id}`);
    let masterList = cfg.masterQQ
    if (lastTime && !masterList.includes(e.user_id)) {
        const seconds = moment(currentTime).diff(moment(lastTime), 'seconds')
        let tips = [
            segment.at(e.user_id), "\n",
            `等会儿哦！(*/ω＼*)`, "\n",
            `冷却中：${cdTime-seconds}s`
        ]
        e.reply(tips);
        return
    }
    let sex='female'
    if (await Bot.pickFriend(e.user_id).sex=='female'){
        sex='male'
    }
    let memberMap = await e.group.getMemberMap();
    let arrMember = Array.from(memberMap.values());
    const femaleList=arrMember.filter(item=>{
        return item.sex==sex
    })
    if (femaleList.length<2){
       const unknownList=arrMember.filter(item=>{
           return item.sex=='unknown'
       })
        unknownList.map(item=>{
            femaleList.push(item)
        })

    }
    var gailv = Math.round(Math.random() * 9); 
    let wife = {}
    console.log(wife);
    for (let i = 0; i < 2; i++) {
        const random = Math.round(Math.random() * (femaleList.length - 1))
        wife = femaleList[random];
            break;
    }
    console.log(wife);
    let msg = []
    if (gailv >= 4) {
        let sexStr =''
        if(wife.sex=='male'){
            sexStr='男'
        }
        else if (wife.sex=='female'){
            sexStr='女'
        }
        console.log(wife);
        let cp = sexStr
        let py =''
        if(wife.sex=='male'){
            py='他'
        }
        else if (wife.sex=='female'){
            py='她'
        }
        msg = [
            segment.at(e.user_id),"\n",
            `${wife.nickname}答应了你哦！(*/ω＼*)`,"\n",
            `今天你的${cp}朋友是`, "\n", segment.image(`https://q1.qlogo.cn/g?b=qq&s=0&nk=${wife.user_id}`), "\n",
            `【${wife.nickname}】 (${wife.user_id}) `, "\n",
            `来自【${e.group_name}】`,"\n",
            `要好好对待${py}哦！`,
        ]
        json[id].s = wife.user_id
        fs.writeFileSync(dirpath + "/" + filename, JSON.stringify(json, null, "\t"));//写入文件
        await redis.set(`potato:whois-my-wife-cd:${e.user_id}`, currentTime, {
        EX: cdTime
        });
    }
    else if(gailv<4){
        msg = [
            segment.at(e.user_id), "\n",
            `好遗憾，你谁也没娶到,不要灰心,待会再来一次吧!`
        ]
        await redis.set(`potato:whois-my-wife-cd:${e.user_id}`, currentTime, {
        EX: cdTime
        });
    }
    e.reply(msg);
    return true;
}
async fs(e){
    var id = e.user_id
    var json = JSON.parse(fs.readFileSync(dirpath + "/" + filename, "utf8"));//读取文件
    if(e.msg.includes("闹离婚")){
        if(!json.hasOwnProperty(id)) {//如果json中不存在该用户
            e.reply("你还没有老婆存档。使用 #创建老婆 来加载吧")
            return
        }
        if(json[id].s==0) {//如果json中不存在该用户或者老婆s为0
            e.reply("醒醒,你根本没有老婆!!")
            return
        }
        json[id].s = 0
        fs.writeFileSync(dirpath + "/" + filename, JSON.stringify(json, null, "\t"));//写入文件
        e.reply("成功分手!,现在你可以去娶下一个老婆了(呸!渣男..￣へ￣)")
        return
    }
    if(!e.at){
        e.reply("请顺带at你想要甩掉的人(怎么会有强娶这种设定?(っ °Д °;)っ)")
        return
    }
    if(e.atme || e.atall){
        e.reply("6🙂")
        return
    }
    id = e.at
    var cnm = e.user_id
    if(json[id].s === cnm){
        json[id].s = 0
        fs.writeFileSync(dirpath + "/" + filename, JSON.stringify(json, null, "\t"));//写入文件
        e.reply(`成功把对方甩掉!,对方差点哭死...,`)
        return
    }
    e.reply("你不是对方老婆或对方根本没老婆")
    return true;
}
async read(e){
    var id = e.user_id
    var json = JSON.parse(fs.readFileSync(dirpath + "/" + filename, "utf8"));//读取文件
    if(!json.hasOwnProperty(id)) {//如果json中不存在该用户
        e.reply("你还没有老婆存档。使用 #创建老婆 来加载吧")
        return
    }
    if(json[id].s==0) {//如果json中不存在该用户或者老婆s为0
        e.reply("醒醒,你根本没有老婆!!")
        return
    }
    var lp = json[id].s
    e.reply([
        segment.at(e.user_id), "\n",
        `你的群友老婆是${lp}`,"\n",
        segment.image(`https://q1.qlogo.cn/g?b=qq&s=0&nk=${lp}`), "\n",
        `要好好对ta哦`,
    ])
    return true;
}
}