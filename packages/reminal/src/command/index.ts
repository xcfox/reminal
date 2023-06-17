import { ReminalController } from '../context'
import React, { createElement } from 'react'
import parse from 'yargs-parser/browser'
import { CommandGroup } from './group'
import { notNil } from '../utils/notNil'
import { validate } from './errors'

export * from './group'

export type OptionType =
  | typeof String
  | typeof Boolean
  | typeof Number
  | [typeof String]
  | [typeof Number]
  | [typeof Boolean]

export interface CommandOption<
  T extends OptionType = typeof String,
  Required extends boolean | undefined = false,
  Default extends CommandOptionType<T> | undefined = undefined
> {
  name: string
  type?: T
  required?: Required
  description?: string
  default?: Default
  alias?: string[]
}

export type CommandArgument<T extends OptionType = typeof String> = Omit<
  CommandOption<T, any, CommandOptionType<T>>,
  'alias' | 'required'
>

export interface CommandMeta<
  Options extends Record<string, unknown> | void = void,
  Arguments extends unknown[] = unknown[]
> {
  name: string
  alias?: string[]
  description?: string
  options?: CommandOption<OptionType, any, any>[]
  args?: CommandArgument<any>[]
  action?: CommandAction<Options, Arguments>
}

export interface CommandContext {
  group: CommandGroup[]
  commandRaw: string
}

export type CommandAction<
  Options extends Record<string, unknown> | void = void,
  Arguments extends unknown[] = unknown[]
> = (args: {
  options: Options
  args: Arguments
  reminal: ReminalController
  command: Command<Options, Arguments>
}) => Promise<React.ReactNode | void> | React.ReactNode | void

export class Command<
  Options extends Record<string, unknown> | void = void,
  Arguments extends unknown[] = []
