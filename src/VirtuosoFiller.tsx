import * as React from 'react'
import { FC } from 'react'

export const VerticalFiller: FC<{ height: number }> = ({ height }) => (
  <div style={{ height: `${height}px`, position: 'absolute', top: 0 }}>&nbsp;</div>
)

export const HorizontalFiller: FC<{ width: number }> = ({ width }) => (
  <div style={{ width: `${width}px`, position: 'absolute', left: 0 }}>&nbsp;</div>
)
