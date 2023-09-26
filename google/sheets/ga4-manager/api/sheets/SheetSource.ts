import type { StatusReporter } from '../status.d.ts'
import type {
  AnalyticsPropertyState,
  AnalyticsState,
  Credentials,
  EntityConfig,
  ObjectMutationScope,
} from '../types.d.ts'
import type { Worksheet } from './Worksheet.d.ts'

import camelCase from 'camelcase'

import { MutationScope, composeScope } from '../types.js'
import { NoSheetError } from './Worksheet.js'
import { sheetTypes } from './enabled.js'
import { JWT } from 'google-auth-library'
import { GoogleSpreadsheet } from 'google-spreadsheet'

interface SheetSourceOptions {
  credentials: Credentials
  docId: string
  reporter?: StatusReporter
}

export class SheetSource {
  credentials: Credentials
  doc: GoogleSpreadsheet
  entityConfig: EntityConfig = {
    customDimension: {},
    customMetric: {},
  }
  mutationScopes: ObjectMutationScope[] = []
  reporter?: StatusReporter

  constructor({ docId, credentials, reporter }: SheetSourceOptions) {
    const auth = new JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })
    this.doc = new GoogleSpreadsheet(docId, auth)
    this.credentials = credentials
    this.reporter = reporter
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

  async connect(): Promise<SheetSource> {
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

  mergeConfigs(configs: EntityConfig[]): EntityConfig {
    return configs.reduce(
      (aggr, cfg) => Object.assign(aggr, cfg),
      {} as EntityConfig,
    )
  }

  async parseState(): Promise<AnalyticsState> {
    const sheets = await this.extractSheets()
    const configs = await Promise.all(
      sheets.map((sheet) => sheet.parseConfig()),
    )
    this.entityConfig = this.mergeConfigs(
      configs.filter(Boolean) as EntityConfig[],
    )
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
