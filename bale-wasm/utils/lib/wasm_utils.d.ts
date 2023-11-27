/* tslint:disable */
/* eslint-disable */
/**
*
*  浏览器是否支持 `wasm`
* @returns {boolean}
*/
export function is_support_wasm(): boolean;
/**
*/
export class DateHandler {
  free(): void;
/**
*
*      格式化日期:
*        - %Y: 表示四位数的年份，例如 2022。
*        - %y: 表示两位数的年份，范围是 00 到 99。
*        - %m: 表示两位数的月份，范围是 01 到 12。
*        - %_m: 表示不补零的月份，范围是 1 到 12
*        - %d: 表示两位数的日期，范围是 01 到 31。
*        - %e: 表示两位数的日期，范围是 1 到 31。
*        - %H: 表示两位数的小时，范围是 00 到 23。
*        - %I: 表示两位数的小时，范围是 00 到 12。
*        - %k: 表示小时，不补零，范围是 0 到 23。
*        - %M: 表示两位数的分钟，范围是 00 到 59。
*        - %S: 表示两位数的秒数，范围是 00 到 59。
*        - %S: 表示两位数的秒数，范围是 00 到 59。
*
*        - %a: 缩写的星期几名称, 如：Sun、Mon、Tue
*        - %b: 缩写的月份名称, 如：Jan、Feb、Mar
*        - %e: 日期(1 到 31), 不补零
*        - %T: 时间的 24 小时制表示，格式为 HH:MM:SS
*        - %A: 完整的星期几名称
*        - %B: 完整的月份名称
*        - %E: 日期(1 到 31), 不补零
*        - %p: 表示上午或下午(AM 或 PM)
*        - %Z: 表示时区缩写，如 CST 表示中国标准时间
*        - %z: 表示时区偏移，如 +0800 表示东八区，也就是相对于 UTC 的偏移时间
*
*        例:
*          - %Y-%m-%d %H:%M:%S => 2014-11-28 12:00:09
*          - %a %b %e %T %Y => Fri Nov 28 12:00:09 2014
*          - %a %b %e %I:%M:%S %Y => Fri Nov 28 00:00:09 2014
*          - %A %e %B %Y, %T => Tuesday 14 February 2023, 17:23:35
*
*        date: 需要输入的日期字符串
*        old_format: 原来的格式, 默认为 `%Y-%m-%d %H:%M:%S`
*        format: 需要的格式, 默认为 `%Y-%m-%d`
*    
* @param {string} date
* @param {string | undefined} [format]
* @param {string | undefined} [old_format]
* @returns {string}
*/
  static format(date: string, format?: string, old_format?: string): string;
/**
*
*     根据时间戳获取时间
*      date: 时间戳
*      format: 需要的格式, 默认为 `%Y-%m-%d`
*    
* @param {bigint} timestamp
* @param {string | undefined} [format]
* @returns {string}
*/
  static get_date_by_timestamp(timestamp: bigint, format?: string): string;
/**
*
*      获取当前时间
*      format: 需要的格式, 默认为 `%Y-%m-%d`
*    
* @param {string | undefined} [format]
* @returns {string}
*/
  static get_current_date(format?: string): string;
}
/**
*/
export class SignatureHandler {
  free(): void;
/**
*
*       AES 加密, 块大小通常是 16 字节（128 位）
*    
* @param {string} data
* @returns {string}
*/
  static encrypt(data: string): string;
/**
*
*     AES 解密
*    
* @param {string} data
* @returns {string}
*/
  static decrypt(data: string): string;
/**
*
*     base64 encode
*    
* @param {string} data
* @returns {string}
*/
  static encode(data: string): string;
/**
*
*      base64 decode
*    
* @param {string} data
* @returns {string}
*/
  static decode(data: string): string;
}
/**
*/
export class StorageHandler {
  free(): void;
/**
*
*     存储到 `LocalStorage`
*    
* @param {string} name
* @param {any} item
* @returns {boolean}
*/
  static set_local(name: string, item: any): boolean;
/**
*
*     从 `LocalStorage` 中取值
*    
* @param {string} name
* @returns {any}
*/
  static get_local(name: string): any;
/**
*
*     清空 `LocalStorage` 中取值
*    
* @returns {boolean}
*/
  static clear_local(): boolean;
/**
*
*    存储到 `SessionStorage`
*     
* @param {string} name
* @param {any} item
* @returns {boolean}
*/
  static set_session(name: string, item: any): boolean;
/**
*
*    从 `SessionStorage` 中取值
*     
* @param {string} name
* @returns {any}
*/
  static get_session(name: string): any;
/**
*
*    清空 `SessionStorage` 中取值
*     
* @returns {boolean}
*/
  static clear_session(): boolean;
/**
*
*    存储到 `Cookie`
*     
* @param {string} name
* @param {any} item
* @param {bigint | undefined} [expires]
* @returns {boolean}
*/
  static set_cookie(name: string, item: any, expires?: bigint): boolean;
/**
*
*    从 `Cookie` 中取值
*     
* @param {string} name
* @returns {any}
*/
  static get_cookie(name: string): any;
/**
*
*    清空 `Cookie` 中取值
*     
* @returns {boolean}
*/
  static clear_cookie(): boolean;
}
/**
*/
export class UtilsHandler {
  free(): void;
/**
*
*      生成 UUID
*    
* @returns {string}
*/
  static generate_uuid(): string;
/**
*
*      字符串是否为空
*    
* @param {string} str
* @returns {boolean}
*/
  static is_blank(str: string): boolean;
/**
*
*      格式化 整数 为 字符串, 通过三位一个 `,` 连接
*    
* @param {bigint} num
* @returns {string}
*/
  static format_integer(num: bigint): string;
/**
*
*      格式化 小数数字 为 字符串, 通过三位一个 `,` 连接, digit 为四舍五入
*    
* @param {number} num
* @param {number | undefined} [digit]
* @returns {string}
*/
  static format_float(num: number, digit?: number): string;
/**
*
*     深拷贝
*    
* @param {any} value
* @returns {any}
*/
  static deep_copy(value: any): any;
/**
*
*     首字母转大写
*    
* @param {string} str
* @returns {string}
*/
  static capitalize_first_char(str: string): string;
/**
*
*      驼峰转换下划线
*      str: 要转换的字符串
*      spec: 字符, 默认为 `_`
*    
* @param {string} str
* @param {string | undefined} [spec]
* @returns {string}
*/
  static hump_with_line(str: string, spec?: string): string;
/**
*
*     格式化手机号码
*    
* @param {string} phone
* @param {string | undefined} [spec]
* @returns {string}
*/
  static format_phone(phone: string, spec?: string): string;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly storagehandler_set_local: (a: number, b: number, c: number, d: number) => void;
  readonly storagehandler_get_local: (a: number, b: number, c: number) => void;
  readonly storagehandler_clear_local: (a: number) => void;
  readonly storagehandler_set_session: (a: number, b: number, c: number, d: number) => void;
  readonly storagehandler_get_session: (a: number, b: number, c: number) => void;
  readonly storagehandler_clear_session: (a: number) => void;
  readonly storagehandler_set_cookie: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly storagehandler_get_cookie: (a: number, b: number, c: number) => void;
  readonly storagehandler_clear_cookie: (a: number) => void;
  readonly __wbg_storagehandler_free: (a: number) => void;
  readonly utilshandler_generate_uuid: (a: number) => void;
  readonly utilshandler_is_blank: (a: number, b: number) => number;
  readonly utilshandler_format_integer: (a: number, b: number) => void;
  readonly utilshandler_format_float: (a: number, b: number, c: number, d: number) => void;
  readonly utilshandler_deep_copy: (a: number, b: number) => void;
  readonly utilshandler_capitalize_first_char: (a: number, b: number, c: number) => void;
  readonly utilshandler_hump_with_line: (a: number, b: number, c: number, d: number) => void;
  readonly utilshandler_format_phone: (a: number, b: number, c: number, d: number) => void;
  readonly __wbg_utilshandler_free: (a: number) => void;
  readonly datehandler_format: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly datehandler_get_date_by_timestamp: (a: number, b: number, c: number, d: number) => void;
  readonly datehandler_get_current_date: (a: number, b: number, c: number) => void;
  readonly __wbg_datehandler_free: (a: number) => void;
  readonly signaturehandler_encrypt: (a: number, b: number, c: number) => void;
  readonly signaturehandler_decrypt: (a: number, b: number, c: number) => void;
  readonly signaturehandler_encode: (a: number, b: number, c: number) => void;
  readonly signaturehandler_decode: (a: number, b: number, c: number) => void;
  readonly __wbg_signaturehandler_free: (a: number) => void;
  readonly is_support_wasm: (a: number) => void;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_exn_store: (a: number) => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {SyncInitInput} module
*
* @returns {InitOutput}
*/
export function initSync(module: SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {InitInput | Promise<InitInput>} module_or_path
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: InitInput | Promise<InitInput>): Promise<InitOutput>;
