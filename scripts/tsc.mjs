/**
 * 构建入口包装：把「构建模式」翻译成 tsc 的 project 选择。
 *
 * tsc 不读环境变量，sourceMap / declarationMap 只能由 tsconfig 或 CLI 参数决定，
 * 因此模式切换必须由本脚本完成：
 *   development → tsconfig.dev.json（产出 .map）
 *   production  → tsconfig.build.json（不产出 .map）
 *
 * 模式优先级：--mode=<development|production> > --watch > BUILD_MODE > NODE_ENV > production
 * 用法（在包目录内执行，由各包 package.json 的 build / dev 脚本调用）：
 *   node ../../scripts/tsc.mjs                    # 按环境变量，缺省 production
 *   node ../../scripts/tsc.mjs --mode=development
 *   node ../../scripts/tsc.mjs --watch            # 等价 development + --watch
 */
import { spawn, spawnSync } from 'node:child_process'
import { existsSync, readFileSync, rmSync } from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const tscBin = require.resolve('typescript/bin/tsc')

const argv = process.argv.slice(2)
const watch = argv.includes('--watch')
const modeFlag = argv.find((arg) => arg.startsWith('--mode='))
const envMode = process.env.BUILD_MODE ?? process.env.NODE_ENV ?? ''

/** @param {string} value @returns {'development' | 'production'} */
function normalizeMode(value) {
  return value === 'development' || value === 'dev' ? 'development' : 'production'
}

const mode = modeFlag
  ? normalizeMode(modeFlag.slice('--mode='.length))
  : watch
    ? 'development'
    : normalizeMode(envMode)

const project = mode === 'development' ? 'tsconfig.dev.json' : 'tsconfig.build.json'
if (!existsSync(project)) {
  console.error(`[build] 找不到 ${project}（当前目录 ${process.cwd()}）`)
  process.exit(1)
}

const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
const label = `[build] ${pkg.name} mode=${mode} maps=${mode === 'development' ? 'on' : 'off'}`

// tsc 不清理旧产物：dev 生成的 .map 会残留在 lib/，必须每次编译前清空。
rmSync('lib', { recursive: true, force: true })
console.log(label)

const args = ['-p', project]
if (watch) args.push('--watch', '--preserveWatchOutput')

if (watch) {
  const child = spawn(process.execPath, [tscBin, ...args], { stdio: 'inherit' })
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => child.kill(signal))
  }
  child.on('exit', (code) => process.exit(code ?? 0))
} else {
  const result = spawnSync(process.execPath, [tscBin, ...args], { stdio: 'inherit' })
  process.exit(result.status ?? 1)
}
