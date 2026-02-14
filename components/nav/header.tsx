'use client'

import { usePathname } from 'next/navigation'
import { CalendarDays } from 'lucide-react'

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

export function Header() {
  const pathname = usePathname()
  const pageTitle = getPageTitle(pathname)
  const today = formatDate(new Date())

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-6">
      <h2 className="text-base font-semibold text-foreground">{pageTitle}</h2>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <CalendarDays className="h-4 w-4" />
        <span>{today}</span>
      </div>
    </header>
  )
}
