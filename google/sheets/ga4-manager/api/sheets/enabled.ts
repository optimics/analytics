import type { Worksheet } from './Worksheet.d.ts'

import { ConversionEventsSheet } from './conversionEvents.js'
import { CustomDimensionsSheet } from './customDimensions.js'
import { CustomMetricsSheet } from './customMetrics.js'

export const sheetTypes: typeof Worksheet[] = [
  CustomDimensionsSheet,
  CustomMetricsSheet,
  ConversionEventsSheet,
]
