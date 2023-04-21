/**
 * @fileOverview 编译单个文件, 通过命令调用
 * @date 2023-03-09
 * @author poohlaha
 */
import { program } from 'commander'
import Paths from './paths'

export default function () {
  const commands: { [K: string]: string } = Paths.getCommands() || {}
  program
    .usage('[options]')
    .option('--skip checkVersion', 'Skip the version check.')
    .option(`-e, ${commands.entry} <entry>`, 'Add an entry point.')
    .option(`-o, ${commands.output} <output>`, 'Output files dir, default `dist`.')
    .option(`-m, ${commands.mode} <mode>`, 'Set compile mode, such as `commonjs`、`es2015` etc, default `commonjs`.')
    .option(`-f, ${commands.format} <format>`, 'The format of output bundle. Can be `es`, `umd`, `amd`, `iife`, `cjs`, `system`, `all`, if there are multiple, please use `,` separate.')
    .parse(process.argv)

  return program.opts()
}
