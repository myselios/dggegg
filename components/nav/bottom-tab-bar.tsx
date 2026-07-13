'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Calendar,
  FolderOpen,
  MessageSquare,
  Settings,
  MoreHorizontal,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from '@/components/ui/sheet'

const primaryTabs = [
  { href: '/', label: '대시보드', icon: LayoutDashboard },
  { href: '/students', label: '학생', icon: Users },
  { href: '/schedule', label: '스케줄', icon: Calendar },
  { href: '/materials', label: '자료', icon: FolderOpen },
] as const

const moreItems = [
  { href: '/templates', label: '템플릿 보관함', icon: MessageSquare },
  { href: '/settings', label: '설정', icon: Settings },
] as const

function isTabActive(pathname: string, href: string) {
  return pathname === href || (href !== '/' && pathname.startsWith(href))
}

export function BottomTabBar() {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)

  const handleMoreOpenChange = useCallback((open: boolean) => setMoreOpen(open), [])
  const isMoreActive = moreItems.some((item) => isTabActive(pathname, item.href))

  return (
    <>
      <nav
        aria-label="주요 메뉴"
        className={cn(
          'fixed inset-x-0 bottom-0 z-40 border-t border-white/15 bg-white/80 backdrop-blur-xl',
          'dark:bg-black/50',
          'pb-[env(safe-area-inset-bottom)]'
        )}
      >
        <div className="grid grid-cols-5">
          {primaryTabs.map((item) => {
            const active = isTabActive(pathname, item.href)
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex min-h-11 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors duration-150',
                  active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className={cn('size-5 shrink-0', active && 'text-primary')} />
                {item.label}
              </Link>
            )
          })}

          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={cn(
              'flex min-h-11 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors duration-150',
              isMoreActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            )}
            aria-haspopup="dialog"
            aria-expanded={moreOpen}
          >
            <MoreHorizontal className={cn('size-5 shrink-0', isMoreActive && 'text-primary')} />
            더보기
          </button>
        </div>
      </nav>

      <Sheet open={moreOpen} onOpenChange={handleMoreOpenChange}>
        <SheetContent side="bottom" className="rounded-t-2xl pb-[calc(env(safe-area-inset-bottom)+1rem)]">
          <SheetHeader>
            <SheetTitle>더보기</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-1 px-4">
            {moreItems.map((item) => {
              const active = isTabActive(pathname, item.href)
              const Icon = item.icon

              return (
                <SheetClose key={item.href} asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150',
                      active
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    )}
                  >
                    <Icon className={cn('size-4 shrink-0', active && 'text-primary')} />
                    {item.label}
                  </Link>
                </SheetClose>
              )
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
