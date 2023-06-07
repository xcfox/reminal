import React, { useContext, useEffect, useMemo } from 'react'
import { Command, CommandGroup, inputValueContext, useReminal } from '..'
import { commandScore } from '../utils/command-score'

export const TipBox = React.memo<{
  onTipsChange?: (tips: CommandAbstract[]) => void
}>(({ onTipsChange }) => {
  const tips = useTips()

  useEffect(() => {
    onTipsChange?.(tips)
    return () => {
      onTipsChange?.([])
    }
  }, [onTipsChange, tips])

  return (
    <div>
      {tips.map((tip) => (
        <div key={tip.name}>
          <span>{tip.name}</span>
          {tip.commands.meta.description && (
            <span style={{ marginLeft: '1em' }}>
              {` - ${tip.commands.meta.description}`}
            </span>
          )}
        </div>
      ))}
    </div>
  )
})

export function useTips() {
  const [input] = useContext(inputValueContext)
  const { root } = useReminal()
  const commandList = useMemo(() => {
    return flatGroup(root)
  }, [root])

  return useMemo(
    () =>
      commandList
        .map((cmd) => ({
          ...cmd,
          score: commandScore(cmd.name, input),
        }))
        .filter((cmd) => cmd.score > 0)
        .sort((a, b) => b.score - a.score),
    [commandList, input]
  )
}

export interface CommandAbstract {
  name: string
  commands: Command<any, any> | CommandGroup
}

export function flatGroup(group: CommandGroup): CommandAbstract[] {
  const commands: CommandAbstract[] = []
  for (const cmd of group.commands) {
    commands.push({
      name: cmd.getFullName().join(' '),
      commands: cmd,
    })
    if (cmd instanceof CommandGroup) {
      commands.push(...flatGroup(cmd))
    }
  }
  return commands
}
