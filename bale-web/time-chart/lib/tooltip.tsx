/**
 * @fileOverview Tooltip
 * @date 2025-04-24
 * @author poohlaha
 */
import React, { PropsWithChildren, ReactElement, useEffect, useRef, useState } from 'react'
import { ITooltipDataProps, ITooltipProps } from '../types/timer'
import ReactDOM from 'react-dom'

const ToolTip: React.FC<ITooltipProps> = (props: PropsWithChildren<ITooltipProps>): ReactElement => {
  const [point, setPoint] = useState({ x: 0, y: 0 })

  const tooltipRef = useRef(null)

  /**
   * 计算坐标, 判断是否超越边界
   */
  const calculateCoordinates = () => {
    if (!tooltipRef.current) return { x: 0, y: 0 }

    let x = props.x ?? 0
    let y = props.y ?? 0
    const rect = (tooltipRef.current as HTMLElement).getBoundingClientRect()
    const width = rect.width
    const height = rect.height

    const clientWidth = window.innerWidth ?? document.documentElement.clientWidth
    const clientHeight = window.innerHeight ?? document.documentElement.clientHeight

    const padding = 10 // 偏移量 10
    // 超出边界
    if (x + width + padding > clientWidth) {
      x = clientWidth - width - padding - (clientWidth - x) - padding
    }

    if (y + height + padding > clientHeight) {
      y = clientHeight - height - padding - (clientHeight - y) - padding
    }

    return { x, y }
  }

  useEffect(() => {
    const { x, y } = calculateCoordinates()
    setPoint({ x, y })
  }, [props.x, props.y])

  const render = () => {
    if (!props.show || props.data.length === 0) return <div></div>

    return ReactDOM.createPortal(
      <div
        className={`timer-tooltip bg-white ${props.className || ''} p-2 absolute w-40 rounded shadow-lg z-50`}
        style={{ left: point.x, top: point.y }}
        ref={tooltipRef}
      >
        {props.data.map((item: ITooltipDataProps, index: number) => {
          return (
            <div
              className="timer-tooltip-item h-6 flex items-center justify-between cursor-pointer text-gray-900"
              key={index}
            >
              <p className="text-xs mr-1">{item.label || ''}</p>
              <p className="text-xs">{item.value || '-'}</p>
            </div>
          )
        })}
      </div>,
      document.body
    )
  }

  return render()
}

export default ToolTip
