import { execSync } from 'child_process'
import { readFileSync } from 'fs'
import { dirname, join, resolve } from 'path'
import { fileURLToPath } from 'url'

const baseDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const distDir = join(baseDir, 'dist')
const repoDir = join(distDir, 'targetRepo')

const packageJsonPath = join(baseDir, 'package.json')
const packageJson = JSON.parse(readFileSync(packageJsonPath).toString())
const version = packageJson.version

function tagVersion(version) {
  execSync(`git tag v${version}`, { cwd: repoDir })
}

function push() {
  const branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: repoDir }).toString().trim()
  execSync(`git push origin ${branch}`, { cwd: repoDir })
  execSync('git push --tags', { cwd: repoDir })
}

push()
tagVersion(version)
