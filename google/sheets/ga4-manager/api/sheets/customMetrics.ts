import type { AnalyticsPropertyState, CustomMetricState } from '../types.d.ts'
import type { GoogleSpreadsheetCell } from 'google-spreadsheet'

import { Worksheet } from './Worksheet.js'

export class CustomMetricsSheet extends Worksheet {
  static titles = ['customMetrics', 'ga4:customMetrics', 'ga4:CustomMetrics']

  parseCustomMetric(
    property: AnalyticsPropertyState,
    cell: GoogleSpreadsheetCell,
  ): CustomMetricState {
    const parameterName = String(cell.value)
    const defaultProps = this.doc.entityConfig.customMetric[parameterName] || {}
    return {
      displayName: defaultProps.displayName || parameterName,
      measurementUnit: defaultProps.measurementUnit || 'STANDARD',
      scope: defaultProps.scope || 'EVENT',
      description: defaultProps.description || '',
      id: `${property.id}/customMetrics/${cell.value}`,
      parameterName,
      parent: String(property.name),
      restrictedMetricType: defaultProps.restrictedMetricType || [],
      uiRef: this.getUiRef(cell),
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
