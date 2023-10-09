# `@optimics/article-tracker`

> Track article content consumption based on DOM events

The ArticleTracker connects to the article container DOM element and tracks its
contents using specific ArticleElement classes and then provides unified
interface ready for reporting.

* [Installation](#user-content-installation)
* [Usage](#user-content-usage)
  * [`ArticleParagraph`](#user-content-articleparagraph)
  * [Custom Element Type](#user-content-custom-element-type)
* [Metrics object](#user-content-metrics-object)
  * [`achieved`](#user-content-achieved)
  * [`consumed`](#user-content-consumed)
  * [`consumableElements`](#user-content-consumableelements)
  * [`consumedElements`](#user-content-consumedelements)
  * [`detected`](#user-content-detected)
  * [`estimates.fastest`](#user-content-estimatesfastest)
  * [`estimates.slowest`](#user-content-estimatesslowest)
  * [`overtime`](#user-content-overtime)
  * [`timeTotal`](#user-content-timeTotal)
* [Events](#user-content-events)
  * [`consumptionAchievement`](#user-content-consumptionachievement)
  * [`consumptionStateChanged`](#user-content-consumptionstatechanged)
  * [`consumptionStarted`](#user-content-consumptionstarted)
  * [`consumptionStopped`](#user-content-consumptionstopped)
  * [`elementsDisplayed`](#user-content-elementsdisplayed)
  * [`elementsConsumed`](#user-content-elementsconsumed)
  * [`overtime`](#user-content-overtime)
* [Testing](#user-content-testing)
  * [Environment variables](#user-content-environment-variables)
  * [Known issues](#user-content-known-issues)

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

### ArticleParagraph

The `ArticleParagraph` is a basic Element Type, that only tracks `<p>` tags
content. It estimates slowest and fastest reader time based on the text
content size.

The default selector is just `'p'`.

```javascript
import { ArticleParagraph } from '@optimics/article-tracker'
```

### Custom Element Type

```typescript
import { ArticleTracker, ArticleParagraph, ArticleElement } from '@optimics/article-tracker'

class ArticleVideo extends ArticleElement {
  static selector = '.my-video-player'
  type = 'videos'

  getMetadata() {
    /* In this example, we assume, that video length is stored inside the DOM
     * element like this. It is up to you, to write your bindings
     * <div class="my-video-player" data-player-length="90" /> */
    return this.el.dataset.player
  }

  estimateFastestTime() {
    /* In this example, we assume, that the element can be considered consumed
     * after 75 % of the video length has been played */
    return this.getMetadata().length * 0.75
  }

  estimateSlowestTime() {
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
  "overtime": 0,
  "timeTotal": 25,
  "content": {
    "paragraph": {
      "achived": 0.05,
      "consumed": false,
      "consumableElements": 4,
      "consumedElements": 0,
      "detected": 5,
      "displayed": 1,
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

### `achieved`

Percentage of how much of the context have been consumed. Rounded to two
decimals.

Available on: `ArticleMetrics`, `ContentTypeMetrics`

### `consumed`

Each Content Type has specific measurement logic, that determines if it is
appropriate to mark it consumed. Let's take `ArticleParagraph` for example.

The `ArticleParagraph` estimates the fastest and the slowest consumption time
based on the amount of words in the paragraph. We measure time the paragraph
spends on screen and when it reached the fastest consumption time, we mark it
`consumed`.

The entire Article is `consumed`, when all of its elements have been
`consumed`.

Available on: `ArticleMetrics`, `ContentTypeMetrics`

### `consumableElements`

How many elements of this type can be consumed? Empty elements of a type are
not counted into the consumption metrics. For example empty paragraph would be
ignored.

Available on: `ContentTypeMetrics`

### `consumedElements`

How many elements of this type have been consumed?

Available on: `ContentTypeMetrics`

### `detected`

How many elements of this type have been detected?

Available on: `ContentTypeMetrics`

### `estimates.fastest`

Calculated estimate of the fastest time required to consume the entire content in seconds.

### `estimates.slowest`

Calculated estimate of the slowest time required to consume the entire content in seconds.

### `overtime`

Extra time user spent consuming this content. This is a natural number
multiplier of the slowest consumer time from TimeEstimates. User, that reached
twice the time of slowest consumer will have value 1. Three times the slowest
consumer will be 2, and so on. Useful for filtering out unuseful analytics
metrics.

Available on: `ArticleMetrics`

#### `timeTotal`

How much time did user spend on the element or article in seconds.

Available on: `ArticleMetrics`, `ContentTypeMetrics`

## Events

Article Tracker automagically triggers events as result of user interaction.
The EventHandler is a function, that returns void and always receives props
objects with at least `articleTracker` instance. All of the events are
debounced, so they do not trigger too often.

To subscribe to ArticleTracker event, use the following subscription pattern:

```
function handler() {
  doSomething()
}
articleTracker.consumptionAchievement.subscribe(handler, options)
```

Supported events are described below. The `options` are optional and may be ommited.

* `once` - when true, the event handler will be triggered only once and then unbound
* `conditions` - [filter the callbacks](#user-content-event-filtering)

### `consumptionAchievement`

Reports progress of consumption achievement. Currently triggered together with
`elementsConsumed` event but the API might change in the future to provide
details with higher resolution.

```javascript
articleTracker.on('consumptionAchievement', ({ articleTracker, achieved }) => {
  console.log(achieved)
})
```

### `consumptionStateChanged`

Fired when the Article Tracker changes state between "no elements being
consumed" and "some elements being consumed". The callback gets passed boolean
property `consuming`. When `consuming` is `true`, it means, that some elements
in the article are being consumed by the user.

* [Debounced event](#user-content-debouncedevent)
* [Squashed event](#user-content-debouncedevent) on `consuming`

```javascript
articleTracker.on('consumptionStarted', ({ consuming }) => {
  console.log(consuming)
})
```

### `consumptionStarted`

Fired when the article tracker changes state from "no elements being consumed" to "some
elements being consumed".

* [Debounced event](#user-content-debouncedevent) by
  [consumptionStateChanged](#user-content-consumptionstatechanged)

```javascript
articleTracker.on('consumptionStarted', ({ articleTracker }) => {
  console.log(articleTracker.getMetrics())
})
```

### `consumptionStopped`

Fired when the article tracker changes state from "some elements being
consumed" to "no elements being consumed".

* [Debounced event](#user-content-debouncedevent) by
  [consumptionStateChanged](#user-content-consumptionstatechanged)

```javascript
articleTracker.on('consumptionStopped', ({ articleTracker }) => {
  console.log(articleTracker.getMetrics())
})
```

### `elementsDisplayed`

This is triggered whenever an element, that has not been displayed on page yet,
has been diplayed in the page viewport. The event receives `targets` prop,
containing reference to all article elements, that have been displayed since
last call.

```javascript
articleTracker.on('elementsDisplayed', ({ articleTracker, targets }) => {
  console.log(articleTracker.getMetrics())
  console.log(targets)
})
```

* [Debounced event](#user-content-debouncedevent)
* [Squashed event](#user-content-squashedevent)

### `elementsConsumed`

This is triggered whenever an element, that has not been consumed yet, has met
conditions to be marked as consumed. This event receives `targets` prop,
containing reference to all article elements, that have been consumed since
last call.

```javascript
articleTracker.on('elementsConsumed', ({ articleTracker, targets }) => {
  console.log(articleTracker.getMetrics())
  console.log(targets)
})
```

* [Debounced event](#user-content-debouncedevent)
* [Squashed event](#user-content-squashedevent)

### `overtime`

```javascript
articleTracker.on('overtime', ({ articleTracker }) => {
  console.log(articleTracker.getMetrics())
})
```

## Event Filtering



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
