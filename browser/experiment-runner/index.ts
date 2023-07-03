export interface ExperimentData {
  expiresAt?: string 
  name?: string
  startedAt?: string 
  terminated?: boolean
  variant?: string
}

export abstract class Experiment<Props extends ExperimentData> {
  abstract key: string
  abstract duration: number

  get name(): string {
    return `experiment:${this.key}`
  }
 
  getState(): Props {
    const record = window.localStorage.getItem(this.name)
    if (record) {
      try {
        return JSON.parse(record)
      } catch (_e) {
        return { name: this.name } as Props
      }
    }
    return { name: this.name } as Props
  }

  setState(props: Props): void {
    window.localStorage.setItem(this.name, JSON.stringify({
      ...props,
      name: this.name,
    }))
  }

  isTerminated(): boolean {
    const state = this.getState()
    const expired = state.expiresAt && state.expiresAt < new Date().toISOString()
    return Boolean(state.terminated || expired)
  }

  isActive(): boolean {
    const state = this.getState()
    return Boolean(state.startedAt && !this.isTerminated())
  }

  shouldBeStarted(): boolean {
    return !this.isTerminated()
  }

  start(props?: Props): void {
    this.setState({
      ...props,
      expiresAt: new Date(Date.now() + this.duration).toISOString(),
      startedAt: new Date().toISOString(),
      terminated: false,
    } as Props)
  }

  startIfNeeded(props?: Props): void {
    if (this.shouldBeStarted()) {
       this.start(props)
    }
  }
}
