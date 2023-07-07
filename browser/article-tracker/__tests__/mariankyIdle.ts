import type { ArticleMetrics } from '../metrics'

import {
  configureTestPage,
  timeout,
  timeoutDefault,
} from '../__jest__/puppeteer'
import { setupTestServer } from '../__jest__/sampleServer'
import { configureTracker } from '../__jest__/tracker'
import { beforeAll, describe, expect, it } from '@jest/globals'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

declare global {
  export interface Window {
    // rome-ignore lint/suspicious/noExplicitAny: Accept anything into the window test scope
    test: any
  }
}

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

    describe('immediately', () => {
      let metrics: ArticleMetrics

      beforeAll(async () => {
        metrics = await tracker.getMetrics()
      }, timeoutDefault)

      it('detects 6 paragraphs in total', async () => {
        expect(metrics).toHaveProperty('content.paragraph.total', 6)
      })

      it('marks 1 paragraph displayed', async () => {
        expect(metrics).toHaveProperty('content.paragraph.displayed', 1)
      })

      it('marks 0 paragraphs consumed', async () => {
        expect(metrics).toHaveProperty('content.paragraph.consumed', 0)
      })
    })

    describe('after 10 idle seconds', () => {
      let metrics: ArticleMetrics

      beforeAll(async () => {
        await timeout(10000)
        metrics = await tracker.getMetrics()
      }, timeoutDefault)

      it('marks 1 paragraph consumed', async () => {
        expect(metrics).toHaveProperty('content.paragraph.consumed', 1)
      })

      it('reports paragraph consumptionTime > 10000', async () => {
        /* It is impossible to determine exact consumption time due to natural
         * timers used by the automated browser */
        expect(
          metrics.content.paragraph.consumptionTimeTotal,
        ).toBeGreaterThanOrEqual(10000)
      })

      it('triggers elementsDisplayed once, for first paragraph', async () => {
        expect(
          await tracker.getEventHandlerCalls('elementsDisplayed'),
        ).toHaveLength(1)
      })

      it('triggers elementsConsumed once, for first paragraph', async () => {
        expect(
          await tracker.getEventHandlerCalls('elementsConsumed'),
        ).toHaveLength(1)
      })

      it('reports one element to be displayed via event handlers', async () => {
        expect(
          await tracker.getEventHandlerTargets('elementsDisplayed'),
        ).toHaveLength(1)
      })

      it('reports one element to be consumed via event handlers', async () => {
        expect(
          await tracker.getEventHandlerTargets('elementsConsumed'),
        ).toHaveLength(1)
      })
    })
  })
})
