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

## Testing

The test suite is a mixture of two environments. JSDOM is used for interface
testing and Puppeteer is used for the integration testing to leverage a real
Chrome environment. Please note, that Puppeteer tests are not always stable,
take long time to run and may sometimes fail due to timeouts and other various
instabilities. Rerunning tests on sporadic failures is recommended.

The test suite is included in the repository [main test suite](../../README.md#testing).

### Environment variables

You can use these variables to develop and debug Puppeteer tests.

#### `TEST_GRAPHIC`

Setting `TEST_GRAPHIC=true` will disable test headless mode and will open
actual Chrome window, so you can see the literal behaviour with your own eyes.
This is useful when you want to understand what is happening inside the
browser.

The browser window will partially take control of your operating system window
focus, so you might not be able to fully use your computer during the test.
Make sure you select specific test you want to run.

#### `TEST_DEBUG`

Setting `TEST_DEBUG=true` will keep the browser window open for 60 minutes
after the test has ended. It implies `TEST_GRAPHIC`. It is useful, when you
want to inspect the Browser Developer Tools

### Known issues

The test suite starts subprocesses, that occasionally fail to exit on
unexpected test exit. Namingly, this is webpack-dev-server and Chrome browser.
This will consume resources of your operating system, eventually rendering it
unusable. If you experience issues, like heavy swapping and low memory,
terminate them manually.

#### Unsafe workaround

This will terminate all processes named chrome and node. Do not use it unless
you are sure what you are doing.

```shell
killall chrome
killall node
```
