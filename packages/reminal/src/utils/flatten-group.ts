import { Command, CommandGroup } from '../command'

export function flattenGroup(
  group: (Command<any, any> | CommandGroup)[] | CommandGroup
): Command<any, any>[] {
  if (!Array.isArray(group)) {
    group = [group]
  }

  const result: Command<any, any>[] = []

  for (const command of group) {
    if (command instanceof Command) {
      result.push(command)
    } else {
      result.push(...flattenGroup(command.commands))
    }
  }

  return result
}
