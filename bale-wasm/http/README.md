# wasm-http

use `rust` develop `wasm` `http` by `Web API Request`。

## Usage
It is necessary to determine whether the browser supports `wasm`：

```ts
if (typeof WebAssembly === 'object' && typeof WebAssembly.instantiate === 'function') {
    // 浏览器支持WebAssembly
    console.log('WebAssembly is supported')
} else {
    // 浏览器不支持WebAssembly
    console.log('WebAssembly is not supported')
}
```

To use `wasm`, first import this to your file:

```shell
npm install @bale-wasm/http
```

```ts
import {send} from '@bale-wasm/http/lib/wasm_http'
```

## Explanation

- Request
  文档地址: https://developer.mozilla.org/zh-CN/docs/Web/API/Request

- opts
  定义了 `url`、`method`、`data`、`form`、`headers` 等属性。

  - url
    `string` 类型, 全路径。

  - method
    可选 `string` 类型, `POST` 和 `GET`, 默认为 `POST`。

  - form
    `FormData` 类型, 用于文件上传等。

  - headers
    `object` 类型, 定义 `header` 头。

  - timeout
    可选 `number` 类型, 定义 `超时时间`, `-1` 为 `不超时`, 默认为 `30s`。

  - isFormSubmit
    可选 `bool` 类型, 是否通过 `form 表单` 提交。

- request
  定义了 `cache`、`credentials`、`integrity`、`mode`、`redirect`、`referrer`、`referrer_policy`、`referrer_policy`、`signal` 等。

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
    分为: `same-origin`、`cors`、`no-cors`, `navigate` 默认为 `no-cors`。
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
let opts: {[K: string]: any} = {
    url: 'https://api.github.com/repos/rustwasm/wasm-bindgen/branches/master',
    method: 'get',
    headers: {
      Accept: 'application/vnd.github.v3+json'
    }
}

let response = await send(opts, null)
console.log(response)
```

- `FormData` 请求
```ts
let formData = new FormData()
formData.append('file', file) // file 为需要上传的文件
formData.append('version', '1.0')
formData.append('text', '测试')

let updateOpts: any = {
  url: 'https://example.com/api/upload/',
  method: 'post',
  form: formData
}

let response = await send(opts, null)
console.log(response)
```

