## 打包框架

需要先安装 `"@bale-tools/utils`。

- 通过 `webpack` 打包, 支持 `vue`、`react`。
- 打包单个文件,`js`、`ts`、`tsx`、`less`、`sass`、`css`、`vue`。
- 打包整个`ts` 项目, 需要在 `ts` 项目根目录下添加 `tsconfig.json` 文件。

### webpack

- bin

```shell
--skip checkVersion Skip the version check.
-s, --script <script> Start or build a project.
-n, --env <env> Setup `Environment`, such as `development` or `production`.
-e, --entry <entry> Add an entry point.
-o, --output <output> Output files dir, default `dist`.
-u, --url <url> Setup a visit url.
-p, --port <port> Setup webpack dev server port.
```

examples:

```shell
bale-mutate-service -s start -n development -e ./src/main.ts -o build -u main.js -p 5000
```

- api

```typescript
// api options
export interface IApiOptions {
  mode?: 'development' | 'production'
  target?: string | Array<string> // 默认为 ['web' 'es5'] 可为 node
  entry?: string | object
  output?: string | object
  loaders?: Array<object> // loaders
  plugins?: Array<any> // plugins
  externalsType?: string // 指定输出类型 默认为 commonjs https://webpack.docschina.org/configuration/externals/#externalstype
  externals?: object // externals
  alias?: object // 配置别名
  settings?: IApiSettingOptions
}

// api settings
export interface IApiSettingOptions {
  port?: number // 服务器启动端口
  openBrowser?: boolean // 启动服务器后是否打开浏览器
  rootDir?: string // 项目根目录 默认为 process.cwd()
  publicDir?: string // 静态文件目录 默认为根目录下的 public 目录
  projectUrl?: string // 项目访问路径 默认为 '/' 或者直接取 .env.xxx 中的 PROJECT_URL
  envName?: string // .env.* 文件名称 默认根据 script 获取
  useSourceMap?: boolean // 是否使用源码 生产环境默认为 false
  routerMode?: 'hash' | 'history' // 路由 hash | history 生产环境为 history
  noParse?: Array<string> | Function // noParse 属性
  experiments?: IExperimentsOptions | undefined | boolean // experiments 配置 本地启动默认为 true, doc see `https://webpack.js.org/configuration/experiments/#experiments`
  generateReport?: boolean // 生产环境是否生成报告 默认为 true
  visitSuffixUrl?: string // 访问路径后缀
  providePlugin?: { [K: string]: any } // 访问全局变量插件
  definePlugin?: object // 注入环境变量插件
  jsLoader?: 'babel-loader' | 'esbuild-loader' | 'swc-loader' | undefined | null // js loader, default `babel-loader`
  jsLoaderInclude?: Array<any> // js loader include
  useMinimize?: boolean // 是否使用 min files(js、css、html) 生产环境默认为 true
  imageMinimizer?: boolean | IImageMinimizerOptions | undefined // 图片压缩
  compress?: boolean | ICompressOptions | undefined // 打包完成后是否使用压缩包 生产环境默认为 true
  useInlineChunkHtml?: boolean // 是否把较小的 chunk 打入到html中 默认为 true
  usePurgecssPlugin?: boolean // 是否使用 purgecssPlugin 插件 默认为 true
  useMiniCssPlugin?: boolean // 是否使用 miniCssPlugin 插件 生产环境默认为 true
  useCopyPlugin?: boolean // 使用 copy plugin 默认为 true 拷贝 public 目录下的文件
  useHtmlPlugin?: boolean // 是否需要生成 html plugin
  useGzipPlugin?: boolean // 生产环境是否开启 gzip 压缩 默认为 true
  usePwaPlugin?: boolean // 生产环境是否使用 pwa 默认为 true
  usePreloadPlugin?: boolean // 生产环境 script 是否开启 preload 默认为 true 配合 useHtmlPlugin 使用
  useSplitChunks?: boolean // 是否使用 split chunks 默认为 true
  useRuntimeChunk?: boolean // 是否抽离多个使用入口到 runtime 中 默认为 true
  useTerserWebpackPlugin?: boolean // 是否在生产环境中使用 terser-webpack-plugin 默认为 true
  htmlTemplatePath?: string // index.html 路径 默认为根目录下的 public/index.html
  usePreLoader?: boolean // 是否使用预加载 默认为 false
  useCssLoader?: boolean // 是否使用 css 加载器 默认为 true
  excludeCssLoaderNodeModules?: boolean // 使用 css 加载器时, 是否过滤node_modules, 默认为 true
  threadLoader?: IRateThreadLoaderOptions // thread-loader
  px2remLoader?: IRatePx2remLoaderOptions // 是否使用 px2rem-loader
  resourceLoader?: IRateResourceLoaderOptions // 资源配置
}

