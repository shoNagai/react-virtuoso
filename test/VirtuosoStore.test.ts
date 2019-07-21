import { VirtuosoEngine } from '../src/VirtuosoEngine'

describe('Virtuoso Store', () => {
  it('calculates the total height of the list', done => {
    const { totalHeight, itemHeights, totalCount } = VirtuosoEngine()

    totalCount.next(100)

    let i = 0

    totalHeight.subscribe(val => {
      if (i == 0) {
        expect(val).toBe(0)
      } else {
        expect(val).toBe(5000)
        done()
      }
      i++
    })

    itemHeights.next([{ start: 0, end: 0, size: 50 }])
  })

  it('leaves space for the footer', done => {
    const { totalCount, totalHeight, footerHeight, itemHeights } = VirtuosoEngine()

    totalCount.next(100)
    itemHeights.next([{ start: 0, end: 0, size: 50 }])
    footerHeight.next(50)

    totalHeight.subscribe(val => {
      expect(val).toBe(5050)
      done()
    })
  })

  it('recalculates total when item height changes', done => {
    const { totalCount, totalHeight, itemHeights } = VirtuosoEngine()

    totalCount.next(100)
    itemHeights.next([{ start: 0, end: 0, size: 50 }])
    itemHeights.next([{ start: 0, end: 0, size: 30 }])

    totalHeight.subscribe(val => {
      expect(val).toBe(4980)
      done()
    })
  })

  it('emits a single item when the size is unknown', () => {
    const { totalCount, viewportHeight, list } = VirtuosoEngine()
    totalCount.next(100)
    viewportHeight.next(230)

    list.subscribe(items => {
      expect(items).toHaveLength(1)
    })
  })

  it('fills in the space with enough items', () => {
    const { totalCount, itemHeights, viewportHeight, list } = VirtuosoEngine()
    totalCount.next(100)

    viewportHeight.next(230)
    itemHeights.next([{ start: 0, end: 0, size: 50 }])

    list.subscribe(items => {
      expect(items).toHaveLength(5)
    })
  })

  it('removes items when total is reduced', () => {
    const { totalCount, itemHeights, viewportHeight, list } = VirtuosoEngine()
    totalCount.next(100)

    viewportHeight.next(230)
    itemHeights.next([{ start: 0, end: 0, size: 50 }])

    let i = 0
    list.subscribe(items => {
      switch (i++) {
        case 0:
          expect(items).toHaveLength(5)
          break
        case 1:
          expect(items).toHaveLength(0)
          break
        case 2:
          expect(items).toHaveLength(1)
          break
        default:
          throw new Error('should not get that many updates')
      }
    })

    totalCount.next(0)
    totalCount.next(1)
  })

  it('provides exact items for a given size', () => {
    const { totalCount, itemHeights, viewportHeight, list } = VirtuosoEngine()
    totalCount.next(100)

    viewportHeight.next(250)

    itemHeights.next([{ start: 0, end: 0, size: 50 }])

    list.subscribe(items => {
      expect(items).toHaveLength(5)
    })
  })

  it('moves to the correct window', () => {
    const { totalCount, itemHeights, viewportHeight, list, scrollTop } = VirtuosoEngine()
    totalCount.next(100)

    viewportHeight.next(250)
    scrollTop.next(120)
    itemHeights.next([{ start: 0, end: 0, size: 50 }])

    list.subscribe(items => {
      expect(items[0].index).toEqual(2)
      expect(items).toHaveLength(6)
    })
  })

  it('fills in the overscan', () => {
    const { totalCount, itemHeights, viewportHeight, list, scrollTop, overscan } = VirtuosoEngine()
    totalCount.next(100)

    overscan.next(25)
    viewportHeight.next(250)
    scrollTop.next(120)
    itemHeights.next([{ start: 0, end: 0, size: 50 }])

    list.subscribe(items => {
      expect(items[0].index).toEqual(2)
      expect(items).toHaveLength(7)
    })
  })

  it('skips the fixed items', () => {
    const { totalCount, topItemCount, itemHeights, viewportHeight, list } = VirtuosoEngine()
    totalCount.next(100)

    topItemCount.next(3)
    viewportHeight.next(250)
    itemHeights.next([{ start: 0, end: 0, size: 50 }])

    list.subscribe(items => {
      expect(items[0].index).toEqual(3)
      expect(items).toHaveLength(2)
    })
  })

  it('picks the sticky items', done => {
    const { topList, groupCounts, itemHeights, viewportHeight, list } = VirtuosoEngine()

    groupCounts.next([10, 90, 100])
    viewportHeight.next(250)
    itemHeights.next([{ start: 0, end: 0, size: 50 }])
    itemHeights.next([{ start: 1, end: 1, size: 50 }])

    topList.subscribe(topItems => {
      expect(topItems).toHaveLength(1)
      expect(topItems[0]).toMatchObject({ index: 0, size: 50, offset: NaN })
    })

    list.subscribe(items => {
      expect(items[0].index).toEqual(1)
      expect(items).toHaveLength(4)
      done()
    })
  })

  it('selects the closest sticky item', done => {
    const { topList, groupCounts, scrollTop, itemHeights, viewportHeight } = VirtuosoEngine()

    groupCounts.next([10, 90, 100])
    viewportHeight.next(250)
    itemHeights.next([{ start: 0, end: 0, size: 50 }])
    itemHeights.next([{ start: 1, end: 1, size: 50 }])
    scrollTop.next(2000) // should scroll past the first item, into the second

    topList.subscribe(topItems => {
      expect(topItems).toHaveLength(1)
      expect(topItems[0]).toMatchObject({ index: 11, size: 50, offset: NaN })
      done()
    })
  })

  it('infers total height for a grouped list from the first group and the first item', done => {
    const { totalHeight, groupCounts, itemHeights } = VirtuosoEngine()

    groupCounts.next([10, 90, 100])
    itemHeights.next([{ start: 0, end: 0, size: 50 }])
    itemHeights.next([{ start: 1, end: 1, size: 20 }])

    totalHeight.subscribe((total: number) => {
      expect(total).toEqual(3 * 50 + (10 + 90 + 100) * 20)
      done()
    })
  })

  it('translates the scrollToIndex to a given offset', done => {
    const { itemHeights, scrollToIndex, scrollTo } = VirtuosoEngine()
    itemHeights.next([{ start: 0, end: 0, size: 50 }])

    scrollTo.subscribe(offset => {
      expect(offset).toEqual(500)
      done()
    })

    scrollToIndex.next(10)
  })

  it('scrolls to display the item at the bottom of the visible viewport', done => {
    const { viewportHeight, itemHeights, scrollToIndex, scrollTo } = VirtuosoEngine()
    const itemSize = 50
    itemHeights.next([{ start: 0, end: 0, size: itemSize }])
    viewportHeight.next(820)

    scrollTo.subscribe(offset => {
      expect(offset).toEqual(itemSize * 20 - 820 + itemSize)
      done()
    })

    scrollToIndex.next({ index: 20, align: 'end' })
  })

  it('scrolls to display the item at the center of the visible viewport', done => {
    const { viewportHeight, itemHeights, scrollToIndex, scrollTo } = VirtuosoEngine()
    const itemSize = 50
    itemHeights.next([{ start: 0, end: 0, size: itemSize }])
    viewportHeight.next(820)

    scrollTo.subscribe(offset => {
      expect(offset).toEqual(itemSize * 20 - 820 / 2 + itemSize / 2)
      done()
    })

    scrollToIndex.next({ index: 20, align: 'center' })
  })

  it('takes into account the top list height when scrolling to a given location', done => {
    const { totalCount, topItemCount, itemHeights, scrollToIndex, scrollTo } = VirtuosoEngine()
    totalCount.next(100)
    itemHeights.next([{ start: 0, end: 0, size: 50 }])
    topItemCount.next(3)

    scrollTo.subscribe(offset => {
      expect(offset).toEqual(50 * 10 - 3 * 50)
      done()
    })

    scrollToIndex.next(10)
  })

  it('scrolls to display the first item in the group', done => {
    const { itemHeights, scrollToIndex, scrollTo, groupCounts } = VirtuosoEngine()
    groupCounts.next([10, 10, 10])
    itemHeights.next([{ start: 0, end: 0, size: 50 }])
    itemHeights.next([{ start: 1, end: 1, size: 20 }])

    scrollTo.subscribe(offset => {
      expect(offset).toEqual(50 * 2 + 20 * 20)
      done()
    })

    scrollToIndex.next(22)
  })
})
