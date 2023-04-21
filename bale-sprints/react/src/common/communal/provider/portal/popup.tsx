/**
 * @fileOverview popup
 * @date 2023-04-21
 * @author poohlaha
 */
import React, { useImperativeHandle, useRef } from 'react'
import Portal from './portal'

type Point = {
  x: number
  y: number
}

export interface PopupRef {
  getElement: () => HTMLElement
}

interface IPopupProps {
  className?: string
  id?: string
  currentDom?: any
  content?: React.ReactNode
  point?: Point
  children?: React.ReactNode
}

const Popup = React.forwardRef<PopupRef, IPopupProps>((props: IPopupProps, ref: any) => {
  const elementRef = useRef<any>()

  useImperativeHandle(ref, () => ({
    getElement: () => elementRef.current,
  }))

  const getDocument = (element?: HTMLElement) => {
    return element ? element.ownerDocument : window.document
  }

  const attachParent = (popupContainer: HTMLDivElement) => {
    let dom = document.getElementById(props.id || '') || getDocument(props.currentDom?.current).body
    if (dom) dom.appendChild(popupContainer)
  }

  const getContainer = () => {
    const popupContainer = getDocument(props.currentDom?.current).createElement('div')
    popupContainer.setAttribute('class', `portal-modal ${props.className || ''}`)
    popupContainer.style.position = 'absolute'
    popupContainer.style.top = '0'
    popupContainer.style.left = '0'
    popupContainer.style.width = '100%'
    attachParent(popupContainer)
    return popupContainer
  }

  const getComponent = () => {
    return (
      <div
        ref={elementRef}
        className="portal-content"
        style={{
          left: `${props.point?.x}px`,
          top: `${props.point?.y}px`,
        }}
      >
        {props.content || props.children}
      </div>
    )
  }

  return (
    <Portal key="portal" container={getContainer()}>
      {getComponent()}
    </Portal>
  )
})

Popup.displayName = 'Popup'
export default Popup
