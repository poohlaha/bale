/**
 * @fileOverview webpack loader
 * @date 2023-03-13
 * @author poohlaha
 */
import path from 'node:path'
import os from 'os'
import fsExtra from 'fs-extra'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import * as _ from 'lodash'
import toml from 'toml'
import { Logger as BaleLogger, Paths, Utils } from '@bale-tools/utils'
import MutatePaths from '../utils/paths'
import Api from './api'
import { IApiSettingOptions, IRateThreadLoaderOptions, IImageMinimizerOptions } from '../utils/type'

// logger
const Logger = new BaleLogger(MutatePaths.getLoggerName())

export default class Loader {
  private readonly _appRootDir: string
  private readonly _settings: IApiSettingOptions
  private readonly _production: boolean
  private readonly _raw: { [K: string]: any }
  private readonly _projectUrl: string
  private readonly _defaultImageInlineSizeLimit: number
  private _loaders: Array<object>
  private readonly _jsLoader: string
  private readonly _jsLoaders: Array<string>
  private readonly _languages: Array<string>

  constructor(api: Api, loaders: Array<object> = [], languages: Array<string> = []) {
    this._appRootDir = api.getAppRootDir() || ''
    this._settings = api.getSettings() || {}
    this._production = api.getProduction()
    this._raw = api.getRaw() || {}
    this._projectUrl = this._raw.PROJECT_URL || '/'
    this._defaultImageInlineSizeLimit = 10000 // 默认图片大小
    this._loaders = loaders || []
    this._jsLoader = api.getJsLoader()
    this._jsLoaders = api.getJsLoaders()
    this._languages = languages || []
    this._getLoaders()
  }

  /**
   * 预加载
   */
  private _getPreLoader(): object {
    let usePreLoader = MutatePaths.getBooleanValue(this._settings.usePreLoader, false)
    if (!usePreLoader) return {}
    return {
      enforce: 'pre',
      test: /\.(js|mjs|jsx|ts|tsx|css)$/,
      exclude: /@babel(?:\/|\\{1,2})runtime/,
      // exclude: /node_modules/,
      // include: [paths.resolve('src')],
      loader: 'source-map-loader',
      options: {
        emitWarning: true,
        emitError: true,
        fix: true // 是否自动修复
      }
    }
  }

  /**
   * js|jsx|tsx|ts loader
   */
  private _getJsLoader(): Array<object> {
    let loaders: Array<object> = []
    const addLoader = (loader: object = {}) => {
      if (!Utils.isObjectNull(loader)) {
        loaders.push(loader)
      }
    }
    if (this._jsLoader === this._jsLoaders[1]) {
      // esbuild-loader
      addLoader(this._getEsbuildLoader() || {})
    } else if (this._jsLoader === this._jsLoaders[2]) {
      // swc-loader
      addLoader(this._getSwcLoader() || {})
    } else {
      addLoader(this._getBabelLoader() || {})
    }

    return loaders || []
  }

  /**
   * swc loader
   */
  private _getSwcLoader(): object {
    if (this._jsLoader !== this._jsLoaders[2]) return []

    const swcOptions: { [K: string]: any } = {
      test: /\.(js|mjs|jsx|ts|tsx)?$/,
      use: {
        loader: 'swc-loader'
      },
      ...this._getJsInclude()
    }

    try {
      // 判断根目录下是否有 .swcrc 文件
      const swcConfigPath: string = path.join(this._appRootDir, '.swcrc')
      if (!fsExtra.pathExistsSync(swcConfigPath)) {
        swcOptions.use.options = {
          // js
          jsc: {
            parser: {
              syntax: 'typescript',
              tsx: true,
              decorators: true,
              dynamicImport: true
            },
            target: 'es2015',
            transform: {
              react: {
                runtime: 'automatic',
                pragma: 'React.createElement',
                pragmaFrag: 'React.Fragment',
                throwIfNamespace: true,
                development: false
              }
            }
          },
          minify: this._production
        }
      }
    } catch (e) {
      Logger.error('Read Swc Loader Config Error!', e)
    }

    return swcOptions
  }

  /**
   * esbuild loader
   */
  private _getEsbuildLoader(): object {
    if (this._jsLoader !== this._jsLoaders[1]) return {}
    let options: { [K: string]: any } = {
      charset: 'utf8',
      loader: 'tsx'
    }
    let tsconfigPath: string = path.join(this._appRootDir, 'tsconfig.json') // 默认取根目录下的 tsconfig.json
    if (fsExtra.pathExistsSync(tsconfigPath)) {
      options.tsconfig = tsconfigPath
    } else {
      options.target = 'es2015'
    }

    let esbuildOptions: { [K: string]: any } = {
      test: /\.(js|jsx|tsx|ts)?$/,
      // exclude: /node_modules/,
      loader: 'esbuild-loader',
      options
    }

    return { ...esbuildOptions, ...this._getJsInclude() }
  }

