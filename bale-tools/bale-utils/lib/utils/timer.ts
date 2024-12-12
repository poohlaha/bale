/**
 * @fileOverview 定时器
 * @date 2023-03-09
 * @author poohlaha
 */
import BaleLogger from './logger'

// logger
const Logger = new BaleLogger('[Bale Git Tool]:')

class TimeoutError extends Error {
  constructor(message) {
    super(message)
    this.name = 'TimeoutError'
  }
}

const Timer = function (promise, milliseconds, fallback, options) {
  let timer
  const cancelablePromise = new Promise((resolve, reject) => {
    // math.sign 此函数共有5种返回值, 分别是1, -1, 0, -0, NaN.代表的各是正数, 负数, 正零, 负零, NaN
    if (typeof milliseconds !== 'number' || Math.sign(milliseconds) !== 1) {
      Logger.error(`Expected \`milliseconds\` to be a positive number, got \`${milliseconds}\``)
      return
    }

    if (milliseconds === Number.POSITIVE_INFINITY) {
      // 正无穷大
      resolve(promise)
      return
    }

    options = {
      customTimers: { setTimeout, clearTimeout },
      ...options
    }

    timer = options.customTimers.setTimeout.call(
      undefined,
      () => {
        if (typeof fallback === 'function') {
          try {
            resolve(fallback())
          } catch (error) {
            reject(error)
          }

          return
        }

        const message = typeof fallback === 'string' ? fallback : `Promise timed out after ${milliseconds} milliseconds`
        const timeoutError = fallback instanceof Error ? fallback : new TimeoutError(message)

        if (typeof promise.cancel === 'function') {
          promise.cancel()
        }

        reject(timeoutError)
      },
      milliseconds
    )(async () => {
      try {
        resolve(await promise)
      } catch (error) {
        reject(error)
      } finally {
        options.customTimers.clearTimeout.call(undefined, timer)
      }
    })()
  })

  cancelablePromise['clear'] = () => {
    clearTimeout(timer)
    timer = undefined
  }

  return cancelablePromise
}

export { TimeoutError, Timer }
