/**
 * @fileOverview Pool handlers for childProcess.fork method
 * @date 2023-03-09
 * @author poohlaha
 */
let __messageHandlers = {}
let __counter = -1

class Handler {
  genId(): string {
    if (__counter > 9999999999) {
      __counter = -1
    }
    return `${+new Date()}:${__counter}`
  }

  finish(output) {
    process.send?.({
      type: 'done',
      data: output,
    })

    __messageHandlers = {}
  }

  sanitizeFn(text: string = ''): string {
    return text.trim().replace(/^function\s*\(/, 'function __(')
  }

  err() {
    process.exit(1)
  }

  send(data: any): { [K: string]: any } {
    const id = this.genId()
    process.send?.({ type: 'message', data: data, id: id })
    return { onReply: fn => (__messageHandlers[id] = fn) }
  }
}

const execTask = function (msg: any) {
  /* 此部分放在 onComplete 中执行
    if (!msg.data.task) return
    let task
    msg.isFunction ? eval(`task = ${sanitizeFn(msg.data.task)}`) : (task = req(msg.data.task))
    task(this, handler)
     */
  const handler: Handler = new Handler()
  handler.finish(msg) // finished
}

const handleReply = function (msg) {
  if (__messageHandlers[msg.id]) {
    __messageHandlers[msg.id](msg.data)
    delete __messageHandlers[msg.id]
  }
}

// receive message
process.on('message', (msg: any) => {
  switch (msg.type) {
    case 'task':
      return execTask(msg)
    case 'reply':
      return handleReply(msg)
    default:
      return
  }
})

export default null
