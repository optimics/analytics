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

export async function timeout(time: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, time))
}

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

export interface PageRef {
  page: Page
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
    await ref.page.goto(`${options.serverRef.origin}${options.pageUrl}`, { timeout: 5000 })
    if (options.scriptUrls) {
      for (const url of options.scriptUrls) {
        await ref.page.addScriptTag({ url: `${options.serverRef.origin}${url}` })
      }
    }
    await ref.page.waitForNetworkIdle()
  })

  afterAll(async () => {
    if (ref.page) {
      if (options.keepWindowOpen) {
        await timeout(3600000)
      }
      if (!ref.page.isClosed()) {
        await ref.page.close()
      }
    }
    if (ref.window) {
      await ref.window.close()
    }
  }, timeoutDefault)

  return ref
}
