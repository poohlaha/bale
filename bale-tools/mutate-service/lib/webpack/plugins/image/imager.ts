/**
 * @fileOverview webpack 图片 plugin、loader 基类, 由于部分插件不支持 windows, 等待插件更新, 暂时废弃
 * @date 2023-03-21
 * @author poohlaha
 */
import * as _ from 'lodash'
import { validate } from 'schema-utils'
import mozjpeg from 'imagemin-mozjpeg'
import gifsicle from 'imagemin-gifsicle'
import jpegtran from 'imagemin-jpegtran'
import optipng from 'imagemin-optipng'
import svgo from 'imagemin-svgo'
import webp from 'imagemin-webp'
import pngquant from 'imagemin-pngquant'
import { IImageMinimizerOptions } from '../../utils/type'
import { Utils } from '@bale-tools/utils'

/*
    "imagemin": "^7.0.1",
    "imagemin-gifsicle": "^7.0.0",
    "imagemin-jpegtran": "^7.0.0",
    "imagemin-pngquant": "^9.0.2",
    "imagemin-optipng": "^8.0.0",
    "imagemin-svgo": "^9.0.0",
    "imagemin-mozjpeg": "^9.0.0",
    "imagemin-webp": "^6.1.0",
 */
const schema = {
  additionalProperties: false,
  properties: {
    mozjpeg: {
      additionalProperties: true,
      type: 'object',
    },
    optipng: {
      additionalProperties: true,
      type: 'object',
    },
    pngquant: {
      additionalProperties: true,
      type: 'object',
    },
    gifsicle: {
      additionalProperties: true,
      type: 'object',
    },
    webp: {
      additionalProperties: true,
      type: 'object',
    },
    svgo: {
      additionalProperties: true,
      type: 'object',
    },
  },
}

export default class Imager {
  public _options: IImageMinimizerOptions = {}
  public _plugins: Array<any> = []
  public readonly _defaultOpts: IImageMinimizerOptions = {
    mozjpeg: {
      progressive: true,
    },
    optipng: {
      optimizationLevel: 5,
    },
    gifsicle: {
      interlaced: true,
    },
    jpegtran: {
      progressive: true,
    },
    webp: {},
    svgo: {
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
  }

  constructor(opts: boolean | IImageMinimizerOptions | undefined, name: string = '') {
    this._init(this._getOpts(opts), name)
  }

  private _getOpts(opts: boolean | IImageMinimizerOptions | undefined): IImageMinimizerOptions {
    // boolean -> false
    if ((typeof opts === 'boolean' && !opts) || opts === undefined) {
      return {}
    }

    let options = {}
    // undefined | boolean -> true
    if (typeof opts === 'boolean') {
      options = {}
    } else {
      // object
      options = opts || {}
    }

    return options
  }

  private _init(opts: IImageMinimizerOptions, name: string = '') {
    this._options = _.cloneDeep(opts || {})
    this._getOption('mozjpeg')
    this._getOption('optipng')
    this._getOption('pngquant')
    this._getOption('gifsicle')
    this._getOption('jpegtran')
    this._getOption('webp')
    this._getOption('svgo')

    // @ts-ignore
    validate(schema, opts, {
      name,
    })

    // mozjpeg
    if (!Utils.isObjectNull(this._options.mozjpeg)) {
      // @ts-ignore
      this._plugins.push(mozjpeg(this._options.mozjpeg))
    }

    // optipng
    if (!Utils.isObjectNull(this._options.optipng)) {
      // @ts-ignore
      this._plugins.push(optipng(this._options.optipng))
    }

    // pngquant, WINDOWS 不兼容
    if (!Utils.isObjectNull(this._options.pngquant)) {
      // @ts-ignore
      this._plugins.push(pngquant(this._options.pngquant))
    }

    // gifsicle, WINDOWS 不兼容
    if (!Utils.isObjectNull(this._options.gifsicle)) {
      // @ts-ignore
      this._plugins.push(gifsicle(this._options.gifsicle))
    }

    // jpegtran, WINDOWS 不兼容
    if (!Utils.isObjectNull(this._options.jpegtran)) {
      // @ts-ignore
      this._plugins.push(jpegtran(this._options.jpegtran))
    }

    // svgo
    if (!Utils.isObjectNull(this._options.svgo)) {
      // @ts-ignore
      this._plugins.push(svgo(this._options.svgo))
    }

    // webp
    if (!Utils.isObjectNull(this._options.webp)) {
      this._plugins.push(webp(this._options.webp))
    }
  }

  private _getOption(opts: string = '') {
    if (_.isNil(this._options[opts]) || Utils.isObjectNull(this._options[opts])) {
      this._options[opts] = this._defaultOpts[opts] || {}

      if (Utils.isObjectNull(this._options[opts])) {
        delete this._options[opts]
      }
    }
  }
}
