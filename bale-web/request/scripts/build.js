/**
 * @fileOverview build
 * @date 2023-03-14
 * @author poohlaha
 */
'use strict'

const shell = require('shelljs')
const fsExtra = require('fs-extra')
const path = require('path')
const { Paths } = require('@bale-tools/utils')

const outputDir = '.'

function build() {
  const pathName = path.join(__dirname, '../')
  let fileList = Paths.getFileList(pathName)
  if (fileList.length === 0) return
  fileList = fileList.filter(file => file.endsWith('ts')) || []
  if (fileList.length === 0) return
  for (const file of fileList) {
    let outputFile = file.replace('.ts', '.js')
    fsExtra.removeSync(outputFile)
    shell.exec(`swc ${file} -o ${outputFile}`)
  }
}

function run() {
  build('lib')
}
module.exports = run()
