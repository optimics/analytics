import * as at from '../index.js'

import { install } from '@sinonjs/fake-timers'

declare global {
  export interface Window {
    // rome-ignore lint/suspicious/noExplicitAny: Accept anything into the window test scope
    test: any
  }
}

window.test = at
window.test.clock = install({
  toFake: ['setTimeout', 'clearTimeout', 'Date'],
})
