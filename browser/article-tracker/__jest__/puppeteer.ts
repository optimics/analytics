import './windowType'

// @ts-ignore
import type { TestServerRef } from '../sampleServer'
import type { Browser, BrowserContext, Page } from 'puppeteer'

import pptr from 'puppeteer'

import { afterAll, beforeAll } from '@jest/globals'

declare global {
  let browserRef: BrowserRef
}

let globalBrowserRef: BrowserRef

export interface BrowserRef {
  browser: Browser
}

interface BrowserOptions {
  debug?: boolean
  graphic?: boolean
}

export const timeoutDefault = 60000

export function configureBrowser(options: BrowserOptions): BrowserRef {
  const browserRef: BrowserRef = {} as BrowserRef

  beforeAll(async () => {
    browserRef.browser = await pptr.launch({
      headless: options.graphic || options.debug ? false : 'new',
    })
  })

  afterAll(async () => {
    if (browserRef.browser) {
      await browserRef.browser.close()
    }
  })

  globalBrowserRef = browserRef
  return browserRef
}

interface ScrollToElementOptions {
  behavior?: 'smooth' | 'instant'
  scrollPadding?: number
  timeout?: number
}

export interface PageRef {
  page: Page
  scrollToElement: (
    selector: string,
    index: number,
    options?: ScrollToElementOptions,
  ) => Promise<void>
  timeout: (time: number, real?: boolean) => Promise<void>
  window: BrowserContext
}

interface PageOptions {
  browserRef?: BrowserRef
  keepWindowOpen?: boolean
  pageUrl: string
  scriptUrls?: string[]
  serverRef: TestServerRef
}

export function configureTestPage(options: PageOptions): PageRef {
  const ref: PageRef = {} as PageRef
  const browserRef = options.browserRef || globalBrowserRef

  // Open a page and inject globals
  beforeAll(async () => {
    ref.window = await browserRef.browser.createIncognitoBrowserContext()
    ref.page = await ref.window.newPage()
    await ref.page.setViewport({ height: 882, width: 1280 })
    ref.page.on('console', (message) => {
      // rome-ignore lint/nursery/noConsoleLog: Intentionally use console.log
      console.log(
        ...[message.type(), message.text(), message.location()?.url].filter(
          Boolean,
        ),
      )
    })
    ref.page.on('pageerror', ({ message }) => {
      // rome-ignore lint/nursery/noConsoleLog: Intentionally use console.log
      console.log(message)
    })
    await ref.page.goto(`${options.serverRef.origin}${options.pageUrl}`, {
      timeout: 30000,
    })
    if (options.scriptUrls) {
      for (const url of options.scriptUrls) {
        await ref.page.addScriptTag({
          url: `${options.serverRef.origin}${url}`,
        })
      }
    }
    await ref.page.waitForNetworkIdle()
  }, timeoutDefault)

  afterAll(async () => {
    if (ref.page) {
      if (options.keepWindowOpen) {
        await ref.timeout(3600000)
      }
      if (!ref.page.isClosed()) {
        await ref.page.close()
      }
    }
    if (ref.window) {
      await ref.window.close()
    }
  }, timeoutDefault)

  ref.timeout = async function (time: number, real = false): Promise<void> {
    if (real) {
      await new Promise((resolve) => setTimeout(resolve, time))
    }
    await ref.page.evaluate((time) => {
      const promise = new Promise((resolve) => setTimeout(resolve, time))
      window.test.clock.tick(time)
      return promise
    }, time)
  }

  ref.scrollToElement = async function (
    selector: string,
    nth = 0,
    options?: ScrollToElementOptions,
  ): Promise<void> {
    const behavior = options?.behavior || 'instant'
    const scrollPadding = options?.scrollPadding || 0
    const timeout = options?.timeout || 100
    await ref.page.evaluate(
      (selector, nth, behavior, scrollPadding) => {
        const element = document.querySelectorAll(selector)[nth]
        if (element) {
          const style = window.getComputedStyle(element)
          const rect = element.getBoundingClientRect()
          /* Given the element has bottom margin, we need to scroll extra pixels,
           * to make it fully appear on the viewport */
          const margin =
            parseFloat(style.marginTop) +
            parseFloat(style.marginBottom) +
            parseFloat(style.borderTopWidth) +
            parseFloat(style.borderBottomWidth)
          window.scrollTo({
            left: 0,
            /* The scroll position must be rounded to whole numbers, to avoid
             * conflicts with MutationObserver */
            top: Math.ceil(
              window.scrollY +
                rect.bottom +
                margin -
                window.innerHeight +
                scrollPadding,
            ),
            behavior,
          })
        } else {
          throw new Error(`Paragraph#${nth} not found`)
        }
      },
      selector,
      nth,
      behavior,
      scrollPadding,
    )
    /* Wait for the viewport scroll to propagate */
    if (behavior === 'smooth' || timeout) {
      await new Promise((resolve) =>
        setTimeout(resolve, timeout || 1000)
      )
    }
  }

  return ref
}