  /**
   * default babel loader
   */
  private _getBabelLoader(): object {
    let babelOptions: { [K: string]: any } = {
      test: /\.(js|jsx|tsx|ts)?$/,
      // exclude: /node_modules/,
      loader: 'babel-loader',
      // include: jsLoaderInclude,
      options: {
        cacheDirectory: true // 加快编译速度,
      }
    }

    try {
      babelOptions = { ...babelOptions, ...this._getJsInclude() }

      // 读取根目录下的 babel.config.js 或 .babelrc 文件
      const babelConfigPath: string = path.join(this._appRootDir, 'babel.config.js')
      const babelrcConfigPath: string = path.join(this._appRootDir, '.babelrc')
      let babelConfig: { [K: string]: any } = {}
      if (fsExtra.pathExistsSync(babelConfigPath)) {
        // babel.config.js
        babelConfig = require(babelConfigPath)
      } else if (fsExtra.pathExistsSync(babelrcConfigPath)) {
        // .babelrc
        babelConfig = Paths.toJsonByPath(babelrcConfigPath)
      }

      babelOptions.options.presets = babelConfig.presets || []
      babelOptions.options.plugins = babelConfig.plugins || []
    } catch (e) {
      Logger.error('Read Babel Config Error!', e)
    }

    return babelOptions
  }

  private _getJsInclude(): object {
    // 判断是否有 src 目录
    const appSrcDir: string = path.join(this._appRootDir, 'src')
    const hasSrcExists = fsExtra.pathExistsSync(appSrcDir)
    const jsLoaderInclude = this._settings.jsLoaderInclude || []

    // 判断是否有 src 目录
    let options: { [K: string]: any } = {
      include: []
    }

    if (!jsLoaderInclude.includes(appSrcDir)) {
      if (hasSrcExists) options.include.push(appSrcDir)
    }

    options.include = options.include.concat(jsLoaderInclude)

    // 是否有 node_modules、bower_components
    let hasExcludeNodeModules: boolean = false
    for (let include of jsLoaderInclude) {
      if (include.includes('node_modules') || include.includes('bower_components')) {
        hasExcludeNodeModules = true
        break
      }
    }

    if (!hasExcludeNodeModules) {
      options.exclude = /(node_modules|bower_components)/
    }

    return options
  }

  /**
   * vue loader
   */
  private _getVueLoader(): object {
    // 判断是否包含 vue
    let languages = this._languages || []
    let hasVue: boolean = false
    for (let language of languages) {
      if ((language || '').toLowerCase().indexOf('vue') !== -1) {
        hasVue = true
        break
      }
    }
    if (!hasVue) return {}
    return {
      test: /\.vue$/,
      loader: 'vue-loader',
      options: {
        hotReload: false // disables Hot Reload
      }
    }
  }

  /**
   * postcss loader
   */
  private _getPostcssLoader(): object {
    // 读取根目录下的 postcss.config.js 和 .postcssrc.js 文件
    const postcssConfigPath: string = path.join(this._appRootDir, 'postcss.config.js')
    const postcssrcConfigPath: string = path.join(this._appRootDir, '.postcssrc.js')

    let postcssConfig: { [K: string]: any } = {}
    if (fsExtra.pathExistsSync(postcssConfigPath)) {
      postcssConfig = require(postcssConfigPath) || {}
    } else if (fsExtra.pathExistsSync(postcssrcConfigPath)) {
      postcssConfig = require(postcssrcConfigPath) || {}
    }

    const plugins = postcssConfig.plugins || []
    // 判断是否有 autoprefixer 插件
    if (Array.isArray(plugins)) {
      const hasPostcssPlugin = plugins.find(plugin => plugin === 'autoprefixer' && plugin.postcssPlugin === 'autoprefixer')
      if (!hasPostcssPlugin) {
        plugins.push(require('autoprefixer'))
      }
    }

    delete postcssConfig.plugins

    return {
      loader: 'postcss-loader',
      options: {
        postcssOptions: {
          ident: 'postcss',
          config: false,
          ...postcssConfig,
          plugins
        },
        sourceMap: this._production
      }
    }
  }

