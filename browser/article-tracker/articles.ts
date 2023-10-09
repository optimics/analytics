import type { ArticleElement, IArticleElement } from './elements.js'
import type {
  ArticleMetrics,
  ContentTypeMetrics,
  TimeEstimates,
} from './metrics.js'

import { ElementArchetype } from './elements.js'
import { EventController } from './events.js'

function toSeconds(time: number): number {
  return time / 1000
}

export interface ArticleTrackerOptions {
  contentTypes: typeof ArticleElement[]
  eventBounceTime?: number
  uiBounceTime?: number
  intersectionThreshold?: number
}

export interface MetricsEvent {
  metrics: ArticleMetrics
}

export interface OvertimeProps extends MetricsEvent {
  overtime: number
}

export interface ConsumptionStateProps {
  consuming: boolean
}

export interface ConsumptionAchievementProps extends MetricsEvent {
  achieved: number
}

export interface TypeConsumptionAchievementProps extends ConsumptionAchievementProps {
  archetype: string
  archetypeAchieved: number
  type: string
}

export interface TargetEventProps {
  targets: IArticleElement[]
}

export interface EventHandlers {
  consumptionAchievement: EventController<ConsumptionAchievementProps>
  consumptionStateChanged: EventController<ConsumptionStateProps>
  consumptionStarted: EventController<MetricsEvent>
  consumptionStopped: EventController<MetricsEvent>
  elementsAdded: EventController<TargetEventProps>
  elementsConsumed: EventController<TargetEventProps>
  elementsDisplayed: EventController<TargetEventProps>
  overtime: EventController<OvertimeProps>
  typeConsumptionAchievement: EventController<TypeConsumptionAchievementProps>
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
    this.observeInternalEvents()
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
    return val ? parseFloat(Number(val).toFixed(2)) : 0
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
      const items = this.getContent().filter((i) => i?.constructor === type)
      const base = items[0]
      if (base) {
        const consumable = items.filter((i) => i.consumable)
        metrics[base.type] = {
          achieved: this.formatAchievedPercents(
            consumable.length > 0
              ? sum(consumable, (item) => item.achieved) / consumable.length
              : 0,
          ),
          consumed:
            consumable.length > 0
              ? consumable.every((item) => item.consumed)
              : false,
          consuming: consumable.some((i) => i.consuming),
          consumableElements: consumable.length,
          consumedElements: items.filter((i) => i.consumed).length,
          detected: items.length,
          displayed: items.filter((i) => i.displayed).length,
          estimates: this.getTimeEstimates(items),
          timeTotal: toSeconds(sum(items, (item) => item.consumptionTimeTotal)),
          wordCount: sum(items, item => item.wordCount || 0),
        }
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
    const consumed = cv.length > 0 && cv.every((c) => c.consumed)
    const timeTotal = this.getTimeOnArticle()
    const slowest = this.estimateSlowestTime()
    const wordCount = sum(cv, item => item.wordCount || 0)
    return {
      achieved: this.getAchivedConsumption(),
      consumed,
      consuming: this.isConsuming(),
      content,
      overtime: this.getOvertimeQuotient(),
      timeTotal: toSeconds(timeTotal),
      wordCount,
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

  observeInternalEvents(): void {
    this.events.consumptionStateChanged.subscribe(({ consuming }) => {
      const metrics = this.getMetrics()
      if (consuming) {
        this.events.consumptionStarted.now({ metrics })
      } else {
        this.events.consumptionStopped.now({ metrics })
      }
    })
  }

  isConsuming(): boolean {
    return this.getContent().some((i) => i.consuming)
  }

  bindContentListeners(target: IArticleElement) {
    target.events.consumed.subscribe(() => {
      this.events.elementsConsumed.debounce({
        targets: [target],
      })
      this.reportAchievement(target)
    })
    target.events.consumptionStateChanged.subscribe(() => {
      this.events.consumptionStateChanged.debounce({
        consuming: this.isConsuming(),
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
        bounceTime: options.uiBounceTime || 200,
        cacheOriginalProps: true,
        filter: (props, original) => props.consuming === original?.consuming,
      }),
      consumptionStarted: new EventController<MetricsEvent>(handlerOptions),
      consumptionStopped: new EventController<MetricsEvent>(handlerOptions),
      elementsAdded: new EventController<TargetEventProps>(
        targetHandlerOptions,
      ),
      elementsDisplayed: new EventController<TargetEventProps>(
        targetHandlerOptions,
      ),
      elementsConsumed: new EventController<TargetEventProps>(
        targetHandlerOptions,
      ),
      overtime: new EventController<OvertimeProps>(handlerOptions),
      typeConsumptionAchievement: new EventController<TypeConsumptionAchievementProps>(handlerOptions),
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

  getArchetypeAchievement(archetype: ElementArchetype): number {
    const consumable = this.getContent().filter(i => i.consumable && i.archetype === archetype)
    return this.formatAchievedPercents(
      consumable.length > 0
        ? sum(consumable, (item) => item.achieved) / consumable.length
        : 0,
    )
  }

  reportAchievement(target?: IArticleElement): void {
    const metrics = this.getMetrics()
    // Avoid reporting the same achievement twice
    if (metrics.achieved > this.achievedMax) {
      this.achievedMax = metrics.achieved
      if (target) {
        this.events.typeConsumptionAchievement.debounce({
          achieved: metrics.achieved,
          archetype: target.archetype,
          archetypeAchieved: this.getArchetypeAchievement(target.archetype),
          type: target.type,
          metrics,
        })
      }
      this.events.consumptionAchievement.debounce({
        achieved: metrics.achieved,
        metrics
      })
    }
  }

  watchOvertime(): void {
    clearTimeout(this.overtimeTimer)
    this.overtimeTimer = setTimeout(() => {
      const overtime = this.getOvertimeQuotient()
      if (overtime > 0) {
        this.events.overtime.now({
          overtime,
          metrics: this.getMetrics()
        })
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
