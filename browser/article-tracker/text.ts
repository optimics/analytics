import { ArticleElement } from './elements.js'

export class ArticleParagraph extends ArticleElement {
  static selector = 'p'
  static typeName = 'paragraph'

  fastestMultiplier = 0.2
  slowestMultiplier = 0.3

  get consumable(): boolean {
    // Only articles with text content are consumable
    return Boolean(this.textContent)
  }

  get textContent(): string {
    return this.el.textContent || ''
  }

  getBaseConsumptionTime(): number {
    const words = this.textContent.split(/\s/).filter(function (txt) {
      return /\S/.test(txt)
    })
    // TODO: Count word length instead of word count
    return Math.ceil(words.length) || 0
  }

  estimateFastestTime(): number {
    return this.getBaseConsumptionTime() * 1000 * this.fastestMultiplier
  }

  estimateSlowestTime(): number {
    return this.getBaseConsumptionTime() * 1000 * this.slowestMultiplier
  }
}
