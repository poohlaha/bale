/**
 * @fileOverview types exports
 * @date 2023-03-09
 * @author poohlaha
 */
export interface IRollupOptions {
  formats?: Array<string> | string // 输出格式, 单个直接输入, 多个用数组: ['umd', 'es', 'amd', 'iife', 'cjs', 'system'] | 'all', `all` 为输出多个格式
  appRootDir?: string // 项目根目录
  input?: string // rollup 输入
  output?: { [K: string]: any } // rollup 输出
  min?: boolean // 是否最小化, 默认为 true
  plugins?: Array<any> // rollup plugins
  done?: Function // 完成后的回调
}
