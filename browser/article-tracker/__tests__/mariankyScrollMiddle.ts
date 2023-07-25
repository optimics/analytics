import type { ArticleMetrics } from '../metrics'

import { configureTestPage, timeoutDefault } from '../__jest__/puppeteer'
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

  describe('on article page after scrolling down to the third paragraph', () => {
    const pageRef = configureTestPage({
      pageUrl: sourceFile,
      scriptUrls: ['/index.js'],
      serverRef,
    })
    const tracker = configureTracker({ pageRef })

    beforeAll(async () => {
      await pageRef.page.evaluate(() => {
        const nth = 2
        const element = document.querySelectorAll('div.c-rte > p')[nth]
        if (element) {
          const target = (element.nextElementSibling || element) as HTMLElement
          target.scrollIntoView({
            behavior: 'auto',
            block: 'end',
          })
        }
      })
      await tracker.waitForAnimationFrame()
      await pageRef.timeout(1000)
    })

    describe('immediately', () => {
      let metrics: ArticleMetrics

      beforeAll(async () => {
        metrics = await tracker.getMetrics()
      }, timeoutDefault)

      it('marks 3 paragraph displayed', async () => {
        expect(metrics).toHaveProperty('content.paragraph.displayed', 3)
      })

      it('marks 0 paragraphs consumed', async () => {
        expect(metrics).toHaveProperty('content.paragraph.consumedElements', 0)
      })
    })

    describe('after 10 idle seconds', () => {
      let metrics: ArticleMetrics

      beforeAll(async () => {
        await pageRef.timeout(10000)
        metrics = await tracker.getMetrics()
      }, timeoutDefault)

      it('marks 3 paragraphs consumed', async () => {
        expect(metrics).toHaveProperty('content.paragraph.consumedElements', 3)
      })

      it('reports paragraph timeTotal > 10000', async () => {
        /* It is impossible to determine exact consumption time due to natural
         * timers used by the automated browser */
        expect(
          metrics.content.paragraph.timeTotal,
        ).toBeGreaterThanOrEqual(10000)
      })

      it('reports three elements to be displayed via event handlers', async () => {
        expect(
          await tracker.getEventHandlerTargets('elementsDisplayed'),
        ).toHaveLength(3)
      })

      it('reports three elements to be consumed via event handlers', async () => {
        expect(
          await tracker.getEventHandlerTargets('elementsConsumed'),
        ).toHaveLength(3)
      })
    })
  })
})
