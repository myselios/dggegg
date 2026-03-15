'use client'

import { useState, useCallback } from 'react'
import { useIsMobile } from '@/lib/hooks/use-mobile'
import { Sidebar } from './sidebar'
import { Header } from './header'

export function MobileLayout({
  children,
}: {
  readonly children: React.ReactNode
}) {
  const isMobile = useIsMobile()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleMenuClick = useCallback(() => setSidebarOpen(true), [])
  const handleClose = useCallback(() => setSidebarOpen(false), [])

  if (!isMobile) {
    // Desktop: top navigation only, no sidebar
    return (
      <div className="flex h-screen flex-col glass-mesh">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    )
  }

  // Mobile: header with hamburger + overlay sidebar drawer
  return (
    <div className="flex h-screen flex-col glass-mesh">
      <Header showMenuButton onMenuClick={handleMenuClick} />
      <main className="flex-1 overflow-y-auto p-4">{children}</main>

      {/* Overlay sidebar */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={handleClose}
            onKeyDown={(e) => e.key === 'Escape' && handleClose()}
            role="button"
            tabIndex={0}
            aria-label="Close sidebar"
          />
          <div className="fixed inset-y-0 left-0 z-50 w-60 shadow-xl" onClick={handleClose}>
            <Sidebar />
          </div>
        </>
      )}
    </div>
  )
}
