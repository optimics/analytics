import type {
  ConfigRow,
  CustomDimensionConfig,
  CustomMetricConfig,
  EntityConfig,
} from '../types.d.ts'
import type { PropertyKeyMap } from './Worksheet.d.ts'
import type { GoogleSpreadsheetRow } from 'google-spreadsheet'

import camelCase from 'camelcase'

import { EntityType } from '../types.js'
import { SpreadsheetError, Worksheet } from './Worksheet.js'

export class ValidationError extends SpreadsheetError {}

export class ConfigSheet extends Worksheet {
  static titles = [
    'config',
    'ga4:config',
    'ga4:Config',
    'ga4:configuration',
    'ga4:Configuration',
  ]

  propertyKeyMap: PropertyKeyMap = {
    type: ['type'],
    name: ['name'],
    property: ['property'],
    value: ['value'],
  }

  parseEntityType(type: string): EntityType {
    const normalized = camelCase(type) as EntityType
    const types = Object.values(EntityType)
    if (types.includes(normalized)) {
      return normalized
    }
    throw new ValidationError(`Value "${type}" is not a recognized Entity Type.
                              Try one of "${types.join(', ')}"`)
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
    value: string,
  ) {
    if (property === 'scope') {
      return value.toUpperCase()
    }
    return value
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
        value,
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
    return data
  }

  async parseProperties() {
    return []
  }
}
