import { ElementArchetype, VisualArticleElement } from './elements.js'

export class ArticleImage extends VisualArticleElement {
  static selector = 'img, picture'
  static typeName = 'image'
  static archetype = ElementArchetype.image

  estimateFastestTime(): number {
    return 1000
  }

  estimateSlowestTime(): number {
    return 5000
  }
}
