/**
 * @fileOverview webpack worker, 由于部分插件不支持 windows, 等待插件更新, 暂时废弃
 * @date 2023-03-21
 * @author poohlaha
 */

const isFilenameProcessed = Symbol('isFilenameProcessed')
export default class Worker {
  private _processFilenameTemplate(result: { [K: string]: any } = {}, options, filenameTemplate) {
    if (
      // @ts-ignore
      // eslint-disable-next-line no-undef
      !result.info[isFilenameProcessed] &&
      typeof filenameTemplate !== 'undefined' &&
      typeof options.generateFilename === 'function'
    ) {
      result.filename = options.generateFilename(filenameTemplate, {
        filename: result.filename,
      })

      result.filename = result.filename.replace(/\[width\]/gi, result.info.width).replace(/\[height\]/gi, result.info.height)

      // @ts-ignore
      // eslint-disable-next-line no-undef
      result.info[isFilenameProcessed] = true
    }
  }

  async transform(options: { [K: string]: any } = {}) {
    let result: { [K: string]: any } = {
      data: options.input,
      filename: options.filename,
      warnings: [],
      errors: [],
      info: {
        sourceFilename:
          options.info && typeof options.info === 'object' && typeof options.info.sourceFilename === 'string'
            ? options.info.sourceFilename
            : typeof options.filename === 'string'
            ? options.filename
            : undefined,
      },
    }

    if (!result.data) {
      result.errors.push(new Error('Empty input'))
      return result
    }

    const transformers: Array<any> = Array.isArray(options.transformer) ? options.transformer : [options.transformer]
    let filenameTemplate
    for (const transformer of transformers) {
      if (typeof transformer.filter === 'function' && !transformer.filter(options.input, options.filename)) {
        continue
      }

      let processedResult: { [K: string]: any } = {}

      try {
        // eslint-disable-next-line no-await-in-loop
        processedResult = await transformer.minimizer.implementation(result, transformer.minimizer.options)
      } catch (error: any) {
        result.errors.push(error instanceof Error ? error : new Error(error))

        return result
      }

      if (processedResult && !Buffer.isBuffer(processedResult.data)) {
        result.errors.push(new Error('minimizer function does not return the `data` property or result is not a `Buffer` value'))
        return result
      }

      if (processedResult) {
        result = processedResult
        filenameTemplate ??= transformer.filename
      }
    }

    result.info ??= {}
    result.errors ??= []
    result.warnings ??= []
    result.filename ??= options.filename
    this._processFilenameTemplate(result, options, filenameTemplate)
    return result
  }

  public throttleAll(limit, tasks) {
    if (!Number.isInteger(limit) || limit < 1) {
      throw new TypeError(`Expected 'limit' to be a finite number > 0, got \`${limit}\` (${typeof limit})`)
    }

    if (!Array.isArray(tasks) || !tasks.every(task => typeof task === 'function')) {
      throw new TypeError('Expected `tasks` to be a list of functions returning a promise')
    }

    return new Promise((resolve, reject) => {
      const result: Array<any> = []
      const entries = tasks.entries()
      let tasksFulfilled = 0

      const next = () => {
        const { done, value } = entries.next()

        if (done) {
          if (tasksFulfilled === tasks.length) {
            resolve(result)
            return
          }

          return
        }

        const [index, task] = value

        const onFulfilled = taskResult => {
          result[index] = taskResult
          tasksFulfilled += 1
          next()
        }

        task().then(onFulfilled, reject)
      }

      for (let i = 0; i < limit; i++) {
        next()
      }
    })
  }
}
