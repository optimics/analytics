import '../__jest__/windowType'

import type { ArticleMetrics } from '../metrics'

import { configureTestPage, timeoutDefault } from '../__jest__/puppeteer'
import { setupTestServer } from '../__jest__/sampleServer'
import { configureTracker } from '../__jest__/tracker'
import { beforeAll, describe, expect, it } from '@jest/globals'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

// @ts-ignore
const baseDir = dirname(fileURLToPath(import.meta.url))
const pkgDir = resolve(baseDir, '..')
const jestDir = resolve(pkgDir, '__jest__')
const samplesDir = resolve(pkgDir, '__samples__')
const sourceFile = '/marianky/index.html'

describe('ArticleTracker with marianky.html sample', () => {
  const serverRef = setupTestServer({
    sourceDir: samplesDir,
    pkgDir,
    entryPath: {
      index: resolve(jestDir, 'globals.ts'),
    },
  })

  describe('on article page without interactions', () => {
    const pageRef = configureTestPage({
      pageUrl: sourceFile,
      scriptUrls: ['/index.js'],
      serverRef,
    })
    const tracker = configureTracker({ pageRef })

    describe('after 180 idle seconds', () => {
      let metrics: ArticleMetrics

      beforeAll(async () => {
        await pageRef.timeout(180000)
        metrics = await tracker.getMetrics()
      }, timeoutDefault)

      it('consumed is false', async () => {
        expect(metrics).toHaveProperty('consumed', false)
      })

      it('reports timeTotal approx 180', async () => {
        expect(metrics.timeTotal).toBeGreaterThanOrEqual(180)
      })

      it('overtime is 2', async () => {
        expect(metrics).toHaveProperty('overtime', 2)
      })

      it('achieved 20 percent consumption', async () => {
        expect(metrics).toHaveProperty('achieved', 0.2)
      })

      it('content.paragraph.consumableElements is 5', async () => {
        expect(metrics).toHaveProperty('content.paragraph.consumableElements', 5)
      })

      it('content.paragraph.consumedElements is 1', async () => {
        expect(metrics).toHaveProperty('content.paragraph.consumedElements', 1)
      })

      it('calls overtime event handler', async () => {
        expect(
          await tracker.getEventHandlerCalls('overtime'),
        ).toHaveLength(2)
      })
    })
  })
})
