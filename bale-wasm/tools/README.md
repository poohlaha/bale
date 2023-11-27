# wasm-tools

use `rust` develop `wasm` tools。

# Usage
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
npm install @bale-wasm/tools
```

```ts
import {send, send_form_data} from '@bale-wasm/tools/lib/wasm_tools'
```

## Examples

* Http
- 发送普通请求

```ts
let opts: {[K: string]: any} = {
    url: 'https://api.github.com/repos/rustwasm/wasm-bindgen/branches/master',
    method: 'get',
    headers: {
        Accept: 'application/vnd.github.v3+json'
    }
}
await send(opts)
```

- 发送 `FormData` 请求

```ts
let formData = new FormData();
formData.set('version', '1.0')
formData.set('user', '张三')
formData.set('files', '/usr/local/test.zip')

let opts: {[K: string]: any}  = {
    url: 'https://example.com/upload/',
    method: 'post',
    form: formData
}
```
