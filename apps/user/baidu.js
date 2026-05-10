
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
//借鉴和学习了碎月的大佬的插件，勿喷
export class baidu extends plugin {
    constructor() {
        super({
            /** 功能名称 */
            name: '百度',
            /** 功能描述 */
            dsc: '调用青云客免费接口回答消息',
            /** https://www.baidu.com/s?wd= */
            event: 'message',
            /** 优先级，数字越小等级越高 */
            priority: 1000,
            rule: [
                {
                    /** 命令正则匹配 */
                    reg: '^#百度(一下)?(.*)',
                    /** 执行方法 */
                    fnc: 'baidu'
                },
                {
                    /** 命令正则匹配 */
                    reg: '^#?(.*)疫情$',
                    /** 执行方法 */
                    fnc: 'yiqing'
                }
            ]
        })
    }
    /**
     * 
     */

    async baidu(e) {
        console.log("百度的内容：", e.msg);
        if (!e.msg.includes('#百度百科')) {
            var message = e.msg.trim().replace('#百度一下', "").replace(/[\n|\r]/g, "，");//防止把内容里面的一下删了
            message = message.trim().replace('#百度', "").replace(/[\n|\r]/g, "，");
            var postUrl = `https://www.baidu.com/s?wd=${message}`;
        }
        else {
            var message = e.msg.trim().replace('#百度百科一下', "").replace(/[\n|\r]/g, "，");//防止把内容里面的一下删了
            message = message.trim().replace('#百度百科', "").replace(/[\n|\r]/g, "，");
            var postUrl = `https://baike.baidu.com/search/none?word=${message}`;
        }


        const puppeteer = require('puppeteer');

        const browser = await puppeteer.launch({
            headless: true,
            args: [
                '--disable-gpu',
                '--disable-dev-shm-usage',
                '--disable-setuid-sandbox',
                '--no-first-run',
                '--no-sandbox',
                '--no-zygote',
                '--single-process'
            ]
        });
        const page = await browser.newPage();
        await page.goto(postUrl);
        await page.setViewport({
            width: 1920,
            height: 1080
        });

        // let msg = await fetch(`http://tfapi.top/API/bk.php?type=bd&msg=${message}`)
        // e.reply('该功能还在测试当中')

        await this.reply(segment.image(await page.screenshot({
            fullPage: true
        })))

        await browser.close();

    }
    async yiqing(e) {
        console.log("疫情的地区：", e.msg);
        if (e.msg.includes('疫情')) {
            if (!e.msg.includes('疫情')) {
                e.reply('请输入“省份-城市疫情”')
            }
            let message = e.msg.trim().replace('疫情', "").replace(/[\n|\r]/g, "，");//防止把内容里面的一下删了
            message = message.trim().replace('#', "").replace(/[\n|\r]/g, "，");
            var postUrl = `https://voice.baidu.com/act/newpneumonia/newpneumonia/?from=osari_aladin_banner&city=${message}`;
        }

        const puppeteer = require('puppeteer');

        const browser = await puppeteer.launch({
            headless: true,
            args: [
                '--disable-gpu',
                '--disable-dev-shm-usage',
                '--disable-setuid-sandbox',
                '--no-first-run',
                '--no-sandbox',
                '--no-zygote',
                '--single-process'
            ]
        });
        const page = await browser.newPage();
        await page.goto(postUrl);
        await page.setViewport({
            //width: 1920,
            width: 960,
            height: 1080
        });

        await this.reply(segment.image(await page.screenshot({
            fullPage: true
        })))

        await browser.close();

    }
}