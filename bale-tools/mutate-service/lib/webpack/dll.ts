/**
 * @fileOverview webpack dll-plugin, see https://webpack.js.org/plugins/dll-plugin/#root
 * 用于生成一个或多个 [name]-manifest.json 文件, 存放于输出目录下的 static 目录, 当生成文件后需要在 index.html 中引入 [name].dll.js 文件
 * @date 2023-03-16
 * @author poohlaha
 */
import path from 'node:path'
import * as _ from 'lodash'
import fsExtra from 'fs-extra'
import { CleanWebpackPlugin } from 'clean-webpack-plugin'
import webpack, { Compiler, Stats, StatsCompilation } from 'webpack'
import MutatePaths from './utils/paths'
import { IDllOptions } from './utils/type'
import { Logger as BaleLogger, Utils, Paths } from '@bale-tools/utils'

// logger
const Logger = new BaleLogger(MutatePaths.getLoggerName())

class WebpackDllCompiler {
  private readonly _appRootDir: string
  private readonly _mode: string
  private readonly _script: string
  private readonly _defaultOutput: string
  private readonly _output: string
  private readonly _opts: { [K: string]: any } = {}
  private readonly _entry: string | { [K: string]: any }
  private readonly _done: Function | null | undefined
  private readonly _dllFileNameList: Array<string>
  private readonly _dllManifestNameList: Array<string>

  constructor(script: string = '', opts: IDllOptions) {
    const clonedOpts = _.cloneDeep(opts || {}) // clone opts
    this._appRootDir = Paths.getAppRootDir(clonedOpts.rootDir || '') // app dir
    this._mode = MutatePaths.getMode(script, clonedOpts.mode) // webpack mode
    this._script = script || '' // script
    this._defaultOutput = MutatePaths.getOutputDir(this._appRootDir, this._script) || '' // // output
    this._entry = this._getEntry(clonedOpts.entry) // entry
    this._done = clonedOpts.done || null
    const output: { [K: string]: any } = this._getOutput(clonedOpts.output || {}) || {}
    this._output = output.path || this._defaultOutput || '' // output
    this._dllFileNameList = this._getDllNameList(output, 'filename') // output dll name list
    this._dllManifestNameList = this._getDllNameList(output, 'library') // output manifest name list
    if (this._entry) {
      this._opts = {
        mode: this._mode,
        entry: this._entry || '',
        output: this._getOutput(clonedOpts.output || {}),
        plugins: [
          new CleanWebpackPlugin(),
          new webpack.DllPlugin({
            path: path.join(this._output, '[name].manifest.json'),
            name: '[name]_[fullhash]',
            // context: this._output,
          }),
        ],
      }
    }
  }

  private _getEntry(entry: string | { [K: string]: any }): string | { [K: string]: any } {
    if (_.isNil(entry)) {
      Logger.debug('Entry must be not null !')
      return ''
    }

    if (typeof entry === 'string' && Utils.isBlank(entry)) {
      Logger.debug('Entry must be not null !')
      return ''
    }

    if (typeof entry === 'object' && Utils.isObjectNull(entry)) {
      Logger.debug('Entry must be not null !')
      return ''
    }

    if (!_.isObject(entry) && typeof entry !== 'string') {
      Logger.debug('Entry must be string or object !')
      return ''
    }

    return entry
  }

  private _getOutput(output: { [K: string]: any } | string): object {
    let vendorDir = MutatePaths.getVendorDir() || ''
    const defaultOutput = {
      path: path.join(this._defaultOutput, `${vendorDir}`),
      filename: '[name]_[fullhash].dll.js',
      library: '[name]_[fullhash]', // 与webpack.DllPlugin中的 `name` 保持一致。
    }

    let opts: { [K: string]: any } = {}
    if (typeof output === 'string') {
      if (Utils.isBlank(output)) {
        return defaultOutput
      }

      opts.path = output || ''
      opts.filename = defaultOutput.filename || ''
      opts.library = defaultOutput.library || ''
      return opts
    }

    if (_.isObject(output)) {
      if (Utils.isObjectNull(output)) {
        return defaultOutput
      }

      opts.path = Utils.isBlank(output.path) ? defaultOutput.path : output.path
      opts.filename = Utils.isBlank(output.filename) ? defaultOutput.filename : output.filename
      opts.library = Utils.isBlank(output.library) ? defaultOutput.library : output.library
      return opts
    }

    return defaultOutput
  }

  private _getDllNameList(output: { [K: string]: any } = {}, name: string = ''): Array<string> {
    if (Utils.isObjectNull(output)) return []

    const fileName = output[name] || ''
    if (Utils.isBlank(fileName)) return []

    let staticDir = MutatePaths.getStaticDir() || ''
    if (!fileName.includes('[name]')) {
      // 指定文件名
      return [path.join(staticDir, fileName)]
    }

    const replace = (content: string = '', text: string = '') => {
      content = content.replaceAll ? content.replaceAll('[name]', text) : content.replace(/[name]/g, text)
      content = content.replaceAll ? content.replaceAll('_[fullhash]', '-manifest.json') : content.replace(/_[fullhash]/g, '-manifest.json')
      return content
    }
    // string
    if (typeof this._entry === 'string') {
      return [replace(fileName, this._entry)]
    }

    // object
    let fileList: Array<string> = []
    for (let entry in this._entry) {
      fileList.push(replace(fileName, entry))
    }

    return fileList || []
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
        Logger.info('Build Dll Successfully !')
      }

      compiler.close(closeErr => {
        if (!closeErr) {
          // Logger.info('Compiler Closed !')
          callback?.()
        }
      })
    })
  }

  public compile() {
    if (Utils.isObjectNull(this._opts)) return
    if (fsExtra.pathExistsSync(this._output)) {
      fsExtra.removeSync(this._output)
      fsExtra.ensureDirSync(this._output)
    }

    const compiler = webpack(this._opts)
    if (_.isNil(compiler)) {
      Logger.throw('Webpack Dll Configuration Error !')
    }

    const callback = async () => {
      Logger.info('Dll Compiler Closed !')
      this._done?.({
        output: this._output,
        fileList: this._dllFileNameList || [],
        manifestList: this._dllManifestNameList || [],
      })
    }

    this._compile(compiler, callback)
  }
}

export default (script: string = '', opts: IDllOptions) => {
  return new WebpackDllCompiler(script, opts).compile()
}
