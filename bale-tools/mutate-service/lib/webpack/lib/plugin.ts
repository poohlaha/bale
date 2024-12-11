/**
 * @fileOverview webpack plugins
 * @date 2023-03-13
 * @author poohlaha
 */
import fsExtra from 'fs-extra'
import * as _ from 'lodash'
import webpack from 'webpack'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import { PurgeCSSPlugin } from 'purgecss-webpack-plugin'
import InlineChunkHtmlPlugin from 'inline-chunk-html-plugin'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import ProgressBarWebpackPlugin from 'progress-bar-webpack-plugin'
// import PreloadWebpackPlugin from 'preload-webpack-plugin'
import CompressionPlugin from 'compression-webpack-plugin'
import { CleanWebpackPlugin } from 'clean-webpack-plugin'
import CopyWebpackPlugin from 'copy-webpack-plugin'
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer'
import WorkboxPlugin, { GenerateSW } from 'workbox-webpack-plugin'
import glob from 'glob'
import path from 'node:path'
import AddAssetHtmlPlugin from 'add-asset-html-webpack-plugin'
import MutatePaths from '../utils/paths'
import OpenBrowserWebpackPlugin from '../plugins/browser/open'
import Api from './api'
import { IApiDllSettingOptions, IApiSettingOptions } from '../utils/type'
import { Utils, Paths } from '@bale-tools/utils'
import exports from "webpack";
import require = exports.RuntimeGlobals.require;

export default class Plugin {
  private readonly _api: Api
  private readonly _appRootDir: string
  private readonly _production: boolean
  private readonly _stringified: { [K: string]: any }
  private readonly _output: string
  private readonly _settings: IApiSettingOptions
  private readonly _dllSettings: IApiDllSettingOptions
  private readonly _projectUrl: string
  private readonly _script: string
  private readonly _raw: { [K: string]: any }
  private readonly _port: number
  private _plugins: Array<any>
  private _languages: Array<any>

  constructor(api: Api, output: string = '', plugins: Array<any> = [], languages: Array<string> = []) {
    this._api = api
    this._appRootDir = api.getAppRootDir() || ''
    this._production = api.getProduction()
    this._stringified = api.getStringified() || {}
    this._raw = api.getRaw() || {}
    this._output = output || ''
    this._plugins = plugins || []
    this._settings = api.getSettings() || {}
    this._dllSettings = api.getDllSettings() || {} // dll
    this._projectUrl = this._raw.PROJECT_URL || '/'
    this._script = api.getScript() || ''
    this._port = this._raw.PORT
    this._languages = languages || []
    this._getPlugins()
  }

  /**
   * mini-css-extract-plugin
   */
  private _getMiniCssPlugin(): MiniCssExtractPlugin | null {
    let useMiniCssPlugin = MutatePaths.getBooleanValue(this._settings.useMiniCssPlugin, this._production)
    if (!useMiniCssPlugin) return null

    return new MiniCssExtractPlugin({
      ignoreOrder: true,
      filename: `${MutatePaths.getStaticDir()}/css/[name].[contenthash].css`,
      chunkFilename: `${MutatePaths.getStaticDir()}/css/[id].[contenthash].css`,
    })
  }

  /**
   * purgecss-webpack-plugin
   */
  private _getPurgecssPlugin(): PurgeCSSPlugin | null {
    let usePurgecssPlugin = this._settings.usePurgecssPlugin
    if (_.isNil(usePurgecssPlugin)) {
      usePurgecssPlugin = true
    }

    if (!usePurgecssPlugin) return null
    const paths: string[] = glob.sync(`${path.join(this._appRootDir, 'src')}/**/*`, { nodir: true })
    // const paths: string[] = glob.sync(path.join(this._appRootDir, 'src', '**', '*'), { nodir: true })
    // @ts-ignore
    return new PurgeCSSPlugin({ paths })
  }

  /**
   * webpack define plugin
   */
  private _getDefinePlugin(stringified = {}): webpack.DefinePlugin {
    return new webpack.DefinePlugin(stringified)
  }

  /**
   * webpack dll plugin
   */
  private _getDllPlugin(): Array<webpack.DllReferencePlugin> {
    let dllPlugins: Array<webpack.DllReferencePlugin> = []
    if (Utils.isObjectNull(this._dllSettings)) return dllPlugins

    const output = this._dllSettings.output || this._api.getDefaultOutput() || ''
    const manifestList: Array<string> = this._dllSettings.manifestList || []
    if (manifestList.length === 0) return dllPlugins

    for (let manifest of manifestList) {
      let manifestFile = manifest
      if (!Paths.isAbsoluteURL(manifestFile)) {
        manifestFile = path.join(output, manifest)
      }

      dllPlugins.push(
        new webpack.DllReferencePlugin({
          // context: output,
          manifest: require(manifestFile),
        })
      )
    }

    return dllPlugins
  }

