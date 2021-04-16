/*
 * @Author: Shawn Wu
 * @Date: 2021-04-16 14:30:56
 * @LastEditTime: 2021-04-16 15:01:10
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: /hacker-cli/lib/utils/git.js
 */

import tips from "@/utils/tips";
const fs = require("fs");
const program = require("commander");
const download = require("download-git-repo");
const ora = require("ora");
const handlebars = require("handlebars");

export function downloadTemplate(dirName, url, mate) {
  const spinner = ora("downloading template...");
  spinner.start();
  download(url, dirName, { clone: true }, err => {
    if (err) {
      spinner.fail();
      tips.fail(
        `${err}download template fail,please check your network connection and try again`,
      );
      process.exit(1);
    }
    spinner.succeed();
    const meta = {
      name: dirName,
      description: mate.description,
      author: mate.author,
    };
    const fileName = `${dirName}/package.json`;
    const content = fs.readFileSync(fileName).toString();
    const result = handlebars.compile(content)(meta);
    fs.writeFileSync(fileName, result);
    tips.success(`${dirName} project created!`);
    tips.info(`cd ${dirName} && yarn install`);
  });
}