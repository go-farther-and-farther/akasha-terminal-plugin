import plugin from '../../../lib/plugins/plugin.js'
import fs from "fs";
import { segment } from "oicq";
const dirpath = "plugins/akasha-terminal-plugin/data/UserData";//文件夹路径
const dirpath2 = "plugins/akasha-terminal-plugin/resources/Legendaryweapon/Legendaryweapon.json";
let Template = {//创建该用户
    "money": 5,
};
let exerciseCD = {};
let Cool_time = 5;
export class drawcard extends plugin {
    constructor() {
        super({
            /** 功能名称 */
            name: '虚空武器抽卡',
            /** 功能描述 */
            dsc: '',
            /** https://oicqjs.github.io/oicq/#events */
            event: 'message',
            /** 优先级，数字越小等级越高 */
            priority: 1000,
            rule: [
                {
                    /** 命令正则匹配 */
                    reg: "^#(决斗|虚空|抽卡)?(签到|做每日委托)$", //匹配消息正则，命令正则
                    /** 执行方法 */
                    fnc: 'signin'
                },
                {
                    /** 命令正则匹配 */
                    reg: "^#(决斗|虚空|抽卡)?(抽武器|祈愿)$", //匹配消息正则，命令正则
                    /** 执行方法 */
                    fnc: 'weapon'
                }
            ]
        })
    }
    /**
     * 
     * @param e oicq传递的事件参数e
     */
    async signin(e) {
        let user_id = e.user_id;
        let filename = `${user_id}.json`;
        //判断冷却
        if (exerciseCD[user_id]) { //判定是否在冷却中
            e.reply(`你刚刚进行了签到，等待${Cool_time}分钟后再次签到吧！`);
            return;
        }
        //如果文件不存在，创建文件
        if (!fs.existsSync(dirpath + "/" + filename)) {
            fs.writeFileSync(dirpath + "/" + filename, JSON.stringify({
            }));
        }
        //读取文件
        var json = JSON.parse(fs.readFileSync(dirpath + "/" + filename, "utf8"));
        if (!json.hasOwnProperty("money")) {//如果这个用户现在没有钱
            json = Template
            e.reply(`恭喜你注册成功，你现在的纠缠之缘数量是${json['money']}`)
        }
        else {
            json['money']++
            e.reply(`你获得了一颗纠缠之缘，你现在的纠缠之缘数量是${json['money']}`)
        }
        //下面是添加冷却
        exerciseCD[user_id] = true;
        exerciseCD[user_id] = setTimeout(() => {//冷却时间
            if (exerciseCD[user_id]) {
                delete exerciseCD[user_id];
            }
        }, Cool_time * 1000 * 60);
        fs.writeFileSync(dirpath + "/" + filename, JSON.stringify(json, null, "\t"));//写入文件
        return
    }
    async weapon(e) {
        let user_id = e.user_id;
        let filename = `${user_id}.json`;
        //判断冷却
        //如果文件不存在，创建文件
        if (!fs.existsSync(dirpath + "/" + filename)) {
            e.reply('你还没有注册呢，请使用 #虚空签到 注册')
            return
        }
        //读取文件
        var json = JSON.parse(fs.readFileSync(dirpath + "/" + filename, "utf8"));
        var Legendaryweapon = JSON.parse(fs.readFileSync(dirpath2, "utf8"));
        if (json['money'] <= 0) { //判定是否有钱
            e.reply(`好可惜，但是你没有纠缠之缘了！`);
            return;
        }
        json['money']--
        let Grade = Math.floor(1000 * Math.random())
        if (Grade < 16) { Grade = 5 }
        else if (Grade < 150) { Grade = 4 }
        else { Grade = 3 }
        let num3 = Legendaryweapon["三星数量"]
        let num4 = Legendaryweapon["四星数量"]
        let num5 = Legendaryweapon["五星数量"]
        if (Grade == 5)
            var num = Math.floor(1 + num5 * Math.random())
        else if (Grade == 4)
            var num = Math.floor(1 + num4 * Math.random())
        else if (Grade == 3)
            var num = Math.floor(1 + num3 * Math.random())
        let name = Legendaryweapon[Grade][num];
        if (!json.hasOwnProperty(Grade)) {//如果json中不存在该用户
            json[Grade] = { "name": 1 }
        }
        else {
            if (!json[Grade].hasOwnProperty(num))
                json[Grade][num] = 1
            else
                json[Grade][num]++
        }
        let msg = [`你已经有${json[Grade][num]}把${name}了(内测：武器库总量三星${num3}四星${num4}五星${num5}，武器${Grade}星${num}号),你还有${json['money']}纠缠之缘`,
        segment.image(`plugins/akasha-terminal-plugin/resources/Legendaryweapon/${name}/awaken.webp`)]
        e.reply(msg)
        fs.writeFileSync(dirpath + "/" + filename, JSON.stringify(json, null, "\t"));//写入文件
        return
    }
}