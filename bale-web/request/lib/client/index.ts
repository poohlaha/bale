// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//   /!\ DO NOT MODIFY THIS FILE /!\
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// 使用 Web API Request 发送页面请求
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//   /!\ DO NOT MODIFY THIS FILE /!\
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

/**
 * @fileOverview request
 * @doc https://developer.mozilla.org/zh-CN/docs/Web/API/Request
 * @date 2023-12-05
 * @author poohlaha
 */
import Utils from '../utils'

enum Method {
  GET = 'get',
  POST = 'post',
  PUT = 'put',
  DELETE = 'delete',
}

export interface IHttpRequestProps {
  url: string
  method?: string
  data?: any
  type?: string
  responseType?: string
  timeout?: number
  headers?: { [K: string]: string }
  success?: Function
  failed?: Function
}

export interface IHttpRequestFetchProps {
  cache?: string
  credentials?: string
  integrity?: string
  mode?: string
  redirect?: string
  referrer?: string
  referrerPolicy?: string
}

interface IRequestProps {
  url: string
  method: Method
  body: any
  headers: Headers
  type: Type
  responseType: Type
  timeout: number
  success: Function | null
  failed: Function | null
}

interface IRequestFetchProps {
  cache: RequestCache
  credentials: RequestCredentials
  integrity: string
  mode: RequestMode
  redirect: RequestRedirect
  referrer: string
  referrerPolicy: ReferrerPolicy
  signal?: AbortSignal
}

enum RequestCache {
  DEFAULT = 'default',
  FORCE_CACHE = 'force-cache',
  NO_CACHE = 'no-cache',
  NO_STORE = 'no-store',
  ONLY_IF_CACHED = 'only-if-cached',
  RELOAD = 'reload',
}

enum RequestCredentials {
  INCLUDE = 'include',
  OMIT = 'omit',
  SAME_ORIGIN = 'same-origin',
}

enum RequestMode {
  CORS = 'cors',
  NAVIGATE = 'navigate',
  NO_CORS = 'no-cors',
  SAME_ORIGIN = 'same-origin',
}

enum RequestRedirect {
  ERROR = 'error',
  FOLLOW = 'follow',
  MANUAL = 'manual',
}

enum ReferrerPolicy {
  NONE = '',
  NO_REFERRER = 'no-referrer',
  NO_REFERRER_WHEN_DOWNGRADE = 'no-referrer-when-downgrade',
  ORIGIN = 'origin',
  ORIGIN_WHEN_CROSS_ORIGIN = 'origin-when-cross-origin',
  SAME_ORIGIN = 'same-origin',
  STRICT_ORIGIN = 'strict-origin',
  STRICT_ORIGIN_WHEN_CROSS_ORIGIN = 'strict-origin-when-cross-origin',
  UNSAFE_URL = 'unsafe-url',
}

export interface HttpResponse {
  status: number
  headers: Map<string, string>
  body: JSON | Blob | string | number | Array<any> | null | any
  error: string
}

const CONTENT_TYPE: string = 'content-type'
// const CONTENT_DISPOSITION: string = 'content-disposition'

enum Type {
  JSON = '0',
  FORM_SUBMIT = '1',
  FORM_DATA = '2',
  BLOB = '3',
  TEXT = '4',
  HTML = '5',
}

enum CONTENT_TYPE_VALUE {
  JSON = 'application/json;charset=UTF-8',
  FORM_SUBMIT = 'application/x-www-form-urlencoded',
  FORM_DATA = 'multipart/form-data',
  BLOB = 'application/octet-stream',
  TEXT = 'text/plain;charset=UTF-8',
  HTML = 'text/html;charset=UTF-8',
}

const SUCCESS_CODE: number = 200
const DEFAULT_TIMEOUT: number = 30
const FOREVER_TIMEOUT: number = -1

export class HttpRequest {
  /**
   * 是否支持 Request, 具体请查看: https://caniuse.com/?search=Request
   */
  public static isSupport(): boolean {
    return !!window.Request && !!window.fetch
  }

