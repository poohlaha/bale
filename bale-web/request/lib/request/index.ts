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
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
}

export interface IHttpRequestProps {
  url: string
  method?: string
  data?: any
  type?: string
  timeout?: number
  headers?: Map<string, string>
  success?: Function
  failed?: Function
}

export interface IHttpRequestFetchProps {
  cache: string
  credentials: string
  integrity: string
  mode: string
  redirect: string
  referrer: string
  referrerPolicy: string
}

interface IRequestProps {
  url: string
  method: Method
  body: any
  headers: Headers
  type: Type
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

interface HttpResponse {
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
  public static async send(props: IHttpRequestProps, fetchProps?: IHttpRequestFetchProps): Promise<void> {
    // response
    let response: HttpResponse = {
      status: SUCCESS_CODE,
      headers: new Map(),
      body: null,
      error: '',
    }

    // not support
    if (!HttpRequest.isSupport()) {
      response.status = 500
      response.error = 'The browser does not support `Web API request` !'
      HttpRequest.executeFn(props.failed, response)
      return
    }

    let requestProps: IRequestProps = HttpRequest.validate(props)

    // validate url
    if (Utils.isBlank(requestProps.url)) {
      response.status = 500
      response.error = '`url` field in `props` is empty !'
      HttpRequest.executeFn(props.failed, response)
      return
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
  private static async getResponse(props: IRequestProps, httpResponse: HttpResponse, fetchProps?: IHttpRequestFetchProps): Promise<void> {
    // fetch options
    let requestFetchProps: IRequestFetchProps = HttpRequest.prepareFetchOptions(fetchProps)

    // timeout
    let controller: AbortController = new AbortController()
    let timeout: number = props.timeout
    let timeoutId: number = -1
    if (timeout !== FOREVER_TIMEOUT) {
      // 不过期
      // @ts-ignore
      timeoutId = setTimeout(() => {
        controller.abort()
        console.error(`Request aborted due to timeout: ${timeout}s !`)
      }, timeout)
    }

    // request
    let request: Request = new Request(props.url, {
      method: Method[props.method],
      body: props.body || null,
      headers: props.headers,
      ...requestFetchProps,
    })

    try {
      let response: Response = await fetch(request)

      // validate response
      if (!response.ok) {
        httpResponse.status = response.status
        httpResponse.error = `response error, status code: ${response.status}, status text: ${response.statusText || ''} !`
        HttpRequest.executeFn(props.failed, httpResponse)
        return
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
      if (props.type === Type.JSON) {
        try {
          httpResponse.body = await response.json()
          isSuccess = true
        } catch (err: any) {
          console.error('Error while get response:', err)
          httpResponse.error = `Error while get response: ${err.message}`
        }
      } else if (props.type === Type.FORM_SUBMIT) {
        try {
          httpResponse.body = await response.text()
          isSuccess = true
        } catch (err: any) {
          console.error('Error while get response:', err)
          httpResponse.error = `Error while get response: ${err.message}`
        }
      } else if (props.type === Type.FORM_DATA) {
        try {
          httpResponse.body = await response.formData()
          isSuccess = true
        } catch (err: any) {
          console.error('Error while get response:', err)
          httpResponse.error = `Error while get response: ${err.message}`
        }
      } else if (props.type === Type.BLOB) {
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
    } catch (err: any) {
      console.error(`Error while get response: ${err.message}`)
      httpResponse.status = 500
      httpResponse.error = `Error while get response: ${err.message}`
      HttpRequest.executeFn(props.failed, httpResponse)
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
      let method: Method = (props.method || '').toUpperCase() as Method
      if (Object.values(Method).includes(method)) {
        requestProps.method = Method[method]
      }
    }

    // body
    if (!props.data) {
      requestProps.body = props.data
    }

    // type
    if (!Utils.isBlank(props.type)) {
      let type: Type = (props.type || '').toUpperCase() as Type
      if (Object.values(Type).includes(type)) {
        requestProps.type = Type[type]
      }
    }

    // headers
    if (props.headers !== undefined && props.headers !== null) {
      if (props.headers.size > 0) {
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
      mode: RequestMode.NO_CORS,
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
      let cache: RequestCache = (props.cache || '').toUpperCase() as RequestCache
      if (Object.values(RequestCache).includes(cache)) {
        fetchProps.cache = RequestCache[cache]
      }
    }

    // credentials
    if (!Utils.isBlank(props.credentials)) {
      let credentials: RequestCredentials = (props.credentials || '').toUpperCase() as RequestCredentials
      if (Object.values(RequestCredentials).includes(credentials)) {
        fetchProps.credentials = RequestCredentials[credentials]
      }
    }

    // integrity
    if (!Utils.isBlank(props.integrity)) {
      fetchProps.integrity = props.integrity
    }

    // mode
    if (!Utils.isBlank(props.mode)) {
      let mode: RequestMode = (props.mode || '').toUpperCase() as RequestMode
      if (Object.values(RequestMode).includes(mode)) {
        fetchProps.credentials = RequestMode[mode]
      }
    }

    // redirect
    if (!Utils.isBlank(props.redirect)) {
      let redirect: RequestRedirect = (props.redirect || '').toUpperCase() as RequestRedirect
      if (Object.values(RequestRedirect).includes(redirect)) {
        fetchProps.credentials = RequestRedirect[redirect]
      }
    }

    // referrer
    if (!Utils.isBlank(props.referrer)) {
      fetchProps.referrer = props.referrer
    }

    // referrerPolicy
    if (!Utils.isBlank(props.referrerPolicy)) {
      let referrerPolicy: ReferrerPolicy = (props.referrerPolicy || '').toUpperCase() as ReferrerPolicy
      if (Object.values(ReferrerPolicy).includes(referrerPolicy)) {
        fetchProps.referrerPolicy = ReferrerPolicy[referrerPolicy]
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
  private static prepareHeaders(headers: Map<string, string>, type: Type): Headers {
    let requestHeaders: Headers = new Headers()

    headers.forEach((value: string, key: string) => {
      if (!Utils.isBlank(value) && !Utils.isBlank(key)) {
        requestHeaders.append(key.toLowerCase(), value.toLowerCase())
      }
    })

    if (type === Type.JSON) {
      requestHeaders.append(CONTENT_TYPE, CONTENT_TYPE_VALUE.JSON)
    } else if (type === Type.FORM_SUBMIT) {
      requestHeaders.append(CONTENT_TYPE, CONTENT_TYPE_VALUE.FORM_SUBMIT)
    } else if (type === Type.FORM_DATA) {
      requestHeaders.append(CONTENT_TYPE, CONTENT_TYPE_VALUE.FORM_DATA)
    } else if (type === Type.BLOB) {
      requestHeaders.append(CONTENT_TYPE, CONTENT_TYPE_VALUE.BLOB)
    } else if (type === Type.TEXT) {
      requestHeaders.append(CONTENT_TYPE, CONTENT_TYPE_VALUE.TEXT)
    } else if (type === Type.HTML) {
      requestHeaders.append(CONTENT_TYPE, CONTENT_TYPE_VALUE.HTML)
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
}
