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
    let filename = `battle.json`;//文件名

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
async function saveUser(user_id) {
    let filename = `battle.json`;//文件名

    fs.writeFileSync(dirpath + "/" + filename, JSON.stringify(json, null, "\t"));//写入文件
}
async function getUserweapon(user_id) {
    let filename = `${user_id}.json`;

    if (!fs.existsSync(dirpath)) {//如果文件夹不存在
        fs.mkdirSync(dirpath);//创建文件夹
    }

    //如果文件不存在，创建文件
    if (!fs.existsSync(dirpath + "/UserData/" + filename)) {
        fs.writeFileSync(dirpath + "/UserData/" + filename, JSON.stringify({
        }));
    }

    //读取文件
    var json = JSON.parse(fs.readFileSync(dirpath + "/UserData/" + filename, "utf8"));

    return json
}
async function saveUserweapon(json) {
    let filename = `${user_id}.json`;
    fs.writeFileSync(dirpath + "/UserData/" + filename, JSON.stringify(json, null, "\t"));//写入文件
}
async function getweapon() {//获取
    let weapon = JSON.parse(fs.readFileSync(dirpath2, "utf8"));
    return weapon
}
export default { getweapon, getUserweapon, getUser, saveUser, saveUserweapon }