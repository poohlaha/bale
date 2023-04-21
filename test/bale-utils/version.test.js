/**
 * @fileOverview Version check
 * @date 2023-03-14
 * @author poohlaha
 */
const test = require('ava')
const path = require('path')
const { getFile, sleep, getLoggerPrefix } = require('../base.test')

let Version = null
test.before(async t => {
  await sleep(1000)
  Version = getFile('bale-utils', path.join('version', 'index.js'), 'Version Check')
})

test('test version check: ', async t => {
  if (!Version) {
    t.pass()
    return
  }

  const done = () => {
    console.log('Version Check Done.')
  }

  Version.run('@bale-tools/utils', done)
  t.pass()
})

test.after(t => {
  console.info(getLoggerPrefix() + 'Done .')
})
