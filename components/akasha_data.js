import fs from "fs";
const dirpath = "plugins/akasha-terminal-plugin/data"
const QQYhomepath = "plugins/akasha-terminal-plugin/data/qylp/UserHome"
const QQYplacepath = "plugins/akasha-terminal-plugin/data/qylp/UserPlace"
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
async function getQQYUserPlace(id, json, filename, is_save) {
    if (!is_save) {
        if (!fs.existsSync(QQYplacepath)) {//如果文件夹不存在
            fs.mkdirSync(QQYplacepath);//创建文件夹
        }
        if (!fs.existsSync(QQYplacepath + "/" + filename)) {//如果文件不存在
            fs.writeFileSync(QQYplacepath + "/" + filename, JSON.stringify({//创建文件
            }));
        }
        var json = JSON.parse(fs.readFileSync(QQYplacepath + "/" + filename, "utf8"));//读取文件
        if (!json.hasOwnProperty(id)) {//如果json中不存在该用户
            let  place_template = {
                "place": "home",
                "placetime": 0
            }        
            json[id] = place_template
            fs.writeFileSync(QQYplacepath + "/" + filename, JSON.stringify(json, null, "\t"));//写入文件
        }
        return json;
    }
    else {
        fs.writeFileSync(LPpath + "/" + filename, JSON.stringify(json, null, "\t"));//写入文件
        return json;
    }
}
async function getQQYUserHome(id, json, filename, is_save) {
    if (!is_save) {
        if (!fs.existsSync(QQYhomepath)) {//如果文件夹不存在
            fs.mkdirSync(QQYhomepath);//创建文件夹
        }
        if (!fs.existsSync(QQYhomepath + "/" + filename)) {//如果文件不存在
            fs.writeFileSync(QQYhomepath + "/" + filename, JSON.stringify({//创建文件
            }));
        }
        var json = JSON.parse(fs.readFileSync(QQYhomepath + "/" + filename, "utf8"));//读取文件
        if (!json.hasOwnProperty(id)) {//如果json中不存在该用户
            let home_template = {
                "s": 0,
                "wait": 0,
                "money": 100,
                "love": 0
            }
            json[id] = home_template
            fs.writeFileSync(QQYhomepath + "/" + filename, JSON.stringify(json, null, "\t"));//写入文件
        }
        return json;
    }
    else {
        fs.writeFileSync(LPpath + "/" + filename, JSON.stringify(json, null, "\t"));//写入文件
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
export default { getUser, getQQYUserPlace, getQQYUserHome, getUser2 }