/**
 * @fileOverview publish
 * @date 2023-03-14
 * @author poohlaha
 */
'use strict'

const shell = require('shelljs')
const inquirer = require('inquirer')
const path = require('path')
const fsExtra = require('fs-extra')

function publish() {
  const outputDir = 'dist'
  let choices = []

  const outputPath = path.join(__dirname, '../', outputDir)
  if (!fsExtra.pathExistsSync(outputPath)) {
    console.warn(`${outputDir} is not exists, please run build command !`)
    return
  }
  const dirs = fsExtra.readdirSync(outputPath)
  const projectList = []
  for (let i = 0; i < dirs.length; i++) {
    const dir = dirs[i] || ''
    const projectDir = path.join(outputPath, dir)
    const packageJsonPath = path.join(projectDir, 'package.json')
    if (!fsExtra.pathExistsSync(packageJsonPath)) continue
    const packageJson = require(packageJsonPath) || {}
    let name = packageJson.name || ''
    if (name !== dir) {
      name += `(${dir})`
    }
    choices.push({ key: String(i), name, value: dir || '' })
    projectList.push(dir)
  }

  choices.push({ key: 'a', name: 'All', value: 'all' })

  confirm(choices, async (name = '') => {
    const getProjectTask = (dir = '') => {
      let projectPath = path.join(outputPath, dir)
      if (!fsExtra.pathExistsSync(projectPath)) {
        console.warn(`${projectPath} is not exists, please run build command !`)
        return null
      }

      return {
        filePath: projectPath,
        command: 'npm publish --access public',
      }
    }

    const tasks = []
    if (name === 'all') {
      for (let project of projectList) {
        const task = getProjectTask(project)
        if (task) {
          tasks.push(task)
        }
      }
    } else {
      const task = getProjectTask(name)
      if (task) {
        tasks.push(task)
      }
    }

    shell.exec('nrm use npm')
    await buildTasks(tasks)
  })
}

async function buildTasks(tasks = []) {
  if (tasks.length === 0) return

  const appRootDir = path.join(__dirname, '../')
  await Promise.all(
    tasks.map(task => {
      shell.cd(task.filePath) // 切换目录
      shell.exec(task.command)
    })
  )

  shell.cd(appRootDir) // 切换到根目录
}

/**
 * 选择
 */
function confirm(choices = [], done) {
  return inquirer
    .prompt([
      {
        type: 'rawlist',
        name: 'option',
        message: '请选择要 publish 的项目?',
        default: 0, // default to help in order to avoid clicking straight through
        choices,
      },
    ])
    .then((result = {}) => {
      done?.(result.option)
    })
}

module.exports = publish()
