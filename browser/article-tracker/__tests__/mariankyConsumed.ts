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

  describe('on article with reader simulation', () => {
    const pageRef = configureTestPage({
      pageUrl: sourceFile,
      scriptUrls: ['/index.js'],
      serverRef,
    })
    const tracker = configureTracker({ pageRef })

    describe('after scrolling to the end during 120 seconds', () => {
      let metrics: ArticleMetrics

      async function viewParagraph(index: number, time: number): Promise<void> {
        await pageRef.scrollToElement('div.c-rte > p', index)
        await pageRef.timeout(time)
      }

      beforeAll(async () => {
        // "Read" each paragraph for 15 seconds
        const pTime = 15000
        await viewParagraph(0, pTime)
        await viewParagraph(1, pTime)
        // paragraph 2 is empty in marianky sample
        await viewParagraph(2, pTime)
        await viewParagraph(3, pTime)
        await viewParagraph(4, pTime)
        await viewParagraph(5, pTime)
      }, timeoutDefault)

      beforeAll(async () => {
        metrics = await tracker.getMetrics()
      }, timeoutDefault)

      it('consumed is true', async () => {
        expect(metrics).toHaveProperty('consumed', true)
      })

      it('reports timeTotal approx 90', async () => {
        expect(metrics.timeTotal).toBeGreaterThanOrEqual(90)
        expect(metrics.timeTotal).toBeLessThanOrEqual(95)
      })

      it('achieved 100 percent consumption', async () => {
        expect(metrics).toHaveProperty('achieved', 1)
      })

      it('content.paragraph.detected is 6', async () => {
        expect(metrics).toHaveProperty('content.paragraph.detected', 6)
      })

      it('content.paragraph.consumableElements is 5', async () => {
        expect(metrics).toHaveProperty(
          'content.paragraph.consumableElements',
          5,
        )
      })

      it('content.paragraph.consumedElements is 5', async () => {
        expect(metrics).toHaveProperty('content.paragraph.consumedElements', 5)
      })

      it('content.paragraph.achieved 100 percent consumption', async () => {
        expect(metrics).toHaveProperty('content.paragraph.achieved', 1)
      })

      it('consumptionAchievement gets called with 60 percent consumption', async () => {
        const calls = await tracker.getEventHandlerCalls(
          'consumptionAchievement',
        )
        expect(calls).toContainEqual([
          expect.objectContaining({
            achieved: 0.6,
          }),
        ])
      })

      it('consumptionAchievement gets called with 100 percent consumption', async () => {
        const calls = await tracker.getEventHandlerCalls(
          'consumptionAchievement',
        )
        expect(calls).toContainEqual([
          expect.objectContaining({
            achieved: 1,
          }),
        ])
      })
    })
  })
})
