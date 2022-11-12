import plugin from '../../../lib/plugins/plugin.js'
import fs from "fs";
import YAML from 'yaml'
const dirpath = "plugins/akasha-terminal-plugin/data/UserData";//文件夹路径
const dirpath2 = "plugins/akasha-terminal-plugin/resources/Legendaryweapon/Legendaryweapon.yaml";
let Template = {//创建该用户
    "money": 0,
};
let exerciseCD = {};
let Cool_time = 5;
export class seelevel extends plugin {
    constructor() {
        super({
            /** 功能名称 */
            name: '我的境界',
            /** 功能描述 */
            dsc: '',
            /** https://oicqjs.github.io/oicq/#events */
            event: 'message',
            /** 优先级，数字越小等级越高 */
            priority: 1000,
            rule: [
                {
                    /** 命令正则匹配 */
                    reg: "^#(决斗|虚空|抽卡)签到$", //匹配消息正则，命令正则
                    /** 执行方法 */
                    fnc: 'signin'
                },
                {
                    /** 命令正则匹配 */
                    reg: "^#(决斗|虚空|抽卡)?抽武器$", //匹配消息正则，命令正则
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
            e.reply(`你刚刚进行了一次修炼，请耐心一点，等待${Cool_time}分钟后再次修炼吧！`);
            return;
        }
        //如果文件不存在，创建文件
        if (!fs.existsSync(dirpath + "/" + filename)) {
            fs.writeFileSync(dirpath + "/" + filename, JSON.stringify({
            }));
        }
        //读取文件
        var json = JSON.parse(fs.readFileSync(dirpath + "/" + filename, "utf8"));
        if (!json.hasOwnProperty("money")) {//如果json中不存在该用户
            json[e.user_id] = Template
        }
        //--------------------------------------------------------------------------
        let num = Math.round(1 * Math.random())
        let Grade = Math.floor(5.05 - Math.random())
        let Legendaryweapon = YAML.parse(fs.readFileSync(dirpath2, 'utf8'));
        let name = Legendaryweapon[Grade][num];
        json[5][name] = 1
        let picture =`plugins/akasha-terminal-plugin/resources/Legendaryweapon/${name}`
            let msg = [
                `恭喜你`,
                picture,
            ];
        e.reply(msg)





        //--------------------------------------------------------------------------
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
}