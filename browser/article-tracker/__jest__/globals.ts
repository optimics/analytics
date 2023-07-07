import * as at from '../index.js'

declare global {
  export interface Window {
    // rome-ignore lint/suspicious/noExplicitAny: Accept anything into the window test scope
    test: any
  }
}

window.test = at
