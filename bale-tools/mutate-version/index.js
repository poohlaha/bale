'use strict'

const BaleUtils = require('@bale-tools/utils')
const _ = require('lodash')
const path = require('node:path')
const fsExtra = require('fs-extra')
const os = require('node:os')
const chalk = require('chalk')

// logger
const Logger = new BaleUtils.Logger('[Bale Mutate version]:')

// babel import plugins
const babelImportPlugins = {
  'antd-mobile': ['import', { libraryName: 'antd-mobile', libraryDirectory: 'es/components', style: false }],
  vant: [
    'import',
    {
      libraryName: 'vant',
      libraryDirectory: 'es',
      style: true,
    },
    'vant',
  ],
}
/*
  interface MutateOptions {
    language: String, // 语言, 'react' | 'vue'
    useTypescript: Boolean, // 是否使用 typescript
    babelImportPluginName: '', // antd-mobile | vant
    babelImportPluginOpts: [], // other plugins array
  }
 */
const MutateVersion = function MutateVersion(opts = {}) {
  this.appRootDir = BaleUtils.Paths.getAppRootDir()
  this.languages = ['react', 'vue']
  this.commonDir = 'common'
  this.opts = _.cloneDeep(opts) || {}
  this.defaultBabelImportPlugins = ['antd-mobile', 'vant']
  this.useTypescript = this.needTypescript(this.opts.useTypescript)
  this.babelImportPluginName = this.getBabelImportPlugin(this.opts.babelImportPluginName)
  this.babelFileName = 'babel.config.js'
  this.init()
}

// init
MutateVersion.prototype.init = function () {
  const { config, fileList } = this.getConfigAndFiles()
  this.config = config || {}
  this.fileList = fileList || []
}

// config and files
MutateVersion.prototype.getConfigAndFiles = function () {
  if (BaleUtils.Utils.isBlank(this.opts.language)) {
    Logger.error('language must be not null !')
  }

  if (!this.languages.includes(this.opts.language)) {
    Logger.error('language is incorrect !')
  }

  const commonDir = path.join(__dirname, 'common') // common dir
  const commonFileList = this.readDir(commonDir)
  const languageFileList = this.readDir(path.join(__dirname, this.opts.language, 'articles'))

  // config
  let config = null
  try {
    config = require(`./${this.opts.language}/config.json`)
  } catch (e) {
    Logger.error('read config error !')
  }

  const fileList = [...commonFileList, ...languageFileList]
  return {
    config,
    fileList,
  }
}

// 获取拷贝的文件
MutateVersion.prototype.copy = function () {
  // clean
  this.clean(false)

  Logger.info(`Starting ${chalk.cyan('copy files')} ...`, 'whiteBright')
  const startTime = new Date().getTime()

  // 拷贝文件到 app 目录
  for (let filePath of this.fileList) {
    fsExtra.copySync(filePath, path.join(this.appRootDir, path.basename(filePath)))
  }

  // 判断是否需要重新写入 .babelrc 文件
  this.rewriteBabelConfig()

  if (_.isNil(this.config) || BaleUtils.Utils.isObjectNull(this.config)) {
    Logger.info('All files have been copied .')
    return
  }

  // 重写 package.json
  const hasWrite = this.validatePackage()
  if (hasWrite) {
    // install
    BaleUtils.Paths.install()
  }

  // end
  const endTime = new Date().getTime()
  Logger.info(`Finished ${chalk.cyan('copy files')} after ${chalk.magenta(`${endTime - startTime} ms`)}`, 'whiteBright')
}

// 读取目录文件
MutateVersion.prototype.readDir = function (dir) {
  if (!fsExtra.pathExistsSync(dir)) {
    throw new Error(`${dir} is incorrect !`)
  }

  let fileList = BaleUtils.Paths.getFileList(dir)
  if (fileList.length === 0) return []

  // ignore files
  const ignoreFileList = !BaleUtils.Utils.isBlank(this.babelImportPluginName) ? [this.babelFileName] : ''

  let filePathList = []
  for (let file of fileList) {
    const basename = path.basename(file)
    if (!this.useTypescript) {
      if (basename !== 'tsconfig.json' && !ignoreFileList.includes(basename)) {
        filePathList.push(file)
      }
    } else {
      if (!ignoreFileList.includes(basename)) {
        filePathList.push(file)
      }
    }
  }

  return filePathList
}

