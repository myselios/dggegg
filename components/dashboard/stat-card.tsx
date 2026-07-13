'use client'

import { useEffect, useRef, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type Props = {
  readonly label: string
  readonly value: number
  readonly icon: LucideIcon
  readonly cardClassName: string
  readonly iconBgClassName: string
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

export function StatCard({ label, value, icon: Icon, cardClassName, iconBgClassName }: Props) {
  const displayValue = useCountUp(value)

  return (
    <Card
      className={cn(
        'glass-card border-none rounded-2xl h-full bento-tile',
        cardClassName
      )}
    >
      <CardContent className="flex h-full items-center gap-4 py-5">
        <div
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-xl',
            iconBgClassName
          )}
        >
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wider opacity-70">
            {label}
          </p>
          <p className="text-2xl font-bold tabular-nums leading-tight">
            {displayValue}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
