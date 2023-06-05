import { useState } from 'react'

export const Counter = () => {
  const [count, setCount] = useState(0)
  return (
    <div>
      <p>count: {count}</p>
      <button onClick={() => setCount(count + 1)}>increment</button>
    </div>
  )
}