  /**
   * 发送请求
   * @param props
   * @param fetchProps
   */
  // @ts-ignore
  public static async send(props: IHttpRequestProps, fetchProps?: IHttpRequestFetchProps): Promise<HttpResponse> {
    // response
    let response: HttpResponse = {
      status: SUCCESS_CODE,
      headers: new Map(),
      body: null,
      error: '',
    }

    // not support
    if (!HttpRequest.isSupport()) {
      response.status = -999
      response.error = 'The browser does not support `Web API request` !'
      HttpRequest.executeFn(props.failed, response)
      return response
    }

    let requestProps: IRequestProps = HttpRequest.validate(props)

    // validate url
    if (Utils.isBlank(requestProps.url)) {
      response.status = 500
      response.error = '`url` field in `props` is empty !'
      HttpRequest.executeFn(props.failed, response)
      return response
    }

    return await HttpRequest.getResponse(requestProps, response, fetchProps)
  }

  /**
   * 发送请求, 获取结果
   * @param props
   * @param httpResponse
   * @param fetchProps
   * @private
   */
  private static async getResponse(props: IRequestProps, httpResponse: HttpResponse, fetchProps?: IHttpRequestFetchProps): Promise<HttpResponse> {
    // fetch options
    let requestFetchProps: IRequestFetchProps = HttpRequest.prepareFetchOptions(fetchProps)

    // body
    let body = props.body || null
    let requestBody: string | Blob | FormData | ArrayBuffer | URLSearchParams = ''
    if (body !== null && body !== undefined) {
      if (body instanceof Blob || body instanceof FormData || body instanceof ArrayBuffer || body instanceof URLSearchParams) {
        requestBody = body
      } else {
        requestBody = JSON.stringify(body)
      }
    }

    let opts: { [K: string]: any } = {
      method: props.method,
      headers: props.headers,
      ...requestFetchProps,
    }

    // Request with GET/HEAD method cannot have bod
    if (props.method !== 'get') {
      opts.body = requestBody
    }

    // timeout
    let controller: AbortController = new AbortController()
    let timeout: number = props.timeout
    let timeoutId: number = -1
    if (timeout !== FOREVER_TIMEOUT) {
      // 不过期
      requestFetchProps.signal = controller.signal

      // @ts-ignore
      timeoutId = setTimeout(() => {
        controller.abort()
        httpResponse.status = 666
        httpResponse.error = 'Error while get response: can not connect server !'
        HttpRequest.executeFn(props.failed, httpResponse)
        console.error(`Request aborted due to timeout: ${timeout}s !`)
      }, timeout * 1000)
    }

    // request
    let request: Request = new Request(props.url, opts)

    try {
      let response: Response = await fetch(request)

      // validate response
      if (!response.ok) {
        httpResponse.status = response.status
        httpResponse.error = `response error, status code: ${response.status}, status text: ${response.statusText || ''} !`
        HttpRequest.executeFn(props.failed, httpResponse)
        return httpResponse
      }

      // response headers
      let headers: Map<string, string> = new Map()
      let responseHeaders: Headers = response.headers
      responseHeaders.forEach((value: string, key: string) => {
        if (!Utils.isBlank(value) && !Utils.isBlank(key)) {
          headers.set(key.toLowerCase(), value.toLowerCase())
        }
      })
      httpResponse.headers = headers

      let isSuccess = false
      // response type
      if (props.responseType === Type.JSON) {
        try {
          httpResponse.body = await response.json()
          isSuccess = true
        } catch (err: any) {
          console.error('Error while get response:', err)
          httpResponse.error = `Error while get response: ${err.message}`
        }
      } else if (props.responseType === Type.FORM_SUBMIT) {
        try {
          httpResponse.body = await response.text()
          isSuccess = true
        } catch (err: any) {
          console.error('Error while get response:', err)
          httpResponse.error = `Error while get response: ${err.message}`
        }
      } else if (props.responseType === Type.FORM_DATA) {
        try {
          httpResponse.body = await response.formData()
          isSuccess = true
        } catch (err: any) {
          console.error('Error while get response:', err)
          httpResponse.error = `Error while get response: ${err.message}`
        }
      } else if (props.responseType === Type.BLOB) {
        try {
          httpResponse.body = await response.blob()
          isSuccess = true
        } catch (err: any) {
          console.error('Error while get response:', err)
          httpResponse.error = `Error while get response: ${err.message}`
        }
      } else {
        try {
          httpResponse.body = await response.text()
          isSuccess = true
        } catch (err: any) {
          console.error('Error while get response:', err)
          httpResponse.error = `Error while get response: ${err.message}`
        }
      }

      HttpRequest.executeFn(isSuccess ? props.success : props.failed, httpResponse)
      return httpResponse
    } catch (err: any) {
      console.error(`Error while get response: ${err.message}`)
      httpResponse.status = 500
      httpResponse.error = `Error while get response: ${err.message}`
      HttpRequest.executeFn(props.failed, httpResponse)
      return httpResponse
    } finally {
      if (timeoutId !== -1) {
        clearTimeout(timeoutId)
      }
    }
  }

