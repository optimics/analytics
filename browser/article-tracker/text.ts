import { ElementArchetype, VisualArticleElement } from './elements.js'

export class ArticleParagraph extends VisualArticleElement {
  static selector = 'p'

  archetype = ElementArchetype.text
  fastestMultiplier = 0.2
  slowestMultiplier = 0.3
  type = 'paragraph'

  get consumable(): boolean {
    // Only articles with text content are consumable
    return Boolean(this.textContent)
  }

  get textContent(): string {
    return this.el.textContent?.trim() || ''
  }

  get wordCount(): number {
    const words = this.textContent.split(/\s/).filter(function (txt) {
      return /\S/.test(txt)
    })
    return Math.ceil(words.length) || 0
  }

  getBaseConsumptionTime(): number {
    // TODO: Count word length instead of word count
    return this.wordCount
  }

  estimateFastestTime(): number {
    return this.getBaseConsumptionTime() * 1000 * this.fastestMultiplier
  }

  estimateSlowestTime(): number {
    return this.getBaseConsumptionTime() * 1000 * this.slowestMultiplier
  }
}

export class ArticleHeading extends ArticleParagraph {
  static selector = 'h1,h2,h3,h4,h5,h6'
  archetype = ElementArchetype.text
  type = 'heading'
}
