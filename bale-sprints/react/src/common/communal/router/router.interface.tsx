/**
 * @fileOverview route props
 * @date 2023-04-21
 * @author poohlaha
 */
export interface RouteInterface {
  path: string
  component: any
  routes?: RouteInterface[]
  exact?: boolean
  title?: string
  name?: string
  auth?: boolean
  needOpenId?: boolean
}

export interface RoutesInterface {
  routes?: RouteInterface[]
}

// export type routeProps = RouteComponentProps<any> & RoutesInterface
