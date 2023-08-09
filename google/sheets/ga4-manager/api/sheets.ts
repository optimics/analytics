import type {
  AnalyticsOperation,
  AnalyticsPropertyState,
  AnalyticsState,
  CellAddress,
  ConversionEventState,
  Credentials,
  CustomDimensionState,
  CustomMetricState,
  ObjectMutationScope,
} from './types.d.ts'
import type {
  GoogleSpreadsheetCell,
  GoogleSpreadsheetRow,
} from 'google-spreadsheet'

import camelCase from 'camelcase'
import moment from 'moment'

import { StatusReporter } from './status.js'
import { MutationScope, OperationProgress, composeScope } from './types.js'
import { JWT } from 'google-auth-library'
import {
  GoogleSpreadsheet,
  GoogleSpreadsheetWorksheet,
} from 'google-spreadsheet'

// Unexported CopyPasted types from google-spreadsheet
type Color = {
  red: number;
  green: number;
  blue: number;
  alpha?: number;
}

type ThemeColorType = 'TEXT' | 'BACKGROUND' | 'ACCENT1' | 'ACCENT2' | 'ACCENT3' | 'ACCENT4' | 'ACCENT5' | 'ACCENT6' | 'LINK';
type ColorStyle = { Color: Color; } | {
  themeColor: ThemeColorType;
};

type TextFormat = {
  foregroundColor?: Color;
  foregroundColorStyle?: ColorStyle;
  fontFamily?: string;
  fontSize?: number;
  bold?: boolean;
  italic?: boolean;
  strikethrough?: boolean;
  underline?: boolean;
}

interface SpreadsheetSourceOptions {
  credentials: Credentials
  docId: string
}

interface PropertyKeyMap {
  [k: string]: string[]
}

interface SheetHeaderMap {
  [k: string]: number
}

const propertyKeyMap: PropertyKeyMap = {
  displayName: ['propertyName', 'property'],
  propertyId: ['propertyId'],
  conversionEvents: ['conversionEvents'],
  customDimensions: ['customDimensions'],
  customMetrics: ['customMetrics'],
}

function parsePropertyName(id: string | number): string {
  if (typeof id === 'string' && id.startsWith('properties/')) {
    return id
  }
  return `properties/${id}`
}

function formatDate(date: Date): string {
  return moment(date).format('YYYY-MM-DDThh:mm:ss')
}

export class SpreadsheetError extends Error {}
export class WorksheetError extends Error {}
export class NoSheetError extends SpreadsheetError {}

interface WorksheetOptions {
  doc: SpreadsheetSource
  sheet: GoogleSpreadsheetWorksheet
}

type CellIteratorMethod = (cel: GoogleSpreadsheetCell) => void

class Worksheet {
  static titles: string[] = []

