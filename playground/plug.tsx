import React, { useState } from 'react'
import * as ReactDOM from 'react-dom'
import subject from 'callbag-subject'

const Root: React.FC = () => {
  return <div>Hello World</div>
}

/*
type Plugin<Deps extends Plugin[],  = {
  updateProps
}

type PluginDefinition = {

}
 */

function buildPlugin(definition) {
  const id = (Symbol() as unknown) as string
  return propValues => ({
    id,
    components: definition.components,
    engine: definition.engine,
    props: definition.props,
    propValues,
  })
}

const APlugin = buildPlugin({
  components: { Root },
  engine: () => {
    const a$ = subject()
    a$(0, (t, d) => {
      if (t == 1) {
        console.log('A got', d)
      }
    })
    return { a$ }
  },
  props: ({ a$ }, { a }) => {
    a$(1, a)
  },
})

class ContainerComponent extends React.PureComponent {
  state = {
    activePlugins: [],
    engine: {},
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
      <ContainerComponent plugins={[APlugin({ a: count })]} />
    </>
  )
}

ReactDOM.render(<App />, document.getElementById('root'))
