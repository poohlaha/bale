/**
 * @fileOverview webpack 图片 loader, 由于部分插件不支持 windows, 等待插件更新, 暂时废弃
 * @date 2023-03-21
 * @author poohlaha
 */

import * as imagemin from 'imagemin'
import * as loaderUtils from 'loader-utils'
import { IImageMinimizerOptions } from '../../utils/type'
import Imager from './imager'

// jpe?g|png|gif|tif|webp|svg|avif|jxl
class ImageMinimizerLoader extends Imager {
  private readonly _content: any
  private readonly _name: string

  constructor(content: any, opts: IImageMinimizerOptions = {}) {
    const name: string = 'imageMinimizerLoader'
    super(opts, name)
    this._name = name
    this._content = content
  }

  public async apply(self: any) {
    // @ts-ignore
    const callback = self.async()

    imagemin
      .buffer(this._content, {
        plugins: this._plugins,
      })
      .then(data => {
        callback(null, data)
      })
      .catch(err => {
        callback(err)
      })
  }
}

export default function (content) {
  // @ts-ignore
  const options = loaderUtils.getOptions(this)
  // @ts-ignore
  return new ImageMinimizerLoader(content, options).apply(this)
}

module.exports.raw = true // 获取的文件内容为二进制字符串
