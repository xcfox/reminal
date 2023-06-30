import type { Command, CommandGroup, OptionType } from '../command'
import { flattenGroup } from './flatten-group'

export class SchemaBuilder {
  commandMap: Map<string, Command<any, any>> = new Map()
  constructor(commands: (Command<any, any> | CommandGroup)[] | CommandGroup) {
    flattenGroup(commands).forEach((cmd) =>
      this.commandMap.set(cmd.getFullName().join('__'), cmd)
    )
  }
  buildJsonSchema() {
    return Array.from(this.commandMap.entries()).map(([name, c]) => {
      const description = c.meta.description
      const p: Record<string, any> | undefined = {
        type: 'object',
        properties: {},
      }
      if (c.meta.args?.length) {
        const required: string[] = []
        const args = {
          type: 'object',
          properties: c.meta.args.reduce((properties, arg) => {
            const schema: Record<string, any> = optionTypeToSchema(arg.type)
            if (arg.description) schema.description = arg.description
            if (arg.default !== undefined) {
              schema.default = arg.default
            } else {
              required.push(arg.name)
            }
            properties[arg.name] = schema
            return properties
          }, {} as Record<string, any>),
          required,
        }
        p.properties.arguments = args
      }
      if (c.meta.options?.length) {
        const required: string[] = []
        const options = {
          type: 'object',
          properties: c.meta.options.reduce((properties, option) => {
            const schema: Record<string, any> = optionTypeToSchema(option.type)
            if (option.description) schema.description = option.description
            if (option.default !== undefined) {
              schema.default = option.default
            } else {
              required.push(option.name)
            }
            properties[option.name] = schema
            return properties
          }, {} as Record<string, any>),
          required,
        }
        p.properties.options = options
      }
      return {
        name,
        description,
        parameters: p,
      }
    })
  }
  commandFromArguments(
    name: string,
    params:
      | string
      | { options?: Record<string, any>; arguments?: Record<string, any> }
  ): string {
    const cmd = this.commandMap.get(name)
    if (!cmd) return ''
    const parameters = typeof params === 'string' ? JSON.parse(params) : params
    const args = cmd.meta.args?.map((arg) => {
      const value = parameters.arguments?.[arg.name]
      if (value === undefined) return ''
      return value
    })
    const options = cmd.meta.options?.map((option) => {
      const value = parameters.options?.[option.name]
      if (value === undefined) return ''
      return `--${option.name} ${value}`
    })
    return [name.replace(/__/g, ' '), args?.join(' '), options?.join(' ')].join(
      ' '
    )
  }
}

function optionTypeToSchema(optionType?: OptionType): {
  type: 'string' | 'boolean' | 'number' | 'array'
  items?: {
    type: 'string' | 'boolean' | 'number'
  }
} {
  if (optionType === String || optionType === undefined) {
    return { type: 'string' }
  } else if (optionType === Number) {
    return { type: 'number' }
  } else if (optionType === Boolean) {
    return { type: 'boolean' }
  } else if (Array.isArray(optionType)) {
    return {
      type: 'array',
      items: optionTypeToSchema(optionType[0]) as any,
    }
  }
  return { type: 'string' }
}
