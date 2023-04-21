import { useEffect } from 'react'
import useLatest from '../useLatest'

const useUnmount = (fn: () => void) => {
  if (typeof fn !== 'function') {
    console.error(`useUnmount expected parameter is a function, got ${typeof fn}`)
  }

  const fnRef = useLatest(fn)
  useEffect(
    () => () => {
      fnRef.current()
    },
    []
  )
}

export default useUnmount
