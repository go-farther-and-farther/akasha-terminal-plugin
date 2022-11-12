import fs from 'fs'
import lodash from 'lodash'
import cfg from '../../../lib/config/config.js'
const Plugin_Path = `${process.cwd()}/plugins/akasha-terminal-plugin`;
const README_path = `${Plugin_Path}/README.md`
const CHANGELOG_path = `${Plugin_Path}/CHANGELOG.md`
const yunzai_ver = `v${cfg.package.version}`;

let logs = {}
let changelogs = []
let currentVersion
let versionCount = 6

const getakashae = function (akashae) {
  akashae = akashae.replace(/(^\s*\*|\r)/g, '')
  akashae = akashae.replace(/\s*`([^`]+`)/g, '<span class="cmd">$1')
  akashae = akashae.replace(/`\s*/g, '</span>')
  akashae = akashae.replace(/\s*\*\*([^\*]+\*\*)/g, '<span class="strong">$1')
  akashae = akashae.replace(/\*\*\s*/g, '</span>')
  akashae = akashae.replace(/ⁿᵉʷ/g, '<span class="new"></span>')
  return akashae
}

try {
  if (fs.existsSync(CHANGELOG_path)) {
    logs = fs.readFileSync(CHANGELOG_path, 'utf8') || ''
	logs = logs.replace(/\t/g,'   ').split('\n')
    let temp = {};
    let lastakashae = {}
    lodash.forEach(logs, (akashae) => {
      if (versionCount <= -1) {
        return false
      }
      let versionRet = /^#\s*([0-9a-zA-Z\\.~\s]+?)\s*$/.exec(akashae.trim())
      if (versionRet && versionRet[1]) {
        let v = versionRet[1].trim()
        if (!currentVersion) {
          currentVersion = v
        } else {
          changelogs.push(temp)
          if (/0\s*$/.test(v) && versionCount > 0) {
            //versionCount = 0
			versionCount--
          } else {
            versionCount--
          }
        }
        temp = {
          version: v,
          logs: []
        }
      } else {
        if (!akashae.trim()) {
          return
        }
		if (/^\*/.test(akashae)) {
			lastakashae = {
				title: getakashae(akashae),
				logs: []
		}
		if(!temp.logs){
			temp = {
				version: akashae,
				logs: []
			}
		}
		temp.logs.push(lastakashae)
        } else if (/^\s{2,}\*/.test(akashae)) {
          lastakashae.logs.push(getakashae(akashae))
        }
      }
    })
  }
} catch (e) {
	logger.error(e);
  // do nth
}

try{
	if(fs.existsSync(README_path)){
		let README = fs.readFileSync(README_path, 'utf8') || ''
		let reg = /版本：(.*)/.exec(README)
		if(reg){
			currentVersion = reg[1]
		}
	}
}catch(err){}

let Version = {
  get ver () {
    return currentVersion;
  },
  get yunzai(){
	  return yunzai_ver;
  },
  get logs(){
	  return changelogs;
  }
}
export default Version