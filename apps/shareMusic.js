import fetch from 'node-fetch'
import { segment } from 'oicq'
import plugin from '../../../lib/plugins/plugin.js'

/*
 *搜索并分享歌曲，使用方法发送#点歌 歌曲名 歌手 或者网易云 歌曲名
 *笨比煌CV于2022/08/22，更新于2022/08/25
 *【未经授权，不得转载】
*/
let msg2 =""
let kg = false
let wy = false
let qq = false
let zt = 0
let mid = []
let lb = 4
export class shareMusic extends plugin {
  constructor () {
    super({
      name: '点歌',
      dsc: '点歌',
      event: 'message',
      priority: 5000,
      rule: [
        {
          reg: '^#*(点歌|qq|QQ|kugou|酷狗|网易云|网抑云|网易)(.*)|#听[1-9][0-9]|#听[0-9]*$$',
          fnc: 'shareMusic'
        },
		

      ]
    })
  }


 async shareMusic(e) {
  const urlList = {
  qq: 'https://ovooa.com/API/QQ_Music/?Skey=&uin=&msg=paramsSearch&n=',
  kugou:
    'http://mobilecdn.kugou.com/api/v3/search/song?format=json&keyword=paramsSearch&page=1&pagesize=20&showtype=1',
  wangyiyun: 'https://autumnfish.cn/search?keywords=paramsSearch',//备用API：http://www.clearfor.xyz:3000/cloudsearch?keywords=paramsSearch
}

  logger.info('[用户命令]', e.msg)
  let msg = e.msg.replace(/\s*/g, "");
  msg = msg.replace(/#/g,"").trim()
  let isQQReg = new RegExp("^[非VIP]*点歌*(qq|QQ)(.*)$");
  let isKugouReg = new RegExp("^[非VIP]*点歌*(kugou|酷狗)(.*)$");
  let isWangYiyunReg = new RegExp("^[非VIP]*点歌*(网易云|网抑云)(.*)$");
  
  let isQQ = isQQReg.test(msg);
  let isKugou = isKugouReg.test(msg);
  let isWangYiyun = isWangYiyunReg.test(msg);
  
  if (!isQQ && !isKugou && !isWangYiyun) isWangYiyun = true;
  if(zt == 1){
			isKugou = kg
			isQQ = qq
			isWangYiyun = wy
		}
  let isPay = msg.includes("非VIP");
  console.log("什么！这个靓仔点非VIP？？？");
  msg = msg.replace(/[非VIP|点歌|qq|QQ|kugou|酷狗|网易云|网抑云]/g, "");
  msg = msg.replace(/#/g,"").trim()
  
   if(e.msg.includes("#听")){
		
		msg = msg2
		
           }else{
	    msg2 = msg
		   }
  console.log("这个靓仔在搜", msg);
  try {
	 
    msg = encodeURI(msg);
    const params = { search: msg };
    let apiName = isQQ ? "qq" : isKugou ? "kugou" : "wangyiyun";
    let url = urlList[apiName].replace("paramsSearch", msg);
    let response = await fetch(url);
    const { data, result } = await response.json();
	console.log(data)
	
    let songList = [];
    
    if (isKugou) songList = isPay ? data.info.filter((item) => !item.pay_type_sq) : data.info;
    else songList = result?.songs?.length ? result.songs : [];
	if(zt == 0){
		kg = isKugou
		qq = isQQ
		wy = isWangYiyun
	}
	
	
	let id =""
	
		  if(e.msg.includes("#听")){
		
		id = e.msg.replace(/#听/g,"").trim()
		
		console.log("id为"+id)
           }
    if (e.isPrivate) {
		
      await e.friend.shareMusic(
        isQQ ? "qq" : isKugou ? "kugou" : "163",
        isQQ ? songList[0].songid : isKugou ? songList[0].hash : songList[0].id
      );
    } else if (e.isGroup )  {
		
		
		if(Number(id)>0){
			console.log(qq)
			if(qq){
				let url = urlList[apiName].replace("paramsSearch", msg2) 
				url = url + String(id)
				console.log(url)
                let response2 = await fetch(url);
                  const data2= await response2.json();
	                console.log(data2)
				console.log(data2.data.music)
				
			url = "https://y.qq.com/n/ryqq/songDetail/" + data2.data.Mid; //接口地址
			
			console.log(url)
			
			let response3 = await fetch(url); //调用接口获取数据
			let  res = await response3.text(); //结果json字符串转对象
			       
			let n1 = res.indexOf('","id":') + 7
			
			let n2 = res.indexOf(',',n1)
			console.log(n1,n2)
			
			e.group.shareMusic("qq",Number(res.slice(n1,n2)))
			e.reply(segment.record(data2.data.music))
			 console.log("结果是：" + res.slice(n1,n2))
			 qq = 0
			 zt = 0
			}
			
			 e.group.shareMusic(
        isQQ ? "qq" : isKugou ? "kugou" : "163",
        isQQ ? songList[ id-1 ].id : isKugou ? songList[ id-1 ].hash : songList[ id-1 ].id
		
	
      );
	  zt = 0
		}
      
	  let msg = ""
	  let zz = ""
	  
	  
	  if(isQQ &id == ""){
		  for(let i=0;i<data.length;i++){

				  msg = msg + "\n"+  String(i+1)+ ".  "+data[i]. song + "   作者："+ data[i]. singers
				  
	  }
		ForwardMsg(e,[msg + "\n请发送你要听的序列号的歌曲，例如 #听1"])
			       
			
			 console.log("结果是：" + data[0]. song + data[0]. singers)
		 zt = 1
		 
	}
	  
	  
	  
	  
	  if(isKugou &id == ""){
		  for(let i=0;i<data. info.length;i++){

				  msg = msg + "\n"+  String(i+1)+ ".  "+data. info[i].songname + "   作者："+ data. info[i].singername
				  
	  }
	
	   ForwardMsg(e,[msg + "\n请发送你要听的序列号的歌曲，例如 #听1"])
	   zt = 1
	  }
	  
      if (isWangYiyun &id == "") {
		  
		 
			   for(let i=0;i<songList.length;i++){

				  msg = msg + "\n"+  String(i+1)+ ". "+songList[i].name + " 作者："+ songList[i].artists[0].name + ","
	  
		  }
		  
		  
		  ForwardMsg(e,[msg + "\n请发送你要听的序列号的歌曲，例如 #听1"])
		  zt = 1
		  
		  
 
      }
		  
	  
	  if(Number(id)>0){
		  
		  let response = await fetch(`http://music.163.com/song/media/outer/url?id=${ songList[ Number(id)-1 ].id }`);
        const data = await response;
        if (!data?.url) return true
        const music = await segment.record(data?.url)
        await e.reply(music)
	  }
	  id = 0
	  
    }
  } catch (error) {
    console.log(error);
  }
  return true;
}


}
async function ForwardMsg(e, data) {
    console.log(data[1]);
    let msgList = [];
    for (let i of data) {
        msgList.push({
            message: segment.text(i),
            nickname: Bot.nickname,
            user_id: Bot.uin,
        });
    }
    if (msgList.length == 10) {
        await e.reply(msgList[0].message);
    }
    else {
        //console.log(msgList);
        await e.reply(await Bot.makeForwardMsg(msgList));
    }
    return;
}