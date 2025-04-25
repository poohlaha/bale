/**
 * @fileOverview 网格背景, 使用 svg 画制
 * @date 2023-08-28
 * @author poohlaha
 */
import React from 'react'
import { GridDefaultProps, ITimerGridProps } from '../types/timer'

const Grid: React.FC<ITimerGridProps> = (props: ITimerGridProps) => {
  const getTranslate = () => {
    let padding = props.isAxisRight ? -props.padding : props.padding
    let translateX: number = 0
    let translateY: number = -padding
    if (padding < 0) {
      translateY = padding
    }

    return { translateX, translateY }
  }

  /**
   * 计算网络平均分布 horizontalLines | verticalLines 线条
   * 使用 + 1 为了不贴着边缘
   * 第一条线从顶部有一段空白, 最后一条线也不贴着底部
   */
  const getHorizontalVerticalSpacing = () => {
    // 纵向
    const horizontalLines = props.horizontalLines ?? GridDefaultProps.horizontalLines
    const horizontalSpacing = (props.height - props.padding) / (horizontalLines + 1)

    // 横向
    const verticalLines = props.verticalLines ?? GridDefaultProps.verticalLines
    const verticalSpacing = (props.width - props.padding) / (verticalLines + 1)
    return { horizontalLines, horizontalSpacing, verticalLines, verticalSpacing }
  }

  const render = () => {
    const lineType = props.lineType ?? GridDefaultProps.lineType
    // 如果是 `dashed`, 那么画线时绘制 4 像素的实线, 然后间隔 2 像素, 依次类推....
    const strokeDasharray = lineType === 'dashed' ? '4 2' : 'none'

    // 横向 | 纵向线条分布
    const { horizontalLines, horizontalSpacing, verticalLines, verticalSpacing } = getHorizontalVerticalSpacing()

    // 颜色
    const lineColor = props.color ?? GridDefaultProps.color

    const { translateX, translateY } = getTranslate()
    return (
      <svg width={props.width} height={props.height}>
        <g transform={`translate(${translateX}, ${translateY})`}>
          {/* 纵向 */}
          {Array.from({ length: horizontalLines }, (_, i) => {
            const y = (i + 1) * horizontalSpacing
            return (
              <line
                key={`h-${i}`}
                x1={0}
                y1={y}
                x2={props.width}
                y2={y}
                stroke={lineColor}
                strokeDasharray={strokeDasharray}
              />
            )
          })}

          {/* 横向 */}
          {Array.from({ length: verticalLines }, (_, i) => {
            const x = (i + 1) * verticalSpacing
            return (
              <line
                key={`v-${i}`}
                x1={x}
                y1={0}
                x2={x}
                y2={props.height}
                stroke={lineColor}
                strokeDasharray={strokeDasharray}
              />
            )
          })}
        </g>
      </svg>
    )
  }

  return render()
}

export default Grid
