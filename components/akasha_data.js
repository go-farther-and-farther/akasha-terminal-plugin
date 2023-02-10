import fs from "fs";
const dirpath = "plugins/akasha-terminal-plugin/data"
const QQYpath = "plugins/akasha-terminal-plugin/data/qylp"
const QQYhomepath = "plugins/akasha-terminal-plugin/data/qylp/UserHome"
const QQYplacepath = "plugins/akasha-terminal-plugin/data/qylp/UserPlace"
const QQYhousepath = "plugins/akasha-terminal-plugin/data/qylp/UserHouse"
//这两个函数都是用来读取和保存json数据的
async function getUser(id, json, Template, filename, is_save) {
    /*if (filename.indexOf(".json") == -1) {//如果文件名不包含.json
        filename = filename + ".json";//添加.json
    }*/
    if (!is_save) {
        if (!fs.existsSync(dirpath)) {//如果文件夹不存在
            fs.mkdirSync(dirpath);//创建文件夹
        }
        if (!fs.existsSync(dirpath + "/" + filename)) {//如果文件不存在
            fs.writeFileSync(dirpath + "/" + filename, JSON.stringify({//创建文件
            }));
        }
        var json = JSON.parse(fs.readFileSync(dirpath + "/" + filename, "utf8"));//读取文件
        if (!json.hasOwnProperty(id)) {//如果json中不存在该用户
            json[id] = Template
        }
        return json;
    }
    else {
        fs.writeFileSync(dirpath + "/" + filename, JSON.stringify(json, null, "\t"));//写入文件
        return json;
    }
}
async function getUser2(user_id, json, dirname, is_save) {
    if (is_save) {
        let filename = `${user_id}.json`;
        fs.writeFileSync(dirpath + `/${dirname}/` + filename, JSON.stringify(json, null, "\t"));
    }
    else {
        let filename = `${user_id}.json`;
        if (!fs.existsSync(dirpath)) {//如果文件夹不存在
            fs.mkdirSync(dirpath);//创建文件夹
        }
        //如果文件不存在，创建文件
        if (!fs.existsSync(dirpath + `/${dirname}/` + filename)) {
            fs.writeFileSync(dirpath + `/${dirname}/` + filename, JSON.stringify({
            }));
        }
        //读取文件
        var json = JSON.parse(fs.readFileSync(dirpath + `/${dirname}/` + filename, "utf8"));
        return json
    }
}
async function getQQYUserBattle(id, json, is_save) {
    if (!is_save) {
        var battlefilename = `battle.json`;//文件名
        if (!fs.existsSync(dirpath)) {//如果文件夹不存在
            fs.mkdirSync(dirpath);//创建文件夹
        }
        if (!fs.existsSync(dirpath + "/" + battlefilename)) {//如果文件不存在
            fs.writeFileSync(dirpath + "/" + battlefilename, JSON.stringify({//创建文件
            }));
        }
        var json = JSON.parse(fs.readFileSync(dirpath + "/" + battlefilename, "utf8"));//读取文件
        if (!json.hasOwnProperty(id)) {//如果json中不存在该用户
            var battleTemplate = {//创建该用户
                "experience": 0,
                "level": 0,
                "levelname": '无等级',
                "Privilege": 0,
            };
            json[id] = battleTemplate
            fs.writeFileSync(dirpath + "/" + battlefilename, JSON.stringify(json, null, "\t"));//写入文件
        }
        return json;
    }
    else {
        fs.writeFileSync(dirpath + "/" + battlefilename, JSON.stringify(json, null, "\t"));//写入文件
        return json;
    }
}
async function getQQYUserPlace(id, json, filename, is_save) {
    if (!is_save) {
        if (!fs.existsSync(QQYpath)) {//如果文件夹不存在
            fs.mkdirSync(QQYpath);//创建文件夹
        }
        if (!fs.existsSync(QQYplacepath)) {//如果文件夹不存在
            fs.mkdirSync(QQYplacepath);//创建文件夹
        }
        if (!fs.existsSync(QQYplacepath + "/" + filename)) {//如果文件不存在
            fs.writeFileSync(QQYplacepath + "/" + filename, JSON.stringify({//创建文件
            }));
        }
        var json = JSON.parse(fs.readFileSync(QQYplacepath + "/" + filename, "utf8"));//读取文件
        if (!json.hasOwnProperty(id)) {//如果json中不存在该用户
            let place_template = {
                "place": "home",
                "placetime": 0
            }
            json[id] = place_template
            fs.writeFileSync(QQYplacepath + "/" + filename, JSON.stringify(json, null, "\t"));//写入文件
        }
        return json;
    }
    else {
        fs.writeFileSync(QQYplacepath + "/" + filename, JSON.stringify(json, null, "\t"));//写入文件
        return json;
    }
}
async function getQQYUserHome(id, json, filename, is_save) {
    if (!is_save) {
        if (!fs.existsSync(QQYpath)) {//如果文件夹不存在
            fs.mkdirSync(QQYpath);//创建文件夹
        }
        if (!fs.existsSync(QQYhomepath)) {//如果文件夹不存在
            fs.mkdirSync(QQYhomepath);//创建文件夹
        }
        if (!fs.existsSync(QQYhomepath + "/" + filename)) {//如果文件不存在
            fs.writeFileSync(QQYhomepath + "/" + filename, JSON.stringify({//创建文件
            }));
        }
        var json = JSON.parse(fs.readFileSync(QQYhomepath + "/" + filename, "utf8"));//读取文件
        let id_2 = id.toString(2)
        if (!json.hasOwnProperty(id_2)) {//如果json中不存在该用户
            if (!json.hasOwnProperty(id)) {//如果json中不存在该用户
                let home_template = {
                    "s": 0,
                    "wait": 0,
                    "money": 100,
                    "love": 0
                }
                json[id_2] = home_template
            }
            else {
                json[id_2] = json[id]
            }
            fs.writeFileSync(QQYhomepath + "/" + filename, JSON.stringify(json, null, "\t"));//写入文件
        }
        // 转出10进制
        if (json[id_2].money2) {
            json[id_2].money10 = parseInt(json[id_2].money2, 2)
            if (json[id_2].money > json[id_2].money10) { json[id_2].money = json[id_2].money10 }
            else { json[id_2].money10 = json[id_2].money }
        }
        if (json[id_2].love2) {
            json[id_2].love10 = parseInt(json[id_2].love2, 2)
            if (json[id_2].love > json[id_2].love10) { json[id_2].love = json[id_2].love10 }
            else { json[id_2].love10 = json[id_2].love }
        }
        return json;
    }
    else {
        // 写入二进制
        let id_2 = id.toString(2)
        json[id_2].money2 = json[id_2].money.toString(2)
        json[id_2].love2 = json[id_2].love.toString(2)
        fs.writeFileSync(QQYhomepath + "/" + filename, JSON.stringify(json, null, "\t"));//写入文件
        return json;
    }
}
async function getQQYUserHouse(id, json, filename, is_save) {
    if (!is_save) {
        if (!fs.existsSync(QQYpath)) {//如果文件夹不存在
            fs.mkdirSync(QQYpath);//创建文件夹
        }
        if (!fs.existsSync(QQYhousepath)) {//如果文件夹不存在
            fs.mkdirSync(QQYhousepath);//创建文件夹
        }
        if (!fs.existsSync(QQYhousepath + "/" + filename)) {//如果文件不存在
            fs.writeFileSync(QQYhousepath + "/" + filename, JSON.stringify({//创建文件
            }));
        }
        var json = JSON.parse(fs.readFileSync(QQYhousepath + "/" + filename, "utf8"));//读取文件
        if (!json.hasOwnProperty(id)) {//如果json中不存在该用户
            let house_template = {
                "name": "小破屋",
                "space": 6,
                "price": 500,
                "loveup": 1
            }
            json[id] = house_template
            fs.writeFileSync(QQYhousepath + "/" + filename, JSON.stringify(json, null, "\t"));//写入文件
        }
        return json;
    }
    else {
        fs.writeFileSync(QQYhousepath + "/" + filename, JSON.stringify(json, null, "\t"));//写入文件
        return json;
    }
}
export default { getUser, getQQYUserBattle, getQQYUserPlace, getQQYUserHome, getQQYUserHouse, getUser2 }