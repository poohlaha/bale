# React 框架公用文件
  提取 `React` 框架公用文件, 在 `pc` 或 `mobile` 中引用, 减少代码量, `React` 版本为 `18.x`。

## Frameworks Project Structure Src

```
├── types                                            // *.d.ts 目录
├── assets                                           // 资源文件目录
│   ├── locales                                      // 国际化配置
│   │   ├── en.toml                                  // 中文
│   │   └── zh.toml                                  // 英文
├── communal                                         // 框架目录
│   ├── config                                       // 配置文件
│   │   ├── constant.toml                            // 全局常量类配置文件
│   │   ├── system.toml                              // 全局系类配置文件
│   │   └── index.tsx                                // 配置导出
│   ├── exception                                    // 捕捉全局异常
│   ├── hooks                                        // hooks
│   ├── request                                      // 封装 axios 请求
│   ├── router                                       // 框架路由类
│   ├── utils                                        // 全局公共文件
│   ├── index.tsx                                    // 默认入口
│   ├── layout.tsx                                   // layout
│   └── theme.tsx                                    // theme
├── route                                            // 配置路由
│   ├── router.back.toml                             // 配置后端请求URL
│   ├── router.url.toml                              // 配置前端请求URL
│   └── index.tsx                                    // 配置路由
└──views                                             // 业务
│   ├── components                                   // 公共组件
│   ├── modules                                      // 公共模块
│   ├── pages                                        // 页面
│   └── stores                                       // stores

```

## 准备工作

- 在 `communal` 下创建 `layout.tsx` 文件, 编写路由, 参考如下:

```typescript
const RenderRoutes = (routes: RouteInterface[]) => {
  // 判断没用的路由, 跳转到404
  let usedRoutes: Array<RouteInterface> = []
  for (let router of routes) {
    if (!Utils.isBlank(router.path) || router.component !== null) {
      usedRoutes.push(router)
    }
  }

  if (usedRoutes.length > 0) {
    return (
      <Suspense fallback={<Loading />}>
        <Switch>
          {routes.map((route: RouteInterface, i) => {
            return (
              <Route
                key={route.name || i}
                path={route.path}
                exact={route.exact}
                render={(props: RouteComponentProps) => {
                  let query = {}
                  return <route.component {...props} query={query} routes={route.routes || []} />
                }}
              />
            )
          })}
        </Switch>
      </Suspense>
    )
  } else {
    return NotFound
  }
}

// 切换皮肤
const switchSkin = (skin: string = '') => {
  let classList = document.body.classList || []
  const remove = () => {
    if (skin === CONSTANT.SKINS[0]) {
      classList.remove(CONSTANT.SKINS[1])
    } else {
      classList.remove(CONSTANT.SKINS[0])
    }
  }

  remove()
  if (!classList.contains(skin)) {
    classList.add(skin)
  }
}

const Layout = (): ReactElement => {
  const { commonStore } = useStore()

  useEffect(
    () => {
      switchSkin(commonStore.skin)
    },
    [commonStore.skin]
  )

  const render = () => {
    return (
      <ThemeProvider>
        <ScrollToTop />
        {RenderRoutes(routes)}
      </ThemeProvider>
    )
  }

  return render()
}

export default observer(Layout)
```

- 在 `assets/stypes` 下面添加 `theme` 文件夹, 并添加 `index.less` 和 其他皮肤文件
- 在 `route` 下添加 `router.back.toml` 、`router.url.toml` 以及 `index.tsx`
- 在 `views/stores` 下添加 `config.tsx`, 并导出 `store`, 参考如下:

```typescript
import commonStore from './base/common.store'

export function createStore() {
  return {
    commonStore,
  }
}

export const store = createStore()
export type Stores = ReturnType<typeof createStore>
```

- 在项目根目录下添加 `tsconfig.path.json` 文件

## 使用
- 引入

```shell
  npm install @bale-sprint/react
```

- api
  * 在 `tsconfig.path.json` 中配置别名后, 可直接通过别名引入相关文件, 参考如下:

```typescript
import {useMount} from '@hooks/useMount'
```
   * 别名参考如下(在 `paths` 下配置):

```json
{
  "@/*": ["src/*"],
  "@assets/*": ["src/assets/*"],
  "@communal/*": ["src/communal/*"],
  "@config/*": ["src/communal/config/*"],
  "@hooks/*": ["src/communal/hooks/*"],
  "@router/*": ["src/communal/router/*"],
  "@request/*": ["src/communal/request/*"],
  "@configs/*": ["src/communal/configs/*"],
  "@route/*": ["src/route/*"],
  "@views/*": ["src/views/*"],
  "@stores/*": ["src/views/stores/*"],
  "@utils/*": ["src/communal/utils/*"],
  "@pages/*": ["src/views/pages/*"]
}
```
