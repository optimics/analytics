import { configurePackage } from '@optimics/webpack'
import { dirname, join, resolve } from 'path'
import { fileURLToPath } from 'url'

const srcDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')

export const { build, runDevServer } = configurePackage({
  defaultPort: 7001,
  entryPath: {
    'main': join(srcDir, 'index.ts'),
  },
  srcDir,
  devServerOptions: {
    allowedHosts: 'all',
  },
})
