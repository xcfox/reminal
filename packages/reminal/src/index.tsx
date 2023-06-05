import React, { useContext } from 'react'
import { Input } from './Input'
import { Provider, linesContext } from './context'
import { ProviderProps } from './context'

export * from './command'
export * from './context'
export * from './Input'

const ReminalInner: React.FC = () => {
  const lines = useContext(linesContext)
  return (
    <div style={{ width: '100%' }}>
      {lines.map((line, index) => (
        <div key={index}>{line}</div>
      ))}
      <Input />
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
