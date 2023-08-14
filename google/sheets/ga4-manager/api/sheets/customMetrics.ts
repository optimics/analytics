import type { AnalyticsPropertyState, CustomMetricState } from '../types.d.ts'
import type { GoogleSpreadsheetCell } from 'google-spreadsheet'

import { Worksheet } from './Worksheet.js'

export class CustomMetricsSheet extends Worksheet {
  static titles = ['customMetrics', 'ga4:customMetrics', 'ga4:CustomMetrics']

  parseCustomMetric(
    property: AnalyticsPropertyState,
    cell: GoogleSpreadsheetCell,
  ): CustomMetricState {
    return {
      id: `${property.id}/customMetrics/${cell.value}`,
      // @TODO: Read sheet params instead of interpolation
      displayName: String(cell.value),
      parameterName: String(cell.value),
      parent: String(property.name),
      uiRef: this.getUiRef(cell),
      measurementUnit: 'STANDARD',
      scope: 'EVENT',
    }
  }

  parseSheetTypeSpecificValues(
    property: AnalyticsPropertyState,
    rowIndex: number,
  ): AnalyticsPropertyState {
    const startIndex = this.getHeaderIndex('customMetrics')
    const map = new Map<string, CustomMetricState>()
    property.customMetrics = map
    this.iterateRight(rowIndex, startIndex, (cell: GoogleSpreadsheetCell) => {
      const item = this.parseCustomMetric(property, cell)
      map.set(item.id, item)
    })
    return property
  }
}
