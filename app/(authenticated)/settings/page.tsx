import { Suspense } from 'react'
import { SettingsContent } from './settings-content'

export const dynamic = 'force-dynamic'

export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsLoadingSkeleton />}>
      <SettingsContent />
    </Suspense>
  )
}

function SettingsLoadingSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <div className="glass-card flex items-center gap-3 rounded-2xl p-5">
        <div className="size-11 animate-pulse rounded-xl bg-muted" />
        <div className="flex flex-col gap-2">
          <div className="h-5 w-20 animate-pulse rounded bg-muted" />
          <div className="h-3 w-32 animate-pulse rounded bg-muted" />
        </div>
      </div>
      <div className="glass-card h-24 animate-pulse rounded-2xl" />
    </div>
  )
}
