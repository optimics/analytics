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

## Metrics object

The `ArticleTracker` metrics are split by the Content Types, but also includes
aggregated values. When you call `articleTracker.getMetrics`, you might get
something like this:

```
{
  "achieved": 0.05,
  "consumed": false,
  "timeExtra": 0,
  "timeTotal": 25,
  "content": {
    "paragraph": {
      "achived": 0.05,
      "consumed": false,
      "consumedElements": 0,
      "detected": 5,
      "displayed": 1,
      "timeExtra": 0,
      "timeTotal": 25,
      "estimates": {
        "fastest": 36.4,
        "slowest": 64.5
      }
    }
  },
  "estimates": {
    "fastest": 36.4,
    "slowest": 64.5
  }
}
```

The values in the root of the metrics object is aggregated from the
individual elements.

### Metrics definitions

#### `achieved`

Percentage of how much of the context have been consumed. Rounded to two
decimals.

Available on: `ArticleMetrics`, `ContentTypeMetrics`

#### `consumed`

Each Content Type has specific measurement logic, that determines if it is
appropriate to mark it consumed. Let's take `ArticleParagraph` for example.

The `ArticleParagraph` estimates the fastest and the slowest consumption time
based on the amount of words in the paragraph. We measure time the paragraph
spends on screen and when it reached the fastest consumption time, we mark it
`consumed`.

The entire Article is `consumed`, when all of its elements have been
`consumed`.

Available on: `ArticleMetrics`, `ContentTypeMetrics`

#### `consumedElements`

How many elements of this type have been consumed?

Available on: `ContentTypeMetrics`

#### `detected`

How many elements of this type have been detected?

Available on: `ContentTypeMetrics`

#### `estimates.fastest`

Calculated estimate of the fastest time required to consume the entire content in seconds.

#### `estimates.slowest`

Calculated estimate of the slowest time required to consume the entire content in seconds.

#### `timeExtra`

Extra time user spent consuming this content. This is a natural number
multiplier of the slowest consumer time from TimeEstimates. User, that reached
twice the time of slowest consumer will have value 1. Three times the slowest
consumer will be 2, and so on. Useful for filtering out unuseful analytics
metrics.

Available on: `ArticleMetrics`, `ContentTypeMetrics`

#### `timeTotal`

How much time did user spend on the element or article in seconds.

Available on: `ArticleMetrics`, `ContentTypeMetrics`



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
