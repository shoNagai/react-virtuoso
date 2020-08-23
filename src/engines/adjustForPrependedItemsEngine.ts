import { TObservable, withLatestFrom, coldSubject, TSubject, subject } from '../tinyrx'
import { OffsetList } from '../OffsetList'

interface AdjustForPrependedItemsParams {
  offsetList$: TSubject<OffsetList>
  scrollTop$: TObservable<number>
  scrollTo$: TSubject<ScrollToOptions>
  isHorizontal: boolean | undefined
}

export function adjustForPrependedItemsEngine({
  offsetList$,
  scrollTop$,
  scrollTo$,
  isHorizontal,
}: AdjustForPrependedItemsParams) {
  const adjustForPrependedItems$ = coldSubject<number>()

  const adjustmentInProgress$ = subject(false)
  adjustForPrependedItems$
    .pipe(withLatestFrom(offsetList$, scrollTop$, adjustmentInProgress$))
    .subscribe(([count, offsetList, scrollTop, inProgress]) => {
      if (inProgress || offsetList.empty()) {
        return
      }

      adjustmentInProgress$.next(true)
      offsetList$.next(offsetList.adjustForPrependedItems(count))

      setTimeout(() => {
        if (isHorizontal) {
          scrollTo$.next({ left: count * offsetList.getDefaultSize() + scrollTop })
        } else {
          scrollTo$.next({ top: count * offsetList.getDefaultSize() + scrollTop })
        }
        adjustmentInProgress$.next(false)
      })
    })

  return { adjustForPrependedItems$, adjustmentInProgress$ }
}
