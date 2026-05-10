
import command from '../../components/command.js'
import puppeteer from '../../../../lib/puppeteer/puppeteer.js'

const gaodekey = 'c28ee5d8553ef1800bdce344a3b39c68'
export class chaxun extends plugin {
    constructor() {
        super({
            /** 功能名称 */
            name: '查询功能',
            /** 功能描述 */
            dsc: '查询功能',
            event: 'message',
            /** 优先级，数字越小等级越高 */
            priority: 1003,
            rule: [
                {
                    /** 命令正则匹配 */
                    reg: '^#*(疯狂)*星期四$',
                    /** 执行方法 */
                    fnc: 'Crazy4'
                },
                {
                    /** 命令正则匹配 */
                    reg: '^#*看书(.*)|#看[1-9][0-9]|#看[0-9]$',
                    /** 执行方法 */
                    fnc: 'biluo'
                },
                {
                    /** 命令正则匹配 */
                    reg: '^#*看书单$',
                    /** 执行方法 */
                    fnc: 'biluolist'
                },
                {
				    /** 命令正则匹配 */
				    reg: '^#*文字路线规划查询(.*)$',
				    /** 执行方法 */
				    fnc: 'getlineguihua'
				},
				{
				    /** 命令正则匹配 */
				    reg: '^#*路线规划查询(.*)$',
				    /** 执行方法 */
				    fnc: 'imagecha'
				},
				{
				    /** 命令正则匹配 */
				    reg: '^#*地点查询(.*)$',
				    /** 执行方法 */
				    fnc: 'dicha'
				}
            ]
        })
    }

