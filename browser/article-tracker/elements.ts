import { EventController } from './events.js'

interface ElementEventProps {
  element: ArticleElement
}

interface ElementEventControllers {
  consumed: EventController<ElementEventProps>
}

export interface IArticleElement {
  achieved: number
  consumable: boolean
  consumed: boolean
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
}

export abstract class ArticleElement implements IArticleElement {
  static selector: string
  static typeName: string

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
    return {
      consumed: new EventController<ElementEventProps>({})
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
    this.recordConsumptionTime()
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
    }
  }

  stopConsumption(): void {
    if (this.consumable) {
      this.updateConsumptionMetrics()
    }
  }
}

export abstract class VisualArticleElement extends ArticleElement {
  consumptionTimer?: ReturnType<typeof setTimeout>

  get consumptionTimeTotal(): number {
    return this.consumptionTimeTracked + this.getLastConsumptionTime()
  }

  markNotInViewport(): void {
    super.markNotInViewport()
    this.stopConsumption()
  }

  updateConsumptionMetrics(): void {
    if (this.consumptionTimer) {
      clearTimeout(this.consumptionTimer)
    }
    super.updateConsumptionMetrics()
  }

  recordConsumptionTime(): void {
    super.recordConsumptionTime()
    if (this.consumable && !this.consumed) {
      this.consumptionTimer = setTimeout(() => {
        this.events.consumed.now({ element: this })
      }, this.estimateFastestTime())
    }
  }
}
