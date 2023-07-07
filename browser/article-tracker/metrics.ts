export interface TimeMetrics {
  /** Estimated maximum consumption time */
  max: number
  /** Estimated minimum consumption time */
  min: number
  /** Current consumption time */
  now: number
}

export interface TypeMetrics {
  /** How many elements of the type were displayed according to intersectionThreshold */
  displayed: number
  /** How many elements of the type were consumed based on their time on page and consumtion time */
  consumed: number
  /** Total consumption time of all elements of this type */
  consumptionTimeTotal: number
  /** How many elements of the type were detected */
  total: number
}

export interface ArticleMetrics {
  //  advertisementSlots: ArticleTypeMetrics
  //  images: ArticleTypeMetrics
  //  maximumScroll: number
  //  paragraphs: ArticleTypeMetrics
  /** Overall time measures for the article */
  time: TimeMetrics
  content: Record<string, TypeMetrics>
  //  videos: ArticleTypeMetrics
}
