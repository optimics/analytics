export interface TimeEstimates {
  /** Estimated fastest time the content could be consumed in */
  fastest: number
  /** Estimated slowest time the content could be consumed in */
  slowest: number
}

interface ConsumptionMetrics {
  /** How much of the content did user consume rounded to 5%
   * @example 0.05
   * @example 0.5
   * @example 1
   */
  achieved: number
  /** True if this content been marked as completely consumed */
  consumed: boolean
  /** True if this content is currently being consumed */
  consuming: boolean
  /**
   * The total time user spent consuming the content in miliseconds
   *
   * @example: 64023
   */
  timeTotal: number
}

export interface ContentTypeMetrics extends ConsumptionMetrics {
  /** How many elements of the type were consumed during the session. It is at
   * maximum the number of detected elements.
   * @example 3
   */
  consumedElements: number

  /** How many detected elements are actually consumable. This creates base for
   * the consumption metrics.
   * @example 2
   */
  consumableElements: number
  /** Natural number describing how many elements of the type were detected
   * @example 3
   */
  detected: number
  /** How many elements of the type were displayed on screen based on the
   * intersectionThreshold value
   * @example 5
   */
  displayed: number
  /** Overall time estimates for the content type */
  estimates: TimeEstimates
  wordCount?: number
}

export interface ArticleMetrics extends ConsumptionMetrics {
  //  maximumScroll: number
  /** Overall time estimates for the article */
  estimates: TimeEstimates
  /** Content Type specific metrics */
  content: Record<string, ContentTypeMetrics>
  /**
   * Extra time user spent consuming this content. This is a natural number
   * multiplier of the slowest consumer time from TimeEstimates. User, that
   * reached twice the time of slowest consumer will have value 1. Three times
   * the slowest consumer will be 2, and so on. Useful for filtering out
   * unuseful analytics metrics.
   *
   * @example 3
   */
  overtime: number
  wordCount: number
}
