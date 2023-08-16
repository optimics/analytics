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
const sourceFile = '/empty/index.html'

describe('ArticleTracker with empty.html sample', () => {
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

      it('achieved is 0', async () => {
        expect(metrics).toHaveProperty('achieved', 0)
      })

      it('consumed is false', async () => {
        expect(metrics).toHaveProperty('consumed', false)
      })

      it('consuming is false', async () => {
        expect(metrics).toHaveProperty('consuming', false)
      })

      it('overtime is 0', () => {
        expect(metrics).toHaveProperty('overtime', 0)
      })

      it('timeTotal is approx 0', () => {
        // This might fail on some systems because of performance issues
        expect(metrics.timeTotal).toBeLessThanOrEqual(0.5)
      })

      it('estimates.fastest is 0', () => {
        expect(metrics).toHaveProperty('estimates.fastest', 0)
      })

      it('estimates.slowest is 0', () => {
        expect(metrics).toHaveProperty('estimates.slowest', 0)
      })

      it('content.paragraph.detected is 0', async () => {
        expect(metrics).toHaveProperty('content.paragraph.detected', 0)
      })

      it('content.paragraph.displayed is 0', async () => {
        expect(metrics).toHaveProperty('content.paragraph.displayed', 0)
      })

      it('content.paragraph.consumableElements is 0', async () => {
        expect(metrics).toHaveProperty('content.paragraph.consumedElements', 0)
      })

      it('content.paragraph.consumedElements is 0', async () => {
        expect(metrics).toHaveProperty('content.paragraph.consumedElements', 0)
      })

      it('content.paragraph.estimates.fastest is 0', () => {
        expect(metrics).toHaveProperty('content.paragraph.estimates.fastest', 0)
      })

      it('content.paragraph.estimates.slowest is 0', () => {
        expect(metrics).toHaveProperty('content.paragraph.estimates.slowest', 0)
      })

      it('does not trigger consumptionStateChanged', async () => {
        expect(
          await tracker.getEventHandlerCalls('consumptionStateChanged'),
        ).toHaveLength(0)
      })
    })

    describe('after 10 idle seconds', () => {
      let metrics: ArticleMetrics

      beforeAll(async () => {
        await pageRef.timeout(10000)
        metrics = await tracker.getMetrics()
      }, timeoutDefault)

      it('consumed is false', async () => {
        expect(metrics).toHaveProperty('consumed', false)
      })

      it('consuming is false', async () => {
        expect(metrics).toHaveProperty('consuming', false)
      })

      it('content.paragraph.consumedElements is 0', async () => {
        expect(metrics).toHaveProperty('content.paragraph.consumedElements', 0)
      })

      it('content.paragraph.timeTotal is 0', async () => {
        expect(metrics.content.paragraph.timeTotal).toBe(0)
      })

      it('does not trigger consumptionStateChanged', async () => {
        expect(
          await tracker.getEventHandlerCalls('consumptionStateChanged'),
        ).toHaveLength(0)
      })

      it('does not trigger elementsDisplayed, for the empty paragraph', async () => {
        expect(
          await tracker.getEventHandlerCalls('elementsDisplayed'),
        ).toHaveLength(0)
      })

      it('does not trigger elementsConsumed', async () => {
        expect(
          await tracker.getEventHandlerCalls('elementsConsumed'),
        ).toHaveLength(0)
      })

      it('reports no element to be displayed via event handlers', async () => {
        expect(
          await tracker.getEventHandlerTargets('elementsDisplayed'),
        ).toHaveLength(0)
      })

      it('reports no elements to be consumed via event handlers', async () => {
        expect(
          await tracker.getEventHandlerTargets('elementsConsumed'),
        ).toHaveLength(0)
      })
    })

    describe('after injecting an whitespace filled paragraph into the page', () => {
      let metrics: ArticleMetrics

      beforeAll(async () => {
        await pageRef.page.evaluate(() => {
          const el = document.createElement('p')
          el.innerHTML = '\n&nbsp;\n'
          window.test.at.el.appendChild(el)
        })
        await pageRef.scrollToElement('main .c-content-inner p', 0)
      })

      beforeAll(async () => {
        await pageRef.timeout(10000)
        metrics = await tracker.getMetrics()
      }, timeoutDefault)

      it('consumed is false', async () => {
        expect(metrics).toHaveProperty('consumed', false)
      })

      it('consuming is false', async () => {
        expect(metrics).toHaveProperty('consuming', false)
      })

      it('content.paragraph.detected is 1', async () => {
        expect(metrics).toHaveProperty('content.paragraph.detected', 1)
      })

      it('content.paragraph.displayed is 1', async () => {
        expect(metrics).toHaveProperty('content.paragraph.displayed', 1)
      })

      it('content.paragraph.consumableElements is 0', async () => {
        expect(metrics).toHaveProperty(
          'content.paragraph.consumableElements',
          0,
        )
      })

      it('content.paragraph.consumedElements is 0', async () => {
        expect(metrics).toHaveProperty('content.paragraph.consumedElements', 0)
      })

      it('content.paragraph.estimates.fastest is 0', () => {
        expect(metrics).toHaveProperty('content.paragraph.estimates.fastest', 0)
      })

      it('content.paragraph.estimates.slowest is 0', () => {
        expect(metrics).toHaveProperty('content.paragraph.estimates.slowest', 0)
      })

      it('content.paragraph.timeTotal is 0', async () => {
        expect(metrics.content.paragraph.timeTotal).toBe(0)
      })
    })

    describe('after injecting a contentful paragraph into the page', () => {
      let metrics: ArticleMetrics

      beforeAll(async () => {
        await pageRef.page.evaluate(() => {
          const el = document.createElement('p')
          el.innerHTML =
            'Mariánské Lázně byly uznány jako klimatické. Jsou teprve šestými českými, které takové označení získaly. Teď se pyšní tím, že jsou komplexním lázeňským místem, které k léčbě využívá všechny přírodní zdroje.'
          const div = document.createElement('div')
          window.test.at.el.appendChild(div)
          div.appendChild(el)
        })
        await pageRef.scrollToElement('main .c-content-inner p', 1)
      })

      beforeAll(async () => {
        await pageRef.timeout(10000)
        metrics = await tracker.getMetrics()
      }, timeoutDefault)

      it('content.paragraph.detected is 2', async () => {
        expect(metrics).toHaveProperty('content.paragraph.detected', 2)
      })

      it('content.paragraph.displayed is 2', async () => {
        expect(metrics).toHaveProperty('content.paragraph.displayed', 2)
      })

      it('triggers consumptionStateChanged', async () => {
        const calls = await tracker.getEventHandlerCalls('consumptionStateChanged')
        expect(calls).toContainEqual([
          { consuming: true }
        ])
        expect(calls).toHaveLength(1)
      })

      it('triggers consumptionStarted', async () => {
        const calls = await tracker.getEventHandlerCalls('consumptionStarted')
        expect(calls).toHaveLength(1)
      })

      it('content.paragraph.consumableElements is 1', async () => {
        expect(metrics).toHaveProperty(
          'content.paragraph.consumableElements',
          1,
        )
      })

      it('content.paragraph.consumedElements is 1', async () => {
        expect(metrics).toHaveProperty('content.paragraph.consumedElements', 1)
      })

      it('content.paragraph.estimates.fastest is 36', () => {
        expect(metrics).toHaveProperty('content.paragraph.estimates.fastest', 6)
      })

      it('content.paragraph.estimates.slowest is 54', () => {
        expect(metrics).toHaveProperty('content.paragraph.estimates.slowest', 9)
      })

      it(
        'content.paragraph.timeTotal is 10000',
        async () => {
          expect(metrics.content.paragraph.timeTotal).toBe(10000)
        },
        timeoutDefault,
      )
    })
  })
})
