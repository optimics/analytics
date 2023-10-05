import type { EventHandlerName } from '../articles'
import type { ArticleMetrics } from '../metrics'
import type { PageRef } from './puppeteer'

import { timeoutDefault } from './puppeteer'
import { beforeAll } from '@jest/globals'

interface TrackerOptions {
  pageRef: PageRef
  noAutoTrack?: boolean
}

// rome-ignore lint/suspicious/noExplicitAny: We do not care about call args
type Call = any[]

interface EventHandlersCalls {
  [key: string]: Call[]
}

interface TrackerRef {
  track: () => Promise<void>
  waitForAnimationFrame: () => Promise<void>
  waitUntilSettled: () => Promise<void>
  getMetrics: () => Promise<ArticleMetrics>
  getAllEventHandlerCalls: () => Promise<EventHandlersCalls>
  getEventHandlerCalls: (type: EventHandlerName) => Promise<Call[]>
  getEventHandlerTargets: (type: EventHandlerName) => Promise<string[]>
}

export function configureTracker(options: TrackerOptions): TrackerRef {
  const ref = {} as TrackerRef
  const { noAutoTrack, pageRef } = options

  // Instantiate ArticleTracker
  beforeAll(async () => {
    await ref.waitUntilSettled()
    await pageRef.page.evaluate(({ noAutoTrack }) => {
      // @ts-ignore
      const articleEl = window.document.querySelector(
        'main .c-content-inner',
      ) as HTMLElement
      const base = window.test
      base.at = new base.ArticleTracker(articleEl, {
        contentTypes: [base.ArticleParagraph],
        intersectionThreshold: 1,
      })
      if (!noAutoTrack) {
        base.at.track()
      }
      base.eventHandlerCalls = {
        consumptionAchievement: [],
        consumptionStateChanged: [],
        consumptionStarted: [],
        consumptionStopped: [],
        elementsConsumed: [],
        elementsDisplayed: [],
        overtime: [],
      }
      base.eventHandlerTargets = {
        elementsConsumed: [],
        elementsDisplayed: [],
      }
      base.at.events.elementsDisplayed.subscribe((...args: Call) => {
        base.eventHandlerCalls.elementsDisplayed.push(args)
        base.eventHandlerTargets.elementsDisplayed.push(...args[0].targets)
      })
      base.at.events.elementsConsumed.subscribe((...args: Call) => {
        base.eventHandlerCalls.elementsConsumed.push(args)
        base.eventHandlerTargets.elementsConsumed.push(...args[0].targets)
      })
      base.at.events.consumptionAchievement.subscribe((...args: Call) => {
        base.eventHandlerCalls.consumptionAchievement.push(args)
      })
      base.at.events.consumptionStateChanged.subscribe((...args: Call) => {
        base.eventHandlerCalls.consumptionStateChanged.push(args)
      })
      base.at.events.consumptionStarted.subscribe((...args: Call) => {
        base.eventHandlerCalls.consumptionStarted.push(args)
      })
      base.at.events.consumptionStopped.subscribe((...args: Call) => {
        base.eventHandlerCalls.consumptionStopped.push(args)
      })
      base.at.events.overtime.subscribe((...args: Call) => {
        base.eventHandlerCalls.overtime.push(args)
      })
    }, { noAutoTrack })
    await ref.waitUntilSettled()
  }, timeoutDefault)

  ref.waitForAnimationFrame = async function (): Promise<void> {
    await pageRef.page.evaluate(
      async () =>
        new Promise((resolve) => window.requestAnimationFrame(resolve)),
    )
  }

  ref.waitUntilSettled = async function (): Promise<void> {
    await ref.waitForAnimationFrame()
    await pageRef.timeout(100)
  }

  ref.getMetrics = async function (): Promise<ArticleMetrics> {
    return await pageRef.page.evaluate(() => window.test.at.getMetrics())
  }

  ref.getAllEventHandlerCalls = async function (): Promise<EventHandlersCalls> {
    return (await pageRef.page.evaluate(
      () => window.test.eventHandlerCalls,
    )) as EventHandlersCalls
  }

  ref.getEventHandlerCalls = async function (
    type: EventHandlerName,
  ): Promise<Call[]> {
    const eventHandlerCalls = await ref.getAllEventHandlerCalls()
    return eventHandlerCalls?.[type]
  }

  ref.getEventHandlerTargets = async function (
    type: EventHandlerName,
  ): Promise<string[]> {
    return (await pageRef.page.evaluate(
      (type) => window.test.eventHandlerTargets[type],
      type,
    )) as string[]
  }

  ref.track = async function() {
    pageRef.page.evaluate(() => {
       window.test.at.track()
    })
  }

  return ref
}
