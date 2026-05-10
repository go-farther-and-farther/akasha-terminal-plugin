

//项目路径
const _path = process.cwd();

//简单应用示例

//1.定义命令规则
export class idiom extends plugin {
  constructor() {
    super({
      /** 功能名称 */
      name: 'lin成语接龙',
      /** 功能描述 */
      dsc: '',
      event: 'message',
      /** 优先级，数字越小等级越高 */
      priority: 100, //优先级，越小优先度越高
      rule: [
        {
          /** 命令正则匹配 */
          reg: "^成语接龙$", //匹配消息正则，命令正则
          /** 执行方法 */
          fnc: 'idiom1'
        },
        {
          /** 命令正则匹配 */
          reg: "^我接.*$",
          /** 执行方法 */
          fnc: 'idiom2'
        },
        {
          /** 命令正则匹配 */
          reg: "^结束成语接龙$",
          /** 执行方法 */
          fnc: 'idiom3'
        }
      ]
    })
  }
  /**
   * 
   */


  //2.编写功能方法
  //方法名字与rule中的examples保持一致
  //测试命令 npm test 例子
  async idiom1(e) {
    let guessConfig = getGuessConfig(e)
    if (guessConfig.gameing) {
      e.reply('成语接龙正在进行哦!')
      return true;
    }

    let dm = await (await fetch(`https://xiaoapi.cn/API/cyjl.php?id=${e.user_id}&msg=开始成语接龙`)).text();

    //e.reply(dm + `发送【我接+成语】,小月才有反应噢`, true);
    e.reply(`发送【我接+成语】,小月才有反应噢`, true);

    guessConfig.gameing = true;
    guessConfig.current = e.user_id;

    guessConfig.timer = setTimeout(() => {
      if (guessConfig.gameing) {
        guessConfig.gameing = false;
        e.reply(`嘿嘿,成语接龙结束啦,这局是小月赢了噢！`);

        return true;
      }
    }, 120000)//毫秒数
    return true; //返回true 阻挡消息不再往下

  }
  async idiom2(e) {
    log('开始判断')
    let guessConfig = getGuessConfig(e);
    let { gameing, current } = guessConfig;
    let es = e.msg.replace(/我接/g, "").trim();
    let sz = await (await fetch(`https://xiaoapi.cn/API/cyjl.php?id=${guessConfig.current}&msg=我接${es}`)).text();

    if (gameing) {
      e.reply('我想想')
      e.reply(sz)
      if (sz.includes("赢了")) {
        e.reply(`成语接龙结束`);
        guessConfig.gameing = false
        clearTimeout(guessConfig.timer);
        return true;
      }
    }


  }
  async idiom3(e) {

    let guessConfig = getGuessConfig(e);
    let { gameing, current } = guessConfig;


    if (gameing) {
      guessConfig.gameing = false
      clearTimeout(guessConfig.timer);


      e.reply(`成语接龙已结束`);

      return true;
    } else {
      e.reply(`成语接龙游戏都没开始,你结束什么啊？`)
      return true;
    }

  }
}
function getGuessConfig(e) {
  let key = e.message_type + e[e.isGroup ? 'group_id' : 'user_id'];
  var guessConfigMap = new Map()
  let config = guessConfigMap.get(key);
  if (config == null) {
    config = {
      gameing: false,
      current: '',
      timer: null,
    }
    guessConfigMap.set(key, config);
  }
  return config;
}


