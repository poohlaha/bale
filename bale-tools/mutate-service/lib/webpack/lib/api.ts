/**
 * @fileOverview webpack configuration
 * @date 2023-03-13
 * @author poohlaha
 */
import os from 'node:os'
import path from 'node:path'
import fsExtra from 'fs-extra'
import * as _ from 'lodash'
import { TsConfigPathsPlugin } from 'awesome-typescript-loader'
import CssMinimizerWebpackPlugin from 'css-minimizer-webpack-plugin'
import TerserWebpackPlugin from 'terser-webpack-plugin'
import { EsbuildPlugin } from 'esbuild-loader'
import { createHash } from 'crypto'
import MutatePaths from '../utils/paths'
import { Logger as BaleLogger, Utils, Paths } from '@bale-tools/utils'
import { IApiDllSettingOptions, IApiOptions, IApiSettingOptions, IExperimentsOptions, IImageMinimizerOptions } from '../utils/type'
import Environment from '../utils/env'
import Plugin from './plugin'
import Loader from './loader'

// logger
const Logger = new BaleLogger(MutatePaths.getLoggerName())

export default class WebpackApi {
  private readonly _mode: string
  private readonly _appRootDir: string
  private readonly _production: boolean
  private readonly _clean: boolean
  private readonly _settings: IApiSettingOptions
  private readonly _dllSettings: IApiDllSettingOptions
  private readonly _port: number
  private readonly _script: string
  private readonly _raw: { [K: string]: any }
  private readonly _stringified: { [K: string]: any }
  private readonly _publicPath: string
  private readonly _opts: { [K: string]: any }
  private readonly _defaultOutput: string
  private readonly _jsLoader: string
  private readonly _JS_LOADERS: Array<string> = ['babel-loader', 'esbuild-loader', 'swc-loader']
  private readonly _IMAGES_MINIMIZERS: Array<string> = ['imagemin', 'sharp'] // default imagemin no `squoosh`

  constructor(script: string = '', opts: IApiOptions = {}) {
    const clonedOpts = _.cloneDeep(opts || {}) // clone opts
    this._mode = MutatePaths.getMode(script, clonedOpts.mode) // webpack mode
    this._production = this._mode === 'production' // is production
    this._settings = clonedOpts.settings || {} // user settings
    this._dllSettings = clonedOpts.dllSettings || {} // dll settings
    this._appRootDir = Paths.getAppRootDir(this._settings.rootDir)
    this._port = MutatePaths.getPort(this._settings.port) // port
    this._script = script || ''
    const { raw, stringified } = new Environment(this).getEnv()
    this._raw = raw || {}
    this._stringified = stringified || {}
    this._publicPath = this._getPublicPath(this._raw.PROJECT_URL || '/')
    this._jsLoader = this._getJsLoader(this._settings.jsLoader)

    this._clean = clonedOpts.clean
    if (_.isNil(this._clean)) this._clean = true

    // entry
    let entry: string = ''
    if (typeof clonedOpts.entry === 'string' || _.isNil(clonedOpts.entry)) {
      entry = MutatePaths.getDefaultEntryFile(this._appRootDir, clonedOpts.entry || '')
    }

    if (!fsExtra.pathExistsSync(entry)) {
      Logger.throw(`Entry Point does not exist, current is ${entry.replace(this._appRootDir, '')} !`)
    }

    // output
    this._defaultOutput = MutatePaths.getOutputDir(this._appRootDir, this._script) || ''
    const output = this._getOutput(clonedOpts.output)
    let useSourceMap = this._settings.useSourceMap
    if (_.isNil(useSourceMap)) {
      useSourceMap = true
    }
    this._opts = {
      // options
      mode: this._mode,
      devtool: this._production ? false : useSourceMap ? 'eval-cheap-module-source-map' : false,
      target: _.isNil(clonedOpts.target) ? ['web', 'es5'] : clonedOpts.target || '',
      cache: this._getCache(),
      entry,
      output,
      infrastructureLogging: {
        level: 'none',
      },
      optimization: this._getOptimization(),
      plugins: this._getPlugins(output.path || {}, clonedOpts.plugins || []),
      module: this._getRules(clonedOpts.loaders || []),
      resolve: {
        extensions: ['.js', '.json', '.jsx', '.ts', '.tsx', '.toml', '.vue'],
        plugins: [new TsConfigPathsPlugin()],
        symlinks: false, // 项目不使用 symlinks（例如 npm link 或者 yarn link）
        fallback: {
          crypto: false,
          ...(this._settings.resolveFallback || {})
        },
        alias: clonedOpts.alias || {},
      },
      externals: clonedOpts.externals || {},
      // experiments: this._getExperiments() || {},
    }

    // symlinks dll => true
    if (!Utils.isObjectNull(this._dllSettings)) {
      this._opts.resolve.symlinks = true
    }

    // externalsType
    if (!_.isNil(clonedOpts.externalsType)) {
      this._opts.externalsType = clonedOpts.externalsType || 'commonjs'
    }

    if (this._script === MutatePaths.getScripts()[0]) {
      // start
      this._opts.experiments = this._getExperiments() || {}
    } else {
      this._opts.experiments = this._settings.experiments || {}
    }
  }

