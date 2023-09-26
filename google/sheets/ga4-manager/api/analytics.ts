import Queue from 'queue'

import type {
  AnalyticsObject,
  AnalyticsOperation,
  AnalyticsOperationPlan,
  AnalyticsPropertyState,
  AnalyticsState,
  ConversionEventState,
  Credentials,
  CustomDimensionState,
  CustomMetricState,
  ObjectMutationScope,
} from './types.d.ts'
import type { google } from '@google-analytics/admin/build/protos/protos.d.ts'

import { StatusReporter } from './status.js'
import {
  AnalyticsOperationMode,
  MutationScope,
  OperationProgress,
  composeScope,
} from './types.js'
import { AnalyticsAdminServiceClient } from '@google-analytics/admin'

interface AnalyticsAdminOptions {
  credentials: Credentials
  reporter: StatusReporter
  scopes: MutationScope[]
}

// @TODO: Fix the Operation typing
// rome-ignore lint/suspicious/noExplicitAny: Badly typed, but blocker
type Operation = (item: any) => Promise<any>

type OpMap = {
  [key in AnalyticsOperationMode]: Operation
}

interface ObjectOpMap {
  [key: string]: OpMap
}

export class AnalyticsAdmin {
  ga: AnalyticsAdminServiceClient
  scopes: ObjectMutationScope[]
  reporter: StatusReporter

  constructor({ credentials, reporter, scopes }: AnalyticsAdminOptions) {
    this.ga = new AnalyticsAdminServiceClient({ credentials })
    this.reporter = reporter
    this.scopes = scopes
  }

  async readConversionEventsState(
    property: AnalyticsPropertyState,
  ): Promise<Map<string, ConversionEventState>> {
    const map = new Map<string, ConversionEventState>()
    const [dims] = await this.ga.listConversionEvents({ parent: property.name })
    for (const dim of dims) {
      const id = `${property.name}/conversionEvents/${dim.eventName}`
      map.set(String(dim.name), {
        ...dim,
        id,
        parent: property.name,
      } as ConversionEventState)
    }
    return map
  }

  async readCustomDimensionsState(
    property: AnalyticsPropertyState,
  ): Promise<Map<string, CustomDimensionState>> {
    const map = new Map<string, CustomDimensionState>()
    const [dims] = await this.ga.listCustomDimensions({ parent: property.name })
    for (const dim of dims) {
      const id = `${property.name}/customDimensions/${dim.parameterName}`
      map.set(String(dim.name), {
        ...dim,
        id,
        parent: property.name,
        replacementProps: ['scope'],
      } as CustomDimensionState)
    }
    return map
  }

  async readCustomMetricsState(
    property: AnalyticsPropertyState,
  ): Promise<Map<string, CustomMetricState>> {
    const map = new Map<string, CustomMetricState>()
    const [metrics] = await this.ga.listCustomMetrics({ parent: property.name })
    for (const metric of metrics) {
      const id = `${property.name}/customMetrics/${metric.parameterName}`
      map.set(id, {
        ...metric,
        id,
        parent: property.name,
        replacementProps: ['scope', 'measurementUnit', 'restrictedMetricType'],
      } as CustomMetricState)
    }
    return map
  }

  async readPropertyState(
    property: google.analytics.admin.v1beta.IProperty,
  ): Promise<AnalyticsPropertyState> {
    const state: AnalyticsPropertyState = {
      ...property,
      id: String(property.name),
      name: String(property.name),
    }
    if (
      this.scopes.includes(
        composeScope(state.id, MutationScope.conversionEvents),
      )
    ) {
      state.conversionEvents = await this.readConversionEventsState(state)
    }
    if (
      this.scopes.includes(
        composeScope(state.id, MutationScope.customDimensions),
      )
    ) {
      state.customDimensions = await this.readCustomDimensionsState(state)
    }
    if (
      this.scopes.includes(composeScope(state.id, MutationScope.customMetrics))
    ) {
      state.customMetrics = await this.readCustomMetricsState(state)
    }
    return state
  }

  async listAllProperties(): Promise<
    google.analytics.admin.v1beta.IProperty[]
  > {
    const [accounts] = await this.ga.listAccounts()
    const allProperties = await Promise.all(
      accounts.map((account) =>
        this.ga.listProperties({
          filter: `parent:${account.name}`,
        }),
      ),
    )
    return allProperties.flatMap((res) => res[0])
  }

  async loadPropertiesState(): Promise<Map<string, AnalyticsPropertyState>> {
    const map = new Map<string, AnalyticsPropertyState>()
    const properties = await this.listAllProperties()
    for (const property of properties) {
      if (property.name) {
        map.set(property.name, await this.readPropertyState(property))
      }
    }
    return map
  }

