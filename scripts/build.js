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
const outputDir = 'dist'
const outputPath = path.join(__dirname, '../', outputDir)

function build(packageName = '') {
  shell.exec(`swc ${packageName} -d ${outputDir}`)

  // 拷贝 package.json 到目录

  const packagesPath = path.join(__dirname, '../', packageName)
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

      const outputPackageJsonPath = path.join(outputFullPath, 'package.json')
      const outputReadmePath = path.join(outputFullPath, 'README.md')
      const outputLicensePath = path.join(outputFullPath, 'LICENSE')

      if (fsExtra.pathExistsSync(outputPackageJsonPath)) {
        fsExtra.removeSync(outputPackageJsonPath)
      }

      if (fsExtra.pathExistsSync(outputReadmePath)) {
        fsExtra.removeSync(outputReadmePath)
      }

      if (fsExtra.pathExistsSync(outputLicensePath)) {
        fsExtra.removeSync(outputLicensePath)
      }
      fsExtra.copySync(packageJsonPath, outputPackageJsonPath)
      fsExtra.copySync(readMePath, outputReadmePath)
      fsExtra.copySync(licensePath, outputLicensePath)
    }
  }
}

function run() {
  fsExtra.removeSync(outputPath)

  build('bale-tools')
  build('bale-web')
}
module.exports = run()
