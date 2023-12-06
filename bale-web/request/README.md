## Request

使用 `Web Api Request` 发送请求。

## Usage

```shell
npm install @bale-web/request
```

## Explanation

- Request
  文档地址: https://developer.mozilla.org/zh-CN/docs/Web/API/Request

- props
  定义了 `url`、`method`、`data`、`form`、`headers` 等属性。

  - url
    `string` 类型, 全路径。

  - method
    可选 `string` 类型, `POST` 、`GET`、`PUT`、`DELETE`, 默认为 `POST`。

  - data
    需要传输的数据。

  - type
    可选 `string` 类型, `0(JSON)` 、`1(FORM_SUBMIT)`、`2(FORM_DATA)`、`3(BLOB)`、`4(TEXT)`、`3(HTML)`, 默认为 `0(JSON)`。

  - timeout
    可选 `number` 类型, 定义 `超时时间`, `-1` 为 `不超时`, 默认为 `30s`。

  - headers
    `Map` 类型, 定义 `header` 头。

  - success
    可选 `函数` 类型, 成功回调函数。

  - failed
    可选 `函数` 类型, 失败回调函数。

- fetchProps
  定义了 `cache`、`credentials`、`integrity`、`mode`、`redirect`、`referrer`、`referrer_policy`、`signal` 等。

  - cache
    分为: `default`、`no-store`、`reload`、`no-cache`、`force-cache`、`only-if-cached`, 默认为 `default`。
    文档地址: https://developer.mozilla.org/zh-CN/docs/Web/API/Request/cache

  - credentials
    分为: `omit`、`same-origin`、`include`, 默认为 `same-origin`。
    文档地址: https://developer.mozilla.org/zh-CN/docs/Web/API/Request/credentials

  - integrity
    可选 `string` 类型。
    文档地址: https://developer.mozilla.org/en-US/docs/Web/API/Request/integrity

  - mode
    分为: `same-origin`、`cors`、`no-cors`, `navigate` 默认为 `cors`。
    文档地址: https://developer.mozilla.org/zh-CN/docs/Web/API/Request/mode

  - redirect
    分为: `follow`、`error`、`manual`, 默认为 `follow`。
    文档地址: https://developer.mozilla.org/en-US/docs/Web/API/Request/redirect

  - referrer
    可选 `string` 类型。
    文档地址: https://developer.mozilla.org/en-US/docs/Web/API/Request/referrer

  - referrerPolicy
    分为: `none`、`no-referrer`、`no-referrer-when-downgrade`、`origin`、`origin-when-cross-origin`、`unsafe-url`、`same-origin`、`strict-origin`、`strict-origin-when-cross-origin`, 默认为 `strict-origin-when-cross-origin`。
    文档地址: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referrer-Policy

## Examples

- 普通请求

```ts
import { HttpRequest, IHttpRequestProps, HttpResponse } from '@bale-web/request'

let opts: IHttpRequestProps = {
  url: 'https://api.github.com/repos/rustwasm/wasm-bindgen/branches/master',
  method: 'get',
  headers: {
    Accept: 'application/vnd.github.v3+json',
  },
}

let response: HttpResponse = await HttpRequest.send(opts)
console.log(response)
```

- 普通请求(带`成功` 、`失败` 函数)

```ts
import { HttpRequest, IHttpRequestProps, HttpResponse } from '@bale-web/request'

let opts: IHttpRequestProps = {
  url: 'https://api.github.com/repos/rustwasm/wasm-bindgen/branches/master',
  method: 'get',
  headers: {
    Accept: 'application/vnd.github.v3+json',
  },
  success: (response: HttpResponse) => {
    console.log('success: ', response)
  },
  failed: (response: HttpResponse) => {
    console.error('failed: ', response)
  },
}

await HttpRequest.send(opts)
```

- 普通请求(带 `fetch` 参数)

```ts
import { HttpRequest, IHttpRequestProps, IHttpRequestFetchProps, HttpResponse } from '@bale-web/request'
let fetchOps: IHttpRequestFetchProps = {
  cache: 'no-cache',
  credentials: 'omit',
  integrity: '',
  mode: 'CORS',
  redirect: '',
  referrer: 'origin-when-cross-origin',
  referrerPolicy: 'origin-when-cross-origin',
}

let opts: IHttpRequestProps = {
  url: 'https://api.github.com/repos/rustwasm/wasm-bindgen/branches/master',
  method: 'get',
  headers: {
    Accept: 'application/vnd.github.v3+json',
  },
  success: (response: HttpResponse) => {
    console.log('success: ', response)
  },
  failed: (response: HttpResponse) => {
    console.error('failed: ', response)
  },
}

await HttpRequest.send(opts, fetchOps)
```

- `FormData` 请求

```ts
import { HttpRequest, IHttpRequestProps, HttpResponse } from '@bale-web/request'

let formData = new FormData()
formData.append('file', file) // file 为需要上传的文件
formData.append('version', '1.0')
formData.append('text', '测试')

let updateOpts: any = {
  url: 'https://example.com/api/upload/',
  method: 'post',
  data: formData,
  type: '2',
}

let response = await HttpRequest.send(opts)
console.log(response)
```
