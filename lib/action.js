/*
 * @Author: your name
 * @Date: 2021-04-16 11:22:57
 * @LastEditTime: 2021-04-16 16:34:04
 * @LastEditors: your name
 * @Description: In User Settings Edit
 * @FilePath: /hacker-cli/lib/action.js
 */
"use strict";
const path = require("path");
const fs = require("fs");
const chalk = require("chalk");
const tool = require("node-tool-utils");
const Boilerplate = require("./init");
const utils = require("./utils");

class Action {
  constructor(command) {
    this.command = command;
    const { program, baseDir } = command;
  }
  init(boilerplate, options) {
    return new Boilerplate(boilerplate).init(options); 
  }
}

module.exports = Action;
