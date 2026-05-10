import { BotApi, AlemonApi, plugin } from '../../model/api/api.js'
import cfg from '../../../../lib/config/config.js'
import { pipeline } from "stream";
import fs, { existsSync } from 'fs';
import { promisify } from "util";
import path from 'path';

const _path = process.cwd();//云崽目录
/*
===========内置插件管理器V3.6=============
		   Made by @戏天
		   @戏天授权+@越追越远修改
===============================================================================
该插件不会继续更新，后续版本将会通过 https://github.com/XiTianGame/xitian-plugin 
以github的形势发布，继承3.6的全部功能，新增了N个功能，已经支持锅巴插件
===============================================================================

使用 #插件菜单 获取帮助！
更新日志：
2.0之前不是俺做的，不知道更新了啥
3.0适配V3云崽，量身打造，新增多个功能，引入回收站概念
3.1新增查找插件功能，修复了插件处于停用状态无法删除的bug
3.2增加了清空回收站的询问，新增js文件大小限制
3.3修复若干bug，新增未知bug（bushi），新增批量安装插件指令
3.4新增智能覆盖安装，新增插件安装智能重命名
3.5新增了对多文件夹的支持，引入插件分组概念，修复智能命名bug
3.6修bug
/*
回收站目录，用于存放删除的插件。
可自定义文件夹的名称和路径。
如果是 plugins/以外的目录，需要填入绝对路径。
不知道什么是绝对路径？ 请自行百度！  */
let bin = `plugins/bin/`;
/*
插件目录，第一个是插件的默认安装目录
可以添加多目录进行分组，最后的/别忘了
*/
let plugins = [
	`plugins/example/`,
	//示例：`plugins/娱乐/`,
];
//机器人名字，用来回复非主人消息
let name = global.Bot.nickname
//插件的最大大小
let maxSize = 6291456
//等待时间，单位秒
let timeout = 60
//自动化选项
let auto_install = true;//智能覆盖安装(被覆盖的插件将会移动到回收站)
let auto_rename = true;//智能插件重命名(去除如：V3，和括号内的内容)


//不存在目录则创建目录
if (!fs.existsSync(bin)) {
	fs.mkdirSync(bin);
}
for (let tmp = 0; tmp < plugins.length; tmp++) {
	if (!fs.existsSync(plugins[tmp])) {
		fs.mkdirSync(plugins[tmp]);
	}
}
let my = {};
let confirm = {};

export class Plugin_Manager extends plugin {
	constructor() {
		super({
			name: '插件管理器',
			dsc: '各种功能帮助master管理js插件',
			event: 'message',
			priority: 5,
			rule: [
				{
					reg: '^#插件(菜单|帮助|help)$',
					fnc: 'Menu'
				},
				{
					reg: '^#(安装|新增|增加)插件$',
					fnc: 'New'
				},
				{
					reg: '^#(开始|结束)批量安装插件$',
					fnc: 'batch'
				},
				{
					reg: '(.*)',
					fnc: 'jsFile',
					log: false
				},
				{
					reg: '^#插件列表$',
					fnc: 'read'
				},
				{
					reg: '^#查找(.*)插件$',
					fnc: 'find'
				},
				{
					reg: '^#(.*)设置分组(.*)',
					fnc: 'group'
				},
				{
					reg: '^#停用插件(.*)$',
					fnc: 'mv_ty'
				},
				{
					reg: '^#启用插件(.*)$',
					fnc: 'mv_qy'
				},
				{
					reg: '^#删除插件(.*)$',
					fnc: 'del'
				},
				{
					reg: '^#恢复插件(.*)$',
					fnc: 'rec'
				},
				{
					reg: '^#查看回收站$',
					fnc: 'look'
				},
				{
					reg: '^#清空回收站',
					fnc: 'clear'
				}
			]
		})
	}
	//安装指令
	async New(e) {
		if (!e.isMaster) {
			e.reply(`只有主人才能命令${name}哦~`)
			return true;
		}

		if (!e.file) {
			if (my[e.user_id]) {
				clearTimeout(my[e.user_id]);
			}
			my[e.user_id] = setTimeout(() => {
				if (my[e.user_id]) {
					delete my[e.user_id];
				}
				if (my["单次"]) {
					delete my["单次"]
				}
				e.reply("操作超时，请重新发送安装指令哦")
			}, timeout * 1000);//等待js文件
			my["单次"] = true;

			e.reply([segment.at(e.user_id), " 请发送js插件"]);
			return true;
		}

		my[e.user_id] = true;
		my["单次"] = true;

		return this.jsFile(e);//消息包含js文件，直接安装
	}

