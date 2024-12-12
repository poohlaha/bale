# @bale-utils 公共文件包

## `lib` 项目目录结构

```
├── git                                              // git
├── pool                                             // 多线程
├── utils                                            // utils
└── version                                          // 版本检查
```

## 使用

```javascript
const { Utils, Paths } = require('@bale-tools/utils') // 引入
console.log(Utils) // utils 的所有方法
console.log(Paths) // 返回 app 和 own 各类属性, 获取package.json文件、node_modules下的package.json及根目录等
```

### 多线程使用

- 参数

```text
1. 构造函数: size, completeTasksShutDown
* size: 线程池大小, 默认取 cpu 核数
* completeTasksShutDown: 完成任务是否关闭线程池, 默认为 false, 如果为 true, 则在第一次任务完成后关闭

2. task: object 对象, task, timeout, callback
* task: 任务函数或任务文件
* timeout: 线程超过 timeout 后未完成则立刻停止
* callback: 当前线程结束后的回调
```

```javascript
const { ThreadPool } = require('@bale-tools/utils')

const threadPool = new ThreadPool()
let tasks = []
for (let i = 1; i <= 100; i++) {
  tasks.push({
    task: () => {
      console.log(`Processed ${i}: ${str.length}`)
    },
    timeout: 10000,
    callback: () => {
      console.log('callback')
    }
  })
}

let tasks2 = []
for (let i = 1; i <= 200; i++) {
  tasks2.push({
    task: () => {
      console.log('test2: ' + i)
    }
  })
}

await threadPool.addTasks(tasks)
await threadPool.addTasks(tasks2)
threadPool.killAll()
```
