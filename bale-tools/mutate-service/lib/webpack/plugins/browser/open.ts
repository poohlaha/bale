/**
 * @fileOverview 此插件会在 webpack 编译完成，才打开浏览器
 * @date 2023-03-13
 * @author poohlaha
 */
import chalk from 'chalk'
import open from 'open'
import { Compiler } from 'webpack'

export default class OpenBrowserWebpackPlugin {
  private readonly _url: string

  constructor(url: string = '') {
    this._url = url || ''
  }

  private _once(fn: Function) {
    let called = false
    return function () {
      if (called) return
      called = true
      fn()
    }
  }

  public apply(compiler: Compiler) {
    compiler.hooks.done.tap(
      'OpenBrowserWebpackPlugin',
      this._once(compilation => {
        let url = this._url || ''
        if (!url) {
          console.error(chalk.red('Webpack open browser error, please pass a url ...'))
          return
        }

        setTimeout(async function () {
          await open(url)
        })
      })
    )
  }
}
