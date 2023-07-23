import { Reminal, command } from 'reminal'
import { Counter, Timeout } from './conter'
import { normalContext } from './context'
import { book } from './book'

const echo = command('echo')
  .description('echo a string')
  .argument('args', 'args', { type: [String] })
  .action(({ args }) => {
    return args.join(' ')
  })

const count = command('count')
  .description('获得一个计数器')
  .action(() => {
    return <Counter />
  })

const context = command('context')
  .description('获得一个上下文')
  .action(async () => {
    await new Promise((resolve) => setTimeout(resolve, 1000))
    return <normalContext.Consumer>{(value) => value}</normalContext.Consumer>
  })

const timeout = command('timeout')
  .description('倒计时')
  .argument('time', '倒计时时间', { type: Number, default: 10 })
  .action(async ({ args, reminal }) => {
    let time = Number(args[0]) || 10
    const update = reminal.addActiveLine(Timeout, { time })
    await new Promise<void>((resolve) => {
      tick()
      function tick() {
        if (time <= 0) {
          return resolve()
        }
        time -= 0.1
        time = Math.max(time, 0)
        update({ time })
        setTimeout(tick, 100)
      }
    })
  })

export const commands = [echo, count, context, book, timeout]

function App() {
  return (
    <div style={{ width: '100vw', maxWidth: '100%' }}>
      <normalContext.Provider value="hello">
        <Reminal commands={commands} />
      </normalContext.Provider>
    </div>
  )
}

export default App
