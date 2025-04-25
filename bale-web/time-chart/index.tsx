/**
 * @fileOverview 分时图
 * @date 2025-04-24
 * @author poohlaha
 */
import React, { ReactElement, useState } from 'react'
import Grid from './lib/grid'
import Axis from './lib/axis'
import {
  AxisDefaultProps,
  DEFAULT_FONT_SIZE,
  ITimerProps,
  TimerDefaultProps,
  TRADE_TIMES,
  XOffset
} from './types/timer'
import Highest from './lib/highest'
import Tooltip from './lib/tooltip'
import Cross from './lib/cross'
import dayjs from 'dayjs'
import Utils from './utils'

const Timer: React.FC<ITimerProps> = (props: ITimerProps): ReactElement => {
  const [tooltipProps, setTooltipProps] = useState({ show: false, x: 0, y: 0, data: [] })
  const [cross, setCross] = useState({ show: false, x: 0, y: 0, index: 0 })

  /**
   * 获取交易时间
   */
  const getTradeMinutes = () => {
    let tradTimes = props.tradeTimes || []
    if (tradTimes.length === 0) {
      tradTimes = TRADE_TIMES || []
    }

    // 总时间
    return Utils.getTradingMinutes(tradTimes) || []
  }

  /**
   * 获取坐标属性
   */
  const getAxisProps = () => {
    const axis = props.axis
    const axisPadding = axis.padding ?? AxisDefaultProps.padding // 在 坐标轴内部画线
    const yPosition = axis.yPosition ?? AxisDefaultProps.yPosition
    const isRight = yPosition === 'right'
    return { axisPadding, yPosition, isRight }
  }

  /**
   * 背景网格
   */
  const getGrid = () => {
    const grid = props.grid
    const { axisPadding, isRight } = getAxisProps()
    if (grid === undefined) {
      return <Grid width={props.width} height={props.height} padding={axisPadding} isAxisRight={isRight} />
    }

    const show = grid.show ?? true
    if (!show) return null

    return <Grid padding={axisPadding} width={props.width} height={props.height} isAxisRight={isRight} {...grid} />
  }

  /**
   * 获取价格最小值和最大值
   */
  const getPriceRange = () => {
    const data = props.data || []
    let minPrice = 0
    let maxPrice = 0
    let prices: number[] = []

    if (data.length > 0) {
      prices = data.map(d => d[1])
      minPrice = Math.min(...prices)
      maxPrice = Math.max(...prices)
    }

    return { prices, minPrice, maxPrice }
  }

  /**
   * 折线图
   */
  const getLine = () => {
    const data = props.data || []
    if (data.length === 0) return null

    const { axisPadding } = getAxisProps()
    const width = props.width
    const height = props.height - 2 * axisPadding

    const lineColor = props.lineColor ?? TimerDefaultProps.lineColor
    const { minPrice, maxPrice } = getPriceRange()

    const tradeMinutes = getTradeMinutes()
    const points = data
      .map((d, _) => {
        const index = Utils.getTimeIndexByMinute(d[0], tradeMinutes)
        if (index === -1) return null

        const x = XOffset + (index / (tradeMinutes.length - 1)) * width
        const y = axisPadding + ((maxPrice - d[1]) / (maxPrice - minPrice)) * height // y 要加偏移量，不然会偏在x轴上方
        return `${x},${y}`
      })
      .filter(Boolean)
      .join(' ')

    return <polyline fill="none" stroke={lineColor} strokeWidth={1} points={points} />
  }

  /**
   * 最高线
   */
  const getHighest = () => {
    const highest = props.highest
    const { minPrice, maxPrice } = getPriceRange()
    const { axisPadding, isRight } = getAxisProps()
    const fontSize = props.fontSize ?? DEFAULT_FONT_SIZE
    if (highest === undefined) {
      return (
        <Highest
          width={props.width}
          height={props.height}
          maxPrice={maxPrice}
          minPrice={minPrice}
          fontSize={fontSize}
          padding={axisPadding}
          isAxisRight={isRight}
        />
      )
    }

    const show = highest.show ?? true
    if (!show) return null

    return (
      <Highest
        width={props.width}
        height={props.height}
        maxPrice={maxPrice}
        minPrice={minPrice}
        fontSize={fontSize}
        padding={axisPadding}
        isAxisRight={isRight}
        {...highest}
      />
    )
  }

  const getShowCross = () => {
    const crossProps = props.cross || {}
    return crossProps.show ?? true
  }
  /**
   * 十字准线
   */
  const getCross = () => {
    const crossProps = props.cross || {}
    const show = crossProps.show ?? true
    if (!show) return null

    const { axisPadding } = getAxisProps()

    return (
      <Cross
        show={cross.show}
        color={crossProps.color}
        lineType={crossProps.lineType}
        x={cross.x}
        y={cross.y}
        width={props.width}
        height={props.height}
        padding={axisPadding}
      />
    )
  }

  const onMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const showCross = getShowCross()
    if (!showCross) return

    const rect = e.currentTarget.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    let mouseY = e.clientY - rect.top
    const { axisPadding } = getAxisProps()

    // 去除横向坐标部分
    if (props.height - mouseY < axisPadding) {
      return
    }

    const tradeMinutes = getTradeMinutes()
    const totalMinutes = tradeMinutes.length

    // 鼠标占总宽度的百分比
    const percent = mouseX / props.width
    let minuteIndex = Math.floor(percent * totalMinutes)

    // 限制最大 index 到最后数据点的时间 index
    const lastDataMinute = Utils.getTimeIndexByMinute(props.data[props.data.length - 1][0], tradeMinutes)
    minuteIndex = Math.min(minuteIndex, lastDataMinute)

    // 根据 minuteIndex 反算 mouseX, 保证 cross 不超出最后时间位置, 需要在超出最大时间后 `钉死` 在最大时间点
    const unitX = props.width / totalMinutes
    const fixedMouseX = minuteIndex * unitX

    // 反推数据 index（建立 “分钟索引 -> 数据索引” 映射）
    const dataIndex = props.data.findIndex(d => Utils.getTimeIndexByMinute(d[0], tradeMinutes) === minuteIndex)
    if (dataIndex === -1) return

    const clampedIndex = Math.max(0, Math.min(dataIndex, props.data.length - 1))
    setCross({ show: true, x: fixedMouseX, y: mouseY, index: clampedIndex })

    const data = props.data[clampedIndex]
    let tooltipData: any = []
    // console.log('data', data, index)
    if (!data) return

    for (let i = 0; i < data.length; i++) {
      const d = data[i]
      let label = ''
      let value: string = ''
      if (i === 0) {
        value = dayjs(d).format('MM-DD HH:mm')
      } else {
        value = Utils.formatNumberUnit(parseFloat(d.toFixed(2)))
      }

      if (i === 0) {
        label = '时间'
      }

      if (i === 1) {
        label = '价格'
      }

      if (i === 2) {
        label = '成交量'
      }

      if (i === 3) {
        label = '成交额'
      }

      tooltipData.push({
        label,
        value
      })
    }

    setTooltipProps({
      show: true,
      data: tooltipData,
      x: e.clientX + 10,
      y: e.clientY + 10
    })
  }

  const onMouseLeave = () => {
    const showCross = getShowCross()
    if (!showCross) return
    setCross({ show: false, x: 0, y: 0, index: 0 })
    setTooltipProps({ show: false, x: 0, y: 0, data: [] })
  }

  const render = () => {
    return (
      <div className="timer-page flex-center wh100 relative">
        {/* 背景: 网格和坐标轴 */}
        <svg width={props.width} height={props.height} onMouseMove={onMouseMove} onMouseLeave={onMouseLeave}>
          {/* 背景网格*/}
          {getGrid()}

          {/* x 轴和 y 轴 */}
          <Axis width={props.width} height={props.height} {...props.axis} />

          {/* 折线图 */}
          {getLine()}

          {/* 最高线 */}
          {getHighest()}

          {/* 十字准线 */}
          {getCross()}
        </svg>

        {/* ToolTip */}
        <Tooltip
          show={tooltipProps.show}
          x={tooltipProps.x ?? 0}
          y={tooltipProps.y ?? 0}
          data={tooltipProps.data || []}
          width={props.width}
          height={props.height}
        />
      </div>
    )
  }

  return render()
}

export default Timer