// image minimizer see https://www.npmjs.com/package/image-minimizer-webpack-plugin?activeTab=readme
export interface IImageMinimizerOptions {
  minimizer?: 'imagemin' | 'squoosh' | 'sharp' // default imagemin
  options: object // options
}

// compress  config
export interface ICompressOptions {
  enable?: boolean // 是否启用 默认为生产环境启用
  name?: string // 压缩包名称默认为项目名称
  suffix?: string // 默认为 .zip
  output?: string // 输出目录 默认为打包输出目录
  deleteOutput?: boolean // 是否删除打包输出目录 默认为 true
}

// https://webpack.js.org/configuration/experiments/#experiments
export interface IExperimentsOptions {
  backCompat?: boolean // Enable backward-compat layer with deprecation warnings for many webpack 4 APIs.
  buildHttp?: boolean | object // allowedUris、cacheLocation、frozen、lockfileLocation、proxy、upgrade、
  css?: boolean // Enable native CSS support. Note that it's an experimental feature still under development and will be enabled by default in webpack v6, however you can track the progress on GitHub.
  cacheUnaffected?: boolean // Enable additional in-memory caching of modules which are unchanged and reference only unchanged modules.
  futureDefaults?: boolean // Use defaults of the next major webpack and show warnings in any problematic places.
  lazyCompilation?: boolean | object // Compile entrypoints and dynamic imports only when they are in use. It can be used for either Web or Node.js.
  outputModule?: boolean // Once enabled, webpack will output ECMAScript module syntax whenever possible. For instance, import() to load chunks, ESM exports to expose chunk data, among others.
  asyncWebAssembly?: boolean // upport the new WebAssembly according to the updated specification, it makes a WebAssembly module an async module. And it is enabled by default when
  layers?: boolean // Enable module and chunk layers.
  syncWebAssembly?: boolean // Support the old WebAssembly like in webpack 4.
  topLevelAwait?: boolean // Support the Top Level Await Stage 3 proposal, it makes the module an async module when await is used on the top-level. And it is enabled by default when experiments.futureDefaults is set to true.
}

// use thread-loader
export interface IRateThreadLoaderOptions {
  workerParallelJobs?: number // 一个 worker 进程中并行执行工作的数量 默认为 20
  workerNodeArgs?: Array<any> // 额外的 node.js 参数
  poolRespawn?: boolean // 允许重新生成一个僵死的 work 池 这个过程会降低整体编译速度 并且开发环境应该设置为 false
  poolTimeout?: number // 闲置时定时删除 worker 进程 默认为 500ms 可以设置为无穷大，这样在监视模式(--watch)下可以保持 worker 持续存在
  poolParallelJobs?: number // 池分配给 worker 的工作数量默认为 200 降低这个数值会降低总体的效率，但是会提升工作分布更均
  name?: string // 池的名称 可以修改名称来创建其余选项都一样的池
}

// use px2rem-loader
interface IRatePx2remLoaderOptions {
  remUint?: number // 默认为 75
  remPrecision?: number // 默认为 8
}

interface IRateResourceLoaderOptions {
  image?: IRateImageResourceOptions
}

// resource
interface IRateImageResourceOptions {
  useInline?: boolean // 是否打成内置的 base64 默认为打成图片
  limit?: number // 默认为 10000 字节
}
```

examples:

```javascript
const { WebpackCompiler } = require('@bale-tools/mutate-service')
const opts = {} // opts 见 IApiOptions
const script = 'start' // 'start', 'build', 'simulate', 'prod'
WebpackCompiler(script, opts)
```

### cock

- bin

```shell
--skip checkVersion Skip the version check.
-e, --entry <entry> Add an entry point.
-o, --output <output> Output files dir, default `dist`.
-m, --mode <mode> Set compile mode, such as `commonjs`, `es2015` etc, default `commonjs`.
-f, --format <format> The format of output bundle. Can be `es`, `umd`, `amd`, `iife`, `cjs`, `system`, `all`, if there are multiple, please use `,` separate.
```

examples:

```shell
bale-cock-service -e src -o build -m commonjs -f all
```

- api

```typescript
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
  useDeclaration?: boolean // 是否生成 .d.ts 文件
  done?: Function // 完成后的回调
}

// rollup options
export interface IRollupOptions {
  formats?: Array<string> | string // 输出格式, 单个直接输入, 多个用数组: ['umd', 'es', 'amd', 'iife', 'cjs', 'system'] | 'all', `all` 为输出多个格式
  appRootDir?: string // 项目根目录
  input?: string // rollup 输入
  output?: { [K: string]: any } // rollup 输出
  min?: boolean // 是否最小化, 默认为 true
  plugins?: Array<any> // rollup plugins
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
```

examples:

```javascript
const { CockCompiler } = require('@bale-tools/mutate-service')
const opts = {} // opts 见 ICookCompilerOptions
const type = 'ts' // 'js', 'ts', 'style', 'vue'
CockCompiler(type, opts)
```
