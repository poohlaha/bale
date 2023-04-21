import CryptoJS from 'crypto-js'

const Utils = {
  /**
   * 从localStorage中设置值
   */
  setLocal: (name: string, item: any, needExpTime = false) => {
    if (!item || (Array.isArray(item) && item.length === 0)) {
      window.localStorage.setItem(name, '')
      return
    }

    let data: any = null
    if (needExpTime) {
      data = {
        data: item,
        time: new Date().getTime()
      }
    } else {
      data = item
    }

    if (typeof data !== 'string') data = JSON.stringify(data)

    window.localStorage.setItem(name, Utils.encrypt(data))
  },

  /**
   * 从localStorage中获取值
   */
  getLocal: (name: string, needExpTime = false) => {
    const item = window.localStorage.getItem(name)
    if (!item) return null

    const data = Utils.decrypt(item)
    if (needExpTime) {
      return JSON.parse(data)
    }

    return Utils.isStringObject(data) ? JSON.parse(data) : data
  },

  /**
   * 从localStorage中移除token
   */
  removeLocal: (name: string) => {
    window.localStorage.removeItem(name)
  },

  /**
   * 从sessionStorage中设置值
   */
  setSession: (name: string, item: any, needExpTime = false) => {
    if (!item) return

    if (needExpTime) {
      let data: string = JSON.stringify({
        data: item,
        time: new Date().getTime(),
      })

      window.sessionStorage.setItem(name, Utils.encrypt(data))
      return
    }

    window.sessionStorage.setItem(name, typeof item !== 'string' ? Utils.encrypt(JSON.stringify(item)) : Utils.encrypt(item))
  },

  /**
   * 从sessionStorage中获取值
   */
  getSession: (name: string, needExpTime: boolean = false) => {
    const item = window.sessionStorage.getItem(name)
    if (!item) return null
    if (!needExpTime) return Utils.decrypt(item)
    return item ? JSON.parse(Utils.decrypt(item)) : Utils.decrypt(item)
  },

  /**
   * 从sessionStorage中移除值
   */
  removeSession: (name: string) => {
    window.sessionStorage.removeItem(name)
  },

  /**
   * 从localStorage移除所有数据
   */
  clearLocalStorage: () => {
    window.localStorage.clear()
  },

  /**
   * 从sessionStorage移除所有数据
   */
  clearSessionStorage: () => {
    window.sessionStorage.clear()
  },

  /**
   * 生成随机数
   */
  generateUUID: () => {
    let random = function () {
      return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1)
    }

    return random() + random() + '-' + random() + '-' + random() + '-' + random() + '-' + random() + random() + random()
  },

  /**
   * 加密
   */
  encrypt: (str: any): string => {
    if (!str) return ''
    return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(str))
  },

  /**
   * 解密
   */
  decrypt: (str: any): string => {
    if (!str) return ''
    return CryptoJS.enc.Base64.parse(str).toString(CryptoJS.enc.Utf8)
  },

  /**
   * 格式化日期
   * @param date
   * @param format
   */
  formatDateStr: (date: any, format: string = 'yyyy-MM-dd') => {
    if (!date) return ''

    switch (typeof date) {
      case 'string':
        date = new Date(date.replace(/-/, '/'))
        break
      case 'number':
        date = new Date(date)
        break
    }
    // @ts-ignore
    if (!(date instanceof Date)) return
    let dict = {
      yyyy: date.getFullYear(),
      M: date.getMonth() + 1,
      d: date.getDate(),
      H: date.getHours(),
      m: date.getMinutes(),
      s: date.getSeconds(),
      MM: ('' + (date.getMonth() + 101)).substr(1),
      dd: ('' + (date.getDate() + 100)).substr(1),
      HH: ('' + (date.getHours() + 100)).substr(1),
      mm: ('' + (date.getMinutes() + 100)).substr(1),
      ss: ('' + (date.getSeconds() + 100)).substr(1),
    }
    return format.replace(/(yyyy|MM?|dd?|HH?|ss?|mm?)/g, function () {
      // @ts-ignore
      return dict[arguments[0]]
    })
  },

  /**
   * 日期补全
   * @param date
   * @param needTime
   */
  formatDate: (date: any, needTime = true) => {
    if (!date) return ''
    const pad = (n: any) => (n < 10 ? `0${n}` : n)
    const dateStr = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
    if (!needTime) return `${dateStr}`

    const timeStr = `${pad(date.getHours())}:${pad(date.getMinutes())}`
    return `${dateStr} ${timeStr}`
  },

  /**
   * 根据code获取json数组中的文本
   * @param code --- 需要查询的代码
   * @param arr -- 需要查询的数组
   * @param prop -- 需要比较的属性
   * @param returnProp -- 需要返回的属性
   */
  getJsonTextByCode: (code: string | number, arr: Array<any> = [], prop: string = 'code', returnProp: string = 'text') => {
    let newArr: any = arr.filter((item: any) => item[prop] === code) || []
    // returnProp === 'all' 返回整个对象
    return newArr.length > 0 ? (returnProp === 'all' ? newArr[0] : newArr[0][returnProp]) || '' : ''
  },

  /**
   * 检验字符串是否为空
   */
  isBlank: (value: string) => {
    return value === undefined || value == null || /^[ ]+$/.test(value) || value.length === 0
  },

  /**
   * 格式化电话号码, 前三位、四位一体
   */
  formatPhone: (phone: string) => {
    if (Utils.isBlank(phone)) return
    phone = Utils.getFormatPhone(phone).trim()
    return phone.replace(/^(.{3})(.*)(.{4})/, '$1 $2 $3')
  },

  /**
   * 获取格式化后的手机号
   */
  getFormatPhone: (phone: string) => {
    if (!Utils.isBlank(phone)) {
      // 去除空格
      phone = phone.replace(/ /g, '')
    }

    return phone
  },

  /**
   * 缓存数据
   * @param key -- cache key
   * @param value -- cache value
   * @param isSessionStorage --- 是否存储在 sessionStorage
   */
  setCache: (key: string, value: any, isSessionStorage = false) => {
    if (isSessionStorage) {
      Utils.setSession(Utils.encrypt(key), value, true)
    } else {
      Utils.setLocal(Utils.encrypt(key), value, true)
    }
  },

  /**
   * 获取缓存数据
   * @param key -- cache key
   * @param expireTime -- 过期时间, 默认 30 天
   * @param isSessionStorage --- 是否存储在 sessionStorage
   */
  getCache: (key: string, expireTime: number = 30 * 24 * 60 * 60 * 1000, isSessionStorage = false) => {
    let data = isSessionStorage ? Utils.getSession(Utils.encrypt(key), true) || {} : Utils.getLocal(Utils.encrypt(key), true) || {}
    console.log(data)
    if (JSON.stringify(data) === '{}') return {}

    let time = data.time || 0
    let date = new Date().getTime()
    console.log(date, time)
    if (date - time >= expireTime) {
      isSessionStorage ? Utils.removeSession(key) : Utils.removeLocal(key)
    }
    return new Date().getTime() - time > expireTime ? {} : data.data || {}
  },

  /**
   * 清除缓存
   */
  clearCache: (key: string) => {
    Utils.removeLocal(Utils.encrypt(key))
  },

  /**
   * 判断对象是否包含某直接属性（非原型）
   * @param   {any}       obj         需要判断对象
   * @param   {string}    key         需要判断对象
   * @return  {boolean}               返回是否存在key值
   */
  hasKey: (obj: any, key: string) => {
    return obj !== null && obj.prototype.hasOwnProperty.call(obj, key)
  },

  /**
   * 判断是否普通对象
   * @param   {any}       target         需要判断对象
   * @return  {boolean}                  返回是否对象
   */
  isObject: (target: any) => {
    return typeof target === 'object'
  },

  /**
   * 判断对象是否为空
   */
  isObjectNull: (target: { [K: string]: any } = {}) => {
    return JSON.stringify(target) === '{}'
  },

  /**
   * 获取对象自有属性名（不包含原型属性）
   * @param   {any}       obj              对象
   * @return  {Array}                      返回对象key数组
   */
  getKeys: (obj: any) => {
    if (!Utils.isObject(obj)) {
      return []
    }
    if (Object.keys) {
      return Object.keys(obj)
    }
    let keys = [],
      key
    for (key in obj) {
      if (Utils.hasKey(obj, key)) {
        keys.push(key)
      }
    }
    return keys
  },

  deepCopy: (o: any) => {
    if (o instanceof Array) {
      let n: Array<any> = []
      for (let i = 0; i < o.length; ++i) {
        n[i] = Utils.deepCopy(o[i])
      }
      return n
    } else if (o instanceof Object) {
      let n: any = {}
      for (let i in o) {
        n[i] = Utils.deepCopy(o[i])
      }
      return n
    } else {
      return o
    }
  },

  /**
   * 首字母转大写或小写
   * @param str --- 要转换的字符串
   * @param needUpperCase --- 首字母是否需要转成大写
   */
  capitalizeFirstChar: function (str: string = '', needUpperCase: boolean = true) {
    if (Utils.isBlank(str)) return ''
    let firstChar = str.substring(0, 1)
    let surplusChar = str.substring(1, str.length)
    firstChar = needUpperCase ? firstChar.toUpperCase() : firstChar.toLowerCase()
    return firstChar + surplusChar
  },

  /**
   * 驼峰转换下划线
   * @param str --- 要转换的字符串
   * @param separator --- 分割符, 默认: -
   */
  charToLine: function (str: string = '', separator: string = '-') {
    if (Utils.isBlank(str)) return ''
    let word = ''
    for (let i = 0; i < str.length; i++) {
      let char = str[i]
      if (char >= 'A' && char <= 'Z' && i !== 0 && i !== str.length - 1) {
        word += `${separator}${char.toLowerCase()}`
      } else {
        word += char.toLowerCase()
      }
    }

    return word
  },

  /**
   * 身份证处理
   */
  setCardNo: (card: string) => {
    if (!card) return ''
    return card.replace(/^(.{4})(?:\d+)(.{4})$/, '$1******$2')
  },

  /**
   * 手机号处理
   */
  setPhoneNo: (num: string) => {
    if (!num) return ''
    return num.replace(/^(.{3})(?:\d+)(.{4})$/, '$1****$2')
  },

  /**
   * 年龄
   */
  setAge: (birthday: string) => {
    if (!birthday) return ''
    const currentYear = new Date().getFullYear()
    const bir = birthday.split('-')[0]
    if (!bir) return ''
    const age = Number(currentYear) - Number(bir)
    return age <= 0 ? 1 : age
  },

  /**
   * 是否是 IOS
   */
  isIos: () => {
    return !!navigator.userAgent.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/)
  },

  /**
   * 判断是否 Android
   */
  isAndroid: () => {
    return navigator.userAgent.indexOf('Android') > -1 || navigator.userAgent.indexOf('Linux') > -1
  },
}

export default Utils
