# `@optimics/article-tracker`

> Track article content consumption based on DOM events

The ArticleTracker connects to the article container DOM element and tracks its
contents using specific ArticleElement classes and then provides unified
interface ready for reporting.

## Installation

```
npm install @optimics/article-tracker
```

## Usage

The basic usage could look like this, if you need to only track article
paragraphs.

```typescript
import { ArticleTracker, ArticleParagraph } from '@optimics/article-tracker'

const articleElement = document.querySelector('#article')
const articleTracker = new ArticleTracker(articleElement, {
  contentTypes: [
    ArticleParagraph
  ]
})

articleElement.on('elementsDisplayed', () => {
  // Connect to your tracking scripts
  console.log(articleTracker.getMetrics())
})
articleElement.on('elementsConsumed', () => {
  // Connect to your tracking scripts
  console.log(articleTracker.getMetrics())
})
articleElement.track()
```

### Custom Element Type

```typescript
import { ArticleTracker, ArticleParagraph, ArticleElement } from '@optimics/article-tracker'

class ArticleVideo extends ArticleElement {
  static selector = '.my-video-player'
  static typeName = 'videos'

  getMetadata() {
    /* In this example, we assume, that video length is stored inside the DOM
     * element like this. It is up to you, to write your bindings
     * <div class="my-video-player" data-player-length="90" /> */
    return this.el.dataset.player
  }

  getMinConsumptionTime() {
    /* In this example, we assume, that the element can be considered consumed
     * after 75 % of the video length has been played */
    return this.getMetadata().length * 0.75
  }

  getMaxConsumptionTime() {
    return this.getMetadata().length
  }
}

const articleElement = document.querySelector('#article')
const articleTracker = new ArticleTracker(articleElement, {
  contentTypes: [
    ArticleParagraph,
    ArticleVideo,
  ]
})
```


