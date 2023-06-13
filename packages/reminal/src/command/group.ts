import React, { createElement } from 'react'
import { Command, CommandNotFoundError } from '.'
import { ReminalController } from '../context'
import { notNil } from '../utils/notNil'

export interface CommandGroupMeta {
  name: string
  alias?: string[]
  description?: string
}

export class CommandGroup {
  meta: CommandGroupMeta
  map: Map<string, Command | CommandGroup> = new Map()
  commands: (Command<any, any> | CommandGroup)[] = []
  constructor(name: string) {
    this.meta = { name }
  }

  parent?: CommandGroup

  getFullName(): string[] {
    return [...(this.parent?.getFullName() ?? []), this.meta.name]
  }

  /** Get a deep copy of the command */
  fork() {
    const command = new CommandGroup(this.meta.name)
    command.meta = { ...this.meta }
    command.add(...this.commands.map((cmd) => cmd.fork()))
    return command
  }

  /** Generate help documents according to meta and subcommands */
  getHelp(): string {
    const fullName = this.getFullName().join(' ')
    const help = []

    if (fullName) {
      help.push(`${fullName} - ${this.meta.description ?? ''}`)
      help.push('')
    }

    help.push('Usage:', `  ${fullName} <command> [options]`)
    help.push('')
    help.push('Commands:')
    help.push(
      ...this.commands.map((cmd) => {
        const name = cmd.meta.name
        const alias = cmd.meta.alias?.join(', ') ?? ''
        const description = cmd.meta.description ?? ''
        let commandH = `  ${name}`
        if (alias) commandH += ` (${alias})`
        commandH += ` - ${description}`
        return commandH
      })
    )

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
  add(...commands: (Command<any, any> | CommandGroup)[]) {
    commands.forEach((command) => {
      const names = [command.meta.name, ...(command.meta.alias ?? [])]
      command.parent = this
      names.forEach((name) => {
        this.map.set(name, command)
      })
    })
    this.commands.push(...commands)
    return this
  }
  remove(...commands: (Command<any, any> | CommandGroup)[]) {
    commands.forEach((command) => {
      const names = [command.meta.name, ...(command.meta.alias ?? [])]
      names.forEach((name) => {
        this.map.delete(name)
      })
    })
    this.commands = this.commands.filter((c) => !commands.includes(c))
    return this
  }

  matchCommand(command: string | string[]): Command<any, any> | undefined {
    const [cmd, ...args] = Array.isArray(command)
      ? command
      : command.trim().split(' ')
    const target = this.map.get(cmd)
    if (target instanceof Command) {
      return target
    } else if (target instanceof CommandGroup) {
      return target.matchCommand(args)
    }
  }

  async exec(
    command: string | string[],
    reminal: ReminalController
  ): Promise<void | React.ReactNode> {
    const [cmd, ...args] = Array.isArray(command)
      ? command
      : command.trim().split(' ')

    const { renders } = reminal

    const target = this.map.get(cmd)
    if (target instanceof Command) {
      return await target.exec(args, reminal)
    } else if (target instanceof CommandGroup) {
      return target.exec(args.join(' '), reminal)
    } else {
      const fullCommand = [...this.getFullName(), cmd].join(' ')
      reminal.addLine(
        createElement(renders.HistoryRender, { text: fullCommand })
      )
      const error = new CommandNotFoundError(fullCommand)
      reminal.addLine(createElement(renders.ErrorRender, { error }))
    }
  }
}

export const commandGroup = (name: string) => {
  return new CommandGroup(name)
}
