/*
* 请注意，系统不会读取help_default.js ！！！！
* 【请勿直接修改此文件，且可能导致后续冲突】
*
* 如需自定义可将文件【复制】一份，并重命名为 help.js
*
* */

// 帮助配置
export const helpCfg = {
  // 帮助标题
  title: 'akasha帮助',

  // 帮助副标题
  subTitle: 'Yunzai-Bot & akasha-terminal-plugin',

  // 帮助表格列数，可选：2-5，默认3
  // 注意：设置列数过多可能导致阅读困难，请参考实际效果进行设置
  colCount: 3,

  // 单列宽度，默认265
  // 注意：过窄可能导致文字有较多换行，请根据实际帮助项设定
  colWidth: 265,

  // 皮肤选择，可多选，或设置为all
  // 皮肤包放置于 resources/help/theme
  // 皮肤名为对应文件夹名
  // theme: 'all', // 设置为全部皮肤
  // theme: ['default','theme2'], // 设置为指定皮肤
  theme: 'all',

  // 排除皮肤：在存在其他皮肤时会忽略该项内设置的皮肤
  // 默认忽略default：即存在其他皮肤时会忽略自带的default皮肤
  // 如希望default皮肤也加入随机池可删除default项
  themeExclude: ['default'],

  // 是否启用背景毛玻璃效果，若渲染遇到问题可设置为false关闭
  bgBlur: true
}

// 帮助菜单内容
export const helpList = [{
  group: '娱乐功能',
  list: [{
    icon: 80,
    title: '#摸鱼日记',
    desc: '诶嘿。'
  }, {
    icon: 46,
    title: '#我在人间凑数的日子',
    desc: '人终究还是要活着'
  }, {
    icon: 33,
    title: '#舔狗日记',
    desc: '其实当舔狗也不容易......'
  }, {
    icon: 31,
    title: '#生成签名xx',
    desc: '随机生成签名'
  }, {
    icon: 22,
    title: '#举牌xx',
    desc: '打call'
  }, {
    icon: 52,
    title: '#骂我',
    desc: '承受能力弱的请勿使用此指令'
  }, {
    icon: 57,
    title: '#来句诗',
    desc: '今日份诗句，请查收'
  }]
}, {
  group: "查询指令",
  list: [{
    icon: 58,
    title: '#来份动漫图',
    desc: '随机发送动漫图片'
  }, {
    icon: 43,
    title: '#搜歌xx #搜动漫xx',
    desc: '功能请看指令'
  }, {
    icon: 59,
    title: '#历史上的今天',
    desc: '了解历史上的今天发生的事情'
  }, {
    icon: 21,
    title: '#知乎热榜',
    desc: '发送知乎热榜'
  }, {
    icon: 39,
    title: '#微博热搜',
    desc: '发送当前微博热搜'
  }, {
    icon: 55,
    title: '#网易云热评',
    desc: '发送网易云上的热评'
  }, {
    icon: 52,
    title: '#翻译xx',
    desc: '只是翻译而已'
  }, {
    icon: 76,
    title: '#王者xx语音',
    desc: '发送王者里xx的语音'
  }, {
    icon: 78,
    title: '#查询手机号xx',
    desc: '了解手机号的信息'
  }, {
    icon: 79,
    title: '#地点查询xx',
    desc: '查询某一地方的信息'
  }, {
    icon: 60,
    title: '#路线规划查询xx到xx',
    desc: '帮助规划路线'
  }]
}, {
  group: '决斗小游戏',
  list: [{
    icon: 21,
    title: '#游戏帮助',
    desc: '获取决斗游戏帮助'
  }]
}, {
  group: "其他功能",
  list: [{
    icon: 38,
    title: '#akasha文案帮助',
    desc: '查询文案帮助'
  }]
}, {
  group: '管理命令，仅管理员可用',
  auth: 'master',
  list: [{
    icon: 95,
    title: '#akasha更新',
    desc: '更新akasha插件'
  }, {
    icon: 80,
    title: '#akasha版本',
    desc: '查看版本记录'
  }, {
    icon: 11,
    title: '#跑路 #回来',
    desc: '是否回复本群消息'
  }, {
    icon: 80,
    title: 'ai开启/关闭',
    desc: 'ai开关'
  }, {
    icon: 80,
    title: '太吵了/太安静了',
    desc: 'ai触发概率调整'
  }, {
    icon: 80,
    title: '只关注@消息/关注所有消息',
    desc: 'ai模式调整'
  }, {
    icon: 22,
    title: '#akasha发送报错',
    desc: '获取akasha报错日志'
  }, {
    icon: 22,
    title: '#akasha重置报错',
    desc: 'akasha重置报错消息'
  }, {
    icon: 71,
    title: '#akasha发送日志',
    desc: '获取akasha运行日志'
  }, {
    icon: 74,
    title: '发送akasha配置',
    desc: '管理功能'
  }, {
    icon: 54,
    title: '#重置Lim配置',
    desc: '管理功能'
  }]
}]
