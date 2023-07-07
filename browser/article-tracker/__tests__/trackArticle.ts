import { ArticleTracker, trackArticle } from '..'
import {
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

const baseDir = dirname(fileURLToPath(import.meta.url))

describe('trackArticle', () => {
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

  beforeEach(() => {
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
  })

  it('returns ArticleTracker', () => {
    const div = document.createElement('div')
    expect(trackArticle(div, { contentTypes: [] })).toBeInstanceOf(
      ArticleTracker,
    )
  })
})
