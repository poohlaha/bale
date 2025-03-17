/**
 * @fileOverview scroll to top
 * @date 2023-04-21
 * @author poohlaha
 */
import { useEffect } from 'react'
import { useLocation } from 'react-router'

const ScrollToTop = () => {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

export default ScrollToTop