  /**
   * 开启多线程打包
   */
  private _getThreadLoader(): object {
    if (_.isEmpty(this._settings.threadLoader)) return {}

    const threadLoader: IRateThreadLoaderOptions = this._settings.threadLoader || {}
    const threads = os.cpus() === undefined ? 1 : os.cpus().length // 获取 cpu 数
    return {
      loader: 'thread-loader',
      options: {
        // 产生的 worker 的数量，默认是 (cpu 核心数 - 1)，或者在 require('os').cpus() 是 undefined 时回退至 1
        workers: threads > 1 ? threads - 1 : 1,
        // 一个 worker 进程中并行执行工作的数量, 默认为 20
        workerParallelJobs: threadLoader.workerParallelJobs || 20,
        // 额外的 node.js 参数
        workerNodeArgs: (threadLoader.workerNodeArgs || []).length > 0 ? threadLoader.workerNodeArgs : ['--max-old-space-size=1024'],
        poolRespawn: threadLoader.poolRespawn || false,
        // 闲置时定时删除 worker 进程, 默认为 500ms, 可以设置为无穷大，这样在监视模式(--watch)下可以保持 worker 持续存在
        poolTimeout: threadLoader.poolTimeout || 500,
        // 池分配给 worker 的工作数量,默认为 200, 降低这个数值会降低总体的效率，但是会提升工作分布更均
        poolParallelJobs: threadLoader.poolParallelJobs || 200,
        // 池的名称, 可以修改名称来创建其余选项都一样的池
        name: `${threadLoader.name || Utils.generateUUID()}-pool`
      }
    }
  }

  /**
   * svg loader
   */
  private _getSvgLoader(): object {
    return {
      test: /\.svg$/,
      exclude: /node_modules/,
      use: [
        {
          loader: '@svgr/webpack',
          options: {
            prettier: false,
            svgo: false,
            svgoConfig: {
              plugins: [{ removeViewBox: false }]
            },
            titleProp: true,
            ref: true
          }
        },
        {
          loader: 'file-loader',
          options: {
            name: `${MutatePaths.getStaticDir()}/media/[name].[hash:8].[ext]`
          }
        }
      ]
    }
  }

  /**
   * toml loader
   */
  private _getTomlLoader(): object {
    return {
      test: /\.toml$/i,
      exclude: /node_modules/,
      type: 'json',
      parser: {
        parse: toml.parse
      }
    }
  }

  /**
   * less loaders
   */
  private _getLessLoader(): object {
    const loaders: Array<object> = []

    let useMiniCssPlugin: boolean = MutatePaths.getBooleanValue(this._settings.useMiniCssPlugin, this._production)
    if (useMiniCssPlugin) {
      let options: { [K: string]: any } = {}
      if (this._projectUrl === '/') options.publicPath = '../../' // 两层
      loaders.push({
        loader: MiniCssExtractPlugin.loader,
        options
      })
    } else {
      loaders.push({ loader: 'style-loader' })

      // esbuild loader TODO no esbuild loader for less
      /*
      if (this._jsLoader === this._jsLoaders[1]) {
        loaders.push({
          loader: 'esbuild-loader',
          options: {
            minify: this._production,
            sourcemap: false,
          },
        })
      }
       */
    }

    const cssOptions: object = {
      loader: 'css-loader',
      options: {
        modules: false
        // publicPath: '../../' // 两层
      }
    }

    loaders.push(cssOptions) // css

    const px2remLoader = this._settings.px2remLoader || {}
    if (!_.isNil(px2remLoader) && !_.isEmpty(px2remLoader)) {
      const px2remOptions = {
        loader: 'px2rem-loader',
        options: {
          remUint: px2remLoader.remUint || 75,
          remPrecision: px2remLoader.remPrecision || 8
        }
      }

      loaders.push(px2remOptions) // px2rem-loader
    }

    loaders.push(this._getPostcssLoader()) // post css loader

    const lessLoader = {
      loader: 'less-loader',
      options: {
        lessOptions: {
          javascriptEnabled: true
        }
      }
    }

    loaders.push(lessLoader) // less

    let useCssLoader = MutatePaths.getBooleanValue(this._settings.useCssLoader, true)
    if (!useCssLoader) {
      return {
        test: /\.(less)$/i,
        use: loaders
      }
    }

    return {
      test: /\.(less|css)$/i,
      use: loaders
    }
  }

  /**
   * sass loader
   */
  private _getSassLoader(): object {
    return {
      test: /\.s[ac]ss$/i,
      use: [
        'style-loader',
        {
          loader: 'css-loader',
          options: {
            modules: false
          }
        },
        {
          loader: 'sass-loader',
          options: {
            sourceMap: false,
            sassOptions: {
              outputStyle: 'compressed' // 压缩
            }
          }
        }
      ]
    }
  }

