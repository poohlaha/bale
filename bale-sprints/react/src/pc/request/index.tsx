// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//   /!\ DO NOT MODIFY THIS FILE /!\
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// 页面请求发射器
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//   /!\ DO NOT MODIFY THIS FILE /!\
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

import { fetch, fetchAll, getErrorReason } from './axios'
import { CONSTANT, SYSTEM } from '@config/index'
import Utils from '@utils/utils'
import { setToken, Signature } from '@utils/sign'
import axios from 'axios'
import { COMMON, EXIT, PAGE_JUMP, TOAST } from '@utils/base'
import type { RequestConstant, RequestOptions } from './constant'
import { IdentEnum, MethodEnum, RequestTypeEnum } from './constant'

/**
 * 发送请求
 * config :
 * {
 *    url: '',
 *    method: '',
 *    data: {},
 *    requestType:  'request' // 'request' 'refresh', 'upload', 'none'
 *    queue: [], // 队列，当多个请求时使用
 *    ident: -1, // 0: 登录, 1: 退出登录, -1: 其他
 *    type: 'json', // 请求头类型, 默认为 json
 *    responseType: '',
 *    responseStream: false, // 返回结果是否是流
 *    headers: {},
 *    params: {message: ''}, // 传递参数
 *    success: function() {},
 *    fail: function() {}
 * }
 */
export default class Request {
  static BLOB = 'blob'
  static SUCCESS_CODE = 200
  static DURATION = 1
  static CONTENT_DISPOSITION = 'content-disposition'
  static FILENAME = 'FILENAME'
  static CONTENT_TYPE_NAME = 'content-type'
  static RESULT = 'result'

  /**
   * 发送请求
   */
  static async send(config: RequestConstant) {
    if (!config.url) return

    // config.url = `${process.env.API_ROOT}${config.url}`

    // TODO 判断用户是否登录, 如果不是登录判断token是否过期
    // if (Request.judgeTokenExpire(config)) return;

    // upload
    let requestType = Request.getRequestType(config)
    if (requestType === RequestTypeEnum.UPLOAD.toString() || config.responseStream) {
      config.responseType = Request.BLOB
    }

    return await Request.request(config)
  }

  /**
   * 获取请求数据, headers统一在axios过滤器中处理
   */
  static getRequestHeader(config: RequestConstant) {
    let url = config.url || ''

    // 判断是否需要加密
    let data = config.data || {}

    if (SYSTEM.NEED_ENCRYPT) {
      data = Signature.encrypt(data)
    }

    return {
      method: config.method?.toString() || MethodEnum.POST.toString(),
      url: url,
      data: data,
      responseType: config.responseType || '',
      headers: config.headers || {},
      type: config.type || 'json'
    }
  }

  /**
   * 判断token是否过期
   */
  static judgeTokenExpire(config: RequestConstant) {
    if (config.ident === undefined || config.ident === null) config.ident = IdentEnum.OTHER
    if (config.ident !== IdentEnum.OTHER) return false

    let token = Utils.getLocal(SYSTEM.LOCAL_TOKEN_NAME)

    if (!token) {
      // 登录过期
      PAGE_JUMP.toLoginPage(COMMON.getLanguageText('TOKEN_EXPIRED_ERROR'))
      return true
    }

    return false
  }

  /**
   * 获取请求标识
   */
  static getRequestType(config: RequestConstant) {
    if (!config) return RequestTypeEnum.REQUEST.toString()
    return (config && config.requestType) || RequestTypeEnum.REQUEST.toString()
  }

  /**
   * 请求数据
   */
  static async request(config: RequestConstant) {
    let options: RequestOptions = Request.getRequestHeader(config)

    // 显示Loading条
    if (Request.getRequestType(config) === RequestTypeEnum.REQUEST.toString()) {
      // Request.showToast({ type: 2 })
    }

    try {
      let res: any = await fetch(options)
      if (res.status === Request.SUCCESS_CODE) {
        return await Request.getResponseData(config, res)
      } else {
        console.error(res)
        return config.fail?.(res, config.params || {})
      }
    } catch (e: any) {
      console.error(e)
      if (config.showError !== false) {
        TOAST.show({ message: COMMON.getLanguageText('ERROR_MESSAGE'), type: 4 })
      }
      return config.fail?.(e, config.params || {})
    }
  }

