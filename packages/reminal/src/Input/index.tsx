import {
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  historyContext,
  inputValueContext,
  scrollToBottomContext,
  useReminal,
} from '../context'
import React from 'react'
import { Command, CommandGroup, CommandOption } from '..'
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
      {isFocused && <Tips {...{ tips, focusedTipIndex }} />}
    </>
  )
})

const Tips = memo<{
  tips: ReturnType<typeof useTextarea>['tips']
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

  const [selectedWord, setSelectedWord] = useState('')

  const history = useContext(historyContext)

  const ref = useRef<HTMLTextAreaElement>(null)
  /** 当输入框值改变时清除临时值 */
  useEffect(() => {
    if (value) {
      setHistoryValue(undefined)
      setTipValue(undefined)
      setFocusedTipIndex(-1)
    }
  }, [setHistoryValue, setTipValue, value])

  const tips = useTips(historyValue ?? value, selectedWord)

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
        if (tips.list.length > 0 || history.current.length > 0) {
          e.preventDefault()
          // FIXME: 与历史记录一起使用时冲突
          setFocusedTipIndex((index) => {
            let nextValue = (index += e.key === 'ArrowUp' ? -1 : 1)
            // 修正越界
            nextValue = Math.min(
              Math.max(nextValue, -1 - history.current.length),
              tips.list.length - 1
            )

            if (nextValue === -1) {
              setTipValue(undefined)

              const t = ref.current
              if (t) {
                const [, nextSelectionStart] = replaceSelectedWord(
                  t,
                  selectedWord
                )
                requestAnimationFrame(() => {
                  t.selectionStart = nextSelectionStart
                  t.selectionEnd = nextSelectionStart
                })
              }
            } else if (nextValue >= 0) {
              if (tips.type === 'commands') {
                setTipValue(tips.list[nextValue].name.trim())
              } else {
                const t = ref.current
                if (t) {
                  const [nextTipValue, nextSelectionStart] =
                    replaceSelectedWord(t, tips.list[nextValue].name.trim())
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
      } else {
        requestAnimationFrame(() => {
          const t = ref.current
          if (!t) return
          setSelectedWord(getSelectedWord(t))
        })
      }
    },
    [
      history,
      realValue,
      reminal,
      selectedWord,
      setHistoryValue,
      setTipValue,
      setValue,
      tips.list,
      tips.type,
    ]
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
      ref,
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

export function useTips(input: string, selectedWord: string) {
  const { root } = useReminal()

  const matchedCommand = useMemo(() => {
    return root.matchCommand(input)
  }, [input, root])

  const commandList = useMemo(() => {
    if (matchedCommand && selectedWord.startsWith('-'))
      return { type: 'options' as const, list: flatOption(matchedCommand) }
    return { type: 'commands' as const, list: flatGroup(root) }
  }, [matchedCommand, root, selectedWord])

  return useMemo(() => {
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
  }, [commandList, input, selectedWord])
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
  const rightValue = t.value.substring(t.selectionEnd)
  const leftHalfWord = leftValue.match(/(\S+)$/)
  const rightHalfWord = rightValue.match(/^(\S+)/)
  return (leftHalfWord?.[1] ?? '') + (rightHalfWord?.[1] ?? '')
}

function replaceSelectedWord(t: HTMLTextAreaElement, word: string) {
  const leftValue = t.value.substring(0, t.selectionStart)
  const rightValue = t.value.substring(t.selectionEnd)
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
