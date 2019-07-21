export interface EnginePlug<EB extends {} = {}, P = any, D extends Dependencies = readonly []> {
  engine(dependencyBits?: InferDB<D>): EB
  update(bits: EB, props: P): void
  dependencies: D
  id: string
  currentProps?: P
}

export interface EnginePlugConstructor<EB extends {} = {}, P = any, D extends Dependencies = readonly []> {
  (props?: P): EnginePlug<EB, P, D>
  id: string
}

type D1<DB1> = readonly [EnginePlugConstructor<DB1, any, any>]
type D2<DB1, DB2> = readonly [EnginePlugConstructor<DB1, any, any>, EnginePlugConstructor<DB2, any, any>]
type D3<DB1, DB2, DB3> = readonly [
  EnginePlugConstructor<DB1, any, any>,
  EnginePlugConstructor<DB2, any, any>,
  EnginePlugConstructor<DB3, any, any>
]

type Dependencies = readonly [] | D1<any> | D2<any, any> | D3<any, any, any>

type InferDB<Deps> = Deps extends D1<infer DB1>
  ? DB1
  : Deps extends D2<infer DB1, infer DB2>
  ? DB1 & DB2
  : Deps extends D3<infer DB1, infer DB2, infer DB3>
  ? DB1 & DB2 & DB3
  : never

const noop = () => {}

export function definePlug<EB, P, D extends Dependencies>(
  dependencies: D,
  engine: (dependencyBits: InferDB<D>) => EB,
  update: (bits: EB, props: P) => void = noop
): EnginePlugConstructor<EB, P, D> {
  const id = (Symbol() as unknown) as string
  const constructor = (propValues?: P) => ({
    dependencies,
    engine,
    update,
    id,
    currentProps: propValues,
  })

  constructor.id = id

  return constructor
}

export interface EngineState {
  activePlugs: string[]
  engine: {}
  engineSnapshots: {
    [key: string]: {}
  }
}

export function activatePlug(
  activatedInTheCurrentCycle: string[],
  state: EngineState,
  plugs: EnginePlug[],
  plugId: string
) {
  let updatedState = state

  if (activatedInTheCurrentCycle.indexOf(plugId) === -1) {
    const { update, engine, currentProps, dependencies } = plugs.find(plug => plug.id == plugId)!

    for (const dependency of dependencies) {
      updatedState = activatePlug(
        activatedInTheCurrentCycle,
        updatedState,
        plugs,
        (dependency as EnginePlugConstructor).id
      )
    }

    let extendedEngine: {}

    if (state.activePlugs.indexOf(plugId) === -1) {
      extendedEngine = { ...updatedState.engine, ...(engine as any)(updatedState.engine) }
      updatedState = {
        ...updatedState,
        engine: extendedEngine,
        engineSnapshots: { ...state.engineSnapshots, [plugId]: extendedEngine },
        activePlugs: [...state.activePlugs, plugId],
      }
    } else {
      extendedEngine = state.engineSnapshots[plugId]
    }

    update(extendedEngine, currentProps)
    activatedInTheCurrentCycle.push(plugId)
  }

  return updatedState
}

export function getDerivedStateFromPlugs(plugs: EnginePlug[], currentState: EngineState) {
  let updatedState = currentState
  const activatedInTheCurrentCycle: string[] = []
  for (const plug of plugs) {
    updatedState = activatePlug(activatedInTheCurrentCycle, updatedState, plugs, plug.id)
  }

  return updatedState === currentState ? null : updatedState
}

export function stateScaffold(): EngineState {
  return {
    activePlugs: [],
    engine: {},
    engineSnapshots: {},
  }
}
