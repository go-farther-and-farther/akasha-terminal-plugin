
//项目路径
const _path = process.cwd();

//简单应用示例

//1.定义命令规则
export class name extends plugin {
	constructor() {
		super({
			/** 功能名称 */
			name: 'lin改资料',
			/** 功能描述 */
			dsc: '',
			event: 'message',
			/** 优先级，数字越小等级越高 */
			priority: 1000,
			rule: [
				{
					/** 命令正则匹配 */
					reg: "^#(设置|修改)昵称(.*)$", //匹配消息正则，命令正则
					/** 执行方法 */
					fnc: 'name'
				},
				{
					/** 命令正则匹配 */
					reg: "^#(设置|修改)头像(.*)$",//匹配消息正则，命令正则
					/** 执行方法 */
					fnc: 'picture'
				}
			]
		})
	}
	/**
	 * 
	 */
	async name(e) {
		if (!e.isMaster) {
			e.reply("凡人，休得僭越！")
			return true;
		}
		if (e.isGroup) {
			e.reply("请主人私聊我哦！")
			return true;
		}
		if (!e.msg.includes("昵称")) {
			return;
		}
		let msg = e.msg.replace(/昵称|设置|修改/g, "").trim();
		if (!msg) {
			e.reply("请输入昵称");
		}
		await Bot.setNickname(msg);
		e.reply(`设置昵称：${msg}\n成功`)

		return true; //返回true 阻挡消息不再往下
	}
	async picture(e) {
		try {
			if (!e.isMaster) {
				e.reply("凡人，休得僭越！")
				return true;
			}
			if (e.isGroup) {
				e.reply("请主人私聊我哦！")
				return true;
			}
			let img1 = e.img[0];
			await Bot.setAvatar(img1);
			e.reply("设置头像成功")
			return;
		} catch (err) {
			let msg = [
				//文本消息
				"发送命令的同时带上图，没有图无法设置",
			];
			//发送消息
			e.reply(msg);
		}
		return true;//返回true 阻挡消息不再往下
	}
}