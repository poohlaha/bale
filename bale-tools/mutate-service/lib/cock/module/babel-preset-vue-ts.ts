/**
 * @fileOverview @babel/preset-typescript 不支持编译 Vue 文件中的 ts 代码, 通过手动添加 @babel/plugin-transform-typescript 的方式来解决这个问题, see: https://github.com/babel/babel-loader/pull/738
 * @date 2023-03-09
 * @author poohlaha
 */
import { declare } from '@babel/helper-plugin-utils'
import fsExtra from 'fs-extra'

export default declare(() => ({
  overrides: [
    {
      test: filePath => {
        if (/\.vue$/.test(filePath)) {
          const template = fsExtra.readFileSync(filePath, 'utf8')
          /* eslint-disable */
          return template.includes('lang="ts"') || template.includes("lang='ts'")
        }

        return false
      },
      plugins: [require('@babel/plugin-transform-typescript')],
    },
  ],
}))
