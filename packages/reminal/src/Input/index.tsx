import {
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { historyContext, inputValueContext, useReminal } from '../context'
import React from 'react'
import { Command, CommandGroup, CommandOption } from '..'
import { commandScore } from '../utils/command-score'

export const Input = memo(() => {
  const { bind, isFocused, selectedWord } = useTextarea()

  const { tips, focusedTipIndex } = useTips(selectedWord, bind.ref)

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
      {isFocused && <Tips {...{ tips, focusedTipIndex }} />}
    </>
  )
})

const Tips = memo<{
  tips: ReturnType<typeof useTips>['tips']
  focusedTipIndex: number
}>(({ tips, focusedTipIndex }) => {
  if (tips.type === 'options') {
    return (
      <div>
        {tips.list.map((tip, i) => (
          <div
            key={tip.name}
            style={
              focusedTipIndex === i
                ? { backgroundColor: 'rgba(188, 132, 168,0.3)' }
                : {}
            }
          >
            <span>{tip.name}</span>
            {tip.option.description && (
              <span style={{ marginLeft: '1em' }}>
                {` - ${tip.option.description}`}
              </span>
            )}
          </div>
        ))}
      </div>
    )
  }
  return (
    <div>
      {tips.list.map((tip, i) => (
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
  )
})

export function useTextarea(refIn?: React.RefObject<HTMLTextAreaElement>) {
  const innerRef = useRef<HTMLTextAreaElement>(null)
  const ref = refIn ?? innerRef
  const { setValue, setHistoryValue, setTipValue, realValue } =
    useContext(inputValueContext)
  const [isFocused, setIsFocused] = useState(false)

  const [selectedWord, setSelectedWord] = useState('')

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
      } else {
        if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') {
          requestAnimationFrame(() => {
            const t = ref.current
            if (!t) return
            setSelectedWord(getSelectedWord(t))
          })
        }
      }
    },
    [realValue, ref, reminal, setHistoryValue, setTipValue, setValue]
  )

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setValue(e.target.value)
      e.target.style.height = '5px'
      e.target.style.height = e.target.scrollHeight + 'px'
    },
    [setValue]
  )

  const bind = useMemo(
    () => ({
      ref,
      autoFocus: true,
      onKeyDown,
      onChange,
      onFocus: () => setIsFocused(true),
      onBlur: () => setIsFocused(false),
      value: realValue,
      rows: 1,
    }),
    [onChange, onKeyDown, realValue, ref]
  )

  return { isFocused, selectedWord, bind }
}