  /**
   * 检查字段是否满足要求
   * @param props
   */
  private static validate(props: IHttpRequestProps): IRequestProps {
    let requestProps: IRequestProps = {
      url: '',
      method: Method.POST,
      body: null,
      headers: new Headers(),
      type: Type.JSON,
      responseType: Type.JSON,
      timeout: DEFAULT_TIMEOUT,
      success: null,
      failed: null,
    }

    // url
    if (!Utils.isBlank(props.url)) {
      requestProps.url = props.url
    }

    // method
    if (!Utils.isBlank(props.method)) {
      let key = HttpRequest.getKeyByEnumValue(props.method || '', Method)
      if (key !== undefined) {
        requestProps.method = Method[key]
      }
    }

    // body
    if (props.data) {
      requestProps.body = props.data
    }

    // type
    if (!Utils.isBlank(props.type)) {
      let key = HttpRequest.getKeyByEnumValue(props.type || '', Type)
      if (key !== undefined) {
        requestProps.type = Type[key]
      }
    }

    // response type
    if (!Utils.isBlank(props.responseType)) {
      let key = HttpRequest.getKeyByEnumValue(props.responseType || '', Type)
      if (key !== undefined) {
        requestProps.responseType = Type[key]
      }
    }

    // headers
    if (props.headers !== undefined && props.headers !== null) {
      if (!Utils.isObjectNull(props.headers)) {
        requestProps.headers = HttpRequest.prepareHeaders(props.headers, requestProps.type)
      }
    }

    // timeout
    if (props.timeout !== undefined && props.timeout !== null) {
      if (props.timeout === FOREVER_TIMEOUT) {
        // -1 为不过期
        requestProps.timeout = FOREVER_TIMEOUT
      } else if (props.timeout > 0) {
        requestProps.timeout = props.timeout
      }
    }

    // success
    if (props.success !== undefined && props.success !== null) {
      if (typeof props.success === 'function') {
        requestProps.success = props.success
      }
    }

    // failed
    if (props.failed !== undefined && props.failed !== null) {
      if (typeof props.failed === 'function') {
        requestProps.failed = props.failed
      }
    }

    return requestProps
  }

