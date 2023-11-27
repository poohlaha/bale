# wasm-utils

use `rust` develop `wasm` utils。

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
  npm install @bale-wasm/utils
```

```ts
import __wbg_init, {is_support_wasm, UtilsHandler, SignatureHandler, DateHandler, StorageHandler} from '@bale-wasm/utils/lib/wasm_utils'
```

Next, add this to your file:

```ts
__wbg_init.init()
// ...
```

## Descriptions

- `UtilsHandler`: public Utils
- `SignatureHandler`: signature Utils
- `DateHandler`: date Utils
- `StorageHandler`: storage Utils

## Examples

* 判断是否支持 `wasm`

```ts
is_support_wasm()
```

* UtilsHandler

- 创建 `UUID`

```ts
UtilsHandler.generate_uuid()
```

- 格式化数字

```ts
let number1 = 12234345.23456
UtilsHandler.format_float(number1, undefined) // 12,234,345.23456
UtilsHandler.format_float(number1, 3) // 12,234,345.235

let number2 = 12234345
UtilsHandler.format_integer(number2) // 12,234,345

let number3 = -12234345
UtilsHandler.format_integer(number3) // -12,234,345
```

- 深拷贝

```ts
// object
let data = {'name':'BeJson','url':'http://www.bejson.com','page':88,'isNonProfit':true, callback: () => {console.log('test')},'address':{'street':'科技园路.','city':'江苏苏州','country':'中国'},'links':[{'name':'Google','url':'http://www.google.com', callback: () => {console.log('test')}},{'name':'Baidu','url':'http://www.baidu.com', callback: () => {console.log('test')}},{'name':'SoSo','url':'http://www.SoSo.com', callback: () => {console.log('test')}}]}
let dataCloned = UtilsHandler.deep_copy(data) || {}
dataCloned.name = 'zhangsan'
data.name = '李四'

// array
let arr = [{'name':'BeJson','url':'http://www.bejson.com','page':88,'isNonProfit':true, callback: () => {console.log('test')},'address':{'street':'科技园路.','city':'江苏苏州','country':'中国'},'links':[{'name':'Google','url':'http://www.google.com', callback: () => {console.log('test')}},{'name':'Baidu','url':'http://www.baidu.com', callback: () => {console.log('test')}},{'name':'SoSo','url':'http://www.SoSo.com', callback: () => {console.log('test')}}]}, {'name':'BeJson','url':'http://www.bejson.com','page':88,'isNonProfit':true, callback: () => {console.log('test')},'address':{'street':'科技园路.','city':'江苏苏州','country':'中国'},'links':[{'name':'Google','url':'http://www.google.com', callback: () => {console.log('test')}},{'name':'Baidu','url':'http://www.baidu.com', callback: () => {console.log('test')}},{'name':'SoSo','url':'http://www.SoSo.com', callback: () => {console.log('test')}}]}, {'name':'BeJson','url':'http://www.bejson.com','page':88,'isNonProfit':true, callback: () => {console.log('test')},'address':{'street':'科技园路.','city':'江苏苏州','country':'中国'},'links':[{'name':'Google','url':'http://www.google.com', callback: () => {console.log('test')}},{'name':'Baidu','url':'http://www.baidu.com', callback: () => {console.log('test')}},{'name':'SoSo','url':'http://www.SoSo.com', callback: () => {console.log('test')}}]}]
let arrCloned = UtilsHandler.deep_copy(arr) || []
arr[0].name = 'zhangsan'
arrCloned[0].name = '李四'
```

- 首字母转大写

```ts
UtilsHandler.capitalize_first_char('test1234567') // Test1234567
```

- 驼峰转换下划线

```ts
UtilsHandler.hump_with_line('testItemManager', '-') // test-item-manager
UtilsHandler.hump_with_line('testItemManager', undefined) // test_item_manager
```

- 格式化手机号码

```ts
UtilsHandler.format_phone('13200000000', undefined) // 132 0000 0000
UtilsHandler.format_phone('13200000000', '-') // 132-0000-0000
```

* SignatureHandler

- `AES` 加减密
  `AES` 数据块大小为 `128bit`

```ts
let encrypt = SignatureHandler.encrypt('connecting ...')
let decrypt = SignatureHandler.decrypt(encrypt)
```

- `Base64` 加减密
  `Base64` 必须为 `4` 的倍数, 且不包括除 `+`、`/`、`=` 外的特殊字符

```ts
let data = {'name':'BeJson','url':'http://www.bejson.com','page':88,'isNonProfit':true,'address':{'street':'科技园路.','city':'江苏苏州','country':'中国'},'links':[{'name':'Google','url':'http://www.google.com'},{'name':'Baidu','url':'http://www.baidu.com'},{'name':'SoSo','url':'http://www.SoSo.com'}]}
let encode = SignatureHandler.encode(JSON.stringify(data))
let decode = SignatureHandler.decode(encode)
```

* DateHandler

- `Date`
  - %Y: 表示四位数的年份，例如 2023。
  - %y: 表示两位数的年份，范围是 00 到 99。
  - %m: 表示两位数的月份，范围是 01 到 12。
  - %_m: 表示不补零的月份，范围是 1 到 12
  - %d: 表示两位数的日期，范围是 01 到 31。
  - %e: 表示两位数的日期，范围是 1 到 31。
  - %H: 表示两位数的小时，范围是 00 到 23。
  - %I: 表示两位数的小时，范围是 00 到 12。
  - %k: 表示小时，不补零，范围是 0 到 23。
  - %M: 表示两位数的分钟，范围是 00 到 59。
  - %S: 表示两位数的秒数，范围是 00 到 59。
  - %S: 表示两位数的秒数，范围是 00 到 59。

  - %a: 缩写的星期几名称, 如：Sun、Mon、Tue
  - %b: 缩写的月份名称, 如：Jan、Feb、Mar
  - %e: 日期(1 到 31), 不补零
  - %T: 时间的 24 小时制表示，格式为 HH:MM:SS
  - %A: 完整的星期几名称
  - %B: 完整的月份名称
  - %E: 日期(1 到 31), 不补零
  - %p: 表示上午或下午(AM 或 PM)
  - %Z: 表示时区缩写，如 CST 表示中国标准时间
  - %z: 表示时区偏移，如 +0800 表示东八区，也就是相对于 UTC 的偏移时间

  例:
  - %Y-%m-%d %H:%M:%S => 2014-11-28 12:00:09
  - %a %b %e %T %Y => Fri Nov 28 12:00:09 2014
  - %a %b %e %I:%M:%S %Y => Fri Nov 28 00:00:09 2014
  - %A %e %B %Y, %T => Tuesday 14 February 2023, 17:23:35

```ts
let date = '2023-02-14 17:23:35'
DateHandler.format(date) // 2023-02-14
DateHandler.format(date, '%a %b %e %T %Y') // Tue Feb 14 17:23:35 2023
DateHandler.format(date, '%a %b %e %I:%M:%S %Y') // Tue Feb 14 05:23:35 2023
DateHandler.format(date, '%A %e %B %Y, %T') // Tuesday 14 February 2023, 17:23:35
DateHandler.format(date, '%I:%M:%S %p') // 05:23:35 PM
DateHandler.format('Fri Nov 28 12:00:09 2014', undefined, '%a %b %e %T %Y') // 2014-22-28
DateHandler.format('2014-11-28T12:00:09Z') // 2014-22-28
DateHandler.format('2014-11-28T21:00:09+09:00') // 2014-22-28
DateHandler.format('Fri, 28 Nov 2014 21:00:09 +0900') // 2014-22-28

