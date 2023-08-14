import type {
  AnalyticsPropertyState,
  ConversionEventState,
} from '../types.d.ts'
import type { GoogleSpreadsheetCell } from 'google-spreadsheet'

import { Worksheet } from './Worksheet.js'

export class ConversionEventsSheet extends Worksheet {
  static titles = [
    'conversionEvents',
    'ga4:conversionEvents',
    'ga4:ConversionEvents',
  ]

  parseConversionEvent(
    property: AnalyticsPropertyState,
    cell: GoogleSpreadsheetCell,
  ): ConversionEventState {
    return {
      id: `${property.id}/conversionEvents/${cell.value}`,
      custom: true,
      deletable: true,
      eventName: String(cell.value),
      parent: String(property.name),
      uiRef: this.getUiRef(cell),
    }
  }

  parseSheetTypeSpecificValues(
    property: AnalyticsPropertyState,
    rowIndex: number,
  ): AnalyticsPropertyState {
    const startIndex = this.getHeaderIndex('conversionEvents')
    const map = new Map<string, ConversionEventState>()
    property.conversionEvents = map
    this.iterateRight(rowIndex, startIndex, (cell: GoogleSpreadsheetCell) => {
      const item = this.parseConversionEvent(property, cell)
      map.set(item.id, item)
    })
    return property
  }
}
