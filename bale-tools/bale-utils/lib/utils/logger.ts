/**
 * 日志
 */
import chalk from 'chalk'

export default class Logger {
  private readonly _DEFAULT_LOGGER_NAME = '[Bale Logger]:'
  private readonly _name: string = ''
  private readonly _loggerPrefix: string = ''

  constructor(name = '') {
    this._name = name || '[Bale Logger]:'
    this._loggerPrefix = chalk.cyan(this._name)
  }

  info(msg: string = '', color: string = 'whiteBright') {
    console.info(`${this._loggerPrefix} ${chalk[color](msg || '')}`)
  }

  error(msg: string = '', error: any = null, color: string = 'red') {
    console.error(`${this._loggerPrefix} ${chalk[color](msg || '', error)}`)
  }

  debug(msg: string = '', color: string = 'yellowBright') {
    console.debug(`${this._loggerPrefix} ${chalk[color](msg || '')}`)
  }

  throw(msg: string = '', error: any = null, color: string = 'red') {
    const message = `${this._loggerPrefix} ${chalk[color](msg || '', error)}`
    throw new Error(message)
  }
}
