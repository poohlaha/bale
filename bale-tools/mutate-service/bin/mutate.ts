#!/usr/bin/env node

/**
 * @fileOverview 编译单个项目, 通过命令调用
 * @date 2023-03-13
 * @author poohlaha
 */
import chalk from 'chalk'
import * as packageJson from '../package.json'
import WebpackCompiler from '../lib/webpack'
import MutatePaths from '../lib/webpack/utils/paths'
import help from '../lib/webpack/utils/help'
import { Logger as BaleLogger, Utils, Paths, Version } from '@bale-tools/utils'

// logger
const Logger = new BaleLogger(MutatePaths.getLoggerName())

// 当Promise 被 reject 且没有 reject 处理器的时候，会触发 unhandledrejection 事件
process.on('unhandledRejection', err => {
  Logger.error('UnhandledRejection Error!')
})

class MutateService {
  constructor() {
    const commander: { [K: string]: any } = help() || {}
    if (commander.script === MutatePaths.getScripts()[0]) {
      Version.run(packageJson.name, this._build.bind(this))
    } else {
      this._build()
    }
  }

  private _getProps(appRootDir: string = '', commander: { [K: string]: any } = {}): { [K: string]: any } {
    const scripts: Array<string> = MutatePaths.getScripts() || []
    // script, 默认为 build
    let script = commander.script || scripts[1]
    if (!scripts.includes(script)) {
      // 如果不存在环境, 默认使用 build
      script = scripts[1] // build
    }

    // mode, 默认为 development
    let mode = MutatePaths.getMode(script, commander.env || '')

    // entry, 如果为空默认获取 src/index.js | src/index.ts | src/main.js | src.main.ts
    const entry = MutatePaths.getDefaultEntryFile(appRootDir, commander.entry || '') || ''
    if (Utils.isBlank(entry)) {
      Logger.throw(`Please enter the correct entry path, current is: ${commander.entry || ''}`)
    }

    let output: string = commander.output || ''
    if (Utils.isBlank(output)) {
      output = MutatePaths.getOutputDir(appRootDir, script)
    }

    return {
      script,
      mode,
      entry,
      output,
      projectUrl: commander.url || '/',
      port: MutatePaths.getPort(commander.port),
    }
  }

  private _build() {
    const appRootDir = Paths.getAppRootDir() || ''

    const { script, mode, entry, output, projectUrl, port } = this._getProps(appRootDir) || {}
    Logger.info(`Current Environment is ${chalk.cyan(script)} .`)

    WebpackCompiler({
      script,
      opts: {
        mode,
        entry,
        output,
        settings: {
          port,
          projectUrl,
        },
      },
    })
  }
}

export default new MutateService()
