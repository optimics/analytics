import type { ArticleElement, IArticleElement } from './elements.js'
import type {
  ArticleMetrics,
  ContentTypeMetrics,
  TimeEstimates,
} from './metrics.js'

import { EventController } from './events.js'

function toSeconds(time: number): number {
  return time / 1000
}

export interface ArticleTrackerOptions {
  contentTypes: typeof ArticleElement[]
  eventBounceTime?: number
  intersectionThreshold?: number
}

export interface ConsumptionAchievementProps {
  achieved: number
}

export interface ConsumptionStateProps {
  consuming: boolean
}

export interface TargetEventProps {
  targets: IArticleElement[]
}

export interface OvertimeEventProps {
  overtime: number
}

export interface EventHandlers {
  consumptionAchievement: EventController<ConsumptionAchievementProps>
  consumptionStateChanged: EventController<ConsumptionStateProps>
  elementsAdded: EventController<TargetEventProps>
  elementsConsumed: EventController<TargetEventProps>
  elementsDisplayed: EventController<TargetEventProps>
  overtime: EventController<OvertimeEventProps>
}

export type EventHandlerName = keyof EventHandlers

function sortByDocumentPosition(
  a: IArticleElement,
  b: IArticleElement,
): number {
  return a.getRootElement().compareDocumentPosition(b.getRootElement())
}

function sum<T>(items: T[], getter: (item: T) => number): number {
  return items.reduce((aggr, item) => aggr + getter(item), 0)
}

type Timer = ReturnType<typeof setTimeout>

export class ArticleTracker {
  achievedMax = 0
  achievementTimer?: Timer
  content?: IArticleElement[]
  contentTypes: typeof ArticleElement[]
  el: HTMLElement
  events: EventHandlers
  intersectionThreshold?: number
  intersectionObserver: IntersectionObserver
  mutationObserver: MutationObserver
  overtimeTimer?: Timer
  startedAt?: Date

  constructor(el: HTMLElement, options: ArticleTrackerOptions) {
    this.el = el
    this.contentTypes = options.contentTypes
    this.intersectionThreshold = options.intersectionThreshold || 0.75
    this.events = this.createEventControllers(options)
    this.mutationObserver = this.createMutationObserver()
    this.intersectionObserver = this.createIntersectionObserver()
  }

  track(): ArticleTracker {
    this.startedAt = new Date()
    this.observeIntersections()
    this.observeMutations()
    this.watchOvertime()
    return this
  }

