#!/usr/bin/env node

/**
 * @fileOverview 编译单个文件, 通过命令调用
 * @date 2023-03-09
 * @author poohlaha
 */

import chalk from 'chalk'
import fsExtra from 'fs-extra'
import help from '../lib/cock/utils/help'
import CockCompiler from '../lib/cock/index'
import * as packageJson from '../package.json'
import { Logger as BaleLogger, Paths, Utils, Version } from '@bale-tools/utils'

// logger
const Logger = new BaleLogger('[Bale Rollup Compiler]:')

// 当Promise 被 reject 且没有 reject 处理器的时候，会触发 unhandledrejection 事件
process.on('unhandledRejection', err => {
  Logger.error('UnhandledRejection Error!', err)
})

export default class CockService {
  private readonly _appRootDir: string
  constructor() {
    this._appRootDir = Paths.getAppRootDir()
    Version.run(packageJson.name, this.build.bind(this))
  }

  private _getProps(appRootDir: string = ''): { [K: string]: any } {
    const commander = help() || {}

    // entry, 如果为空默认获取 src/index.js | src/index.ts | src/main.js | src.main.ts
    const entry = commander.entry || ''
    if (Utils.isBlank(entry)) {
      Logger.error('Please enter the correct entry path .')
    }

    const output: string = Paths.getOutputDir(appRootDir, commander.output || '')
    const mode: string = commander.mode || 'commonjs'

    return { entry, output, mode, format: commander.format || '' }
  }

  public build() {
    const { entry, output, mode, format } = this._getProps(this._appRootDir) || {}
    Logger.info(`Begin to build file: ${chalk.cyan(entry)} .`)

    // 删除和清空输出目录
    if (fsExtra.pathExistsSync(output)) {
      fsExtra.removeSync(output)
      fsExtra.ensureDir(output)
    }

    return CockCompiler('', {
      mode,
      entry,
      outputDir: output,
      rollupSettings: {
        formats: format
      },
      tsSettings: {
        useDeclaration: false
      },
      done: () => {
        Logger.info('End to build file .')
      }
    })
  }
}