  // 添加到 index.html 中
  private _getAddAssetHtmlPlugin(): AddAssetHtmlPlugin | null {
    if (Utils.isObjectNull(this._dllSettings) || this._dllSettings.manifestList?.length === 0) return null

    let outputDir = this._dllSettings.dllOutput || ''
    if (!Paths.isAbsoluteURL(outputDir)) {
      outputDir = path.resolve(this._output, this._dllSettings.dllOutput || '')
    }
    return new AddAssetHtmlPlugin({
      // dll文件位置
      glob: path.resolve(outputDir, '*.js'),
      // dll 引用路径
      publicPath: path.join(this._projectUrl, path.basename(this._dllSettings.dllOutput || '')),
      // dll最终输出的目录
      outputPath: path.basename(this._dllSettings.dllOutput || './') || './',
    })
  }

  /**
   * webpack provide plugin
   */
  private _getProvidePlugin(): webpack.ProvidePlugin | null {
    const providePlugin = this._settings.providePlugin || {}
    if (Utils.isObjectNull(providePlugin)) return null
    return new webpack.ProvidePlugin(providePlugin)
  }

  /**
   * inline-chunk-html-plugin
   */
  private _getInlineChunkHtmlPlugin(): InlineChunkHtmlPlugin | null {
    let useInlineChunkHtml = MutatePaths.getBooleanValue(this._settings.useInlineChunkHtml, true)
    if (!useInlineChunkHtml) return null
    return new InlineChunkHtmlPlugin(HtmlWebpackPlugin, [/runtime.*\.js/])
  }

  /**
   * html-webpack-plugin
   */
  private _getHtmlWebpackPlugin(): HtmlWebpackPlugin | null {
    let useHtmlPlugin = this._settings.useHtmlPlugin
    if (_.isNil(useHtmlPlugin)) useHtmlPlugin = true
    if (!useHtmlPlugin) return null

    let projectUrl = this._projectUrl
    if (!projectUrl.endsWith('/')) {
      projectUrl += '/'
    }

    const template = this._settings.htmlTemplatePath || path.join(this._appRootDir, this._settings.publicDir || 'public', 'index.html')
    return new HtmlWebpackPlugin({
      filename: 'index.html',
      template,
      inject: true,
      showErrors: true,
      projectUrl,
      minify: {
        // 压缩html
        collapseWhitespace: true, // 压缩空白
        removeComments: true, // 去除注释
      },
    })
  }

  /**
   * webpack hot plugin
   */
  private _getHotPlugin(): webpack.HotModuleReplacementPlugin | null {
    if (this._production) return null
    return new webpack.HotModuleReplacementPlugin()
  }

  /**
   * vue loader plugin
   */
  private _getVuePlugin(): any {
    let languages = this._languages || []
    let hasVue: boolean = false
    for(let language of languages) {
      if ((language || '').toLowerCase().indexOf('vue') !== -1) {
        hasVue = true
        break
      }
    }
    if (!hasVue) return null

    // @ts-ignore
    const { VueLoaderPlugin } = require('vue-loader')
    return new VueLoaderPlugin()
  }

  /**
   * gzip plugin: compression-webpack-plugin, 生产环境默认开启
   */
  private _getGzipPlugin(): CompressionPlugin | null {
    if (!this._production) return null
    let useGzipPlugin = this._settings.useGzipPlugin
    if (_.isNil(useGzipPlugin)) {
      useGzipPlugin = true
    }

    if (!useGzipPlugin) return null
    return new CompressionPlugin({
      test: /\.(css|js)$/,
      minRatio: 0.8, // 压缩前后比例
      threshold: 0, // 文件大于多少字节时开始压缩
      algorithm: 'gzip',
    })
  }

  /**
   * workbox-webpack-plugin
   */
  private _getPwaPlugin(): GenerateSW | null {
    if (!this._production) return null

    let usePwaPlugin = this._settings.usePwaPlugin
    if (_.isNil(usePwaPlugin)) usePwaPlugin = this._production
    if (!usePwaPlugin) return null

    return new WorkboxPlugin.GenerateSW({
      cacheId: `${this._projectUrl}-pwa`, // 设置前缀
      // 这些选项帮助快速启用 ServiceWorkers, 不允许遗留任何“旧的” ServiceWorkers
      clientsClaim: true,
      skipWaiting: true,
      swDest: 'service-worker.js', // 输出 Service worker 文件
      exclude: [/\.(?:png|jpg|jpeg|css|svg)$/],
      excludeChunks: ['service-worker.js'], // 忽略的文件
      runtimeCaching: [
        // 配置路由请求缓存
        {
          urlPattern: /.*\.js/, // 匹配文件
          handler: 'NetworkFirst', // 网络优先
        },
      ],
    })
  }

