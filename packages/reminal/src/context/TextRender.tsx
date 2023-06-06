import React, { memo } from 'react'

export interface RenimalRenders {
  TextRender: TextRender
  HistoryRender: TextRender
  HelpRender: TextRender
  ErrorRender: ErrorRender
}

export interface TextRenderProps {
  text: string
}

export type TextRender = React.ComponentType<TextRenderProps>

export const DefaultTextRender: TextRender = memo(({ text }) => {
  return <>{text}</>
})

export const DefaultHistoryRender: TextRender = memo(({ text }) => {
  return <>{text}</>
})

export const DefaultHelpRender: TextRender = memo(({ text }) => {
  return <div style={{ whiteSpace: 'pre-wrap' }}>{text}</div>
})

export interface ErrorRenderProps {
  error: any
}

export type ErrorRender = React.ComponentType<ErrorRenderProps>

export const DefaultErrorRender: ErrorRender = memo(({ error }) => {
  let text = 'Unknown Error'
  if (error instanceof Error) {
    text = error.message
  } else if (typeof error === 'string') {
    text = error
  }
  return <>❌{text}</>
})

export const defaultRenders: RenimalRenders = {
  TextRender: DefaultTextRender,
  ErrorRender: DefaultErrorRender,
  HistoryRender: DefaultHistoryRender,
  HelpRender: DefaultHelpRender,
}
