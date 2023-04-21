/**
 * @fileOverview types exports
 * @date 2023-03-10
 * @author poohlaha
 */
import { IRollupOptions } from '../../rollup/types'

// js options
export interface ICompileJsOptions {
  mode?: 'commonjs' | 'ES2015' // ts 输出 mode, 'commonjs' | 'ES2015', 默认为 commonjs
  appRootDir: string // 项目根目录
  filePath: string // 文件全路径
}

// style options
export interface ICompileStyleOptions {
  appRootDir: string // 项目根目录
  filePath: string // 文件全路径
}

// vue options
export interface ICompileVueOptions {
  mode?: 'commonjs' | 'ES2015' // ts 输出 mode, 'commonjs' | 'ES2015', 默认为 commonjs
  appRootDir: string // 项目根目录
  filePath: string // 文件全路径
}

// ts options
export interface ICompileTsOptions {
  mode?: 'commonjs' | 'ES2015' // ts 输出 mode, 'commonjs' | 'ES2015', 默认为 commonjs
  appRootDir?: string // 项目根目录
  entryDir?: string // entry point, 默认为 src 或 lib
  outputDir?: string // 输出目录, 默认为 dist
  excludes?: Array<string> // 过滤的文件夹目录, 默认为 node_modules
  useDeclaration?: boolean // 是否生在 .d.ts 文件
  done?: Function // 完成后的回调
}

// compile options
export interface ICookCompilerOptions {
  mode?: 'commonjs' | 'ES2015' // ts 输出 mode, 'commonjs' | 'ES2015', 默认为 commonjs
  rootDir?: string // 项目根目录, 默认为 process.cwd()
  entry: string // 单个文件编译文件
  outputDir?: string // 输出目录, 默认为 dist
  excludes?: Array<string> // 过滤的文件夹目录, 默认为 node_modules
  callback?: Function // 每个文件的回调
  rollupSettings?: IRollupOptions // rollup 设置
  tsSettings?: ICompileTsOptions // ts 设置
  done?: Function // 完成后的回调
}
