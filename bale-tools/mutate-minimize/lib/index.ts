/**
 * @fileOverview 最小化 css、js、html
 * @date 2023-03-09
 * @author poohlaha
 */
import { Logger as BaleLogger, Utils, ThreadPool, Paths } from '@bale-tools/utils'
import chalk from 'chalk'
import fsExtra from 'fs-extra'
import * as uglifyJs from 'uglify-js'
import cleanCss from 'clean-css'
import htmlMin from 'html-minifier'

// logger
const Logger = new BaleLogger('[Bale Mutate Service]:')

class Minimize {
  private readonly _excludeMinExts: Array<string> = []
  private readonly _defaultExcludeMinExts: Array<string> = []
  private readonly _JS_REG = /\.(js)$/
  private readonly _CSS_REG = /\.(css|less|scss)$/
  private readonly _HTML_REG = /\.(htm|html)$/

  constructor(excludeMinExts: Array<string> = []) {
    this._excludeMinExts = excludeMinExts || []
    this._defaultExcludeMinExts = ['.min.js', '.min.css', '.umd.js', '.common.js', '.esm.js', '.amd.js', '.iife.js', '.cjs.js']
  }

  /**
   * exclude exts
   */
  private _getExcludeMinExts(): Array<string> {
    return this._defaultExcludeMinExts.concat(this._excludeMinExts || [])
  }

  /**
   * 检验是否跳过最小化后缀
   */
  private _judgeSkipMin(filePath: string = '', exts: Array<string> = []): boolean {
    if (exts.length === 0) return true
    for (let ext of exts) {
      if (filePath.endsWith(ext)) {
        return true
      }
    }

    return false
  }

  /**
   * min file
   */
  private _minFile(filePath: string = '', ext: string = '') {
    const code = fsExtra.readFileSync(filePath, { encoding: 'utf8' })
    let result = ''
    if (ext === 'js') {
      result = uglifyJs.minify(code).code
    } else if (ext === 'css') {
      result = new cleanCss({}).minify(code).styles
    } else if (ext === 'html') {
      result = htmlMin.minify(code)
    }

    fsExtra.removeSync(filePath)
    fsExtra.writeFileSync(filePath, result || '', 'utf-8')
    Logger.info(`${chalk.cyan(`Minimize ${Utils.capitalizeFirstChar(ext)} File: `)} ${chalk.green('✔')} ${filePath}`)
  }

  /**
   * min js
   */
  private _minJs(filePath: string = '', exts: Array<string> = []) {
    if (Utils.isBlank(filePath) || !this._JS_REG.test(filePath)) return
    if (this._judgeSkipMin(filePath, exts)) return
    this._minFile(filePath, 'js')
  }

  /**
   * min css
   */
  private _minCss(filePath: string = '', exts: Array<string> = []) {
    if (Utils.isBlank(filePath) || !this._CSS_REG.test(filePath)) return
    if (this._judgeSkipMin(filePath, exts)) return
    this._minFile(filePath, 'css')
  }

  /**
   * min html
   */
  private _minHtml(filePath: string = '', exts: Array<string> = []) {
    if (Utils.isBlank(filePath) || !this._HTML_REG.test(filePath)) return
    if (this._judgeSkipMin(filePath, exts)) return
    this._minFile(filePath, 'html')
  }

  /**
   * compress
   * @param filePath 文件路径
   * @param done
   */
  private _compress(filePath: string = '', done?: Function) {
    if (Utils.isBlank(filePath)) {
      Logger.error('File path is null .')
    }

    if (!fsExtra.pathExistsSync(filePath)) {
      Logger.error(`File path is not exists, current is ${filePath} .`)
    }

    const extList: Array<string> = this._getExcludeMinExts()
    if (this._JS_REG.test(filePath)) {
      // js
      this._minJs(filePath, extList)
    } else if (this._CSS_REG.test(filePath)) {
      this._minCss(filePath, extList)
    } else if (this._HTML_REG.test(filePath)) {
      this._minHtml(filePath, extList)
    }

    done?.()
  }

  /**
   * 批量压缩文件
   */
  private async _compressFiles(fileDir: string = '', done?: Function) {
    if (Utils.isBlank(fileDir)) {
      done?.()
      return
    }

    // 读取输出目录文件
    const fileList = Paths.getFileList(fileDir)
    if (fileList.length === 0) {
      done?.()
      return
    }

    // 开启多线程打包
    const threadPool = new ThreadPool(5, true, done)
    let tasks: Array<any> = []
    for (let file of fileList) {
      tasks.push({
        task: () => this._compress(file), // compress
      })
    }

    await threadPool.addTasks(tasks)
  }

  /**
   * 压缩文件或文件夹下所有文件
   * @param filePath
   * @param done
   */
  async compile(filePath: string = '', done?: Function) {
    const callback = () => {
      Logger.info('Minimize files Successfully !')
      done?.()
    }

    if (Paths.isDir(filePath)) {
      return await this._compressFiles(filePath, callback)
    }

    this._compress(filePath, callback)
  }
}

export default (filePath: string = '', excludeMinExts: Array<string> = [], done?: Function) => {
  return new Minimize(excludeMinExts).compile(filePath, done)
}
