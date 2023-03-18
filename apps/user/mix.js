import { BotApi, AlemonApi, plugin } from '../../model/api/api.js'
import fs from 'fs'
const path = '../../resources/qylp/mix.html'
export class qqy extends plugin {
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
    }
}