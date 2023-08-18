import type { EventHandlerName } from '@optimics/article-tracker'

import {
  ArticleElement,
  ArticleHeading,
  ArticleParagraph,
  ArticleTracker,
  VisualArticleElement
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
  event: EventHandlerName
  gtmEvent: string
  props?: string
}

interface EventConenctor {
  event: EventHandlerName
  gtmEvent: string
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
  trackDefaultContentTypes?: boolean
}

function parseEventConnector(connector: EventConnectorSerialized): EventConenctor {
  const props = connector.props ? JSON.parse(connector.props) as Props : undefined
  return {
    event: connector.event,
    gtmEvent: connector.gtmEvent,
    props,
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
      ArticleParagraph,
      VisualArticleElement,
    })
  }
  throw new Error(`Resolved ContentType "${type}", but could not determine it's type`)
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
    const at = new ArticleTracker(el as HTMLElement, {
      contentTypes
    })
    window.articleTracker.tracker = at
    for (const connector of eventConnectors) {
      at.events[connector.event].subscribe(props => {
        window.dataLayer.push({
          ...connector.props,
          ...props,
          event: connector.gtmEvent,
          metrics: at.getMetrics(),
        })
      })
    }
  }
}

window.articleTracker = {
  trackArticle,
}
