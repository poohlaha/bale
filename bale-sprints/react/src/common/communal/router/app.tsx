// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//   /!\ DO NOT MODIFY THIS FILE /!\
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// 路由主入口
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//   /!\ DO NOT MODIFY THIS FILE /!\
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
import React from 'react'
import { BrowserRouter, HashRouter, Route } from 'react-router'
import Exception from '../exception'
import Layout from '@srcCommunal/layout'
import ScrollToTop from '@router/scrollToTop'
import FirstScreen from '@views/pages/first-screen'
import ThemeProvider from '@communal/provider/theme'

/**
 * Global Loading
 */
const getHashRouter = () => {
  return (
    <HashRouter basename={process.env.PROJECT_URL}>
      <Exception>
        <Layout />
      </Exception>
    </HashRouter>
  )
}

const getBrowserRouter = () => {
  return (
    <BrowserRouter basename={process.env.PROJECT_URL}>
      <Exception>
        <Layout />
      </Exception>
    </BrowserRouter>
  )
}

/**
 * 首屏加载
 */
const getFirstRouter = () => {
  return (
    // @ts-ignore
    <HashRouter basename={'/'}>
      <Exception>
        <ScrollToTop />
        <Route path="/" key="firstScreen" element={<FirstScreen />} />
      </Exception>
    </HashRouter>
  )
}

interface IRoutesProps {
  isFirstScreen: boolean
}

const getRouter = () => {
  if (process.env.ROUTER_MODE === 'hash') {
    return getHashRouter()
  } else if (process.env.ROUTER_MODE === 'history') {
    return getBrowserRouter()
  } else {
    if (process.env.NODE_ENV === 'production') {
      return getBrowserRouter()
    }

    return getHashRouter()
  }
}

const Routes: React.FC<IRoutesProps> = (props: IRoutesProps) => {
  if (props.isFirstScreen) {
    return getFirstRouter()
  }

  return <ThemeProvider>{getRouter()}</ThemeProvider>
}

export default Routes
