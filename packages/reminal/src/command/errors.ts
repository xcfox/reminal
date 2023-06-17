import type { Command, CommandArgument, CommandOption } from '..'
import { flattenObject } from '../utils/flatten-object'
import { recordBy } from '../utils/record-by'

export enum OptionErrorType {
  lack = 'the option is required but not found',
  undefine = 'the option is not defined',
  wrongType = 'the option is not the right type',
}

export class OptionError extends Error {
  meta: {
    incomingValue: any
    option: CommandOption<any, any, any>
    type: OptionErrorType
    command: Command<any, any>
  }
  constructor(message: string, meta: OptionError['meta']) {
    super(message)
    this.name = 'ValidateError'
    this.meta = meta
  }
}

export class CommandNotFoundError extends Error {
  fullName: string
  constructor(fullName: string) {
    super(`command ${fullName} not found`)
    this.name = 'CommandNotFoundError'
    this.fullName = fullName
  }
}

export class ArgumentError extends Error {
  meta: {
    incomingValue: any
    argument: CommandArgument<any>
    type: OptionErrorType
    command: Command<any, any>
  }
  constructor(message: string, meta: ArgumentError['meta']) {
    super(message)
    this.name = 'ValidateError'
    this.meta = meta
  }
}

export function validate<
  Options extends Record<string, unknown> | void = void,
  Arguments extends unknown[] = []
>(
  command: Command<Options, Arguments>,
  {
    options,
    arguments: argumentsInput,
  }: {
    options: Options
    arguments: Arguments
  }
): {
  options: Options
  arguments: Arguments
} {
  const errors: Error[] = []
  // ensure arguments type
  const args = argumentsInput.slice().filter((s) => s !== '')
  command.meta.args?.forEach((argumentMeta, i) => {
    argumentMeta.type ??= String
    const argI = args[i]
    if (argumentMeta.type === Number) {
      const value = argI ?? argumentMeta.default
      if (value == null) {
        errors.push(
          new ArgumentError(
            `argument ${argumentMeta.name} must be number, but got ${argI}`,
            {
              incomingValue: undefined,
              argument: argumentMeta,
              type: OptionErrorType.lack,
              command,
            }
          )
        )
      }
      args[i] = Number(argI ?? argumentMeta.default)
      if (Number.isNaN(args[i])) {
        errors.push(
          new ArgumentError(
            `argument ${argumentMeta.name} must be number, but got ${argI}`,
            {
              incomingValue: args[i],
              argument: argumentMeta,
              type: OptionErrorType.wrongType,
              command,
            }
          )
        )
      }
    } else if (argumentMeta.type === String) {
      const value = argI ?? argumentMeta.default
      if (value == null) {
        errors.push(
          new ArgumentError(
            `argument ${argumentMeta.name} must be string, but got ${argI}`,
            {
              incomingValue: undefined,
              argument: argumentMeta,
              type: OptionErrorType.lack,
              command,
            }
          )
        )
      }
      args[i] = String(value)
    } else if (argumentMeta.type === Boolean) {
      const value = argI ?? argumentMeta.default
      if (value == null) {
        errors.push(
          new ArgumentError(
            `argument ${argumentMeta.name} must be boolean, but got ${argI}`,
            {
              incomingValue: undefined,
              argument: argumentMeta,
              type: OptionErrorType.lack,
              command,
            }
          )
        )
      }
      args[i] = Boolean(value)
    } else if (argumentMeta.type === Array) {
      let argumentsJ = args.slice(i)
      if (argumentsJ.length === 0 && argumentMeta.default)
        argumentsJ = argumentMeta.default
      argumentsJ.forEach((argJ, j) => {
        if (argumentMeta.type[0] === Number) {
          args[i + j] = Number(argJ)
          if (Number.isNaN(args[i + j])) {
            errors.push(
              new ArgumentError(
                `argument ${i + j} must be number, but got ${argJ}`,
                {
                  incomingValue: undefined,
                  argument: argumentMeta,
                  type: OptionErrorType.lack,
                  command,
                }
              )
            )
          }
        } else if (argumentMeta.type[0] === String) {
          args[i + j] = String(argJ)
        } else if (argumentMeta.type[0] === Boolean) {
          args[i + j] = Boolean(argJ)
        }
      })
    }
  })

  // flatten options
  const flattenOptions = flattenObject(options ?? {})

  // validate options
  const optionRecords = recordBy(command.meta.options ?? [], (m) => m.name)

  command.meta.options?.forEach((optionMeta) => {
    const option = flattenOptions[optionMeta.name]
    if (option === undefined && optionMeta.required) {
      errors.push(
        new OptionError(`option ${optionMeta.name} is required`, {
          incomingValue: undefined,
          option: optionMeta,
          type: OptionErrorType.lack,
          command,
        })
      )
      return
    }
    delete flattenOptions[optionMeta.name]
  })

  Object.entries(flattenOptions).forEach(([key, value]) => {
    errors.push(
      new OptionError(`option ${key} is not defined`, {
        incomingValue: value,
        option: optionRecords[key],
        type: OptionErrorType.undefine,
        command,
      })
    )
  })

  if (errors.length) throw errors
  return { options, arguments: args } as any
}
