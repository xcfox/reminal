import { Reminal, command } from 'reminal'
import { Counter, Timeout } from './conter'
import { normalContext } from './context'
import { book } from './book'

const echo = command('echo')
  .description('echo a string')
  .argment('args', 'args', { type: [String] })
  .action(({ argments }) => {
    return argments.join(' ')
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
  .argment('time', '倒计时时间', { type: Number })
  .action(async ({ argments, reminal }) => {
    let time = Number(argments[0]) || 10
    const update = reminal.addMutatableLine(Timeout, { time })
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

function App() {
  return (
    <div style={{ width: '100vw', maxWidth: '100%' }}>
      <normalContext.Provider value="hello">
        <Reminal commands={[echo, count, context, book, timeout]} />
      </normalContext.Provider>
    </div>
  )
}

export default App
