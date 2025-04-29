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
import { HttpResponse, IHttpRequestFetchProps, IHttpRequestProps } from './types'
import { Client } from './client'

export class HttpRequest {
  /**
   * 发送请求
   * @param props
   * @param fetchProps
   */
  // @ts-ignore
  public static async send(props: IHttpRequestProps, fetchProps?: IHttpRequestFetchProps): Promise<HttpResponse> {
    const client = new Client()
    return await client.send(props, fetchProps)
  }
}

export class HttpRequestAbort {
  private client: Client | null = null

  /**
   * 发送请求
   * @param props
   * @param fetchProps
   */
  // @ts-ignore
  public async send(props: IHttpRequestProps, fetchProps?: IHttpRequestFetchProps): Promise<HttpResponse> {
    this.client = new Client()
    return await this.client?.send(props, fetchProps)
  }

  /**
   * 添加中断功能
   */
  public abort() {
    this.client?.abort()
  }
}