  async readState(): Promise<AnalyticsState> {
    return {
      properties: await this.loadPropertiesState(),
    }
  }

  objectOpMap: ObjectOpMap = {
    conversionEvent: {
      create: (item: ConversionEventState) =>
        this.ga.createConversionEvent({
          parent: item.parent,
          conversionEvent: {
            eventName: item.eventName,
            custom: item.custom,
            deletable: item.deletable,
          },
        }),
      dispose: (item: ConversionEventState) =>
        this.ga.deleteConversionEvent({
          name: item.name,
        }),
      modify: async (item: ConversionEventState) => item,
      async replace(item: ConversionEventState) {
        await this.dispose(item)
        return await this.create(item)
      },
    },
    customMetric: {
      create: (item: CustomMetricState) =>
        this.ga.createCustomMetric({
          parent: item.parent,
          customMetric: item,
        }),
      dispose: (item: CustomMetricState) =>
        this.ga.archiveCustomMetric({
          name: item.name,
        }),
      modify: (item: CustomMetricState) =>
        this.ga.updateCustomMetric({
          customMetric: item,
          updateMask: {
            paths: ['*'],
          },
        }),
      async replace(item: CustomMetricState) {
        await this.dispose(item)
        return await this.create({ ...item, name: undefined })
      },
    },
    customDimension: {
      create: (item: CustomDimensionState) =>
        this.ga.createCustomDimension({
          parent: item.parent,
          customDimension: {
            displayName: item.displayName,
            parameterName: item.parameterName,
            description: item.description,
            scope: item.scope,
          },
        }),
      dispose: (item: CustomDimensionState) =>
        this.ga.archiveCustomDimension({
          name: item.name,
        }),
      modify: (item: CustomDimensionState) =>
        this.ga.updateCustomDimension({
          customDimension: item,
          updateMask: {
            paths: ['*'],
          },
        }),
      async replace(item: CustomDimensionState) {
        await this.dispose(item)
        return await this.create({ ...item, name: undefined })
      },
    },
  }

  getObjectOps(obj: AnalyticsObject): OpMap {
    if (obj.id.includes('/conversionEvents/')) {
      return this.objectOpMap.conversionEvent
    }
    if (obj.id.includes('/customDimensions/')) {
      return this.objectOpMap.customDimension
    }
    if (obj.id.includes('/customMetrics/')) {
      return this.objectOpMap.customMetric
    }
    throw new Error(`Uncrecognized object type: "${obj?.id}"`)
  }

  createOpRunner(op: AnalyticsOperation): () => ReturnType<Operation> {
    const obj = {
      ...op.state,
      ...op.targetState,
    } as AnalyticsObject
    if (!obj) {
      throw new Error(`Cannot run "${op.mode}" operation without object`)
    }
    const objectOps = this.getObjectOps(obj)
    // @TODO: Resolve target state and state merge
    return () => objectOps[op.mode](obj)
  }

  isFailureAcceptable(op: AnalyticsOperation, e: Error): boolean {
    if (op.retried && op.retried >= 3) {
      /* The Operation has been retried too many times */
      return false
    }
    if (e.message.includes('DEADLINE_EXCEEDED')) {
      /* The Analytics API did not respond in time, but it is possible, that
       * it achieved the job. Retrying it will most likely resolve the
       * question and report actual status */
      return true
    }
    return false
  }

  async executeOperation(op: AnalyticsOperation): Promise<void> {
    const runner = this.createOpRunner(op)
    try {
      this.reporter.progress(op, OperationProgress.Request)
      await runner()
      this.reporter.progress(op, OperationProgress.Success)
    } catch (e) {
      if (this.isFailureAcceptable(op, e)) {
        op.retried = op.retried ? op.retried + 1 : 1
        this.reporter.progress(
          op,
          OperationProgress.Retry,
          `(${op.retried}) ${e.message}`,
        )
        await this.executeOperation(op)
      } else {
        this.reporter.progress(op, OperationProgress.Failure, e.message)
        /* Instead of throwing the error, just log it. Throwing it would
         * crash the queue, but instead we want it to finish all tasks
         * instead of failing fast */
        console.error(e)
      }
    }
  }

  async executePlan(plan: AnalyticsOperationPlan): Promise<void> {
    const queue = new Queue({
      autostart: false,
      concurrency: 4,
      results: [],
    })
    for (const op of plan.values()) {
      queue.push(() => this.executeOperation(op))
    }
    const promise = new Promise((resolve) =>
      queue.addEventListener('end', resolve),
    )
    try {
      await queue.start()
      await promise
    } finally {
      this.reporter.summary()
    }
  }
}
