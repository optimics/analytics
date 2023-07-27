import type { ArticleTracker } from '../articles'
import type { Clock } from '@sinonjs/fake-timers'

declare global {
  interface Window {
    test: {
      ArticleTracker: typeof ArticleTracker
      clock: Clock
      // rome-ignore lint/suspicious/noExplicitAny: Accept anything into the window test scope
      [key: string]: any
    }
  }
}
