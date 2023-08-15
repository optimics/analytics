import type { AnalyticsPropertyState, CellAddress } from '../types.d.ts'
import type { SheetSource } from './SheetSource.js'
import type {
  GoogleSpreadsheetCell,
  GoogleSpreadsheetRow,
  GoogleSpreadsheetWorksheet,
} from 'google-spreadsheet'

import camelCase from 'camelcase'
import moment from 'moment'

interface WorksheetOptions {
  doc: SheetSource
  sheet: GoogleSpreadsheetWorksheet
}

export interface SheetHeaderMap {
  [k: string]: number
}

export interface PropertyKeyMap {
  [k: string]: string[]
}

export type CellIteratorMethod = (cel: GoogleSpreadsheetCell) => void

export class SpreadsheetError extends Error {}
export class WorksheetError extends Error {}
export class NoSheetError extends SpreadsheetError {}

function parsePropertyName(id: string | number): string {
  if (typeof id === 'string' && id.startsWith('properties/')) {
    return id
  }
  return `properties/${id}`
}

export function formatDate(date: Date): string {
  return moment(date).format('YYYY-MM-DDThh:mm:ss')
}

export class Worksheet {
  static titles: string[] = []

  doc: SheetSource
  headerMap: SheetHeaderMap = {}
  sheet: GoogleSpreadsheetWorksheet
  propertyKeyMap: PropertyKeyMap = {
    displayName: ['propertyName', 'property'],
    propertyId: ['propertyId'],
    conversionEvents: ['conversionEvents'],
    customDimensions: ['customDimensions'],
    customMetrics: ['customMetrics'],
  }

  constructor({ sheet, doc }: WorksheetOptions) {
    this.doc = doc
    this.sheet = sheet
  }

  findHeaderIndex(matchKeys: string[]): number {
    return this.sheet.headerValues.findIndex((value: string) =>
      matchKeys.includes(camelCase(value)),
    )
  }

  parseHeaders(): SheetHeaderMap {
    return Object.fromEntries(
      Object.entries(this.propertyKeyMap).map(([entry, matchKeys]) => [
        entry,
        this.findHeaderIndex(matchKeys),
      ]),
    )
  }

  getHeaderIndex(headerName: string): number {
    if (typeof this.headerMap[headerName] !== 'undefined') {
      return this.headerMap[headerName]
    }
    throw new SpreadsheetError(
      `Header "${headerName}" was not matched. Perhaps there is a row header missing in your Worksheet.`,
    )
  }

  parsePropertyCell(rowIndex: number, cellIndex: number): string | null {
    const cell = this.sheet.getCell(rowIndex, cellIndex)
    if (!cell.value || typeof cell.value === 'boolean') {
      return null
    }
    return String(cell.value)
  }

  injectOptionalProp(
    obj: { [key: string]: string | null },
    propName: string,
    rowIndex: number,
  ): void {
    try {
      obj[propName] = this.parsePropertyCell(
        rowIndex,
        this.getHeaderIndex(propName),
      )
    } catch (e) {
      if (!(e instanceof SpreadsheetError)) {
        throw e
      }
    }
  }

  get columnCount(): number {
    if (!this.sheet?.gridProperties.columnCount) {
      throw new WorksheetError(`The sheet "${this.sheet.title}" is not a grid`)
    }
    return this.sheet.gridProperties?.columnCount
  }

  getUiRef(cell: GoogleSpreadsheetCell): CellAddress {
    return {
      sheetId: this.sheet.sheetId,
      address: cell.a1Address,
    }
  }

  parseSheetTypeSpecificValues(
    property: AnalyticsPropertyState,
    _rowIndex: number,
  ): AnalyticsPropertyState {
    return property
  }

  parsePropertyRow(rowIndex: number): AnalyticsPropertyState | null {
    const id = this.parsePropertyCell(
      rowIndex,
      this.getHeaderIndex('propertyId'),
    )
    if (!id) {
      return null
    }
    const name = parsePropertyName(id)
    const property = {
      id: name,
      name,
    }
    this.parseSheetTypeSpecificValues(property, rowIndex)
    this.injectOptionalProp(property, 'displayName', rowIndex)
    return property
  }

  async parseProperties(): Promise<AnalyticsPropertyState[]> {
    await this.sheet.loadHeaderRow()
    this.headerMap = this.parseHeaders()
    await this.sheet.loadCells()
    const rows = await this.sheet.getRows({ offset: 1 })
    return rows
      .map((row: GoogleSpreadsheetRow) =>
        this.parsePropertyRow(row.rowNumber - 1),
      )
      .filter(Boolean) as AnalyticsPropertyState[]
  }

  iterateRight(
    rowIndex: number,
    startIndex: number,
    fn: CellIteratorMethod,
  ): void {
    for (
      let cellIndex = startIndex;
      cellIndex <= this.columnCount;
      cellIndex++
    ) {
      try {
        const cell = this.sheet.getCell(rowIndex, cellIndex)
        if (cell.value) {
          fn(cell)
        }
      } catch (e) {
        if (e.message.startsWith('Out of bounds')) {
          break
        }
        throw e
      }
    }
  }
}
