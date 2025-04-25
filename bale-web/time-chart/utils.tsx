/**
 * @fileOverview 公共方法
 * @date 2023-08-28
 * @author poohlaha
 */
const TimerUtils = {
  /**
   * 检验字符串是否为空
   */
  isBlank: (value: string) => {
    return (
      value === undefined || value == null || /^[ ]+$/.test(value) || value.length === 0 || value.trim().length === 0
    )
  },

  /**
   * 格式化成 万 / 亿
   * @param num
   */
  formatNumberUnit: (num: number): string => {
    if (num >= 1e8) {
      return `${(num / 1e8).toFixed(2).replace(/\.00$/, '')}亿`
    } else if (num >= 1e4) {
      return `${(num / 1e4).toFixed(2).replace(/\.00$/, '')}万`
    } else {
      return num.toString()
    }
  },

  /**
   * 获取交易时间段, 拆分为每分钟
   */
  getTradingMinutes: (tradTimes: Array<string> = []) => {
    if (tradTimes.length === 0) {
      return []
    }

    // 时间转分
    const timeToMinute = (time: string) => {
      const [h, m] = time.split(':').map(Number)
      return h * 60 + m
    }

    // 获取分钟
    const getMinutes = (startMin: number, endMin: number) => {
      let minutes: Array<number> = []
      for (let m = startMin; m <= endMin; m++) {
        minutes.push(m)
      }

      return minutes
    }

    let minutes: Array<number> = []
    for (const time of tradTimes) {
      let [start, end] = ['', '']
      if (time.indexOf('~') !== -1) {
        ;[start, end] = time.split('~') || []
      } else if (time.indexOf('-') !== -1) {
        ;[start, end] = time.split('-') || []
      } else {
        ;[start, end] = [time, time]
      }

      const startMin = timeToMinute(start)
      const endMin = timeToMinute(end)
      minutes = minutes.concat(getMinutes(startMin, endMin))
    }

    return minutes
  },

  /**
   * 查找时间戳在交易时间中对应的 index
   */
  getTimeIndexByMinute: (timestamp: number, tradeMinutes: number[]): number => {
    const date = new Date(timestamp)
    const totalMin = date.getHours() * 60 + date.getMinutes()
    return tradeMinutes.indexOf(totalMin) // -1 表示不在交易时间段中
  }
}

export default TimerUtils
