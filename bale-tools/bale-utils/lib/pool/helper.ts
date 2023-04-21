/**
 * @fileOverview 线程池常量, Symbol 类型
 * @date 2023-03-09
 * @author poohlaha
 */
export default {
  MAX_SIZE: Symbol(), // max size
  TASK_QUEUE: Symbol(), // task queue
  WAITING: Symbol(), // waiting
  PIDS: Symbol(), // pids
  RESOLVER: Symbol(), // resolver
  REJECTER: Symbol(), // rejecter
  CALLBACK: Symbol(), // callback
  TASK: Symbol(), // task
  KILLSIGINT: Symbol(), // killsigint
  TIMER: Symbol(), // timer
  HANDLER: Symbol(), // handler
}
