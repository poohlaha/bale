/**
 * @fileOverview Git Operation
 * @date 2023-03-09
 * @author poohlaha
 */
import chalk from 'chalk'
import path from 'node:path'
import shell from 'shelljs'
import fsExtra from 'fs-extra'
import BaleLogger from '../utils/logger'
import Utils from '../utils/utils'
import Paths from '../utils/paths'

// logger
const Logger = new BaleLogger('[Bale Git Tool]:')

export default class Git {
  private readonly _DEFAULT_CACHE_DIR = '.cache'
  private readonly _branch: string = ''
  private readonly _appDir: string = ''
  private readonly _cacheDir: string = ''
  private _cacheProjectDir: string = ''

  constructor(isProduction: boolean = false, cacheDir: string = '') {
    this._branch = isProduction ? 'master' : 'dev' // 分支
    this._appDir = Paths.getAppRootDir() || '' // 根目录
    this._cacheDir = cacheDir || path.join(this._appDir, this._DEFAULT_CACHE_DIR) // 缓存目录
  }

  /**
   * 拉取多个项目
   * @param projectList
   * [{
   *   name: String, // 名称
   *   url: String, // git 地址
   *   branch: String, // 分支名称
   * }]
   */
  public async pullProjectList(projectList: Array<{ [K: string]: string }> = []): Promise<void> {
    if (projectList.length === 0) return
    try {
      if (!fsExtra.pathExistsSync(this._cacheDir)) {
        fsExtra.ensureDirSync(this._cacheDir)
      }

      if (!shell.which('git')) {
        Logger.error('Sorry, this script requires git !')
        shell.exit(1)
        return
      }

      for (let project of projectList) {
        await this._pull(project)
      }

      Logger.info('批量拉取 git 代码成功 !')
    } catch (e) {
      Logger.error('拉取 git 代码失败', e)
    }
  }

  /**
   * 拉取项目
   * @param project
   * {
   *   name: String, // 名称
   *   url: String, // git 地址
   *   branch: String, // 分支名称
   * }
   */
  public async pullProject(project: { [K: string]: string } = {}): Promise<void> {
    if (!project.url) return

    try {
      if (!fsExtra.pathExistsSync(this._cacheDir)) {
        fsExtra.ensureDirSync(this._cacheDir)
      }

      if (!shell.which('git')) {
        Logger.error('Sorry, this script requires git !')
        shell.exit(1)
        return
      }

      await this._pull(project)
      Logger.info('拉取 git 代码成功 !')
    } catch (e) {
      Logger.error('拉取 git 代码失败', e)
    }
  }

  /**
   * 拉取代码
   * @param project
   */
  private async _pull(project: { [K: string]: string } = {}): Promise<void> {
    if (Utils.isBlank(project.url)) {
      Logger.error('Git url is null.')
    }

    let projectName = project.name || ''
    if (Utils.isBlank(projectName)) {
      const basename: string = path.basename(project.url) || ''
      const extname = path.extname(basename)
      projectName = basename.replace(extname, '') || ''
    }

    let branch = project.branch || ''
    if (Utils.isBlank(branch)) {
      branch = this._branch
      Logger.info('Git branch is null, use default branch.')
    }

    this._cacheProjectDir = path.join(this._cacheDir, projectName) || ''
    const command = `git clone -b ${branch} ${project.url}`
    Logger.info(`${chalk.cyan(`正在从 Git 上拉取项目 ${chalk.magenta(projectName || '')} ...`)}`)
    shell.cd(this._cacheDir)
    shell.exec(command)
    shell.cd(this._appDir)
    await Utils.sleep(500)
  }

  /**
   * 获取缓存目录
   */
  public getCacheDir(): string {
    return this._cacheDir || ''
  }

  /**
   * 获取缓存下的项目目录
   */
  public getCacheProjectDir(): string {
    return this._cacheProjectDir || ''
  }
}
