/**
 * @fileOverview webpack dev server
 * @date 2023-03-13
 * @author poohlaha
 */
import fsExtra from 'fs-extra'
import path from 'node:path'
import MutatePaths from '../utils/paths'
import * as _ from 'lodash'
import { Paths } from '@bale-tools/utils'
import Api from './api'

export default class DevServer {
  private readonly _api: Api
  private readonly _port: number
  private readonly _proxy: object
  private readonly _opt: object

  constructor(api: Api, port = 4000, proxy = {}) {
    this._api = api || {}
    this._port = port || 4000
    this._proxy = proxy || {}
    this._opt = this._init()
  }

  private _init(): object {
    const appRoot = this._api.getAppRootDir() || ''
    const publicDir = this._api.getSettings().publicDir || 'public'
    const projectUrl = this._api.getPublicPath() || '/'
    const proxy: object = this._getProxy(appRoot, this._proxy) || {}
    return {
      host: '0.0.0.0',
      allowedHosts: 'all',
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': '*',
        'Access-Control-Allow-Headers': '*',
      },
      compress: true, // Enable gzip compression of generated files.
      static: {
        directory: this._resolve(publicDir),
        publicPath: [projectUrl || '/'],
        watch: {
          ignored: this._ignoredFiles(this._resolve('src')),
        },
      },
      hot: true,
      client: {
        logging: 'info',
        progress: true,
        overlay: {
          errors: true,
          warnings: false,
        },
      },
      historyApiFallback: {
        disableDotRule: true,
        index: projectUrl || '/',
      },
      port: this._port,
      proxy, // 代理, 在proxy.json中配置
      open: false,
    }
  }

  private _resolve(dir) {
    return path.join(__dirname, dir)
  }

  private _escapeStringRegexp(str: string = '') {
    // Escape characters with special meaning either inside or outside character sets.
    // Use a simple backslash escape when it’s always valid, and a `\xnn` escape when the simpler form would be disallowed by Unicode patterns’ stricter grammar.
    return str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&').replace(/-/g, '\\x2d')
  }

  private _ignoredFiles(appSrc) {
    return new RegExp(`^(?!${this._escapeStringRegexp(path.normalize(appSrc + '/').replace(/[\\]+/g, '/'))}).+/node_modules/`, 'g')
  }

  private _getProxy(appRoot: string = '', proxy: object = {}): object {
    let proxys: {[K: string]: any} = {}
    if (_.isEmpty(proxy) || !proxy) {
      proxys = { ...proxys, ...proxy }
      appRoot = Paths.getAppRootDir(appRoot)
      const proxySetup = path.join(appRoot, MutatePaths.getProxySetup() || '')
      if (fsExtra.pathExistsSync(proxySetup)) {
        let _proxy = require(proxySetup) || {}
        proxys = { ...proxys, ..._proxy }
      }
    }

    return proxys || {}
  }

  public getOpts(): object {
    return this._opt || {}
  }
}
