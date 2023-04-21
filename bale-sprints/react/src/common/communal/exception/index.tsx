import React from 'react'

/**
 * 全局异常捕获
 */
export default class Exception extends React.Component<any, any> {
  constructor(props: any) {
    super(props)
    // @ts-ignore
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: any) {
    // 更新 state 使下一次渲染能够显示降级后的 UI
    return { hasError: true }
  }

  componentDidCatch(error: any, errorInfo: any) {
    // 你同样可以将错误日志上报给服务器
    // logErrorToMyService(error, errorInfo);
    console.log('Error::::', error)
    if (String(error).indexOf('Loading chunk') !== -1) {
      window.location.reload()
    }
  }

  render() {
    /* if (this.state.hasError) {
            return <h1>Something went wrong.</h1>;
        } */

    // @ts-ignore
    return this.props.children
  }
}
