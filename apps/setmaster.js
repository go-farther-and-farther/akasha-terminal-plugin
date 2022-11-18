import plugin from '../../../lib/plugins/plugin.js'
import { segment } from "oicq";
import fs from "fs";
import schedule from "node-schedule";
//项目路径
let duelCD = {};
let exerciseCD = {};
//如果报错请删除Yunzai/data/目录中akasha文件夹
const dirpath = "plugins/akasha-terminal-plugin/data/";//文件夹路径
var filename = `battle`;//文件名
if (filename.indexOf(".json") == -1) {//如果文件名不包含.json
	filename = filename + ".json";//添加.json
}
let Template = {//创建该用户
	"experience": 0,
	"level": 0,
	"level": '无等级',
	"Privilege": 0,
};
//配置一些有意思的参数
let Magnification = 1 //战斗力依赖系数，这个越大，战斗力意义越大
let Cooling_time = 300 //命令间隔时间，单位秒，这是决斗的冷却时间#初始为300秒
let Cooling_time2 = 300 //命令间隔时间，单位分钟，这是锻炼的冷却时间#初始为300分钟
export class setmaster extends plugin {//设置半步管理员
	constructor() {
		super({
			/** 功能名称 */
			name: '我的等级',
			/** 功能描述 */
			dsc: '',
			/** https://oicqjs.github.io/oicq/#events */
			event: 'message',
			/** 优先级，数字越小等级越高 */
			priority: 1000,
			rule: [
				{
					/** 命令正则匹配 */
					reg: "^#(设置|移除)半步管理员(.*)$", //匹配消息正则，命令正则
					/** 执行方法 */
					fnc: 'master'
				}
			]
		})
	}
	/**
	 * 
	 * @param e oicq传递的事件参数e
	 */
	//e.msg 用户的命令消息
	async master(e) {
		console.log("用户命令：", e.msg);
		if (!e.group.is_admin) { //检查是否为管理员
			e.reply('我不是管理员，不能设置半步管理员啦~');
			return true;
		}
		if (!e.at) {
			e.reply('不知道你要设置谁为半步管理员哦~');
			return true;
		}
		if (!e.isMaster) {
			e.group.muteMember(e.user_id, 1);
			e.reply([segment.at(e.user_id), `\n凡人，休得僭越！`]);
			return true
		}
		let user_id2 = e.at; //获取当前at的那个人
		let user_id2_nickname = null
		for (let msg of e.message) { //赋值给user_id2_nickname
			if (msg.type === 'at') {
				user_id2_nickname = msg.text//获取at的那个人的昵称
				break;
			}
		}
		if (!fs.existsSync(dirpath)) {//如果文件夹不存在
			fs.mkdirSync(dirpath);//创建文件夹
		}
		if (!fs.existsSync(dirpath + "/" + filename)) {//如果文件不存在
			fs.writeFileSync(dirpath + "/" + filename, JSON.stringify({//创建文件
			}));
		}
		var json = JSON.parse(fs.readFileSync(dirpath + "/" + filename, "utf8"));//读取文件
		if (!json.hasOwnProperty(user_id2)) {//如果json中不存在该用户
			json[user_id2] = Template
		}
		if (e.msg.includes("设置")) {
			json[user_id2].Privilege = 1
			fs.writeFileSync(dirpath + "/" + filename, JSON.stringify(json, null, "\t"));//写入文件
			console.log(`${user_id2}成为半步管理员`); //输出日志
			e.reply([segment.at(e.user_id),
			`设置半步管理员成功\n🎉恭喜${user_id2_nickname}成为半步管理员`]);//发送消息
			return true; //返回true 阻挡消息不再往下}
		} else {
			json[user_id2].Privilege = 0
			fs.writeFileSync(dirpath + "/" + filename, JSON.stringify(json, null, "\t"));//写入文件
			console.log(`${user_id2}成为半步管理员`); //输出日志
			e.reply([segment.at(e.user_id),
			`移除半步管理员成功\n🎉恭喜${user_id2_nickname}成为半步管理员`]);//发送消息
			return true; //返回true 阻挡消息不再往下
		}
	}
}