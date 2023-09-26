import type { JSONSchemaType } from 'ajv'
import type { Request, Response } from 'express'

import { AnalyticsAdmin } from './analytics.js'
import { cors, validatedBody } from './http.js'
import { createPlan, printPlan } from './plan.js'
import { SheetReporter } from './sheets/SheetReporter.js'
import { SheetSource } from './sheets/SheetSource.js'
import { NoSheetError } from './sheets/Worksheet.js'
import { Credentials } from './types.js'
import { readFile } from 'fs/promises'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

interface RequestBody {
  docId: string
}

const requestSchema = await import('./requestSchema.json', {
  assert: { type: 'json' },
})

async function readFirstFile(...files: string[]) {
  for (const file of files) {
    try {
      return JSON.parse(await readFile(file, 'utf-8'))
    } catch (_e) {
      // Reading failed. Intentionally skip the file
    }
  }
}

async function getCredentials(): Promise<Credentials> {
  // @TODO: Read this from environment and prefer running service account
  const baseDir = dirname(fileURLToPath(import.meta.url))
  try {
    return JSON.parse(String(process.env.GOOGLE_CREDENTIALS))
  } catch (_e) {
    return readFirstFile(
      resolve(baseDir, '.credentials'),
      resolve(baseDir, '..', '.credentials'),
      resolve(baseDir, '..', '..', '.credentials'),
      resolve(baseDir, '..', '..', '..', '.credentials'),
      resolve(String(process.env.GOOGLE_APPLICATION_CREDENTIALS)),
      resolve(
        String(process.env.HOME),
        '.config',
        'gcloud',
        'application_default_credentials.json',
      ),
      resolve(
        String(process.env.HOME),
        'gcloud',
        'application_default_credentials.json',
      ),
    )
  }
}

function authorized(
  _target: RequestDispatcher,
  _propertyKey: string,
  descriptor: PropertyDescriptor,
) {
  const fn = descriptor.value
  descriptor.value = async (req: Request, res: Response) => {
    try {
      req.body.credentials = await getCredentials()
    } catch (_e) {
      req.body.credentials = undefined
    }
    return fn(req, res)
  }
}

function withSheet(
  _target: RequestDispatcher,
  _propertyKey: string,
  descriptor: PropertyDescriptor,
) {
  const fn = descriptor.value
  descriptor.value = async (req: Request, res: Response) => {
    try {
      req.body.sheet = new SheetSource({
        docId: req.body.docId,
        credentials: req.body.credentials,
      })
      await req.body.sheet.connect()
      return fn(req, res)
    } catch (e) {
      console.error(e)
      res.status(422).json({
        message: `Cannot access the Google Spreadsheet document. The API responded with "${e.message}"`,
        docId: req.body.docId,
      })
    }
  }
  return descriptor
}

function withResponse(
  _target: RequestDispatcher,
  _propertyKey: string,
  descriptor: PropertyDescriptor,
) {
  const fn = descriptor.value
  descriptor.value = async (req: Request, res: Response) => {
    try {
      const body = await fn(req, res)
      res.send(body)
    } catch (err) {
      console.error(err)
      res.status(500).send({
        message: err.message,
      })
    }
  }
  return descriptor
}

function withReporter(
  _target: RequestDispatcher,
  _propertyKey: string,
  descriptor: PropertyDescriptor,
) {
  const fn = descriptor.value
  descriptor.value = async (req: Request, res: Response) => {
    req.body.reporter = new SheetReporter({ sheet: req.body.sheet })
    req.body.sheet.reporter = req.body.reporter
    try {
      return fn(req, res)
    } finally {
      await new Promise<void>((resolve) =>
        req.body.reporter.waitUntilFlushed(resolve),
      )
    }
  }
}

function withSheetState(
  _target: RequestDispatcher,
  _propertyKey: string,
  descriptor: PropertyDescriptor,
) {
  const fn = descriptor.value
  descriptor.value = async (req: Request, res: Response) => {
    try {
      req.body.sheetState = await req.body.sheet.parseState()
      req.body.scopes = req.body.sheet.getMutationScopes()
      if (req.body.scopes.length === 0) {
        return res.status(200).json({ message: 'No work scopes detected' })
      }
      return fn(req, res)
    } catch (e) {
      if (e instanceof NoSheetError) {
        return res.status(200).json({ message: 'Nothing to do' })
      }
      throw e
    }
  }
  return descriptor
}

interface StatusReport {
  message: string
  operations: number
  success: number
  failure: number
}

class RequestDispatcher {
  @cors('POST')
  @validatedBody(requestSchema.default as JSONSchemaType<RequestBody>)
  @authorized
  @withResponse
  @withSheet
  @withReporter
  @withSheetState
  async request(req: Request, _res: Response): Promise<StatusReport> {
    const reporter = req.body.reporter
    const ga = new AnalyticsAdmin({
      credentials: req.body.credentials,
      reporter,
      scopes: req.body.scopes,
    })
    reporter.log(`Scanning document ${req.body.docId}`)
    const state = await ga.readState()
    const plan = await createPlan(
      state,
      req.body.sheetState,
      req.body.scopes,
      reporter,
    )
    printPlan(plan)
    await ga.executePlan(plan)
    return {
      message: reporter.counter.failure === 0 ? 'success' : 'failure',
      operations: plan.size,
      success: reporter.counter.success,
      failure: reporter.counter.failure,
    }
  }
}

export function request(req: Request, res: Response): void {
  new RequestDispatcher().request(req, res)
}
