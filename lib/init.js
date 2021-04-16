/*
 * @Author: your name
 * @Date: 2021-04-16 11:03:01
 * @LastEditTime: 2021-04-16 16:33:23
 * @LastEditors: your name
 * @Description: In User Settings Edit
 * @FilePath: /hacker-cli/lib/init.js
 */
const inquirer = require('inquirer');
const Download = require('./download');
// const ask = require('./ask');
const ask = require('./config/choices');


module.exports = class Boilerplate {
  constructor(config = {}) {
    this.config = config;
    this.projectDir = process.cwd();
    this.ask = ask;
    this.boilerplateChoice = config.boilerplateChoice || this.ask.boilerplateChoice;
    this.boilerplateDetailChoice = config.boilerplateDetailChoice || this.ask.boilerplateDetailChoice;
    this.projectAskChoice = config.projectAskChoice || this.ask.projectAskChoice;
  }

  getBoilerplateInfo(name) {
    return this.boilerplateChoice.find(item => {
      return name === item.value;
    });
  }

  setBoilerplateInfo(boilerplateChoice) {
    this.boilerplateChoice = boilerplateChoice;
  }

  getBoilerplateDetailInfo(boilerplate, project) {
    const filterItems = this.boilerplateDetailChoice[boilerplate].filter(item => project === item.value);
    return filterItems.length > 0 ? filterItems[0] : null;
  }

  setBoilerplateDetailInfo(boilerplateDetailChoice) {
    this.boilerplateDetailChoice = boilerplateDetailChoice;
  }

  setProjectAskChoice(projectAskChoice) {
    this.projectAskChoice = projectAskChoice;
  }

  getProjectAskChoices(ranges) {
    if (ranges === undefined) {
      return this.projectAskChoice;
    }
    return ranges.map(range => {
      return this.projectAskChoice.filter(choice => {
        return choice.name === range;
      })[0];
    });
  }

  init(options) {
    inquirer
      .prompt([
        {
          type: 'list',
          name: 'typeName',
          message: 'Please choose the project mode?',
          choices: this.boilerplateChoice
        }
      ])
      .then(boilerplateAnswer => {
        const boilerplateName = boilerplateAnswer.typeName;
        const boilerplateInfo = this.getBoilerplateInfo(boilerplateName);
        const choices = boilerplateInfo.choices;
        const download = new Download(options);
        if (this.boilerplateDetailChoice[boilerplateName]) {
          const boilerplateDetailAsk = [
            {
              type: 'list',
              name: 'project',
              message: 'Please choose the project template?',
              choices: this.boilerplateDetailChoice[boilerplateName]
            }
          ];
          inquirer.prompt(boilerplateDetailAsk).then(boilerplateDetailAnswer => {
            const project = boilerplateDetailAnswer.project;
            const bilerplateInfo = this.getBoilerplateDetailInfo(boilerplateName, project);
            const projectInfoChoice = this.getProjectAskChoices(bilerplateInfo.choices || choices);
            inquirer.prompt(projectInfoChoice).then(projectInfoAnswer => {
              download.init(this.projectDir, bilerplateInfo, projectInfoAnswer);
            });
          });
        } else {
          const pkgName = boilerplateInfo.pkgName || boilerplateName;
          const projectInfoChoice = this.getProjectAskChoices(choices);
          inquirer.prompt(projectInfoChoice).then(projectInfoAnswer => {
            const specialBoilerplateInfo = { pkgName, run: boilerplateInfo.run };
            download.init(this.projectDir, specialBoilerplateInfo, projectInfoAnswer);
          });
        }
      });
  }
};