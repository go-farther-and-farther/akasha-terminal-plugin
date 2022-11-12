import plugin from '../../../lib/plugins/plugin.js'
import fs from "fs";
//项目路径
//如果报错请删除Yunzai/data/目录中akasha文件夹
const dirpath = "plugins/akasha-terminal-plugin/data/";//文件夹路径
var filename = `battle`;//文件名
if (filename.indexOf(".json") == -1) {//如果文件名不包含.json
    filename = filename + ".json";//添加.json
}
let Template = {//创建该用户
    "energy": 0,
    "level": 0,
    "levels": '无境界',
    "Privilege": 0,
};
//配置一些有意思的参数

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
                    reg: "^#我的(境界|内力)$", //匹配消息正则，命令正则
                    /** 执行方法 */
                    fnc: 'seelevel'
                }
            ]
        })
    }
	/**
	 * 
	 * @param e oicq传递的事件参数e
	 */
    async seelevel(e) {
        let user_id = e.user_id;
        if (!fs.existsSync(dirpath)) {//如果文件夹不存在
            fs.mkdirSync(dirpath);//创建文件夹
        }
        if (!fs.existsSync(dirpath + "/" + filename)) {//如果文件不存在
            fs.writeFileSync(dirpath + "/" + filename, JSON.stringify({//创建文件
            }));
        }
        var json = JSON.parse(fs.readFileSync(dirpath + "/" + filename, "utf8"));//读取文件
        if (!json.hasOwnProperty(user_id)) {//如果json中不存在该用户
            json[e.user_id] = Template
        }
        if (json[e.user_id].energy < 1) {
            json[e.user_id].energy = 0
        }//当内力小于1时，自动归零
        e.reply(`你的境界是${json[e.user_id].levels},你的内力是${json[e.user_id].energy},是否是半步管理员${json[e.user_id].Privilege}`)
        fs.writeFileSync(dirpath + "/" + filename, JSON.stringify(json, null, "\t"));//写入文件
        return
    }
}