	async batch(e) {
		if (!e.isMaster) {
			e.reply(`只有主人才能命令${name}哦~`)
			return true;
		}
		let keyword = e.msg.replace(/#|批量安装插件/g, "");

		if (keyword == "开始") {

			if (!e.file) {
				if (my[e.user_id]) {
					clearTimeout(my[e.user_id]);
				}
				my[e.user_id] = setTimeout(() => {
					if (my[e.user_id]) {
						delete my[e.user_id];
					}
					if (my["批量"]) {
						delete my["批量"]
					}
					e.reply(`超过${timeout}秒未发送消息，批量安装已结束`)
				}, timeout * 1000);//等待js文件
				my["批量"] = true;
				e.reply([segment.at(e.user_id), " 请发送js插件"]);
				return true;
			}
			my[e.user_id] = true;
			my["批量"] = true;

			return this.jsFile(e);//消息包含js文件，直接安装
		}

		if (keyword == "结束") {
			cancel(e);
			e.reply("批量安装已结束~")
			return true;
		}
	}

	//消息发送监听
	async jsFile(e) {
		if (!e.isMaster) return false;
		//不是主人或者发插件的不是一个人
		if (!my[e.user_id] && !confirm[e.user_id]) {
			return false;
		}
		//清空回收站的确认操作
		if (confirm[e.user_id]) {
			if (!e.msg) return false
			if (e.msg == "是") {
				//清空bin内的全部文件
				var files = fs.readdirSync(bin);
				files.forEach(item => {
					fs.unlink(`${bin}${item}`, () => { })
				});
				cancel(e);
				e.reply("插件回收站已清空")
				return true;
			} else if (e.msg == "否") {
				cancel(e);
				e.reply("操作已取消")
				return true;
			}
			return false;
		}
		//单个安装的操作
		if (my[e.user_id] && my["单次"]) {

			if (!e.file || !e.file.name.includes("js")) {
				e.reply([segment.at(e.user_id), '发送的不是js插件呢，安装已取消！'])
				cancel(e);
				return true;
			}

			if (e.message[0].size > maxSize) {
				cancel(e);
				e.reply("文件过大，已取消本次安装");
				return true;
			}

			let textPath = `${plugins[0]}${e.file.name}`;

			await install(e, textPath);//调用安装函数
			cancel(e);
			return true;
		}
		//批量安装的操作
		if (my[e.user_id] && my["批量"]) {

			if (!e.file || !e.file.name.includes("js")) {
				e.reply([segment.at(e.user_id), '发送的不是js插件呢'])
				return true;
			}

			if (e.message[0].size > maxSize) {
				e.reply("文件过大，无法安装该插件");
				return true;
			}
			//重置时间
			cancel(e);
			my[e.user_id] = setTimeout(() => {
				if (my[e.user_id]) {
					delete my[e.user_id];
				}
				if (my["批量"]) {
					delete my["批量"];
				}
				e.reply(`超过${timeout}秒未发送消息，批量安装已结束~`)
			}, timeout * 1000);//等待js文件

			let textPath = `${plugins[0]}${e.file.name}`;

			await install(e, textPath);//调用安装函数
			return true;
		}

		return false;//都没匹配就溜了
	}

	async read(e) {
		if (!e.isMaster) {
			e.reply(`只有主人才能命令${name}哦~`)
			return true;
		}
		// 同步读取example目录下的所有文件
		let msg = [{
			message: "====插件列表====",
			nickname: Bot.nickname,
			user_id: cfg.qq,
		}];
		for (let num = 0; num < plugins.length; num++) {
			const files = fs.readdirSync(plugins[num]);
			let msg1 = files.map(file => {
				if (file.includes(".js.bak"));
				else return ` \n${file.replace(/.js/g, "")}`;
			});
			let msg2 = files.map(file => {
				if (file.includes(".js.bak"))
					return ` \n${file.replace(/.js.bak/g, "")}`;
			});
			msg1 = msg1.join(",").replace(/,/g, "");
			msg2 = msg2.join(",").replace(/,/g, "");
			msg.push({
				message: `位于${plugins[num].replace(/plugins|\//g, "")}分组下的插件\n已启用的插件：\n${msg1}\n\n已停用的插件：\n${msg2}`,
				nickname: Bot.nickname,
				user_id: cfg.qq,
			});
		}
		//组装合并消息
		if (this.e.isGroup) {
			msg = await this.e.group.makeForwardMsg(msg)
		} else {
			msg = await this.e.friend.makeForwardMsg(msg)
		}
		e.reply(msg);
		return true;
	}

	async find(e) {
		if (!e.isMaster) {
			e.reply(`只有主人才能命令${name}哦~`)
			return true;
		}
		//获取关键字
		let keyword = e.msg.replace(/#查找|插件|.js|.bak/g, "")
		let plugininfo = find(keyword)
		if (plugininfo.number == 0) {//没找到插件
			e.reply("没有找到该插件，请确认你是否安装了该插件")
		} else if (plugininfo.number == 1) {//找到一个插件
			let msg = [
				`找到插件：${plugininfo.pluginname[0].replace(/.js|.bak|\[.*?\]/g, "")}\n`,
				`位于目录${plugininfo.pluginPath[0]}\n`,
				`当前状态：${plugininfo.pluginState[0]}\n`
			]
			e.reply(msg)
		} else if (plugininfo.number > 1) {//找到多个插件
			let num, msg = [];
			e.reply("找到多个插件")
			for (num = 0; num < plugininfo.number; num++) {
				let info = [
					`找到插件：${plugininfo.pluginname[num].replace(/.js|.bak|\[.*?\]/g, "")}\n`,
					`位于目录${plugininfo.pluginPath[num]}\n`,
					`当前状态：${plugininfo.pluginState[num]}\n`
				]
				msg.push({
					message: info,
					nickname: Bot.nickname,
					user_id: cfg.qq,
				});
			}
			//判断是不是群聊，制作合并转发消息
			if (e.isGroup) {
				msg = await e.group.makeForwardMsg(msg)
			} else {
				msg = await e.friend.makeForwardMsg(msg)
			}
			e.reply(msg)
		}
		return true;
	}

	async group(e) {
		if (!e.isMaster) {
			e.reply(`只有主人才能命令${name}哦~`)
			return true;
		}

		let keyword = e.msg.replace("#", "").split("设置分组");
		let all_group = plugins.map(group => {
			return group.replace(/plugins|\//g, "")
		})
		let tmp = find(keyword[0])
		let path
		if (tmp.number == 0) {
			e.reply("没有找到该插件哦");
			return true;
		} else if (tmp.number == 1) {
			path = `${tmp.pluginPath}${tmp.pluginname}`
			if (!fs.existsSync(path)) {
				e.reply("设置分组失败了呢~" + `\n有没有可能你没有安装“${msg}”插件`);
				return true;
			}
			if (all_group.indexOf(keyword[1]) > -1) {
				fs.renameSync(`${tmp.pluginPath}${tmp.pluginname}`, `plugins/${keyword[1]}/${tmp.pluginname}`)
				e.reply(`成功设置插件“${keyword[0]}”为分组${keyword[1]}~`);
			} else {
				e.reply("没有这个分组呢");
				return true;
			}
		} else if (tmp.number > 1) {
			e.reply("找到多个插件，请指定准确的插件名哦");
		}
		return true;
	}

	async mv_ty(e) {
		if (!e.isMaster) {
			e.reply(`只有主人才能命令${name}哦~`)
			return true;
		}

		// 停用插件，添加.bak的后缀名

		let msg = e.msg.replace(/#停用插件/g, "")
		let tmp = find(msg);
		if (tmp.number == 0) {
			e.reply("没有找到该插件哦");
			return true;
		} else if (tmp.number == 1) {
			if (tmp.pluginState == "启用") {
				let path = `${tmp.pluginPath[0]}${msg}.js`
				if (!fs.existsSync(path)) {
					e.reply("停用失败了呢~" + `\n有没有可能你没有安装“${msg}”插件`)
					return true;
				}
				fs.renameSync(`${tmp.pluginPath[0]}${msg}.js`, `${tmp.pluginPath[0]}${msg}.js.bak`);
				e.reply(`已停用：${msg}` + "\n重启后生效呢~")
			} else if (tmp.pluginState == "停用") {
				e.reply("该插件已经处于停用状态哦");
				return true;
			} else {
				e.reply("该插件处于已删除状态\n请先恢复插件哦");
				return true;
			}
		} else if (tmp.number > 1) {
			e.reply("找到多个插件，请指定准确的插件名哦");
		}
		return true;
	}

	async mv_qy(e) {
		if (!e.isMaster) {
			e.reply(`只有主人才能命令${name}哦~`)
			return true;
		}

		// 启用插件，去除.bak的后缀名

		let msg = e.msg.replace(/#启用插件/g, "")
		let tmp = find(msg);
		if (tmp.number == 0) {
			e.reply("没有找到该插件哦");
			return true;
		} else if (tmp.number == 1) {
			if (tmp.pluginState == "启用") {
				e.reply("该插件已经处于启用状态哦");
				return true;
			} else if (tmp.pluginState == "停用") {
				let path = `${tmp.pluginPath[0]}${msg}.js.bak`
				if (!fs.existsSync(path)) {
					e.reply("启用失败了呢~" + `\n有没有可能你没有“${msg}”插件`)
					return true;
				}
				fs.renameSync(`${tmp.pluginPath[0]}${msg}.js.bak`, `${tmp.pluginPath[0]}${msg}.js`)
				e.reply(`已启用：${msg}` + "\n立即生效呢~")
			} else {
				e.reply("该插件处于已删除状态\n请先恢复插件哦");
				return true;
			}
		} else if (tmp.number > 1) {
			e.reply("找到多个插件，请指定准确的插件名哦");
		}
		return true;
	}

	async del(e) {
		if (!e.isMaster) {
			e.reply(`只有主人才能命令${name}哦~`)
			return true;
		}

		// 删除插件，移动到回收站

		let msg = e.msg.replace(/#|删除插件/g, "")
		let tmp = find(msg);
		//插件可能处于停用或启用两种状态
		let path1, path2;
		if (tmp.number == 0) {
			e.reply("没有找到该插件哦");
			return true
		} else if (tmp.number == 1) {
			if (tmp.pluginState[0] == "启用") {
				path1 = `${tmp.pluginPath[0]}${msg}.js`
			} else if (tmp.pluginState[0] == "停用") {
				path2 = `${tmp.pluginPath[0]}${msg}.js.bak`
			} else {
				e.reply("该插件已经是删除状态哦");
				return true;
			}
			if (fs.existsSync(path1)) {
				fs.renameSync(`${tmp.pluginPath}${msg}.js`, `${bin}[${tmp.pluginPath[0].replace(/plugins|\//g, "")}]${msg}.js.bak`)
				e.reply(`已删除：${msg}` + "\n重启后生效呢~")
				return true;
			} else if (fs.existsSync(path2)) {
				fs.renameSync(`${tmp.pluginPath}${msg}.js.bak`, `${bin}[${tmp.pluginPath[0].replace(/plugins|\//g, "")}]${msg}.js.bak`)
				e.reply(`已删除：${msg}` + "\n重启后生效呢~")
				return true;
			} else e.reply("删除失败了呢~" + `\n有没有可能你没有安装“${msg}”插件`)
		} else if (tmp.number > 1) {
			e.reply("找到多个插件，请指定准确的插件名哦");
		}
		return true;
	}

	async rec(e) {
		if (!e.isMaster) {
			e.reply(`只有主人才能命令${name}哦~`)
			return true;
		}

		// 恢复插件，去除.bak的后缀名

		let msg = e.msg.replace(/#|恢复插件/g, "")
		let tmp = find(msg);
		//确定来源文件夹
		let origin = tmp.pluginname[0].replace(msg, "").replace(/.js|.bak|\[/g, "").split("]");
		let path
		if (origin[0]) {
			path = `${bin}[${origin[0]}]${msg}.js.bak`
			if (!fs.existsSync(path)) {
				e.reply("恢复失败了呢~" + `\n有没有可能你没有“${msg}”插件`)
				return true;
			}
			fs.renameSync(`${bin}[${origin[0]}]${msg}.js.bak`, `plugins/${origin[0]}/${msg}.js`)
		} else {
			path = `${bin}${msg}.js.bak`
			if (!fs.existsSync(path)) {
				e.reply("恢复失败了呢~" + `\n有没有可能你没有“${msg}”插件`)
				return true;
			}
			fs.renameSync(`${bin}${msg}.js.bak`, `${plugins[0]}${msg}.js`)
		}
		e.reply(`已恢复：${msg}` + "\n立即生效呢~")
		return true;
	}

	async look(e) {
		if (!e.isMaster) {
			e.reply(`只有主人才能命令${name}哦~`)
			return true;
		}
		// 同步读取bin目录下的所有文件
		const files = fs.readdirSync(bin);
		let msg = files.map(file => {
			return ` \n${file.replace(/.js.bak|\[.*?\]/g, "")}`;
		});
		msg = msg.join(",").replace(/,/g, "");
		e.reply("回收站的插件：" + "\n" + msg + "\n" + "\n恢复请用：#恢复插件+名字");
		return true;
	}

	async clear(e) {
		if (!e.isMaster) {
			e.reply(`只有主人才能命令${name}哦~`)
			return true;
		}
		if (confirm[e.user_id]) {
			clearTimeout(confirm[e.user_id]);
		}
		confirm[e.user_id] = setTimeout(() => {
			if (confirm[e.user_id]) {
				delete confirm[e.user_id];
			}
			e.reply("操作超时，已取消清空回收站指令")
		}, timeout * 1000);//等待操作指令
		e.reply("警告！此操作会清空回收站内的全部插件,是否继续（是/否）")
		return true;
	}

	async Menu(e) {
		if (!e.isMaster) {
			e.reply(`只有主人才能命令${name}哦~`)
			return true;
		}
		let msg = [
			"插件菜单：",
			"\n#安装插件   用于安装js插件",
			"\n#插件列表   请先查看已安装的插件",
			"\n#查找+名字+插件 查找该名的插件",
			"\n#名字+设置分组+分组  设置插件分组",
			"\n#启用插件+名字  启用插件",
			"\n#停用插件+名字  停用插件",
			"\n#删除插件+名字  删除插件到回收站",
			"\n#恢复插件+名字  从回收站恢复插件",
			"\n#查看回收站  查看回收站内的插件",
			"\n#清空回收站  清空插件回收站",
			"\n警告：清空回收站后里面的插件就再也找不回来了",
			"\n",
			"\n版本：插件管理器3.6",
			"\nMade by @戏天"
		];
		e.reply(msg);
	}
}

function cancel(e) {
	if (my[e.user_id]) {
		clearTimeout(my[e.user_id]);
		delete my[e.user_id];
	}
	if (confirm[e.user_id]) {
		clearTimeout(confirm[e.user_id]);
		delete confirm[e.user_id];
	}
	if (my["单次"]) {
		delete my["单次"];
	}
	if (my["批量"]) {
		delete my["批量"];
	}
}

function find(name) {
	let pluginPath = [], pluginState = [], pluginname = []
	let number = 0

	//导入两个文件夹的文件
	let plugins_file = [];
	for (let tmp = 0; tmp < plugins.length; tmp++) {
		plugins_file.push(fs.readdirSync(`${plugins[tmp]}`));
	}
	let bin_file = fs.readdirSync(`${bin}`)
	//历遍文件查找关键字
	for (let tmp = 0; tmp < plugins_file.length; tmp++)
		plugins_file[tmp].map((filename) => {
			if (filename.includes(name)) {
				pluginPath.push(plugins[tmp])
				pluginname.push(filename)
				if (filename.includes(".bak")) {
					pluginState.push("停用")
				} else pluginState.push("启用")
				number++
			}
		});

	bin_file.map((filename) => {
		if (filename.includes(name)) {
			pluginPath.push(bin)
			pluginname.push(filename)
			pluginState.push("已删除")
			number++
		}
	});
	//返回插件路径，状态，名称，匹配个数
	return { pluginPath, pluginState, pluginname, number };
}

async function install(e, textPath) {
	let old_name = e.file.name;
	let new_name
	//智能重命名
	if (auto_rename) {
		new_name = old_name.replace(/v3|V3|\[.*?\]|\(.*?\)|\（.*?\）/g, "");//重新命名插件
	} else new_name = e.file.name;
	//智能安装
	if (auto_install) {
		let sameplugin = find(e.file.name.replace(/v|V|\.|js|\[.*?\]|\(.*?\)|\（.*?\）|[0-9]+/g, ""));//提取插件关键名字
		//获取文件下载链接
		let fileUrl = await e.friend.getFileUrl(e.file.fid);
		//下载output_log.txt文件
		const response = await fetch(fileUrl);
		const streamPipeline = promisify(pipeline);
		//根据不同匹配数来运行不同安装操作
		switch (sameplugin.number) {
			case 0:
				await streamPipeline(response.body, fs.createWriteStream(textPath));
				if (auto_rename) {//如果开启了智能命名
					fs.renameSync(`${plugins[0]}${old_name}`, `${plugins[0]}${new_name}`);
				}
				e.reply("此插件已安装，重启后生效~");
				break;
			case 1:
				e.reply(`检测到相似插件:${sameplugin.pluginname[0].replace(/.js|.bak/g, "")}，正在执行覆盖安装`);
				//根据插件不同的状态分类处理
				switch (sameplugin.pluginState[0]) {
					case '启用':
						fs.renameSync(`${plugins[0]}${sameplugin.pluginname[0]}`, `${bin}${sameplugin.pluginname[0]}.bak`)
						break;
					case '停用':
						fs.renameSync(`${plugins[0]}${sameplugin.pluginname[0]}`, `${bin}${sameplugin.pluginname[0]}`)
						break;
					default://回收站的不做处理
				}
				await streamPipeline(response.body, fs.createWriteStream(textPath));
				if (auto_rename) {//如果开启了智能命名
					fs.renameSync(`${plugins[0]}${old_name}`, `${plugins[0]}${new_name}`);
				}
				await sleep(500);//防止消息重叠
				e.reply("此插件已覆盖安装，重启后生效~");
				break;
			default:
				e.reply(`检测到多个相似插件，正在进行处理...`)
				let num;//由于搜索逻辑，这里要从后往前排
				for (num = sameplugin.number - 1; num >= 0; num--) {
					switch (sameplugin.pluginState[num]) {
						case '启用':
							fs.renameSync(`${plugins[0]}${sameplugin.pluginname[num]}`, `${bin}${sameplugin.pluginname[num]}.bak`)
							break;
						case '停用':
							fs.renameSync(`${plugins[0]}${sameplugin.pluginname[num]}`, `${bin}${sameplugin.pluginname[num]}`)
							break;
						default://回收站的会直接删除
							fs.unlink(`${bin}${sameplugin.pluginname[num]}`, () => { })
					}
				}
				await streamPipeline(response.body, fs.createWriteStream(textPath));
				if (auto_rename) {//如果开启了智能命名
					fs.renameSync(`${plugins[0]}${old_name}`, `${plugins[0]}${new_name}`);
				}
				await sleep(500);//防止消息重叠
				e.reply("处理完成！此插件已覆盖安装，重启后生效~");
		}
	} else {
		//没开启智能安装直接无脑覆盖
		//获取文件下载链接
		let fileUrl = await e.friend.getFileUrl(e.file.fid);
		//下载output_log.txt文件
		const response = await fetch(fileUrl);
		const streamPipeline = promisify(pipeline);
		await streamPipeline(response.body, fs.createWriteStream(textPath));
		if (auto_rename) {//如果开启了智能命名
			fs.renameSync(`${plugins[0]}${old_name}`, `${plugins[0]}${new_name}`);
		}

		e.reply("此插件已安装，重启后生效~");
	}
}

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}