// 根据时间戳获取日期
let format_date10 = DateHandler.get_date_by_timestamp(BigInt(new Date().getTime())) // 2023-11-22

// 日期补全
let format_date11 = DateHandler.format('2023-2-7 7:23:35', '%Y-%m-%d %H:%M:%S', '%Y-%m-%d %H:%M:%S') // 2023-02-07 07：23：35

// 获取当前时间
let current_date = DateHandler.get_current_date('%Y%m%d') // 20231122
```

* StorageHandler

- 存储和获取 `LocalStorage` 中的数据

```ts
let localData1 = {'name':'BeJson','url':'http://www.bejson.com','page':88,'isNonProfit':true,'address':{'street':'科技园路.','city':'江苏苏州','country':'中国'},'links':[{'name':'Google','url':'http://www.google.com'},{'name':'Baidu','url':'http://www.baidu.com'},{'name':'SoSo','url':'http://www.SoSo.com'}]}
let localDataSuccess1 = StorageHandler.set_local('localData1', localData1)
let localDataValue1 = StorageHandler.get_local('localData1')

let localData2 = [{'name':'BeJson','url':'http://www.bejson.com','page':88,'isNonProfit':true,'address':{'street':'科技园路.','city':'江苏苏州','country':'中国'},'links':[{'name':'Google','url':'http://www.google.com'},{'name':'Baidu','url':'http://www.baidu.com'},{'name':'SoSo','url':'http://www.SoSo.com'}]}, {'name':'BeJson','url':'http://www.bejson.com','page':88,'isNonProfit':true,'address':{'street':'科技园路.','city':'江苏苏州','country':'中国'},'links':[{'name':'Google','url':'http://www.google.com'},{'name':'Baidu','url':'http://www.baidu.com'},{'name':'SoSo','url':'http://www.SoSo.com'}]}, {'name':'BeJson','url':'http://www.bejson.com','page':88,'isNonProfit':true,'address':{'street':'科技园路.','city':'江苏苏州','country':'中国'},'links':[{'name':'Google','url':'http://www.google.com'},{'name':'Baidu','url':'http://www.baidu.com'},{'name':'SoSo','url':'http://www.SoSo.com'}]}]
let localDataSuccess2 = StorageHandler.set_local('localData2', localData2)
let localDataValue2 = StorageHandler.get_local('localData2')
```

- 存储和获取 `SessionStorage` 中的数据

```ts
let sessionData1 = {'name':'BeJson','url':'http://www.bejson.com','page':88,'isNonProfit':true,'address':{'street':'科技园路.','city':'江苏苏州','country':'中国'},'links':[{'name':'Google','url':'http://www.google.com'},{'name':'Baidu','url':'http://www.baidu.com'},{'name':'SoSo','url':'http://www.SoSo.com'}]}
let sessionDataSuccess1 = StorageHandler.set_session('sessionData1', sessionData1)
let sessionDataValue1 = StorageHandler.get_session('sessionData1')

