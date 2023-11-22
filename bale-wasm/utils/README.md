# wasm-utils

使用 `rust` 开发 `wasm`

## Usage
To use `wasm`, first import this to your file:

```ts
import __wbg_init, {UtilsHandler, SignatureHandler, DateHandler} from '@bale-wasm/utils/lib/bale_wasm_utils.js'
```

Next, add this to your file:

```ts
__wbg_init.init()
// ...
```

## Descriptions

- `UtilsHandler`: 公共助手
- `SignatureHandler`: 签名相关的助手
- `DateHandler`: 日期相关的助手

## Examples

- 创建 `UUID`
```ts
UtilsHandler.generate_uuid()
```

- `AES` 加减密
`AES` 数据块大小为 `128bit`

```ts
let encrypt = SignatureHandler.encrypt("connecting ...")
let decrypt = SignatureHandler.decrypt(encrypt)
```

- `Base64` 加减密

```ts
let data = {'name':'BeJson','url':'http://www.bejson.com','page':88,'isNonProfit':true,'address':{'street':'科技园路.','city':'江苏苏州','country':'中国'},'links':[{'name':'Google','url':'http://www.google.com'},{'name':'Baidu','url':'http://www.baidu.com'},{'name':'SoSo','url':'http://www.SoSo.com'}]}
let encode = SignatureHandler.encode(JSON.stringify(data))
let decode = SignatureHandler.decode(encode)
```

- 格式化数字

```ts
let number1 = 12234345.23456;
UtilsHandler::format_float(number1, None); // 12,234,345.23456
UtilsHandler::format_float(number1, Some(3)); // 12,234,345.235

let number2 = 12234345;
UtilsHandler::format_integer(number2); // 12,234,345

number3 = -12234345;
UtilsHandler::format_integer(number3); // -12,234,345
```

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
let date = "2023-02-14 17:23:35";
DateHandler.format(date) // 2023-02-14
DateHandler.format(date, "%a %b %e %T %Y") // Tue Feb 14 17:23:35 2023
DateHandler.format(date, "%a %b %e %I:%M:%S %Y") // Tue Feb 14 05:23:35 2023
DateHandler.format(date, "%A %e %B %Y, %T") // Tuesday 14 February 2023, 17:23:35
DateHandler.format(date, "%I:%M:%S %p") // 05:23:35 PM
DateHandler.format("Fri Nov 28 12:00:09 2014", undefined, "%a %b %e %T %Y") // 2014-22-28
DateHandler.format("2014-11-28T12:00:09Z") // 2014-22-28
DateHandler.format("2014-11-28T21:00:09+09:00") // 2014-22-28
DateHandler.format("Fri, 28 Nov 2014 21:00:09 +0900") // 2014-22-28

// 根据时间戳获取日期
let format_date10 = DateHandler.get_date_by_timestamp(BigInt(new Date().getTime())) // 2023-11-22

// 日期补全
let format_date11 = DateHandler.format("2023-2-7 7:23:35", "%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M:%S") // 2023-02-07 07：23：35

// 获取当前时间
let current_date = DateHandler.get_current_date("%Y%m%d"); // 20231122
```

# License
Apache License, Version 2.0 ([LICENSE](LICENSE) or https://apache.org/licenses/LICENSE-2.0)

