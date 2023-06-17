import React, { useContext } from 'react'
import { Input } from './Input'
import { Provider, executingContext, linesContext } from './context'
import { ProviderProps } from './context'

export * from './command'
export * from './context'
export * from './Input'
export * from './utils'

const ReminalInner: React.FC = () => {
  const lines = useContext(linesContext)
  const executing = useContext(executingContext)

  return (
    <div style={{ width: '100%' }}>
      {lines.map((line, index) => (
        <div key={index}>{line}</div>
      ))}
      {!executing && <Input />}
    </div>
  )
}

export const Reminal: React.FC<ProviderProps> = (props) => {
  return (
    <Provider {...props}>
      <ReminalInner />
    </Provider>
  )
}
