/**
 * @fileOverview environment
 * @date 2023-03-13
 * @author poohlaha
 */
import fsExtra from 'fs-extra'
import path from 'node:path'
import toml from 'toml'
import * as _ from 'lodash'
import { Logger as BaleLogger, Utils } from '@bale-tools/utils'
import MutatePaths from './paths'
import Api from '../lib/api'
import { IApiSettingOptions } from './type'

// logger
const Logger = new BaleLogger(MutatePaths.getLoggerName())

export default class Environment {
  private readonly _appRootDir: string
  private readonly _script: string
  private readonly _mode: string
  private readonly _production: boolean
  private readonly _settings: IApiSettingOptions
  private readonly _env: { [K: string]: any }

  constructor(api: Api) {
    this._appRootDir = api.getAppRootDir() || ''
    this._script = api.getScript() || ''
    this._mode = api.getMode() || ''
    this._production = api.getProduction()
    this._settings = api.getSettings() || {}
    this._env = this._init(api)
  }

  /**
   * 初始化
   */
  private _init(api: Api): { [K: string]: any } {
    if (Utils.isBlank(this._appRootDir)) return { raw: {}, stringified: {} }
    // 获取 .env.*
    let envFilePath = this._getEnvFileByScript(this._appRootDir, this._script, this._settings.envName || '')
    if (Utils.isBlank(envFilePath)) {
      Logger.throw(`Please ensure the ${this._settings.envName || 'env'} file exists in the root directory .`)
    }

    let envOpt: { [K: string]: any } = {}
    try {
      const envStr = fsExtra.readFileSync(envFilePath, 'utf-8')
      envOpt = toml.parse(envStr) || {}
    } catch (e) {
      Logger.throw(`Failed to read the ${this._settings.envName || 'env'} file .`)
    }

    if (_.isEmpty(envOpt)) {
      return { raw: {}, stringified: {} }
    }

    const clonedOpt = _.cloneDeep(envOpt) || {}

    // use pwa
    let usePwa = MutatePaths.getBooleanValue(this._settings.usePwaPlugin, this._production)

    // router mode, default hash
    let routerMode: string = this._settings.routerMode || envOpt.ROUTER_MODE || ''
    if (Utils.isBlank(routerMode)) {
      routerMode = this._production ? MutatePaths.getRouterModes()[1] : MutatePaths.getRouterModes()[0]
    } else {
      const routerModes: Array<string> = MutatePaths.getRouterModes() || []
      if (!routerModes.includes(routerMode)) {
        routerMode = this._production ? routerModes[1] : routerModes[0]
      }
    }

    // 判断文件中是否有 PROJECT_URL 属性, 如果有则以其为主, projectUrl 次之
    const projectUrl = clonedOpt.PROJECT_URL || this._settings.projectUrl || '/' // 路径
    let projectName = projectUrl.startsWith('/') ? projectUrl.substring(1, projectUrl.length) : projectUrl
    const definePlugin = this._settings.definePlugin || {}

    const raw = {
      ...clonedOpt,
      PORT: MutatePaths.getPort(clonedOpt.PORT), // 端口
      NODE_ENV: clonedOpt.NODE_ENV || this._mode || 'development', // 环境变量
      USE_PWA: usePwa, // use pwa
      ROUTER_MODE: routerMode, // 路由 mode
      PROJECT_URL: projectUrl, // 路径
      PROJECT_NAME: projectName,
      ...definePlugin,
    }

    // 注入环境变量
    const stringified = {
      'process.env': Object.keys(raw).reduce((env, key) => {
        env[key] = JSON.stringify(raw[key])
        return env
      }, {}),
    }

    return { raw, stringified }
  }

  /**
   * get env file by script, 默认取 .env.dev
   */
  private _getEnvFileByScript(appRootDir: string = '', script: string = '', envFileName: string = ''): string {
    const envs: Array<string> = MutatePaths.getEnvs() || []
    if (Utils.isBlank(script)) {
      envFileName = envs[1] // 默认为 dev
    }

    if (!Utils.isBlank(envFileName)) {
      let envName = `.env.${envFileName}`
      let evnNamePath = path.join(appRootDir, envName)
      if (fsExtra.pathExistsSync(evnNamePath)) {
        return evnNamePath
      }
    }

    const index: number = MutatePaths.getScripts().indexOf(script)
    envFileName = index !== -1 ? envs[index] : envs[1]
    let envName: string = `.env.${envFileName}`
    let evnNamePath: string = path.join(appRootDir, envName)
    if (fsExtra.pathExistsSync(evnNamePath)) {
      return evnNamePath
    }

    return ''
  }

  public getEnv(): { [K: string]: any } {
    return this._env || {}
  }
}
