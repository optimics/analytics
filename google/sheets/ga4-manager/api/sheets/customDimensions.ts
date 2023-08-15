import type {
  AnalyticsPropertyState,
  CustomDimensionState,
} from '../types.d.ts'
import type { GoogleSpreadsheetCell } from 'google-spreadsheet'

import { Worksheet } from './Worksheet.js'

export class CustomDimensionsSheet extends Worksheet {
  static titles = [
    'customDimensions',
    'ga4:customDimensions',
    'ga4:CustomDimensions',
  ]

  parseCustomDimension(
    property: AnalyticsPropertyState,
    cell: GoogleSpreadsheetCell,
  ): CustomDimensionState {
    const parameterName = String(cell.value)
    const defaultProps =
      this.doc.entityConfig.customDimension[parameterName] || {}
    return {
      displayName: defaultProps.displayName || parameterName,
      scope: defaultProps.scope || 'EVENT',
      description: defaultProps.description || '',
      id: `${property.id}/customDimensions/${cell.value}`,
      parameterName,
      parent: String(property.name),
      uiRef: this.getUiRef(cell),
    }
  }

  parseSheetTypeSpecificValues(
    property: AnalyticsPropertyState,
    rowIndex: number,
  ): AnalyticsPropertyState {
    const startIndex = this.getHeaderIndex('customDimensions')
    const map = new Map<string, CustomDimensionState>()
    property.customDimensions = map
    this.iterateRight(rowIndex, startIndex, (cell: GoogleSpreadsheetCell) => {
      const item = this.parseCustomDimension(property, cell)
      map.set(item.id, item)
    })
    return property
  }
}
