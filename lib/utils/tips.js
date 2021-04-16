/*
 * @Author: Shawn Wu
 * @Date: 2021-04-16 14:24:46
 * @LastEditTime: 2021-04-16 16:05:10
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: /hacker-cli/lib/utils/tips.js
 */

const chalk = require("chalk");
module.exports = {
  success: (msg) => console.log(chalk.green.bold(`\n ✅   ${msg}\n`)),
  fail: (msg) => console.log(chalk.red.bold(`\n ❌   ${msg}\n`)),
  info: (msg) => console.log(chalk.yellow(`\n 🌈   ${msg}\n`)),
};
