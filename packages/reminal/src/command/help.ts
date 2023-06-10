import { createElement } from 'react'
import { Command } from '.'
import { CommandGroup } from './group'

export const helpCommand = new Command('help')
  .description('Show help documents')
  .alias('h', '?')
  .argment('command', 'The command to show help documents', { type: [String] })
  .action(({ command, reminal, argments }) => {
    const subCommandNames = argments.slice()
    if (command.parent && subCommandNames.length) {
      const subcommand = getSubCommand(command.parent, subCommandNames)
      if (!subcommand)
        throw new Error(
          `Command not found: ${[
            ...command.parent.getFullName(),
            ...subCommandNames,
          ].join(' ')}`
        )
      return createElement(reminal.renders.HelpRender, {
        text: subcommand?.getHelp(),
      })
    }
    const help = command.parent?.getHelp()
    if (!help) return
    return createElement(reminal.renders.HelpRender, { text: help })
  })

function getSubCommand(
  parent: CommandGroup,
  names: string[]
): Command<void, []> | undefined {
  const subcommand = parent.map.get(names[0])
  if (subcommand instanceof CommandGroup) {
    return getSubCommand(subcommand, names.slice(1))
  }
  return subcommand
}
