import React, { memo, useCallback, useContext, useMemo, useState } from 'react'
import { createContext } from 'react'
import { Command } from '../command'
import { CommandGroup } from '../command/group'

export interface ReminalController {
  root: CommandGroup
  execute: (command: string) => void
  addLine: (line: React.ReactNode) => void
  clearLines: () => void
}

export const reminalContext = createContext<ReminalController>({
  root: new CommandGroup(''),
  execute: () => undefined,
  addLine: () => undefined,
  clearLines: () => undefined,
})

export const linesContext = createContext<React.ReactNode[]>([])

export const inputValueContext = createContext<string>('')

export const setInputValueContext = createContext<
  React.Dispatch<React.SetStateAction<string>>
>(() => undefined)

export function useReminal() {
  return useContext(reminalContext)
}

export interface ProviderProps {
  commands?: Command<any, any>[] | CommandGroup
}

export const Provider = memo<React.PropsWithChildren<ProviderProps>>(
  ({ children, commands }) => {
    const root = useMemo(() => {
      if (commands instanceof CommandGroup) return commands
      const root = new CommandGroup('')
      commands?.forEach((command) => root.add(command))
      return root
    }, [commands])

    const [inputValue, setInputValue] = useState('')

    const { lines, execute, addLine, clearLines } = useReminalLines(root)

    return (
      <linesContext.Provider value={lines}>
        <reminalContext.Provider value={{ execute, addLine, clearLines, root }}>
          <setInputValueContext.Provider value={setInputValue}>
            <inputValueContext.Provider value={inputValue}>
              {children}
            </inputValueContext.Provider>
          </setInputValueContext.Provider>
        </reminalContext.Provider>
      </linesContext.Provider>
    )
  }
)

export function useReminalLines(root: CommandGroup) {
  const [lines, setLines] = useState<React.ReactNode[]>([])

  const addLine = useCallback((line: React.ReactNode) => {
    setLines((lines) => [...lines, line])
  }, [])

  const clearLines = useCallback(() => {
    setLines([])
  }, [])

  const execute = useCallback(
    async (command: string) => {
      const reminal = { execute, addLine, clearLines, root }
      const answer = await root.exec(command, reminal)
      if (answer) reminal.addLine(answer)
    },
    [addLine, clearLines, root]
  )

  return { lines, execute, addLine, clearLines }
}
