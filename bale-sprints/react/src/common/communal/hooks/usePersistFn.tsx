import { useCallback, useRef } from 'react'
export type noop = (...args: any[]) => any

const usePersistFn = <T extends noop>(func: T) => {
  const ref = useRef<any>(() => {
    throw new Error('Can not call function while rendering.')
  })

  ref.current = func

  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback(((...args) => ref.current(...args)) as T, [ref])
}

export default usePersistFn
