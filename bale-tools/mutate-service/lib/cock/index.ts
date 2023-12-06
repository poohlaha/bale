/**
 * @fileOverview exports
 * @date 2023-03-10
 * @author poohlaha
 */
import * as _ from 'lodash'
import fsExtra from 'fs-extra'
import chalk from 'chalk'
import path from 'path'
import CookPaths from './utils/paths'
import CompileTs from './project/compile-ts'
import CompileJs from './module/compile-js'
import CompileStyle from './module/compile-style'
import CompileVue from './module/compile-vue'
import Rollup from '../rollup'
import { ICookCompilerOptions, ICompileTsOptions } from './utils/type'
import { IRollupOptions } from '../rollup/types'
import { Logger as BaleLogger, Utils, Paths, ThreadPool } from '@bale-tools/utils'
import shell from 'shelljs/shell'

// logger
const Logger = new BaleLogger(CookPaths.getLoggerName())

class CookCompile {
  private readonly _types: Array<string> = ['js', 'ts', 'style', 'vue'] // this._types = ['js', 'ts', 'style', 'vue']
  private readonly _opts: ICookCompilerOptions
  private readonly _mode: 'commonjs' | 'ES2015'
  private readonly _appRootDir: string
  private readonly _outputDir: string
  private readonly _type: string
  private readonly _excludes: Array<string>
  private readonly _rollupSettings: IRollupOptions
  private readonly _tsSettings: ICompileTsOptions | {}
  private readonly _poolSize: number
  private readonly _done: Function | null

  constructor(type: string = '', opts: ICookCompilerOptions) {
    this._opts = _.cloneDeep(opts) || {}
    this._mode = this._opts.mode || 'commonjs'
    this._appRootDir = Paths.getAppRootDir(this._opts.rootDir)
    this._outputDir = this._opts.outputDir || Paths.getOutputDir(this._appRootDir, '') || '' // output
    this._type = this._getCompileType(type || '')
    this._excludes = this._getExcludes(this._opts.excludes || []) || []
    this._rollupSettings = this._opts.rollupSettings || {}
    this._tsSettings = this._opts.tsSettings || {}
    this._poolSize = 5
    this._done = this._opts.done || null
  }

  /**
   * get compile type
   */
  private _getCompileType(type: string = ''): string {
    if (!Utils.isBlank(type) && this._types.includes(type)) return type
    if (path.extname(this._opts.entry)) return ''

    // ts project
    const noTsList = this._judgeIsTsProject(path.join(this._appRootDir, this._opts.entry))
    if (noTsList.length === 0) return this._types[1]
    return ''
  }

  private _getExcludes(excludes: Array<string> = []): Array<string> {
    const defaultExcludes = ['node_modules']
    if (!excludes || excludes.length === 0) return defaultExcludes
    return Array.from(new Set(excludes.concat(defaultExcludes))) // 去重
  }

  private _judgeIsTsProject(projectPath: string = ''): Array<string> {
    if (!fsExtra.pathExistsSync(projectPath)) return []

    // const excludes: Array<string> = ['node_modules', 'package.json', 'tsconfig.json', path.basename(this._outputDir)]
    const fileList: Array<string> = Paths.getFileList(projectPath) || []

    let list: Array<string> = []
    for (let file of fileList) {
      const filename = path.basename(file) || ''

      // 排除 .tsx, .ts 文件
      if (!CookPaths.isTs(filename)) {
        if (CookPaths.isTs(filename)) {
          list.push(filename)
        }
      }
    }

    return list
  }

  /**
   * compile ts
   */
  private async _compileTsWithProject(done: Function): Promise<void> {
    // 判断根目录下是否有 .swcrc 文件
    let swcrcFile = path.resolve(this._appRootDir, '.swcrc')
    if (fsExtra.pathExistsSync(swcrcFile)) {
      Logger.info('Use swc to compile ts project ...')
      fsExtra.removeSync(this._outputDir)
      shell.exec(`swc ${this._opts.entry} -d ${this._outputDir}`)
      Logger.info('Compile ts project Successfully !')
      return done?.()
    } else {
      return await new CompileTs({
        mode: this._opts.mode,
        appRootDir: this._appRootDir,
        outputDir: this._outputDir,
        excludes: this._excludes || [],
        ...this._tsSettings,
        done,
      }).compile()
    }
  }

  /**
   * compile js
   */

  private async _compileWithJs(filePath: string = ''): Promise<void> {
    return await new CompileJs({
      mode: this._mode,
      appRootDir: this._appRootDir,
      filePath,
    }).compile()
  }

  /**
   * compile vue
   */
  private async _compileWithVue(filePath: string = ''): Promise<void> {
    return await new CompileVue({
      appRootDir: this._appRootDir,
      mode: this._mode,
      filePath,
    }).compile()
  }

