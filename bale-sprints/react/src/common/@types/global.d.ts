// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//   /!\ DO NOT MODIFY THIS FILE /!\
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// 全局设置路由和SVG设置
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//   /!\ DO NOT MODIFY THIS FILE /!\
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

import React from 'react'
import { RouteComponentProps } from 'react-router-dom'

declare global {
  export interface IRouterProps extends RouteComponentProps {
    [key: string]: any
  }
}

// 使svg能够在ts中用引入模块的方式加载
declare interface SvgComponent extends React.StatelessComponent<React.SVGAttributes<SVGElement>> {}
declare module '*.svg' {
  const content: SvgComponent
  export default content
}
