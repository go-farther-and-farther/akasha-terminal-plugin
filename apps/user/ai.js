import lodash from "lodash";
import command from '../../components/command.js'
import fs from 'fs';
import lin_data from '../../components/lin_data.js';

const BotName = global.Bot.nickname;
// 读yaml文件里面的设置的初始回复概率
var ai_api = await command.getConfig("ai_cfg", "ai_api");
var ai_name = await command.getConfig("ai_cfg", "ai_name");
var ai_nick = await command.getConfig("ai_cfg", "ai_nick");
//群聊是否只关注@信息
const dirpath = "plugins/akasha-terminal-plugin/data";//文件夹路径
const filename = `ai.json`;//文件名
var bad2good = {
    "傻逼": ["天使", "大可爱"],
    "去死": ["去玩", "去打电动"],
    "测试你妹": "测试"
};
//这是有关
String.prototype.beGood = function () {
    let output = this;
    for (let item in bad2good) {
        let get = "";
        //如果是数组则随机获取
        if (bad2good[item] instanceof Array) get = bad2good[item][lodash.random(item.length - 1)];
        else get = bad2good[item];
        //把不好的item和好的get调换
        output = output.replace(eval(`/${item}/g`), get);
    }
    //输出转化结果
    return output;
};

export class ai extends plugin {
    constructor() {
        super({
            /** 功能名称 */
            name: 'LinAI',
            /** 功能描述 */
            dsc: '调用免费接口回答消息',
            event: 'message',
            /** 优先级，数字越小等级越高 */
            priority: 66666,
            rule: [
                {
                    /** 命令正则匹配 */
                    reg: '',
                    /** 执行方法 */
                    fnc: 'ai',
                    log: false
                }
            ]
        })
    }
    /**
     * 
     */
    async ai(e) {
        //是否为文本消息和指令
        if (!e.msg) return false;
        //e.msg 用户的命令消息
        console.log("用户命令：", e.msg);
        if (e.isGroup) var id = e.group_id
        if (e.isPrivate) var id = e.user_id
        var json = {}
        json = await lin_data.getAi(id, json, false)
        //---------------------------------------------------
        //一个控制ai回复概率的模块
        if (e.isMaster || e.member.is_owner || e.member.is_admin) {
            //控制接口-------------------------------------------
            let api_num = ai_api.length - 1//接口数量
            // 发送当前的接口名字
            if (e.msg.includes('词库查重')) {
                var ai_local = JSON.parse(fs.readFileSync("plugins/akasha-terminal-plugin/resources/ai_local/ai_local.json", "utf8"));//读取文件

                var s = '{"身高":"175cm","性别":"男","兴趣":"唱歌","兴趣":"棒球","兴趣":"游泳"}'
                var kv = {}, m, reg = /"[^"]+":"[^"]+"/gi;
                var m = s.match(reg);

                var o = {};
                for (var i = 0; i < m.length; i++) {
                    kv = m[i].match(/"[^"]+"/gi);
                    var _arr1 = [];;
                    for (var j = 0; j < kv.length; j++) {
                        _arr1.push(kv[j].replace(/"/g, ''));
                    }
                    if (_arr1[0] in o) {
                        if (typeof (o[_arr1[0]]) == 'string') {
                            o[_arr1[0]] = [o[_arr1[0]]]
                        };
                        o[_arr1[0]].push(_arr1[1])
                    } else {
                        o[_arr1[0]] = _arr1[1]
                    }

                }

            }
            if (e.msg.includes('ai设置接口') || e.msg.includes('设置ai接口') || e.msg.includes('切换ai接口')) {
                let message = e.msg.replace(/(ai设置接口|设置ai接口|切换ai接口|#)/g, "").replace(/[\n|\r]/g, "，").trim();//防止把内容里面的一下删了
                if (message <= api_num && message >= 1 && !isNaN(message))//判断是不是api个数里面的,是则返回
                {
                    json[id].ai_now = message - 1
                    e.reply(`已切换到${json[id].ai_now + 1}号接口${ai_name[json[id].ai_now]},接口链接已隐藏。`);
                }
                else {
                    e.reply(`接口序号${message}超出范围或不合规，目前总量${api_num}`)
                }
            }
            else if ((e.msg.includes('ai') || e.msg.includes('本地')) && e.msg.includes('概率')) {
                let msgsz = e.msg.replace(/(ai|设置|本地|概率|设置|词库|#)/g, "").replace(/[\n|\r]/g, "，").trim()
                if (isNaN(msgsz)) {
                    e.reply(`${msgsz}不是有效值,请输入正确的数值`)
                }
                else {
                    if (msgsz > 100 || msgsz < 0) {
                        e.reply(`${msgsz}数值不在有效范围内,请输入0以上100以内的整数`)
                    }
                    else {
                        let sz = Math.round(msgsz)
                        if (e.msg.includes('本地')) {
                            json[id].local_gailv = sz
                            e.reply(`已设置本地触发概率（在总概率中）：${json[id].local_gailv}%，`)
                        }
                        else {
                            json[id].ai_gailv = sz
                            e.reply(`已四舍五入设置ai触发概率：${json[id].ai_gailv}%，`)
                        }
                    }
                }
            }
            else if (e.msg.includes('开启') && e.msg.includes('引用')) {
                if (!json[id].ai_at) {
                    json[id].ai_at = false
                    e.reply(`成功开启群聊引用模式`)
                }
                else
                    e.reply(`ai群聊引用模式已经是开启状态了,不需要再开启一遍哦！`)
            }
            else if (e.msg.includes('关闭') && e.msg.includes('引用')) {
                if (!json[id].ai_at) {
                    e.reply("ai引用模式已经是关闭状态了哦(～￣▽￣)～")
                }
                else {
                    json[id].ai_at = false
                    e.reply("成功关闭群聊引用模式!")
                }
            }
            else if (e.msg.includes('只关注@消息') || e.msg.includes('@必回复')) {
                json[id].onlyReplyAt = true;
                e.reply("好啦，现在只回复@消息了哦")
            }
            else if (e.msg.includes('关注所有消息')) {
                json[id].onlyReplyAt = false;
                e.reply("现在我会关注每一条消息了φ(*￣0￣)")
            }
            //查看状态----------------------------------
            else if (e.msg.includes("ai状态")) {
                this.ai_look(e, id, json)
            }
            json = await lin_data.getAi(id, json, true)
        }
        if (e.msg.charAt(0) == '#') return false;
        //群聊是否需要消息中带有机器人昵称概率触发 被@必然触发
        if (((e.msg.includes(BotName) || e.isPrivate || !json[id].onlyReplyAt) && json[id].ai_gailv >= Math.round(Math.random() * 99) || e.atme)) {
            let ai_reply = true
            if (json[id].local_gailv >= Math.round(Math.random() * 99)) {
                ai_reply = await this.ai_local_reply(e)
            }
            if (ai_reply) {
                console.log("ai消息：", e.msg);
                //接收时将机器人名字替换为对应ai的名字
                let message = e.msg.trim().replace(eval(`/${BotName}/g`), `${ai_nick[json[id].ai_now]}`).replace(/[\n|\r]/g, "，");
                //抓取消息并转换为Json
                let postUrl = `${ai_api[json[id].ai_now]}${message}`;
                let response = await fetch(postUrl);
                let replyData = await response.json();//将返回的数据转化为json文件
                let replyMsg = [];//这个保存返回信息里面的文本文件
                replyData = JSON.stringify(replyData) //转换字符串用于判断返回值
                if (replyData) {
                    //匹配不同ai接口返回规则:cv自c佬自定义ai.js
                    if (replyData.indexOf("result") != -1) {
                        replyMsg.push(JSON.parse(replyData).content)
                    } else if (replyData.indexOf("desc") != -1) {
                        replyMsg.push(JSON.parse(replyData).data.desc)
                    } else if (replyData.indexOf("info") != -1) {
                        replyMsg.push(JSON.parse(replyData).data.info.text)
                    } else if (replyData.indexOf("text") != -1 && replyData.indexOf("mp3") != -1) {
                        replyMsg.push(JSON.parse(replyData).text)
                    } else if (replyData.indexOf("code") != -1 && replyData.indexOf("text") != -1) {
                        replyMsg.push(JSON.parse(replyData).text)
                    }
                }
                //处理消息
                let tempReplyMsg = [];
                replyMsg = replyMsg.join(",").replace(/(夸克宝宝|菲菲|小思|小爱|琪琪|吴珂|李美恩|小纤)/g, BotName)
                    .replace(/\{br\}/g, "\n")
                    .replace(/&nbsp;/g, " ")
                    .replace(/\{face:([\d]+)\}/g, "#face$1#[div]")
                    //消息和谐处理
                    .beGood()
                    .trim();
                //表情处理
                if (replyMsg.includes("[div]")) {
                    for (let item of replyMsg.split("[div]")) {
                        if (/#face[\d]+#/.test(item)) item = segment.face(item.replace(/#face([\d]+)#/, "$1"));
                        tempReplyMsg.push(item);
                    }
                }
                //是否有表情
                if (tempReplyMsg && tempReplyMsg.length > 0) replyMsg = tempReplyMsg;
                //是否有消息输出
                if (replyMsg) {
                    //设置了log: false; 好像是没有输出日志的
                    logger.mark(`[${ai_name[json[id].ai_now]}回复] ${e.msg}`);
                    //发送消息
                    if (json[id].ai_at)
                        e.reply(replyMsg, e.isGroup);
                    else
                        e.reply(replyMsg);
                    //阻止继续匹配其他命令
                    return true;
                }
                //返回false继续匹配其他命令                                                
                else { return false; }
            }
        }
    }
    async ai_look(e, id, json) {
        let msg = `：${id},\n触发概率：${json[id].ai_gailv}%,\n其中本地词库概率：${json[id].local_gailv}%,\n群聊需要@：${json[id].onlyReplyAt},\n正在使用${json[id].ai_now + 1}号ai${ai_name[json[id].ai_now]},\nai是否是开启引用：${json[id].ai_at}。`
        if (e.isPrivate) msg = '你的QQ是' + msg
        if (e.isGroup) msg = '所在群聊是' + msg
        msg = msg + '\n规则：先匹配词库再匹配AI,\n改概率使用“ai概率xx”，“本地概率xx”'
        e.reply(msg)
    }
    async ai_local_reply(e) {
        var ai_local = JSON.parse(fs.readFileSync("plugins/akasha-terminal-plugin/resources/ai_local/ai_local.json", "utf8"));//读取文件
        if (!(e.msg in ai_local)) {
            return false
        }
        this.reply('本地词库：' + ai_local[e.msg][Math.round(Math.random() * ai_local[e.msg].length)], true)
        return true
    }
}