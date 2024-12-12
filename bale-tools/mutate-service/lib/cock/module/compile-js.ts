/**
 * @fileOverview compile js
 * @date 2023-03-10
 * @author poohlaha
 */
import * as babel from '@babel/core'
import * as _ from 'lodash'
import fsExtra from 'fs-extra'
import path from 'node:path'
import CookPaths from '../utils/paths'
import { Logger as BaleLogger, Paths } from '@bale-tools/utils'
import { ICompileJsOptions } from '../utils/type'

// logger
const Logger = new BaleLogger(CookPaths.getLoggerName())

export default class CompileJs {
  private readonly _mode: string
  private readonly _filePath: string
  private readonly _appRootDir: string

  constructor(opts: ICompileJsOptions) {
    const clonedOpts = _.cloneDeep(opts || {}) // clone opts
    this._mode = clonedOpts.mode
    this._filePath = clonedOpts.filePath || ''
    this._appRootDir = clonedOpts.appRootDir || ''
  }

  /**
   * 读取根目录下的 babel.config.js 或 .babelrc 文件
   */
  private _resolveBabelConfig() {
    let babelConfig: { [K: string]: any } = {}
    const babelConfigPath: string = path.join(this._appRootDir, 'babel.config.js')
    const babelrcConfigPath: string = path.join(this._appRootDir, '.babelrc')
    if (fsExtra.pathExistsSync(babelConfigPath)) {
      babelConfig = require(babelConfigPath) // babel.config.js
    } else if (fsExtra.pathExistsSync(babelrcConfigPath)) {
      babelConfig = Paths.toJsonByPath(babelrcConfigPath) // .babelrc
    }

    let presets = babelConfig.presets || []
    let plugins = babelConfig.plugins || []

    const findInPlugins = (pluginName: string = '', plugins: Array<any> = []): boolean => {
      if (plugins.length === 0) return false
      for (let plugin of plugins) {
        if (typeof plugin === 'string' && plugin === pluginName) {
          return true
        }

        if (Array.isArray(plugin)) {
          let isInPlugin = false
          for (let p of plugin) {
            if (typeof p === 'string' && p === pluginName) {
              isInPlugin = true
              break
            }
          }

          if (isInPlugin) {
            return true
          }
        }
      }

      return false
    }

    const useESModules: boolean = this._mode !== 'commonjs'
    const extname: string = path.extname(this._filePath) || ''

    // default presets
    let defaultPresets: Array<{ [K: string]: any } | string> = []

    // default presets
    const babelPresetPresetEnv: string = '@babel/preset-env' // @babel/preset-env
    const babelPresetTypeScript: string = '@babel/preset-typescript' // @babel/preset-typescript
    const vueBabelPresetJsx: string = '@vue/babel-preset-jsx' // @vue/babel-preset-jsx
    const babelPresetReact: string = '@babel/preset-react' // @babel/preset-react

    // @babel/preset-env
    if (!findInPlugins(babelPresetPresetEnv, presets)) {
      defaultPresets.push([babelPresetPresetEnv, { modules: useESModules ? false : 'commonjs' }])
    }

    // @babel/preset-typescript
    if (extname === '.ts' || extname === '.tsx') {
      if (!findInPlugins(babelPresetTypeScript, presets)) {
        defaultPresets.push(babelPresetTypeScript)
      }
    }

    // vue @vue/babel-preset-jsx
    if (extname === '.vue') {
      if (!findInPlugins(vueBabelPresetJsx, presets)) {
        defaultPresets.push([vueBabelPresetJsx, { functional: false }])
      }

      defaultPresets.push(require('./babel-preset-vue-ts'))
    }

    // react @babel/preset-react
    if (extname === '.tsx' || extname === '.jsx') {
      if (!findInPlugins(babelPresetReact, presets)) {
        presets.push(babelPresetReact)
      }
    }

    // concat presets
    presets = presets.concat(defaultPresets)

    // default plugins
    let defaultPlugins: Array<{ [K: string]: any } | string> = []
    const babelPluginSyntaxDynamicImport: string = '@babel/plugin-syntax-dynamic-import' // @babel/plugin-syntax-dynamic-import
    const babelPluginProposalDecorators: string = '@babel/plugin-proposal-decorators' // @babel/plugin-proposal-decorators
    const babelPluginProposalClassProperties: string = '@babel/plugin-proposal-class-properties' // @babel/plugin-proposal-class-properties
    const babelPluginSyntaxJsx: string = '@babel/plugin-syntax-jsx' // @babel/plugin-syntax-jsx
    const babelPluginTransformRuntime: string = '@babel/plugin-transform-runtime' // @babel/plugin-transform-runtime

    // @babel/plugin-syntax-dynamic-import
    if (!findInPlugins(babelPluginSyntaxDynamicImport, plugins)) {
      defaultPlugins.push(babelPluginSyntaxDynamicImport)
    }

    // @babel/plugin-proposal-decorators
    if (!findInPlugins(babelPluginProposalDecorators, plugins)) {
      defaultPlugins.push([babelPluginProposalDecorators, { version: '2022-03' }])
    }

    // @babel/plugin-proposal-class-properties
    if (!findInPlugins(babelPluginProposalClassProperties, plugins)) {
      defaultPlugins.push(babelPluginProposalClassProperties)
    }

    // react @babel/plugin-syntax-jsx
    if (extname === '.jsx' || extname === 'tsx') {
      if (!findInPlugins(babelPluginSyntaxJsx, plugins)) {
        defaultPlugins.push(babelPluginSyntaxJsx)
      }
    }

    // @babel/plugin-transform-runtime
    if (extname === '.jsx' || extname === 'tsx') {
      if (!findInPlugins(babelPluginTransformRuntime, plugins)) {
        defaultPlugins.push([
          babelPluginTransformRuntime,
          {
            corejs: false,
            useESModules
          }
        ])
      }
    }

    plugins = plugins.concat(defaultPlugins)
    return { presets, plugins }
  }

  /**
   * compile
   */
  public async compile(): Promise<any> {
    try {
      const { presets, plugins } = this._resolveBabelConfig()
      let code: string = fsExtra.readFileSync(this._filePath, 'utf-8')
      code = CookPaths.replaceCssImportExt(code)
      code = CookPaths.replaceScriptImportExt(code, '.vue', '')
      const result: { [K: string]: any } = await babel.transformAsync(code, {
        filename: this._filePath,
        presets,
        babelrc: false,
        plugins
      })

      if (!result) {
        return
      } else {
        const jsFilePath: string = CookPaths.replaceExt(this._filePath, '.js')
        // 替换项目下的node_modules全路径
        let nodeModulePath: string = Paths.getAppNodeModules()
        nodeModulePath = path.join(nodeModulePath, process.platform === 'win32' ? '\\' : '/')
        let resultCode: string = result.code || ''
        if (resultCode.replaceAll) {
          resultCode = resultCode.replaceAll(nodeModulePath, '')
        } else {
          let reg = RegExp(nodeModulePath, 'g')
          resultCode = resultCode.replace(reg, '')
        }

        fsExtra.outputFileSync(jsFilePath, resultCode)
        if (path.basename(this._filePath) !== path.basename(jsFilePath)) fsExtra.removeSync(this._filePath)
      }
    } catch (e) {
      Logger.error(`Compile Js Failed: ${this._filePath || ''}`, e)
    }
  }
}
