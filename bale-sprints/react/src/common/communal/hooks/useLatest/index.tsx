import { useRef } from 'react'

/**
 * 返回的永远是最新值
 */
function useLatest<T>(value: T) {
  const ref = useRef(value)
  ref.current = value
  return ref
}

export default useLatest
