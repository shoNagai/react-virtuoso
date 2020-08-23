import * as React from 'react'
import { CSSProperties, FC, ReactElement, useContext, ComponentType } from 'react'
import { ItemHeight } from 'VirtuosoStore'
import { verticalStyle, horizontalStyle } from './Style'
import { CallbackRef, useHeight, useOutput } from './Utils'
import { VirtuosoContext } from './VirtuosoContext'
import { VerticalFiller, HorizontalFiller } from './VirtuosoFiller'
import { VirtuosoList } from './VirtuosoList'
import { TScrollContainer, VirtuosoScroller } from './VirtuosoScroller'

export const DefaultHeaderContainer: React.FC<{ headerRef: CallbackRef }> = ({ children, headerRef }) => (
  <header ref={headerRef}>{children}</header>
)

export const DefaultFooterContainer: React.FC<{ footerRef: CallbackRef }> = ({ children, footerRef }) => (
  <footer ref={footerRef}>{children}</footer>
)

export const DefaultListContainer: React.FC<{ listRef: CallbackRef; style: CSSProperties }> = ({
  children,
  listRef,
  style,
}) => {
  return (
    <div ref={listRef} style={style}>
      {children}
    </div>
  )
}

export type TListContainer = typeof DefaultListContainer
export type THeaderContainer = typeof DefaultHeaderContainer
export type TFooterContainer = typeof DefaultFooterContainer

export { TScrollContainer }

const VirtuosoHeader: FC<{ header: () => ReactElement; HeaderContainer?: THeaderContainer }> = ({
  header,
  HeaderContainer = DefaultHeaderContainer,
}) => {
  const headerCallbackRef = useHeight(useContext(VirtuosoContext)!.headerHeight)
  return <HeaderContainer headerRef={headerCallbackRef}>{header()}</HeaderContainer>
}

const VirtuosoFooter: FC<{ footer: () => ReactElement; FooterContainer?: TFooterContainer }> = ({
  footer,
  FooterContainer = DefaultFooterContainer,
}) => {
  const footerCallbackRef = useHeight(useContext(VirtuosoContext)!.footerHeight)
  return <FooterContainer footerRef={footerCallbackRef}>{footer()}</FooterContainer>
}

const getHeights = (children: HTMLCollection, isHorizontal: boolean | undefined) => {
  const results: ItemHeight[] = []
  for (let i = 0, len = children.length; i < len; i++) {
    const child = children.item(i) as HTMLElement

    if (!child || child.dataset.index === undefined) {
      continue
    }

    const index = parseInt(child.dataset.index!)
    const knownSize = parseInt(child.dataset.knownSize!)
    const size = isHorizontal ? child.offsetWidth : child.offsetHeight

    if (size === knownSize || size === 0) {
      continue
    }

    const lastResult = results[results.length - 1]
    if (results.length === 0 || lastResult.size !== size || lastResult.end !== index - 1) {
      results.push({ start: index, end: index, size })
    } else {
      results[results.length - 1].end++
    }
  }

  return results
}

const ListWrapper: React.FC<{
  fixedItemHeight: boolean
  ListContainer: TListContainer
  isHorizontal: boolean | undefined
}> = ({ fixedItemHeight, children, ListContainer, isHorizontal }) => {
  const { listHeight, itemHeights, listOffset } = useContext(VirtuosoContext)!
  const translate = useOutput<number>(listOffset, 0)
  const style: React.CSSProperties = isHorizontal ? { marginLeft: `${translate}px` } : { marginTop: `${translate}px` }

  const listCallbackRef = useHeight(
    listHeight,
    () => {},
    ref => {
      if (!fixedItemHeight) {
        const measuredItemHeights = getHeights(ref!.children, isHorizontal)
        itemHeights(measuredItemHeights)
      }
    },
    isHorizontal
  )

  return (
    <ListContainer listRef={listCallbackRef} style={style}>
      {children}
    </ListContainer>
  )
}

export const VirtuosoView: React.FC<{
  style: CSSProperties
  className?: string
  header?: () => ReactElement
  footer?: () => ReactElement
  ScrollContainer?: TScrollContainer
  ListContainer: TListContainer
  HeaderContainer?: THeaderContainer
  FooterContainer?: TFooterContainer
  fixedItemHeight: boolean
  emptyComponent?: ComponentType
  isHorizontal?: boolean
}> = ({
  style,
  header,
  footer,
  fixedItemHeight,
  ScrollContainer,
  ListContainer,
  HeaderContainer,
  FooterContainer,
  className,
  emptyComponent,
  isHorizontal,
}) => {
  const { scrollTo, scrollTop, totalHeight, viewportHeight } = useContext(VirtuosoContext)!
  const fillerHeight = useOutput<number>(totalHeight, 0)
  const reportScrollTop = (st: number) => {
    scrollTop(Math.max(st, 0))
  }

  const viewportCallbackRef = useHeight(viewportHeight)

  return (
    <VirtuosoScroller
      style={style}
      ScrollContainer={ScrollContainer}
      className={className}
      scrollTo={scrollTo}
      scrollTop={reportScrollTop}
      isHorizontal={isHorizontal}
    >
      <div ref={viewportCallbackRef} style={isHorizontal ? horizontalStyle : verticalStyle}>
        <ListWrapper fixedItemHeight={fixedItemHeight} ListContainer={ListContainer} isHorizontal={isHorizontal}>
          {header && <VirtuosoHeader header={header} HeaderContainer={HeaderContainer} />}
          <VirtuosoList emptyComponent={emptyComponent} isHorizontal={isHorizontal} />
          {footer && <VirtuosoFooter footer={footer} FooterContainer={FooterContainer} />}
        </ListWrapper>
      </div>

      {isHorizontal ? <HorizontalFiller width={fillerHeight} /> : <VerticalFiller height={fillerHeight} />}
    </VirtuosoScroller>
  )
}