// 检查版本并重写 package.json
MutateVersion.prototype.validatePackage = function () {
  const appPackageJson = require(path.join(this.appRootDir, 'package.json'))
  const appPackage = _.cloneDeep(appPackageJson) || {}
  const dependencies = appPackage.dependencies || {}
  const devDependencies = appPackage.devDependencies || {}
  let configDependencies = this.config.dependencies || {}
  let configDevDependencies = this.config.devDependencies || {}

  // use typescript
  if (this.useTypescript) {
    const tsDependencies = this.config['tsDependencies'] || {}
    const tsDevDependencies = this.config['tsDevDependencies'] || {}
    configDependencies = _.assign({}, configDependencies, tsDependencies)
    configDevDependencies = _.assign({}, configDevDependencies, tsDevDependencies)
  }

  const rewriteDependencies = (dependencies = {}, configDependencies = {}) => {
    let hasWrite = false
    for (let key in configDependencies) {
      // 判断依赖和版本号是否一致, 如果不一致升级版本
      if (!dependencies[key] || dependencies[key] !== configDependencies[key]) {
        dependencies[key] = configDependencies[key]
        hasWrite = true
      }
    }

    return hasWrite
  }

  let hasDependenciesWrite = rewriteDependencies(dependencies, configDependencies || {})
  let hasDevDependenciesWrite = rewriteDependencies(devDependencies, configDevDependencies || {})
  let flag = hasDependenciesWrite || hasDevDependenciesWrite

  // judge `husky` and `lint-staged`
  const appPackageHusky = appPackage['husky'] || {}
  const appPackageLintStaged = appPackage['lint-staged'] || {}
  let configFlag = _.isEqual(appPackageHusky, this.config['husky']) && _.isEqual(appPackageLintStaged, this.config['lint-staged'])
  const hasWrite = flag || !configFlag

  if (hasWrite) {
    appPackage['husky'] = this.config['husky'] || {}
    appPackage['lint-staged'] = this.config['lint-staged'] || {}
    fsExtra.writeFileSync(path.join(this.appRootDir, 'package.json'), JSON.stringify(appPackage, null, 2) + os.EOL)
  }

  return hasWrite
}

// 判断是否需要 typescript
MutateVersion.prototype.needTypescript = function (useTypescript) {
  if (_.isNil(useTypescript)) return false
  if (typeof useTypescript !== 'boolean') return Boolean(useTypescript)
  return useTypescript
}

// 判断是否需要 babel 第三方按需加载插件
MutateVersion.prototype.getBabelImportPlugin = function (babelImportPluginName = '') {
  if (BaleUtils.Utils.isBlank(babelImportPluginName)) return ''
  if (!this.defaultBabelImportPlugins.includes(babelImportPluginName)) return ''
  return babelImportPluginName
}

// 获取 babel config 配置
MutateVersion.prototype.rewriteBabelConfig = function () {
  let babelImportPluginOpts = this.opts.babelImportPluginOpts || []
  if (BaleUtils.Utils.isBlank(this.babelImportPluginName) && babelImportPluginOpts.length === 0) return

  // 读取 .babelrc 文件
  let babelConfig = {}
  try {
    babelConfig = require(path.join(__dirname, this.opts.language, 'articles', this.babelFileName))
    // const babelrc = fsExtra.readFileSync(path.join(__dirname, this.opts.language, 'articles', this.babelFileName), 'utf-8')
    // babelConfig = JSON.parse(babelrc)
  } catch (e) {
    Logger.error(`read ${this.babelFileName} error !`, e)
  }

  let plugins = babelConfig.plugins || []

  // 添加按需加载插件
  const babelPlugins = babelImportPlugins[this.babelImportPluginName] || []
  if (babelPlugins.length > 0) {
    plugins.push(babelPlugins)
  }

  // other plugins
  plugins = [...plugins, ...babelImportPluginOpts]
  babelConfig.plugins = plugins

  // 在 app 根目录写入文件
  fsExtra.writeFileSync(path.join(this.appRootDir, this.babelFileName), 'module.exports = ' + JSON.stringify(babelConfig, null, 2) + os.EOL)
}

// clean
MutateVersion.prototype.clean = function (clearDependencies = true) {
  Logger.info(`Starting ${chalk.cyan('clean')} ...`, 'whiteBright')
  const startTime = new Date().getTime()

  const appPackageJson = require(path.join(this.appRootDir, 'package.json'))
  const appPackage = _.cloneDeep(appPackageJson) || {}

  // delete `husky` and `lint-staged`
  delete appPackage['husky']
  delete appPackage['lint-staged']

  let dependencies = appPackage.dependencies || {}
  let devDependencies = appPackage.devDependencies || {}
  let configDependencies = this.config.dependencies || {}
  let configDevDependencies = this.config.devDependencies || {}

  // use typescript
  if (this.useTypescript) {
    const tsDependencies = this.config['tsDependencies'] || {}
    const tsDevDependencies = this.config['tsDevDependencies'] || {}
    configDependencies = _.assign({}, configDependencies, tsDependencies)
    configDevDependencies = _.assign({}, configDevDependencies, tsDevDependencies)
  }

  // delete files
  for (let filePath of this.fileList) {
    fsExtra.removeSync(path.join(this.appRootDir, path.basename(filePath)))
  }

  // 删除 .babelrc 文件
  if (!BaleUtils.Utils.isBlank(this.babelImportPluginName)) {
    fsExtra.removeSync(path.join(this.appRootDir, this.babelFileName))
  }

  const rewriteDependencies = (dependencies = {}, configDependencies = {}) => {
    for (let key in configDependencies) {
      delete dependencies[key]
    }
  }

  // delete `dependencies` and `devDependencies`
  if (clearDependencies) {
    rewriteDependencies(dependencies, configDependencies || {})
    rewriteDependencies(devDependencies, configDevDependencies || {})
    fsExtra.writeFileSync(path.join(this.appRootDir, 'package.json'), JSON.stringify(appPackage, null, 2) + os.EOL)
  }

  // end
  const endTime = new Date().getTime()
  Logger.info(`Finished ${chalk.cyan('clean')} after ${chalk.magenta(`${endTime - startTime} ms`)}`, 'whiteBright')
}

module.exports = MutateVersion
