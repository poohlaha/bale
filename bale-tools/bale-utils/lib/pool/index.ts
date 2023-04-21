/**
 * @fileOverview Pool
 * @date 2023-03-09
 * @author poohlaha
 */
import chalk from 'chalk'
import os from 'node:os'
import Symbols from './helper'
import Queue from './queue'
import BaleLogger from '../utils/logger'

// logger
const Logger = new BaleLogger('[Bale Thread Pool]:')

interface ITaskProps {
  task: () => void
  callback?: () => void
  timeout?: number
}

export default class ThreadPool {
  private readonly _defaultPoolSize: number
  private readonly _completeTasksShutDown: boolean
  private readonly _counter: number
  private readonly _done: Function | null | undefined

  private _totalCounter: number
  private _queue: Queue
  private _startTime: number = -1

  constructor(size: number, completeTasksShutDown: boolean = false, done?: Function) {
    this._defaultPoolSize = os.cpus() === undefined ? 1 : os.cpus().length // 线程数
    this[Symbols.MAX_SIZE] = Math.sign(size) >= 1 ? size : this._defaultPoolSize
    this[Symbols.HANDLER] = null
    this[Symbols.WAITING] = []
    this[Symbols.TASK_QUEUE] = []
    this[Symbols.PIDS] = []
    this._completeTasksShutDown = completeTasksShutDown
    this._counter = 0
    this._totalCounter = 0
    this._queue = new Queue(Logger)
    this._done = done
    this._init()
  }

  /**
   * 初始化
   */
  private _init() {
    Logger.info(`Starting ${chalk.magenta('Thread Pool')} .`)
    this._startTime = new Date().getTime()
    const amount = this[Symbols.MAX_SIZE] - this[Symbols.WAITING].length
    for (let i = 0; i < amount; i += 1) {
      this._queue.createProcess(this)
    }

    Logger.info(`${chalk.magenta(amount)} processes alive .`)
  }

  /**
   * 添加多个任务
   */
  public addTasks(tasks: Array<ITaskProps> = []): Promise<any> {
    this._totalCounter += tasks.length
    const taskList: Array<any> = []
    for (let task of tasks) {
      taskList.push(this.addTask(task))
    }

    return Promise.all(taskList)
  }

  /**
   * 添加任务
   * @param task
   */
  public addTask(task: ITaskProps): Promise<any> {
    return new Promise((resolve, reject) => {
      // has waiting work
      if (this[Symbols.WAITING].length === 0) {
        this[Symbols.TASK_QUEUE].push({
          task,
          resolve: resolve,
          reject: reject,
        })

        // Logger.info(`New task waiting for idle thread. ${chalk.cyan(this[symbols.TASK_QUEUE].length)} tasks waiting.`)
        return
      }

      const child = this[Symbols.WAITING].pop()
      child[Symbols.TASK] = task.task || null
      child[Symbols.CALLBACK] = task.callback || null
      child[Symbols.RESOLVER] = resolve
      child[Symbols.REJECTER] = reject
      this._getTaskChild(child, task)
    })
  }

  private _getTaskChild(child: any, task: ITaskProps | 'string') {
    const params: { [K: string]: any } = {
      type: 'task',
      data: task,
      isFunction: false,
    }
    if (typeof task === 'string') {
      // file
      child.send(params)
    } else if (typeof task.task === 'function') {
      params.data.task = task.task.toString()
      params.isFunction = true
      child.send(params)
    } else {
      Logger.error('Tasks may only be functions or paths to JavaScript files.')
    }

    // timeout
    if (typeof task === 'object' && task.timeout && Math.sign(task.timeout) >= 1) {
      child[Symbols.TIMER] = setTimeout(() => child.kill('SIGINT'), task.timeout)
    }
  }

  public onMessage(fn) {
    this[Symbols.HANDLER] = fn
  }

  public killAll() {
    this[Symbols.PIDS].forEach(child => {
      child.kill('SIGINT')
      child[Symbols.KILLSIGINT] = true
    })

    this[Symbols.PIDS] = []
    const endTime = new Date().getTime()
    Logger.info(`Shutdown ${chalk.magenta('Thread Pool')} after ${chalk.magenta(`${endTime - this._startTime} ms`)} .`)
    this._done?.()
  }

  public getCompleteTasksShutDown() {
    return this._completeTasksShutDown
  }

  public getTotalCounter() {
    return this._totalCounter || 0
  }
}
