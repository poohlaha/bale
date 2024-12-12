/**
 * @fileOverview 此插件会在 webpack 编译完成，才打开浏览器
 * @date 2023-03-13
 * @author poohlaha
 */
import path from 'node:path'
import fsExtra from 'fs-extra'
import * as _ from 'lodash'
import chalk from 'chalk'
import WebpackDevServer from 'webpack-dev-server'
import webpack, { Compiler, Stats, StatsCompilation } from 'webpack'
import Compressing from 'compressing'
import DevServer from './lib/dev.server'
import MutatePaths from './utils/paths'
import WebpackApI from './lib/api'
import { Minimize } from '@bale-tools/mutate-minimize'
import { Logger as BaleLogger, Utils, Paths, ThreadPool } from '@bale-tools/utils'
import { IApiOptions, ICompressOptions } from './utils/type'

// logger
const Logger = new BaleLogger(MutatePaths.getLoggerName())

interface IWebpackCompilerOptions {
  script: string
  opts?: IApiOptions
  proxy?: { [K: string]: any }
  done?: Function
}

class WebpackCompiler {
  public compile(clonedOpts: IWebpackCompilerOptions) {
    let script: string = clonedOpts.script || ''
    const scripts: Array<string> = MutatePaths.getScripts() || []
    if (Utils.isBlank(clonedOpts.script) || !scripts.includes(clonedOpts.script)) {
      script = scripts[1]
    }

    Logger.info(`Begin to ${chalk.magenta(script)} .`)

    const webpackApi: WebpackApI = new WebpackApI(clonedOpts.script, clonedOpts.opts || {})
    let webpackOpts: { [K: string]: any } = webpackApi.getOpts() || {}

    Logger.info(`Current Environment is ${chalk.cyan(webpackApi.getMode() || MutatePaths.getModes[0])} .`)

    if (_.isNil(webpackOpts) || _.isEmpty(webpackOpts)) {
      Logger.throw('Webpack Configuration Is Empty !')
    }

    const compiler = webpack(webpackOpts)
    if (_.isNil(compiler)) {
      Logger.throw('Webpack Configuration Error !')
    }

    // run webpack dev server
    if (script === scripts[0]) {
      return this._runWebpackDevServer(compiler, webpackApi, webpackApi.getRaw().PORT, clonedOpts.proxy || {})
    }

    const callback = async () => {
      const outputDir = webpackOpts.output.path || webpackApi.getDefaultOutput() || ''
      const minFilesDone = async () => {
        await this._compress(webpackApi, outputDir)
        clonedOpts.done?.(outputDir, webpackApi.getAppRootDir())

        Logger.info('Compiler Closed !')
        // process.exit()
      }

      await this._minFiles(webpackApi, outputDir, minFilesDone)
    }

    this._compile(compiler, callback)
  }

  /**
   * run webpack dev server
   */
  private async _runWebpackDevServer(compiler: Compiler, api: WebpackApI, port: number, proxy: { [K: string]: any } = {}) {
    port = MutatePaths.getPort(port)
    const devServer = new DevServer(api, port, proxy)
    const devServerOptions = _.cloneDeep(devServer.getOpts()) || {}
    // disabled `hot` and `client`
    // `hot` and `client` options are disabled because we added them manually
    // https://webpack.docschina.org/guides/hot-module-replacement/#via-the-nodejs-api
    devServerOptions.hot = false
    devServerOptions.client = false
    const server = new WebpackDevServer(devServerOptions, compiler)

    // start server
    await server.start()
    console.log(chalk.whiteBright(' App running at:\n'))
    console.log(chalk.cyan(` - Local:   ${Paths.getAddress(api.getPublicPath(), port) + (api.getSettings().visitSuffixUrl || '')}`))
    console.log(chalk.cyan(` - Network: ${Paths.getAddress(api.getPublicPath(), port, Paths.getLocalIP()) + (api.getSettings().visitSuffixUrl || '')}`))
    console.log()
  }

  /**
   * compile
   */
  private _compile(compiler: Compiler, callback?: Function) {
    compiler.run((err: any, stats: Stats | undefined) => {
      const info: StatsCompilation = stats?.toJson() || {}
      if (err || stats?.hasErrors()) {
        if (err) {
          console.error(err.stack || err)
          if (err.details) {
            console.error(err.details)
          }
          return
        }

        if (stats?.hasErrors()) {
          for (let error of info?.errors || []) {
            console.error(error.message)
            console.log()
          }
        }
      } else {
        console.log(stats?.toString({ colors: true }))
        Logger.info('Build Successfully !')
      }

      compiler.close(closeErr => {
        if (!closeErr) {
          // Logger.info('Compiler Closed !')
          callback?.()
        }
      })
    })
  }

