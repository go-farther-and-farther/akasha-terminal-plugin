
import fs from "fs";


var date = new Date();
let month = date.getMonth() + 1
let data = `${date.getFullYear()}-${month}-${date.getDate()}-poem.json`
const dirpath = `plugins/akasha-terminal-plugin/data/poem/${data}`;//文件夹路径
//项目路径
const _path = process.cwd();

//简单应用示例

//1.定义命令规则
export class poem extends plugin {
  constructor() {
    super({
      /** 功能名称 */
      name: '诗词接龙',
      /** 功能描述 */
      dsc: '诗词接龙',
      event: 'message',
      /** 优先级，数字越小等级越高 */
      priority: 100, //优先级，越小优先度越高
      rule: [
        {
          /** 命令正则匹配 */
          reg: "^(多人)诗词接龙$", //匹配消息正则，命令正则
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
          reg: "^结束诗词接龙$",
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
      e.reply('成语接龙正在进行哦!可以发送【结束诗词接龙】结束')
      return true;
    }
    if (e.msg.include('多人')) {
      e.reply(`发送【我接+成语】,小月才有反应噢，若果需要进入多人模式，请发送【#多人诗词接龙】`)
      guessConfig.gameing = true;
      guessConfig.current = e.user_id;//这个要改成群号
      guessConfig.timer = setTimeout(() => {
        if (guessConfig.gameing) {
          guessConfig.gameing = false;
          e.reply(`嘿嘿,成语接龙结束啦,这局是小月赢了噢！`);
          return true;
        }
      }, 120000)//毫秒数
    }
    else {
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
    }


    return true; //返回true 阻挡消息不再往下

  }
  async idiom2(e) {
    log('开始判断')
    let guessConfig = getGuessConfig(e);
    let { gameing, current } = guessConfig;
    let es = e.msg.replace(/我接/g, "").trim();


    if (gameing) {
      //e.reply('我想想')
      //e.reply(sz)
      f = open('./poem/poemDict.pk', 'rb') //rb二进制读的方式
      poem_dict = pickle.load(f)//打开字典文件
      try {
        enter = str(es)
        while (enter != 'exit') {
          test = Pinyin().get_pinyin(enter, tone_marks = 'marks', splitter = ' ')//每个字的拼音
          tail = test.split()[-1]//获取到该句诗的最后一个字
          if (!tail in poem_dict.keys()) //如果没有在字典中找到这个字
          {
            e.reply('无法接这句诗。\n')//显示无法接这句诗
            break//进行中断，退出该模式
          }
          else {
            e.reply('\n机器回复：%s' % random.sample(poem_dict[tail], 1)[0]) //如果找到的话，电脑从字典中随机获取一句诗
            enter = str(input('您的回复：'))[-1]//获取你输入在控制台的诗词中的最后一个数字，再次进行循环查找
          }
        }
      }
      catch {
        e.reply("错误")
      }
      //e.reply(`成语接龙结束`);
      //guessConfig.gameing = false
      //clearTimeout(guessConfig.timer);
      //return true;
      //}
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


