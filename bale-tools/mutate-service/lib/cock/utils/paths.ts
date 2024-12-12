/**
 * @fileOverview Paths 类
 * @date 2023-03-09
 * @author poohlaha
 */
import fsExtra from 'fs-extra'
import path from 'node:path'
import globby from 'globby'

class Regs {
  public readonly _EXT_REGEXP = /\.\w+$/
  public readonly _JS_REGEXP = /\.(vue|jsx|js)$/
  public readonly _TS_REGEXP = /\.(ts|tsx)$/
  public readonly _VUE_REGEXP = /\.(vue)$/
  public readonly _DEMO_REGEXP = new RegExp('\\' + path.sep + 'demo$')
  public readonly _TEST_REGEXP = new RegExp('\\' + path.sep + 'test$')
  public readonly _TYPE_REGEXP = new RegExp('\\' + path.sep + 'types$')
  public readonly _ASSET_REGEXP = /\.(png|jpe?g|gif|webp|ico|jfif|svg|woff2?|ttf)$/i
  public readonly _STYLE_REGEXP = /\.(css|less|scss)$/
  public readonly _SCRIPT_REGEXP = /\.(js|ts|jsx|tsx)$/
  public readonly _HTML_REGEXP = /\.(htm|html)$/
  public readonly _OTHER_REGEXP = /\.(md|.json)$/
  public readonly _IMPORT_REGEXP = /import\s+?(?:(?:(?:[\w*\s{},]*)\s+from(\s+)?)|)(?:(?:".*?")|(?:'.*?'))[\s]*?(?:;|$|)/g
  public readonly _IMPORT_STYLE_EGEXP = /import\s+?(?:(?:".*?")|(?:'.*?'))[\s]*?(?:;|$|)/g
  public readonly _ENTRY_EXTS = ['js', 'ts', 'tsx', 'jsx', 'vue']
  public readonly _SCRIPT_EXTS = ['.js', '.jsx', '.vue', '.ts', '.tsx']
  public readonly _STYPE_DEPS_JSON_FILE = 'style-deps.json'
  public readonly _CSS_LANG = 'less'
}

class Paths {
  public readonly _REGS: Regs

  constructor() {
    this._REGS = new Regs()
  }

  public isDemoDir(dir: string = ''): boolean {
    return this._REGS._DEMO_REGEXP.test(dir)
  }

  public isTestDir(dir: string = ''): boolean {
    return this._REGS._TEST_REGEXP.test(dir)
  }

  public isAsset(path: string = ''): boolean {
    return this._REGS._ASSET_REGEXP.test(path)
  }

  public isJs(path: string = ''): boolean {
    return this._REGS._JS_REGEXP.test(path)
  }

  public isTs(path: string = ''): boolean {
    return this._REGS._TS_REGEXP.test(path)
  }

  public isVue(path: string = ''): boolean {
    return this._REGS._VUE_REGEXP.test(path)
  }

  public isStyle(path: string = ''): boolean {
    return this._REGS._STYLE_REGEXP.test(path)
  }

  public isScript(path: string = ''): boolean {
    return this._REGS._SCRIPT_REGEXP.test(path)
  }

  public isHtml(path: string = ''): boolean {
    return this._REGS._HTML_REGEXP.test(path)
  }

  public isTypesDir(dir: string = ''): boolean {
    return this._REGS._TYPE_REGEXP.test(dir)
  }

  public isOther(path: string = ''): boolean {
    return this._REGS._OTHER_REGEXP.test(path)
  }

  public removeExt(path: string = ''): string {
    return path.replace('.js', '')
  }

  public replaceExt(path: string = '', ext: string = ''): string {
    return path.replace(this._REGS._EXT_REGEXP, ext)
  }

  /**
   * 替换 "import 'a.less';" => "import 'a.css';"
   */
  public replaceCssImportExt(code: string = '', CSS_LANG: string = 'less'): string {
    return code.replace(this._REGS._IMPORT_STYLE_EGEXP, str => str.replace(`.${CSS_LANG}`, '.css'))
  }

  /**
   * 替换 "import App from 'App.vue';" => "import App from 'App.xxx';"
   */
  public replaceScriptImportExt(code: string = '', from: string = '', to: string = ''): string {
    const importLines = code.match(this._REGS._IMPORT_REGEXP) || []
    importLines.forEach(importLine => {
      const result = importLine.replace(from, to)
      code = code.replace(importLine, result)
    })
    return code
  }

  public async readFilePaths({ patterns, cwd, ignore = [] }): Promise<Array<string>> {
    return (
      // await globby(patterns, {cwd, ignore: ['packages/**/demo/**/*', 'packages/**/test/**/*']})
      (await globby(patterns, { cwd, ignore })).map(srcPath => path.resolve(cwd, srcPath))
    )
  }

  /**
   * 是否有默认导出
   */
  public hasDefaultExport(code: string = ''): boolean {
    return code.includes('export default') || code.includes('export { default }')
  }

  public fillExt(filePath: string = ''): string {
    for (let i = 0; i < this._REGS._SCRIPT_EXTS.length; i++) {
      const completePath = `${filePath}${this._REGS._SCRIPT_EXTS[i]}`
      if (fsExtra.existsSync(completePath)) {
        return completePath
      }
    }

    for (let i = 0; i < this._REGS._SCRIPT_EXTS.length; i++) {
      const completePath = `${filePath}/index${this._REGS._SCRIPT_EXTS[i]}`
      if (fsExtra.existsSync(completePath)) {
        return completePath
      }
    }

    return ''
  }

  public matchImports(code: string = ''): Array<string> {
    return code.match(this._REGS._IMPORT_REGEXP) || []
  }

  public trim(code: string = ''): string {
    return code.replace(/\/\/\n/g, '').trim()
  }

  /**
   * 判断目录下是否只有一个目录, 没有其他文件
   */
  public judgeOnlyOneDir(dir: string = ''): Array<string> {
    if (!dir) return []
    const EXCLUDES = ['.DS_Store', 'node_modules']
    const dirs = fsExtra.readdirSync(dir)
    let fileList: Array<string> = []
    for (let d of dirs) {
      if (EXCLUDES.includes(d)) continue
      fileList.push(d)
    }

    return fileList
  }

  public getCommands(): { [K: string]: string } {
    return {
      entry: '--entry',
      output: '--output',
      format: '--format'
    }
  }

  // logger name
  public getLoggerName(): string {
    return '[Bale Cook Service]:'
  }
}

export default new Paths()
