'use client'

import { useEffect, useRef, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type Props = {
  readonly label: string
  readonly value: number
  readonly icon: LucideIcon
  readonly iconBgClassName: string
  readonly iconColorClassName: string
}

const COUNT_UP_DURATION_MS = 700

function easeOutCubic(progress: number): number {
  return 1 - (1 - progress) ** 3
}

/** rAF 기반 카운트업. prefers-reduced-motion이면 애니메이션 없이 즉시 표시. */
function useCountUp(target: number): number {
  const [display, setDisplay] = useState(0)
  const frameRef = useRef<number | null>(null)

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches

    if (prefersReducedMotion) {
      frameRef.current = requestAnimationFrame(() => setDisplay(target))
      return () => {
        if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
      }
    }

    const startTime = performance.now()

    function tick(now: number) {
      const progress = Math.min((now - startTime) / COUNT_UP_DURATION_MS, 1)
      setDisplay(Math.round(target * easeOutCubic(progress)))
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick)
      }
    }

    frameRef.current = requestAnimationFrame(tick)

    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
    }
  }, [target])

  return display
}

export function StatCard({
  label,
  value,
  icon: Icon,
  iconBgClassName,
  iconColorClassName,
}: Props) {
  const displayValue = useCountUp(value)

  return (
    <Card className="glass-card border-none rounded-2xl h-full bento-tile">
      <CardContent className="flex h-full items-center gap-4 py-5">
        <div
          className={cn(
            'flex size-11 shrink-0 items-center justify-center rounded-xl',
            iconBgClassName
          )}
        >
          <Icon className={cn('size-5', iconColorClassName)} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-0.5 text-3xl font-extrabold tabular-nums leading-none text-foreground">
            {displayValue}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
