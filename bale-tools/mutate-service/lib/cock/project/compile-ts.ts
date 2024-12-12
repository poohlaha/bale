/**
 * @fileOverview compile ts project
 * @date 2023-03-10
 * @author poohlaha
 */
import * as _ from 'lodash'
import * as babel from '@babel/core'
import chalk from 'chalk'
import fsExtra from 'fs-extra'
import path from 'node:path'
import ts from 'typescript'
import CookPaths from '../utils/paths'
import { ICompileTsOptions } from '../utils/type'
import { Logger as BaleLogger, Utils } from '@bale-tools/utils'

// logger
const Logger = new BaleLogger(CookPaths.getLoggerName())

export default class CompileTs {
  private readonly _mode: 'commonjs' | 'ES2015'
  private readonly _appRootDir: string
  private readonly _outputDir: string
  private readonly _entryDir: string
  private readonly _typesDir: string
  private readonly _useDeclaration: boolean | undefined
  private readonly _excludes: Array<string>
  private readonly _done: Function | null

  constructor(opts: ICompileTsOptions) {
    const clonedOpts = _.cloneDeep(opts || {}) // clone opts
    this._appRootDir = clonedOpts.appRootDir || '' // app root
    this._outputDir = clonedOpts.outputDir || '' // output
    this._entryDir = path.join(this._appRootDir, this._getEntryDir(opts.entryDir))
    this._typesDir = this._outputDir // types dir
    this._mode = opts.mode || 'commonjs' // commonjs | ES2015
    this._useDeclaration = _.isNil(opts.useDeclaration) ? true : opts.useDeclaration
    this._excludes = opts.excludes || []
    this._done = opts.done || null
  }

  private _getEntryDir(entryDir: string = ''): string {
    if (!Utils.isBlank(entryDir)) return entryDir
    entryDir = 'src'
    if (fsExtra.pathExistsSync(path.join(this._appRootDir, entryDir))) {
      return entryDir
    }

    entryDir = 'lib'
    if (fsExtra.pathExistsSync(path.join(this._appRootDir, entryDir))) {
      return entryDir
    }

    return ''
  }

  /**
   * 读取根目录下的 tsconfig.json 文件
   */
  private _readTsConfig() {
    try {
      let superJsonData: { [K: string]: any } = {}
      const tsConfigPath: string = path.join(this._appRootDir, 'tsconfig.json')
      if (!fsExtra.pathExistsSync(tsConfigPath)) return superJsonData

      const tsConfigText: string = fsExtra.readFileSync(tsConfigPath, 'utf8')
      const jsonData: { [K: string]: any } = JSON.parse(tsConfigText)

      // 如果有继承, 读取继承的 tsconfig.json
      if (jsonData.extends) {
        let superTsConfigPath: string = path.join(this._appRootDir, jsonData.extends)
        // 读取根目录下的继承文件
        if (fsExtra.pathExistsSync(superTsConfigPath)) {
          const superTsConfigText: string = fsExtra.readFileSync(superTsConfigPath, 'utf8')
          superJsonData = JSON.parse(superTsConfigText)
        }
      }

      return { ...jsonData, ...superJsonData }
      // return new Function(`return ( ${tsConfigText} )`)()
    } catch (e) {
      Logger.error('读取根目录下的 `tsconfig.json` 失败!', e)
    }
  }

  /**
   * get work config
   */
  private _getWorkConfig(): { [K: string]: any } {
    let ignore: Array<string> = []
    this._excludes.forEach((exclude: string = '') => {
      ignore.push(`${this._appRootDir}/**/${exclude}/**/*`)
    })

    let compilerOptionsOverride: { [K: string]: any } = {
      module: this._mode, // commonjs | ES2015
      rootDir: this._entryDir,
      outDir: this._outputDir,
      declaration: this._useDeclaration
    }

    if (this._useDeclaration) {
      compilerOptionsOverride.declarationDir = this._typesDir
    }

    return {
      logLabel: chalk.cyan('Compile Ts Project To Js ...'),
      compilerOptionsOverride,
      srcGlobby: {
        patterns: [`${this._appRootDir}/**/*.ts`, `${this._appRootDir}/**/*.tsx`],
        // patterns: [path.join(this._appRootDir, '**', '*') + '.ts', path.join(this._appRootDir, '**', '*') + '.tsx'],
        cwd: this._appRootDir,
        ignore: [`${this._appRootDir}/**/types/**/*`].concat(ignore)
        // ignore: [path.join(this._appRootDir, '**', 'types', '**', '*')].concat(ignore),
      },
      transformOptions: {
        filesGlobby: { patterns: ['**/*.js'], ignore, cwd: this._outputDir },
        // filesGlobby: { patterns: [path.join('**', '*') + '.js'], ignore, cwd: this._outputDir },
        transformDev: true
      },
      before: async () => {
        // fsExtra.removeSync(this.tempDir)
        fsExtra.removeSync(this._outputDir)
      },
      after: async () => {
        // fsExtra.moveSync(this.tempDir, this.outputDir) // 重合名为项目
        this._done?.()
      }
    }
  }

