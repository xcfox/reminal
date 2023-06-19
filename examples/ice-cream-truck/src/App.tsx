import { memo, useContext } from 'react'
import { Provider, linesContext } from 'reminal'
import { commands } from './commands'
import { Welcome } from './views/welcome'

const Lines = memo(() => {
  const lines = useContext(linesContext)
  return (
    <div className="max-w-[800px] m-4">
      <Welcome />
      {lines.map((line, index) => (
        <div className="w-full" key={index}>
          {line}
        </div>
      ))}
    </div>
  )
})

function App() {
  return (
    <div className="w-full h-full flex flex-col items-center min-h-[100vh] bg-gradient-to-bl from-rose-100 to-teal-100">
      <Provider commands={commands}>
        <Lines />
      </Provider>
    </div>
  )
}

export default App
