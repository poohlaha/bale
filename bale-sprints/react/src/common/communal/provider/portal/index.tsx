/**
 * @fileOverview 通过 React.cloneElement 添加节点到外部
 * @date 2023-04-21
 * @author poohlaha
 */
import React, { PropsWithChildren, useState, useRef, Fragment, forwardRef, useEffect } from 'react'
import useMount from '@hooks/useMount'
import Popup from './popup'
import useUnmount from '@hooks/useUnmount'
import Utils from '@utils/utils'

interface IPortalComponentProps {
  nodeId?: string
  className?: string
  popupClassName?: string
  content: any
  position?: any
}

function fillRef<T>(ref: React.Ref<T>, node: T) {
  if (typeof ref === 'function') {
    ref(node)
  } else if (typeof ref === 'object' && ref && 'current' in ref) {
    ;(ref as any).current = node
  }
}

/**
 * Merge refs into one ref function to support ref passing.
 */
function composeRef<T>(...refs: React.Ref<T>[]): React.Ref<T> {
  const refList = refs.filter(ref => ref)
  if (refList.length <= 1) {
    return refList[0]
  }

  return (node: T) => {
    refs.forEach(ref => {
      fillRef(ref, node)
    })
  }
}

function getDocument(element: HTMLElement | null) {
  return element ? element.ownerDocument : window.document
}

function contains(root: Node | null | undefined, n: Node) {
  if (!root) {
    return false
  }

  return root.contains(n)
}

function addEventListenerWrap(target: any, eventType: any, callback: Function, option?: any) {
  if (target.addEventListener) {
    target.addEventListener(eventType, callback, option)
  }

  return {
    remove: () => {
      if (target.removeEventListener) {
        target.removeEventListener(eventType, callback)
      }
    },
  }
}

interface CommonEventHandler {
  remove: () => void
}

/**
 * Portal
 * 添加节点到外部dom下
 */
const PortalComponent: React.FC<IPortalComponentProps> = (props: PropsWithChildren<IPortalComponentProps>) => {
  let popupRef = useRef<any>(null)
  let triggerRef = useRef(null)
  let [popupVisible, setPopupVisible] = useState<boolean>(false)
  let [point, setPoint] = useState<any>({ x: 0, y: 0 })
  let clickOutsideHandler: CommonEventHandler | any

  useMount(() => {
    console.log(triggerRef)
    console.log(popupRef)
  })

  useEffect(() => {
    if (popupVisible) {
      let currentDocument: any = getDocument(triggerRef?.current)
      clickOutsideHandler = addEventListenerWrap(currentDocument, 'mousedown', onDocumentClick)

      return
    }

    clearOutsideHandler()
  }, [popupVisible])

  useUnmount(() => {
    clearOutsideHandler()
  })

  const clearOutsideHandler = () => {
    if (clickOutsideHandler) {
      clickOutsideHandler.remove()
      clickOutsideHandler = null
    }
  }

  const containsChildren = (node: any = null, target: any = null) => {
    if (!node || !target) return false
    if (node.contains(target) || node === target || node.getAttribute('class') === target.getAttribute('class')) return true

    let children = node.children || []
    if (children.length > 0) {
      for (let i = 0; i < children.length; i++) {
        let child = children[i]
        let flag: any = containsChildren(child, target)
        if (flag) {
          return flag
        }
      }
    }
  }

  const onDocumentClick = (event: any) => {
    const target = event.target
    const root = triggerRef.current
    const popupNode = popupRef.current?.getElement() || null
    let flag = containsChildren(popupNode, target)
    if (!contains(root, target) && !contains(popupNode, target) && !flag) {
      setPopupVisible(false)
      setPoint({ x: 0, y: 0 })
    }
  }

  const onChildClick = (event: any) => {
    if (event && event.preventDefault) {
      event.preventDefault()
    }

    setPopupVisible(true)

    let point = {
      x: 0,
      y: 0,
    }

    if (!Utils.isObjectNull(props.position)) {
      if (props.position.left !== null && props.position.left !== undefined) {
        point.x = props.position.left
      } else {
        point.x = event.pageX
      }

      if (props.position.top !== null && props.position.top !== undefined) {
        point.y = props.position.top
      } else {
        // @ts-ignore
        let rect = triggerRef.current?.getBoundingClientRect() || {}
        let t = rect.top + rect.height + (props.position?.height || 0)
        if (t > document.documentElement.clientHeight - 10) {
          t = rect.top - (props.position?.height || 0)
        } else {
          t = rect.top + rect.height
        }
        point.y = t
      }
    }

    setPoint(point)
  }

  const getHtml = () => {
    let portal: any = null
    if (popupVisible) {
      portal = <Popup ref={popupRef} className={props.popupClassName || ''} id={props.nodeId || ''} currentDom={triggerRef} point={point} content={props.content} />
    }

    // 创建子节点
    const child = props.children as React.ReactElement
    const newChildProps: any = {
      className: props.className || '',
      ref: composeRef(triggerRef, (child as any).ref),
      onClick: onChildClick,
    }

    let trigger = React.cloneElement(child, newChildProps)

    return (
      <Fragment>
        {trigger}
        {portal}
      </Fragment>
    )
  }

  return getHtml()
}

PortalComponent.defaultProps = {
  nodeId: '', // popup-root
}

export default PortalComponent
