import plugin from '../../../lib/plugins/plugin.js'
import { segment } from "oicq";
import fs from "fs";
import command from '../command/command.js'
const dirpath = "plugins/akasha-terminal-plugin/data/CombatDate/";
let Combat = {//创建用户战斗属性
    "jcsm": 1000,//基础生命
    "gjl": 50,//基础攻击与加成攻击总和
    "暴击率": 0.05,//暴击
    "爆伤": 0.5,//爆伤
    "防御": 100,//防御
};
//项目路径
export class createahchive extends plugin {//锻炼
    constructor(){
    super({
			/** 功能名称 */
			name: '创建战斗存档',
			/** 功能描述 */
			dsc: '',
			/** https://oicqjs.github.io/oicq/#events */
			event: 'message',
			/** 优先级，数字越小等级越高 */
			priority: 1000,
			rule: [
                    {
					/** 命令正则匹配 */
					reg: "^#加入决斗$", //匹配消息正则，命令正则
					/** 执行方法 */
					fnc: 'create'
				    },
                    {
					/** 命令正则匹配 */
					reg: "^#决斗状态$", //匹配消息正则，命令正则
					/** 执行方法 */
					fnc: 'read'
				    }
                  ]
		})
	}
    /**
	 * 
	 * @param e oicq传递的事件参数e
	 */
	//e.msg 用户的命令消息
	async create(e){
        console.log("用户命令：", e.msg);
		let user_id = e.user_id;
        let filename = `${user_id}.json`;
        if (!fs.existsSync(dirpath)) {//如果文件夹不存在
			fs.mkdirSync(dirpath);//创建文件夹
		}
        //如果文件不存在，创建文件
        if (!fs.existsSync(dirpath + "/" + filename)) {
            fs.writeFileSync(dirpath + "/" + filename, JSON.stringify({
            }));
        }
        //读取文件
        var json = JSON.parse(fs.readFileSync(dirpath + "/" + filename, "utf8"));
        if (!json.hasOwnProperty("jcsm")) {//如果这个用户现在没有存档
            json = Combat
            e.reply(`创建成功，你的属性是\n生命${json['jcsm']},\n防御力${json['fy']},\n攻击${json['gjl']},\n暴击率${json['bj']},\n暴击伤害${json['bs']}`)
        }
        else {
            e.reply(`你已经有存档了，去试试其他功能吧`)
        }
        fs.writeFileSync(dirpath + "/" + filename, JSON.stringify(json, null, "\t"));
        return true;
    }
    async read(e) {
        console.log("用户命令：", e.msg);
		let user_id = e.user_id;
        let filename = `${user_id}.json`;
        var json = JSON.parse(fs.readFileSync(dirpath + "/" + filename, "utf8"));
        if (!fs.existsSync(dirpath + "/" + filename)) {
            e.reply(`你还没有存档，使用#加入决斗创建吧`)
        }
        else{
            e.reply(`你的属性是\n生命${json['jcsm']},\n防御力${json['fy']},\n攻击${json['gjl']},\n暴击率${json['bj']},\n暴击伤害${json['bs']}`)
        }
    }
}