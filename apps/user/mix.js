import { BotApi, AlemonApi, plugin } from '../../model/api/api.js'
import fs from 'fs'
const path = 'plugins/akasha-terminal-plugin/resources/qylp/mix.html'
import puppeteer from '../../model/robot/puppeteer/puppeteer.js'
import { segment } from "oicq";
export class MIX extends plugin {
    constructor() {
        super({
            name: '娶群友',
            dsc: '娶群友',
            /** https://oicqjs.github.io/oicq/#events */
            event: 'message',
            priority: 66,
            rule: [{
                reg: "^#?虚空合成台$",
                fnc: 'mixbox'
            },
            ]
        })
    }
    async mixbox(e){
        var data = fs.readFileSync(path, "utf8")
        await puppeteer.screenshot("mixbox", data)
    }
}