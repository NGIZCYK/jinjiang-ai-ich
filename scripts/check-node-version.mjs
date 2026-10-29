import { readFileSync } from 'node:fs'

const required = readFileSync(new URL('../.nvmrc', import.meta.url), 'utf8').trim()
const minimum = required.split('.').map(Number)
const current = process.versions.node.split('.').map(Number)
const supported = current[0] === minimum[0]
  && (current[1] > minimum[1] || current[1] === minimum[1] && current[2] >= minimum[2])

if (!supported) {
  console.error(`请使用 Node ${required}（或更新的 Node ${minimum[0]}.x）。当前为 ${process.versions.node}。`)
  console.error(`Use Node ${required} or a later ${minimum[0]}.x release, then retry. The project version is in .nvmrc.`)
  process.exitCode = 1
}
