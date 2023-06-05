import { ReminalController } from '../context'
import React from 'react'
import parse from 'yargs-parser/browser'
import { CommandGroup } from './group'

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

export type CommandArgment<T extends OptionType = typeof String> = Omit<
  CommandOption<T>,
  'alias' | 'required'
>

export interface CommandMeta<
  Options extends Record<string, unknown> | void = void,
  Argments extends unknown[] = unknown[]
> {
  name: string
  alias?: string[]
  description?: string
  options?: CommandOption<OptionType, any, any>[]
  argments?: CommandArgment<any>[]
  action?: CommandAction<Options, Argments>
}

export interface CommandContext {
  group: CommandGroup[]
  commandRaw: string
}

export type CommandAction<Options, Argments> = (args: {
  options: Options
  argments: Argments
  reminal: ReminalController
}) => Promise<React.ReactNode | void> | React.ReactNode | void

export class Command<
  Options extends Record<string, unknown> | void = void,
  Argments extends unknown[] = []
> {
  meta: CommandMeta<Options, Argments>
  constructor(name: string) {
    this.meta = { name }
  }
  parent?: CommandGroup

  getFullName(): string[] {
    return [...(this.parent?.getFullName() ?? []), this.meta.name]
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
          ? { [P in N]: CommandOptionType<T> }
          : Default extends undefined
          ? { [P in N]?: CommandOptionType<T> }
          : { [P in N]: CommandOptionType<T> }
      >,
      Argments
    >
  }

  argment<T extends OptionType = typeof String>(
    name: string,
    description: string,
    options?: Omit<CommandArgment<T>, 'name' | 'description'>
  ) {
    const argment = { name, description, ...options }
    this.meta.argments ??= []
    this.meta.argments.push(argment)
    return this as unknown as Command<
      Options,
      ConcatTuple<Argments, CommandArgmentType<T>>
    >
  }

  action(fn: CommandAction<Options, Argments>) {
    this.meta.action = fn
    return this
  }

  /** passe args by yargs-parser */
  parse(argsI: string[] | string | TemplateStringsArray): {
    options: Options
    argments: Argments
  } {
    const args = isTemplateStringsArray(argsI) ? argsI.join(' ') : argsI
    const paserOptions = {} as parse.Options
    this.meta.options?.forEach((option) => {
      if (option.type === String || option.type === undefined) {
        paserOptions.string ??= []
        paserOptions.string.push(option.name)
      } else if (option.type === Number) {
        paserOptions.number ??= []
        paserOptions.number.push(option.name)
      } else if (option.type === Boolean) {
        paserOptions.boolean ??= []
        paserOptions.boolean.push(option.name)
      } else if (Array.isArray(option.type)) {
        paserOptions.array ??= []
        const array = paserOptions.array as Array<{
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
        paserOptions.alias ??= {}
        paserOptions.alias[option.name] = option.alias
      }
      if (option.default) {
        paserOptions.default ??= {}
        paserOptions.default[option.name] = option.default
      }
    })

    const { _: argments, ...options } = parse(args, paserOptions)
    return { argments, options } as any
  }

  exec(args: string | string[], reminal: ReminalController) {
    const { options, argments } = this.parse(args)
    reminal.addLine(`> ${this.getFullName().join(' ')} ${args}`)
    return this.meta.action?.({ options, argments, reminal })
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

type CommandArgmentType<T extends OptionType> = T extends Array<any>
  ? ReturnType<UnwrapArray<T>>[]
  : [ReturnType<UnwrapArray<T>>]

function isTemplateStringsArray(
  value: string[] | string | TemplateStringsArray
): value is TemplateStringsArray {
  if (value instanceof Array)
    typeof (value as TemplateStringsArray).raw !== 'undefined'
  return false
}
