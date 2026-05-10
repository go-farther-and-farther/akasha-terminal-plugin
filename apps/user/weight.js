import lodash from 'lodash'

import lin_data from '../../components/lin_data.js';
import moment from "moment"

const currentTime = moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
export class weight extends plugin {
    constructor() {
        super({
            /** 功能名称 */
            name: '查QQ权重',
            /** 功能描述 */
            dsc: '简单开发示例',
            event: 'message',
            /** 优先级，数字越小等级越高 */
            priority: 50000,
            rule: [
                {
                    /** 命令正则匹配 */
                    reg: "^#*查权重(.*)$",
                    /** 执行方法 */
                    fnc: 'weight'
                },
            ]
        })
    }

    //执行方法
    async weight(e) {
        let qq = e.message.filter(item => item.type == 'at')?.map(item => item?.qq)
        console.log(qq);
        if (lodash.isEmpty(qq)) {
            qq = e.msg.match(/\d+/g)
        }
        if (!qq) { qq = [e.user_id] }
        qq.push(Bot.uin)
        let msg = ''
        for (let i of qq) {
            let url = `http://tfapi.top/API/qqqz.php?type=json&qq=${i}`;//听风客的接口

            // QQ：2859167710
            // 查询状态：查询成功
            // 权重：3752
            // 权重越低越容易封号，权重低时别涩涩啦喵~

            let response = await fetch(url);
            let res = await response.json();
            let json = []
            let date = new Date();
            let month = date.getMonth() + 1
            date = date.getDate()
            let template = {
            }
            //读取json文件
            json = await lin_data.getuser2(i, json, `weight`, template, false)
            if (i == Bot.uin) {
                msg = msg + `我的权重：${res.qz}\n记得爱护我哦！`;
            }
            else {
                var list = Object.keys(json)
                msg = msg + `QQ：${i}\n查询状态： ${res.msg}\n权重：${res.qz}\n记录条数：${list.length + 1}\n权重越低越容易封号，权重低时别涩涩啦\n`;
                if (list.length >= 1) {
                    msg = msg + `上次权重权重：${json[list[list.length]].weight}\n`
                    msg = msg + `上次读取时间：${json[list[list.length]].time}`
                }
            }
            json[list.length + 1] = {
                time: currentTime,
                weight: res.qz
            }
            //保存json文件
            json = await lin_data.getuser2(i, json, `weight`, template, true)
        }
        await e.reply(msg);
        return true;
    }
}