  untrack(): ArticleTracker {
    this.intersectionObserver.disconnect()
    this.mutationObserver.disconnect()
    clearTimeout(this.overtimeTimer)
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
  estimateFastestTime(): number {
    return sum(this.getContent(), (item) => item.estimateFastestTime())
  }

  /** Get maximum expected consumption time for this article based the content
   */
  estimateSlowestTime(): number {
    return sum(this.getContent(), (item) => item.estimateSlowestTime())
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

  parseContent(onlyAdditions = false): IArticleElement[] {
    const src = this.contentTypes.flatMap((contentType) => {
      let els = contentType.getAll(this.el)
      if (onlyAdditions) {
        els = els.filter((el) => {
          if (this.content) {
            return this.content.every((item) => item.getRootElement() !== el)
          }
          return true
        })
      }
      // @ts-ignore
      return els.map((el) => new contentType(el))
    })
    return src.sort(sortByDocumentPosition)
  }

  getContentByElement(el: HTMLElement): IArticleElement | undefined {
    return this.getContent().find((item) => item.getRootElement() === el)
  }

  formatAchievedPercents(val: number): number {
    return parseFloat(Number(val).toFixed(2))
  }

  getTimeEstimates(items: IArticleElement[]): TimeEstimates {
    return {
      fastest: toSeconds(sum(items, (item) => item.estimateFastestTime())),
      slowest: toSeconds(sum(items, (item) => item.estimateSlowestTime())),
    }
  }

  getContentMetrics(): Record<string, ContentTypeMetrics> {
    const metrics: Record<string, ContentTypeMetrics> = {}
    for (const type of this.contentTypes) {
      const items = this.getContent().filter((i) => i instanceof type)
      const consumable = items.filter((i) => i.consumable)
      metrics[type.typeName] = {
        achieved: this.formatAchievedPercents(
          consumable.length > 0
            ? sum(consumable, (item) => item.achieved) / consumable.length
            : 0,
        ),
        consumed:
          consumable.length > 0
            ? consumable.every((item) => item.consumed)
            : false,
        consumableElements: consumable.length,
        consumedElements: items.filter((i) => i.consumed).length,
        detected: items.length,
        displayed: items.filter((i) => i.displayed).length,
        estimates: this.getTimeEstimates(items),
        timeTotal: sum(items, (item) => item.consumptionTimeTotal),
      }
    }
    return metrics
  }

  getAchivedConsumption(): number {
    const content = this.getContentMetrics()
    const cv = Object.values(content)
    return this.formatAchievedPercents(sum(cv, (c) => c.achieved) / cv.length)
  }

  getOvertimeQuotient(): number {
    const slowest = this.estimateSlowestTime()
    if (slowest === 0) {
      return 0
    }
    const timeTotal = this.getTimeOnArticle()
    return Math.max(0, Math.floor(timeTotal / slowest) - 1)
  }

  getMetrics(): ArticleMetrics {
    const content = this.getContentMetrics()
    const cv = Object.values(content)
    const consumed = cv.every((c) => c.consumed)
    const timeTotal = this.getTimeOnArticle()
    const slowest = this.estimateSlowestTime()
    return {
      achieved: this.getAchivedConsumption(),
      consumed,
      content,
      overtime: this.getOvertimeQuotient(),
      timeTotal: toSeconds(timeTotal),
      estimates: {
        fastest: toSeconds(this.estimateFastestTime()),
        slowest: toSeconds(slowest),
      },
    }
  }

  markInViewport(content: IArticleElement): void {
    content.markInViewport()
    if (content.displayed) {
      this.events.elementsDisplayed.debounce({
        targets: [content],
      })
    }
  }

  markNotInViewport(content: IArticleElement): void {
    content.markNotInViewport()
  }

  observeIntersections(): void {
    for (const item of this.getContent()) {
      this.bindContentListeners(item)
      this.intersectionObserver.observe(item.getRootElement())
    }
  }

  observeMutations(): void {
    this.mutationObserver.observe(this.el, {
      childList: true,
    })
  }

  isConsuming(): boolean {
    return this.getContent().some(i => i.consuming)
  }

  bindContentListeners(target: IArticleElement) {
    target.events.consumed.subscribe(() => {
      this.events.elementsConsumed.debounce({
        targets: [target],
      })
      this.reportAchievement()
    })
    target.events.consumptionStateChanged.subscribe(() => {
      this.events.consumptionStateChanged.debounce({
        consuming: this.isConsuming()
      })
    })
  }

  integrateNewContent(targets: IArticleElement[]): void {
    if (this.content && targets.length !== 0) {
      this.content = [...this.content, ...targets].sort(sortByDocumentPosition)
      for (const item of targets) {
        this.bindContentListeners(item)
        this.intersectionObserver.observe(item.getRootElement())
      }
      this.events.elementsAdded.debounce({ targets })
    }
  }

  stopElementConsumptionTracking(content: IArticleElement): void {
    content.markNotInViewport()
  }

  createEventControllers(options: ArticleTrackerOptions): EventHandlers {
    const handlerOptions = {
      bounceTime: options.eventBounceTime || 60,
    }
    const targetHandlerOptions = {
      ...handlerOptions,
      mergeProps: ['targets'] as (keyof TargetEventProps)[],
    }
    return {
      consumptionAchievement: new EventController<ConsumptionAchievementProps>(
        handlerOptions,
      ),
      consumptionStateChanged: new EventController<ConsumptionStateProps>({
        ...handlerOptions,
        mergeProps: ['consuming']
      }),
      elementsAdded: new EventController<TargetEventProps>(
        targetHandlerOptions,
      ),
      elementsDisplayed: new EventController<TargetEventProps>(
        targetHandlerOptions,
      ),
      elementsConsumed: new EventController<TargetEventProps>(
        targetHandlerOptions,
      ),
      overtime: new EventController<OvertimeEventProps>(handlerOptions),
    }
  }

  createMutationObserver(): MutationObserver {
    return new window.MutationObserver(() => {
      this.integrateNewContent(this.parseContent(true))
    })
  }

  createIntersectionObserver(): IntersectionObserver {
    const handleIntersections = (entries: IntersectionObserverEntry[]) => {
      for (const entry of entries) {
        const content = this.getContentByElement(entry.target as HTMLElement)
        if (content) {
          if (entry.isIntersecting) {
            this.markInViewport(content)
          } else {
            this.markNotInViewport(content)
          }
        }
      }
    }
    return new window.IntersectionObserver(handleIntersections, {
      threshold: this.intersectionThreshold,
    })
  }

  reportAchievement(): void {
    const achieved = this.getAchivedConsumption()
    // Avoid reporting the same achievement twice
    if (achieved > this.achievedMax) {
      this.achievedMax = achieved
      this.events.consumptionAchievement.debounce({
        achieved,
      })
    }
  }

  watchOvertime(): void {
    clearTimeout(this.overtimeTimer)
    this.overtimeTimer = setTimeout(() => {
      const overtime = this.getOvertimeQuotient()
      if (overtime > 0) {
        this.events.overtime.now({ overtime })
      }
      this.watchOvertime()
    }, this.estimateSlowestTime())
  }
}

export function trackArticle(
  articleEl: HTMLElement,
  options: ArticleTrackerOptions,
): ArticleTracker {
  return new ArticleTracker(articleEl, options).track()
}