let sessionData2 = [{'name':'BeJson','url':'http://www.bejson.com','page':88,'isNonProfit':true,'address':{'street':'科技园路.','city':'江苏苏州','country':'中国'},'links':[{'name':'Google','url':'http://www.google.com'},{'name':'Baidu','url':'http://www.baidu.com'},{'name':'SoSo','url':'http://www.SoSo.com'}]}, {'name':'BeJson','url':'http://www.bejson.com','page':88,'isNonProfit':true,'address':{'street':'科技园路.','city':'江苏苏州','country':'中国'},'links':[{'name':'Google','url':'http://www.google.com'},{'name':'Baidu','url':'http://www.baidu.com'},{'name':'SoSo','url':'http://www.SoSo.com'}]}, {'name':'BeJson','url':'http://www.bejson.com','page':88,'isNonProfit':true,'address':{'street':'科技园路.','city':'江苏苏州','country':'中国'},'links':[{'name':'Google','url':'http://www.google.com'},{'name':'Baidu','url':'http://www.baidu.com'},{'name':'SoSo','url':'http://www.SoSo.com'}]}]
let sessionDataSuccess2 = StorageHandler.set_session('sessionData2', sessionData2)
let sessionDataValue2 = StorageHandler.get_session('sessionData2')
```

- 存储和获取 `Cookie` 中的数据

```ts
let cookieData1 = {'name':'BeJson','url':'http://www.bejson.com','page':88,'isNonProfit':true,'address':{'street':'科技园路.','city':'江苏苏州','country':'中国'},'links':[{'name':'Google','url':'http://www.google.com'},{'name':'Baidu','url':'http://www.baidu.com'},{'name':'SoSo','url':'http://www.SoSo.com'}]}
let cookieDataSuccess1 = StorageHandler.set_cookie('cookieData1', cookieData1)
let cookieDataValue1 = StorageHandler.get_cookie('cookieData1')

let cookieData2 = [{'name':'BeJson','url':'http://www.bejson.com','page':88,'isNonProfit':true, callback: () => {console.log('test')},'address':{'street':'科技园路.','city':'江苏苏州','country':'中国'},'links':[{'name':'Google','url':'http://www.google.com', callback: () => {console.log('test')}},{'name':'Baidu','url':'http://www.baidu.com', callback: () => {console.log('test')}},{'name':'SoSo','url':'http://www.SoSo.com', callback: () => {console.log('test')}}]}, {'name':'BeJson','url':'http://www.bejson.com','page':88,'isNonProfit':true, callback: () => {console.log('test')},'address':{'street':'科技园路.','city':'江苏苏州','country':'中国'},'links':[{'name':'Google','url':'http://www.google.com', callback: () => {console.log('test')}},{'name':'Baidu','url':'http://www.baidu.com', callback: () => {console.log('test')}},{'name':'SoSo','url':'http://www.SoSo.com', callback: () => {console.log('test')}}]}, {'name':'BeJson','url':'http://www.bejson.com','page':88,'isNonProfit':true, callback: () => {console.log('test')},'address':{'street':'科技园路.','city':'江苏苏州','country':'中国'},'links':[{'name':'Google','url':'http://www.google.com', callback: () => {console.log('test')}},{'name':'Baidu','url':'http://www.baidu.com', callback: () => {console.log('test')}},{'name':'SoSo','url':'http://www.SoSo.com', callback: () => {console.log('test')}}]}]
let cookieDataSuccess2 = StorageHandler.set_cookie('cookieData2', cookieData2)
let cookieDataValue2 = StorageHandler.get_cookie('cookieData2')
```

- 清空 `LocalStorage`

```ts
StorageHandler.clear_local()
```

- 清空 `SessionStorage`

```ts
StorageHandler.clear_session()
```

- 清空 `Cookie`

```ts
StorageHandler.clear_cookie()
```

# License
Apache License, Version 2.0 ([LICENSE](LICENSE) or https://apache.org/licenses/LICENSE-2.0)
