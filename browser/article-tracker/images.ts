import { ElementArchetype, VisualArticleElement } from './elements.js'

export class ArticleImage extends VisualArticleElement {
  static selector = 'img, picture'
  archetype = ElementArchetype.image
  type = 'image'

  estimateFastestTime(): number {
    return 1000
  }

  estimateSlowestTime(): number {
    return 5000
  }
}
