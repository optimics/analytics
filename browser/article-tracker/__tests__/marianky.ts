import type { TargetEventProps } from '../articles'
import type { EventHandler } from '../events'

import { ArticleParagraph, ArticleTracker, IArticleElement } from '..'
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals'
import { JSDOM } from 'jsdom'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

type IntersectionObserverCallback = (
  entries: IntersectionObserverEntry[],
) => void

// @ts-ignore
const baseDir = dirname(fileURLToPath(import.meta.url))

describe('ArticleTracker with marianky.html sample', () => {
  let at: ArticleTracker
  let observerCallback: IntersectionObserverCallback

  beforeAll(async () => {
    const sourceFile = resolve(
      baseDir,
      '..',
      '__samples__',
      'marianky',
      'index.html',
    )
    const jsdom = await JSDOM.fromFile(sourceFile)
    Object.defineProperty(global, 'window', { value: jsdom.window })
    Object.defineProperty(global, 'document', { value: jsdom.window.document })
  })

  describe('checking paragraphs only', () => {
    beforeEach(() => {
      jest.useFakeTimers()
      const observe = jest.fn()
      const unobserve = jest.fn()
      const disconnect = jest.fn()
      // @ts-ignore
      window.IntersectionObserver = jest.fn(
        (callback: IntersectionObserverCallback) => {
          observerCallback = callback
          return {
            observe,
            unobserve,
            disconnect,
          }
        },
      )
      const articleEl = window.document.querySelector('main .c-content-inner')
      at = new ArticleTracker(articleEl as HTMLElement, {
        contentTypes: [ArticleParagraph],
        intersectionThreshold: 0.75,
      })
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('estimateFastestTime returns 36202', () => {
      expect(at.estimateFastestTime()).toBe(36200)
    })

    it('estimateSlowestTime returns 54300', () => {
      expect(at.estimateSlowestTime()).toBe(54300)
    })

    it('expect getTimeOnArticle returns 0', () => {
      expect(at.getTimeOnArticle()).toBe(0)
    })

    describe('getContent', () => {
      it('returns 6 article paragraphs', () => {
        expect(
          at
            .getContent()
            .filter(
              (item: IArticleElement) => item instanceof ArticleParagraph,
            ),
        ).toHaveLength(6)
      })
    })

    describe('getMetrics', () => {
      describe('after idle observing article for 30 seconds', () => {
        beforeEach(() => {
          at.track()
          jest.advanceTimersByTime(30000)
        })

        afterEach(() => {
          at.untrack()
        })

        it('returns timeTotal=30', () => {
          expect(at.getMetrics()).toHaveProperty('timeTotal', 30)
        })
      })

      describe('after idle observing article for 90 seconds', () => {
        beforeEach(() => {
          at.track()
          jest.advanceTimersByTime(90000)
        })

        afterEach(() => {
          at.untrack()
        })

        it('returns timeTotal=90', () => {
          expect(at.getMetrics()).toHaveProperty('timeTotal', 90)
        })
      })

      describe('after scrolling to the first paragraph of the article in 90 seconds', () => {
        let elementDisplayedHandler: EventHandler<TargetEventProps>

        beforeEach(() => {
          elementDisplayedHandler = jest.fn()
          at.events.elementsDisplayed.subscribe(elementDisplayedHandler)
          at.track()
          jest.advanceTimersByTime(90000)
          const target = at.el.querySelector('p') as HTMLElement
          // Mock that the element does not have zero dimensions
          Object.defineProperty(target, 'clientHeight', { value: 100 })
          Object.defineProperty(target, 'clientWidth', { value: 100 })
          // @ts-ignore
          observerCallback([
            {
              target,
              isIntersecting: true,
            } as unknown as IntersectionObserverEntry,
          ])
          jest.runOnlyPendingTimers()
        })

        afterEach(() => {
          at.untrack()
        })

        it('returns content.paragraph.detected=6', () => {
          expect(at.getMetrics()).toHaveProperty(
            'content.paragraph.detected',
            6,
          )
        })

        it('returns content.paragraph.consumableElements=5', () => {
          expect(at.getMetrics()).toHaveProperty(
            'content.paragraph.consumableElements',
            5,
          )
        })

        it('returns content.paragraph.displayed=1', () => {
          expect(at.getMetrics()).toHaveProperty(
            'content.paragraph.displayed',
            1,
          )
        })

        it('triggers elementDisplayedHandler', () => {
          expect(elementDisplayedHandler).toHaveBeenCalledWith({
            targets: [expect.any(ArticleParagraph)],
          })
        })
      })

      describe('after scrolling to the third paragraph of the article in 90 seconds', () => {
        let elementDisplayedHandler: EventHandler<TargetEventProps>

        beforeEach(() => {
          elementDisplayedHandler = jest.fn()
          at.events.elementsDisplayed.subscribe(elementDisplayedHandler)
          at.track()
          jest.advanceTimersByTime(90000)
          const targets = at.el.querySelectorAll('p')
          const target1 = targets[0]
          const target2 = targets[1]
          const target3 = targets[2]
          // Mock that the element does not have zero dimensions in JSDOM
          Object.defineProperty(target1, 'clientHeight', { value: 100 })
          Object.defineProperty(target1, 'clientWidth', { value: 100 })
          Object.defineProperty(target2, 'clientHeight', { value: 100 })
          Object.defineProperty(target2, 'clientWidth', { value: 100 })
          Object.defineProperty(target3, 'clientHeight', { value: 100 })
          Object.defineProperty(target3, 'clientWidth', { value: 100 })
          // @ts-ignore
          observerCallback([
            {
              target: target1,
              isIntersecting: true,
            } as unknown as IntersectionObserverEntry,
          ])
          jest.advanceTimersByTime(3)
          // @ts-ignore
          observerCallback([
            {
              target: target2,
              isIntersecting: true,
            } as unknown as IntersectionObserverEntry,
          ])
          jest.advanceTimersByTime(3)
          // @ts-ignore
          observerCallback([
            {
              target: target3,
              isIntersecting: true,
            } as unknown as IntersectionObserverEntry,
          ])
          jest.runOnlyPendingTimers()
        })

        afterEach(() => {
          at.untrack()
        })

        it('returns content.paragraph.detected=6', () => {
          expect(at.getMetrics()).toHaveProperty(
            'content.paragraph.detected',
            6,
          )
        })

        it('returns content.paragraph.displayed=3', () => {
          expect(at.getMetrics()).toHaveProperty(
            'content.paragraph.displayed',
            3,
          )
        })

        it('triggers elementDisplayedHandler with three paragraphs', () => {
          expect(elementDisplayedHandler).toHaveBeenCalledWith({
            targets: [
              expect.any(ArticleParagraph),
              expect.any(ArticleParagraph),
              expect.any(ArticleParagraph),
            ],
          })
        })
      })
    })
  })
})
