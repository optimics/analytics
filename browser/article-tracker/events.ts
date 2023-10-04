export type EventFilter<T> = (props: T, originalProps?: T) => boolean
export type EventHandler<T> = (props: T) => void

export interface EventControllerOptions<T> {
  bounceTime?: number
  cacheOriginalProps?: boolean
  defaultProps?: Partial<T>
  filter?: EventFilter<T>
  mergeProps?: (keyof T)[]
}

enum EventHandlerOperator {
  eq = 'eq',
  gt = 'gt',
  gte = 'gte',
  lt = 'lt',
  lte = 'lte',
}

interface EventHandlerCondition {
  operator: EventHandlerOperator
  value: number
}

interface EventHandlerFilter<T> {
  [key: string]: EventHandlerCondition
}

interface EventHandlerOptions<T> {
  once?: boolean
  conditions?: EventHandlerFilter<T>[]
}

interface EventHandlerWithOptions<T> extends EventHandlerOptions<T> {
  fn: EventHandler<T>
  fired: number
}

// consumption achieved at least 20

/** Controller that manages subscribing to calls and debouncing the triggers,
 * while merging the call props. This is useful, when you want to minimize the
 * amount of calls, but you wish to pass all the distinct values of the call.
 * Multiple handlers can be subscribed to this controller.
 *
 * Example scenario:
 *
 * Given mergeProps=['targets'].
 * Trigger 1 Props: `{ targets: ['a'], foo: 'bar' }`
 * Trigger 2 Props: `{ targets: ['b'], foo: 'Hello there!' }`
 * Trigger 3 Props: `{ targets: ['c'] }`
 * The Handler is called only once with following props:
 * `{ targets: ['a', 'b', 'c'], foo: 'Hello there!' }`
 */
export class EventController<T> {
  bouncer?: ReturnType<typeof setTimeout>
  bounceTime: number
  cachedProps?: Partial<T>
  cacheOriginalProps: boolean
  cachedOriginalProps?: T
  defaultProps: Partial<T>
  filter?: EventFilter<T>
  handlers: EventHandlerWithOptions<T>[] = []
  mergeProps?: (keyof T)[]

  constructor(options: EventControllerOptions<T>) {
    this.bounceTime = options.bounceTime || 60
    this.cacheOriginalProps = Boolean(options.cacheOriginalProps)
    this.defaultProps = options.defaultProps || {}
    this.filter = options.filter
    this.mergeProps = options.mergeProps
  }

  mergeProp<K extends keyof T>(
    base: Partial<T> | undefined,
    target: T,
    propName: K,
  ): T[K] {
    const baseValue: T[K] | undefined = base?.[propName]
    const targetValue: T[K] = target[propName]
    if (!baseValue) {
      return targetValue
    }
    if (!targetValue) {
      return baseValue
    }
    if (Array.isArray(baseValue) && Array.isArray(targetValue)) {
      return [
        ...(baseValue as unknown[]),
        ...(targetValue as unknown[]),
      ] as T[K]
    }
    if (typeof baseValue === 'object') {
      return { ...baseValue, ...targetValue }
    }
    return targetValue
  }

  /** Merge together `cachedProps` and `props`. Props named in `mergeProps`
   * will be merged deeply */
  mergeDebounceProps(props: T): T {
    const target = props
    if (this.mergeProps) {
      for (const propName of this.mergeProps) {
        target[propName] = this.mergeProp(
          this.cachedProps,
          target,
          propName as keyof T,
        )
      }
    }
    return {
      ...this.cachedProps,
      ...target,
    }
  }

  /** The event will be debounced based on `bounceTime`. The props between each
   * calls will be shallowly merged. Props named in `mergeProps` will be
   * merged deeply */
  debounce(props: T): void {
    clearTimeout(this.bouncer)
    if (this.cacheOriginalProps && !this.cachedOriginalProps) {
      this.cachedOriginalProps = props
    }
    const passProps = this.mergeDebounceProps(props)
    this.cachedProps = passProps
    this.bouncer = setTimeout(() => {
      this.cachedProps = undefined
      this.now(passProps)
    }, this.bounceTime)
  }

  /** Immediately trigger the event and pass it the props */
  now(props: T): void {
    if (this.shouldPass(props)) {
      this.cachedOriginalProps = undefined
      this.handlers = this.handlers.reduce((aggr, handler) => {
        handler.fn({
          ...this.defaultProps,
          ...props,
        })
        handler.fired += 1
        if (!handler.once) {
          aggr.push(handler)
        }
        return aggr
      }, [] as EventHandlerWithOptions<T>[])
    }
  }

  /** Run filter first, to see if an event should be fired */
  shouldPass(props: T): boolean {
    if (this.filter) {
      return this.filter(props, this.cachedOriginalProps)
    }
    return true
  }

  /** Subscribe to this event */
  subscribe(fn: EventHandler<T>, options?: Object): void {
    this.handlers.push({
      ...options,
      fired: 0,
      fn,
    })
  }
}
