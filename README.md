<div align="center">

<img width="200" src="resources/虚空终端.png" alt="Akasha Terminal Plugin">

# Akasha Terminal Plugin

![动态访问量](https://count.kjchmc.cn/get/@:akasha-terminal-plugin)
![GitHub stars](https://img.shields.io/github/stars/go-farther-and-farther/akasha-terminal-plugin?style=social)
![Gitee stars](https://gitee.com/go-farther-and-farther/akasha-terminal-plugin/badge/star.svg)

**群内游戏 / AI / 工具 多功能插件包**

适配 [TRSS-Yunzai](https://gitee.com/trss/Trss-Yunzai) v3 及衍生版本

[爱发电](https://afdian.com/a/akasha667) · [GitHub](https://github.com/go-farther-and-farther/akasha-terminal-plugin) · [Gitee](https://gitee.com/go-farther-and-farther/akasha-terminal-plugin)

</div>

---

## 安装

<details>
<summary><b>Gitee（国内推荐）</b></summary>

```bash
git clone --depth=1 https://gitee.com/go-farther-and-farther/akasha-terminal-plugin.git ./plugins/akasha-terminal-plugin/
```

</details>

<details>
<summary><b>GitHub（海外）</b></summary>

```bash
git clone --depth=1 https://github.com/go-farther-and-farther/akasha-terminal-plugin.git ./plugins/akasha-terminal-plugin/
```

</details>

**安装依赖：**

```bash
cd plugins/akasha-terminal-plugin
pnpm i
```

> SQLite 需要原生编译，如失败请执行 `pnpm approve-builds` 后重试。不可用时自动回退 JSON 存储。

重启 Bot 后生效。

---

## 功能一览

### 娶群友（分群数据）

| 指令 | 说明 |
|------|------|
| `#娶群友` | 随机娶一位群友 |
| `#强娶 @某人` | 强行求婚（有失败概率） |
| `#抢老婆 @某人` | 联动决斗系统抢走别人的老婆 |
| `#抢劫 @某人` | 抢劫他人金币（不@则抢银行） |
| `#我愿意 @某人` | 回应求婚 |
| `#我拒绝 @某人` | 拒绝求婚 |
| `#分手` / `#闹离婚` / `#甩掉 @某人` | 结束关系 |
| `#打工赚钱` | 打工赚金币 |
| `#领取低保` | 金币低于500时领取500金币 |
| `#抱抱` | 提升老婆好感度 |
| `#家庭信息` | 查看自己的家庭信息（可@他人） |
| `#群cp` | 查看本群所有CP |
| `#看房` / `#买房+编号` | 查看/购买房屋 |
| `#住所改名+名称` | 修改住所名称 |
| `#逛街` / `#进去看看` / `#去下一个地方` / `#回家` | 逛街系统 |
| `#开始银啪` / `#踢出银啪` / `#退出银啪` | 银啪活动 |
| `#上交存款+数量` | 上交金币 |
| `#获取虚空彩球 红球x6 蓝球` | 购买彩票 |
| `#我的彩票` / `#虚空彩球兑换` | 彩票相关 |

### 御前决斗（全局数据）

| 指令 | 说明 |
|------|------|
| `#御前决斗 @某人` | 与群友决斗（需Bot管理员权限） |
| `#修炼` / `#晨练` / `#早` | 修炼获取内力（6-8点有加成） |
| `#睡觉` / `#早睡` | 睡觉获取内力（会触发禁言） |
| `#闭关突破` | 消耗内力突破境界 |
| `#决斗境界列表` / `#我的境界` / `#我的等级` | 查看境界/等级 |
| `#签到` / `#做委托` | 获取纠缠之缘 |
| `#抽武器` / `#祈愿` / `#十连抽武器` | 武器抽卡 |
| `#武器库` / `#我的武器` | 查看武器 |
| `#查水表 @某人` | 查看群成员信息 |
| `#虚空设置权能 @某人` | 管理员设置/移除特殊权限 |

### AI 对话

| 指令 | 说明 |
|------|------|
| 直接发消息 | 按概率触发AI回复（8个免费接口轮换） |
| `#ai概率+数值` | 设置AI触发概率 (0-100%) |
| `#本地概率+数值` | 设置本地词库触发概率 |
| `#ai设置接口+编号` | 切换AI接口 |
| `#ai状态` | 查看当前AI配置 |
| `#开启/关闭引用` | AI回复是否引用原消息 |
| `#只关注@消息` / `#关注所有消息` | 群聊回复模式 |

### 工具功能

| 指令 | 说明 |
|------|------|
| `#百度一下+内容` | 百度搜索 |
| `#历史上的今天` | 历史事件 |
| `#微博热搜` | 微博热搜榜 |
| `#网易云热评` | 网易云热评 |
| `#疯狂星期四` | KFC 文案 |
| `#天气+城市` | 天气查询 |
| `成语接龙` / `我接+成语` | 成语接龙游戏 |
| `多人诗词接龙` / `我接+诗句` | 诗词接龙游戏 |
| `#查权重 @某人` | 查QQ权重 |
| `#设置/修改昵称+名称` | 修改机器人昵称 |

### 系统管理

| 指令 | 说明 |
|------|------|
| `#虚空帮助` / `#游戏规则` | 查看帮助 |
| `#虚空重置配置` | 重置配置（自动备份） |
| `#虚空配置` | 查看当前配置 |
| `#虚空更新` / `#虚空强制更新` | 更新插件 |
| `#虚空重启` | 重启 Bot |
| `#发送报错` / `#发送日志` | 获取错误/命令日志 |

---

## 境界系统

共37个等级 + 无限返璞归真：

| 大境界 | 等级范围 | 所需内力 |
|:------:|:--------:|:--------:|
| 小乘境 | Lv.1-4 | 5 ~ 30 |
| 大乘境 | Lv.5-8 | 40 ~ 85 |
| 宗师境 | Lv.9-12 | 100 ~ 175 |
| 至臻境 | Lv.13-16 | 200 ~ 290 |
| 仙境 | Lv.17-20 | 320 ~ 450 |
| 神境 | Lv.21-24 | 500 ~ 700 |
| 天仙境 | Lv.25-28 | 780 ~ 1060 |
| 道仙境 | Lv.29-32 | 1160 ~ 1550 |
| 混沌境 | Lv.33-36 | 1700 ~ 2260 |
| 返璞归真 | Lv.36+ | 每重+200 |

---

## 数据存储

支持三种后端，按优先级自动回退：**SQLite > MySQL > JSON**

| 后端 | 说明 | 配置 |
|------|------|------|
| SQLite | 默认，零配置 | 数据存 `data/akasha.sqlite` |
| MySQL | 可选 | 修改 `config/mysql_config.json` 启用 |
| JSON | 兜底 | SQLite 不可用时自动使用 |

<details>
<summary><b>SQLite 降级说明</b></summary>

若 `better-sqlite3` 因缺少编译环境不可用，插件不会崩溃，会自动回退 JSON 存储。恢复方法：

```bash
cd plugins/akasha-terminal-plugin
pnpm approve-builds
npm run install-sqlite
```

</details>

---

## 配置

配置文件 `config/akasha.config.yaml`，首次使用自动生成。

<details>
<summary><b>完整配置项</b></summary>

```yaml
# 决斗系统
duel_cfg:
  Magnification: 2        # 战斗力依赖系数 (1-3)
  Cooling_time: 300       # 决斗冷却 (秒)
  cdtime_exercise: 300    # 修炼冷却 (分钟)
  cdtime_break: 30        # 突破冷却 (分钟)

# 娶群友系统
wife_cfg:
  qqwife: 3               # 强娶成功率 (成, 0-10)
  sjwife: 5               # 随机娶成功率 (成, 0-10)
  sjcd: 5                 # 随机娶冷却 (分钟)
  qqcd: 10                # 强娶冷却 (分钟)
  dgcd: 20                # 打工冷却 (分钟)
  bbcd: 60                # 抱抱冷却 (分钟)
  ggcd: 45                # 逛街冷却 (分钟)
  qlpcd: 20               # 抢老婆冷却 (分钟)
  poorcd: 1440            # 低保冷却 (分钟)
  RBBgetcd: 720           # 彩球购买冷却 (分钟)
  gifttime: 5             # 逛街行动次数上限
  notice: 'F'             # 开奖通知主人 (T开/F关)
  group:                  # 开奖通知群列表
    - 123456789
  RBBtime: 20             # 开奖时间 (24制)

# AI 对话
ai_cfg:
  def_gailv: 100          # AI触发概率 (%)
  def_local_gailv: 50     # 本地词库概率 (%)
  def_onlyReplyAt: true   # 群聊是否只回复@消息
  def_ai_now: 1           # 默认AI接口编号

# 自动功能
Auto:
  def_num: 3              # 复读触发次数
  def_fdopen: false       # 自动复读开关
  def_ddopen2: true       # 打断复读开关
```

</details>

---

## 常见问题

<details>
<summary><code>xxx is not defined</code></summary>

执行 `#虚空重置配置` 后重启 Bot。

</details>

<details>
<summary><code>cannot read ... (reading 'sex' / 'nickname')</code></summary>

有人退群导致数据残留，执行 `#虚空清除无效存档`。

</details>

<details>
<summary>CD 怎么改</summary>

修改 `config/akasha.config.yaml` 中对应的冷却时间值，重启生效。

</details>

---

## 贡献

- @越追越远 提供 plugin 框架
- @越追越远 && @尘封 提供决斗 & 娶群友功能
- @长楠 && @尘封 提供娶群友事件资源
- [trss-akasha-terminal-plugin](https://github.com/wbndm1234/trss-akasha-terminal-plugin) — dmqaq、nahida22 二创 TRSS 适配版

**提交问题**：[GitHub Issues](https://github.com/go-farther-and-farther/akasha-terminal-plugin/issues) · [Gitee Issues](https://gitee.com/go-farther-and-farther/akasha-terminal-plugin/issues)

---

## 赞助

[爱发电](https://afdian.com/a/akasha667)

| 昵称 | 金额 | 昵称 | 金额 |
|------|------|------|------|
| 爱发电用户_QBCp | ¥15.00 | 。 | ¥5.00 |
| 爱发电用户_YjGT | ¥5.00 | 长楠 | ¥10.00 |
| 爱发电用户_KAPx | ¥5.00 | 冬季巧克力 | ¥5.00 |
| 花花 | ¥5.00 | 维拉 | ¥5.00 |
| 七 | ¥5.00 | 小丑 | ¥15.00 |
| 三木East | ¥5.00 | 小鳄鱼 | ¥5.00 |
| 雨沫 | ¥5.00 | yuanxing | ¥20.00 |

特别感谢 @FanSky_Qs

点一个小小的 star 吧~
