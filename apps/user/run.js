import lin_data from '../../components/lin_data.js';
const BotName = global.Bot.nickname;
var Template = {//创建该用户
  "shield": [],//普通屏蔽
  "shield2": []//被管理员屏蔽了
};
var json = {}
var json2 = {}
export class runset extends plugin {
  constructor() {
    super({
      /** 功能名称 */
      name: '跑路管理',
      /** 功能描述 */
      dsc: '#跑路，bot就不接受消息了',
      event: 'message',
      /** 优先级，数字越小等级越高 */
      priority: -1,
      rule: [
        {
          /** 命令正则匹配 */
          reg: '^#?跑路$',
          /** 执行方法 */
          fnc: 'runforever',
        },
        {
          /** 命令正则匹配 */
          reg: '^#?回避$',
          /** 执行方法 */
          fnc: 'runtemporary',
        },
        {
          /** 命令正则匹配 */
          reg: '^#?回来$',
          /** 执行方法 */
          fnc: 'goback',
        },
        {
          /** 命令正则匹配 */
          reg: '^#?跑路列表$',
          /** 执行方法 */
          fnc: 'runlist',
          Permission: 'master'
        },
        {
          /** 命令正则匹配 */
          reg: '^#?别?(理|屏蔽)我$',
          /** 执行方法 */
          fnc: 'userrun',
        },
        {
          /** 命令正则匹配 */
          reg: '^#?(解除)?(屏蔽|别理)(此人|他|她|它)?$',
          /** 执行方法 */
          fnc: 'setuserrun',
        },
        {
          /** 命令正则匹配 */
          reg: '^#?屏蔽列表$',
          /** 执行方法 */
          fnc: 'fwlist',
        },
      ]
    })
  }
  /**
   * 
   * 
   */
  //机器人群聊永久跑路
  async runforever(e) {
    if (!e.group.is_owner && !e.group.is_admin && !e.isMaster)//如果是群主或管理员
      return e.reply(`只有群主或管理员才能让${BotName}跑路！`);//回复消息
    var id = e.group_id
    json = await lin_data.getdata(id, json, false)
    if (e.msg == "#跑路" || (e.msg.includes('跑路') && (e.msg.includes(BotName) || e.atme))) {//如果消息内容是跑路指令
      if (!json[id].run) {//如果不在跑路列表中
        json[id].run = true;//添加到跑路列表
        json = await lin_data.getdata(e.group_id, json, true)
        e.reply(`本群${BotName}跑路了，再见啦！`);//回复消息
      } else {//如果在跑路列表中
        e.reply(`本群${BotName}已经跑路了，你还想再让${BotName}跑一次吗？`);//回复消息
      }
    }
    return true;//拦截指令
  }
  //机器人群聊暂时回避
  async runtemporary(e) {
    if (!e.group.is_owner && !e.group.is_admin && !e.isMaster)//如果是群主或管理员
      return e.reply(`只有群主或管理员才能让${BotName}回避！`);//回复消息
    var id = e.group_id
    json = await lin_data.getdata(id, json, false)
    if (e.msg == "#回避" || (e.msg.includes('回避') && (e.msg.includes(BotName) || e.atme))) {
      json[id].run = true;//添加到跑路列表
      e.reply(`${BotName}回避一分钟，绝对不会偷看哦！`);//回复消息
      setTimeout(() => {//冷却时间
        if (json[id]) {
          e.reply(`一分钟已经过去了，${BotName}回来了哦！`)
          json[id].run = false;
        }
      }, 1 * 1000 * 60);
    }
    return true;//拦截指令
  }
  //机器人群聊回来
  async goback(e) {
    if (!e.group.is_owner && !e.group.is_admin && !e.isMaster)//如果是群主或管理员
      return e.reply(`只有群主或管理员才能让${BotName}回来`);//回复消息
    var id = e.group_id
    json = await lin_data.getdata(id, json, false)
    if (e.msg == "#回来" || (e.msg.includes('回来') && (e.msg.includes(BotName) || e.atme))) {//如果消息内容是回来指令
      if (!json[id].run) {//如果不在跑路列表中
        e.reply(`本群${BotName}没有跑路，一直到在哦！`);//回复消息
      } else {//如果在跑路列表中
        json[id].run = false
        json = await lin_data.getdata(e.group_id, json, true)
        e.reply(`本群${BotName}已经回来了，快来和我玩吧！`);//回复消息
      }
    }
    return true;//拦截指令
  }
  //机器人群聊跑路列表
  async runlist(e) {
    var id = e.group_id
    json = await lin_data.getdata(id, json, false)
    let runnum = 0
    let msg = `在以下群聊跑路啦！\n`
    let list = Object.keys(json)//获取群号
    for (let i of list) {
      if (json[i].run) {
        runnum++
        msg = msg + `${i}\n`
      }
    }
    if (runnum == 0) {//如果跑路列表为空
      e.reply("当前没有跑路的群聊哦！");//回复消息
    } else {//如果跑路列表不为空
      e.reply(msg);//回复消息
    }
    return true;//拦截指令
  }
  //用户让机器人屏蔽自己
  async userrun(e) {
    var id = e.group_id
    var id2 = e.user_id
    json2 = await lin_data.getuser(id, json2, 'run', Template, false)//只在群聊有效
    if ((e.msg.includes('#别理我') || e.msg.includes('#屏蔽我')) || (e.msg.includes('屏蔽我') || e.msg.includes('别理我')) && (e.msg.includes(BotName) || e.atme)) {//如果消息内容是跑路指令
      if (json2[e.group_id].shield.indexOf(id2) == -1) {//如果不在跑路列表中
        json2[e.group_id].shield.push(id2)
        json2 = await lin_data.getuser(id, json2, 'run', Template, true)//只在群聊有效
        e.reply(`本群你（${id2}）已经被屏蔽了，不理你了！`);//回复消息
      } else {//如果在跑路列表中
        e.reply(`本群你已经被屏蔽了，你还想再让我屏蔽你一次吗？`);//回复消息
      }
    }
    else if ((e.msg.includes('#理我') || e.msg.includes('#别屏蔽我')) || (e.msg.includes('别屏蔽我') || e.msg.includes('理我')) && (e.msg.includes(BotName) || e.atme)) {//如果消息内容是跑路指令
      if (json2[e.group_id].shield.indexOf(id2) == -1) {//如果不在屏蔽列表中
        e.reply(`本群你没有被屏蔽，你想让我屏蔽你吗？`);//回复消息
      } else {//如果在跑路列表中
        json2[e.group_id].shield = json2[e.group_id].shield.filter(item => item != e.user_id)
        json2 = await lin_data.getuser(id, json2, 'run', Template, true)//只在群聊有效
        e.reply(`成功解除对你的屏蔽！`);//回复消息
      }
    }
    return true;//拦截指令
  }
  //让机器人屏蔽别人
  async setuserrun(e) {
    var id = e.group_id
    json2 = await lin_data.getuser(id, json2, 'run', Template, false)//只在群聊有效
    console.log(json2)
    if (!e.group.is_owner && !e.group.is_admin && !e.isMaster)//如果是群主或管理员
      return e.reply(`只有群主或管理员才能让${BotName}屏蔽别人！`);//回复消息
    if (e.at && (e.msg.includes('#解除')) || (e.msg.includes('解除') && (e.msg.includes(BotName) || e.atme))) {//如果消息内容是跑路指令
      if (json2[e.group_id].shield2.indexOf(e.at) == -1) {//如果不在跑路列表中
        e.reply(`本群${e.at}没有被屏蔽！`);//回复消息
      } else {//如果在跑路列表中
        json2[e.group_id].shield2 = json2[e.group_id].shield2.filter(item => item != e.at)
        await lin_data.getuser(id, json2, 'run', Template, true)//只在群聊有效
        e.reply(`本群${e.at}已经被解除屏蔽了！`);//回复消息
      }
      return
    }
    if (e.at && (e.msg.includes('#')) || ((e.msg.includes("别理") || e.msg.includes("屏蔽")) && (e.msg.includes(BotName) || e.atme))) {//如果消息内容是跑路指令
      if (json2[e.group_id].shield2.indexOf(e.at) == -1) {//如果不在跑路列表中
        json2[e.group_id].shield2.push(e.at)
        await lin_data.getuser(id, json2, 'run', Template, true)//只在群聊有效
        e.reply(`本群你（${e.at}）被屏蔽了，不理${e.at}了！`);//回复消息
        return true;//拦截指令
      } else {//如果在跑路列表中
        e.reply(`本群${e.at}已经被屏蔽了!`);//回复消息
      }
    }
    return true;//拦截指令
  }
  //屏蔽人员列表
  async fwlist(e) {
    var id = e.group_id
    json2 = await lin_data.getuser(id, json2, 'run', Template, false)//只在群聊有效
    if (!e.group.is_owner && !e.group.is_admin && !e.isMaster)//如果是群主或管理员
      return e.reply(`只有群主或管理员才能让${BotName}展示屏蔽列表`);//回复消息
    if (e.msg == "#屏蔽列表" || (e.msg.includes('屏蔽列表') && (e.msg.includes(BotName) || e.atme))) {//如果消息内容是跑路指令
      if (json2[e.group_id].shield2.length > 0 || json2[e.group_id].shield.length > 0) {//如果不在跑路列表中
        let msg = ''
        if (json2[e.group_id].shield2.length > 0) {
          msg = msg + '自己选择屏蔽的人：'
          for (let i of json2[e.group_id].shield)
            msg = msg + `\n${i}`
        }
        if (json2[e.group_id].shield2.length > 0) {
          msg = msg + `\n被管理员屏蔽的人:`
          for (let i of json2[e.group_id].shield2)
            msg = msg + `\n${i}`
        }
        e.reply(msg);//回复消息
      } else {//如果在跑路列表中
        e.reply(`本群没有被屏蔽的人！`);//回复消息
      }
    }
    return true;//拦截指令
  }
} export class run extends plugin {
  constructor() {
    super({
      /** 功能名称 */
      name: '跑路插件',
      /** 功能描述 */
      dsc: '#跑路，bot就不接受消息了',
      event: 'message',
      /** 优先级，数字越小等级越高 */
      priority: 1,
      rule: [
        {
          /** 命令正则匹配 */
          reg: '',
          /** 执行方法 */
          fnc: 'run',
        }
      ]
    })
  }
  /**
   * 
   */
  async run(e) {
    if (!e.isGroup) return false;
    console.log(`拦截判断`)
    var id = e.group_id
    var id2 = e.user_id
    json = await lin_data.getdata(id, json, false)
    json2 = await lin_data.getuser(id, json2, 'run', Template, false)//只在群聊有效
    //如果该群聊在跑路列表中
    if (json[id].run || (json2[e.group_id].shield.indexOf(id2) !== -1) || (json2[e.group_id].shield2.indexOf(id2) !== -1))
      return true;//拦截指令
    return false;//放行指令
  }
}
