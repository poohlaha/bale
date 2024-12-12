/**
 * @fileOverview Git Tools
 * @date 2023-03-09
 * @author poohlaha
 */
import chalk from 'chalk'
import BaleLogger from '../utils/logger'
import * as childProcess from 'node:child_process'

// logger
const Logger = new BaleLogger('[Bale Git Tool]:')

/**
 * Existing folder:
 * cd existing_folder
 * git init
 * git remote add origin xxx
 * git branch -m 'xxx'
 * git add .
 * git commit -m 'xxx'
 * git push -u origin master/develop
 */
export default class GitTools {
  private readonly _cwd: any = null
  private readonly _address: string = ''
  private readonly _branch: string = ''
  private readonly _remark: string = ''

  /**
   * 构造函数
   * @param {String} cwd 工作目录
   * @param {String} address 地址
   * @param {String} branch 分支
   * @param {String} remark 备注
   * */
  constructor(cwd, address, branch, remark) {
    this._cwd = cwd || ''
    this._address = address || ''
    this._branch = branch || ''
    this._remark = remark || ''
  }

  /**
   * git init
   */
  private async _init(): Promise<any> {
    return await this._startChildProcess('git', ['init'])
  }

  /**
   * git remote add origin xxx
   */
  private async _remote(): Promise<any> {
    return await this._startChildProcess('git', ['remote', 'add', 'origin', this._address])
  }

  /**
   * git branch -m 'xxx'
   */
  private async _remoteBranch(): Promise<any> {
    return await this._startChildProcess('git', ['branch', '-m', this._branch])
  }

  /**
   * git add
   * */
  private async _add(): Promise<any> {
    return await this._startChildProcess('git', ['add', '.'])
  }

  /**
   * git commit
   * */
  private async _commit(): Promise<any> {
    return await this._startChildProcess('git', ['commit', '-m', this._remark])
  }

  /**
   * git push
   * */
  private async _push(): Promise<any> {
    return await this._startChildProcess('git', ['push', 'origin', this._branch])
  }

  /**
   * git checkout
   * */
  private async _checkout(): Promise<any> {
    return await this._startChildProcess('git', ['checkout', this._branch])
  }

  /**
   * git clone
   */
  private async _clone(): Promise<any> {
    return await this._startChildProcess('git', ['clone', '-b', this._branch, this._address])
  }

  /**
   * git pull
   * */
  private async _pull(): Promise<any> {
    return await this._startChildProcess('git', ['pull', 'origin', this._branch])
  }

  /**
   * git status
   * @return {Boolean} 是否存在修改
   * */
  private async _status(): Promise<any> {
    try {
      return await this._startChildProcess('git', ['status', '-s'])
    } catch (err: any) {
      Logger.error('获取 git 状态失败: ', err)
    }

    return false
  }

  /**
   * 开启子进程
   * @param {String} command  命令 (git/node...)
   * @param {Array} params 参数
   * */
  private _startChildProcess(command, params): Promise<any> {
    return new Promise((resolve, reject) => {
      let process = childProcess.spawn(command, params, {
        cwd: this._cwd
      })

      let logMessage = `${command} ${params[0]}`
      let cmdMessage = ''

      process.stdout.on('data', data => {
        if (!data) {
          reject(chalk.red(`${logMessage} error: ${data}`))
        } else {
          cmdMessage = data.toString()
        }
      })

      process.on('close', data => {
        if (data) {
          reject(chalk.red(`${logMessage} error: ${data}`))
        } else {
          Logger.info(`${logMessage} success !`)
          resolve(cmdMessage)
        }
      })
    })
  }

  /**
   * 上传到git
   */
  protected async upload(): Promise<void> {
    try {
      // 1. git init
      await this._init()

      // 2. git remote add origin xxx
      await this._remote()

      // 3. git branch -m 'xxx'
      await this._remoteBranch()

      // 4. git add .
      await this._add()

      // 5. git commit -m remark
      await this._commit()

      // 6. git push -u origin branch
      await this._push()

      Logger.info(chalk.green('上传到 git 成功!'))
    } catch (e: any) {
      Logger.error(chalk.red('上传到 git 失败!'), e)
    }
  }

  /**
   * 自动上传
   * */
  protected async autoUpload(): Promise<void> {
    try {
      // git checkout branch
      await this._checkout()

      // git pull branch
      await this._pull()

      // git add .
      await this._add()

      // git status -s
      let isChange = await this._status()

      if (isChange) {
        // git commit -m remark
        await this._commit()

        // git push branch
        await this._push()
      }

      Logger.info(chalk.green('上传到 git 成功!'))
    } catch (err: any) {
      Logger.error(chalk.red('自动上传到 git 失败!'), err)
    }
  }
}
