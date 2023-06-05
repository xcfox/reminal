import { memo, useCallback, useContext } from 'react'
import { inputValueContext, setInputValueContext, useReminal } from '../context'
import React from 'react'

export const Input = memo(() => {
  const value = useContext(inputValueContext)
  const setValue = useContext(setInputValueContext)

  const reminal = useReminal()
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && value) {
        setValue('')
        reminal.execute(value)
      }
    },
    [reminal, setValue, value]
  )

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue(e.target.value)
    },
    [setValue]
  )

  return (
    <input onKeyDown={handleKeyDown} onChange={handleChange} value={value} />
  )
})
