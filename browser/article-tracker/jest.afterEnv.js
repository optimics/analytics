import { configureBrowser } from './__jest__/puppeteer'
import { TextDecoder, TextEncoder } from 'util'

const debug = false
const graphic = false
const browserRef = configureBrowser({ debug, graphic })

Object.assign(global, { browserRef, TextDecoder, TextEncoder })
