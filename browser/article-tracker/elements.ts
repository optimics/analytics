import { EventController } from './events.js'

interface ElementEventControllers {
  consumed: EventController<void>
  consumptionStateChanged: EventController<void>
}

export enum ElementArchetype {
  audio = 'audio',
  image = 'image',
  text = 'text',
  video = 'video',
}

export interface IArticleElement {
  achieved: number
  consumable: boolean
  consumed: boolean
  consuming: boolean
  consumptionStartedAt?: number
  consumptionTimeTotal: number
  displayed: boolean
  estimateFastestTime(): number
  estimateSlowestTime(): number
  events: ElementEventControllers
  getRootElement(): HTMLElement
  markDisplayed(): void
  markInViewport(): void
  markNotInViewport(): void
  wordCount?: number
}

export abstract class ArticleElement implements IArticleElement {
  static selector: string
  static typeName: string
  static archetype: ElementArchetype

  consuming = false
  consumptionStartedAt?: number
  consumptionTimeTracked = 0
  inViewport = false
  displayed = false
  el: HTMLElement
  events: ElementEventControllers

  constructor(el: HTMLElement) {
    this.el = el
    this.events = this.createEventControllers()
  }

  static getAll(articleEl: HTMLElement): HTMLElement[] {
    return Array.from(
      articleEl.querySelectorAll(this.selector),
    ) as HTMLElement[]
  }

  /** Get the absolute minimum expected time, the user could take, to consume
   * the entire content of this element in miliseconds */
  abstract estimateFastestTime(): number

  /** Get the absolute maximum expected time, the user could take, to consume
   * the entire content of this element in miliseconds */
  abstract estimateSlowestTime(): number

  abstract get consumptionTimeTotal(): number

  get consumable(): boolean {
    // ArticleElement is consumable by default
    return true
  }

  get consumed(): boolean {
    if (this.estimateFastestTime() <= 0) {
      return false
    }
    return this.consumptionTimeTotal >= this.estimateFastestTime()
  }

  get achieved(): number {
    const fastest = this.estimateFastestTime()
    if (fastest === 0) {
      return 0
    }
    return Math.min(1, this.consumptionTimeTotal / fastest)
  }

  createEventControllers(): ElementEventControllers {
    const props = {}
    return {
      consumed: new EventController<void>(props),
      consumptionStateChanged: new EventController<void>(props),
    }
  }

  getRootElement(): HTMLElement {
    return this.el
  }

  markDisplayed(): void {
    // Ignore zero sized elements
    if (this.el.clientHeight > 0 && this.el.clientWidth > 0) {
      this.displayed = true
    }
  }

  markInViewport(): void {
    this.markDisplayed()
    this.inViewport = true
  }

  markNotInViewport(): void {
    this.inViewport = false
  }

  getLastConsumptionTime(): number {
    if (this.consumptionStartedAt) {
      return Date.now() - this.consumptionStartedAt
    }
    return 0
  }

  updateConsumptionMetrics(): void {
    this.consumptionTimeTracked += this.getLastConsumptionTime()
    this.consumptionStartedAt = undefined
  }

  recordConsumptionTime(): void {
    if (this.consumable) {
      this.updateConsumptionMetrics()
      this.consumptionStartedAt = Date.now()
      if (!this.consuming) {
        this.consuming = true
        this.events.consumptionStateChanged.debounce()
      }
    }
  }

  stopConsumption(): void {
    if (this.consumable) {
      this.updateConsumptionMetrics()
      if (this.consuming) {
        this.consuming = false
        this.events.consumptionStateChanged.debounce()
      }
    }
  }
}

export abstract class VisualArticleElement extends ArticleElement {
  consumptionTimer?: ReturnType<typeof setTimeout>

  get consumptionTimeTotal(): number {
    return this.consumptionTimeTracked + this.getLastConsumptionTime()
  }

  markInViewport(): void {
    super.markInViewport()
    this.recordConsumptionTime()
  }

  markNotInViewport(): void {
    super.markNotInViewport()
    this.stopConsumption()
  }

  updateConsumptionMetrics(): void {
    if (this.consumptionTimer) {
      clearTimeout(this.consumptionTimer)
      this.consumptionTimer = undefined
    }
    super.updateConsumptionMetrics()
  }

  recordConsumptionTime(): void {
    super.recordConsumptionTime()
    if (this.consumable && !this.consumed) {
      this.consumptionTimer = setTimeout(() => {
        this.events.consumed.now()
      }, this.estimateFastestTime())
    }
  }
}
