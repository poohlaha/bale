// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//   /!\ DO NOT MODIFY THIS FILE /!\
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// 项目主入口
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//   /!\ DO NOT MODIFY THIS FILE /!\
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

import React from 'react'
import ReactDOM from 'react-dom/client'
import initReactFastclick from 'react-fastclick'
import Routes from '@router/app'
import { StoreProvider } from '@stores/index'
// 在 layout 中引入
// import '@assets/styles/theme/index.less'
// import 'lib-flexible'

interface IAppProps {
  isFirstScreen: boolean
}

const App = (props: IAppProps) => {
  return (
    <React.Fragment>
      <StoreProvider>
        <Routes isFirstScreen={props.isFirstScreen} />
      </StoreProvider>
    </React.Fragment>
  )
}

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)

function listen() {
  if (document.readyState === 'complete') {
    // 资源加载完成
    initReactFastclick()
    root.render(<App isFirstScreen={false} />)
  } else {
    // 资源加载中
    root.render(<App isFirstScreen={true} />)
  }
}

document.onreadystatechange = listen

// 生产环境配置 serviceWorker
if (process.env.USE_PWA) {
  if ('serviceWorker' in navigator) {
    if (process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('./service-worker.js')
        .then(registration => {
          console.log('ServerWork registered: ', registration)
        })
        .catch(registrationError => {
          console.log('ServerWork registration failed: ', registrationError)
        })
    } else {
      navigator.serviceWorker.ready
        .then(registration => {
          registration.unregister()
        })
        .catch(error => {
          console.error(error.message)
        })
    }
  }
}
