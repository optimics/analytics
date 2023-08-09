import type { google } from '@google-analytics/admin/build/protos/protos.d.ts'

export interface Credentials {
  client_email: string
  private_key: string
}

export interface CellAddress {
  sheetId: number
  address: string
}

type VisualRef = CellAddress

export interface Ga4Ref {
  id: string
  parent: string
  name?: string
  uiRef?: VisualRef
}

export type CustomDimensionState =
  google.analytics.admin.v1beta.ICustomDimension & Ga4Ref
export type CustomMetricState = google.analytics.admin.v1beta.ICustomMetric &
  Ga4Ref
export type ConversionEventState =
  google.analytics.admin.v1beta.IConversionEvent & Ga4Ref

export interface AnalyticsPropertyState
  extends google.analytics.admin.v1beta.IProperty {
  id: string
  name?: string
  displayName?: string | null
  customDimensions?: Map<string, CustomDimensionState>
  customMetrics?: Map<string, CustomMetricState>
  conversionEvents?: Map<string, ConversionEventState>
  uiRef?: VisualRef
}

export interface AnalyticsState {
  customDimensions?: Map<string, CustomDimensionState>
  customMetrics?: Map<string, CustomMetricState>
  properties: Map<string, AnalyticsPropertyState>
}

export enum AnalyticsOperationMode {
  Create = 'create',
  Dispose = 'dispose',
  Modify = 'modify',
}

// @TODO: Type all object options
export type AnalyticsObject =
  | AnalyticsPropertyState
  | CustomDimensionState
  | CustomMetricState

export enum OperationProgress {
  Waiting = 'waiting',
  Request = 'request',
  Failure = 'failure',
  Success = 'success',
  Retry = 'retry',
  NoOp = 'noop',
}

export interface AnalyticsOperation {
  ident: string
  mode: AnalyticsOperationMode
  progress?: OperationProgress
  retried?: number
  state: AnalyticsObject | null
  targetState?: AnalyticsObject
  uiRef?: VisualRef
}

export type AnalyticsOperationPlan = Map<string, AnalyticsOperation>

export enum MutationScope {
  conversionEvents = 'conversionEvents',
  customDimensions = 'customDimensions',
  customMetrics = 'customMetrics',
}

export type ObjectMutationScope = string

export function composeScope(
  objectId: string,
  scope: MutationScope,
): ObjectMutationScope {
  return `${objectId}/${scope}`
}
