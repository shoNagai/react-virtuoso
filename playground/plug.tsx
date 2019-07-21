import React, { useState } from 'react'
import * as ReactDOM from 'react-dom'
import { subject, map } from '../src/tinyrx'
import { createEngineContext } from '../src/Engine/ReactEngineContext'
import { EngineState } from '../src/Engine/Plug'

const FooEngineContext = createEngineContext()

const A = FooEngineContext.definePlug(
  [] as const,
  () => {
    const input = subject(1)
    return {
      input,
    }
  },
  ({ input }, { a }: { a: number }) => {
    input.next(a)
  }
)

const B = FooEngineContext.definePlug([A] as const, ({ input }) => {
  const output = input.pipe(
    map(val => {
      return val * 2
    })
  )
  return {
    output,
  }
})

const Child: React.FC = () => {
  const output = FooEngineContext.useOutput<typeof B, number>('output')
  const input = FooEngineContext.useInput<typeof A, number>('input')
  return (
    <>
      <div>{output}</div>
      <button onClick={() => input(output + 1)}>Increment me child!</button>
    </>
  )
}

class ContainerComponent extends React.PureComponent<{ plugs: any }, EngineState> {
  public state = FooEngineContext.stateScaffold()

  public static getDerivedStateFromProps(componentProps: { plugs: any }, state: EngineState) {
    return FooEngineContext.getDerivedStateFromPlugs(componentProps.plugs, state)
  }

  public render() {
    return (
      <FooEngineContext.Provider state={this.state}>
        <Child />
      </FooEngineContext.Provider>
    )
  }
}

const App = () => {
  const [count, setCount] = useState(0)

  return (
    <>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      {count}
      <ContainerComponent plugs={[A({ a: 30 }), B()]} />
      <ContainerComponent plugs={[A({ a: 40 }), B()]} />
    </>
  )
}

ReactDOM.render(<App />, document.getElementById('root'))