  /**
   * 获取返回数据
   */
  static getResponseData(config: RequestConstant, res: { [K: string]: any } = {}) {
    try {
      // Request.hideToast()

      // failed
      if (res.data && res.data.success !== null && res.data.success !== undefined) {
        if (Request.isString(res.data.success) && res.data.success && res.data.success.toLowerCase() !== CONSTANT.SUCCESS.toLowerCase()) {
          let error: any = getErrorReason(res.data)
          // token 过期
          if (error.code === '5000') {
            PAGE_JUMP.toLoginPage(COMMON.getLanguageText('TOKEN_EXPIRED_ERROR'))
            config.fail?.(error, config.params || {})
          } else {
            if (config.showError !== false) {
              TOAST.show({ message: error.reason, type: 4 })
            }
            config.fail?.(error, config.params || {})
          }
          return
        } else {
          // 判断是否需要弹出自定义message
          if (config.params?.message) {
            TOAST.show({ message: config.params.message })
          }
        }
      }

      if (!res.data) {
        config.success?.({}, {}, config.params || {})
        return
      }

      // 返回流
      if (config.responseStream) {
        if (config.needDownload) {
          Request.downloadFile(config, res)
          return
        } else {
          return config.success?.(res.data || null, res, config.params || {})
        }
      }

      let resData: any = null
      if (Request.isString(res.data)) {
        try {
          resData = JSON.parse(res.data)
        } catch (e) {
          resData = null
        }
      } else {
        resData = res.data
      }

      if (!resData) {
        console.info('没有返回数据')
        if (config.showError !== false) {
          TOAST.show({ message: COMMON.getLanguageText('ERROR_MESSAGE'), type: 4 })
        }
        return
      }

      // 如果有status字段
      if (resData.status !== null && resData.status !== undefined) {
        if (resData.status.toUpperCase() !== CONSTANT.SUCCESS) {
          if (config.showError !== false) {
            TOAST.show({
              message: Request.getResponseErrorMessage(resData).reason || COMMON.getLanguageText('ERROR_MESSAGE'),
              type: 4
            })
          }
          return
        }
      }

      if (resData.code !== null && resData.code !== undefined) {
        if (resData.code !== '0' && resData.code !== 0) {
          // 判断 token 是否过期
          if (resData.code !== SYSTEM.TOKEN_EXPIRED_CODE) {
            TOAST.show({
              message: Request.getResponseErrorMessage(resData).reason || COMMON.getLanguageText('ERROR_MESSAGE'),
              type: 4
            })
          }

          return config.fail?.(res.data || {})
        }
      }

      let data = resData.data || resData.result || {}
      // 判断是否是登录和登出, 如果是登录, 则保存token, 登出则清除localStorage
      if (config.ident === IdentEnum.LOGIN) {
        // 登录
        setToken(res, config) // 保存token
      } else if (config.ident === IdentEnum.LOGOUT) {
        // 登出
        EXIT.logout()
      }

      return config.success?.(data, resData, config.params || {})
    } catch (res: any) {
      // Request.hideToast()
      console.error(res)

      // 超时
      if (res.errMsg) {
        if (res.errMsg.toLowerCase().indexOf('timeout') !== -1) {
          if (config.showError !== false) {
            TOAST.show({ message: COMMON.getLanguageText('TIMEOUT_MESSAGE'), type: 4 })
          }
        }
      } else {
        if (config.showError !== false) {
          TOAST.show({
            message: Request.getResponseErrorMessage(res.data).reason || COMMON.getLanguageText('ERROR_MESSAGE'),
            type: 4
          })
        }
      }

      return config.fail?.(res)
    }
  }

  /**
   * 文件下载
   */
  static downloadFile = (config: RequestConstant, res: { [K: string]: any } = {}) => {
    if (!res) return
    const { contentType, fileName } = Request.getDownloadFileName(res)
    console.log(contentType, fileName)

    try {
      Request.export(res.data, contentType, fileName)
      config.success?.({ code: 200 })
    } catch (e) {
      console.log('文件下载失败')
      config.fail?.({ code: 500 })
    }
  }

