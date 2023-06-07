import { Reminal, command } from 'reminal'
import { Counter } from './conter'
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

function App() {
  return (
    <div style={{ width: '100vw', maxWidth: '100%' }}>
      <normalContext.Provider value="hello">
        <Reminal commands={[echo, count, context, book]} />
      </normalContext.Provider>
    </div>
  )
}

export default App
