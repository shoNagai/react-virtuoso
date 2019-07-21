import Plug from '../../src/VirtuosoEngine/ItemHeightsPlug'
import C from '../../src/VirtuosoEngine/VirtuosoEngineContext'
import { AATree } from '../../src/AATree'
import { OffsetList } from '../../src/OffsetList'
import { EnginePlugConstructor } from '../../src/Engine/Plug'

function toArray<T>(tree: AATree<T>): [number, T][] {
  return tree.walk().map(({ key, value }) => [key, value])
}

function getEngine(plug: ReturnType<typeof Plug>) {
  return C.getDerivedStateFromPlugs([plug], C.stateScaffold())!.engine as Engine<typeof Plug>
}

type Engine<P> = P extends EnginePlugConstructor<infer EB, any, any> ? EB : never

describe('item heights plug', () => {
  it('hard-codes item height if provided', () => {
    const { offsetList$ } = getEngine(Plug({ itemHeight: 50 }))

    offsetList$.subscribe(list => {
      expect(toArray(list.rangeTree)).toEqual([[0, 50]])
    })
  })

  it('listens to item heights if no item height is set', () => {
    const { itemHeights$, offsetList$ } = getEngine(Plug({ itemHeight: NaN }))

    itemHeights$.next([{ start: 0, end: 10, size: 20 }])

    offsetList$.subscribe((list: OffsetList) => {
      expect(toArray(list.rangeTree)).toEqual([[0, 20]])
    })
  })
})
