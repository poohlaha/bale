/**
 * @fileOverview Webpack
 * @date 2023-03-14
 * @author poohlaha
 */
const test = require('ava')
const path = require('path')
const { getFile, sleep, getLoggerPrefix } = require('../base.test')

let WebpackCompiler = null
test.before(async t => {
  await sleep(1000)
  WebpackCompiler = getFile('mutate-service', path.join('webpack', 'index.js'), 'Webpack Compiler')
})

test('test webpack compiler: ', async t => {
  if (!WebpackCompiler) {
    t.pass()
    return
  }

  WebpackCompiler({
    script: 'build',
    opts: {
      entry: '../../dist/bale-utils/index.js',
      plugins: [],
      externals: {
        vue: 'Vue',
        'vue-router': 'VueRouter',
        Vuex: 'Vuex',
        axios: 'axios'
      },
      settings: {
        usePurgecssPlugin: false,
        usePwaPlugin: false,
        useMinimize: false,
        lazyCompilation: false,
        compress: {
          enable: true,
          deleteOutput: true,
          suffix: '.zip'
        }
      }
    },
    done: () => {
      console.log('All Done.')
    }
  })

  t.pass()
})

test.after(t => {
  console.info(getLoggerPrefix() + 'Done .')
})
