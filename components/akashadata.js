import plugin from '../../../lib/plugins/plugin.js'
import fs from "fs";
import { segment } from "oicq";
const dirpath = "plugins/akasha-terminal-plugin/data";//文件夹路径
const dirpath2 = "plugins/akasha-terminal-plugin/resources/weapon/weapon.json";
let Template_Userweapon = {//创建该用户
    "money": 5,
};
let Template_User = {//创建该用户
    "experience": 0,
    "level": 0,
    "levelname": '无等级',
    "Privilege": 0,
};

let num3 = weapon[`3星数量`]
let num4 = weapon[`4星数量`]
let num5 = weapon[`5星数量`]


async function getUser(user_id) {

    if (!fs.existsSync(dirpath)) {//如果文件夹不存在
        fs.mkdirSync(dirpath);//创建文件夹
    }

    if (!fs.existsSync(dirpath + "/" + filename)) {//如果文件不存在
        fs.writeFileSync(dirpath + "/" + filename, JSON.stringify({//创建文件
        }));
    }
    var json = JSON.parse(fs.readFileSync(dirpath + "/" + filename, "utf8"));//读取文件

    if (!json.hasOwnProperty(user_id)) {//如果json中不存在该用户
        json[user_id] = Template_User
    }

    return json
}
async function getUserweapon(user_id) {

    if (!fs.existsSync(dirpath)) {//如果文件夹不存在
        fs.mkdirSync(dirpath);//创建文件夹
    }

    //如果文件不存在，创建文件
    if (!fs.existsSync(dirpath + "/" + filename)) {
        fs.writeFileSync(dirpath + "/" + filename, JSON.stringify({
        }));
    }

    //读取文件
    var json = JSON.parse(fs.readFileSync(dirpath + "/" + filename, "utf8"));

    return json
}
async function getweapon() {//获取
    let weapon = JSON.parse(fs.readFileSync(dirpath2, "utf8"));
    return weapon
}
export default { getweapon, getUserweapon, getUser }