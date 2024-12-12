/**
 * @fileOverview Rollup
 * @date 2023-03-09
 * @author poohlaha
 */
import * as _ from 'lodash'
import rollup from 'rollup'
import fsExtra from 'fs-extra'
import path from 'node:path'
import rollupCommonJs from 'rollup-plugin-commonjs'
import rollUpJson from '@rollup/plugin-json'
import { terser } from 'rollup-plugin-terser'
import rollupPluginReplace from '@rollup/plugin-replace'
import nodeResolvePlugin from '@rollup/plugin-node-resolve'
import { IRollupOptions } from './types'
import { Logger as BaleLogger, Paths, Utils } from '@bale-tools/utils'

// logger
const Logger = new BaleLogger('[Bale Mutate Service]:')

export default class Rollup {
  private readonly _appRootDir: string
  private readonly _defaultFormats: Array<string>
  private readonly _input: string
  private readonly _formats: Array<string>
  private readonly _min: boolean
  private readonly _output: { [K: string]: any }
  private readonly _plugins: Array<any>
  private readonly _done: Function | null

  constructor(opts: IRollupOptions) {
    const clonedOpts = _.cloneDeep(opts || {}) // clone opts
    this._appRootDir = Paths.getAppRootDir(clonedOpts.appRootDir || '')
    this._defaultFormats = ['umd', 'es', 'amd', 'iife', 'cjs', 'system']
    this._input = this._getInputOpts(clonedOpts.input || '')
    this._formats = this._getFormats(clonedOpts.formats)
    this._min = _.isNil(clonedOpts.min) ? true : clonedOpts.min // 最小化压缩
    this._output = opts.output || {}
    this._plugins = opts.plugins || []
    this._done = opts.done || null
  }

  /**
   * 获取输入属性
   * @param input
   * @private
   */
  private _getInputOpts(input: string): string {
    if (Utils.isBlank(input) || !fsExtra.pathExistsSync(input) || !fsExtra.pathExistsSync(path.join(this._appRootDir, input))) {
      const indexJsPath: string = path.join(this._appRootDir, 'index.js')
      if (fsExtra.pathExistsSync(indexJsPath)) {
        return indexJsPath
      }
    }

    if (Utils.isBlank(input)) {
      Logger.error('Rollup input is be must !')
    }

    return input
  }

  /**
   * 获取 format
   * @param formats
   * @private
   */
  private _getFormats(formats: Array<string> | string): Array<string> {
    if (_.isNil(formats) || (Array.isArray(formats) && formats.length === 0) || (typeof formats === 'string' && Utils.isBlank(formats))) {
      return [this._defaultFormats[0]] // 默认为 es
    }

    // string
    if (typeof formats === 'string') {
      if (Utils.isBlank(formats)) {
        // null
        return [this._defaultFormats[0]] // 默认为 es
      }

      formats = formats.trim() || ''
      if (formats.includes(',')) {
        formats = formats.split(',') || []
        formats = formats.filter(f => !Utils.isBlank(f) && this._defaultFormats.includes((f || '').trim()))
        if (formats.includes('all')) {
          return this._defaultFormats // 默认为 defaultFormats
        } else {
          return formats || []
        }
      } else {
        if (formats === 'all') {
          return this._defaultFormats // 默认为 defaultFormats
        } else {
          if (!this._defaultFormats.includes(formats)) {
            return [this._defaultFormats[0]] // 默认为 es
          }

          return [formats]
        }
      }
    }

    // array
    if (Array.isArray(formats)) {
      if (formats.length === 0) {
        return [this._defaultFormats[0]] // 默认为 es
      } else {
        if (formats.includes('all')) {
          return this._defaultFormats // 默认为 defaultFormats
        }

        let outputFormats: Array<string> = []
        for (let format of formats) {
          const _format: string = (format || '').trim()
          if (this._defaultFormats.includes(_format)) {
            if (!outputFormats.includes(_format)) {
              outputFormats.push(_format)
            }
          }
        }

        return outputFormats.length === 0 ? [this._defaultFormats[0]] : outputFormats
      }
    }

    return [this._defaultFormats[0]] // 默认为 es
  }

