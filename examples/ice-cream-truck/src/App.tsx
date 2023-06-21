import { memo, useContext } from 'react'
import {
  Command,
  Provider,
  executingContext,
  linesContext,
  useTextarea,
  useTips,
} from 'reminal'
import { commands } from './commands'
import { Welcome } from './views/welcome'
import { Card, CardFooter, Spacer, Textarea } from '@nextui-org/react'
import { oneOf } from './utils/one-of'

const Lines = memo(() => {
  const lines = useContext(linesContext)
  const executing = useContext(executingContext)
  return (
    <div className="max-w-[800px] m-4">
      <Welcome />
      {lines.map((line, index) => (
        <div className="w-full" key={index}>
          {line}
        </div>
      ))}
      {!executing && <Input />}
    </div>
  )
})

const Input = memo(() => {
  const { bind, isFocused, selectedWord } = useTextarea()
  const { tips, focusedTipIndex, matchedCommand } = useTips(
    selectedWord,
    bind.ref
  )
  return (
    <>
      <CommandTip command={matchedCommand} />
      <Card isBlurred className="w-full border-primary border-2">
        <Textarea
          aria-label="input"
          {...(bind as any)}
          autoFocus={false}
          minRows={1}
        />
        {isFocused && tips.list.length > 0 && (
          <Tips tips={tips} focusedTipIndex={focusedTipIndex} />
        )}
      </Card>
      <Spacer className="h-40" />
    </>
  )
})

const CommandTip = memo<{ command: Command<any, any> | undefined }>(
  ({ command }) => {
    return (
      <div className="mt-4 ml-1">
        {command ? '💡' + command.meta.description : genCommandTip()}
      </div>
    )
  }
)

const commandTips = [
  '🍩需要来点甜点吗？',
  '💬我在听，请输入您的消息',
  '📌在此输入新的命令',
  '🤔您在寻找些什么？请输入关键字或内容：',
]

function genCommandTip(): string {
  if (Math.random() < 0.6) return oneOf(...commandTips)
  return '📌在此输入新的命令'
}

const Tips = memo<{
  tips: ReturnType<typeof useTips>['tips']
  focusedTipIndex: number
}>(({ tips, focusedTipIndex }) => {
  return (
    <CardFooter className="flex flex-col items-start">
      {tips.list.map((tip, i) => (
        <div
          key={tip.name}
          className="w-full flex items-center p-2 rounded-md transition-colors bg-primary"
          style={
            {
              '--nextui-primary-opacity': focusedTipIndex === i ? 0.6 : 0,
            } as any
          }
        >
          <span className="font-bold">{tip.name}</span>
          {tip.description && (
            <span className="ml-4 opacity-80">{tip.description}</span>
          )}
        </div>
      ))}
    </CardFooter>
  )
})

function App() {
  return (
    <div className="w-full h-full flex flex-col items-center min-h-[100vh] bg-gradient-to-l from-rose-100 to-teal-100">
      <Provider commands={commands}>
        <Lines />
      </Provider>
    </div>
  )
}

export default App
