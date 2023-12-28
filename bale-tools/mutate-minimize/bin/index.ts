#!/usr/bin/env node

/**
 * @fileOverview 编译单个文件, 通过命令调用
 * @date 2023-03-09
 * @author poohlaha
 */

import chalk from 'chalk'
import help from './help'
import Minimize from '../lib/index'
import * as packageJson from '../package.json'
import { Logger as BaleLogger, Paths, Utils, Version } from '@bale-tools/utils'

// logger
const Logger = new BaleLogger('[Bale Mutate Minimize]:')

// 当Promise 被 reject 且没有 reject 处理器的时候，会触发 unhandledrejection 事件
process.on('unhandledRejection', err => {
  Logger.error('UnhandledRejection Error!', err)
})

class MinimizeService {
  private readonly _appRootDir: string
  constructor() {
    this._appRootDir = Paths.getAppRootDir()
    this.build()
  }

  private _getProps(appRootDir: string = ''): { [K: string]: any } {
    const commander = help() || {}

    // entry
    const entry = commander.entry || ''
    if (Utils.isBlank(entry)) {
      Logger.error('Please enter the correct entry path .')
      return { entry: '' }
    }

    return { entry }
  }

  public build() {
    const { entry } = this._getProps(this._appRootDir) || {}
    Logger.info(`Begin to build file: ${chalk.cyan(entry)} .`)
    if (Utils.isBlank(entry)) {
      return
    }

    return Minimize(entry, [])
  }
}

new MinimizeService()
