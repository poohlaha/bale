/**
 * @fileOverview 使用 React.createPortal, 添加到节点到 `container` 下
 * @date 2023-04-21
 * @author poohlaha
 */
import React, { forwardRef, PropsWithChildren, useImperativeHandle } from 'react'
import ReactDOM from 'react-dom'

interface IPortalProps {
  container: HTMLElement | any
  children?: React.ReactNode
}

const Portal = forwardRef<{}, IPortalProps>((props: PropsWithChildren<IPortalProps>, ref: any) => {
  useImperativeHandle(ref, () => ({}))

  return ReactDOM.createPortal(props.children, props.container)
})

Portal.displayName = 'Portal'

export default Portal