  /**
   * 获取输出默认项目名称
   * @param outputFile
   */
  private _getDefaultOutputName(outputFile: string = ''): string {
    if (!Utils.isBlank(outputFile)) {
      const basename: string = path.basename(outputFile)
      const extname: string = path.extname(outputFile)
      return basename.replace(extname, '')
    }

    const outputName: string = 'index'
    const packageJsonPath = path.join(this._appRootDir, 'package.json')
    if (!fsExtra.pathExistsSync(packageJsonPath)) {
      return outputName
    }

    const packageJson: { [K: string]: any } = require(packageJsonPath) || {}
    return packageJson.name || outputName || ''
  }

  /**
   * 获取输出
   * @param format
   */
  private _getOutputOpts(format: string = ''): Array<{ [K: string]: any }> {
    if (!_.isNil(this._output) && typeof this._output !== 'object') {
      Logger.error('Rollup output must be object !')
    }

    const rollupOutput = _.cloneDeep(this._output || {}) || {}
    //exports https://rollupjs.org/configuration-options/#output-exports
    if (Utils.isBlank(rollupOutput.exports)) {
      rollupOutput.exports = 'default' // auto | default | named | none
    }

    const fileName = this._getDefaultOutputName(rollupOutput.file)
    const getOutputFile = (file: string = ''): string => {
      if (Utils.isBlank(file)) {
        let outputFileName = `${fileName}.${format}.${this._min ? 'min.' : ''}js`
        let inputDir = this._input.replace(this._appRootDir, '')
        inputDir = inputDir.replace(path.basename(this._input), '')
        return path.join(this._appRootDir, inputDir || '', outputFileName)
      }

      return file
    }

    // file
    rollupOutput.file = getOutputFile(rollupOutput.file)

    // name, 自动添加 `__`
    rollupOutput.name = '__' + fileName.toUpperCase() + '__'

    // format
    rollupOutput.format = format || this._defaultFormats[0]

    // sourcemap
    rollupOutput.sourcemap = !this._min

    // esModule
    rollupOutput.esModule = format === this._defaultFormats[0]

    // plugins
    rollupOutput.plugins = [terser()]
    rollupOutput.plugins = (rollupOutput.plugins || []).concat(this._plugins || [])
    return [rollupOutput] || []
  }

  /**
   * rollup options
   * @param format
   */
  private _getRollupOptions(format: string = ''): { [K: string]: any } {
    // replace plugin
    const createReplacePlugin = replacement => {
      const plugin = rollupPluginReplace({
        'process.env.NODE_ENV': JSON.stringify(replacement),
        __buildDate__: () => JSON.stringify(new Date()),
        // __buildVersion: 15,
        preventAssignment: true
      })
      // Remove transform hook. It will have warning when using in output
      delete plugin.transform
      return plugin
    }

    const plugins = this._min ? [createReplacePlugin('production')] : [createReplacePlugin('development')]
    return {
      plugins: [nodeResolvePlugin(), rollupCommonJs(), rollUpJson()].concat(plugins),
      treeshake: {
        moduleSideEffects: false // code from imported modules will only be retained if at least one exported value is used
      },
      input: this._input,
      output: this._getOutputOpts(format)
    }
  }

  /**
   * compile
   */
  public async compile(): Promise<void> {
    Logger.info('Rollup begin to bundling compiling ...')
    try {
      for (let format of this._formats) {
        format = (format || '').trim()
        const config = this._getRollupOptions(format) || {}
        if (_.isEmpty(config)) continue

        const bundle = await rollup.rollup(config)
        for (let output of config.output) {
          await bundle.write(output)

          // 替换 绝对路径
          let file = output.file || ''
          if (fsExtra.pathExistsSync(file)) {
            let code = fsExtra.readFileSync(file, 'utf-8') || ''
            const appRootDir = Paths.replaceDoubleSlashByWindows(this._appRootDir) + '/'
            if (code.replaceAll) {
              code = code.replaceAll(appRootDir, './')
            } else {
              let reg = RegExp(appRootDir, 'g')
              code = code.replace(reg, '')
            }

            fsExtra.writeFileSync(file, code)
          }
        }
      }
    } catch (e) {
      Logger.error('Rollup compiler failed:', e)
    }

    this._done?.()
    Logger.info('Rollup end to bundling compiling ...')
  }
}