  /**
   * 最小化文件
   */
  private async _minFiles(api: WebpackApI, outputDir = '', done?: Function) {
    let useMinimize = api.getSettings().useMinimize
    if (_.isNil(useMinimize) && api.getProduction()) useMinimize = true
    if (!useMinimize || Utils.isBlank(outputDir)) {
      done?.()
      return
    }

    // 读取输出目录文件
    const fileList = Paths.getFileList(outputDir)
    if (fileList.length === 0) {
      done?.()
      return
    }

    // 开启多线程打包
    const threadPool = new ThreadPool(5, true, done)
    let tasks: Array<any> = []
    for (let file of fileList) {
      tasks.push({
        task: () => new Minimize(file) // compress
      })
    }

    await threadPool.addTasks(tasks)
  }

  private async _compress(api: WebpackApI, outputDir = '') {
    if (!fsExtra.pathExistsSync(outputDir)) return

    // compressing
    const defaultSuffix = '.zip'
    let compressPackUp: ICompressOptions | boolean | undefined = api.getSettings().compress
    if (_.isNil(compressPackUp)) {
      compressPackUp = {}
    }

    // config
    let compressConfig: { [K: string]: any } = {}

    const getDefaultCompressName = (name = '') => {
      let rootName = name || ''

      // 获取文件夹
      if (Utils.isBlank(rootName)) {
        rootName = path.basename(api.getRaw().PROJECT_NAME || api.getAppRootDir())
      }

      // 获取时间
      if (Utils.isBlank(rootName)) {
        let date = new Date()
        const pad = n => (n < 10 ? `0${n}` : n)
        rootName = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
      }

      return rootName
    }

    let enable: boolean = false
    let deleteOutput = false // 是否删除打包输出目录
    if (typeof compressPackUp === 'boolean') {
      compressConfig.name = getDefaultCompressName()
      compressConfig.output = outputDir || ''
      compressConfig.suffix = defaultSuffix
      enable = api.getProduction()
      deleteOutput = true
    } else {
      let compressEnable: boolean | undefined = compressPackUp?.enable
      if (_.isNil(compressEnable)) {
        enable = api.getProduction()
      } else {
        enable = compressEnable || false
      }

      const compressDeleteOutput: boolean | undefined = compressPackUp?.deleteOutput
      if (_.isNil(compressDeleteOutput)) {
        deleteOutput = true
      } else {
        deleteOutput = compressDeleteOutput || false
      }

      compressConfig.name = getDefaultCompressName(compressPackUp?.name || '')
      compressConfig.output = compressPackUp?.output || outputDir || ''
      compressConfig.suffix = compressPackUp?.suffix || '.zip'
    }

    // 不启用
    if (!enable) return

    Logger.info(`Starting ${chalk.cyan('compressing')} ...`)
    const startTime = new Date().getTime()

    const files = fsExtra.readdirSync(outputDir) || []

    // 更改输出目录为压缩名称
    const newOutputDir = path.join(outputDir, compressConfig.name)
    fsExtra.removeSync(newOutputDir)
    fsExtra.ensureDir(newOutputDir)

    for (let file of files) {
      fsExtra.moveSync(path.join(outputDir, file), path.join(newOutputDir, path.basename(file)))
    }

    const compressingPath = path.join(compressConfig.output, `${compressConfig.name}${compressConfig.suffix}`)
    await Compressing.zip.compressDir(newOutputDir, compressingPath)

    // 删除打包输出目录
    if (deleteOutput) {
      fsExtra.removeSync(newOutputDir)
    }

    const endTime = new Date().getTime()
    Logger.info(`Finished ${chalk.cyan('compressing')} after ${chalk.magenta(`${endTime - startTime} ms`)}`)
  }

  /**
   * watch files
   */
  private _watchingFileChange(compiler: Compiler) {
    const watching = compiler.watch(
      {
        aggregateTimeout: 300, // 监听到变化等待300ms 再去执行文件防止文件更新太快导致编译频繁
        poll: undefined
      },
      (err, stats: Stats | undefined) => {
        console.log(stats)
      }
    )

    watching.close(closeErr => {
      Logger.info('Watching Ended.')
    })
  }
}

export default (opts: IWebpackCompilerOptions) => {
  return new WebpackCompiler().compile(opts)
}
