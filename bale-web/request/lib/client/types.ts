// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//   /!\ DO NOT MODIFY THIS FILE /!\
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// 使用 Web API Request 发送请求公共属性
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//   /!\ DO NOT MODIFY THIS FILE /!\
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

/**
 * @fileOverview client
 * @doc https://developer.mozilla.org/zh-CN/docs/Web/API/Request
 * @date 2023-12-05
 * @author poohlaha
 */
export enum Method {
  GET = 'get',
  POST = 'post',
  PUT = 'put',
  DELETE = 'delete'
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

export interface IRequestProps {
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

export interface IRequestFetchProps {
  cache: RequestCache
  credentials: RequestCredentials
  integrity: string
  mode: RequestMode
  redirect: RequestRedirect
  referrer: string
  referrerPolicy: ReferrerPolicy
  signal?: AbortSignal
}

export enum RequestCache {
  DEFAULT = 'default',
  FORCE_CACHE = 'force-cache',
  NO_CACHE = 'no-cache',
  NO_STORE = 'no-store',
  ONLY_IF_CACHED = 'only-if-cached',
  RELOAD = 'reload'
}

export enum RequestCredentials {
  INCLUDE = 'include',
  OMIT = 'omit',
  SAME_ORIGIN = 'same-origin'
}

export enum RequestMode {
  CORS = 'cors',
  NAVIGATE = 'navigate',
  NO_CORS = 'no-cors',
  SAME_ORIGIN = 'same-origin'
}

export enum RequestRedirect {
  ERROR = 'error',
  FOLLOW = 'follow',
  MANUAL = 'manual'
}

export enum ReferrerPolicy {
  NONE = '',
  NO_REFERRER = 'no-referrer',
  NO_REFERRER_WHEN_DOWNGRADE = 'no-referrer-when-downgrade',
  ORIGIN = 'origin',
  ORIGIN_WHEN_CROSS_ORIGIN = 'origin-when-cross-origin',
  SAME_ORIGIN = 'same-origin',
  STRICT_ORIGIN = 'strict-origin',
  STRICT_ORIGIN_WHEN_CROSS_ORIGIN = 'strict-origin-when-cross-origin',
  UNSAFE_URL = 'unsafe-url'
}

export interface HttpResponse {
  status: number
  headers: Map<string, string>
  body: JSON | Blob | string | number | Array<any> | null | any
  error: string
}

// const CONTENT_DISPOSITION: string = 'content-disposition'

export enum Type {
  JSON = '0',
  FORM_SUBMIT = '1',
  FORM_DATA = '2',
  BLOB = '3',
  TEXT = '4',
  HTML = '5',
  READER = '6',
  CUSTOMER = '7'
}

export enum CONTENT_TYPE_VALUE {
  JSON = 'application/json;charset=UTF-8',
  FORM_SUBMIT = 'application/x-www-form-urlencoded',
  FORM_DATA = 'multipart/form-data',
  BLOB = 'application/octet-stream',
  TEXT = 'text/plain;charset=UTF-8',
  HTML = 'text/html;charset=UTF-8'
}

export const CONTENT_TYPE: string = 'content-type'

export const SUCCESS_CODE: number = 200
export const DEFAULT_TIMEOUT: number = 30
export const FOREVER_TIMEOUT: number = -1