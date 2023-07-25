import { configureBrowser } from './__jest__/puppeteer'
import { TextDecoder, TextEncoder } from 'util'

const debug = Boolean(process.env.TEST_DEBUG)
const graphic = Boolean(process.env.TEST_GRAPHIC)
const browserRef = configureBrowser({ debug, graphic })

Object.assign(global, { browserRef, TextDecoder, TextEncoder })
