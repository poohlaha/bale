import React, { useContext } from 'react'
import RouterUrls from '@route/router.url.toml'
import Utils from '@utils/utils'
import { CONSTANT, SYSTEM } from '@config/index'
import { message as Message } from 'antd'
import { LanguageContext } from '@provider/language'
import zhCN from '@assets/locales/zh.toml'
import enUS from '@assets/locales/en.toml'

// 退出相关
const EXIT = {
  /**
   * 退出
   */
  exit: (props: any) => {
    setTimeout(() => {
      props.history.push({
        pathname: RouterUrls.SYSTEM.LOGIN_URL,
      })
    }, 300)
  },

  /**
   * 退出登陆
   */
  logout: (text: string = '', redirectUrl: string = '') => {
    STORAGE.clearUserInfo()
    PAGE_JUMP.toLoginPage(text, redirectUrl)
  },
}

// 存储相关
const STORAGE = {
  /**
   * 清除用户信息
   */
  clearUserInfo: () => {
    // 保存用户信息
    Utils.removeLocal(SYSTEM.USER_TOKEN_NAME)
    // 保存Token
    Utils.removeLocal(SYSTEM.LOCAL_TOKEN_NAME)
    Utils.clearSessionStorage()
  },

  /**
   * 清除所有信息
   */
  clear: () => {
    Utils.clearLocalStorage()
    Utils.clearSessionStorage()
  },

  judgeTokenExpired: () => {
    return !Utils.getLocal(SYSTEM.USER_TOKEN_NAME)
  },
}

// 页面跳转相关
const PAGE_JUMP = {
  /**
   * 页面跳转
   * @param props --- react props
   * @param url --- URL
   * @param state --- react props state
   * @param text --- 跳转后弹框文字
   * @param needWindowJump --- 是否需要使用 window 跳转
   * @param isReplace --- 是否用 replace 跳转
   */
  jump: (props: any = {}, url: string = '', state: any = {}, text: string = '', needWindowJump: boolean = false, isReplace: boolean = false) => {
    if (!url) return
    if (needWindowJump) {
      if (isReplace) {
        window.location.replace(url)
      } else {
        window.location.href = url
      }
    } else {
      if (isReplace) {
        props['history'].replace(url, state)
      } else {
        props['history'].push(url, state)
      }
    }

    if (text) {
      TOAST.show({ message: text, needTime: true, type: 2 })
    }
  },

  /**
   * 通过 window 跳转
   * @param url
   * @param callback
   */
  toPageByWindow: (url: string, callback?: Function) => {
    let adds = ADDRESS.getAddress()
    window.location.replace(adds.beforeAddressUrl + url)
    callback?.()
  },

  /**
   * 跳转到url
   * @param props --- react props
   * @param url --- 要跳转的 URL
   * @param state --- 传递的参数对象
   * @param needPrefixAddress -- 是否需要地址前缀
   * @param isReplace --- 是否用 replace 跳转
   * @param text --- 跳转后弹框文字
   * @param needWindowJump --- 是否需要使用 window 跳转
   * @param callback --- 跳转后回调
   */
  linkTo: ({ props = {}, url = '', state = {}, needPrefixAddress = false, isReplace = false, text = '', needWindowJump = false, callback = null }) => {
    if (!url || !props) return
    if (needPrefixAddress) {
      let adds = ADDRESS.getAddress()
      url = adds.beforeAddressUrl + url
    }

    PAGE_JUMP.jump(props, url, {}, text, needWindowJump || false, isReplace || false)
    // @ts-ignore
    callback?.()
  },

  /**
   * 重定向跳转
   * @param props --- react props
   * @param state --- react props state
   * @param text --- 跳转后弹框文字
   * @param jumpUrl -- 需要跳转的 URL
   * @param needJumpBack -- 是否需要跳转回来
   * @param jumpBackUrl -- 跳转回来的 URL
   * @param needDecryptJumpUrl -- 是否需要解密跳转的 URL
   * @param needPrefixAddress -- 是否需要地址前缀
   * @param needWindowJump -- 是否需要 window 跳转
   * @param isReplace -- 是否需要替换
   * @param callback --- 跳转后回调
   */
  redirect: ({
    props = {},
    state = {},
    text = '',
    jumpUrl = '',
    needJumpBack = true,
    jumpBackUrl = '',
    needDecryptJumpUrl = false,
    needPrefixAddress = true,
    needWindowJump = true,
    isReplace = true,
    callback = null,
  }) => {
    if (!jumpUrl) return
    const _needJumpBack = needJumpBack === null || needJumpBack === undefined ? true : needJumpBack
    const _needDecryptJumpUrl = needDecryptJumpUrl === null || needDecryptJumpUrl === undefined ? true : needDecryptJumpUrl
    const _needPrefixAddress = needPrefixAddress === null || needPrefixAddress === undefined ? true : needPrefixAddress
    const _needWindowJump = needWindowJump === null || needWindowJump === undefined ? true : needWindowJump
    const _isReplace = isReplace === null || isReplace === undefined ? true : isReplace

    // 解密 jumpUrl
    if (_needDecryptJumpUrl) {
      jumpUrl = Utils.decrypt(jumpUrl)
      console.log('redirect decrypt url: ', jumpUrl)
    }

    // 添加前缀
    if (_needPrefixAddress) {
      let adds = ADDRESS.getAddress()
      jumpUrl = adds.beforeAddressUrl + jumpUrl
    }

    // 添加 redirectUrl 路径(加密)
    if (_needJumpBack) {
      jumpUrl += `${jumpUrl.indexOf('?') === -1 ? '?' : '&'}redirectUrl=${Utils.encrypt(jumpBackUrl || window.location.href || '') || ''}`
    }
    console.log('redirect url: ', jumpUrl)

    PAGE_JUMP.linkTo({
      props,
      url: jumpUrl,
      state,
      isReplace: _isReplace,
      text,
      needWindowJump: _needWindowJump,
      callback,
    })
  },

  /**
   * 根据 url 跳转回原来路径
   * @param props --- react props
   * @param params --- 跳转传递的参数
   * @param isReplace --- 是否用 replace 跳转
   */
  redirectBack: (props: any = {}, params: { [K: string]: any } = {}, isReplace: boolean = false) => {
    // 判断是否需要回跳
    let query = props.query || {}
    if (Utils.isObjectNull(query)) {
      query = ADDRESS.getQueryString(props) || {}
    }
    let redirectUrl = query.redirectUrl || ''
    if (redirectUrl) {
      let paramUrl = ''
      for (let param in params) {
        paramUrl += `&${param}=${params[param] || ''}`
      }

      redirectUrl = Utils.decrypt(redirectUrl)
      PAGE_JUMP.redirect({
        props,
        jumpUrl: Utils.encrypt(redirectUrl + paramUrl),
        needJumpBack: false,
        needDecryptJumpUrl: true,
        isReplace,
      })
    } else {
      PAGE_JUMP.goBack(props)
    }
  },

  /**
   * 返回上一步
   * @param props --- react props
   * @param callback --- 跳转回调函数
   */
  goBack: (props: any, callback?: Function) => {
    props.history.goBack()
    // @ts-ignore
    callback?.()
  },

  /**
   * 跳转到登录页面
   * @param text --- 弹框文字
   * @param redirectUrl --- 重定向 URL
   * @param needWindowJump --- 是否 window 跳转
   * @param isReplace --- 是否重定向跳转
   */
  toLoginPage: (text: string = '', redirectUrl: string = '', needWindowJump: boolean = true, isReplace: boolean = true) => {
    let adds = ADDRESS.getAddress()
    STORAGE.clearUserInfo()

    let url = ''
    if (redirectUrl) {
      url = window.location.href = `${adds.beforeAddressUrl + RouterUrls.SYSTEM.LOGIN_URL}?redirectUrl=${Utils.encrypt(redirectUrl)}`
    } else {
      url = window.location.href = `${adds.beforeAddressUrl + RouterUrls.SYSTEM.LOGIN_URL}`
    }

    PAGE_JUMP.jump({}, url, {}, text, needWindowJump, isReplace)
  },
}

