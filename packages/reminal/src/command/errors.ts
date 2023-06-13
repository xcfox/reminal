import type { Command, CommandArgment, CommandOption } from '..'
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

export class ArgmentError extends Error {
  meta: {
    incomingValue: any
    argment: CommandArgment<any>
    type: OptionErrorType
    command: Command<any, any>
  }
  constructor(message: string, meta: ArgmentError['meta']) {
    super(message)
    this.name = 'ValidateError'
    this.meta = meta
  }
}

export function validate<
  Options extends Record<string, unknown> | void = void,
  Argments extends unknown[] = []
>(
  command: Command<Options, Argments>,
  {
    options,
    argments: argmentsInput,
  }: {
    options: Options
    argments: Argments
  }
): {
  options: Options
  argments: Argments
} {
  const errors: Error[] = []
  // ensure argments type
  const argments = argmentsInput.slice().filter((s) => s !== '')
  command.meta.argments?.forEach((argmentMeta, i) => {
    argmentMeta.type ??= String
    const argI = argments[i]
    if (argmentMeta.type === Number) {
      const value = argI ?? argmentMeta.default
      if (value == null) {
        errors.push(
          new ArgmentError(
            `argment ${argmentMeta.name} must be number, but got ${argI}`,
            {
              incomingValue: undefined,
              argment: argmentMeta,
              type: OptionErrorType.lack,
              command,
            }
          )
        )
      }
      argments[i] = Number(argI ?? argmentMeta.default)
      if (Number.isNaN(argments[i])) {
        errors.push(
          new ArgmentError(
            `argment ${argmentMeta.name} must be number, but got ${argI}`,
            {
              incomingValue: argments[i],
              argment: argmentMeta,
              type: OptionErrorType.wrongType,
              command,
            }
          )
        )
      }
    } else if (argmentMeta.type === String) {
      const value = argI ?? argmentMeta.default
      if (value == null) {
        errors.push(
          new ArgmentError(
            `argment ${argmentMeta.name} must be string, but got ${argI}`,
            {
              incomingValue: undefined,
              argment: argmentMeta,
              type: OptionErrorType.lack,
              command,
            }
          )
        )
      }
      argments[i] = String(value)
    } else if (argmentMeta.type === Boolean) {
      const value = argI ?? argmentMeta.default
      if (value == null) {
        errors.push(
          new ArgmentError(
            `argment ${argmentMeta.name} must be boolean, but got ${argI}`,
            {
              incomingValue: undefined,
              argment: argmentMeta,
              type: OptionErrorType.lack,
              command,
            }
          )
        )
      }
      argments[i] = Boolean(value)
    } else if (argmentMeta.type === Array) {
      let argmentsJ = argments.slice(i)
      if (argmentsJ.length === 0 && argmentMeta.default)
        argmentsJ = argmentMeta.default
      argmentsJ.forEach((argJ, j) => {
        if (argmentMeta.type[0] === Number) {
          argments[i + j] = Number(argJ)
          if (Number.isNaN(argments[i + j])) {
            errors.push(
              new ArgmentError(
                `argment ${i + j} must be number, but got ${argJ}`,
                {
                  incomingValue: undefined,
                  argment: argmentMeta,
                  type: OptionErrorType.lack,
                  command,
                }
              )
            )
          }
        } else if (argmentMeta.type[0] === String) {
          argments[i + j] = String(argJ)
        } else if (argmentMeta.type[0] === Boolean) {
          argments[i + j] = Boolean(argJ)
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
  return { options, argments } as any
}