    /**
     * 
     */
    async Crazy4(e) {

        let url = "https://www.sxsme.com.cn/gonglue/14216.html";
        let response = await fetch(url); //调用接口获取数据
        let res = await response.text();

        let regFC4 = /<hr \/>([\s\S]*?)<hr \/>/g;


        let textFC4 = res.match(regFC4);

        let delFC4 = [];

        for (const key in textFC4) {

            if (textFC4[key].match(/<table([\s\S]*?)<\/table>/g)) {

                textFC4[key] = textFC4[key].replace(/<table([\s\S]*?)<\/table>/g, "<hr /><hr />");

                delFC4.push(key);

                let temp = textFC4[key].match(regFC4);
                for (const tempkey in temp) {
                    textFC4.push(temp[tempkey]);
                }
            }
        }

        for (const key in delFC4) {
            textFC4.splice(delFC4[key], 1);
        }

        for (const key in textFC4) {
            textFC4[key] = textFC4[key].replace(/<hr \/>|<p>|<\/p>|&nbsp;|\r|\n|<br \/>/g, "");
            textFC4[key] = textFC4[key].replace(/\t/g, "\n");
            if (textFC4[key].indexOf("\r")) {
                textFC4[key] = textFC4[key].slice(1);
            }
        }


        let imgregFC4 = /https:\/\/img.sxsme.com.cn\/uploadimg\/image\/[0-9]{7,8}\/[0-9A-Za-z_]{10,30}.jpg/g;

        let imgFC4 = res.match(imgregFC4);

        for (const key in imgFC4) {
            textFC4.push(imgFC4[key]);
        }

        let FC4 = textFC4[Math.round(Math.random() * (textFC4.length - 1))];

        await  this.e.reply(FC4.includes("http") ? segment.image(FC4) : FC4);
    }
    async biluo(e){
        let emsg = e.msg.replace(/#|＃|看书/g, "");
        if(!emsg){
            let usurl = 'https://api-static.mihoyo.com/common/blackboard/ys_obc/v1/home/content/list?app_sn=ys_obc&channel_id=189'
            let usresponse = await fetch(usurl); //调用接口获取数据
            let usres = await usresponse.json(); //结果json字符串转对象
            let uslist = usres.data.list[0].children[9].list
            let usimgdata = await command.getData("booklist",
            {
                uslist
            });
            let usimg = await puppeteer.screenshot('booklist', usimgdata);
            if (usimg) await this.reply(usimg);
            return
        }
        
        let isurl = 'https://api-static.mihoyo.com/common/blackboard/ys_obc/v1/home/content/list?app_sn=ys_obc&channel_id=189'
        let isresponse = await fetch(isurl); //调用接口获取数据
        let isres = await isresponse.json(); //结果json字符串转对象
        let newarray = isres.data.list[0].children[9].list
        let shuid = 0
        let arraynum = newarray.findIndex(e => e.title === emsg)
        if(arraynum > 0){
            shuid = newarray[arraynum].content_id
        }else{
            return this.reply('查无此书')
        }
        
            let jsonurl = `https://api-static.mihoyo.com/common/blackboard/ys_obc/v1/content/info?app_sn=ys_obc&content_id=${shuid}`; //详情接口地址
            let response = await fetch(jsonurl); //调用接口获取数据
            let res = await response.json(); //结果json字符串转对象
            let image = res.data.content.icon;
            let name = res.data.content.title;
            let fangshi = res.data.content.ext
            let desc1 = res.data.content.contents[0].text.split("<td colspan=\"2\" class=\"obc-tmpl__rich-text\">")[1]
            let richtext1 = res.data.content.contents[0].text.split("<div class=\"obc-tmpl__rich-text obc-tmpl-fold__title\">")[1].split('</div> <div class="obc-tmpl__fold-tag">')[0]
            if(res.data.content.contents[0].text.split("<div class=\"obc-tmpl__rich-text obc-tmpl-fold__title\">")[3]){
                richtext1 = `${richtext1}${res.data.content.contents[0].text.split("<div class=\"obc-tmpl__rich-text obc-tmpl-fold__title\">")[3].split('</div> <div class="obc-tmpl__fold-tag">')[0]}`
            }
            if(res.data.content.contents[0].text.split("<div class=\"obc-tmpl__rich-text obc-tmpl-fold__title\">")[5]){
                richtext1 = `${richtext1}${res.data.content.contents[0].text.split("<div class=\"obc-tmpl__rich-text obc-tmpl-fold__title\">")[5].split('</div> <div class="obc-tmpl__fold-tag">')[0]}`
            }
            if(res.data.content.contents[0].text.split("<div class=\"obc-tmpl__rich-text obc-tmpl-fold__title\">")[7]){
                richtext1 = `${richtext1}${res.data.content.contents[0].text.split("<div class=\"obc-tmpl__rich-text obc-tmpl-fold__title\">")[7].split('</div> <div class="obc-tmpl__fold-tag">')[0]}`
            }
            if(res.data.content.contents[0].text.split("<div class=\"obc-tmpl__rich-text obc-tmpl-fold__title\">")[9]){
                richtext1 = `${richtext1}${res.data.content.contents[0].text.split("<div class=\"obc-tmpl__rich-text obc-tmpl-fold__title\">")[9].split('</div> <div class="obc-tmpl__fold-tag">')[0]}`
            }
            if(res.data.content.contents[0].text.split("<div class=\"obc-tmpl__rich-text obc-tmpl-fold__title\">")[11]){
                richtext1 = `${richtext1}${res.data.content.contents[0].text.split("<div class=\"obc-tmpl__rich-text obc-tmpl-fold__title\">")[11].split('</div> <div class="obc-tmpl__fold-tag">')[0]}`
            }
            if(res.data.content.contents[0].text.split("<div class=\"obc-tmpl__rich-text obc-tmpl-fold__title\">")[13]){
                richtext1 = `${richtext1}${res.data.content.contents[0].text.split("<div class=\"obc-tmpl__rich-text obc-tmpl-fold__title\">")[13].split('</div> <div class="obc-tmpl__fold-tag">')[0]}`
            }
            
            let richtext = this.getText(richtext1)
            let desc = this.getText(desc1)
    
            let imgdata = await command.getData("biluo",
            {
                image, // 图片
                name, // 书籍名字
                fangshi, // 获取方式
                desc, // 简介
                richtext // 富文本
            });
        console.log('json数据',richtext)
        /** 生成图片 */
        let img = await puppeteer.screenshot('biluo', imgdata);
        if (img) await this.reply(img);
        
        if (e.msg.includes("#看")) {
			var id = e.msg.replace(/#看/g, "").trim()
		}
        
        }
        
         getText(str) {
              if (!str) {
                return ''
              }
              return str.replace(/<[^<>]+>/g, '').replace(/&nbsp;/gi, '')
            }
            
        async getlineguihua(e){
			let emsg = e.msg.replace(/#|＃|文字路线规划查询/g, "");
			let qzpoint = emsg.split("到")
			let qidian = qzpoint[0]
			let zhongdian = qzpoint[1]
			let qires = await this.getone(qidian)
			let zhongres = await this.gettwo(zhongdian)
			let lineres = await this.getthree(qires,zhongres)
			console.log('dian点',lineres)
			let infolist = lineres.route.paths[0].steps
			let imgdata = await command.getData("biluodaohang",
			    {
			        infolist
			    });
			/** 生成图片 */
			let img = await puppeteer.screenshot('biluodaohang', imgdata);
			if (img) await this.reply(img);
		}
		
		async getone(e){
		    let getqiurl = `http://restapi.amap.com/v3/geocode/geo?key=${gaodekey}&address=${e}`
			let qiresponse = await fetch(getqiurl); //调用接口获取数据
			let qires = await qiresponse.json(); //结果json字符串转对象
			return qires
		}
		async gettwo(e){
		    let getzhongurl = `http://restapi.amap.com/v3/geocode/geo?key=${gaodekey}&address=${e}`
			let zhongresponse = await fetch(getzhongurl); //调用接口获取数据
			let zhongres = await zhongresponse.json(); //结果json字符串转对象
			return zhongres
		}
		async getthree(e,f){
		    let lineurl = `http://restapi.amap.com/v3/direction/driving?key=${gaodekey}&origin=${e.geocodes[0].location}&destination=${f.geocodes[0].location}&extensions=base&strategy=0`
			let lineresponse = await fetch(lineurl); //调用接口获取数据
			let lineres = await lineresponse.json(); //结果json字符串转对象
			return lineres
		}
		async imagecha(e){
		    let emsg = e.msg.replace(/#|＃|路线规划查询/g, "");
			let qzpoint = emsg.split("到")
			let qidian = qzpoint[0]
			let zhongdian = qzpoint[1]
			let qires = await this.getone(qidian)
			let zhongres = await this.gettwo(zhongdian)
			let pingj = await this.accAdd(qires.geocodes[0].location.split(',')[0],zhongres.geocodes[0].location.split(',')[0])
			let pingw = await this.accAdd(qires.geocodes[0].location.split(',')[1],zhongres.geocodes[0].location.split(',')[1])
			let pingarray = []
			pingarray.push(pingj)
			pingarray.push(pingw)
			let jvli = await this.space(qires.geocodes[0].location.split(',')[1],qires.geocodes[0].location.split(',')[0],zhongres.geocodes[0].location.split(',')[1],zhongres.geocodes[0].location.split(',')[0])
			let suofang = await this.shuchu(jvli)
			let imgdata = await command.getData("imgdaohang",
			    {
			        zhongdian,
			        qidian,
			        suofang,
			        pingarray,
			        pingj,
			        pingw
			    });
			/** 生成图片 */
			let img = await puppeteer.screenshot('imgdaohang', imgdata);
			if (img) await this.reply(img);
            await this.reply(`${qidian}到${zhongdian}直线距离${jvli}KM`);
		}
		async accAdd(a1,a2){
		    console.log('a1',a1)
		    console.log('a2',a2)
		    console.log('he',(a1*10000000 + a2*10000000)/20000000)
		    return (a1*10000000 + a2*10000000)/20000000
		}
        async space(lat1, lng1, lat2, lng2) {
            console.log(lat1, lng1, lat2, lng2)
            var radLat1 = lat1 * Math.PI / 180.0;
            var radLat2 = lat2 * Math.PI / 180.0;
            var a = radLat1 - radLat2;
            var b = lng1 * Math.PI / 180.0 - lng2 * Math.PI / 180.0;
            var s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a / 2), 2) +
              	 Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2)));
            s = s * 6378.137;
            s = Math.round(s * 10000) / 10000;
            return s  // km
	    }
	    async shuchu(jvli){
	        let suofang = 0
	        if( jvli > 1 && jvli <= 10)
	        {
			   return suofang = 14
			}
			else if(jvli > 10 && jvli <= 50)
			{
			   return suofang = 12
			}
			else if(jvli > 50 && jvli <= 100)
			{
			   return suofang = 10
			}
			else if(jvli > 100 && jvli <= 200)
			{
			   return suofang = 9
			}
			else if(jvli > 200 && jvli <= 500)
			{
			   return suofang = 9
			}
			else if(jvli > 500 && jvli <= 1000)
			{
			   return suofang = 7
			}
			else if(jvli > 1000)
			{
			  return  suofang = 5
			}
			else(jvli < 1)
			{
			   return suofang = 18
			}
	    }
	    async dicha(e){
	        let emsg = e.msg.replace(/#|＃|地点查询/g, "");
	        let dires = await this.getone(emsg);
	        let pingj = dires.geocodes[0].location.split(',')[0]
	        let pingw = dires.geocodes[0].location.split(',')[1]
	        let imgdata = await command.getData("map",
			    {
			        pingj,
			        pingw
			    });
			/** 生成图片 */
			let img = await puppeteer.screenshot('map', imgdata);
			if (img) await this.reply(img);
	        
	    }
}


