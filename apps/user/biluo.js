;
import common from '../../../../lib/common/common.js';
//本插件作者：碧落
export class biluo extends plugin {
	constructor() {
		super({
			/** 功能名称 */
			name: 'biluo',
			/** 功能描述 */
			dsc: 'biluo',
			event: 'message',
			/** 优先级，数字越小等级越高 */
			priority: 799,
			rule: [
				{
					/** 命令正则匹配 */
					reg: '^#历史上的今天$',
					/** 执行方法 */
					fnc: 'today'
				},
				{
					/** 命令正则匹配 */
					reg: '^#微博热搜$',
					/** 执行方法 */
					fnc: 'hot'
				},
				{
					/** 命令正则匹配 */
					reg: '^#(网易云热评)$',
					/** 执行方法 */
					fnc: 'wangyiyunhot'
				},
				{
					/** 命令正则匹配 */
					reg: '^#(舔狗日记)$',
					/** 执行方法 */
					fnc: 'dogday'
				},
				{
					/** 命令正则匹配 */
					reg: '^#(翻译)(.*)$',
					/** 执行方法 */
					fnc: 'fanyi'
				},
				{
					/** 命令正则匹配 */
					reg: '^#(查询手机号)(.*)$',
					/** 执行方法 */
					fnc: 'phonenum'
				},
				{
					/** 命令正则匹配 */
					reg: '^#(知乎热榜)$',
					/** 执行方法 */
					fnc: 'zhihuhot'
				},
				{
					/** 命令正则匹配 */
					reg: '^#(举牌)(.*)$',
					/** 执行方法 */
					fnc: 'jvpai'
				},
				{
					/** 命令正则匹配 */
					reg: '^#(骂我)$',
					/** 执行方法 */
					fnc: 'mawo'
				},
				{
					/** 命令正则匹配 */
					reg: '^#(生成签名)(.*)$',
					/** 执行方法 */
					fnc: 'qianming'
				},
				{
					/** 命令正则匹配 */
					reg: '^#(王者)(.*)(语音)$',
					/** 执行方法 */
					fnc: 'wangzhevi'
				},
				{
					/** 命令正则匹配 */
					reg: '^#(来句诗)$',
					/** 执行方法 */
					fnc: 'laijvshi'
				},
				{
					/** 命令正则匹配 */
					reg: '^#(.*)(天气)$',
					/** 执行方法 */
					fnc: 'tianqiyubao'
				},
				{
					/** 命令正则匹配 */
					reg: '^#(来份动漫图)$',
					/** 执行方法 */
					fnc: 'dongman'
				},
				{
					/** 命令正则匹配 */
					reg: '^#(摸鱼日记)$',
					/** 执行方法 */
					fnc: 'moyu'
				},
				{
					/** 命令正则匹配 */
					reg: '^#(我在人间凑数的日子)$',
					/** 执行方法 */
					fnc: 'coushu'
				},
			]
		})
	}
	/**
	 * 
	 * @param ms
	 */
	async jvpai(e) {
		let msg = e.msg;
		let place = msg.replace(/#|举牌/g, "").trim();
		let url = `http://api.52guleng.ml/api/jp/api.php?msg=${place}`;
		let response = await fetch(url);
		let res = await response.text();
		console.log('举牌', res)
		e.reply(segment.image(res));
	}


	async today(e) {
		let msg = e.msg
		let url = `https://api.sdgou.cc/api/lishi/?format=json`;
		let response = await fetch(url);
		let res = await response.json();
		let allmsg = {}
		const forwarder = {
			nickname: Bot.nickname,
			user_id: Bot.uin,
		};

		if (res.code == 200) {
			e.reply(`今天是${res.day}`)
			e.reply(`历史上的今天${res.content}`)
		} else {
			e.reply(`状态码${res.code},api错误`)
		}
	}
	async hot(e) {
		let url = `https://api.sdgou.cc/api/wbhot/`;
		let response = await fetch(url);
		let res = await response.json();
		let allmsg = {}
		const forwarder = {
			nickname: Bot.nickname,
			user_id: Bot.uin,
		};
		if (res.code == 200) {
			e.reply(`今天是${res.day}`)

			e.reply(`1.${res.Top_1}
				
2.${res.Top_2}

3.${res.Top_3}

4.${res.Top_4}

5.${res.Top_5}

6.${res.Top_6}

7.${res.Top_7}

8.${res.Top_8}

9.${res.Top_9}

10.${res.Top_10}`)
		} else {
			e.reply(`状态码${res.code},api错误`)
		}

	}
	async fanyi(e) {
		let msg = e.msg;
		let place = msg.replace(/#|翻译/g, "").trim();
		let url = `https://api.sdgou.cc/api/fanyi/?msg=${place}`;
		let response = await fetch(url);
		console.log('翻译', response);
		let res = await response.text();
		e.reply(`${res}`)
	}
	async wangyiyunhot(e) {
		let url = 'https://api.caonm.net/api/yulu/wyrp.php?'
		let response = await fetch(url);
		let res = await response.text();
		e.reply(res)
	}
	async dogday(e) {
		let url = 'https://api.sdgou.cc/api/tgrj/'
		let response = await fetch(url);
		let res = await response.text();
		e.reply(res);
	}
	async phonenum(e) {
		let msg = e.msg
		let place = msg.replace(/#|查询手机号/g, "").trim();
		let url = `https://api.sdgou.cc/api/tel/?tel=${place}`;
		let response = await fetch(url);
		let res = await response.json();
		if (res.code == 200) {
			e.reply(`手机号码：${res.tel}
				
${res.local}
				
${res.duan}

${res.type}

${res.yys}

${res.bz}`)
		} else {
			e.reply(`状态码${res.code},api错误`)
		}
	}
	async zhihuhot(e) {
		let url = `https://api.sdgou.cc/api/zhihuhot/`;
		let response = await fetch(url);
		let res = await response.json();
		let allmsg = {}
		const forwarder = {
			nickname: Bot.nickname,
			user_id: Bot.uin,
		};
		let msgList = []
		var length = Object.keys(res)
		if (res.code != 200) {
			e.reply('api错误', true)
			return false;
		} else if (res.code == 200) {
			e.reply(`知乎热榜`)
			await common.sleep(500)
			for (let i = 3; i < 13; i++) {
				allmsg[i] = `标题：${res[length[i]].title}
										
内容：${res[length[i]].excerpt}
		
热度：${res[length[i]].hot}`
				msgList.push({
					message: { type: "text", text: `${allmsg[i]}` },
					...forwarder,
				});
				await common.sleep(0)
			}
			e.reply(await Bot.makeForwardMsg(msgList), false)
		} else {
			e.reply(`未知错误，请重试`, true)
		}
	}
	async mawo(e) {
		let url = `http://ovoa.cc/api/ktff.php`;
		let response = await fetch(url);
		let res = await response.text();
		e.reply(res)
	}
	async qianming(e) {
		let msg = e.msg
		let place = msg.replace(/#|生成签名/g, "").trim();
		let url = `http://api2.888655.xyz/api/worda.php?msg=${place}`;
		let response = await fetch(url);
		let res = await response.text();
		e.reply(segment.image(res))
	}
	async wangzhevi(e) {
		let msg = e.msg
		let place = msg.replace(/#|王者|语音/g, "").trim();
		let url = `https://api.guyunge.top/API/wzyy.php?msg=${place}`;
		let response = await fetch(url);
		let res = await response.json();
		if (res.code == 1) {
			e.reply(segment.image(res.img))
			let array = res.data
			let num = Math.floor(Math.random() * (array.length - 1));
			e.reply(segment.record(array[num].voice))
		} else if (res.code == -1) {
			e.reply('查询英雄名字不能为空，请输入您要查询的英雄')
		} else if (res.code == -1) {
			e.reply('英雄不存在')
		}
	}
	async laijvshi(e) {
		let url = 'https://api.guyunge.top/API/gushi.php'
		let response = await fetch(url);
		let res = await response.text();
		e.reply(res)
	}
	async tianqiyubao(e) {
		let msg = e.msg
		let place = msg.replace(/#|天气/g, "").trim();
		let url = `https://api.sdgou.cc/api/wether/?city=${place}`;
		let response = await fetch(url);
		let res = await response.json();
		let allmsg = {}
		const forwarder = {
			nickname: Bot.nickname,
			user_id: Bot.uin,
		};
		let msgList = []
		if (res.desc == "invilad-citykey") {
			e.reply([segment.at(e.sender.user_id), ` ${place}并不是一个正确的地名，请输入正确的地名`], true)
			return false;
		} else if (res.desc == "OK") {
			e.reply(`${res.data.city}近期天气`)
			await common.sleep(500)
			for (let i = 0; i < getJsonLength(res.data.forecast[i]) - 1; i++) {
				allmsg[i] = `日期：${res.data.forecast[i].date}
最高温度：${res.data.forecast[i].high}
最低温度：${res.data.forecast[i].low}
风向：${res.data.forecast[i].fengxiang}
天气：${res.data.forecast[i].type}`
				msgList.push({
					message: { type: "text", text: `${allmsg[i]}` },
					...forwarder,
				});
				await common.sleep(0)
			}
			console.log(msgList)
			e.reply(await Bot.makeForwardMsg(msgList), false)
		} else {
			e.reply([segment.at(e.sender.user_id), ` 未知错误，请重试`], true)
		}


		function getJsonLength(json) {
			var jsonLength = 0;
			for (var i in json) {
				jsonLength++;
			}
			return jsonLength;
		}
	}
	async dongman(e) {
		let url = 'https://jintia.jintias.cn/api/acg.php?return=json'
		let response = await fetch(url);
		let res = await response.json();
		if (res.code == 200) {
			e.reply(segment.image(res.acgurl))
		} else {
			e.reply('api错误')
		}
	}
	async moyu(e) {
		let url = 'http://api.gt5.cc/api/myr?type=json'
		let response = await fetch(url);
		let res = await response.json();
		if (res.code == 200) {
			e.reply(res.title)
			e.reply(segment.image(res.imgurl))
		} else {
			e.reply('api错误')
		}
	}
	async coushu(e) {
		let url = 'http://api.gt5.cc/api/rj'
		let response = await fetch(url);
		let res = await response.json();
		if (res.code == 1) {
			e.reply(res.data.yiyan)
		} else {
			e.reply('api错误')
		}
	}


}