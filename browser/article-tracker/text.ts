import { ArticleElement } from './elements.js'

export class ArticleParagraph extends ArticleElement {
  static selector = 'p'
  static typeName = 'paragraph'

  getBaseConsumptionTime(): number {
    const content = this.el.textContent
    if (!content) {
      return 0
    }
    const words = content.split(/\s/).filter(function (txt) {
      return /\S/.test(txt)
    })
    // TODO: Count word length instead of word count
    return Math.ceil(words.length) || 0
  }

  estimateFastestTime(): number {
    return this.getBaseConsumptionTime() * 1000 * 0.2
  }

  estimateSlowestTime(): number {
    return this.getBaseConsumptionTime() * 1000 * 0.3
  }
}