  /**
   * css loader
   */
  private _getCssLoader(): object {
    let useCssLoader = MutatePaths.getBooleanValue(this._settings.useCssLoader, true)
    if (!useCssLoader) return {}
    const options: { [K: string]: any } = {
      test: /\.css$/i,
      exclude: /node_modules/,
      use: [
        {
          loader: 'css-loader',
          options: {
            modules: false
          }
        },
        'style-loader',
        'postcss-loader'
      ]
    }

    // no esbuild loader for css
    /*
    if (this._jsLoader === this._jsLoaders[1]) {
      options.use.push({
        loader: 'esbuild-loader',
        options: {
          minify: this._production,
          sourcemap: false,
        },
      })
    }
     */

    return options
  }

  /**
   * resource loaders
   */
  private _getResourceLoaders(): Array<object> {
    const resourceLoader = this._settings.resourceLoader || {}
    const image = resourceLoader.image || {}
    const staticDir: string = MutatePaths.getStaticDir() || ''

    const resourceLoaders: Array<object> = [
      {
        test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/i,
        type: 'asset/resource', // javascript/auto, asset/resource
        generator: {
          filename: `${staticDir}/fonts/[hash:8][ext][query]`
        }
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource', // javascript/auto, asset/resource
        generator: {
          filename: `${staticDir}/fonts/[hash:8][ext][query]`
        }
      }
    ]

    let imageType: string = 'asset/resource'
    let imageGenerator: object = { filename: `${staticDir}/images/[hash][ext][query]` }

    let maxImageInlineSize: number = this._defaultImageInlineSizeLimit
    if (!_.isNil(image.limit)) {
      if (!_.isNumber(image.limit) || Math.sign(image.limit || 0) !== 1) {
        Logger.info(`Expected \`limit\` to be a positive number, got \`${image.limit}\`, set default limit.`)
      } else {
        maxImageInlineSize = image.limit || this._defaultImageInlineSizeLimit
      }
    }

    // use inline pictures
    if (image.useInline) {
      imageType = 'asset/inline'
      imageGenerator = {}
    }

    const imageLoader: object = {
      // jpe?g|png|gif|tif|webp|svg|avif|jxl
      test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/, /\.svg$/, /\.tif$/, /\.webp$/, /\.avif$/, /\.jxl$/],
      type: imageType, // javascript/auto, asset/resource
      parser: {
        dataUrlCondition: {
          maxSize: maxImageInlineSize
        }
      },
      generator: imageGenerator
    }

    // image minimizer
    /*
    const imageMinimizerLoader = this._getImageMinimizerLoader() || {}
    if (!Utils.isObjectNull(imageMinimizerLoader)) {
      resourceLoaders.push(imageMinimizerLoader)
    }
     */

    resourceLoaders.push(imageLoader)
    return resourceLoaders
  }

  // 已移动到 api 中的 minimizer
  private _getImageMinimizerLoader(): object {
    let imageMinimizer: boolean | IImageMinimizerOptions | undefined = this._settings.imageMinimizer
    // boolean -> false
    if ((typeof imageMinimizer === 'boolean' && !imageMinimizer) || imageMinimizer === undefined) {
      return {}
    }

    let options = {}
    // undefined | boolean -> true
    if (typeof imageMinimizer === 'boolean') {
      options = {}
    } else {
      // object
      options = imageMinimizer || {}
    }

    return {
      test: /\.(jpe?g|png|gif|tif|webp|svg|avif|jxl)$/i,
      use: [
        {
          loader: path.resolve(__dirname, '../plugins/image/minimizer.js'),
          options
        }
      ]
    }
  }

  // add loaders
  private _addLoader(loader: Array<object> | object = {}) {
    if (_.isNil(loader)) return
    if (Array.isArray(loader) && loader.length === 0) return
    if (Utils.isObjectNull(loader)) return

    if (Array.isArray(loader)) {
      for (let l of loader) {
        this._loaders.unshift(l)
      }
    } else {
      this._loaders.unshift(loader)
    }
  }

  // get loaders
  private _getLoaders() {
    // postcss loader 在 less loader 中
    this._addLoader(this._getPreLoader()) // pre loader
    this._addLoader(this._getJsLoader()) // js loader, babel loader or esbuild loader
    this._addLoader(this._getVueLoader()) // vue loader
    this._addLoader(this._getThreadLoader()) // thread loader
    this._addLoader(this._getSvgLoader()) // svg loader
    this._addLoader(this._getTomlLoader()) // toml loader
    this._addLoader(this._getCssLoader()) // css loader
    this._addLoader(this._getLessLoader()) // less css loader
    this._addLoader(this._getSassLoader()) // sass loader
    this._addLoader(this._getResourceLoaders()) // resource
  }

  public getLoaders() {
    return this._loaders || []
  }
}
