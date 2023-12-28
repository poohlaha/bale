# 文件压缩

通过 `多线程` 压缩`css`、`js`、`html`。

## 示例

- bin

```shell
-e, --entry <entry> Add an entry file or dir.
```

examples:

```shell
bale-mutate-minimize -e src
```

- nodejs

examples:

```js
const Minimize = require('./index')

async function compile() {
  Minimize('/Users/smile/Downloads/webApp')
}

compile()
```
