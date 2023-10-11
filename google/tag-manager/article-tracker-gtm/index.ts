import type { EventHandlerFilter, EventHandlerName, EventHandlerOptions } from '@optimics/article-tracker'

import {
  ArticleElement,
  ArticleHeading,
  ArticleImage,
  ArticleParagraph,
  ArticleTracker,
  EventHandlerOperator,
  VisualArticleElement,
} from '@optimics/article-tracker'

type Props = Record<string, string|number|boolean|null|undefined>

// rome-ignore lint/suspicious/noExplicitAny: Data Layer is too wild to type
type DataLayer = any[]

interface Api {
  trackArticle: (options: TrackArticleOptions) => void
  tracker?: ArticleTracker
}

declare global {
  interface Window {
    dataLayer: DataLayer
    articleTracker: Api
  }
}

interface EventConnectorSerialized {
  achievedAtLeast?: number
  contentArchetype?: string
  contentType?: string
  contentTypeAchievedAtLeast?: number
  event: EventHandlerName
  gtmEvent: string
  once?: boolean
  props?: string
}

interface EventConenctor {
  event: EventHandlerName
  gtmEvent: string
  options?: EventHandlerOptions
  props?: Props
}

interface ContentTypeSerialized {
  path: string
}

interface TrackArticleOptions {
  connectedEvents: EventConnectorSerialized[]
  extraProps: string
  resolveContentTypes: ContentTypeSerialized[]
  selector: string
  intersectionThreshold?: number
  trackDefaultContentTypes?: boolean
}

function parseEventConnector(connector: EventConnectorSerialized): EventConenctor {
  const props = connector.props ? JSON.parse(connector.props) as Props : undefined
  const filter = {} as EventHandlerFilter
  if (connector.achievedAtLeast) {
    filter['$.achieved'] = {
      operator: EventHandlerOperator.gte,
      value: connector.achievedAtLeast,
    }
  }
  const { contentArchetype, contentType } = connector
  const contentTypeAchievedAtLeast = parsePercentage(connector.contentTypeAchievedAtLeast)
  if (contentArchetype) {
    filter['$.archetype'] = {
      operator: EventHandlerOperator.eq,
      value: contentArchetype
    }
    if (contentTypeAchievedAtLeast && !contentType) {
      filter['$.archetypeAchieved'] = {
        operator: EventHandlerOperator.gte,
        value: contentTypeAchievedAtLeast,
      }
    }
  }
  if (contentType) {
    filter['$.type'] = {
      operator: EventHandlerOperator.eq,
      value: contentType
    }
    if (contentTypeAchievedAtLeast) {
      filter[`$.metrics.${contentType}.achieved`] = {
        operator: EventHandlerOperator.gte,
        value: contentTypeAchievedAtLeast,
      }
    }
  }
  const conditions = Object.keys(filter).length >= 1 ? [filter] : undefined
  return {
    event: connector.event,
    gtmEvent: connector.gtmEvent,
    props,
    options: {
      conditions,
      once: connector.once,
    },
  }
}

// rome-ignore lint/suspicious/noExplicitAny: Let's browse anything
function resolvePath<T>(src: any, path: string): T {
  const split = path.split('.')
  if (split.length > 1) {
    const ref = split.shift() as string
    return resolvePath<T>(src[ref], split.join('.'))
  }
  return src[path]
}

const defaultContentTypes: Record<string, typeof ArticleElement> = {
  ArticleHeading,
  ArticleParagraph,
}

function resolveContentType(type: ContentTypeSerialized): typeof ArticleElement {
  if (type.path in defaultContentTypes) {
    return defaultContentTypes[type.path]
  }
  const src = resolvePath(window, type.path)
  if (!src) {
    throw new Error(`Failed to resolve ContentType path "${type}"`)
  }
  if (src instanceof Function) {
    if (src.prototype instanceof ArticleElement) {
      return src as typeof ArticleElement
    }
    return src({
      ArticleElement,
      ArticleImage,
      ArticleParagraph,
      VisualArticleElement,
    })
  }
  throw new Error(`Resolved ContentType "${type}", but could not determine it's type`)
}

function parsePercentage(value?: string|number): number|undefined {
  if (typeof value === 'number') {
    return value
  }
  if (typeof value === 'string') {
    return parseFloat(value)
  }
  return undefined
}

interface ExtraProps {
  [key: string]: string | number | null | ExtraProps | ExtraProps[]
}

function parseExtraProps(props: string): ExtraProps {
  return JSON.parse(props)
}

function trackArticle(options: TrackArticleOptions): void {
  const el = document.querySelector(options.selector)
  if (el) {
    const resolveContentTypes = options.resolveContentTypes || []
    const contentTypePaths = options.trackDefaultContentTypes ? [
      ...Object.keys(defaultContentTypes).map(path => ({ path })),
      ...resolveContentTypes
    ] : resolveContentTypes
    const contentTypes = contentTypePaths.map(resolveContentType)
    const eventConnectors = options.connectedEvents.map(parseEventConnector)
    const extraProps = parseExtraProps(options.extraProps)
    const at = new ArticleTracker(el as HTMLElement, {
      contentTypes,
      intersectionThreshold: parsePercentage(options.intersectionThreshold),
    })
    window.articleTracker.tracker = at
    for (const connector of eventConnectors) {
      // rome-ignore lint/suspicious/noExplicitAny: Universal handler can take any props
      at.events[connector.event].subscribe((props: any) => {
        window.dataLayer.push({
          ...extraProps,
          ...connector.props,
          ...props,
          event: connector.gtmEvent,
          metrics: props?.metrics ? props.metrics : at.getMetrics(),
        })
      }, connector.options)
    }
    at.track()
  }
}

window.articleTracker = {
  trackArticle,
}
