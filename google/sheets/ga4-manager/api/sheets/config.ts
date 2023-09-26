import type {
  ConfigRow,
  CustomDimensionConfig,
  CustomMetricConfig,
  EntityConfig,
} from '../types.d.ts'
import type { PropertyKeyMap } from './Worksheet.d.ts'
import type { GoogleSpreadsheetCell, GoogleSpreadsheetRow, GoogleSpreadsheetWorksheet } from 'google-spreadsheet'

import camelCase from 'camelcase'

import { EntityType } from '../types.js'
import { SpreadsheetError, Worksheet } from './Worksheet.js'

export interface ValidationResult {
  cell: GoogleSpreadsheetCell
  sheet: GoogleSpreadsheetWorksheet
}

export class ValidationError extends SpreadsheetError {
  cell: GoogleSpreadsheetCell
  sheet: GoogleSpreadsheetWorksheet

  constructor(sheet: GoogleSpreadsheetWorksheet, cell: GoogleSpreadsheetCell, message: string) {
    super(message)
    this.cell = cell
    this.sheet = sheet
  }
}

export class ConfigError extends SpreadsheetError {
  errors: ValidationError[]

  constructor(errors: ValidationError[]) {
    super('Configuration failed')
    this.errors = errors
  }
}

enum DimensionScope {
  user = 'user',
  event = 'event',
  item = 'item',
}

export class ConfigSheet extends Worksheet {
  static titles = [
    'config',
    'ga4:config',
    'ga4:Config',
    'ga4:configuration',
    'ga4:Configuration',
  ]

  errors: ValidationError[] = []

  propertyKeyMap: PropertyKeyMap = {
    type: ['type'],
    name: ['name'],
    property: ['property'],
    value: ['value'],
  }

  parseEntityType(type: string): EntityType | null {
    const normalized = camelCase(type) as EntityType
    const types = Object.values(EntityType)
    if (types.includes(normalized)) {
      return normalized
    }
    return null
  }

  parseCustomDimensionProperty(
    _type: EntityType,
    property: string,
  ): keyof CustomDimensionConfig {
    // @TODO: Validate
    return property as keyof CustomDimensionConfig
  }

  parseCustomDimensionPropertyValue(
    _type: EntityType,
    property: keyof CustomDimensionConfig,
    cell: GoogleSpreadsheetCell
  ) {
    let value = this.parseCellValue(cell)
    if (value) {
      if (property === 'scope') {
        value = value.toUpperCase()
        if (value.toLowerCase() in DimensionScope) {
          this.reportValid(cell)
        } else {
          const allowed = Object.values(DimensionScope).map(v => `"${v}"`).join(', ')
          this.reportInvalid(new ValidationError(this.sheet, cell, `Value "${value}" is not a valid Custom Dimension Scope. Try one of: (${allowed})`))
        }
      }
    }
    return value
  }

  reportInvalid(err: ValidationError) {
    this.errors.push(err)
    if (this.doc.reporter) {
      this.doc.reporter.reportError(err)
    }
  }

  reportValid(cell: GoogleSpreadsheetCell): void {
    if (this.doc.reporter) {
      this.doc.reporter.reportValid({
        sheet: this.sheet,
        cell
      })
    }
  }

  parseCustomMetricProperty(
    _type: EntityType,
    property: string,
  ): keyof CustomMetricConfig {
    // @TODO: Validate
    return property as keyof CustomMetricConfig
  }

  parseCustomMetricPropertyValue(
    _type: EntityType,
    property: keyof CustomMetricConfig,
    value: string,
  ) {
    if (property === 'scope' || property === 'measurementUnit') {
      return value.toUpperCase()
    }
    return value
  }

  parseRow(row: GoogleSpreadsheetRow): ConfigRow | null {
    const rowIndex = row.rowNumber - 1
    const entityType = this.parsePropertyCell(rowIndex, this.headerMap.type)
    if (!entityType) {
      return null
    }
    const type = this.parseEntityType(entityType)
    const entityCell = this.getCell(rowIndex, this.headerMap.type)
    if (type) {
      this.reportValid(entityCell)
      const name = this.parsePropertyCell(rowIndex, this.headerMap.name)
      const property = this.parsePropertyCell(rowIndex, this.headerMap.property)
      const value = this.parsePropertyCell(rowIndex, this.headerMap.value)
      if (!(property && value && name)) {
        return null
      }
      if (type === EntityType.customDimension) {
        const propertyName = this.parseCustomDimensionProperty(type, property)
        const propertyValue = this.parseCustomDimensionPropertyValue(
          type,
          propertyName,
          this.getCell(rowIndex, this.headerMap.value),
        )
        return {
          type,
          name,
          [propertyName]: propertyValue,
        }
      }
      if (type === EntityType.customMetric) {
        const propertyName = this.parseCustomMetricProperty(type, property)
        const propertyValue = this.parseCustomMetricPropertyValue(
          type,
          propertyName,
          value,
        )
        return {
          type,
          name,
          [propertyName]: propertyValue,
        }
      }
    } else {
      const types = Object.values(EntityType)
      this.reportInvalid(new ValidationError(
        this.sheet,
        entityCell,
        `Value "${type}" is not a recognized Entity Type. Try one of "${types.join(', ')}"`
      ))
    }
    return null
  }

  async parseConfig(): Promise<EntityConfig> {
    await this.sheet.loadHeaderRow()
    this.headerMap = this.parseHeaders()
    await this.sheet.loadCells()
    const rows = await this.sheet.getRows()
    const data = rows.reduce(
      (aggr, row: GoogleSpreadsheetRow) => {
        const parsed = this.parseRow(row)
        if (parsed) {
          const type = aggr[parsed.type]
          if (!type[parsed.name]) {
            type[parsed.name] = parsed
          }
          Object.assign(type[parsed.name], parsed)
        }
        return aggr
      },
      {
        customDimension: {},
        customMetric: {},
      } as EntityConfig,
    )
    if (this.errors.length !== 0) {
      throw new ConfigError(this.errors)
    }
    return data
  }

  async parseProperties() {
    return []
  }
}
