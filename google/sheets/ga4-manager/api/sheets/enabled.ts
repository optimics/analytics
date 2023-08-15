import type { Worksheet } from './Worksheet.d.ts'

import { ConfigSheet } from './config.js'
import { ConversionEventsSheet } from './conversionEvents.js'
import { CustomDimensionsSheet } from './customDimensions.js'
import { CustomMetricsSheet } from './customMetrics.js'

export const sheetTypes: typeof Worksheet[] = [
  ConfigSheet,
  CustomDimensionsSheet,
  CustomMetricsSheet,
  ConversionEventsSheet,
]