  private _getJsLoader(jsLoader: string | null | undefined = ''): string {
    if (_.isNil(jsLoader)) {
      return this._JS_LOADERS[0]
    }

    if (typeof jsLoader === 'string' && Utils.isBlank(jsLoader)) {
      return this._JS_LOADERS[0]
    }

    if (typeof jsLoader === 'string' && !this._JS_LOADERS.includes(jsLoader)) {
      return this._JS_LOADERS[0]
    }

    return jsLoader || ''
  }

  private _getPublicPath(publicPath: string = '/'): string {
    if (!publicPath || publicPath === '/') return ''
    if (publicPath.trim() === '') return '/'
    return publicPath.endsWith('/') ? publicPath : publicPath + '/'
  }

  private _createEnvironmentHash(env): string {
    const hash = createHash('md5')
    hash.update(JSON.stringify(env))
    return hash.digest('hex')
  }

  private _getCache(): { [K: string]: any } {
    return {
      type: 'filesystem',
      version: this._createEnvironmentHash(this._raw),
      cacheDirectory: path.join(this._appRootDir, 'node_modules', '.cache'),
      store: 'pack',
      buildDependencies: {
        defaultWebpack: ['webpack/lib/'],
        config: [__filename],
      },
    }
  }

  private _getOutput(output): { [K: string]: any } {
    let staticDir = MutatePaths.getStaticDir() || ''
    const defaultOutputFileName = `${staticDir}/js/[name].[chunkhash].js`
    const defaultChuckFileName = this._production ? `${staticDir}/js/[name].[contenthash].chunk.js` : `${staticDir}/js/[name].[contenthash].js`
    const defaultAssetModuleFilename = `${staticDir}/media/[name].[hash:8][ext]`

    // null
    if (_.isNil(output)) {
      const output = {
        pathinfo: !this._production,
        publicPath: this._publicPath,
        path: this._defaultOutput,
        filename: defaultOutputFileName,
        chunkFilename: defaultChuckFileName,
        assetModuleFilename: defaultAssetModuleFilename,
        clean: this._clean, // 在生成文件之前清空 output 目录
      }

      return output
    }

    let outputOption: { [K: string]: any } = {}

    if (_.isString(output)) {
      // string
      outputOption = {
        pathinfo: !this._production,
        publicPath: this._publicPath,
        path: path.join(this._appRootDir, output || ''),
        filename: defaultOutputFileName,
        chunkFilename: defaultChuckFileName,
        assetModuleFilename: defaultAssetModuleFilename,
        clean: this._clean, // 在生成文件之前清空 output 目录
      }
    } else if (_.isObject(output)) {
      // object
      outputOption = { ...output }

      // publicPath
      if (Utils.isBlank(outputOption.publicPath)) {
        outputOption.publicPath = this._publicPath
      }

      if (_.isNil(outputOption.library) || _.isEmpty(outputOption.library)) {
        // filename
        if (Utils.isBlank(output.filename)) {
          outputOption.filename = defaultOutputFileName
        }
      }

      // path
      if (Utils.isBlank(outputOption.path)) {
        outputOption.path = this._defaultOutput
      }

      // path
      if (Utils.isBlank(outputOption.chunkFilename)) {
        outputOption.chunkFilename = defaultChuckFileName
      }

      // path
      if (Utils.isBlank(outputOption.assetModuleFilename)) {
        outputOption.assetModuleFilename = defaultAssetModuleFilename
      }

      // clean
      if (_.isNil(outputOption.clean)) {
        outputOption.clean = this._clean
      }

      // pathinfo
      if (_.isNil(outputOption.pathinfo)) {
        outputOption.pathinfo = !this._production
      }
    }

    return outputOption
  }

