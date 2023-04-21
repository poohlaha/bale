/**
 * @fileOverview webpack 图片 plugin, 由于部分插件不支持 windows, 等待插件更新, 暂时废弃
 * @date 2023-03-21
 * @author poohlaha
 */
import * as _ from 'lodash'
import * as imagemin from 'imagemin'
import os from 'node:os'
import { IImageMinimizerOptions } from '../../utils/type'
import { Compiler, Compilation, Asset } from 'webpack'
import Imager from './imager'
import serialize from 'serialize-javascript'
import Worker from './worker'

// jpe?g|png|gif|tif|webp|svg|avif|jxl
class ImageMinimizerPlugin extends Imager {
  private readonly _name: string
  private readonly _test: RegExp = /\.(jpe?g|png|gif|tif|webp|svg|avif|jxl)$/i
  private readonly _minimizers: object

  constructor(opts: boolean | IImageMinimizerOptions | undefined) {
    const name: string = 'ImageMinimizerPlugin'
    super(opts, name)
    this._name = name
    this._minimizers = {
      test: this._test,
      minimizer: {
        implementation: this._imageminMinify,
        options: {
          plugins: this._plugins || [],
        },
      },
    }
  }

  private async _imageminMinify(original, options): Promise<{ [K: string]: any }> {
    let result

    try {
      // @ts-ignore
      result = await imagemin.buffer(original.data, options)
    } catch (error: any) {
      const originalError = error instanceof Error ? error : new Error(error)
      const newError = new Error(`Error with '${original.filename}': ${originalError.message}`)

      original.errors.push(newError)
      return {}
    }

    return {
      filename: original.filename,
      data: result,
      warnings: [...original.warnings],
      errors: [...original.errors],
      info: {
        ...original.info,
        minimized: true,
        minimizedBy: ['imagemin', ...(original.info?.minimizedBy ?? [])],
      },
    }
  }

  private async _optimize(compiler: Compiler, compilation: Compilation, assets) {
    const cache = compilation.getCache(this._name)
    const assetsForTransformers = (
      await Promise.all(
        Object.keys(assets)
          .filter((name: string) => {
            const asset: Readonly<Asset> | undefined = compilation.getAsset(name)
            if (_.isNil(asset) || !asset) return false

            // Skip double minimize assets from child compilation
            if (asset.info.minimized || asset.info.generated) {
              return false
            }

            if (!compiler.webpack.ModuleFilenameHelpers.matchObject(this._minimizers, name)) {
              return false
            }

            return true
          })
          .map(async (name: string) => {
            const asset: Readonly<Asset> | undefined = compilation.getAsset(name)
            if (_.isNil(asset) || !asset) return []

            const { info, source } = asset

            const getFromCache = async transformer => {
              const cacheName = serialize({ name, transformer })
              const eTag = cache.getLazyHashedEtag(source)
              const cacheItem = cache.getItemCache(cacheName, eTag)
              const output = await cacheItem.getPromise()

              return {
                name,
                info,
                inputSource: source,
                output,
                cacheItem,
                transformer,
              }
            }

            const tasks: Array<any> = []
            tasks.push(await getFromCache(this._minimizers))
            return tasks
          })
      )
    ).flat()

    const limit: number = Math.max(1, os.cpus()?.length ?? 1)
    const { RawSource } = compiler.webpack.sources
    let worker: Worker = new Worker()
    const scheduledTasks = assetsForTransformers.map(asset => async () => {
      const { name, info, inputSource, cacheItem, transformer } = asset
      let { output } = asset
      let input

      const sourceFromInputSource = inputSource.source()
      if (!output) {
        input = sourceFromInputSource

        if (!Buffer.isBuffer(input)) {
          input = Buffer.from(input)
        }

        const minifyOptions: { [K: string]: any } = {
          filename: name,
          info,
          input,
          transformer,
          generateFilename: compilation.getAssetPath.bind(compilation),
        }
        output = await worker.transform(minifyOptions)

        output.source = new RawSource(output.data)

        await cacheItem.storePromise({
          source: output.source,
          info: output.info,
          filename: output.filename,
          warnings: output.warnings,
          errors: output.errors,
        })
      }

      compilation.warnings = [...compilation.warnings, ...output.warnings]
      compilation.errors = [...compilation.errors, ...output.errors]
      if (compilation.getAsset(output.filename)) {
        compilation.updateAsset(output.filename, output.source, output.info)
      } else {
        compilation.emitAsset(output.filename, output.source, output.info)
        compilation.deleteAsset(name)
      }
    })

    await worker.throttleAll(limit, scheduledTasks)
  }

  public async apply(compiler: Compiler) {
    const pluginName: string = this._name
    const { webpack } = compiler
    const { Compilation } = webpack

    // 绑定到 “thisCompilation” 钩子，
    // 以便进一步绑定到 compilation 过程更早期的阶段
    compiler.hooks.compilation.tap(pluginName, (compilation: Compilation) => {
      // 绑定到资源处理流水线(assets processing pipeline)
      compilation.hooks.processAssets.tapPromise(
        {
          name: pluginName,
          // 用某个靠后的资源处理阶段，
          // 确保所有资源已被插件添加到 compilation
          stage: Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_SIZE,
          additionalAssets: true,
        },
        async assets => {
          // "assets" 是一个包含 compilation 中所有资源(assets)的对象。
          // 该对象的键是资源的路径，
          // 值是文件的源码
          await this._optimize(compiler, compilation, assets)
        }
      )
    })
  }
}

export default ImageMinimizerPlugin
