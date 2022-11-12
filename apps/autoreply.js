import plugin from '../../../lib/plugins/plugin.js'
let perfectmatch = false; //是否perfectmatch true:完全 false:只要有这个词
const hmd_userqq = []; //对于某用户黑名单 ,隔开
const bmd_GroupQQ = []; //需要使用的群的白名单 ,隔开，没有则全局
let alllist = Bot.gl
var bmd = bmd_GroupQQ
bmd = [];
console.log("标记点1");
// Matchinglist
// 可以使用|分割keyword
let Matchinglist = [
  { keyword: "自动回复|回复", Contentsent: ["我可以自动回复哦!", "我会自动回复哦！"] },
  { keyword: "测试", Contentsent: ["收到"] },
  { keyword: "安装插件|插件", Contentsent: ["v2放lib/example  v3放plugins/example"] },
];
//判断白名单列表为空，已开启全局模式
if (bmd_GroupQQ.length === 0)
  for (const key of alllist) {
    bmd.push(key[0])
  }
console.log("标记点2");
export class autoreply extends plugin {

  constructor() {
    super({
      name: '自动答疑',
      dsc: '复读用户Contentsent，然后撤回',
      /** https://oicqjs.github.io/oicq/#events */
      event: 'message',
      priority: 5000,
      rule: [
        {
          /** 命令正则匹配 */
          reg: '^#自动(答疑|解答)$',
          /** 执行方法 */
          fnc: 'autoreplyy'
        }
      ]
    })
  }

  /** 解答 */
  async autoreplyy() {
    console.log("标记：进入了autoreply")
    /** 设置上下文，后续接收到内容会执行doRep方法 */
    this.setContext('doRep')
    /** 回复 */
    await this.reply('请发送要解答的问题', false, { at: true })
  }

  /** 接受内容 */
  doRep() {
    /** 复读内容 */
    console.log('lll');
    this.reply1(this.e.message)//, false, { recallMsg: 5 }
    console.log('llll');
    /** 结束上下文 */
    this.finish('doRep')
  }
  async reply1(e) {
    if (!bmd.includes(this.e.group_id)) {
      return;
    }
    if (hmd_userqq.includes(this.e.user_id)) {
      return;
    }

    console.log(this.e.msg)
    if (this.e.msg) {
      for (const Subitem of Matchinglist) {
        // console.log(Subitem.keyword);
        if (perfectmatch) {
          // 需要分割keyword
          if (Subitem.keyword.indexOf("|") !== -1) {
            // 判断是否existence
            let existence = Subitem.keyword.split("|").some((i) => {
              if (this.e.msg === i) {
                return true;
              }
            });
            if (existence) {
              // Issuecontent(e, Subitem);
              return this.Issuecontent(e, Subitem);
              // this.reply(Subitem.Contentsent[Math.floor(Math.random() * Subitem.Contentsent.length)]);
            }
          } else {
            // 不需要分割keyword
            if (Subitem.keyword === this.e.msg) {
              return this.Issuecontent(e, Subitem);
              // this.reply(Subitem.Contentsent[Math.floor(Math.random() * Subitem.Contentsent.length)]);
            }
          }
        } else if (!perfectmatch) {
          // 需要分割keyword
          if (Subitem.keyword.indexOf("|") !== -1) {
            // 判断是否existence
            let existence = Subitem.keyword.split("|").some((i) => {
              if (this.e.msg.indexOf(i) !== -1) {
                return true;
              }
            });
            if (existence) {
              // Issuecontent(e, Subitem);
              return this.Issuecontent(e, Subitem);
              // this.reply(Subitem.Contentsent[Math.floor(Math.random() * Subitem.Contentsent.length)]);
            }
          } else {
            // 不需要分割keyword
            if (this.e.msg.indexOf(Subitem.keyword) !== -1) {
              return this.Issuecontent(e,Subitem)
              // this.reply(Subitem.Contentsent[Math.floor(Math.random() * Subitem.Contentsent.length)]);
            }
          }
        }
      }
    }
  }
  async Issuecontent(e, Subitem) {
    this.reply(Subitem.Contentsent[Math.floor(Math.random() * Subitem.Contentsent.length)]);
  }
}
