import { useRef, useState, useLayoutEffect } from 'react'
import ResizeObserver from 'resize-observer-polyfill'
import { TObservable, TSubscription, TSubject } from './tinyrx'

export type CallbackRefParam = HTMLElement | null
export type CallbackRef = (ref: CallbackRefParam) => void

type UseHeight = (
  input: TSubject<number>,
  onMount?: (ref: CallbackRefParam) => void,
  onResize?: (ref: HTMLElement) => void
) => CallbackRef

export const useHeight: UseHeight = (input, onMount, onResize) => {
  const ref = useRef<CallbackRefParam>(null)
  const currentHeight = useRef(0)
  const observer = new ResizeObserver(entries => {
    const newHeight = entries[0].contentRect.height
    if (currentHeight.current !== newHeight) {
      currentHeight.current = newHeight
      if (onResize) {
        onResize(entries[0].target as HTMLElement)
      }
      input.next(newHeight)
    }
  })

  const callbackRef = (elRef: CallbackRefParam) => {
    if (elRef) {
      observer.observe(elRef)
      if (onMount) {
        onMount(elRef)
      }
      ref.current = elRef
    } else {
      observer.unobserve(ref.current!)
      ref.current = null
    }
  }
  return callbackRef
}

export function useOutput<T>(output: TObservable<T>, initialValue: T): T {
  const [value, setValue] = useState(initialValue)
  let unsubscribe: TSubscription | undefined

  useLayoutEffect(() => {
    unsubscribe && unsubscribe()
    unsubscribe = output.subscribe(setValue)
    return () => {
      unsubscribe && unsubscribe()
    }
  }, [])
  return value
}

type UseSize = (callback: (params: { element: HTMLElement; width: number; height: number }) => void) => CallbackRef

export const useSize: UseSize = callback => {
  const ref = useRef<CallbackRefParam>(null)
  const currentSize = useRef([0, 0])

  const observer = new ResizeObserver(entries => {
    const { width, height } = entries[0].contentRect
    if (currentSize.current[0] !== width || currentSize.current[1] !== height) {
      currentSize.current = [width, height]
      callback({
        element: entries[0].target as HTMLElement,
        width,
        height,
      })
    }
  })

  const callbackRef = (elRef: CallbackRefParam) => {
    if (elRef) {
      observer.observe(elRef)
      ref.current = elRef
    } else {
      observer.unobserve(ref.current!)
      ref.current = null
    }
  }

  return callbackRef
}
