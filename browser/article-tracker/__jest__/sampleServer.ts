import type WebpackDevServer from 'webpack-dev-server'

import type { NetworkInterfaceInfo } from 'os'

import getPort from 'get-port'

import { afterAll, beforeAll } from '@jest/globals'
import { createRequire } from 'node:module'
import { networkInterfaces } from 'os'

// @ts-ignore
import { createDevServer, readManifest } from '@optimics/webpack'

const requireMock = createRequire(import.meta.url)

function mapNetConfig(netConfig: NetworkInterfaceInfo): string {
  return netConfig.family === 'IPv6'
    ? `[${netConfig.address}]`
    : netConfig.address
}

function getIpAddrs(): string[] {
  return Object.values(networkInterfaces())
    .flat()
    .filter((ni) => Boolean(ni))
    .map((ni) => mapNetConfig(ni as NetworkInterfaceInfo))
}

function getBindings(
  addrs: string[],
  port: number,
  protocol = 'http',
): string[] {
  return addrs.map((addr) => `${protocol}://${addr}:${port}`)
}

function getLocalBinding(bindings: string[]): string {
  return (
    bindings.find((b) => b.includes('127.0.0.1') || b.includes('[::1]')) ||
    bindings[0]
  )
}

interface TestServerOptions {
  sourceDir: string
  entryPath: string | Record<string, string>
  pkgDir: string
  ref?: object
}

export interface TestServerRef {
  webpack: WebpackDevServer
  origin: string
}

export function setupTestServer(config: TestServerOptions): TestServerRef {
  const ref: TestServerRef = (config.ref || ({} as unknown)) as TestServerRef

  beforeAll(async () => {
    const port = await getPort()
    const wds = createDevServer({
      devServerOptions: {
        static: {
          directory: config.sourceDir,
        },
        client: {
          logging: 'error',
        },
      },
      defaultPort: port,
      entryPath: config.entryPath,
      env: {},
      manifest: readManifest(config.pkgDir),
      compilerConfig: {
        infrastructureLogging: {
          level: 'error',
        },
        resolve: {
          // Add `.ts` and `.tsx` as a resolvable extension.
          extensions: ['.ts', '.tsx', '.js'],
          // Add support for TypeScripts fully qualified ESM imports.
          extensionAlias: {
            '.js': ['.js', '.ts'],
            '.cjs': ['.cjs', '.cts'],
            '.mjs': ['.mjs', '.mts'],
          },
          fallback: {
            util: requireMock.resolve('util/')
          },
        },
        stats: 'errors-only',
      },
    })
    ref.webpack = wds
    const addrs = getIpAddrs()
    const bindings = getBindings(addrs, port)
    ref.origin = getLocalBinding(bindings)
    await wds.start()
  })

  afterAll(async () => {
    if (ref.webpack) {
      ref.webpack.stop()
    }
  })

  return ref
}