> {
  meta: CommandMeta<Options, Arguments>
  constructor(name: string) {
    this.meta = { name }
  }
  parent?: CommandGroup

  getFullName(): string[] {
    return [...(this.parent?.getFullName() ?? []), this.meta.name]
  }

  /** Get a deep copy of the command */
  fork() {
    const command = new Command<Options, Arguments>(this.meta.name)
    command.meta = { ...this.meta }
    return command
  }

  /** Generate help documents according to meta */
  getHelp(): string {
    const fullName = this.getFullName().join(' ')
    const help = []

    if (fullName) {
      help.push(`${fullName} - ${this.meta.description ?? ''}`)
      help.push('')
    }

    help.push(
      'Usage:',
      `  ${fullName} ${
        this.meta.args?.map((arg) => `<${arg.name}>`).join(' ') ?? ''
      } ${this.meta.options?.length ? '[options]' : ''}`
    )

    if (this.meta.args?.length) {
      help.push('')
      help.push('Arguments:')
      help.push(
        ...(this.meta.args?.map((arg) => {
          const name = arg.name
          const description = arg.description ?? ''
          let argumentH = `  ${name}`
          argumentH += ` - ${description}`
          return argumentH
        }) ?? [])
      )
    }

    if (this.meta.options?.length) {
      help.push('')
      help.push('Options:')
      help.push(
        ...this.meta.options.map((opt) => {
          const name = opt.name
          const alias = opt.alias?.join(', ') ?? ''
          const description = opt.description ?? ''
          let optionH = `  ${name}`
          if (alias) optionH += ` (${alias})`
          optionH += ` - ${description}`
          return optionH
        })
      )
    }

    return help.filter(notNil).join('\n')
  }

  name(name: string) {
    this.meta.name = name
    return this
  }
  description(description: string) {
    this.meta.description = description
    return this
  }

  alias(...alias: string[]) {
    this.meta.alias ??= []
    this.meta.alias.push(...alias)
    return this
  }

  option<
    N extends string,
    T extends OptionType = typeof String,
    Required extends boolean | undefined = false,
    Default extends CommandOptionType<T> | undefined = undefined
  >(
    name: N,
    description: string,
    options?: Omit<CommandOption<T, Required, Default>, 'name' | 'description'>
  ) {
    const option = { name, description, ...options }
    this.meta.options ??= []
    this.meta.options.push(option)
    return this as unknown as Command<
      Merge<
        Options,
        Required extends true
          ? DeepRecord<N, CommandOptionType<T>>
          : Default extends undefined
          ? DeepRecord<N, CommandOptionType<T> | undefined>
          : DeepRecord<N, CommandOptionType<T>>
      >,
      Arguments
    >
  }

  argument<T extends OptionType = typeof String>(
    name: string,
    description: string,
    options?: Omit<CommandArgument<T>, 'name' | 'description'>
  ) {
    const argument = { name, description, ...options }
    this.meta.args ??= []
    const last = this.meta.args[this.meta.args.length - 1]
    if (last && Array.isArray(last.type)) {
      throw new Error('Cannot add argument after variadic argument')
    }
    this.meta.args.push(argument)
    return this as unknown as Command<
      Options,
      ConcatTuple<Arguments, CommandArgumentType<T>>
    >
  }

  action(fn: CommandAction<Options, Arguments>) {
    this.meta.action = fn
    return this
  }

  /** passe args by yargs-parser */
  parse(argsI: string[] | string | TemplateStringsArray): {
    options: Options
    arguments: Arguments
  } {
    const args = isTemplateStringsArray(argsI) ? argsI.join(' ') : argsI
    const parserOptions = {} as parse.Options
    this.meta.options?.forEach((option) => {
      if (option.type === String || option.type === undefined) {
        parserOptions.string ??= []
        parserOptions.string.push(option.name)
      } else if (option.type === Number) {
        parserOptions.number ??= []
        parserOptions.number.push(option.name)
      } else if (option.type === Boolean) {
        parserOptions.boolean ??= []
        parserOptions.boolean.push(option.name)
      } else if (Array.isArray(option.type)) {
        parserOptions.array ??= []
        const array = parserOptions.array as Array<{
          key: string
          boolean?: boolean | undefined
          number?: boolean | undefined
        }>
        if (option.type[0] === String) {
          array.push({ key: option.name })
        } else if (option.type[0] === Number) {
          array.push({ key: option.name, number: true })
        } else if (option.type[0] === Boolean) {
          array.push({ key: option.name, boolean: true })
        }
      }

      if (option.alias) {
        parserOptions.alias ??= {}
        parserOptions.alias[option.name] = option.alias
      }
      if (option.default) {
        parserOptions.default ??= {}
        parserOptions.default[option.name] = option.default
      }
    })

    const { _: positional, ...options } = parse(args, parserOptions)
    return { arguments: positional, options } as any
  }
  /** validate incoming options and ensure arguments type */
  validate(opt: { options: Options; arguments: Arguments }): {
    options: Options
    arguments: Arguments
  } {
    return validate(this, opt)
  }

  exec(positional: string | string[], reminal: ReminalController) {
    const text = `${this.getFullName().join(' ')} ${
      positional instanceof Array ? positional.join(' ') : positional
    }`
    reminal.addLine(createElement(reminal.renders.HistoryRender, { text }))

    const { options, arguments: args } = this.validate(this.parse(positional))
    return this.meta.action?.({
      options,
      args,
      reminal,
      command: this,
    })
  }
}

export const command = (name: string) => new Command(name)

type ConcatTuple<T extends unknown[], U extends unknown[]> = [...T, ...U]

type Merge<TLeft, TRight> = TLeft extends void
  ? TRight
  : TRight extends void
  ? TLeft
  : TLeft & TRight

type UnwrapArray<T> = T extends (infer U)[] ? U : T

type CommandOptionType<T extends OptionType> = T extends Array<any>
  ? ReturnType<UnwrapArray<T>>[]
  : ReturnType<UnwrapArray<T>>

type CommandArgumentType<T extends OptionType> = T extends Array<any>
  ? ReturnType<UnwrapArray<T>>[]
  : [ReturnType<UnwrapArray<T>>]

function isTemplateStringsArray(
  value: string[] | string | TemplateStringsArray
): value is TemplateStringsArray {
  if (value instanceof Array)
    typeof (value as TemplateStringsArray).raw !== 'undefined'
  return false
}

type DeepRecord<K extends string, V> = K extends `${infer T1}.${infer T2}`
  ? { [P in T1]: DeepRecord<T2, V> }
  : { [P in K]: V }

export * from './errors'
