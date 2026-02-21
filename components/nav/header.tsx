'use client'

import { usePathname } from 'next/navigation'
import { CalendarDays, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/students': '학생 관리',
  '/schedule': '스케줄',
  '/materials': '자료 관리',
}

function getPageTitle(pathname: string): string {
  if (pageTitles[pathname]) {
    return pageTitles[pathname]
  }

  // Handle dynamic routes like /students/[id]
  const segments = pathname.split('/')
  const parentPath = `/${segments[1]}`
  const parentTitle = pageTitles[parentPath]

  if (parentTitle) {
    return `${parentTitle} > 상세`
  }

  return 'Rocket Tutor'
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })
}

export function Header({
  showMenuButton = false,
  onMenuClick,
}: {
  readonly showMenuButton?: boolean
  readonly onMenuClick?: () => void
}) {
  const pathname = usePathname()
  const pageTitle = getPageTitle(pathname)
  const today = formatDate(new Date())

  return (
    <header className="flex h-14 items-center justify-between border-b border-white/15 bg-white/50 px-4 backdrop-blur-xl dark:bg-white/5 md:px-6">
      <div className="flex items-center gap-2">
        {showMenuButton && (
          <Button variant="ghost" size="icon" onClick={onMenuClick} className="shrink-0">
            <Menu className="size-5" />
          </Button>
        )}
        <h2 className="text-sm font-semibold text-foreground">{pageTitle}</h2>
      </div>
      <div className="flex items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1 text-xs text-muted-foreground">
        <CalendarDays className="size-3.5" />
        <span className="hidden sm:inline">{today}</span>
      </div>
    </header>
  )
}
