import type {
  AnalyticsObject,
  AnalyticsOperation,
  AnalyticsOperationPlan,
  AnalyticsState,
  ObjectMutationScope,
} from './types.d.ts'

import { StatusReporter } from './status.js'
import {
  AnalyticsOperationMode,
  ConversionEventState,
  MutationScope,
  OperationProgress,
  composeScope,
} from './types.js'
import { Operation, diff } from 'just-diff'

type ExpandedState = Map<string, AnalyticsObject>

function formatParentId(obj: AnalyticsObject): string {
  return obj.id
}

interface DiffOperation {
  op: Operation
  path: Array<string | number>
  // rome-ignore lint/suspicious/noExplicitAny: Result of diff can be anything
  value: any
}

const ignoreFields: Array<string | number> = ['name', 'uiRef']

function getStateFieldDiff(
  a?: AnalyticsObject | null,
  b?: AnalyticsObject | null,
): DiffOperation[] {
  const fieldDiff = diff(a || {}, b || {})
  const filteredDiff = fieldDiff
    .filter((d) => d.op !== 'remove')
    .reduce((aggr, d) => {
      const nd: DiffOperation = { ...d }
      nd.path = nd.path.filter((p) => !ignoreFields.includes(p)) as Array<
        string | number
      >
      if (nd.path.length > 0) {
        aggr.push(nd)
      }
      return aggr
    }, [] as DiffOperation[])
  return filteredDiff
}

function isMeaningful(op: AnalyticsOperation): boolean {
  if (op.mode === AnalyticsOperationMode.Modify) {
    op.diff = getStateFieldDiff(op.state, op.targetState)
    return op.diff.length > 0
  }
  return true
}

function mapProp(
  state: AnalyticsState,
  propName: MutationScope,
  scopes: ObjectMutationScope[],
): [string, AnalyticsObject][] {
  return Array.from(state.properties.values())
    .flatMap((prop) => {
      if (scopes.includes(composeScope(prop.id, propName))) {
        return Array.from(
          (prop[propName] as Map<string, AnalyticsObject>)?.values() ?? [],
        )
      }
      return []
    })
    .map((cd) => [formatParentId(cd), cd])
}

/** Expands state from its minimal form to atomic form
 */
function expandState(
  state: AnalyticsState,
  scopes: ObjectMutationScope[],
): ExpandedState {
  let src: [string, AnalyticsObject][] = []
  src = src.concat(mapProp(state, MutationScope.customDimensions, scopes))
  src = src.concat(mapProp(state, MutationScope.customMetrics, scopes))
  src = src.concat(mapProp(state, MutationScope.conversionEvents, scopes))
  return new Map<string, AnalyticsObject>(src)
}

function isDeletable(item: ConversionEventState | AnalyticsObject): boolean {
  if ('deletable' in item) {
    return Boolean(item.deletable)
  }
  return true
}

export async function createPlan(
  state: AnalyticsState,
  target: AnalyticsState,
  scopes: ObjectMutationScope[],
  reporter: StatusReporter,
): Promise<AnalyticsOperationPlan> {
  const operations = new Map<string, AnalyticsOperation>()

  const stateExpanded = expandState(state, scopes)
  const targetExpanded = expandState(target, scopes)

  const stateKeys = Array.from(stateExpanded.keys())
  const targetKeys = Array.from(targetExpanded.keys())

  const missing = targetKeys.filter((key) => !stateKeys.includes(key))
  const deprecated = stateKeys.filter((key) => !targetKeys.includes(key))
  const maintained = stateKeys.filter((key) => targetKeys.includes(key))

  const resolveOp = (key: string) => {
    if (missing.includes(key)) {
      return AnalyticsOperationMode.Create
    }
    if (deprecated.includes(key)) {
      return AnalyticsOperationMode.Dispose
    }
    if (maintained.includes(key)) {
      return AnalyticsOperationMode.Modify
    }
    return null
  }

  for (const [key, entry] of stateExpanded.entries()) {
    const mode = resolveOp(key)
    if (
      mode &&
      (mode !== AnalyticsOperationMode.Dispose || isDeletable(entry))
    ) {
      operations.set(key, {
        ident: key,
        mode,
        state: entry,
        uiRef: entry?.uiRef,
      })
    }
  }

  for (const [key, entry] of targetExpanded.entries()) {
    const ref = stateExpanded.get(key)
    const mode = resolveOp(key)
    if (mode) {
      const op = {
        ident: key,
        mode,
        state: ref || null,
        targetState: entry,
        uiRef: ref?.uiRef || entry?.uiRef,
      }
      if (isMeaningful(op)) {
        operations.set(key, op)
      } else {
        reporter.progress(op, OperationProgress.NoOp)
        operations.delete(key)
      }
    }
  }

  return operations
}

function writeLn(msg: string) {
  process.stdout.write(`${msg}\n`)
}

export function printPlan(plan: AnalyticsOperationPlan): void {
  process.stdout.write('The plan:')
  if (plan.size > 0) {
    for (const [key, op] of plan.entries()) {
      writeLn('')
      writeLn(`* ${op.mode} ${key}`)
      if (op.state && op.diff) {
        for (const d of op.diff) {
          /* Assuming, the path is always one level deep. This will break for
           * more complex paths */
          const p = d.path.join('.')
          const prev = String(op?.state?.[p as keyof typeof op.state])
          writeLn(`  [${p}] "${prev}" -> "${d.value}"`)
        }
      }
    }
  } else {
    writeLn(' Nothing to do')
  }
}
