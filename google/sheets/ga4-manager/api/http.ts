import Ajv, { JSONSchemaType } from 'ajv'

import type { Request, Response } from 'express'

export function cors(...allowedMethods: string[]) {
  // rome-ignore lint/suspicious/noExplicitAny: Baldy typed, but blocker
  return (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) => {
    const fn = descriptor.value
    descriptor.value = (req: Request, res: Response) => {
      res.set('Access-Control-Allow-Origin', req.get('Origin') || '*')
      res.set('Access-Control-Allow-Headers', '*')
      res.set('Access-Control-Max-Age', '3600')
      res.set(
        'Access-Control-Allow-Methods',
        ['OPTIONS', ...allowedMethods].join(', '),
      )
      if (req.method === 'OPTIONS') {
        return res.status(204).send()
      }
      if (!allowedMethods.includes(req.method)) {
        return res.status(405).send()
      }
      return fn(req, res)
    }
  }
}

// @TODO: Set type of JSONSchema
// rome-ignore lint/suspicious/noExplicitAny: Baldy typed, but blocker
export function validatedBody(schema: JSONSchemaType<any>) {
  const ajv = new Ajv.default()
  const validate = ajv.compile(schema)
  // rome-ignore lint/suspicious/noExplicitAny: Baldy typed, but blocker
  return (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) => {
    const fn = descriptor.value
    descriptor.value = (req: Request, res: Response) => {
      const valid = validate(req.body)
      if (valid) {
        return fn(req, res)
      }
      return res.status(400).json(validate.errors)
    }
    return descriptor
  }
}
