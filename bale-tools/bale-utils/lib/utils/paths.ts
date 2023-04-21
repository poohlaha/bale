/**
 * @fileOverview Paths 类
 * @date 2023-03-09
 * @author poohlaha
 */
import path from 'node:path'
import fs from 'node:fs'
import os, { NetworkInterfaceInfo } from 'node:os'
import fsExtra from 'fs-extra'
import shell from 'shelljs'
import Utils from './utils'
import BaleLogger from './logger'

// logger
const Logger = new BaleLogger('[Bale Utils Paths]:')

class Paths {
  private readonly _DEFAULT_OUTPUT_DIR: string = 'dist'
  private readonly _args: Array<string>
  private readonly _appRootDir: string // app 根目录
  private readonly _appNodeModules: string // app node_modules

  constructor() {
    this._args = process.argv.slice(2)
    this._appRootDir = this.resolve('.')
    this._appNodeModules = this.resolve('node_modules')
  }

  /**
   * 获取 app 根目录
   * @param appRoot 目录地址
   */
  public getAppRootDir(appRoot: string = '') {
    if (Utils.isBlank(appRoot)) {
      appRoot = this._appRootDir || process.cwd() || ''
    }

    if (!fsExtra.pathExistsSync(appRoot)) {
      Logger.throw('The App Root is not exists .')
    }

    return this.replaceDoubleSlashByWindows(appRoot)
  }

  /**
   * 获取跳过版本检查
   */
  public getSkipCheckVersion(): string {
    return '--skip=checkVersion'
  }

  /**
   * 获取所有命令
   * @param suffix 前缀, 默认以 -- 开头
   */
  public getCommands(suffix: string = '--'): Array<string> {
    return this._args.filter(x => x.startsWith(suffix)) || []
  }

  /**
   * 获取 app 目录
   */
  public resolve(relativePath: string = ''): string {
    return path.resolve(fs.realpathSync(process.cwd()), relativePath)
  }

  /**
   * 获取当前目录
   */
  public resolveOwn(relativePath: string = ''): string {
    return path.resolve(__dirname, '..', relativePath)
  }

  /**
   * 获取 app package.json 数据
   */
  public getAppPackageJsonData(): { [K: string]: any } {
    const packageJsonPath = path.join(this._appRootDir, 'package.json')
    return fsExtra.pathExistsSync(packageJsonPath) ? require(packageJsonPath) || {} : {}
  }

  /**
   * 获取 app node_modules 路径
   */
  public getAppNodeModules(): string {
    return this._appNodeModules || ''
  }

  /**
   * 获取 app node_modules 中对应某人包的 package.json 数据
   */
  public getAppNodeModulesPackageJsonData(packageName: string = ''): {
    [K: string]: any
  } {
    if (Utils.isBlank(packageName)) return {}
    const packageJsonPath = path.join(this.getAppNodeModules(), packageName, 'package.json')
    return fsExtra.pathExistsSync(packageJsonPath) ? require(packageJsonPath) || {} : {}
  }

  /**
   * windows 平台替换 `\\` 为 `/`
   */
  public replaceDoubleSlashByWindows(content: string = ''): string {
    if (process.platform === 'win32') {
      content = content.replaceAll ? content.replaceAll('\\', '/') : content.replace(/\\/g, '/')
    }

    return content
  }

  /**
   * 获取路由访问路径
   */
  public getPublicUrl(publicUrl: string = ''): string {
    if (!publicUrl) return ''
    if (publicUrl === '/') {
      return '/'
    }

    if (publicUrl.trim() === '') {
      return '/'
    }

    return publicUrl.endsWith('/') ? publicUrl : publicUrl + '/'
  }

  /**
   * 获取访问地址
   * @param publicUrl 路径
   * @param port 端口, 默认为 4000
   * @param host 域名, 默认为 localhost
   */
  public getAddress(publicUrl: string = '/', port: number = 4000, host: string = 'localhost'): string {
    let protocol = 'http'
    let url = publicUrl || '/'
    if (!url.endsWith('/')) {
      url += '/'
    }
    return protocol + '://' + host + ':' + port + url
  }

