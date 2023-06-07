import React, { useState } from 'react'

export const Counter = () => {
  const [count, setCount] = useState(0)
  return (
    <div>
      <p>count: {count}</p>
      <button onClick={() => setCount(count + 1)}>increment</button>
    </div>
  )
}

export const Timeout: React.FC<{ time: number }> = ({ time }) => {
  return (
    <div>
      <Counter />
      <p>time: {time.toFixed(1)}</p>
    </div>
  )
}
