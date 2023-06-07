import { memo, useCallback, useContext, useState } from 'react'
import { inputValueContext, useReminal } from '../context'
import React from 'react'
import { TipBox } from './TipBox'

export const Input = memo(() => {
  const [value, setValue] = useContext(inputValueContext)
  const [isFocused, setIsFocused] = useState(false)

  const reminal = useReminal()
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        if (value) {
          setValue('')
          reminal.execute(value)
        }
        e.preventDefault()
      }
    },
    [reminal, setValue, value]
  )

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setValue(e.target.value)
      e.target.style.height = '5px'
      e.target.style.height = e.target.scrollHeight + 'px'
    },
    [setValue]
  )

  return (
    <>
      <textarea
        onKeyDown={handleKeyDown}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        value={value}
        rows={1}
        style={{
          resize: 'none',
          overflow: 'hidden',
          minHeight: '5px',
          width: '100%',
          boxSizing: 'border-box',
        }}
      />
      {isFocused && <TipBox />}
    </>
  )
})
