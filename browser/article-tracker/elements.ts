export interface IArticleElement {
  achieved: number
  consumable: boolean
  consumed: boolean
  consumptionStartedAt?: number
  consumptionTimeTotal: number
  displayed: boolean
  estimateFastestTime(): number
  estimateSlowestTime(): number
  getRootElement(): HTMLElement
  markDisplayed(): void
  markInViewport(onConsumed: ConsumedHandler): void
  markNotInViewport(): void
  wordCount?: number
}

export type ConsumedHandler = (item: ArticleElement) => void

export abstract class ArticleElement implements IArticleElement {
  static selector: string
  static typeName: string

  consumptionStartedAt?: number
  consumptionTimeTracked = 0
  consumptionTimer?: ReturnType<typeof setTimeout>
  inViewport = false
  displayed = false
  el: HTMLElement

  constructor(el: HTMLElement) {
    this.el = el
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

  get consumptionTimeTotal(): number {
    return this.consumptionTimeTracked + this.getLastConsumptionTime()
  }

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

  getRootElement(): HTMLElement {
    return this.el
  }

  markDisplayed(): void {
    // Ignore zero sized elements
    if (this.el.clientHeight > 0 && this.el.clientWidth > 0) {
      this.displayed = true
    }
  }

  markInViewport(onConsumed?: ConsumedHandler): void {
    this.inViewport = true
    this.recordConsumptionTime(onConsumed)
  }

  markNotInViewport(): void {
    this.inViewport = false
    this.stopConsumption()
  }

  getLastConsumptionTime(): number {
    if (this.consumptionStartedAt) {
      return Date.now() - this.consumptionStartedAt
    }
    return 0
  }

  updateConsumptionMetrics(): void {
    if (this.consumptionTimer) {
      clearTimeout(this.consumptionTimer)
    }
    this.consumptionTimeTracked += this.getLastConsumptionTime()
    this.consumptionStartedAt = undefined
  }

  recordConsumptionTime(onConsumed?: ConsumedHandler): void {
    if (this.consumable) {
      this.updateConsumptionMetrics()
      this.consumptionStartedAt = Date.now()
      if (onConsumed && !this.consumed) {
        this.consumptionTimer = setTimeout(() => {
          onConsumed(this)
        }, this.estimateFastestTime())
      }
    }
  }

  stopConsumption(): void {
    if (this.consumable) {
      this.updateConsumptionMetrics()
    }
  }
}
