import type { ArticleElement, IArticleElement } from './elements.js'
import type { ArticleMetrics, TypeMetrics } from './metrics.js'

function toSeconds(time: number): number {
  return time / 1000
}

export interface ArticleTrackerOptions {
  contentTypes: typeof ArticleElement[]
  intersectionThreshold?: number
}

interface EventHandlerProps {
  articleTracker: ArticleTracker
  targets?: IArticleElement[]
}

export type EventHandler = (props: EventHandlerProps) => void

interface EventController {
  bouncer?: ReturnType<typeof setTimeout>
  targets?: IArticleElement[]
  handlers: EventHandler[]
}

export interface EventHandlers {
  elementsDisplayed: EventController
  elementsConsumed: EventController
}

export type EventHandlerName = keyof EventHandlers

export class ArticleTracker {
  content?: IArticleElement[]
  el: HTMLElement
  handlers: EventHandlers = {
    elementsDisplayed: {
      handlers: [],
    },
    elementsConsumed: {
      handlers: [],
    },
  }
  eventBounceTime = 60
  intersectionThreshold = 0.75
  startedAt?: Date
  observer?: IntersectionObserver
  contentTypes: typeof ArticleElement[]

  constructor(el: HTMLElement, options: ArticleTrackerOptions) {
    this.el = el
    this.contentTypes = options.contentTypes
    if (options.intersectionThreshold) {
      this.intersectionThreshold = options.intersectionThreshold
    }
    this.setupObserver()
  }

  track(): ArticleTracker {
    this.startedAt = new Date()
    this.observeIntersections()
    return this
  }

  untrack(): ArticleTracker {
    if (this.observer) {
      this.observer.disconnect()
    }
    return this
  }

  getContent(): IArticleElement[] {
    if (this.content) {
      return this.content
    }
    this.content = this.parseContent()
    return this.content
  }

  /** Get minimum expected consumption time for this article based the content
   */
  getMinConsumptionTime(): number {
    return this.getContent().reduce(
      (aggr, item) => aggr + item.getMinConsumptionTime(),
      0,
    )
  }

  /** Get maximum expected consumption time for this article based the content
   */
  getMaxConsumptionTime(): number {
    return this.getContent().reduce(
      (aggr, item) => aggr + item.getMaxConsumptionTime(),
      0,
    )
  }

  /** Get time spent since the start of measurement until now
   */
  getTimeOnArticle(): number {
    if (this.startedAt) {
      return Date.now() - this.startedAt.valueOf()
    }
    return 0
  }

  /** Returns percentage of content, that was consumed 0 - 1*/
  getConsumption(): number {
    return 0
  }

  parseContent(): IArticleElement[] {
    return this.contentTypes.flatMap((contentType) =>
      contentType.getAll(this.el),
    )
  }

  getContentByElement(el: HTMLElement): IArticleElement | undefined {
    return this.getContent().find((item) => item.getRootElement() === el)
  }

  getContentMetrics(): Record<string, TypeMetrics> {
    const metrics: Record<string, TypeMetrics> = {}
    for (const type of this.contentTypes) {
      const items = this.getContent().filter((i) => i instanceof type)
      metrics[type.typeName] = {
        consumed: items.filter((i) => i.consumed).length,
        consumptionTimeTotal: items.reduce(
          (aggr, item) => aggr + item.consumptionTimeTotal,
          0,
        ),
        displayed: items.filter((i) => i.displayed).length,
        total: items.length,
      }
    }
    return metrics
  }

  getMetrics(): ArticleMetrics {
    return {
      content: this.getContentMetrics(),
      time: {
        max: toSeconds(this.getMaxConsumptionTime()),
        min: toSeconds(this.getMinConsumptionTime()),
        now: toSeconds(this.getTimeOnArticle()),
      },
    }
  }

  markDisplayed(content: IArticleElement): void {
    content.markDisplayed()
    if (content.displayed) {
      this.trigger('elementsDisplayed', { targets: [content] })
    }
  }

  on(eventName: EventHandlerName, handler: EventHandler): ArticleTracker {
    this.handlers[eventName].handlers.push(handler)
    return this
  }

  trigger(
    eventName: EventHandlerName,
    props: Partial<EventHandlerProps>,
  ): void {
    const targets = [
      ...(this.handlers[eventName]?.targets || []),
      ...(props.targets || []),
    ]
    clearTimeout(this.handlers[eventName].bouncer)
    this.handlers[eventName].targets = targets
    this.handlers[eventName].bouncer = setTimeout(() => {
      this.triggerDebounced(eventName, {
        ...props,
        targets: this.handlers[eventName].targets,
      })
      this.handlers[eventName].targets = []
    }, this.eventBounceTime)
  }

  triggerDebounced(
    eventName: keyof EventHandlers,
    props: Partial<EventHandlerProps>,
  ): void {
    const handlers = this.handlers[eventName].handlers
    if (handlers) {
      for (const handler of handlers) {
        handler({
          ...props,
          articleTracker: this,
        })
      }
    }
  }

  observeIntersections(): void {
    if (this.observer) {
      for (const item of this.getContent()) {
        this.observer.observe(item.getRootElement())
      }
    }
  }

  trackElementConsumption(content: IArticleElement): void {
    content.markConsumable((item: ArticleElement) => {
      if (item.consumed) {
        this.trigger('elementsConsumed', {
          targets: [item],
        })
      }
    })
  }

  stopElementConsumptionTracking(content: IArticleElement): void {
    content.markUnconsumable()
  }

  setupObserver(): void {
    const handleIntersections = (entries: IntersectionObserverEntry[]) => {
      for (const entry of entries) {
        const content = this.getContentByElement(entry.target as HTMLElement)
        if (content) {
          if (entry.isIntersecting) {
            this.markDisplayed(content)
            this.trackElementConsumption(content)
          } else {
            this.stopElementConsumptionTracking(content)
          }
        }
      }
    }
    this.observer = new window.IntersectionObserver(handleIntersections, {
      threshold: this.intersectionThreshold,
    })
  }
}

export function trackArticle(
  articleEl: HTMLElement,
  options: ArticleTrackerOptions,
): ArticleTracker {
  return new ArticleTracker(articleEl, options).track()
}