  /**
   * 获取文件下载的文件名
   */
  static getDownloadFileName(res: { [K: string]: any }) {
    let fileName: string = ''
    let headers = res.headers || {}
    let contentType = headers[Request.CONTENT_TYPE_NAME]
    let contentDisposition = headers[Request.CONTENT_DISPOSITION]
    if (!contentDisposition) return { contentType, fileName }

    let arr = contentDisposition.split(';')
    if (arr.length === 0) return { contentType, fileName }

    try {
      arr.forEach((item: any) => {
        if (item && item.indexOf('=') !== -1 && item.toUpperCase().indexOf(Request.FILENAME) !== -1) {
          let _arr = item.split('=')
          fileName = _arr[_arr.length - 1]
        }
      })
    } catch (e) {
      fileName = ''
    }

    return {
      contentType,
      fileName: decodeURI(fileName).replace(/"/g, '')
    }
  }

  /**
   * 导出文件
   */
  static export(body: any, contentType: string, fileName: string) {
    let blob = new Blob([body || ''], { type: contentType })
    // @ts-ignore
    if (window.navigator && window.navigator.msSaveOrOpenBlob) {
      // @ts-ignore
      window.navigator.msSaveOrOpenBlob(blob, fileName)
    } else {
      let a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
  }

  /**
   * 获取返回错误信息
   */
  static getResponseErrorMessage(data: { [K: string]: any } = {}) {
    let reason: string
    let code: number
    try {
      if (!data) {
        return {
          reason: COMMON.getLanguageText('ERROR_MESSAGE'),
          code: 500
        }
      }

      let error = data.error
      if (error) {
        if (Request.isString(error)) error = JSON.parse(error)
        reason = error.reason || COMMON.getLanguageText('ERROR_MESSAGE')
        code = error.code
      } else {
        reason = data.reason || data.message || data.msg || COMMON.getLanguageText('ERROR_MESSAGE')
        code = 500
      }
    } catch (e) {
      reason = COMMON.getLanguageText('ERROR_MESSAGE')
      code = 500
    }

    return {
      reason: reason,
      code: code
    }
  }

  /**
   * get请求
   * @param config
   */
  static get(config: RequestConstant) {
    config.method = MethodEnum.GET
    return Request.send(config)
  }

  /**
   * post请求
   * @param config
   */
  static post(config: any = {}) {
    config.method = MethodEnum.POST
    return Request.send(config)
  }

  /**
   * put请求
   * @param config
   */
  static put(config: any = {}) {
    config.method = MethodEnum.PUT
    return Request.send(config)
  }

  /**
   * delete请求
   * @param config
   */
  static delete(config: any = {}) {
    config.method = MethodEnum.DELETE
    return Request.send(config)
  }

  /**
   * 多个请求
   */
  static async all(queue: Array<RequestConstant> = []) {
    if (!queue || queue.length === 0) return

    let requests: Array<RequestOptions> = []
    queue.map((item: RequestConstant) => {
      let request = Request.getRequestHeader(item)
      if (request) {
        requests.push(axios(request))
      }
    })

    let response: any = await fetchAll(requests)
    if (!response) return

    let error = response.error // 是否有错误
    let errors = response.errors || [] // 错误数组
    let responses = response.responses || [] // 返回的请求数据数组

    // 有错误时提示错误
    if (error) {
      TOAST.show({
        message: errors.length > 0 ? errors[0].message : COMMON.getLanguageText('ERROR_MESSAGE'),
        type: 4
      })
      return
    }

    if (responses.length === 0 || responses.length !== queue.length) {
      TOAST.show({ message: COMMON.getLanguageText('ERROR_MESSAGE'), type: 4 })
      return
    }

    for (let i = 0; i < queue.length; i++) {
      let request: { [K: string]: any } = queue[i]
      let res = responses[i]
      if (!res) continue

      if (res.config.url !== request.url) {
        res = Request.findResponseByUrl(request.url, responses)
      }

      if (!res) continue
      request.success?.(res.data, request.params || {})
    }
  }

  /**
   * 根据url查找返回的Response
   */
  static findResponseByUrl = (url: string, responses: Array<any> = []) => {
    if (!url || responses.length === 0) return null
    for (let i = 0; i < responses.length; i++) {
      let response: any = responses[i]
      if (!responses || !response.config) continue
      if (response.config.url === url) return response
    }

    return null
  }

  /**
   * 判断是不是string类型
   */
  static isString(str: any) {
    return typeof str === 'string' && str.constructor === String
  }
}
