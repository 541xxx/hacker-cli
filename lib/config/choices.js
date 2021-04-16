/*
 * @Author: Shawn Wu
 * @Date: 2021-04-16 15:41:05
 * @LastEditTime: 2021-04-16 16:30:05
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: /hacker-cli/lib/config/choices.js
 */

'use strict';
const chalk = require('chalk');




exports.boilerplateChoice = [
  {
    name: `Create ${chalk.green('SPA')}`,
    value: 'spa'
  },
];

exports.boilerplateDetailChoice = {
  'spa': [
    {
      name: `Create ${chalk.green('React TypeScript SPA for Mobile')} Application`,
      value: 'react-typescript-mobile',
      // Branch name
      pkgName: 'main'
    },
  ]
};

exports.projectAskChoice = [
  {
    type: 'input',
    name: 'name',
    message: 'Please input project name:'
  },
  {
    type: 'input',
    name: 'description',
    message: 'Please input project description:'
  },
  // {
  //   type: 'list',
  //   name: 'style',
  //   message: 'Please choose the css:',
  //   choices: [
  //     {
  //       name: 'sass',
  //       value: 'scss'
  //     },
  //     {
  //       name: 'less',
  //       value: 'less'
  //     },
  //     {
  //       name: 'css',
  //       value: null,
  //       checked: true
  //     }
  //   ]
  // },
  {
    type: 'list',
    name: 'npm',
    message: 'Please choose how to install dependency:',
    choices: [
      {
        name: 'yarn',
        value: 'yarn'
      },
      {
        name: 'npm',
        value: 'npm'
      },
      {
        name: 'none',
        value: null,
        checked: true
      }
    ]
  }
];
