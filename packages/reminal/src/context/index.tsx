import React, {
  memo,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react'
import { createContext } from 'react'
import { Command } from '../command'
import { CommandGroup } from '../command/group'
import { RenimalRenders, defaultRenders } from './TextRender'
import { Mutatable } from './Mutatable'

export interface ReminalController {
  root: CommandGroup
  execute: (command: string) => void
  addLine: (line: React.ReactNode) => void
  addMutatableLine: <T extends object>(
    Component: React.ComponentType<T>,
    props: T
  ) => (props: T) => void
  clearLines: () => void
  renders: RenimalRenders
}

export const reminalContext = createContext<ReminalController>({
  root: new CommandGroup(''),
  execute: () => undefined,
  addLine: () => undefined,
  addMutatableLine: () => () => undefined,
  clearLines: () => undefined,
  renders: defaultRenders,
})

export const linesContext = createContext<React.ReactNode[]>([])

export const executingContext = createContext(false)

export const scrollToBottomContext = createContext<() => void>(() => undefined)

export const historyContext = createContext<React.MutableRefObject<string[]>>({
  current: [],
})

export const inputValueContext = createContext<
  ReturnType<typeof useInputValue>
>({
  value: '',
  setValue: () => undefined,
  tipValue: undefined,
  setTipValue: () => undefined,
  historyValue: undefined,
  setHistoryValue: () => undefined,
  realValue: '',
})

export function useReminal() {
  return useContext(reminalContext)
}

export interface ProviderProps {
  commands?: (Command<any, any> | CommandGroup)[] | CommandGroup
  renders?: Partial<ReminalController['renders']>
  scrollContainer?: React.RefObject<HTMLElement>
}

export const Provider = memo<React.PropsWithChildren<ProviderProps>>(
  ({ children, commands, renders: rendersIn, scrollContainer }) => {
    const renders = useMemo<ReminalController['renders']>(() => {
      return { ...defaultRenders, ...rendersIn }
    }, [rendersIn])
    const root = useMemo(() => {
      if (commands instanceof CommandGroup) return commands
      const root = new CommandGroup('')
      commands?.forEach((command) => root.add(command))
      return root
    }, [commands])

    const inputValue = useInputValue()

    const scrollToBottom = useCallback(() => {
      const scroller = scrollContainer?.current ?? window
      const top =
        scroller instanceof HTMLElement
          ? scroller.scrollHeight
          : scroller.document.body.scrollHeight
      scroller.scrollTo({ top, behavior: 'smooth' })
    }, [scrollContainer])

    const { lines, executing, history, ...reminal } = useReminalLines({
      root,
      renders,
    })

    return (
      <linesContext.Provider value={lines}>
        <historyContext.Provider value={history}>
          <scrollToBottomContext.Provider value={scrollToBottom}>
            <executingContext.Provider value={executing}>
              <reminalContext.Provider value={{ ...reminal, root, renders }}>
                <inputValueContext.Provider value={inputValue}>
                  {children}
                </inputValueContext.Provider>
              </reminalContext.Provider>
            </executingContext.Provider>
          </scrollToBottomContext.Provider>
        </historyContext.Provider>
      </linesContext.Provider>
    )
  }
)

export function useReminalLines({
  root,
  renders,
}: {
  root: CommandGroup
  renders: ReminalController['renders']
}) {
  const [lines, setLines] = useState<React.ReactNode[]>([])
  const [executing, setExecuting] = useState(false)

  const history = useRef<string[]>([])

  const addLine = useCallback((line: React.ReactNode) => {
    setLines((lines) => [...lines, line])
  }, [])

  const addMutatableLine = useCallback(
    <T extends object>(Component: React.ComponentType<T>, props: T) => {
      const ref = React.createRef<{
        forceUpdate: (props: T) => void
      }>()
      const line = (
        <Mutatable actionRef={ref} Component={Component} props={props} />
      )
      setLines((lines) => [...lines, line])
      const update = (props: T) => ref.current?.forceUpdate(props)
      return update
    },

    []
  )

  const clearLines = useCallback(() => {
    setLines([])
  }, [])

  const execute = useCallback(
    async (command: string) => {
      const reminal = {
        execute,
        addLine,
        clearLines,
        root,
        renders,
        addMutatableLine,
      }
      try {
        setExecuting(true)
        history.current.push(command)
        const answer = await root.exec(command, reminal)
        if (answer) {
          if (typeof answer === 'string') {
            addLine(<renders.TextRender text={answer} />)
          } else {
            reminal.addLine(answer)
          }
        }
      } catch (error) {
        addLine(<renders.ErrorRender error={error} />)
      } finally {
        setExecuting(false)
      }
    },
    [addLine, addMutatableLine, clearLines, renders, root]
  )

  return {
    lines,
    execute,
    addLine,
    clearLines,
    addMutatableLine,
    history,
    executing,
  }
}

export function useInputValue() {
  const [value, setValue] = useState('')
  const [tipValue, setTipValue] = useState<string>()
  const [historyValue, setHistoryValue] = useState<string>()
  const realValue = tipValue ?? historyValue ?? value

  return {
    value,
    setValue,
    setTipValue,
    setHistoryValue,
    tipValue,
    historyValue,
    realValue,
  }
}
