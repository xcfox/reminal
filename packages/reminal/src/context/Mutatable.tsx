import React from 'react'

interface MutatableProps<T extends object> {
  Component: React.ComponentType<T>
  props: T
  actionRef: React.Ref<{
    forceUpdate: (props: T) => void
  }>
}

function MutatableGeneric<T extends object>({
  Component,
  props: propsInit,
  actionRef,
}: MutatableProps<T>) {
  const [props, setProps] = React.useState(propsInit)
  React.useImperativeHandle(actionRef, () => ({
    forceUpdate: (props) => {
      setProps(props)
    },
  }))
  return <Component {...props} />
}

const genericMemo: <T>(component: T) => T = React.memo

export const Mutatable = genericMemo(MutatableGeneric)
