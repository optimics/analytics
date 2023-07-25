import { ArticleElement } from './elements.js'

export class ArticleImage extends ArticleElement {
  static selector = 'img, picture'

  estimateFastestTime(): number {
    return 1000
  }

  estimateSlowestTime(): number {
    return 5000
  }
}