  private _getOptimization() {
    let useSplitChunks = MutatePaths.getBooleanValue(this._settings.useSplitChunks, true)
    const splitChunksConfig: { [K: string]: any } = {
      // 最大初始请求数量
      maxInitialRequests: 20,
      // 抽离体积大于50kb的chunk
      minSize: 50 * 1024,
      // 抽离被多个入口引用次数大于等于1的chunk
      minChunks: 1,
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          priority: 10, // 优先级
          // 切记不要为 cacheGroups 定义固定的 name，因为 cacheGroups.name 指定字符串或始终返回相同字符串的函数时，会将所有常见模块和 vendor 合并为一个 chunk。
          // 这会导致更大的初始下载量并减慢页面加载速度
          // name: 'vendors',
          enforce: true,
          chunks: 'all',
        },
      },
    }

    const splitChunks: { [K: string]: any } | boolean = useSplitChunks ? splitChunksConfig : false
    const opts: { [K: string]: any } = {
      // 不论是否添加任何新的本地依赖，对于多次构建，vendor hash 都应该保持一致
      moduleIds: 'deterministic',
      splitChunks,
    }

    let useRuntimeChunk = MutatePaths.getBooleanValue(this._settings.useRuntimeChunk, true)
    if (useRuntimeChunk) {
      // 如果我们要在一个 HTML 页面上使用多个入口时，还需设置 optimization.runtimeChunk: 'single'
      opts.runtimeChunk = 'single'
    }

    if (this._production) {
      // 生产环境
      opts.usedExports = true // 标记不被使用的函数, 用于 webpack5 的 tree sharking
      opts.minimize = true //
    }

    opts.minimizer = this._getMinimizer()
    return opts
  }

  private _getMinimizer(): Array<any> {
    const minimizer: Array<any> = []

    if (this._production) {
      minimizer.push(new CssMinimizerWebpackPlugin())

      if (this._jsLoader === this._JS_LOADERS[1]) {
        // esBuilder-loader
        minimizer.push(
          new EsbuildPlugin({
            target: 'es2015',
            css: true, // 缩小CSS
            minify: true, // 缩小JS
            minifyWhitespace: true, // 去掉空格
            minifyIdentifiers: true, // 缩短标识符
            minifySyntax: true, // 缩短语法
            legalComments: 'none', // 去掉注释
          })
        )
      }

      const threads = os.cpus() === undefined ? 1 : os.cpus().length
      minimizer.push(
        new TerserWebpackPlugin({
          parallel: threads > 1 ? threads - 1 : 1,
          extractComments: false,
          terserOptions: {
            sourceMap: false,
            compress: {
              ecma: 5,
              comparisons: false,
              inline: 2,
            },
            mangle: {
              safari10: true,
            },
            output: {
              ecma: 5,
              comments: false,
              ascii_only: true,
            },
          },
        })
      )
    }

    // 图片压缩 see: https://www.npmjs.com/package/image-minimizer-webpack-plugin?activeTab=readme
    // "image-minimizer-webpack-plugin": "^3.8.2" 不支持 node 版本: 18.x
    // "@squoosh/lib": "^0.5.3" 不再支持最新版本
    /*
    let imageMinimizerOptions = this._getImageMinimizer() || {}
    if (!Utils.isObjectNull(imageMinimizerOptions)) {
      minimizer.push(new ImageMinimizerPlugin(imageMinimizerOptions))
    }
     */

    // 包含多个插件, 不兼容 WINDOWS 系统
    /*
    if ((typeof this._settings.imageMinimizer === 'boolean' && !this._settings.imageMinimizer) || this._settings.imageMinimizer === undefined) {
      // nothing
    } else {
      minimizer.push(new ImageMinimizerPlugin(this._settings.imageMinimizer))
    }
     */
    return minimizer
  }

  /*
  private _getImageMinimizer(): object {
    let imageMinimizer: boolean | IImageMinimizerOptions | string | undefined = this._settings.imageMinimizer
    // boolean -> false
    if (typeof imageMinimizer === 'boolean' && !imageMinimizer) {
      return {}
    }

    // imagemin
    const getImageminOptions = (): object => {
      return {
        minimizer: {
          // implementation: ImageMinimizerPlugin.imageminMinify,
          options: {
            plugins: [
              ['gifsicle', { interlaced: true }],
              ['jpegtran', { progressive: true }],
              ['optipng', { optimizationLevel: 5 }],
              // Svgo configuration here https://github.com/svg/svgo#configuration
              [
                'svgo',
                {
                  plugins: [
                    {
                      name: 'preset-default',
                      params: {
                        overrides: {
                          removeViewBox: false,
                          addAttributesToSVGElement: {
                            params: {
                              attributes: [{ xmlns: 'http://www.w3.org/2000/svg' }],
                            },
                          },
                        },
                      },
                    },
                  ],
                },
              ],
            ],
          },
        },
      }
    }

    // squoosh "@squoosh/lib": "^0.5.3" 不再支持最新版本
    const getSquooshOptions = () => {
      return {
        minimizer: {
          // implementation: ImageMinimizerPlugin.squooshMinify,
          options: {
            encodeOptions: {
              mozjpeg: {
                // That setting might be close to lossless, but it’s not guaranteed
                // https://github.com/GoogleChromeLabs/squoosh/issues/85
                quality: 100,
              },
              webp: {
                lossless: 1,
              },
              avif: {
                // https://github.com/GoogleChromeLabs/squoosh/blob/dev/codecs/avif/enc/README.md
                cqLevel: 0,
              },
            },
          },
        },
      }
    }

    // sharp
    const getSharpOptions = () => {
      return {
        minimizer: {
          // implementation: ImageMinimizerPlugin.sharpMinify,
          options: {
            encodeOptions: {
              jpeg: {
                // https://sharp.pixelplumbing.com/api-output#jpeg
                quality: 100,
              },
              webp: {
                // https://sharp.pixelplumbing.com/api-output#webp
                lossless: true,
              },
              avif: {
                // https://sharp.pixelplumbing.com/api-output#avif
                lossless: true,
              },

              // png by default sets the quality to 100%, which is same as lossless
              // https://sharp.pixelplumbing.com/api-output#png
              png: {},

              // gif does not support lossless compression at all
              // https://sharp.pixelplumbing.com/api-output#gif
              gif: {},
            },
          },
        },
      }
    }

    // undefined | boolean -> true
    if (imageMinimizer === undefined || (typeof imageMinimizer === 'boolean' && imageMinimizer)) {
      return getImageminOptions()
    }

    const getMinimizerOptions = (imageMinimizer = '') => {
      if (Utils.isBlank(imageMinimizer)) {
        return getImageminOptions()
      }

      if (imageMinimizer === this._IMAGES_MINIMIZERS[1]) {
        // sharp
        return getSharpOptions()
      }

      return getImageminOptions() // default imagemin
    }

    // string
    if (typeof imageMinimizer === 'string') {
      return getMinimizerOptions(imageMinimizer)
    }

    let minimizer: string = imageMinimizer.minimizer || this._IMAGES_MINIMIZERS[0] // default imagemin
    let options = imageMinimizer.options || {}
    if (!Utils.isObjectNull(options)) {
      return options || {}
    }

    return getMinimizerOptions(minimizer)
  }
   */

  private _getPlugins(outputPath = '', plugins = []): Array<any> {
    return new Plugin(this, outputPath || this._defaultOutput, plugins).getPlugins() || []
  }

  private _getRules(loaders: Array<any> = []): object {
    let noParseSetting: Array<string> | Function = this._settings.noParse || []
    let noParse: RegExp | Function | null = null
    if (typeof noParseSetting === 'function') {
      noParse = noParseSetting
    } else if (Array.isArray(noParseSetting) && noParseSetting.length > 0) {
      noParse = new RegExp(`/${noParseSetting.join('|')}/`)
    }
    // vue-loader v15 不支持 oneOf, {oneOf: new Loader(this, loaders).loaders || []}

    const options: { [K: string]: any } = {
      rules: new Loader(this, loaders).getLoaders() || [],
    }

    if (noParse) {
      options.module = noParse
    }

    return options
  }

  /**
   * experiments, 只用于开发环境
   * see https://webpack.js.org/configuration/experiments/#experiments
   * Available: 5.49.0+
   */
  private _getExperiments(): IExperimentsOptions {
    let experiments: IExperimentsOptions | undefined | boolean = this._settings.experiments
    if (typeof experiments === 'boolean' || experiments === undefined) {
      if (experiments === true || experiments === undefined) {
        return {
          lazyCompilation: {
            imports: false,
            entries: true,
          },
        }
      }

      return {}
    }

    return experiments || {}
  }

  public getAppRootDir(): string {
    return this._appRootDir || ''
  }

  public getScript(): string {
    return this._script || ''
  }

  public getSettings(): IApiSettingOptions {
    return this._settings || {}
  }

  public getDllSettings(): IApiDllSettingOptions {
    return this._dllSettings || {}
  }

  public getMode(): string {
    return this._mode || ''
  }

  public getProduction(): boolean {
    return this._production
  }

  public getRaw(): { [K: string]: any } {
    return this._raw || {}
  }

  public getStringified(): object {
    return this._stringified || {}
  }

  public getPublicPath(): string {
    return this._publicPath || ''
  }

  public getJsLoader(): string {
    return this._jsLoader || ''
  }

  public getJsLoaders(): Array<string> {
    return this._JS_LOADERS || []
  }

  public getOpts(): object {
    return this._opts || {}
  }

  public getDefaultOutput(): string {
    return this._defaultOutput || ''
  }
}
