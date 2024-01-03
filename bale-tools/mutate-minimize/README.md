# 文件压缩

通过 `多线程` 压缩`css`、`js`、`html`。

## 示例

- bin

```shell
-e, --entry, Add an entry file or dir.
-exts, Exclude file exts, more use `,`.
-u, --update, Update package.
```

examples:

```shell
bale-mutate-minimize -e src -exts '.cms.js' # task
bale-mutate-minimize -u # update
```

- nodejs

examples:

```js
const Minimize = require('./index')

async function compile() {
  Minimize('/Users/smile/Downloads/webApp', [])
}

compile()
```
