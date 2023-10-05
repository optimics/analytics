import { build } from '../bindings/webpack.js'
import { buildMetadata, buildTemplate } from '@optimics/gtm-template-builder'
import { execSync } from 'child_process'
import { readFileSync } from 'fs'
import { dirname, join, resolve } from 'path'
import { fileURLToPath } from 'url'

const atLibUrlBase = process.env.AT_LIB_URL_BASE || 'https://storage.googleapis.com/zt-le-scripts/at/'
const repoUrl  = process.env.AT_DIST_REPO || 'git@github.com:optimics/gtm-template-article-tracker'

function exec(cmd, options) {
  try {
    return execSync(cmd, options)
  } catch(e) {
    if (e.stdout) {
      console.error('stdout', e.stdout)
      console.error('stderr', e.stderr)
    }
    throw e
  }
}

if (!atLibUrlBase) {
  process.stderr.write([
    'Cannot compile the template, because the "AT_LIB_URL_BASE"',
    'env variable is missing. Please provide value variable with',
    'valid absolute URL of production article tracker library hosting',
    'with trailing slash.\n',
  ].join(' '))
  process.exit(1)
}

if (!repoUrl) {
  process.stderr.write([
    'Cannot compile the template because the "AT_DIST_REPO" env variable is',
    'missing. Please provide a remote URL targetting writeable git repository.\n'
  ].join(' '))
  process.exit(2)
}

function commit(message, cwd) {
  exec(`git commit -m "${message}"`, { cwd })
}

const baseDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const templateDir = join(baseDir, 'template')
const distDir = join(baseDir, 'dist')
const repoDir = join(distDir, 'targetRepo')

const templateFile = join(repoDir, 'template.tpl')
const metadataFile = join(repoDir, 'metadata.yml')

const packageJsonPath = join(baseDir, 'package.json')
const packageJson = JSON.parse(readFileSync(packageJsonPath).toString())
const version = packageJson.version
const atLibUrl = `${atLibUrlBase}${version}/main.js`
const atLibStagingUrl = `${atLibUrlBase}staging/main.js`

function cloneRepo() {
  exec(`rm -rf ${repoDir}`)
  exec(`git clone ${repoUrl} ${repoDir}`)
}

function configureGit() {
  try {
    exec('git config --global user.email')
  } catch(e) {
    exec('git config --global user.email robot.deploy@optimics.cz')
  }
  try {
    exec('git config --global user.name')
  } catch(e) {
    exec('git config --global user.name "Optimics Robot"')
  }
}

function commitTemplate(version) {
  commit(`chore: release ${version}`, repoDir)
}

function commitMetadata(version) {
  commit(`chore: release ${version} metadata`, repoDir)
}

function addAll() {
  exec('git add -A', { cwd: repoDir })
}

function hasAnyOutput(cmd, options) {
  return Boolean(exec(cmd, options).toString().trim())
}

function didAnythingChange() {
  return hasAnyOutput('git diff --staged', { cwd: repoDir })
}

cloneRepo()
await build()
buildTemplate(templateDir, templateFile, { atLibUrl, atLibStagingUrl })
addAll()

if (didAnythingChange()) {
  configureGit()
  commitTemplate(version)
  buildMetadata(baseDir, packageJsonPath, metadataFile)
  addAll()
}

if (didAnythingChange()) {
  commitMetadata(version)
}
