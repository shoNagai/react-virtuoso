import C from './VirtuosoEngineContext'
import { withLatestFrom, subject, TSubscription } from '../tinyrx'
import { OffsetList } from '../OffsetList'

export interface ItemHeight {
  start: number
  end: number
  size: number
}

export default C.definePlug(
  [],
  () => {
    const fixedItemHeight$ = subject<number>(NaN)
    const itemHeights$ = subject<ItemHeight[]>()
    const stickyItems$ = subject<number[]>([])
    const offsetList$ = subject(OffsetList.create())

    let unsubscribeFromItemHeights: TSubscription

    fixedItemHeight$.subscribe(fixedItemHeight => {
      unsubscribeFromItemHeights && unsubscribeFromItemHeights()
      if (!isNaN(fixedItemHeight)) {
        offsetList$.next(OffsetList.create().insert(0, 0, fixedItemHeight))
      } else {
        unsubscribeFromItemHeights = itemHeights$
          .pipe(withLatestFrom(offsetList$, stickyItems$))
          .subscribe(([heights, offsetList, stickyItems]) => {
            let newList = offsetList
            for (let { start, end, size } of heights) {
              if (newList.empty() && start == end && stickyItems.indexOf(start) > -1) {
                newList = newList.insertSpots(stickyItems, size)
              } else {
                newList = newList.insert(start, end, size)
              }
            }

            if (newList !== offsetList) {
              offsetList$.next(newList)
            }
          })
      }
    })

    return {
      fixedItemHeight$,
      itemHeights$,
      stickyItems$,
      offsetList$,
    }
  },
  ({ fixedItemHeight$ }, { itemHeight }: { itemHeight: number }) => {
    fixedItemHeight$.next(itemHeight)
  }
)
