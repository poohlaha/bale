/**
 * @fileOverview compile vue
 * @date 2023-03-10
 * @author poohlaha
 */
import * as _ from 'lodash'
import componentCompilerUtils from '@vue/component-compiler-utils'
import vueTemplateCompiler from 'vue-template-compiler'
import fsExtra from 'fs-extra'
import hash from 'hash-sum'
import path from 'node:path'
import CookPaths from '../utils/paths'
import CompileStyle from './compile-style'
import CompileJs from './compile-js'
import { ICompileVueOptions } from '../utils/type'
import { Logger as BaleLogger, Utils } from '@bale-tools/utils'

// logger
const Logger = new BaleLogger(CookPaths.getLoggerName())

// render
const RENDER_FN = '__vue_render__'
const STATIC_RENDER_FN = '__vue_staticRenderFns__'

export default class CompileVue {
  private readonly _mode: 'commonjs' | 'ES2015'
  private readonly _filePath: string
  private readonly _appRootDir: string

  constructor(opts: ICompileVueOptions) {
    const clonedOpts = _.cloneDeep(opts || {}) // clone opts
    this._mode = clonedOpts.mode
    this._filePath = clonedOpts.filePath || ''
    this._appRootDir = clonedOpts.appRootDir || ''
  }

  /**
   * export keyword
   */
  private _getExportKeyword(script: string = ''): string {
    const EXPORT_DEFAULT: string = 'export default {'
    const EXPORT_WITH_DEFINE_COMPONENT: string = 'export default defineComponent({'
    return script.includes(EXPORT_WITH_DEFINE_COMPONENT) ? EXPORT_WITH_DEFINE_COMPONENT : EXPORT_DEFAULT
  }

  /**
   * get style path
   */
  private _getVueStylePath(ext = '', index: number = 0): string {
    const number: string = index !== 0 ? `-${index + 1}` : ''
    return CookPaths.replaceExt(this._filePath, `-sfc${number}.${ext}`)
  }

  /**
   * inject render
   */
  private _injectRender(script: string = '', render: string = ''): string {
    script = CookPaths.trim(script)
    script = render.replace('var render', `var ${RENDER_FN}`).replace('var staticRenderFns', `var ${STATIC_RENDER_FN}`)
    const exportKeyword: string = this._getExportKeyword(script)
    return script.replace(exportKeyword, `${render}\n${exportKeyword}\n  render: ${RENDER_FN},\n\n  staticRenderFns: ${STATIC_RENDER_FN},\n`)
  }

  /**
   * inject style
   */
  private _injectStyle(script: string = '', styles: Array<any>): string {
    if (styles.length) {
      const exportKeyword: string = this._getExportKeyword(script)
      const imports = styles
        .map((style, index: number = 0) => {
          const { base } = path.parse(this._getVueStylePath('css', index))
          return `import './${base}';`
        })
        .join('\n')

      return script.replace(exportKeyword, `${imports}\n\n${exportKeyword}`)
    }

    return script
  }

  /**
   * inject scopeId
   */
  private _injectScopeId(script = '', scopeId): string {
    const exportKeyword = this._getExportKeyword(script)
    return script.replace(exportKeyword, `${exportKeyword}\n  _scopeId: '${scopeId}',\n\n`)
  }

  public async compile(): Promise<any> {
    try {
      if (!fsExtra.pathExistsSync(this._filePath)) {
        Logger.error('file path is not exists:', this._filePath)
      }
      const source: string = fsExtra.readFileSync(this._filePath, 'utf-8')
      const options: any = {
        source,
        compiler: vueTemplateCompiler,
        needMap: false,
      }
      const descriptor = componentCompilerUtils.parse(options)

      const { template, script, styles } = descriptor
      const hasScoped = styles.some(s => s.scoped)
      const scopeId = hasScoped ? `data-v-${hash(source)}` : ''

      const tasks: Array<Promise<any>> = []
      if (script) {
        const lang = script.lang || 'js'
        const tmpFileNamePath = CookPaths.replaceExt(this._filePath, `.${lang}`)
        tasks.push(
          new Promise((resolve, reject) => {
            let content = script.content
            content = this._injectStyle(content, styles)

            if (template) {
              const options: any = {
                compiler: vueTemplateCompiler,
                source: template.content,
                isProduction: true,
              }
              const result = componentCompilerUtils.compileTemplate(options)
              content = this._injectRender(content, result.code)
            }

            if (scopeId) {
              content = this._injectScopeId(content, scopeId)
            }

            fsExtra.writeFileSync(tmpFileNamePath, content)
            fsExtra.unlinkSync(this._filePath) // 删除临时目录下的 .vue 文件
            new CompileJs({
              mode: this._mode,
              appRootDir: this._appRootDir,
              filePath: tmpFileNamePath,
            })
              .compile()
              .then(resolve)
              .catch(reject)
          })
        )
      }

      // compile style part
      tasks.push(
        ...styles.map(async (style, index) => {
          const cssFilePath = this._getVueStylePath(style.lang || 'css', index)
          let styleSource = CookPaths.trim(style.content)
          if (style.scoped) {
            styleSource = componentCompilerUtils.compileStyle({
              id: scopeId,
              scoped: true,
              source: styleSource,
              filename: cssFilePath,
              preprocessLang: style.lang,
            }).code
          }

          fsExtra.writeFileSync(cssFilePath, styleSource)
          return await new CompileStyle({
            appRootDir: this._appRootDir,
            filePath: cssFilePath,
          }).compile()
        })
      )

      return Promise.all(tasks)
    } catch (e) {
      Logger.error('Compile Vue Error !', e)
    }
  }
}
