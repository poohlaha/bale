/**
 * @fileOverview 十字准线
 * @date 2025-04-24
 * @author poohlaha
 */
import React, { ReactElement } from 'react'
import { DefaultCrossProps, ITimerCrossProps } from '../types/timer'

const Cross: React.FC<ITimerCrossProps> = (props: ITimerCrossProps): ReactElement => {
  const render = () => {
    const show = props.show ?? true
    if (!show) return <div></div>

    const color = props.color ?? DefaultCrossProps.color
    const lineType = props.lineType ?? DefaultCrossProps.lineType
    const strokeDasharray = lineType === 'dashed' ? '4 2' : 'none'

    return (
      <>
        <line
          x1={props.x}
          y1={0}
          x2={props.x}
          y2={props.height - props.padding}
          stroke={color}
          strokeDasharray={strokeDasharray}
        />
        <line x1={0} y1={props.y} x2={props.width} y2={props.y} stroke={color} strokeDasharray={strokeDasharray} />
      </>
    )
  }

  return render()
}

export default Cross
