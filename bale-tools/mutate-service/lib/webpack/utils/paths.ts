/**
 * @fileOverview paths
 * @date 2023-03-13
 * @author poohlaha
 */
import fsExtra from 'fs-extra'
import path from 'node:path'
import * as _ from 'lodash'
import { Utils, Paths as BalePaths } from '@bale-tools/utils'

class Paths {
  private readonly _MODES = ['development', 'production'] // webpack mode
  private readonly _ROUTER_MODES = ['hash', 'history'] // webpack mode
  private readonly _OUTPUTS = ['build', 'dist'] // 定义输出目录, 默认为 build
  private readonly _SCRIPTS = ['start', 'build', 'simulate', 'prod'] // 定义四套环境, 如果不在四套环境内, 默认为 build
  private readonly _ENVS = ['local', 'dev', 'simulate', 'prod'] // 定义四套环境变量文件, 对应上面的四套环境, 默认这 dev
  private readonly _DEFAULT_PORT = 4000 // 默认端口
  private readonly _REPORT_NAME = 'report.html' // report name
  private readonly _PROXY_SETUP = path.join('scripts', 'proxy.json')
  private readonly _STATIC_DIR: string = 'static'
  private readonly _VENDOR_DIR: string = 'vendor'

  /**
   * env, 对应读取根目录 `.env.xxx` 文件
   */
  public getMode(script, mode = '') {
    // 如果为空, 根据 script 判断 env
    if (Utils.isBlank(mode)) {
      // simulate, prod 为 production
      mode = script === this._SCRIPTS[2] || script === this._SCRIPTS[3] ? this._MODES[1] : this._MODES[0]
    } else {
      if (!this._MODES.includes(mode)) {
        mode = this._MODES[0] // development
      }
    }

    return mode
  }

  /**
   * 获取 entry 文件
   * 如果为空, 默认获取 src/index.js | src/index.ts | src/main.js | src.main.ts
   */
  public getDefaultEntryFile(appRootDir: string = '', entry: string = ''): string {
    // get app root
    appRootDir = BalePaths.getAppRootDir(appRootDir) || ''

    // get entry
    const getDefaultEntry = (): string => {
      const srcIndexJs: string = path.join(appRootDir, 'src', 'index.js')
      const srcIndexTs: string = path.join(appRootDir, 'src', 'index.ts')
      const srcMainJs: string = path.join(appRootDir, 'src', 'main.js')
      const srcMainTs: string = path.join(appRootDir, 'src', 'main.ts')
      if (fsExtra.pathExistsSync(srcIndexJs)) {
        return './src/index.js'
      }

      if (fsExtra.pathExistsSync(srcIndexTs)) {
        return './src/index.ts'
      }

      if (fsExtra.pathExistsSync(srcMainJs)) {
        return './src/main.js'
      }

      if (fsExtra.pathExistsSync(srcMainTs)) {
        return './src/main.ts'
      }

      return ''
    }

    if (!Utils.isBlank(entry)) {
      if (fsExtra.pathExistsSync(path.join(appRootDir, entry))) {
        return path.join(appRootDir, entry) || ''
      }
    }

    return getDefaultEntry() || ''
  }

  /**
   * 根据环境获取输出目录, 默认为 build
   */
  public getOutputDir(appRootDir: string = '', script: string = ''): string {
    // get app root
    appRootDir = BalePaths.getAppRootDir(appRootDir)

    let output = this._OUTPUTS[0]
    if (this._SCRIPTS.includes(script)) {
      if (script === this._SCRIPTS[2] || script === this._SCRIPTS[3]) {
        output = this._OUTPUTS[1] || ''
      }
    }

    return path.join(appRootDir, output)
  }

  /**
   * 获取端口号
   */
  public getPort(port: number | string = 0): number {
    // start 时才设置端口
    if (port === 0 || (typeof port === 'string' && parseInt(port) === 0)) {
      return this._DEFAULT_PORT
    }

    if (typeof port === 'string') {
      port = parseInt(port)
    }

    return port || this._DEFAULT_PORT
  }

  /**
   * commands
   */
  public getCommands(): { [K: string]: string } {
    return {
      script: '--script',
      entry: '--entry',
      output: '--output',
      env: '--env',
      url: '--url',
      port: '--port',
    }
  }

  /**
   * env scripts
   */
  public getScripts(): Array<string> {
    return this._SCRIPTS || []
  }

  /**
   * router mode
   */
  public getRouterModes(): Array<string> {
    return this._ROUTER_MODES || []
  }

  /**
   * proxy
   */
  public getProxySetup(): string {
    return this._PROXY_SETUP || ''
  }

  /**
   * envs
   */
  public getEnvs(): Array<string> {
    return this._ENVS || []
  }

  /**
   * report name
   */
  public getReportName(): string {
    return this._REPORT_NAME || ''
  }

  // logger name
  public getLoggerName(): string {
    return '[Bale Mutate Service]:'
  }

  /**
   * boolean value
   */
  public getBooleanValue(value: boolean | undefined, defaultValue: boolean = false): boolean {
    let v: boolean = false
    if (_.isNil(value)) {
      v = defaultValue
    } else if (typeof value === 'boolean') {
      v = value
    }
    return v
  }

  /**
   * static dir
   */
  public getStaticDir(): string {
    return this._STATIC_DIR || ''
  }

  /**
   * vendor dir
   */
  public getVendorDir(): string {
    return this._VENDOR_DIR || ''
  }

  /**
   * webpack mode
   */
  public getModes(): Array<string> {
    return this._MODES || []
  }
}

export default new Paths()
