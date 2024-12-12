/**
 * @fileOverview 版本检查
 * @date 2023-03-09
 * @author poohlaha
 */
import path from 'node:path'
import fs from 'node:fs'
import os from 'node:os'
import * as inquirer from 'inquirer'
import { spawn } from 'node:child_process'
import Utils from '../utils/utils'
import Paths from '../utils/paths'
import BaleLogger from '../utils/logger'

// logger
const Logger = new BaleLogger('[Bale Version]:')

class Version {
  private readonly _appRootDir: string // app 根目录

  constructor() {
    this._appRootDir = Paths.getAppRootDir() || ''
  }

  /**
   * 获取版本号列表
   * @param packageName
   * @param done
   */
  public getVersionList(packageName: string, done: Function) {
    try {
      if (Utils.isBlank(packageName)) return []
      const command = process.platform === 'win32' ? 'npm.cmd' : 'npm'
      const versionStr = spawn(command, ['view', packageName, 'versions'])
      versionStr.stdout.on('data', (data = []) => {
        Logger.info(`versions: ${JSON.stringify(data)}`)
        try {
          let versionStdout = (data || []).toString()
          versionStdout = versionStdout.replace('\n', '')
          let versions = eval(versionStdout)
          versions = versions.sort((a, b) => a - b)
          done?.(versions || [])
        } catch (e) {
          done?.([])
        }
      })
    } catch (e) {
      Logger.error('version check error', e)
    }
  }

  /**
   * 输入
   * @param message
   * @param done
   */
  private _confirm(message: string, done: Function) {
    return inquirer
      .prompt([
        {
          type: 'expand',
          name: 'confirm',
          message,
          default: 2, // default to help in order to avoid clicking straight through
          choices: [
            { key: 'y', name: 'Yes', value: true },
            { key: 'n', name: 'No', value: false }
          ]
        }
      ])
      .then((result: any = {}) => {
        done?.(result.confirm)
      })
  }

  /**
   * 版本检查
   * @param packageName
   * @param versions
   * @param done
   */
  private _check(packageName: string, versions: Array<string> = [], done: Function) {
    try {
      if (versions.length === 0 || Utils.isBlank(packageName)) {
        done?.()
        return
      }

      const maxVersion = versions[versions.length - 1]

      // app package.json
      const appPackage = Paths.getAppPackageJsonData() || {}
      const appDevDependencies = appPackage.devDependencies || {}
      const appDependencies = appPackage.dependencies || {}
      let appPack = appDevDependencies[packageName] || appDependencies[packageName]
      appPack = appPack.replace('^', '')
      appPack = appPack.replace('~', '')

      const appNodeModulesPackage = Paths.getAppNodeModulesPackageJsonData(packageName) || {}
      let appVersion = appNodeModulesPackage.version || ''
      appVersion = appVersion.replace('^', '')
      appVersion = appVersion.replace('~', '')
      const isModuleVersion = appVersion !== maxVersion // 不等于最大版本

      // package.json中不存在包时是否添加
      if (!appPack) {
        this._confirm(`${packageName} not exists in package.json, do you want to add it ?`, isConfirm => {
          if (isConfirm) {
            appDevDependencies[packageName] = `^${maxVersion}`
            fs.writeFileSync(path.join(this._appRootDir, 'package.json'), JSON.stringify(appPackage, null, 2) + os.EOL)
            Paths.install()
          }

          done?.()
        })

        return
      }

      if (isModuleVersion) {
        this._confirm(`Do you want to update ${packageName} from ${isModuleVersion ? appVersion : appPack} to version ${maxVersion} ?`, isConfirm => {
          if (isConfirm) {
            delete appDevDependencies[packageName]
            delete appDependencies[packageName]
            appDevDependencies[packageName] = `^${maxVersion}`
            fs.writeFileSync(path.join(this._appRootDir, 'package.json'), JSON.stringify(appPackage, null, 2) + os.EOL)
            Paths.install()
          }

          done?.()
        })

        return
      }

      done?.()
    } catch (e) {
      Logger.error('检查版本错误', e)
    }
  }

  /**
   * 运行
   * @param packageName
   * @param done
   */
  public run(packageName: string, done: Function) {
    // 不跳过
    if (!Paths.getCommands().includes(Paths.getSkipCheckVersion())) {
      this.getVersionList(packageName, versions => {
        Logger.info(`versions: ${JSON.stringify(versions)}`)
        this._check(packageName, versions, done)
      })
    } else {
      Logger.info('Skip check version !', 'yellowBright')
      done?.()
    }
  }

  /**
   * 更新
   * @param packageName 包名
   * @param packageVersion 版本
   * @param isGlobal 是否全局安装
   * @param done 完成后的回调函数
   */
  public update(packageName: string, packageVersion: string, isGlobal: boolean = false, done?: Function) {
    let commandList = Paths.getCommandList() || []
    let needUpdate = false
    for (let command of commandList) {
      let _command = (command || '').trim()
      if (_command === '-u' || _command === '--update') {
        needUpdate = true
      }
    }

    if (!needUpdate) {
      done?.(false)
      return
    }

    this.getVersionList(packageName, versions => {
      Logger.info(`versions: ${JSON.stringify(versions)}`)
      if (versions.length === 0 || Utils.isBlank(packageName)) {
        Logger.info(`no need to update ${packageName} !`)
        done?.(true)
        return
      }

      const maxVersion = versions[versions.length - 1]
      const version = packageVersion || ''
      if (version !== maxVersion) {
        // 安装
        Logger.info(`install ${packageName} version: ${maxVersion}`)
        Paths.installPackage(packageName, maxVersion, isGlobal)
        Logger.info(`update ${packageName} from ${version} to ${maxVersion} successfully !`)
      } else {
        Logger.info(`no need to update ${packageName} !`)
      }

      done?.(true)
    })
  }
}

export default new Version()
