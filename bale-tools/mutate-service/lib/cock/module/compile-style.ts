/**
 * @fileOverview compile style: css、less、sass
 * @date 2023-03-10
 * @author poohlaha
 */
import * as _ from 'lodash'
import fsExtra from 'fs-extra'
import postcss from 'postcss'
import * as cleanCss from 'clean-css'
import less from 'less'
import sass from 'sass'
import path from 'node:path'
import CookPaths from '../utils/paths'
import { ICompileStyleOptions } from '../utils/type'
import { Logger as BaleLogger, Utils } from '@bale-tools/utils'

// logger
const Logger = new BaleLogger(CookPaths.getLoggerName())

const FileManager = less.FileManager
class TildeResolver extends FileManager {
  loadFile(filename, ...args) {
    filename = filename.replace('~', '')
    return FileManager.prototype.loadFile.apply(this, [filename, ...args])
  }
}

const TildeResolverPlugin = {
  install(lessInstance, pluginManager) {
    pluginManager.addFileManager(new TildeResolver())
  }
}

export default class CompileStyle {
  private readonly _appRootDir: string
  private readonly _filePath: string

  constructor(opts: ICompileStyleOptions) {
    const clonedOpts = _.cloneDeep(opts || {}) // clone opts
    this._filePath = clonedOpts.filePath || ''
    this._appRootDir = clonedOpts.appRootDir || ''
  }

  /**
   * 读取根目录下的 postcss.config.js 和 .postcssrc.js 文件
   */
  private _resolvePostcssConfig(): { [K: string]: any } {
    const postcssConfigPath: string = path.join(this._appRootDir, 'postcss.config.js')
    const postcssrcConfigPath: string = path.join(this._appRootDir, '.postcssrc.js')

    let postcssConfig: { [K: string]: any } = {}
    if (fsExtra.pathExistsSync(postcssConfigPath)) {
      postcssConfig = require(postcssConfigPath) || {}
    } else if (fsExtra.pathExistsSync(postcssrcConfigPath)) {
      postcssConfig = require(postcssrcConfigPath) || {}
    }

    const plugins: Array<any> = postcssConfig.plugins || []

    // autoprefixer
    if (Array.isArray(plugins)) {
      const hasPostcssPlugin = plugins.find(plugin => plugin === 'autoprefixer' && plugin.postcssPlugin === 'autoprefixer')
      if (!hasPostcssPlugin) {
        plugins.push(require('autoprefixer'))
      }
    }

    delete postcssConfig.plugins

    return {
      ...postcssConfig,
      plugins
    }
  }

  /**
   * compile less
   */
  private async _compileLess(source: string = ''): Promise<string> {
    if (Utils.isBlank(source)) return ''
    const { css } = await less.render(source, {
      filename: this._filePath,
      plugins: [TildeResolverPlugin]
    })

    return css
  }

  /**
   * compile sass
   */
  private async _compileSass(): Promise<string> {
    const { css } = await sass.compile(this._filePath)
    return css
  }

  /**
   * compile css
   */
  private async _compileCss(source: string = ''): Promise<string> {
    if (Utils.isBlank(source)) return ''
    const config: { [K: string]: any } = this._resolvePostcssConfig() || {}
    const { css } = await postcss(config.plugins).process(source, {
      from: undefined
    })

    return new cleanCss().minify(css).styles
  }

  /**
   * compile
   */
  public async compile() {
    if (Utils.isBlank(this._filePath)) return

    const extname: string = path.extname(this._filePath)
    try {
      let css: string = ''
      const source: string = fsExtra.readFileSync(this._filePath, 'utf-8')

      if (extname === '.less') {
        const code: string = await this._compileLess(source)
        css = await this._compileCss(code)
      } else if (extname === '.scss') {
        const code: string = await this._compileSass()
        css = await this._compileCss(code)
      } else {
        css = await this._compileCss(source)
      }

      const cssFilePath: string = CookPaths.replaceExt(this._filePath, '.css')
      if (!fsExtra.pathExistsSync(cssFilePath)) fsExtra.ensureFileSync(cssFilePath)
      fsExtra.writeFileSync(cssFilePath, css)
    } catch (e) {
      Logger.error(`Compile style failed: ${this._filePath || ''}`, e)
    }
  }
}
