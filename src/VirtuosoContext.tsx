import { createContext } from 'react'
import { VirtuosoEngine } from './VirtuosoEngine'

export const VirtuosoContext = createContext<ReturnType<typeof VirtuosoEngine> | undefined>(undefined)
