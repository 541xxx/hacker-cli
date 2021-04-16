"use strict";
const path = require("path");
const fs = require("fs");
const fsPromises = fs.promises;
const os = require("os");
const urllib = require("urllib");
const assert = require("assert");
const shell = require("shelljs");
const chalk = require("chalk");
const ora = require("ora");
const compressing = require("compressing");
const rimraf = require("mz-modules/rimraf");
const mkdirp = require("mz-modules/mkdirp");
const co = require("co");
const utils = require("./utils");
const Mustache = require("mustache");
const { info, success } = require("./utils/tips");
const { request, getCompileTempDir } = require('./utils/index');
// import { downloadTemplate } from "./utils/git";

// const DEPS_MAPPING = {
//   scss: {
//     "node-sass": "^4.5.3",
//     "sass-loader": "^6.0.6",
//   },
//   less: {
//     less: "^2.7.2",
//     "less-loader": "^4.0.0",
//   },
//   stylus: {
//     stylus: "^0.54.5",
//     "stylus-loader": "^3.0.0",
//   },
// };

module.exports = class Download {
  constructor(config = {}) {
    this.tempDir = path.join(os.tmpdir(), "hacker-cli-init");
  }

  *download(pkgName, dir) {
    yield rimraf(this.tempDir);
    const zipUrl = `https://github.com/541xxx/templates/archive/refs/heads/${pkgName}.zip`;
    const spinner = ora(utils.log(`start Downloading ...`));
    spinner.start();
    const response = yield urllib.request(zipUrl, {
      streaming: true,
      followRedirect: true,
      headers: {
        accept: "application/zip",
      },
    });
    spinner.succeed();
    const targetDir = path.join(this.tempDir, pkgName);
    yield compressing.zip.uncompress(response.res, targetDir);

    info(`extract to ${this.tempDir}`);
    const packagePath = `templates-${pkgName}`;
    return path.join(targetDir, packagePath, dir);
  }

  copy(sourceDir, targetDir, option = { dir: "", hide: true }) {
    if (option.dir) {
      shell.cp("-R", path.join(sourceDir, option.dir), targetDir);
    } else {
      shell.cp("-R", path.join(sourceDir, "*"), targetDir);
      if (option.hide) {
        // copy hide file
        try {
          shell.cp("-R", path.join(sourceDir, ".*"), targetDir);
        } catch (e) {
          /* istanbul ignore next */
          console.warn("copy hide file error", e);
        }
      }
    }
  }

  writeFile(filepath, content) {
    try {
      fs.writeFileSync(
        filepath,
        typeof content === "string"
          ? content
          : JSON.stringify(content, null, 2),
        "utf8"
      );
    } catch (e) {
      /* istanbul ignore next */
      console.error(`writeFile ${filepath} err`, e);
    }
  }

  updatePackageFile(fileDir, info = {}) {
    const { name, description, style } = info;
    const filepath = path.join(fileDir, "package.json");
    const packageJSON = require(filepath);
    const { devDependencies = {}, webpack = {} } = packageJSON;
    webpack.loaders = webpack.loaders || {};

    packageJSON.name =
      (packageJSON.name.indexOf("@hacker-cli/") === 0 ? `@hacker-cli/${name}` : name) ||
      packageJSON.name;
    packageJSON.version = "1.0.0";
    packageJSON.description = description || packageJSON.description;
    // if (style) {
    //   webpack.loaders[style] = true;
    //   Object.keys(DEPS_MAPPING[style]).forEach((depsName) => {
    //     devDependencies[depsName] = DEPS_MAPPING[style][depsName];
    //   });
    // }
    packageJSON.devDependencies = devDependencies;
    packageJSON.webpack = webpack;

    this.writeFile(filepath, packageJSON);
  }

  installDeps(projectDir, info) {
    const { npm } = info;
    if (npm) {
      const cmd = `${npm} install`;
      const spinner = ora(utils.log(`start ${cmd} ...`));
      spinner.start();
      const result = shell.exec(cmd, { cwd: projectDir, stdio: ["inherit"] });
      if (result) {
        if (result.code === 0) {
          success(`${cmd} done`);
          spinner.succeed();
        } else {
          spinner.stop();
          console.log(chalk.red(`${cmd} error`), result.stderr);
        }
      } else {
        spinner.stop();
      }
    }
  }

  mustacheReplace(projectDir, data) {
    const fileName = "mustache.config.js";
    const path = `${projectDir}/${fileName}`;
    const self = this;
    if (fs.existsSync(path)) {
      try {
        const msConfig = require(path);
        const fileArr = msConfig.files;
        const fileStrArr = fileArr.map((file) =>
          fs.readFileSync(`${projectDir}/${file}`, { encoding: "UTF-8" })
        );
        fileArr.forEach(
          (file, index) =>
            fs.writeFileSync(
              `${projectDir}/${file}`,
              Mustache.render(fileStrArr[index], data)
            ),
          { encoding: "UTF-8" }
        );
        utils.log(`mustache files[${fileArr.join(",")}] done`);
        self.removeFile(projectDir, fileName);
      } catch (err) {
        console.log(chalk.red(`mustache file error`), err);
      }
    }
  }

  removeFile(projectDir, filePath) {
    const cmd = `rm ${filePath}`;
    utils.log(`execute ${cmd} ...`);
    const result = shell.exec(cmd, { cwd: projectDir, stdio: ["inherit"] });
    if (result) {
      if (result.code === 0) {
        utils.log(`${cmd} done`);
      } else {
        console.log(chalk.red(`${cmd} error`), result.stderr);
      }
    }
  }

  copyTemplate(targetDir) {
    const sourceDir = path.resolve(__dirname, "../template");
    if (fs.existsSync(sourceDir)) {
      this.copy(sourceDir, targetDir, { hide: true });
    }
  }

  quickStart(projectName, info) {
    let i = 1;
    const { npm, run } = info;
    const steps = [`${i}. cd ${projectName}`];
    if (!npm) {
      i++;
      steps.push(`${i}. npm install or yarn install`);
    }
    i++;
    steps.push(`${i}. ${run || "npm run dev"}`);

    utils.log(`enjoy coding by follow steps:\r\n${steps.join("\r\n")}`);
  }

  init(root, bilerplateInfo, projectInfoAnswer = {}, options = {}) {
    const self = this;
    const { pkgName, sourceDir = "", run, value } = bilerplateInfo;
    const { name, npm } = projectInfoAnswer;
    const projectName = name || value || pkgName;

    co(function* () {
      const absSourceDir = yield self.download(pkgName, sourceDir);
      const absTargetDir = path.join(root, projectName);
      yield mkdirp(absTargetDir);
      self.copy(absSourceDir, absTargetDir);
      self.copyTemplate(absTargetDir);
      // self.updatePackageFile(absTargetDir, projectInfoAnswer);
      success(`init [${projectName}] project done`);
      self.installDeps(absTargetDir, { npm });
      self.quickStart(projectName, { npm, run });
    }).catch((err) => {
      /* istanbul ignore next */
      console.log("init error", err);
    });
  }
};
