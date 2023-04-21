/**
 * @fileOverview Utils 类
 * @date 2023-03-09
 * @author poohlaha
 */
import fs from 'node:fs'
import path from 'node:path'

class Utils {
  /**
   * 检验字符串是否为空
   * @param str 要检查的值
   */
  isBlank(str: string = '') {
    return str === undefined || str == null || /^[ ]+$/.test(str) || str.length === 0
  }

  /**
   * 判断对象是否为空
   * @param target JSON对象
   */
  isObjectNull(target: { [K: string]: any } = {}) {
    return JSON.stringify(target) === '{}'
  }

  /**
   * 通过路径获取名称
   */
  getNameByPath(dir: string = '') {
    if (!dir) return ''
    if (dir.endsWith('/')) {
      dir = dir.substr(0, dir.length - 1)
    }

    if (dir.endsWith('\\')) {
      dir = dir.substr(0, dir.length - 2)
    }

    let names: Array<string> = []
    if (process.platform === 'win32') {
      names = dir.split('\\') || []
    } else {
      names = dir.split('/') || []
    }
    if (names.length === 0) return ''
    return names[names.length - 1]
  }

  /**
   * 生成随机数
   */
  generateUUID() {
    const random = () => (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1)
    return random() + random() + '-' + random() + '-' + random() + '-' + random() + '-' + random() + random() + random()
  }

  /**
   * 首字母转大写或小写
   * @param str --- 要转换的字符串
   * @param needUpperCase --- 首字母是否需要转成大写
   */
  capitalizeFirstChar(str: string = '', needUpperCase: boolean = true) {
    if (this.isBlank(str)) return ''
    let firstChar = str.substring(0, 1)
    const surplusChar = str.substring(1, str.length)
    firstChar = needUpperCase ? firstChar.toUpperCase() : firstChar.toLowerCase()
    return firstChar + surplusChar
  }

  /**
   * 休眠
   * @param ms 毫秒数
   */
  sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 创建文件夹
   * @param pathDir 目录
   */
  mkdir(pathDir: string = '') {
    if (this.isBlank(pathDir)) return
    if (!fs.existsSync(pathDir)) {
      fs.mkdirSync(pathDir)
    }
  }

  /**
   * 删除文件夹
   * @param pathDir 目录
   */
  rmdir(pathDir: string = '') {
    if (this.isBlank(pathDir)) return
    if (fs.existsSync(pathDir)) {
      const files = fs.readdirSync(pathDir)
      let childPath: string = ''
      files.forEach(child => {
        childPath = path.join(pathDir, child)
        if (fs.statSync(childPath).isDirectory()) {
          this.rmdir(childPath)
          fs.rmdirSync(childPath)
        } else {
          fs.unlinkSync(childPath)
        }
      })
    }
  }
}

export default new Utils()
