import { useEffect } from 'react'
import usePersistFn from '../usePersistFn'

const useMount = (fn: any) => {
  const funcPersist: any = usePersistFn(fn)

  useEffect(() => {
    if (funcPersist && typeof funcPersist === 'function') {
      funcPersist()
    }
  }, [])
}

export default useMount