  /**
   * 通过路径读取文件, 转换为 JSON 对象
   * @param relativePath
   */
  public toJsonByPath(relativePath: string = ''): object {
    try {
      if (Utils.isBlank(relativePath)) return {}
      return JSON.parse(fs.readFileSync(relativePath, 'utf-8')) || {}
    } catch (e) {
      Logger.error(`Load ${relativePath || ''} Error !`, e)
    }
    return {}
  }

  /**
   * 获取本地 IP 地址
   */
  public getLocalIP(): string {
    const interfaces = os.networkInterfaces()
    for (let inter in interfaces) {
      let int: NetworkInterfaceInfo[] = interfaces[inter] || []
      // @ts-ignore
      for (const element of int) {
        let { family, address, internal } = element
        if (family === 'IPv4' && address !== '127.0.0.1' && !internal) {
          return address
        }
      }
    }

    return ''
  }

  /**
   * 判断是否为目录
   * @param dir 目录地址
   */
  public isDir(dir: string): boolean {
    return fsExtra.lstatSync(dir).isDirectory()
  }

  /**
   * 获取目录下的所有文件
   * @param fileDir 路径
   */
  public getFileList(fileDir: string): Array<string> {
    const getList = dir => {
      const files = fsExtra.readdirSync(dir)

      files.map(filename => {
        const filePath: string = path.join(dir, filename)

        if (path.basename(filePath) === '.DS_Store') {
          return
        }

        if (this.isDir(filePath)) {
          return getList(filePath)
        }

        list.push(filePath)
      })
    }

    let list: Array<string> = []
    getList(fileDir)
    return list
  }

  public getDefaultOutputDir() {
    return this._DEFAULT_OUTPUT_DIR || ''
  }

  /**
   * get default output dir
   */
  public getOutputDir(appRootDir: string = '', output: string = ''): string {
    if (Utils.isBlank(appRootDir)) {
      appRootDir = this._appRootDir || ''
    }

    // get app root
    if (Utils.isBlank(output)) {
      output = this.getDefaultOutputDir() || ''
    }

    return path.join(appRootDir, output || '')
  }

  /**
   * 是否有 yarn
   */
  public hasYarn(): boolean {
    return shell.which('yarn')
  }

  /**
   * 安装依赖
   */
  public install() {
    shell.exec(`${this.hasYarn() ? 'yarn' : 'npm'} install`)
  }

  /**
   * 清空目录
   */
  public cleanDir(dir = '', needEnsure = true) {
    if (!dir || !fsExtra.pathExistsSync(dir)) return

    fsExtra.removeSync(dir)
    if (needEnsure) {
      fsExtra.ensureDirSync(dir)
    }
  }

  /**
   * 判断目录是否为空
   */
  public judgeDirIsEmpty(dir: string = '') {
    let hasEmpty: boolean = true

    if (!dir) return hasEmpty
    if (!fsExtra.pathExistsSync(dir)) return hasEmpty

    const dirs: Array<string> = fsExtra.readdirSync(dir) || []
    if (dirs.length === 0) return hasEmpty

    for (const d of dirs) {
      if (d === '.DS_Store') continue
      hasEmpty = false
      break
    }

    return hasEmpty
  }

  /**
   * 是否为绝对路径
   * @param url
   */
  public isAbsoluteURL(url): boolean {
    const ABSOLUTE_URL_REGEX = /^[a-zA-Z][a-zA-Z\d+\-.]*?:/
    const WINDOWS_PATH_REGEX = /^[a-zA-Z]:\\/
    const POSIX_PATH_REGEX = /^\//
    return WINDOWS_PATH_REGEX.test(url) || POSIX_PATH_REGEX.test(url) || ABSOLUTE_URL_REGEX.test(url)
  }
}

export default new Paths()
