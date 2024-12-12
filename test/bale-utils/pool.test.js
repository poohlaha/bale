/**
 * @fileOverview ThreadPool
 * @date 2023-03-14
 * @author poohlaha
 */
const test = require('ava')
const path = require('path')
const { getLoggerPrefix, getFile } = require('../base.test')

const loggerPrefix = getLoggerPrefix()

let ThreadPool = null
test.before(t => {
  ThreadPool = getFile('bale-utils', path.join('pool', 'index.js'), 'Thread Pool')
})

test('test thread pool: ', async t => {
  if (!ThreadPool) {
    t.pass()
    return
  }

  const threadPool = new ThreadPool(5)
  let tasks = []
  for (let i = 1; i <= 10; i++) {
    tasks.push({
      task: () => {
        console.log(loggerPrefix + `Processed ${i}`)
      },
      // timeout: 10000,
      callback: () => {}
    })
  }

  await threadPool.addTasks(tasks)
  console.log(loggerPrefix + 'Completed .')
  threadPool.killAll()
  t.pass()
})

test.after(t => {
  console.info(loggerPrefix + 'Done .')
})
