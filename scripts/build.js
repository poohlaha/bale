/**
 * @fileOverview build
 * @date 2023-03-14
 * @author poohlaha
 */
'use strict'

const shell = require('shelljs')
const fsExtra = require('fs-extra')
const path = require('path')

const skips = ['mutate-version']
function build() {
  const outputDir = 'dist'
  shell.exec(`swc bale-tools -d ${outputDir}`)

  // 拷贝 package.json 到目录
  const outputPath = path.join(__dirname, '../', outputDir)
  const packagesPath = path.join(__dirname, '../', 'bale-tools')
  const dirs = fsExtra.readdirSync(packagesPath)
  for (let dir of dirs) {
    const projectDir = path.join(packagesPath, dir)
    const packageJsonPath = path.join(projectDir, 'package.json')
    if (!fsExtra.pathExistsSync(packageJsonPath)) continue

    if (skips.includes(dir)) {
      fsExtra.copySync(projectDir, path.join(outputPath, dir))
    } else {
      const readMePath = path.join(projectDir, 'README.md')
      const licensePath = path.join(projectDir, 'LICENSE')
      const outputFullPath = path.join(outputPath, dir)
      if (!fsExtra.pathExistsSync(outputFullPath)) {
        fsExtra.ensureDirSync(outputFullPath)
      }
      fsExtra.copySync(packageJsonPath, path.join(outputFullPath, 'package.json'))
      fsExtra.copySync(readMePath, path.join(outputFullPath, 'README.md'))
      fsExtra.copySync(licensePath, path.join(outputFullPath, 'LICENSE'))
    }
  }
}

module.exports = build()
