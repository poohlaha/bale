/**
 * @fileOverview 编译单个文件, 通过命令调用
 * @date 2023-12-28
 * @author poohlaha
 */
import { program } from 'commander'

let commands = {
  entry: '--entry',
  update: '--update',
  exts: '--exts',
}

export default function () {
  program
    .usage('[options]')
    .option(`-e, ${commands.entry} <entry>`, 'Add an entry file or dir.')
    .parse(process.argv)
    .option(`-exts, ${commands.exts} <exts>`, 'Exclude file exts, more use `,`.')
    .parse(process.argv)
    .option(`-u, ${commands.update} <update>`, 'Update package.')
    .parse(process.argv)

  return program.opts()
}
