import { Command } from '.'
import { ReminalController } from '../context'

export interface CommandGroupMeta {
  name: string
  alias?: string[]
  description?: string
}

export class CommandGroup {
  meta: CommandGroupMeta
  map: Map<string, Command | CommandGroup> = new Map()
  commands: (Command | CommandGroup)[] = []
  constructor(name: string) {
    this.meta = { name }
  }

  parent?: CommandGroup

  getFullName(): string[] {
    return [...(this.parent?.getFullName() ?? []), this.meta.name]
  }

  /** Generate help documents according to meta and subcommands */
  getHelp(): string[] {
    const fullName = this.getFullName().join(' ')
    const help = [
      `${fullName} - ${this.meta.description ?? ''}`,
      '',
      'Usage:',
      `  ${fullName} <command> [options]`,
      '',
      'Commands:',
      ...this.commands.map((cmd) => {
        const name = cmd.meta.name
        const alias = cmd.meta.alias?.join(', ') ?? ''
        const description = cmd.meta.description ?? ''
        return `  ${name} (${alias}) - ${description}`
      }),
    ]
    return help
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
  add(...commands: (Command | CommandGroup)[]) {
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
  async exec(
    command: string | string[],
    reminal: ReminalController
  ): Promise<void | React.ReactNode> {
    const [cmd, ...args] = Array.isArray(command) ? command : command.split(' ')

    if (cmd === 'help') {
      return reminal.addLine(this.getHelp())
    }

    const target = this.map.get(cmd)
    if (target instanceof Command) {
      return await target.exec(args, reminal)
    } else if (target instanceof CommandGroup) {
      return target.exec(args.join(' '), reminal)
    } else {
      return reminal.addLine(`Command ${cmd} not found`)
    }
  }
}

export const commandGroup = (name: string) => {
  return new CommandGroup(name)
}