  doc: SpreadsheetSource
  headerMap: SheetHeaderMap = {}
  sheet: GoogleSpreadsheetWorksheet

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
      Object.entries(propertyKeyMap).map(([entry, matchKeys]) => [
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

class CustomDimensionsSheet extends Worksheet {
  static titles = [
    'customDimensions',
    'ga4:customDimensions',
    'ga4:CustomDimensions',
  ]

  parseCustomDimension(
    property: AnalyticsPropertyState,
    cell: GoogleSpreadsheetCell,
  ): CustomDimensionState {
    return {
      id: `${property.id}/customDimensions/${cell.value}`,
      // @TODO: Read sheet params instead of interpolation
      displayName: String(cell.value),
      parameterName: String(cell.value),
      scope: 'EVENT',
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

class CustomMetricsSheet extends Worksheet {
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

class ConversionEventsSheet extends Worksheet {
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

const sheetTypes: typeof Worksheet[] = [
  CustomDimensionsSheet,
  CustomMetricsSheet,
  ConversionEventsSheet,
]

export class SpreadsheetSource {
  credentials: Credentials
  doc: GoogleSpreadsheet
  mutationScopes: ObjectMutationScope[] = []

  constructor({ docId, credentials }: SpreadsheetSourceOptions) {
    const auth = new JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
      ]
    })
    this.doc = new GoogleSpreadsheet(docId, auth)
    this.credentials = credentials
  }

  getSheetType(sheetTitle: string): typeof Worksheet | null {
    const title = camelCase(sheetTitle)
    const model = sheetTypes.find((type) => type.titles.includes(title))
    return model ? model : null
  }

  async extractSheets(): Promise<Worksheet[]> {
    const sheets = []
    for (const sheet of this.doc.sheetsByIndex) {
      const Model = this.getSheetType(sheet.title)
      if (Model) {
        sheets.push(
          new Model({
            doc: this,
            sheet,
          }),
        )
      }
    }
    if (!sheets.length) {
      throw new NoSheetError('Did not find any usable spreadsheets')
    }
    return sheets
  }

  async connect(): Promise<SpreadsheetSource> {
    await this.doc.loadInfo()
    return this
  }

  mergeSheetProperties(
    properties: AnalyticsPropertyState[][],
  ): Map<string, AnalyticsPropertyState> {
    return properties.flat().reduce((aggr, property) => {
      const mergeWith = aggr.get(property.id)
      const target = mergeWith ? { ...mergeWith, ...property } : property
      this.detectPropertyMutationScopes(target)
      return aggr.set(property.id, target)
    }, new Map<string, AnalyticsPropertyState>())
  }

  async parseState(): Promise<AnalyticsState> {
    const sheets = await this.extractSheets()
    const properties = await Promise.all(
      sheets.map((sheet) => sheet.parseProperties()),
    )
    return {
      properties: this.mergeSheetProperties(properties),
    }
  }

  detectPropertyMutationScopes(property: AnalyticsPropertyState): void {
    if (property.conversionEvents) {
      this.addMutationScope(
        composeScope(property.id, MutationScope.conversionEvents),
      )
    }
    if (property.customDimensions) {
      this.addMutationScope(
        composeScope(property.id, MutationScope.customDimensions),
      )
    }
    if (property.customMetrics) {
      this.addMutationScope(
        composeScope(property.id, MutationScope.customMetrics),
      )
    }
  }

  addMutationScope(scope: ObjectMutationScope): void {
    if (!this.mutationScopes.includes(scope)) {
      this.mutationScopes.push(scope)
    }
  }

  getMutationScopes(): ObjectMutationScope[] {
    return this.mutationScopes
  }
}

interface SheetReporterOptions {
  sheet: SpreadsheetSource
}

const SAVE_TIMEOUT_DEBOUNCE = 200
const SAVE_TIMEOUT_REGENERATE = 60000

export class SheetReporter extends StatusReporter {
  lastSave?: number
  sheet: SpreadsheetSource
  saveTimeout: Map<GoogleSpreadsheetWorksheet, ReturnType<typeof setTimeout>> =
    new Map()

  constructor({ sheet }: SheetReporterOptions) {
    super()
    this.sheet = sheet
  }

  getCell(
    op: AnalyticsOperation,
  ): [GoogleSpreadsheetWorksheet | null, GoogleSpreadsheetCell | null] {
    const ref = op.uiRef
    if (!ref) {
      return [null, null]
    }
    const sheet = this.sheet.doc.sheetsById[ref.sheetId]
    if (!sheet) {
      return [null, null]
    }
    return [sheet, sheet.getCellByA1(ref.address)]
  }

  getTimeFrame(): number {
    if (!this.lastSave) {
      return SAVE_TIMEOUT_DEBOUNCE
    }
    const timeDiff = Date.now() - this.lastSave
    return Math.max(
      SAVE_TIMEOUT_DEBOUNCE,
      SAVE_TIMEOUT_REGENERATE / timeDiff ** 2,
    )
  }

  scheduleSave(sheet: GoogleSpreadsheetWorksheet): void {
    this.resetSaveTimeout(sheet)
    this.saveTimeout.set(
      sheet,
      setTimeout(() => this.saveSheet(sheet), this.getTimeFrame()),
    )
  }

  saveSheet(sheet: GoogleSpreadsheetWorksheet): void {
    this.lastSave = Date.now()
    sheet.saveUpdatedCells()
  }

  resetSaveTimeout(sheet: GoogleSpreadsheetWorksheet): void {
    const timeout = this.saveTimeout.get(sheet)
    if (timeout) {
      clearTimeout(timeout)
    }
  }

  progress(op: AnalyticsOperation, status: OperationProgress, msg?: string) {
    super.progress(op, status)
    const [sheet, cell] = this.getCell(op)
    if (sheet && cell) {
      let note = ''
      if (
        status === OperationProgress.Request ||
        status === OperationProgress.Retry
      ) {
        note = `⌛ ${op.mode} requested on ${formatDate(new Date())}`
      } else if (status === OperationProgress.Success) {
        note = `✅ ${op.mode} succeeded on ${formatDate(new Date())}`
      } else if (status === OperationProgress.Failure) {
        note = `❌ ${op.mode} failed on ${formatDate(new Date())} ${
          msg ? ` because of ${msg}` : ''
        }`
      }
      this.markStatus(sheet, cell, status, note)
    }
  }

  markStatus(
    sheet: GoogleSpreadsheetWorksheet,
    cell: GoogleSpreadsheetCell,
    status: OperationProgress,
    note: string,
  ): void {
    if (status === OperationProgress.Request) {
      this.applyStyle(cell, StyleMap.progress)
      cell.note = note
    } else if (status === OperationProgress.Success) {
      this.applyStyle(cell, StyleMap.success)
      cell.note = note
    } else if (status === OperationProgress.Failure) {
      this.applyStyle(cell, StyleMap.danger)
      cell.note = note
    } else if (status === OperationProgress.NoOp) {
      this.applyStyle(cell, StyleMap.valid)
      cell.note = ''
    }
    this.scheduleSave(sheet)
  }

  applyStyle(cell: GoogleSpreadsheetCell, style: CellStyle): void {
    cell.backgroundColor = style.backgroundColor
    cell.textFormat = style.textFormat
  }
}

interface CellStyle {
  backgroundColor: Color
  textFormat: TextFormat
}

interface CellStyleMap {
  [key: string]: CellStyle
}

const StyleMap: CellStyleMap = {
  danger: {
    backgroundColor: { red: 1.0, green: 0.0, blue: 0.0, alpha: 1.0 },
    textFormat: {
      foregroundColor: { red: 1.0, green: 1.0, blue: 1.0, alpha: 1.0 },
    },
  },
  success: {
    backgroundColor: { red: 1.0, green: 1.0, blue: 1.0, alpha: 1.0 },
    textFormat: {
      foregroundColor: { red: 0.0, green: 0.25, blue: 0.0, alpha: 1.0 },
    },
  },
  progress: {
    backgroundColor: { red: 1.0, green: 1.0, blue: 0.75, alpha: 1.0 },
    textFormat: {
      foregroundColor: { red: 0.0, green: 0.0, blue: 0.0, alpha: 1.0 },
    },
  },
  valid: {
    backgroundColor: { red: 1.0, green: 1.0, blue: 1.0, alpha: 1.0 },
    textFormat: {
      foregroundColor: { red: 0.0, green: 0.0, blue: 0.0, alpha: 1.0 },
    },
  },
}
