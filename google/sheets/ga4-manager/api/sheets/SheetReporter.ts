import type { AnalyticsOperation } from '../types.d.ts'
import type { SheetSource } from './SheetSource.d.ts'
import type {
  GoogleSpreadsheetCell,
  GoogleSpreadsheetWorksheet,
} from 'google-spreadsheet'

import { StatusReporter } from '../status.js'
import { OperationProgress } from '../types.js'
import { formatDate } from './Worksheet.js'

interface SheetReporterOptions {
  sheet: SheetSource
}

// Unexported CopyPasted types from google-spreadsheet
type Color = {
  red: number
  green: number
  blue: number
  alpha?: number
}

type ThemeColorType =
  | 'TEXT'
  | 'BACKGROUND'
  | 'ACCENT1'
  | 'ACCENT2'
  | 'ACCENT3'
  | 'ACCENT4'
  | 'ACCENT5'
  | 'ACCENT6'
  | 'LINK'
type ColorStyle =
  | { Color: Color }
  | {
      themeColor: ThemeColorType
    }

type TextFormat = {
  foregroundColor?: Color
  foregroundColorStyle?: ColorStyle
  fontFamily?: string
  fontSize?: number
  bold?: boolean
  italic?: boolean
  strikethrough?: boolean
  underline?: boolean
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

const SAVE_TIMEOUT_DEBOUNCE = 200
const SAVE_TIMEOUT_REGENERATE = 60000

export class SheetReporter extends StatusReporter {
  lastSave?: number
  sheet: SheetSource
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
