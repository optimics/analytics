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

  describe('on article with reader singleto event handler', () => {
    const pageRef = configureTestPage({
      pageUrl: sourceFile,
      scriptUrls: ['/index.js'],
      serverRef,
    })
    const tracker = configureTracker({ pageRef, noAutoTrack: true })

    beforeAll(async () => {
      await pageRef.page.evaluate(() => {
        window.test.achievementHandler = []
        window.test.at.events.consumptionAchievement.subscribe((...args: any[]) => {
          window.test.achievementHandler.push(args)
        }, {
          once: true
        })
      })
      await tracker.track()
    })

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
      }, timeoutDefault)

      beforeAll(async () => {
        metrics = await pageRef.page.evaluate(() => {
          return window.test.achievementHandler
        }) 
      }, timeoutDefault)

      it('consumptionAchievement is fired only once', async () => {
        expect(metrics).toHaveLength(1)
      })
    })
  })
})