// 地址栏相关
const ADDRESS = {
  /**
   * 根据 window.location.href 获取前缀和后缀 URL
   */
  getAddress: (url: string = '') => {
    let address = url || window.location.href
    let addressReg = /^(https?:\/\/)([0-9a-z.]+)(:[0-9]+)?([/0-9a-z.]+)(\/#)?$/
    if (address.substr(address.length - 1, address.length) === '/') {
      address = address.substr(0, address.length - 1)
    }

    // 如果只有协议和端口
    if (addressReg.test(address)) {
      console.log('address:', '')
      console.log('beforeAddressUrl:', address)
      return {
        addressUrl: '',
        beforeAddressUrl: address,
      }
    }

    // 判断是否有?
    let qIndex = address.indexOf('?')
    let param = ''
    if (qIndex !== -1) {
      let addressNoParamUrl = address.substr(0, qIndex)
      param = address.substr(qIndex, address.length)
      address = addressNoParamUrl
    }

    // 判断最后一个字符是否是 `\`
    let lastChar = address.substr(address.length - 1, address.length)
    if (lastChar.endsWith('/') || lastChar.endsWith('\\')) {
      address = address.substr(0, address.length)
    }

    let lastIndex = address.lastIndexOf('/')
    let beforeAddressUrl = address.substr(0, lastIndex) // 前缀
    let spec = beforeAddressUrl.indexOf('#') // #
    if (spec !== -1) {
      beforeAddressUrl = beforeAddressUrl.substr(0, spec) + '#'
    }
    let addressUrl = address.substr(lastIndex, address.length) // 后缀
    console.log('addressUrl:', addressUrl)
    console.log('beforeAddressUrl:', beforeAddressUrl)
    console.log('param:', param)
    return {
      addressUrl,
      beforeAddressUrl,
      param,
      params: ADDRESS.getUrlString(param),
    }
  },

  /**
   * 解析 props query
   */
  getQueryString: (props: any) => {
    if (!props) return null
    return ADDRESS.getUrlString(props.history.location.search)
  },

  /**
   * 获取 URL 参数
   */
  getUrlString: (url: string) => {
    if (!url) return {}

    let obj: any = {}
    const getQueryParams = (url: string = '') => {
      let params: any = {}
      if (!url) return params

      let spec = '?'
      let specIndex = url.indexOf(spec)
      if (specIndex === -1) return params

      url = url.substring(specIndex, url.length)
      const t = url.substring(0, 1)
      const query = t === '?' ? url.substring(1, url.length).split('&') : url.split('&')
      if (!query.length) return null
      query.forEach((item: string) => {
        if (item) {
          const data: Array<string> = item.split('=')
          params[data[0]] = data[1] || ''
        }
      })

      return params
    }
    // 判断是否有redirectUrl
    let redirectStr: string = 'redirectUrl='
    const redirectIndex: number = url.indexOf(redirectStr)
    if (redirectIndex !== -1) {
      let item = url.substr(redirectIndex + redirectStr.length, url.length)
      let prefixUrl = url.substr(0, redirectIndex)
      obj[redirectStr.substr(0, redirectStr.length - 1)] = item
      let otherParams = getQueryParams(prefixUrl)
      return {
        ...obj,
        ...otherParams,
      }
    }

    return getQueryParams(url)
  },

  /**
   * 根据名称获取浏览器参数
   */
  getAddressQueryString: (name: string) => {
    if (!name) return null
    let after = window.location.search
    after = after.substr(1) || window.location.hash.split('?')[1]
    if (!after) return null
    if (after.indexOf(name) === -1) return null
    let reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)')
    let r = decodeURI(after).match(reg)
    if (!r) return null
    return r[2]
  },
}