  /**
   * Transform import/require path in the entry file to `esm` or `lib`.
   */
  private _transformRootFolderInEntry(entryFile: string = '', replacement: string = '') {
    if (!fsExtra.pathExistsSync(entryFile)) return

    let code = fsExtra.readFileSync(entryFile, 'utf-8')
    code = code.replace(/((import\s+|from\s+|require\(\s*)["'])\.\//g, `$1./${replacement}/`)
    fsExtra.writeFileSync(entryFile, code, 'utf-8')
  }

  /**
   * ts compile
   */
  private async _tsCompile(compilerOptionsOverride: { [K: string]: any }, srcPathList: Array<string>) {
    let compilerOptions: { [K: string]: any } = {
      ...this._readTsConfig()?.compilerOptions,
      ...compilerOptionsOverride,
      sourceMap: false
    }

    await this._runTsCompile(ts, compilerOptions, srcPathList)
  }

  /**
   * See: https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API
   */
  private async _runTsCompile(localTs, compilerOptions: { [K: string]: any }, srcPathList: Array<string>) {
    const { options, errors } = localTs.convertCompilerOptionsFromJson(compilerOptions, this._outputDir)

    if (errors.length) {
      let errMessage = 'tsconfig parse failed: ' + errors.map(error => error.messageText).join('. ') + '\n compilerOptions: \n' + JSON.stringify(compilerOptions, null, 4)
      Logger.error(errMessage)
    }

    let program = localTs.createProgram(srcPathList, options)
    let emitResult = program.emit()
    let allDiagnostics = localTs.getPreEmitDiagnostics(program).concat(emitResult.diagnostics)

    allDiagnostics.forEach(diagnostic => {
      if (diagnostic.file) {
        let { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start)
        let message = localTs.flattenDiagnosticMessageText(diagnostic.messageText, '\n')
        Logger.error(`${diagnostic.file.fileName} (${line + 1},${character + 1})`, message)
      } else {
        Logger.error(`${localTs.flattenDiagnosticMessageText(diagnostic.messageText, '\n')}`)
      }
    })

    if (allDiagnostics.length > 0) {
      Logger.error('TypeScript Compile Failed')
    }
  }

  private async _transformCode({ filesGlobby, transformDev }) {
    let filePaths = (await CookPaths.readFilePaths(filesGlobby)) || []
    filePaths.map(filePath => {
      let code = fsExtra.readFileSync(filePath, 'utf8')

      if (transformDev) {
        let result = babel.transformSync(code, {
          filename: path.extname(filePath),
          plugins: [],
          compact: false,
          sourceMaps: false
        })
        code = result.code
      }

      fsExtra.writeFileSync(filePath, code, 'utf8')
    })
  }

  public async compile(): Promise<void> {
    const { logLabel, compilerOptionsOverride, srcGlobby, transformOptions, before, after } = this._getWorkConfig()
    Logger.info(`${logLabel}: compiling ...`, 'cyan')

    before && (await before())
    let srcPathList: Array<string> = await CookPaths.readFilePaths(srcGlobby)
    await this._tsCompile(compilerOptionsOverride, srcPathList)
    Logger.info(`${logLabel}: compiling ...`, 'cyan')

    Logger.info(`${logLabel}: transforming ...`, 'cyan')
    await this._transformCode(transformOptions)
    after && (await after())
    Logger.info(`${logLabel}: done`, 'cyan')
  }
}
