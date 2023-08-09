import { AnalyticsOperation, OperationProgress } from './types.js'

interface JobCounter {
  failure: number
  start: number
  success: number
}

export class StatusReporter {
  counter: JobCounter = {
    failure: 0,
    start: Date.now(),
    success: 0,
  }

  progress(
    op: AnalyticsOperation,
    status: OperationProgress,
    msg?: string,
  ): void {
    op.progress = status
    if (status === OperationProgress.Success) {
      this.counter.success += 1
    }
    if (status === OperationProgress.Failure) {
      this.counter.failure += 1
    }
    if (status !== OperationProgress.NoOp) {
      this.log(
        `[${op.progress}] ${op.mode} ${op.ident} ${
          msg ? ` because of "${msg}"` : ''
        }`,
      )
    }
  }

  log(message: string): void {
    process.stdout.write(message)
    process.stdout.write('\n')
  }

  summary(): void {
    const time = (Date.now() - this.counter.start) / 1000
    this.log(
      `Plan ${
        this.counter.failure === 0 ? 'finished successfully' : 'failed'
      } after ${time.toFixed(1)} seconds`,
    )
    this.log(`* Failure: ${this.counter.failure}`)
    this.log(`* Success: ${this.counter.success}`)
  }
}
