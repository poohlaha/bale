/**
 * @fileOverview 输出性情
 * @date 2025-04-24
 * @author poohlaha
 */
// 定义分时图属性
/**
 * data
 * [
 *   时间戳, // 例如 1745459460000
 *   当前价格, // 例如 8.16
 *   数值A, // 25047000（成交量）
 *   数值B  // 206046740（成交额）
 * ]
 */
export interface ITimerProps {
  type?: 'canvas' | 'svg' // default svg
  width: number // 长度
  height: number // 宽度
  grid?: IGridProps // 网格背景
  axis: IAxisProps // 坐标轴
  data: Array<Array<number>> // 数据
  lineColor?: string // 折线图颜色
  highest?: IHighestProps // 最高线
  fontSize?: number // 字体大小
  cross?: ICrossProps // 十字准线
  tradeTimes: Array<string> // 交易时间段, 如要更改, 请同时理性 xLabels 的值
}

export const TimerDefaultProps = {
  lineColor: '#037B66'
}

export type LineType = 'solid' | 'dashed'

// 早上 120 分钟, 下午 120 分钟, 共计 240 分钟
export const TRADE_TIMES = ['9:30~11:30', '13:00~15:00']

export const DEFAULT_FONT_SIZE = 12 // 默认字体大小

// 网格背景属性
export interface IGridProps {
  show?: boolean
  color?: string // 颜色
  lineType?: LineType // 线条类型, 默认为 dashed
  horizontalLines?: number // 纵向线条数
  verticalLines?: number // 横向线条数
}

export interface ITimerGridProps extends IGridProps {
  width: number // 长度
  height: number // 宽度
  padding: number
  isAxisRight: boolean
}

// 默认的网格背景属性
export const GridDefaultProps = {
  color: 'rgba(186, 186, 186, 0.2)',
  lineType: 'dashed',
  horizontalLines: 4,
  verticalLines: 4
}

// x 轴 和 y 轴
export interface IAxisProps {
  lineColor?: string // 颜色
  textColor?: string // 文字颜色
  xLabels?: Array<string> // x 轴
  yLabels: Array<string | number> // y 轴
  yPosition?: 'left' | 'right'
  padding?: number // 间距
  fontSize?: number
}

export interface ITimerAxisProps extends IAxisProps {
  width: number // 长度
  height: number // 宽度
}

// 默认 x 轴 和 y 轴 属性
export const AxisDefaultProps = {
  lineColor: '#e0e0e0',
  textColor: '#666666',
  xLabels: ['09:30', '11:30/13:00', '15:00'],
  yPosition: 'left',
  padding: 30
}

// 价格最高线
export interface IHighestProps {
  show?: boolean
  lineColor?: string
  textColor?: string
  lineType?: LineType
}

export interface ITimerHighestProps extends IHighestProps {
  width: number
  height: number
  maxPrice: number
  minPrice: number
  fontSize: number
  padding: number
  isAxisRight: boolean
}

// 默认价格最高线属性
export const HighestDefaultProps = {
  show: true,
  lineColor: '#333333',
  textColor: '#666666',
  lineType: 'dashed'
}

// 十字准线
export interface ICrossProps {
  show?: boolean
  color?: string
  lineType?: LineType
}

export interface ITimerCrossProps extends ICrossProps {
  x: number
  y: number
  width: number
  height: number
  padding: number
}

// 十字准线默认属性
export const DefaultCrossProps = {
  color: '#e0e0e0',
  lineType: 'dashed'
}

// Tooltip
export interface ITooltipProps {
  className?: string
  show: boolean
  x: number
  y: number
  data: Array<ITooltipDataProps>
  width: number
  height: number
}

export interface ITooltipDataProps {
  label: string
  value: string
}

export const XOffset: number = 0 // x 轴偏移量, 第一个元素需要向右偏移, 最后一个元素需要向左偏移
export const AxisTextOffset: number = 5 // 文字偏移量, x 轴和 y 轴第一个和最后一个元素需要偏移
