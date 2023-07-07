import { guessRootConfig } from '@optimics/jest'

const config = guessRootConfig(import.meta.url)

for (const project of config.projects) {
  project.extensionsToTreatAsEsm = ['.ts', '.mts']
  project.moduleNameMapper['^(\\.{1,2}/.*)\\.js$'] = '$1'
  project.transform = {
    '\\.js$': ['babel-jest', { rootMode: 'upward' }],
    '\\.m?ts$': ['ts-jest', { useESM: true }],
  }
}

export default config
