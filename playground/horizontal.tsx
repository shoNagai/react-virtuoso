import * as React from 'react'
import { useState, useRef } from 'react'
import * as ReactDOM from 'react-dom'
import { Virtuoso, VirtuosoMethods } from '../src/'

const GenerateItem = (index: number) => <div style={{ width: '40px' }}>{index}</div>

const App = () => {
  const ref = useRef<VirtuosoMethods>(null)
  const [count, setCount] = useState(20)

  return (
    <div>
      <button onClick={() => setCount(count + 10)}>Add 10</button>
      <button onClick={() => ref.current.scrollToIndex(count - 1)}>Scroll To Right</button>
      <Virtuoso
        ref={ref}
        totalCount={count}
        item={GenerateItem}
        style={{ height: '400px', width: '350px' }}
        scrollingStateChange={scrollState => console.log({ scrollState })}
        isHorizontal={true}
      />
    </div>
  )
}

ReactDOM.render(<App />, document.getElementById('root'))
