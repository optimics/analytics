export interface IArticleElement {
  consumable: boolean
  consumed: boolean
  consumptionStartedAt?: number
  consumptionTimeTotal: number
  displayed: boolean
  getMaxConsumptionTime(): number
  getMinConsumptionTime(): number
  getRootElement(): HTMLElement
  markDisplayed(): void
  markConsumable(onConsumed: ConsumedHandler): void
  markUnconsumable(): void
}

export type ConsumedHandler = (item: ArticleElement) => void

export abstract class ArticleElement implements IArticleElement {
  static selector: string
  static typeName: string

  consumable = false
  consumptionStartedAt?: number
  consumptionTimeTracked = 0
  consumptionTimer?: ReturnType<typeof setTimeout>
  displayed = false
  el: HTMLElement

  constructor(el: HTMLElement) {
    this.el = el
  }

  static getAll(articleEl: HTMLElement): ArticleElement[] {
    return Array.from(articleEl.querySelectorAll(this.selector)).map((el) => {
      // @ts-ignore
      return new this(el as HTMLElement)
    })
  }

  /** Get the absolute minimum expected time, the user could take, to consume
   * the entire content of this element in miliseconds */
  abstract getMinConsumptionTime(): number

  /** Get the absolute maximum expected time, the user could take, to consume
   * the entire content of this element in miliseconds */
  abstract getMaxConsumptionTime(): number

  get consumptionTimeTotal(): number {
    return this.consumptionTimeTracked + this.getLastConsumptionTime()
  }

  get consumed(): boolean {
    if (this.getMinConsumptionTime() <= 0) {
      return false
    }
    return this.consumptionTimeTotal >= this.getMinConsumptionTime()
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

  markConsumable(onConsumed?: ConsumedHandler): void {
    this.consumable = true
    this.recordConsumptionTime(onConsumed)
  }

  markUnconsumable(): void {
    this.consumable = false
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
    this.updateConsumptionMetrics()
    this.consumptionStartedAt = Date.now()
    if (onConsumed && !this.consumed) {
      this.consumptionTimer = setTimeout(() => {
        onConsumed(this)
      }, this.getMinConsumptionTime())
    }
  }

  stopConsumption(): void {
    this.updateConsumptionMetrics()
  }
}
