'use client'

import { useIsMobile } from '@/lib/hooks/use-mobile'
import { Header } from './header'
import { BottomTabBar } from './bottom-tab-bar'

export function MobileLayout({
  children,
}: {
  readonly children: React.ReactNode
}) {
  const isMobile = useIsMobile()

  if (!isMobile) {
    // Desktop: top navigation only, no sidebar
    return (
      <div className="flex h-screen flex-col glass-mesh">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    )
  }

  // Mobile: header + fixed bottom tab bar (no hamburger drawer)
  return (
    <div className="flex h-screen flex-col glass-mesh">
      <Header />
      <main className="flex-1 overflow-y-auto p-4 pb-[calc(4.5rem+env(safe-area-inset-bottom))]">
        {children}
      </main>
      <BottomTabBar />
    </div>
  )
}
