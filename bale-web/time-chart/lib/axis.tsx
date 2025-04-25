/**
 * @fileOverview X 轴 | Y 轴坐标
 * @date 2023-08-28
 * @author poohlaha
 */
import React, { ReactElement } from 'react'
import { AxisDefaultProps, AxisTextOffset, DEFAULT_FONT_SIZE, ITimerAxisProps, XOffset } from '../types/timer'

const Axis: React.FC<ITimerAxisProps> = (props: ITimerAxisProps): ReactElement => {
  const render = () => {
    if (props.yLabels.length === 0) return <div></div>

    let xLabels = props.xLabels ?? AxisDefaultProps.xLabels
    if (xLabels.length === 0) {
      xLabels = AxisDefaultProps.xLabels
    }

    // 左右各偏移 5
    const xStep = props.width / (xLabels.length - 1)
    const yStep = props.height / (props.yLabels.length - 1)
    const padding = props.padding === null || props.padding === undefined ? AxisDefaultProps.padding : props.padding
    const lineColor = props.lineColor ?? AxisDefaultProps.lineColor
    const textColor = props.textColor ?? AxisDefaultProps.textColor
    const fontSize = props.fontSize ?? DEFAULT_FONT_SIZE

    const yPosition = props.yPosition ?? AxisDefaultProps.yPosition
    const isYLeft = yPosition === 'left'

    // 外层就是svg, 只用 g 就可以了
    return (
      <g transform={`translate(0, ${-padding})`}>
        {/* x 轴线(减去1避免覆盖 Y 轴 */}
        <line x1={0} y1={props.height - 0.5} x2={props.width} y2={props.height - 0.5} stroke={lineColor} />

        {/* y 轴线(不画到底，避免与 X 轴重合) */}
        <line
          x1={isYLeft ? 0 : props.width}
          y1={0}
          x2={isYLeft ? 0 : props.width}
          y2={props.height}
          stroke={lineColor}
        />

        {/* x 轴刻度线和文字, 第一个和最后一个要单独处理, 防止遮挡 */}
        {xLabels.map((label: string, i: number) => {
          let xLine = i * xStep
          let xText = i * xStep
          let anchor = 'middle' // 文字默认居中
          if (i === 0) {
            anchor = 'start'
            xLine += XOffset // 第一个偏移, 防止交叉处出现 `伸出来`
            xText += AxisTextOffset // 第一个文字向右偏移
          } else if (i === xLabels.length - 1) {
            anchor = 'end'
            xLine -= XOffset // 最后一个向左偏移
            xText -= AxisTextOffset // // 最后一个文字向左偏移
          }

          const noShowLine = isYLeft ? i === 0 : i === props.yLabels.length - 1
          return (
            <g key={`x-${i}`}>
              {!noShowLine && <line x1={xLine} y1={props.height} x2={xLine} y2={props.height + 5} stroke={lineColor} />}
              <text x={xText} y={props.height + fontSize + 5} fill={textColor} fontSize={fontSize} textAnchor={anchor}>
                {label}
              </text>
            </g>
          )
        })}

        {/* y轴刻度线和文字 */}
        {props.yLabels.map((label, i) => {
          let yLine = props.height - i * yStep
          let yText = props.height - i * yStep

          const x = isYLeft ? 0 : props.width
          const tick = isYLeft ? -5 : 5
          const textX = isYLeft ? padding / 2 + 8 : -padding / 2 - 8
          const anchor = isYLeft ? 'end' : 'start'
          if (i === 0) {
            yText -= AxisTextOffset * 2 // 第一个文字向上偏移
          } else if (i === xLabels.length - 1) {
            yText += AxisTextOffset * 2 // // 最后一个文字向下偏移
          }

          return (
            <g key={`y-${i}`}>
              {/* 第一个和最后一个不要显示刻度线 */}
              {i !== props.yLabels.length - 1 && i !== 0 && (
                <line x1={x} y1={yLine} x2={x + tick} y2={yLine} stroke={lineColor} />
              )}
              <text x={x + textX} y={yText + fontSize / 2 - 2} fill={textColor} fontSize={fontSize} textAnchor={anchor}>
                {label}
              </text>
            </g>
          )
        })}
      </g>
    )
  }

  return render()
}

export default Axis
