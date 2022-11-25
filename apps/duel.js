import plugin from '../../../lib/plugins/plugin.js'
import { segment } from "oicq";
import fs from "fs";
import command from '../command/command.js'
//项目路径
let duelCD = {};
//如果报错请删除Yunzai/data/目录中akasha文件夹
const dirpath = "plugins/akasha-terminal-plugin/data";//文件夹路径
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
let Magnification = await command.getConfig("duel_cfg", "Magnification");
let Cooling_time = await command.getConfig("duel_cfg", "Cooling_time");

export class duel extends plugin {//决斗
	constructor() {
		super({
			/** 功能名称 */
			name: '决斗',
			/** 功能描述 */
			dsc: '',
			/** https://oicqjs.github.io/oicq/#events */
			event: 'message',
			/** 优先级，数字越小等级越高 */
			priority: 1000,
			rule: [
				{
					/** 命令正则匹配 */
					reg: "^#*(发起|开始|和我|与我|御前)决斗(.*)$", //匹配消息正则，命令正则
					/** 执行方法 */
					fnc: 'duel'
				},
				{
					/** 命令正则匹配 */
					reg: "^#*(设置)战斗力意义系数(.*)$", //匹配消息正则，命令正则
					/** 执行方法 */
					fnc: 'Magnification_'
				}
			]
		})
	}
	/**
	 * 
	 * @param e oicq传递的事件参数e
	 */
	//e.msg 用户的命令消息
	async Magnification_(e) {
		if (!e.is_admin)
			return
		let msg = e.msg.replace("设置", "").trim()
		msg = msg.replace("战斗力意义系数", "").trim()
		if (typeof (msg) == 'number') {
			if (number > 3 || number < 1) {
				e.reply(`战斗力意义系数应该是1~3之间`)
			} else { Magnification = number }
		}
		return
	}
	/**
	 * 
	 * @param e oicq传递的事件参数e
	 */
	//e.msg 用户的命令消息
	async duel(e) {
		console.log("用户命令：", e.msg);
		let user_id = e.user_id;
		let user_id2 = e.at; //获取当前at的那个人
		//检查是否有必要权限
		if (!e.group.is_admin) { //检查bot是否为管理员
			e.reply('我不是管理员，不能主持御前决斗啦~');
			return true;
		}
		if (!e.at) {//没有@的人
			e.reply('不知道你要与谁决斗哦，请@你想决斗的人~');
			return true;
		}
		//---------------------------------------------------
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
		if (!json.hasOwnProperty(user_id2)) {//如果json中不存在该用户
			json[user_id2] = Template
		}
		//判定双方存在管理员或群主则结束,将设置的开挂纳入管理员之中
		let level = json[user_id].level
		let experience = json[user_id].experience
		let level2 = json[user_id2].level
		let experience2 = json[user_id2].experience
		if ((e.sender.role == "owner" || e.sender.role == "admin" || json[user_id].Privilege == 1) && (e.group.pickMember(e.at).is_owner || e.group.pickMember(e.at).is_admin || json[e.at].Privilege == 1)) {//判定双方是否存在管理员或群主
			e.reply("你们两人都是管理员，御前决斗无法进行哦")
			return true
		}
		if (user_id == user_id2 && !(e.sender.role == "owner" || e.sender.role == "admin")) { //判定是否为自己
			e.group.muteMember(e.user_id, 1);
			e.reply([segment.at(e.user_id), `\n...好吧，成全你`]);
			return true;
		}
		if (e.at == e.uin && !(e.sender.role == "owner" || e.sender.role == "admin")) {//@的人是bot
			e.group.muteMember(e.user_id, 1);
			e.reply([segment.at(e.user_id), `\n你什么意思？举办了`]);
			return true
		}
		if (duelCD[e.user_id]) { //判定是否在冷却中
			e.reply(`你刚刚发起了一场决斗，请耐心一点，等待${Cooling_time}秒后再次决斗吧！`);
			return true;
		}
		let user_id2_nickname = null
		for (let msg of e.message) { //赋值给user_id2_nickname
			if (msg.type === 'at') {
				user_id2_nickname = msg.text//获取at的那个人的昵称
				break;
			}
		}
		duelCD[user_id] = true;
		duelCD[user_id] = setTimeout(() => {//冷却时间
			if (duelCD[user_id]) {
				delete duelCD[user_id];
			}
		}, Cooling_time * 1000);
		//计算实时经验的影响,等级在1-13级之间
		//  随机加成部分    +      等级加成部分 * 经验 * 随机发挥效果 //最大经验差为18*1.5*experience
		let win = 50 + Magnification * (level - level2)
		let random = Math.random() * 100
		let random_time = Math.round(Math.random() * 4) + 1
		e.reply([segment.at(e.user_id),
		`\n你的等级为${json[user_id].levels}\n${user_id2_nickname}的等级是${json[user_id2].levels}\n决斗开始!战斗力意义系数${Magnification},你的获胜概率是${win}`]);//发送消息
		if (json[user_id2].Privilege == 1 || e.sender.role == "owner" || e.sender.role == "admin") {
			setTimeout(() => {//延迟3秒
				e.group.muteMember(user_id2, 60 * random_time); //禁言
				e.reply([segment.at(e.user_id), `你不讲武德，使用了管理员之力获得了胜利。\n恭喜你与${user_id2_nickname}决斗成功。\n${user_id2_nickname}接受惩罚，已被禁言${random_time}分钟！`]);//发送消息
			}, 3000);//设置延时
		}
		else if (json[user_id].Privilege == 1 || e.group.pickMember(e.at).is_owner || e.group.pickMember(e.at).is_admin) {
			setTimeout(() => {
				e.group.muteMember(user_id, 60 * random_time); //禁言
				e.reply([segment.at(e.user_id), `对方不讲武德，使用了管理员之力获得了胜利。\n你接受惩罚，已被禁言1分钟!`]);//发送消息
			}, 3000);//设置延时
		}
		else if (win > random) {//判断是否成功
			setTimeout(() => {//延迟5秒
				e.group.muteMember(user_id2, random_time * 60); //禁言
				e.reply([segment.at(e.user_id),
				`恭喜你与${user_id2_nickname}决斗成功。\n${user_id2_nickname}接受惩罚，已被禁言${random_time}分钟！`]);//发送消息
			}, 3000);//设置延时
		}
		else {
			setTimeout(() => {
				e.group.muteMember(user_id, random_time * 60); //禁言
				e.reply([segment.at(e.user_id), `你与${user_id2_nickname}决斗失败。\n你接受惩罚，已被禁言${random_time + 1}分钟！`]);//发送消息
			}, 3000);//设置延时
		}//经验小于0时候重置经验
		console.log(`发起者：${user_id}被动者： ${user_id2}随机时间：${random_time}分钟`); //输出日志
		fs.writeFileSync(dirpath + "/" + filename, JSON.stringify(json, null, "\t"));//写入文件
		return true; //返回true 阻挡消息不再往下}
	}
}