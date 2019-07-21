import { VirtuosoGridEngine } from '../src/VirtuosoGridEngine'

describe('Grid Virtuoso Engine', () => {
  it('outputs a single probe item initially', () => {
    const { itemRange, gridDimensions } = VirtuosoGridEngine()

    const itemRangeCallback = jest.fn()

    gridDimensions.next([1000, 500, undefined, undefined])

    itemRange.subscribe(itemRangeCallback)
    expect(itemRangeCallback).toHaveBeenCalledWith([0, 0])
  })

  it('outputs enough items to fill in the screen', () => {
    const { itemRange, gridDimensions, totalCount } = VirtuosoGridEngine()

    totalCount.next(2000)
    gridDimensions.next([1000, 500, 300, 200])

    const itemCount = Math.floor(1000 / 300) * Math.ceil(500 / 200)

    const itemRangeCallback = jest.fn()
    itemRange.subscribe(itemRangeCallback)

    expect(itemRangeCallback).toHaveBeenCalledWith([0, itemCount - 1])
  })

  it('reuses currently rendered items if possible', () => {
    const { totalCount, itemRange, gridDimensions, scrollTop } = VirtuosoGridEngine()

    totalCount.next(2000)
    gridDimensions.next([1000, 500, 300, 200])
    const itemRangeCallback = jest.fn()
    itemRange.subscribe(itemRangeCallback)

    scrollTop.next(50)

    expect(itemRangeCallback).toHaveBeenCalledWith([0, 8])
  })

  it('offsets the range when scrolling', () => {
    const { totalCount, itemRange, gridDimensions, scrollTop } = VirtuosoGridEngine()

    totalCount.next(2000)
    gridDimensions.next([1000, 500, 300, 200])
    scrollTop.next(300)

    const itemCount = Math.floor(1000 / 300) * Math.ceil(500 / 200)

    const itemRangeCallback = jest.fn()
    itemRange.subscribe(itemRangeCallback)

    expect(itemRangeCallback).toHaveBeenCalledWith([3, itemCount - 1 + 3])
  })

  it('calculates the total height', () => {
    const { totalCount, gridDimensions, totalHeight } = VirtuosoGridEngine()
    gridDimensions.next([10, 5, 3, 2])
    totalCount.next(20)
    const totalHeightCallback = jest.fn()
    totalHeight.subscribe(totalHeightCallback)

    expect(totalHeightCallback).toHaveBeenCalledWith(14)
  })

  it('takes overscan into account', () => {
    const { totalCount, itemRange, gridDimensions, overscan } = VirtuosoGridEngine()

    const OVERSCAN = 200
    const CONTAINER_WIDTH = 1000
    const ITEM_WIDTH = 300
    const CONTAINER_HEIGHT = 500
    overscan.next(OVERSCAN)
    totalCount.next(2000)
    gridDimensions.next([CONTAINER_WIDTH, CONTAINER_HEIGHT, ITEM_WIDTH, 200])

    const itemCount = Math.floor(CONTAINER_WIDTH / ITEM_WIDTH) * Math.ceil((CONTAINER_HEIGHT + OVERSCAN) / 200)

    const itemRangeCallback = jest.fn()
    itemRange.subscribe(itemRangeCallback)

    expect(itemRangeCallback).toHaveBeenCalledWith([0, itemCount - 1])
  })

  it('does not overflow past the last item', () => {
    const { scrollTop, totalCount, gridDimensions, itemRange, overscan } = VirtuosoGridEngine()
    overscan.next(4)
    totalCount.next(39)
    gridDimensions.next([9, 6, 3, 2])
    scrollTop.next(20)
    const itemRangeCallback = jest.fn()
    itemRange.subscribe(itemRangeCallback)
    expect(itemRangeCallback).toHaveBeenCalledWith([30, 38])
  })

  it('does not overflow past the first item', () => {
    const { scrollTop, totalCount, gridDimensions, itemRange, overscan } = VirtuosoGridEngine()
    gridDimensions.next([10, 5, 3, 2])
    overscan.next(2)
    totalCount.next(30)
    let call = 0
    const itemRangeCallback = (range: [number, number]) => {
      call++
      if (call == 3) {
        expect(range).toEqual([0, 11])
      }
    }
    itemRange.subscribe(itemRangeCallback)
    scrollTop.next(8)
    scrollTop.next(2)
  })

  it('offsets list correctly', () => {
    const { scrollTop, totalCount, gridDimensions, listOffset } = VirtuosoGridEngine()
    gridDimensions.next([10, 5, 3, 2])
    totalCount.next(200)
    scrollTop.next(4)
    const listOffsetCallback = jest.fn()
    listOffset.subscribe(listOffsetCallback)
    expect(listOffsetCallback).toHaveBeenCalledWith(4)
  })
})
