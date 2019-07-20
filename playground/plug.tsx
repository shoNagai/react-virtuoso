import React, { useState } from 'react'
import * as ReactDOM from 'react-dom'
import subject from 'callbag-subject'

interface EnginePlugDefinition<EB, P = any, D = []> {
  engine(dependencyBits?: InferDB<D>): EB
  update?(props: P): void
  dependencies?: D
}

interface EnginePlug<EB, P = any, D = []> extends EnginePlugDefinition<EB, P, D> {
  id: string
  currentProps?: P
}

interface PlugConstructor<EB, P = any, D = []> {
  (props?: P): EnginePlug<EB, P, D>
  id: string
}

type D1<DB1> = readonly [PlugConstructor<DB1, any, any>]
type D2<DB1, DB2> = readonly [PlugConstructor<DB1, any, any>, PlugConstructor<DB2, any, any>]
type D3<DB1, DB2, DB3> = readonly [
  PlugConstructor<DB1, any, any>,
  PlugConstructor<DB2, any, any>,
  PlugConstructor<DB3, any, any>
]

type InferDB<D> = D extends D1<infer DB1>
  ? DB1
  : D extends D2<infer DB1, infer DB2>
  ? DB1 & DB2
  : D extends D3<infer DB1, infer DB2, infer DB3>
  ? DB1 & DB2 & DB3
  : never

function definePlug<EB, P, D>(definition: EnginePlugDefinition<EB, P, D>): PlugConstructor<EB, P, D> {
  const id = (Symbol() as unknown) as string
  const constructor = (propValues?: P) => ({
    ...definition,
    id,
    currentProps: propValues,
  })

  constructor.id = id

  return constructor
}

interface EngineState {
  activePlugs: string[]
  engine: {}
  engineSnapshots: {
    [key: string]: {}
  }
}

interface CreateEngineContext {
  (): {
    stateScaffold(): EngineState
    getDerivedStateFromPlugs(plugs: PlugConstructor[], state: EngineState): EngineState | null
  }
}

const createEngineContext: CreateEngineContext = () => {
  const EngineContext = React.createContext({})

  const Provider = ({ state, children }) => {
    return <EngineContext.Provider value={state}>{children}</EngineContext.Provider>
  }

  const getDerivedStateFromPlugs = (plugs, currentState) => {}

  const stateScaffold = () => {
    return {
      activePlugs: [],
      engine: {},
      engineSnapshots: {},
    }
  }

  const useInput = () => {}

  const useOutput = () => {}

  return {
    Provider,
    getDerivedStateFromPlugs,
    definePlug,
    stateScaffold,
    useInput,
    useOutput,
  }
}

function activatePlugin(activatedInTheCurrentCycle, state, plugins, id) {
  let updatedState = state
  if (activatedInTheCurrentCycle.indexOf(id) === -1) {
    const { props, id, components, engine, propValues, dependencies } = plugins.find(plugin => plugin.id == id)

    for (const dependency of dependencies) {
      updatedState = activatePlugin(activatedInTheCurrentCycle, updatedState, plugins, dependency.id)
    }

    let extendedEngine

    if (state.activePlugins.indexOf(id) === -1) {
      extendedEngine = { ...updatedState.engine, ...engine() }
      updatedState = {
        ...updatedState,
        engine: extendedEngine,
        engineSnapshots: { ...state.engineSnapshots, id: extendedEngine },
        activePlugins: [...state.activePlugins, id],
      }
    } else {
      extendedEngine = state.engineSnapshots[id]
    }

    props(extendedEngine, propValues)
    activatedInTheCurrentCycle.push(id)
  }

  return updatedState
}

const A = definePlug({
  engine: () => {
    return {
      a: { a: () => console.log('foo!') },
    }
  },
})

const C = definePlug({
  engine: () => {
    return {
      c: { c: () => console.log('baz!') },
    }
  },
})

const B = definePlug({
  dependencies: [A, C] as const,
  engine: bits => {
    console.log(bits.a.a())
    return {
      b: { b: () => console.log('bar!') },
    }
  },
})

class ContainerComponent extends React.PureComponent {
  state = {
    activePlugins: [],
    engine: {},
    engineSnapshots: {},
    components: {},
  }

  static getDerivedStateFromProps(componentProps, state) {
    let newState = state
    for (const { props, id, components, engine, propValues } of componentProps.plugins) {
      if (state.activePlugins.indexOf(id) === -1) {
        state = {
          ...state,
          engine: { ...state.engine, ...engine() },
          components: { ...state.components, ...components },
        }
      }
      props(state.engine, propValues)
    }

    if (state !== newState) {
      return newState
    }

    return null
  }

  render() {
    return <div>Kur</div>
  }
}

const App = () => {
  const [count, setCount] = useState(0)

  return (
    <>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      {count}
      <ContainerComponent plugins={[BPlugin(), APlugin({ a: count })]} />
    </>
  )
}

ReactDOM.render(<App />, document.getElementById('root'))
