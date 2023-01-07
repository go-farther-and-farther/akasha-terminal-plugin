import fs from "fs";
const LPpath = "plugins/akasha-terminal-plugin/data/qylp"
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
async function getLPUser(id, json, Template, filename, is_save) {
    /*if (filename.indexOf(".json") == -1) {//如果文件名不包含.json
        filename = filename + ".json";//添加.json
    }*/
    if (!is_save) {
        if (!fs.existsSync(LPpath)) {//如果文件夹不存在
            fs.mkdirSync(LPpath);//创建文件夹
        }
        if (!fs.existsSync(LPpath + "/" + filename)) {//如果文件不存在
            fs.writeFileSync(LPpath + "/" + filename, JSON.stringify({//创建文件
            }));
        }
        var json = JSON.parse(fs.readFileSync(LPpath + "/" + filename, "utf8"));//读取文件
        if (!json.hasOwnProperty(id)) {//如果json中不存在该用户
            json[id] = Template
            fs.writeFileSync(LPpath + "/" + filename, JSON.stringify(json, null, "\t"));//写入文件
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
export default { getUser, getLPUser, getUser2 }