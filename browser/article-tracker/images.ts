import { ArticleElement } from './elements.js'

export class ArticleImage extends ArticleElement {
  static selector = 'img, picture'

  getMinConsumptionTime(): number {
    return 1000
  }

  getMaxConsumptionTime(): number {
    return 5000
  }
}
