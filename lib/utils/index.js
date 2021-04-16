/*
 * @Author: Shawn Wu
 * @Date: 2021-04-16 16:00:48
 * @LastEditTime: 2021-04-16 16:03:53
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: /hacker-cli/lib/utils/index.js
 */

'use strict';
const chalk = require('chalk');
const path = require('path');
const fs = require('fs');
const os = require('os');
const urllib = require('urllib');
const tool = require('node-tool-utils');
// const WebpackTool = require('webpack-tool');
// const merge = WebpackTool.merge;
// const SpeedMeasurePlugin = require('speed-measure-webpack-plugin');
module.exports = {

  isUdefined(value) {
    return value === undefined;
  },
  isFunction(value) {
    return typeof value === 'function';
  },
  isObject(value) {
    return Object.prototype.toString.call(value) === '[object Object]';
  },
  isString(value) {
    return typeof value === 'string';
  },
  isBoolean(value) {
    return typeof value === 'boolean';
  },

  getPackageInfo(baseDir) {
    const pkgfile = path.join(baseDir || process.cwd(), 'package.json');
    if (fs.existsSync(pkgfile)) {
      return require(pkgfile);
    }
    return {};
  },

  getWebpackInfo(baseDir) {
    const configFile = path.join(baseDir || process.cwd(), 'webpack.config.js');
    if (fs.existsSync(configFile)) {
      return require(configFile);
    }
    return {};
  },

  getCompileTempDir(baseDir, dir = '') {
    const root = path.join(os.tmpdir(), 'hacker');
    const pkg = this.getPackageInfo(baseDir);
    if (pkg.name) {
      return path.join(root, pkg.name, dir);
    }
    return root;
  },

  getInstallPackage(name, baseDir) {
    const pkg = this.getDefaultInstallPackage(name, baseDir);
    if (pkg) {
      return pkg;
    }
    return this.getEasyInstallPackage(name, baseDir);
  },

  getDefaultInstallPackage(name, baseDir) {
    const pkg = baseDir ? path.join(baseDir, 'node_modules', name) : name;
    try {
      return require(pkg);
    } catch (e) {
      return null;
    }
  },

  getEasyInstallPackage(name, baseDir) {
    const pkgName = `@easy-team/${name}`;
    const pkg = baseDir ? path.join(baseDir, 'node_modules', pkgName) : pkgName;
    try {
      return require(pkg);
    } catch (e) {
      console.warn(e);
      return null;
    }
  },

  getDeployOption(baseDir, program) {
    const pkg = this.getPackageInfo(baseDir);
    const config = this.getWebpackInfo(baseDir);
    return merge({}, pkg.deploy, config.deploy);
  },

  initArchiveOption(baseDir, program, cliOption) {
    const configOption = this.getDeployOption(baseDir, program);
    const option = merge(cliOption, configOption);
    const config = merge(option, {
      target: option.target || this.getCompileTempDir(baseDir)
    });
    if(this.isString(option.filename)) {
      config.filename = option.filename;
    } else if(option.parent && this.isString(option.parent.filename)) {
      config.filename = option.parent.filename;
    }
    if(option.source) {
      config.source = option.source;
    }
    if(option.deps || option.mode || option.registry) {
      config.installDeps = {};
      if(option.mode) {
        config.installDeps.mode = option.mode;
      }
      if(option.registry) {
        config.installDeps.registry = option.registry;
      }
    }
    if(option.alinode) {
      let installAlinode = { installAlinode: true };
      if (this.isString(option.alinode) && /\.\d/.test(option.alinode)) {
        installAlinode.version = option.alinode;
      } else if (this.isObject(option.alinode)){
        installAlinode = merge(installAlinode, option.alinode);
      }
      config.installNode = installAlinode;
    } else if(option.nodejs) {
      let installNode = { installNode: true };
      if (this.isString(option.nodejs) && /\.\d/.test(option.nodejs)) {
        installNode.version = option.nodejs;
      } else if (this.isObject(option.nodejs)){
        installNode = merge(installNode, option.nodejs);
      }
      config.installNode = installNode;
    }
    return config;
  },

  initOption(program, option = {}, config = {}) {
    const target = program.web ? 'web' : (program.node ? 'node' : undefined);
    return merge({
      speed: option.speed,
      onlyDll: program.dll,
      onlyWeb: program.web,
      onlyNode: program.node,
      onlyView: true,
      target
    }, option, { proxy: config.proxy });
  },

  initWebpackConfig(program, option = {}, cliConfig = {}) {
    const { baseDir = process.cwd(), env, configured = true } = option;
    const { filename, port, framework, type, devtool, size, watch, build, hash, compress, dll, web, node, webpack } = program;
    const target = web ? 'web' : (node ? 'node' : undefined);
    const cli = merge({ env, filename, port, size, dll, web, node, webpack, devtool }, cliConfig);
    const config = merge({ configured, env, port, framework, target, type, devtool, cli }, option);
    const cfg = {
      baseDir,
      config, // custom webpack config for flat
      cli, // flat cli config
      webpack: {} // native webpack config for webpack
    };
    cfg.config.baseDir = baseDir;
    cfg.config.plugins = cfg.config.plugins || {};
    
    if (cfg.config.port) {
      cfg.config.debugPort = cfg.config.debugPort || cfg.config.port - 1;
    }

    if (watch || (build && build.indexOf('w') > -1)) {
      cfg.config.hot = true;
    }

    if (hash || (build && (build.indexOf('h') > -1 || build.indexOf('m') > -1))) {
      cfg.config.hash = true;
    }

    if (this.isString(cfg.config.devtool)) {
      cfg.config.cliDevtool = true; // high
    }

    if (size) {
      if (size === 'stats' && !cfg.config.plugins.stats) {
        cfg.config.plugins.stats = true;
      } else if (!config.plugins.analyzer) {
        cfg.config.plugins.analyzer = true;
      }
    }

    if (compress || (build && build.indexOf('c') > -1)) {
      if (this.isUdefined(config.miniJs)) {
        cfg.config.miniJs = true;
      }
      if (this.isUdefined(config.miniCss)) {
        cfg.config.miniCss = true;
      }
      if (this.isUdefined(config.miniImage)) {
        cfg.config.miniImage = true;
      }
    }

    return cfg;
  },

  clearTempDir(baseDir) {
    const cacheDir = this.getCompileTempDir(baseDir);
    tool.rm(cacheDir);
  },

  clearManifest(baseDir) {
    const manifestDir = path.join(baseDir, 'config');
    const manifestFile = path.join(manifestDir, 'manifest.json')
    tool.rm(manifestFile);
  },

  clearBuildDir(baseDir) {
    const buildDir = path.join(baseDir, 'public');
    tool.rm(buildDir);
  },

  /* istanbul ignore next */
  log(info, color = 'green') {
    /* istanbul ignore next */
    console.log(chalk.blue(`[hacker-cli]: ${chalk[color](info)}`));
  },
  createSpeedWebpackConfig(webpackConfig) {
    const smp = new SpeedMeasurePlugin({});
    return smp.wrap(webpackConfig);
  },
  request(url, options) {
    return urllib.request(url, options);
  },
  uppercaseCamel(text) {
    return text.split('-').map(word => word.charAt(0).toUpperCase() + word.substr(1)).join('')
  }
};