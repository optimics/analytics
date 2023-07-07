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
  cachedState?: Props

  get name(): string {
    return `experiment:${this.key}`
  }
 
  getState(): Props {
    if (this.cachedState) {
      return this.cachedState
    }
    const record = window.localStorage.getItem(this.name)
    if (record) {
      try {
        this.cachedState = JSON.parse(record)
        return this.cachedState as Props
      } catch (_e) {
        return { name: this.name } as Props
      }
    }
    return { name: this.name } as Props
  }

  setState(props: Props): void {
    this.cachedState = {
      ...props,
      name: this.name,
    }
    window.localStorage.setItem(this.name, JSON.stringify(this.cachedState))
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

  start(props?: Props): void {
    this.setState({
      ...props,
      expiresAt: new Date(Date.now() + this.duration).toISOString(),
      startedAt: new Date().toISOString(),
      terminated: false,
    } as Props)
  }

  startIfNeeded(props?: Props): void {
    if (!this.isActive()) {
       this.start(props)
    }
  }
}