  /**
   * compile style
   */
  private async _compileWithStyle(filePath: string = ''): Promise<void> {
    return await new CompileStyle({
      filePath,
      appRootDir: this._appRootDir,
    }).compile()
  }

  /**
   * compile file
   */
  private async _compileFile(filePath: string = ''): Promise<void> {
    // vue
    if (CookPaths.isVue(filePath)) {
      return this._compileWithVue(filePath)
    }

    if (CookPaths.isScript(filePath)) {
      return this._compileWithJs(filePath)
    }

    if (CookPaths.isStyle(filePath)) {
      return this._compileWithStyle(filePath)
    }

    if (CookPaths.isAsset(filePath) || CookPaths.isOther(filePath)) {
      return Promise.resolve()
    }

    // 其他的删除
    return fsExtra.removeSync(filePath)
  }

  /**
   * rollup
   */
  private async _rollup(rollupSettings: IRollupOptions = {}): Promise<void> {
    let input: string = this._rollupSettings.input || ''
    if (!_.isNil(input)) {
      const extname = path.extname(input)
      if (['.less', '.sass', '.css'].includes(extname)) {
        return
      }

      rollupSettings.input = input.replace(extname, '.js')
    }

    const packageJsonPath: string = path.join(this._appRootDir, 'package.json')
    // 没有 package.json 直接 return 掉
    if (!fsExtra.pathExistsSync(packageJsonPath)) {
      Logger.info('There are no `package.json` under the root dir .')
      this._done?.()
      return
    }

    // copy package.json to output dir
    fsExtra.copyFileSync(packageJsonPath, path.join(this._outputDir, 'package.json'))
    return await new Rollup({
      ...(rollupSettings || {}),
      appRootDir: this._outputDir || '',
      done: () => {
        // 删除 package.json
        fsExtra.removeSync(path.join(this._outputDir, 'package.json'))
        this._done?.()
      },
    }).compile()
  }

  /**
   * compile
   */
  public async compile(): Promise<void> {
    try {
      Logger.info('Begin to compiling ... ')
      // ts 项目直接编译
      if (this._type === this._types[1]) {
        return await this._compileTsWithProject(async () => {
          if (!Utils.isObjectNull(this._rollupSettings)) {
            await this._rollup(this._rollupSettings)
          } else {
            this._done?.()
          }
          Logger.info('End to Compile File .')
        })
      }

      let fileList: Array<string> = []
      const entryPath: string = path.join(this._appRootDir, this._opts.entry)
      if (Paths.isDir(entryPath)) {
        // 如果是目录
        fsExtra.removeSync(this._outputDir) // 删除输出目录
        fsExtra.ensureDirSync(this._outputDir) // 清空输出目录
        fsExtra.copySync(entryPath, this._outputDir) // 拷贝到输出目录
        fileList = Paths.getFileList(this._outputDir) || []
        if (fileList.length === 0) {
          Logger.info(`目录: ${chalk.cyan(this._appRootDir)} 下没有需要编译的文件!`)
          return
        }
      } else {
        // 单个文件
        if (!fsExtra.pathExistsSync(entryPath)) {
          Logger.info(`文件: ${chalk.cyan(this._opts.entry)} 不存在!`)
          return
        }

        // 拷贝到输出目录
        const basename: string = path.basename(this._opts.entry)
        const entryOutputPath: string = path.join(this._outputDir, basename)
        if (!fsExtra.pathExistsSync(this._outputDir)) {
          fsExtra.ensureDirSync(this._outputDir)
        } else {
          fsExtra.ensureFileSync(entryOutputPath)
        }

        fsExtra.copyFileSync(entryPath, entryOutputPath)
        fileList = [entryOutputPath]
      }

      // 只有一个文件
      if (fileList.length === 1) {
        const outputFile: string = fileList[0]
        await this._compileFile(outputFile)
        await this._rollup({
          ...this._rollupSettings,
          input: outputFile,
        })
        Logger.info('End to Compile File .')
        return
      }

      // pool tasks
      let tasks: Array<any> = []
      for (let filePath of fileList) {
        if (Paths.isDir(filePath)) continue
        tasks.push({
          task: () => this._compileFile(filePath),
          callback: this._opts.callback,
        })
      }

      const done = async (): Promise<void> => {
        await this._rollup(this._rollupSettings)
        Logger.info('Done .')
      }

      // 启动多线程打包
      const threadPool = new ThreadPool(this._poolSize, true, done)
      await threadPool.addTasks(tasks)
    } catch (e) {
      Logger.error('Compiler Failed', e)
    }
  }
}

export default (type: string = '', opts: ICookCompilerOptions) => {
  return new CookCompile(type, opts).compile()
}
