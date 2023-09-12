## 统一版本

包括 `vue`、`react` 等版本, 以及其配置文件, 可以配合 `@bale-tools/mutate-service` 一起使用。

### 使用

- api

```typescript
interface MutateOptions {
  language: String // 语言, 'react' | 'vue'
  useTypescript: Boolean // 是否使用 typescript
  babelImportPluginName: '' // antd-mobile | vant
  babelImportPluginOpts: [] // 其他第三方插件数组
}
```

examples:

```javascript
const mutateVersion = new MutateVersion({ language: 'vue', useTypescript: false, babelImportPluginName: 'vant' })
mutateVersion.copy() // 拷贝文件
mutateVersion.validatePackage() // 检查版本并重写 package.json
mutateVersion.clean() // 清除
```
