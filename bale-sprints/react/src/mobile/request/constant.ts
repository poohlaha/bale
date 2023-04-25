export enum MethodEnum {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
}

export enum RequestTypeEnum {
  'REQUEST' = 'REQUEST',
  'REFRESH' = 'REFRESH',
  'UPLOAD' = 'UPLOAD',
  'NONE' = 'NONE',
}

export enum IdentEnum {
  LOGIN = 0,
  LOGOUT = 1,
  OTHER = -1,
}

type Method = MethodEnum
type RequestType = RequestTypeEnum

interface ConstantComponent {
  url: string
  baseURL?: string
  method?: Method
  data?: { [P: string]: unknown }
  requestType?: RequestType
  queue?: Array<RequestConstant>
  ident?: IdentEnum
  type?: string
  responseType?: string
  responseStream?: boolean
  headers?: { [key: string]: unknown }
  params?: { [key: string]: unknown }
  showError?: boolean
}

interface FunctionComponent<T> {
  success: (data: { [P: string]: unknown }, resData?: { [P: string]: unknown }, params?: { [key: string]: unknown }) => T extends (...args: any[]) => infer Boolean ? boolean : void
  fail?: (data: { [P: string]: unknown }, params?: { [key: string]: unknown }) => T extends (Boolean) => infer Boolean ? boolean : void
}

type RequestConfigType = ConstantComponent & FunctionComponent<any>
type RequestConfig<T> = { [P in keyof T]: T[P] | null }
export type RequestConstant = RequestConfig<RequestConfigType>
export type RequestOptions = {
  url: string
  method: MethodEnum
  data: { [P: string]: unknown }
  responseType: string
  headers?: { [key: string]: unknown }
}
