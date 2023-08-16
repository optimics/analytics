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

  describe('after scrolling down to the third paragraph and then away from the article', () => {
    const pageRef = configureTestPage({
      pageUrl: sourceFile,
      scriptUrls: ['/index.js'],
      serverRef,
    })
    const tracker = configureTracker({ pageRef })

    beforeAll(async () => {
      await pageRef.scrollToElement('div.c-rte > p', 2)
      // jumping to footer will remove the article from viewport
      await pageRef.scrollToElement('footer', 0)
      // wait for the debounced events
      await pageRef.timeout(1000)
    })

    describe('immediately', () => {
      let metrics: ArticleMetrics

      beforeAll(async () => {
        metrics = await tracker.getMetrics()
      }, timeoutDefault)

      it('does not trigger consumptionStateChanged', async () => {
        const calls = await tracker.getEventHandlerCalls('consumptionStateChanged')
        expect(calls).toHaveLength(0)
      })

      it('does not trigger consumptionStarted', async () => {
        const calls = await tracker.getEventHandlerCalls('consumptionStarted')
        expect(calls).toHaveLength(0)
      })
    })
  })
})
