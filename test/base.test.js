/**
 * @fileOverview base
 * @date 2023-03-14
 * @author poohlaha
 */
const fsExtra = require('fs-extra')
const path = require('path')
const chalk = require('chalk')

function getOutput(projectName = '') {
  return path.join(__dirname, '../', 'dist', projectName || '', 'lib')
}

function getLoggerPrefix() {
  return chalk.cyan('[Bale Test Logger]: ')
}

function getFile(projectName = '', modeName = '', msg = '') {
  console.info(getLoggerPrefix() + `Testing ${chalk.magenta(msg)} ...`)
  const filePath = path.join(getOutput(projectName), modeName)
  if (!fsExtra.pathExistsSync(filePath)) {
    console.info(getLoggerPrefix() + `${filePath} not exists, please run build first !`)
    return null
  } else {
    return require(filePath).default
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

module.exports = { getOutput, getLoggerPrefix, getFile, sleep }
