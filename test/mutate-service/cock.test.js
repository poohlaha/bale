/**
 * @fileOverview Cock
 * @date 2023-03-14
 * @author poohlaha
 */
const test = require('ava')
const path = require('path')
const { getOutput, getFile, sleep, getLoggerPrefix } = require('../base.test')

let CockCompiler = null
test.before(async t => {
  await sleep(1000)
  CockCompiler = getFile('mutate-service', path.join('cock', 'index.js'), 'Cock Compiler')
})

test('test webpack compiler: ', async t => {
  if (!CockCompiler) {
    t.pass()
    return
  }

  const outputDir = path.join(__dirname, '../', 'dist')
  const rollupSettings = {
    formats: 'umd',
    output: {
      file: path.join(outputDir, 'bale-utils.js')
    },
    min: true
  }

  await CockCompiler('ts', {
    mode: 'commonjs',
    entry: 'packages/bale-utils',
    outputDir,
    rollupSettings,
    tsSettings: {
      useDeclaration: false
    },
    done: () => {
      console.log('Done .')
    }
  })

  t.pass()
})

test.after(t => {
  console.info(getLoggerPrefix() + 'Done .')
})
