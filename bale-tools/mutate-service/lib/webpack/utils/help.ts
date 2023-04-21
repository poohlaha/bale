/**
 * @fileOverview webpack loader
 * @date 2023-03-13
 * @author poohlaha
 */
import { program } from 'commander'
import Paths from './paths'

export default function () {
  const commands: { [K: string]: string } = Paths.getCommands() || {}
  program
    .usage('[options]')
    .option('--skip=checkVersion', 'Skip the version check.')
    .option(`-s, ${commands.script} <script>`, 'Start or build a project.')
    .option(`-n, ${commands.env} <env>`, 'Setup `Environment`, such as `development` or `production`.')
    .option(`-e, ${commands.entry} <entry>`, 'Add an entry point.')
    .option(`-o, ${commands.output} <output>`, 'Output files dir, default `dist`.')
    .option(`-u, ${commands.url} <url>`, 'Setup a visit url.')
    .option(`-p, ${commands.port} <port>`, 'Setup webpack dev server port.')
    .parse(process.argv)

  return program.opts()
}
