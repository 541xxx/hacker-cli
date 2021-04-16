/*
 * @Author: your name
 * @Date: 2021-04-16 11:02:32
 * @LastEditTime: 2021-04-16 16:35:52
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: /hacker-cli/lib/command.js
 */
"use strict";

const path = require("path");
const program = require("commander");
const chalk = require("chalk");
const inquirer = require("inquirer");
const tool = require("node-tool-utils");
const Action = require("./action");
// const Imgcook = require("./imgcook");
const utils = require("./utils");
const figlet = require("figlet");

const CLI_NAME = "hacker-cli";

class Command {
  constructor() {
    this.baseDir = process.cwd();
    this.program = program;
    this.inquirer = inquirer;
    this.chalk = chalk;
    this.tool = tool;
    this.utils = utils;
    this.boilerplate = {};
    this.commands = [
      "init",
      "resize",
      "test",
      "cov",
      "add",
      "server",
      "zip",
      "tar",
      "clean",
      "open",
      "kill",
    ];
    this.action = new Action(this);
    // this.imgcook = new Imgcook();
  }
  version() {
    const pkg = require(path.resolve(__dirname, "../package.json"));
    this.program.version(pkg.version, "-v, --version");
  }
  init() {
    this.program
      .command("init")
      .option(
        "-r, --registry [url]",
        "npm registry, default https://registry.npmjs.org, you can taobao registry: https://registry.npm.taobao.org"
      )
      .description("Init project template")
      .action((options) => {
        this.action.init(this.boilerplate, options);
      });
  }
  command() {
    this.commands.forEach((cmd) => {
      if (this[cmd]) {
        this[cmd].apply(this);
      } else {
        // console.log(
        //   chalk.green("hacker-cli: ") +
        //     chalk.red(`the command [${cmd}] is not implemented!`)
        // );
      }
    });
  }
  parse() {
    this.program.parse(process.argv);
  }
  welcome() {
    if (process.argv.length <= 2) {
      // 打印cli name或者logo
      console.log(
        chalk.blue.bold(figlet.textSync(CLI_NAME, { horizontalLayout: "full" }))
      );
    }
  }
  run() {
    this.welcome();
    this.version();
    // this.option();
    this.command();
    this.parse();
  }
}

module.exports = Command;
