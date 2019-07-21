import React, { createContext, useContext, useState, useLayoutEffect } from 'react'
import { TSubscription } from '../tinyrx'
import { EnginePlugConstructor, getDerivedStateFromPlugs, definePlug, stateScaffold } from './Plug'

export function createEngineContext() {
  const EngineContext = createContext({})

  const Provider = ({ state, children }: any) => {
    return <EngineContext.Provider value={state}>{children}</EngineContext.Provider>
  }

  function useOutput<Plug, T>(selector: Plug extends EnginePlugConstructor<infer EB, any, any> ? keyof EB : never): T {
    const context = useContext(EngineContext)
    const [value, setValue] = useState(undefined)
    const observable = (context as any).engine[selector]
    let unsubscribe: TSubscription | undefined

    useLayoutEffect(() => {
      unsubscribe && unsubscribe()
      unsubscribe = observable.subscribe(setValue)
      return () => {
        unsubscribe && unsubscribe()
      }
    }, [setValue])

    return (value as unknown) as T
  }

  function useInput<Plug, T>(
    selector: Plug extends EnginePlugConstructor<infer EB, any, any> ? keyof EB : never
  ): (value: T) => void {
    return (useContext(EngineContext) as any).engine[selector].next
  }

  return {
    Provider,
    getDerivedStateFromPlugs,
    definePlug,
    stateScaffold,
    useInput,
    useOutput,
  }
}