// 用户相关
const USER = {
  /**
   * 获取用户信息
   */
  getUserInfo: () => {
    let userInfo = Utils.getLocal(SYSTEM.USER_TOKEN_NAME)
    if (!userInfo) return null
    try {
      userInfo = JSON.parse(userInfo)
    } catch (e) {
      userInfo = null
    }
    return userInfo
  },

  /**
   * 保存用户信息
   */
  setUserInfo: (userInfo: any = {}) => {
    let token: string = userInfo[SYSTEM.TOKEN_NAME] // 从用户信息中获取 TOKEN
    delete userInfo[SYSTEM.TOKEN_NAME]

    // 设置用户信息
    Utils.removeLocal(SYSTEM.USER_TOKEN_NAME)
    Utils.setLocal(SYSTEM.USER_TOKEN_NAME, JSON.stringify(userInfo))

    // 保存 TOKEN
    Utils.removeLocal(SYSTEM.LOCAL_TOKEN_NAME)
    Utils.setLocal(SYSTEM.LOCAL_TOKEN_NAME, token)
  },
}

// Toast
const TOAST = {
  /**
   * Toast 弹出提示
   * message -- 内容
   * needTime -- 是否延迟加载
   * duration -- 时间 0 为不关闭
   * time -- 时长
   * type --- 1 --- info 2 --- success  3 --- warning 4 --- error
   * onClose -- 关闭函数
   */
  show: (
    params: any = {
      message: '',
      needTime: false,
      duration: CONSTANT.ALERT_DURATION,
      time: 200,
      type: 1,
      onClose: Function,
    }
  ) => {
    const getToast = (message: string, duration: number, type: number, onClose: () => void) => {
      if (type === 3) {
        // warning
        Message.warning(message, duration || CONSTANT.ALERT_DURATION, onClose)
      } else if (type === 4) {
        // error
        Message.error(message, duration || CONSTANT.ALERT_DURATION, onClose)
      } else if (type === 2) {
        // success
        Message.success(message, duration || CONSTANT.ALERT_DURATION, onClose)
      } else {
        // info
        Message.info(message, duration || CONSTANT.ALERT_DURATION, onClose)
      }
    }

    if (params.needTime) {
      setTimeout(() => {
        getToast(params.message, params.duration, params.type, params.onClose)
      }, params.time)

      return
    }

    getToast(params.message, params.duration, params.type, params.onClose)
  }
}

// 公共模块相关
const COMMON = {
  /**
   * 获取语言文本
   */
  getLanguageText: (name: string, isDom: boolean = false) => {
    if (Utils.isBlank(name)) return ''
    try {
      const language = isDom ? useContext(LanguageContext)
        : Utils.getLocal(CONSTANT.LANGUAGES_NAME) || CONSTANT.LANGUAGES[0]
      if (language === CONSTANT.LANGUAGES[0]) {
        return zhCN[name] || ''
      } else if (language === CONSTANT.LANGUAGES[1]) {
        return enUS[name] || ''
      }
    } catch (e) {
      return CONSTANT.LANGUAGES[0]
    }
  }
}

export { EXIT, STORAGE, PAGE_JUMP, ADDRESS, USER, TOAST, COMMON }
