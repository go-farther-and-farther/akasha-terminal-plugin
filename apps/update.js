import plugin from "../../../lib/plugins/plugin.js";
import { createRequire } from "module";
import lodash from "lodash";
import { Restart } from "../../other/restart.js";
import puppeteer from "../../../lib/puppeteer/puppeteer.js";

const require = createRequire(import.meta.url);
const { exec, execSync } = require("child_process");

// 是否在更新中
let uping = false;

/**
 * 处理插件更新
 */
export class update extends plugin {
  constructor() {
    super({
      name: "更新插件",
      dsc: "更新插件代码",
      event: "message",
      priority: 4000,
      rule: [
        {
          reg: "^#*虚空(插件)?(强制)?更新",
          fnc: "update",
        },
        {
          reg: "^#*虚空(插件)?版本$",
          fnc: "version",
        },
      ],
    });

  }

  /**
   * rule - 更新虚空插件
   * @returns
   */
  async update() {
    if (!this.e.isMaster) return false;

    /** 检查是否正在更新中 */
    if (uping) {
      await this.reply("已有命令更新中..请勿重复操作");
      return;
    }

    /** 检查git安装 */
    if (!(await this.checkGit())) return;

    const isForce = this.e.msg.includes("强制");

    /** 执行更新 */

    await this.runUpdate(isForce);

    /** 是否需要重启 */
    if (this.isUp) {
      setTimeout(() => this.restart(), 2000);
    }
  }


  /**
   * 云崽重启操作
   */
  restart() {
    new Restart(this.e).restart();
  }

  /**
   * 虚空插件更新函数
   * @param {boolean} isForce 是否为强制更新
   * @returns
   */
  async runUpdate(isForce) {
    let command = "git ./plugins/akasha-terminal-plugin/ pull --no-rebase";
    if (isForce) {
      command = `git ./plugins/akasha-terminal-plugin/ checkout . && ${command}`;
      this.e.reply("正在执行强制更新操作，请稍等");
    } else {
      this.e.reply("正在执行更新操作，请稍等");
    }
    return true;
  }

  /**
   * 异步执行git相关命令
   * @param {string} cmd git命令
   * @returns
   */
  async execSync(cmd) {
    return new Promise((resolve, reject) => {
      exec(cmd, { windowsHide: true }, (error, stdout, stderr) => {
        resolve({ error, stdout, stderr });
      });
    });
  }

  /**
   * 检查git是否安装
   * @returns
   */
  async checkGit() {
    let ret = await execSync("git --version", { encoding: "utf-8" });
    if (!ret || !ret.includes("git version")) {
      await this.reply("请先安装git");
      return false;
    }
    return true;
  }
}
