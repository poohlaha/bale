/**
 * @fileOverview Queue
 * @date 2023-03-09
 * @author poohlaha
 */
import * as childProcess from 'node:child_process'
import { ChildProcess } from 'node:child_process'
import path from 'node:path'
import Symbols from './helper'
import ThreadPool from './index'

export default class Queue {
  private readonly _logger: any = null
  private _counter: number
  private readonly _cache: { [K: string]: any }

  constructor(logger) {
    this._logger = logger
    this._counter = 0
    this._cache = {}
  }

  public createProcess(pool: ThreadPool): ChildProcess {
    /*
         const child = childProcess.fork('', [], {
           execPath: 'node',
           execArgv: ['-e', this.getProcessBody()],
         })
          */
    const child = childProcess.fork(path.join(__dirname, 'handlers.js'))
    pool[Symbols.PIDS].push(child)

    // new properties to help work with promises.
    child[Symbols.RESOLVER] = null
    child[Symbols.REJECTER] = null
    child[Symbols.TIMER] = null
    child[Symbols.KILLSIGINT] = false

    // close
    child.on('close', data => {
      child[Symbols.REJECTER]?.(data)
      pool[Symbols.PIDS].splice(pool[Symbols.PIDS].indexOf(child), 1)
      !child[Symbols.KILLSIGINT] && this.createProcess(pool)
    })

    child.on('message', (msg: any) => {
      switch (msg.type) {
        case 'done':
          return this._onComplete(pool, child, msg)
        case 'message':
          return this._onMessage(pool, child, msg)
        default:
          return
      }
    })

    pool[Symbols.WAITING].push(child)
    this._checkTaskQueue(pool)
    return child
  }

  private _checkTaskQueue(pool: ThreadPool) {
    if (pool[Symbols.TASK_QUEUE].length === 0) {
      // this.logger.info(`1 new idle thread. ${chalk.cyan(`${pool[symbols.WAITING].length}/${pool[symbols.MAX_SIZE]}`)} threads idle.`)
      return
    }

    const task = pool[Symbols.TASK_QUEUE].shift()
    pool
      .addTask(task.task)
      .then(data => task.resolve(data))
      .catch(data => task.catch(data))
  }

  private _req(path): any {
    if (this._cache[path]) {
      return this._cache[path]
    } else {
      const required = require(path)
      const captured = required.default ? required.default : required
      this._cache[path] = captured
      return captured
    }
  }

  private _onComplete(pool, child, msg) {
    try {
      this._counter++
      const resolver = child[Symbols.RESOLVER]
      const callback = child[Symbols.CALLBACK]
      const task = child[Symbols.TASK]
      child[Symbols.TIMER] && clearTimeout(child[Symbols.TIMER])

      child[Symbols.RESOLVER] = null
      child[Symbols.REJECTER] = null
      child[Symbols.TASK] = null
      child[Symbols.CALLBACK] = null
      child[Symbols.TIMER] = null

      pool[Symbols.WAITING].push(child)
      this._checkTaskQueue(pool)

      const msgData = msg.data || {}
      // task
      if (typeof task === 'function') {
        task(msgData || {})
      } else if (typeof task === 'string') {
        this._req(task)
      }

      // resolve
      resolver?.(msgData)

      // callback
      callback?.()
    } catch (e) {
      this._logger.error(e)
    } finally {
      if (pool.getTotalCounter() === this._counter && pool.getCompleteTasksShutDown()) {
        pool.killAll()
      }
    }
  }

  private _onMessage(pool, child, msg) {
    const reply = data => child.send({ type: 'reply', id: msg.id, data: data })
    pool[Symbols.HANDLER]?.(msg.data, reply)
  }
}
