'use client'

import { useIsMobile } from '@/lib/hooks/use-mobile'
import { useAutoCompletePastEvents } from '@/lib/hooks/use-schedule-sync'
import { Header } from './header'
import { Sidebar } from './sidebar'
import { BottomTabBar } from './bottom-tab-bar'

export function MobileLayout({
  children,
}: {
  readonly children: React.ReactNode
}) {
  const isMobile = useIsMobile()
  // 인증된 화면 전체의 공용 래퍼 — 대시보드뿐 아니라 스케줄 등
  // 어떤 페이지로 먼저 들어와도 지난 수업 자동 완료가 실행된다.
  useAutoCompletePastEvents()

  if (!isMobile) {
    // Desktop: left sidebar navigation
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    )
  }

  // Mobile: header + fixed bottom tab bar (no hamburger drawer)
  return (
    <div className="flex h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 overflow-y-auto p-4 pb-[calc(4.5rem+env(safe-area-inset-bottom))]">
        {children}
      </main>
      <BottomTabBar />
    </div>
  )
}