  /**
   * 设置 fetch options
   * @private
   */
  private static prepareFetchOptions(props?: IHttpRequestFetchProps): IRequestFetchProps {
    let fetchProps: IRequestFetchProps = {
      cache: RequestCache.DEFAULT,
      credentials: RequestCredentials.SAME_ORIGIN,
      integrity: '',
      mode: RequestMode.CORS,
      redirect: RequestRedirect.FOLLOW,
      referrer: '',
      referrerPolicy: ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN,
      signal: undefined,
    }

    if (props === null || props === undefined) {
      return fetchProps
    }

    // cache
    if (!Utils.isBlank(props.cache)) {
      let key = HttpRequest.getKeyByEnumValue(props.cache || '', RequestCache)
      if (key !== undefined) {
        fetchProps.cache = RequestCache[key]
      }
    }

    // credentials
    if (!Utils.isBlank(props.credentials)) {
      let key = HttpRequest.getKeyByEnumValue(props.credentials || '', RequestCredentials)
      if (key !== undefined) {
        fetchProps.credentials = RequestCredentials[key]
      }
    }

    // integrity
    if (!Utils.isBlank(props.integrity)) {
      fetchProps.integrity = props.integrity || ''
    }

    // mode
    if (!Utils.isBlank(props.mode)) {
      let key = HttpRequest.getKeyByEnumValue(props.mode || '', RequestMode)
      if (key !== undefined) {
        fetchProps.mode = RequestMode[key]
      }
    }

    // redirect
    if (!Utils.isBlank(props.redirect)) {
      let key = HttpRequest.getKeyByEnumValue(props.redirect || '', RequestRedirect)
      if (key !== undefined) {
        fetchProps.redirect = RequestRedirect[key]
      }
    }

    // referrer
    if (!Utils.isBlank(props.referrer)) {
      fetchProps.referrer = props.referrer || ''
    }

    // referrerPolicy
    if (!Utils.isBlank(props.referrerPolicy)) {
      let key = HttpRequest.getKeyByEnumValue(props.referrerPolicy || '', ReferrerPolicy)
      if (key !== undefined) {
        fetchProps.referrerPolicy = ReferrerPolicy[key]
      }
    } else {
      fetchProps.referrerPolicy = ReferrerPolicy.NONE
    }

    return fetchProps
  }

  /**
   * 设置请求 Headers, 默认为 json
   * @private
   */
  private static prepareHeaders(headers: { [K: string]: string }, type: Type): Headers {
    let requestHeaders: Headers = new Headers()

    let keys: Array<string> = Object.keys(headers) || []
    keys.forEach((key: string) => {
      let value: string = headers[key] || ''
      if (!Utils.isBlank(key) && !Utils.isBlank(value)) {
        requestHeaders.append(key, value)
      }
    })

    if (type === Type.FORM_SUBMIT) {
      requestHeaders.append(CONTENT_TYPE, CONTENT_TYPE_VALUE.FORM_SUBMIT)
    } else if (type === Type.FORM_DATA) {
      requestHeaders.append(CONTENT_TYPE, CONTENT_TYPE_VALUE.FORM_DATA)
    } else if (type === Type.BLOB) {
      requestHeaders.append(CONTENT_TYPE, CONTENT_TYPE_VALUE.BLOB)
    } else if (type === Type.TEXT) {
      requestHeaders.append(CONTENT_TYPE, CONTENT_TYPE_VALUE.TEXT)
    } else if (type === Type.HTML) {
      requestHeaders.append(CONTENT_TYPE, CONTENT_TYPE_VALUE.HTML)
    } else {
      // default `json`
      requestHeaders.append(CONTENT_TYPE, CONTENT_TYPE_VALUE.JSON)
    }

    return requestHeaders
  }

  /**
   * 执行函数
   */
  private static executeFn(fn: Function | undefined | null, httpResponse: HttpResponse) {
    if (fn !== undefined && fn !== null) {
      if (typeof fn === 'function') {
        fn(httpResponse)
      } else {
        console.error('execute function error, `fn` is not a `function` !')
      }
    }
  }

  /**
   * 根据枚举 key 获取 value
   * @param value
   * @param enumType
   * @private
   */
  private static getKeyByEnumValue<T extends string>(value: string, enumType: { [key: string]: T }): T | undefined {
    if (!Object.values(enumType).includes(value.toLowerCase() as T)) {
      return undefined
    }

    const keys = Object.keys(enumType) || []
    for (const key of keys) {
      if (enumType[key].toLowerCase() === value.toLowerCase()) {
        return key as T
      }
    }

    return undefined
  }
}
