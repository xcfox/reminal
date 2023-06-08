import {
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  historyContext,
  inputValueContext,
  scrollToBottomContext,
  useReminal,
} from '../context'
import React from 'react'
import { Command, CommandGroup } from '..'
import { commandScore } from '../utils/command-score'

export const Input = memo(() => {
  const { bind, isFocused, tips, focusedTipIndex } = useTextarea()

  return (
    <>
      <textarea
        {...bind}
        style={{
          resize: 'none',
          overflow: 'hidden',
          minHeight: '5px',
          width: '100%',
          boxSizing: 'border-box',
        }}
      />
      {isFocused && (
        <div>
          {tips.map((tip, i) => (
            <div
              key={tip.name}
              style={
                focusedTipIndex === i
                  ? { backgroundColor: 'rgba(188, 132, 168,0.3)' }
                  : {}
              }
            >
              <span>{tip.name}</span>
              {tip.commands.meta.description && (
                <span style={{ marginLeft: '1em' }}>
                  {` - ${tip.commands.meta.description}`}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  )
})

// TODO: 参数与选项提示

export function useTextarea() {
  const {
    value,
    setValue,
    historyValue,
    setHistoryValue,
    setTipValue,
    realValue,
  } = useContext(inputValueContext)
  const [focusedTipIndex, setFocusedTipIndex] = useState(-1)
  const [isFocused, setIsFocused] = useState(false)

  const history = useContext(historyContext)

  /** 当输入框值改变时清除临时值 */
  useMemo(() => {
    if (value) {
      setHistoryValue(undefined)
      setTipValue(undefined)
      setFocusedTipIndex(-1)
    }
  }, [setHistoryValue, setTipValue, value])

  const tips = useTips(historyValue ?? value)

  const reminal = useReminal()
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        if (realValue) {
          setValue('')
          setHistoryValue(undefined)
          setTipValue(undefined)
          reminal.execute(realValue)
        }
        e.preventDefault()
      } else if (['ArrowUp', 'ArrowDown'].includes(e.key)) {
        if (tips.length) {
          e.preventDefault()
          setFocusedTipIndex((index) => {
            let nextValue = (index += e.key === 'ArrowUp' ? -1 : 1)
            // 修正越界
            nextValue = Math.min(
              Math.max(nextValue, -1 - history.current.length),
              tips.length - 1
            )

            if (nextValue === -1) setTipValue(undefined)
            else if (nextValue >= 0) {
              setTipValue(tips[nextValue].name.trim())
              setHistoryValue(undefined)
            } else {
              setHistoryValue(
                history.current[history.current.length + 1 + nextValue]
              )
              setTipValue(undefined)
            }
            return nextValue
          })
        }
      }
    },
    [history, realValue, reminal, setHistoryValue, setTipValue, setValue, tips]
  )

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setValue(e.target.value)
      e.target.style.height = '5px'
      e.target.style.height = e.target.scrollHeight + 'px'
    },
    [setValue]
  )

  const scrollToBottom = useContext(scrollToBottomContext)
  useEffect(() => {
    if (isFocused) scrollToBottom()
  }, [isFocused, scrollToBottom])

  const bind = useMemo(
    () => ({
      autoFocus: true,
      onKeyDown,
      onChange,
      onFocus: () => setIsFocused(true),
      onBlur: () => setIsFocused(false),
      value: realValue,
      rows: 1,
    }),
    [onChange, onKeyDown, realValue]
  )

  return { isFocused, tips, focusedTipIndex, bind }
}

export function useTips(input: string) {
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