  /**
   * preload plugin, 生产环境默认开启, 配合 html 插件使用
   * preload-webpack-plugin 不支持 webpack5, 请使用 @vue/preload-webpack-plugin 代替 .
   * see: https://github.com/GoogleChromeLabs/preload-webpack-plugin/issues
   */
  private _getPreloadPlugin(): null {
    if (!this._production || !this._settings.useHtmlPlugin) return null
    let usePreloadPlugin = this._settings.usePreloadPlugin
    if (_.isNil(usePreloadPlugin)) {
      usePreloadPlugin = true
    }

    if (!usePreloadPlugin) return null
    /*
    return new PreloadWebpackPlugin({
      rel: 'preload',
      as(entry) {
        if (/\.css$/.test(entry)) return 'style'
        if (/\.(woff|woff2|eot|ttf|otf)$/.test(entry)) return 'font'
        if (/\.(png|svg|jpg|jpeg|gif)$/.test(entry)) return 'image'
        return 'script'
      },
      include: 'allChunks', // asyncChunks
    })*/
    return null
  }

  /**
   * generate report
   */
  private _getReportPlugin(): BundleAnalyzerPlugin | null {
    if (!this._production) return null
    let generateReport = this._settings.generateReport
    if (_.isNil(generateReport)) {
      generateReport = true
    }

    if (!generateReport) return null
    return new BundleAnalyzerPlugin({
      analyzerMode: MutatePaths.getStaticDir(),
      openAnalyzer: false,
      reportFilename: path.join(this._output, MutatePaths.getReportName()),
    })
  }

  /**
   * open browser plugin
   */
  private _getOpenBrowserWebpackPlugin(): OpenBrowserWebpackPlugin | null {
    let openBrowser = this._settings.openBrowser
    if (_.isNil(openBrowser)) {
      openBrowser = true
    }

    if (!openBrowser) return null
    if (this._script === MutatePaths.getScripts()[0]) {
      return new OpenBrowserWebpackPlugin(Paths.getAddress(this._projectUrl, this._port) + (this._settings.visitSuffixUrl || ''))
    }

    return null
  }

  /**
   * copy-webpack-plugin
   */
  private _getCopyPlugin(): CopyWebpackPlugin | null {
    let useCopyPlugin = this._settings.useCopyPlugin
    if (_.isNil(useCopyPlugin)) {
      useCopyPlugin = true
    }

    if (!useCopyPlugin) return null

    let publicPath = path.join(this._appRootDir, this._settings.publicDir || 'public')
    if (!fsExtra.pathExistsSync(publicPath)) return null

    // 判断是否只有一个 index.html 文件
    let files = fsExtra.readdirSync(publicPath)
    if (files.length === 0) return null
    if (files.length === 1) {
      if (files[0] === '.DS_Store' || files[0] === 'index.html') return null
    }

    return new CopyWebpackPlugin({
      patterns: [
        {
          from: publicPath,
          globOptions: {
            dot: true,
            // gitignore: true,
            ignore: ['**/index.html'],
          },
          to: '[name][ext]',
        },
      ],
    })
  }

  /**
   * add plugins
   */
  private _addPlugin(plugin) {
    if (_.isNil(plugin)) return
    this._plugins.push(plugin)
  }

  /**
   * get plugins
   */
  private _getPlugins() {
    this._addPlugin(new CleanWebpackPlugin())
    this._addPlugin(this._getCopyPlugin())
    this._addPlugin(this._getMiniCssPlugin())
    this._addPlugin(this._getPurgecssPlugin())
    this._addPlugin(this._getDefinePlugin(this._stringified))
    this._addPlugin(this._getProvidePlugin())
    this._addPlugin(this._getInlineChunkHtmlPlugin())
    this._addPlugin(this._getHtmlWebpackPlugin())
    // this._addPlugin(this._getHotPlugin())
    this._addPlugin(this._getGzipPlugin())
    // this._addPlugin(this._getPreloadPlugin())
    this._addPlugin(this._getPwaPlugin())
    this._addPlugin(this._getReportPlugin())
    // this._addPlugin(this._getVuePlugin())
    this._addPlugin(this._getOpenBrowserWebpackPlugin())
    this._addPlugin(new ProgressBarWebpackPlugin()) // progress bar
    this._plugins = this._plugins.concat(this._getDllPlugin())
    this._addPlugin(this._getAddAssetHtmlPlugin())
  }

  public getPlugins() {
    return this._plugins || []
  }
}