export function useTips(
  selectedWord: string,
  refIn?: React.RefObject<HTMLTextAreaElement>
) {
  const innerRef = useRef<HTMLTextAreaElement>(null)
  const ref = refIn ?? innerRef
  const { root } = useReminal()

  const { setHistoryValue, historyValue, value, setTipValue } =
    useContext(inputValueContext)
  const input = historyValue ?? value

  const matchedCommand = useMemo(() => {
    return root.matchCommand(input)
  }, [input, root])

  const commandList = useMemo(() => {
    if (matchedCommand && selectedWord.startsWith('-'))
      return { type: 'options' as const, list: flatOption(matchedCommand) }
    return { type: 'commands' as const, list: flatGroup(root) }
  }, [matchedCommand, root, selectedWord])

  const tips = useMemo(() => {
    if (commandList.type === 'options')
      return {
        type: commandList.type,
        list: commandList.list
          .map((opt) => ({
            ...opt,
            score: commandScore(opt.name, selectedWord),
          }))
          .filter((opt) => opt.score > 0)
          .sort((a, b) => b.score - a.score),
      }

    return {
      type: commandList.type,
      list: commandList.list
        .map((cmd) => ({
          ...cmd,
          score: commandScore(cmd.name, input),
        }))
        .filter((cmd) => cmd.score > 0)
        .sort((a, b) => b.score - a.score),
    }
  }, [commandList.list, commandList.type, input, selectedWord])

  const lastSelectionStart = useRef(0)

  const [focusedTipIndex, setFocusedTipIndex] = useState(-1)

  /** 当输入框值改变时清除临时值 */
  useEffect(() => {
    if (value) {
      setHistoryValue(undefined)
      setTipValue(undefined)
      setFocusedTipIndex(-1)
    }
  }, [setHistoryValue, setTipValue, value])

  const history = useContext(historyContext)

  const dependencyList = useRef({ history, setHistoryValue, setTipValue, tips })
  useMemo(() => {
    dependencyList.current = { history, setHistoryValue, setTipValue, tips }
  }, [history, setHistoryValue, setTipValue, tips])

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const handleArrow = (e: KeyboardEvent) => {
      const { history, setHistoryValue, setTipValue, tips } =
        dependencyList.current
      if (['ArrowUp', 'ArrowDown'].includes(e.key)) {
        if (
          tips.list.length > 0 ||
          (history.current.length > 0 && !input.includes('\n'))
        ) {
          e.preventDefault()
          setFocusedTipIndex((index) => {
            let nextValue = index + (e.key === 'ArrowUp' ? -1 : 1)
            // 修正越界
            if (
              nextValue > tips.list.length - 1 ||
              nextValue < -1 - history.current.length
            ) {
              nextValue = -1
            }

            // 记录光标位置
            if (index === -1 && ref.current) {
              lastSelectionStart.current = ref.current.selectionStart
            }

            if (nextValue === -1) {
              setTipValue(undefined)
              setHistoryValue(undefined)

              // 还原光标位置
              const t = ref.current
              if (t) {
                requestAnimationFrame(() => {
                  t.selectionStart = lastSelectionStart.current
                  t.selectionEnd = lastSelectionStart.current
                })
              }
            } else if (nextValue >= 0) {
              if (tips.type === 'commands') {
                setTipValue(tips.list[nextValue].name.trim())
              } else {
                const t = ref.current
                if (t) {
                  const [nextTipValue, nextSelectionStart] =
                    replaceSelectedWord(
                      t.value,
                      tips.list[nextValue].name.trim(),
                      t.selectionStart
                    )
                  setTipValue(nextTipValue)
                  requestAnimationFrame(() => {
                    t.selectionStart = nextSelectionStart
                    t.selectionEnd = nextSelectionStart
                  })
                }
              }
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
    }

    element.addEventListener('keydown', handleArrow)

    return () => element.removeEventListener('keydown', handleArrow)
  }, [input, ref])

  return { tips, focusedTipIndex, matchedCommand }
}

export interface CommandAbstract {
  name: string
  commands: Command<any, any> | CommandGroup
}

export interface CommandOptionAbstract {
  name: string
  option: CommandOption<any, any, any>
}

export function flatOption(command: Command<any, any>) {
  const options: CommandOptionAbstract[] = []
  for (const option of command.meta.options ?? []) {
    options.push({
      name: '--' + option.name,
      option,
    })
    if (option.type === Boolean) {
      options.push({
        name: '--no-' + option.name,
        option,
      })
    }
  }
  return options
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

function getSelectedWord(t: HTMLTextAreaElement) {
  const leftValue = t.value.substring(0, t.selectionStart)
  const rightValue = t.value.substring(t.selectionStart)
  const leftHalfWord = leftValue.match(/(\S+)$/)
  const rightHalfWord = rightValue.match(/^(\S+)/)
  return (leftHalfWord?.[1] ?? '') + (rightHalfWord?.[1] ?? '')
}

function replaceSelectedWord(text: string, word: string, start: number) {
  const leftValue = text.substring(0, start)
  const rightValue = text.substring(start)
  const leftHalfWord = leftValue.match(/(\S+)$/)
  const rightHalfWord = rightValue.match(/^(\S+)/)
  const left = leftHalfWord?.[1] ?? ''
  const right = rightHalfWord?.[1] ?? ''

  const nextSelectionStart = leftValue.length - left.length + word.length

  return [
    leftValue.substring(0, leftValue.length - left.length) +
      word +
      rightValue.substring(right.length),
    nextSelectionStart,
  ] as const
}
