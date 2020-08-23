import * as React from 'react'
import { FC, CSSProperties, useCallback, useRef } from 'react'

const verticalStyle: React.CSSProperties = {
  height: '100%',
  overflowY: 'auto',
  WebkitOverflowScrolling: 'touch',
  position: 'relative',
  outline: 'none',
}

const horizontalStyle: React.CSSProperties = {
  width: '100%',
  display: 'flex',
  overflowX: 'auto',
  whiteSpace: 'nowrap',
  WebkitOverflowScrolling: 'touch',
  position: 'relative',
  outline: 'none',
}

export type TScrollContainer = FC<{
  style: CSSProperties
  className?: string
  reportScrollTop: (scrollTop: number) => void
  scrollTo: (callback: (scrollTop: ScrollToOptions) => void) => void
  isHorizontal?: boolean
}>

const DefaultScrollContainer: TScrollContainer = ({
  className,
  style,
  reportScrollTop,
  scrollTo,
  isHorizontal,
  children,
}) => {
  const elRef = useRef<HTMLElement | null>(null)
  const smoothScrollTarget = useRef<number | null>(null)
  const currentScrollTop = useRef<number | null>()

  const onScroll: EventListener = useCallback(
    (e: Event) => {
      const scrollTop = isHorizontal ? (e.target as HTMLDivElement).scrollLeft : (e.target as HTMLDivElement).scrollTop
      currentScrollTop.current = scrollTop
      if (smoothScrollTarget.current !== null) {
        if (smoothScrollTarget.current === scrollTop) {
          // console.log('reporting smooth scrolling')
          smoothScrollTarget.current = null
          reportScrollTop(scrollTop)
        } else {
          // console.log('skip reporting')
        }
      } else {
        reportScrollTop(scrollTop)
      }
    },
    [reportScrollTop, isHorizontal]
  )

  const ref = useCallback(
    (theRef: HTMLElement | null) => {
      if (theRef) {
        theRef.addEventListener('scroll', onScroll, { passive: true })
        elRef.current = theRef
      } else {
        if (elRef.current) {
          elRef.current.removeEventListener('scroll', onScroll)
        }
      }
    },
    [onScroll]
  )

  scrollTo(location => {
    if (isHorizontal && currentScrollTop.current !== location.left) {
      if (location.behavior === 'smooth') {
        smoothScrollTarget.current = location.left!
      }
      elRef.current && elRef.current!.scrollTo(location)
    }
    if (!isHorizontal && currentScrollTop.current !== location.top) {
      if (location.behavior === 'smooth') {
        smoothScrollTarget.current = location.top!
      }
      elRef.current && elRef.current!.scrollTo(location)
    }
  })

  return (
    <div ref={ref} style={style} tabIndex={0} className={className}>
      {children}
    </div>
  )
}

export const VirtuosoScroller: FC<{
  className?: string
  style: CSSProperties
  ScrollContainer?: TScrollContainer
  scrollTop: (scrollTop: number) => void
  scrollTo: (callback: (scrollTop: ScrollToOptions) => void) => void
  isHorizontal?: boolean
}> = ({ children, style, className, ScrollContainer = DefaultScrollContainer, scrollTop, scrollTo, isHorizontal }) => {
  const scrollerStyle = isHorizontal ? horizontalStyle : verticalStyle
  return (
    <ScrollContainer
      style={{ ...scrollerStyle, ...style }}
      reportScrollTop={scrollTop}
      scrollTo={scrollTo}
      isHorizontal={isHorizontal}
      className={className}
    >
      {children}
    </ScrollContainer>
  )
}
