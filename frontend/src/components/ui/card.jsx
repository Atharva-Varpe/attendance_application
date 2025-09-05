import React from 'react'
import { cn } from '../../lib/utils'

export function Card({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-white/20 bg-white/60 dark:bg-black/30 backdrop-blur-md shadow-sm',
        'transition-colors',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className, children, ...props }) {
  return (
    <div className={cn('px-4 pt-4', className)} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({ className, children, ...props }) {
  return (
    <h3 className={cn('text-base font-semibold leading-6', className)} {...props}>
      {children}
    </h3>
  )
}

export function CardContent({ className, children, ...props }) {
  return (
    <div className={cn('px-4 pb-4', className)} {...props}>
      {children}
    </div>
  )
}


