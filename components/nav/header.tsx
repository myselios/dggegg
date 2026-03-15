'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Calendar,
  FolderOpen,
  MessageSquare,
  Settings,
  LogOut,
  Rocket,
  Menu,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { logout } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'

const iconMap = {
  LayoutDashboard,
  Users,
  Calendar,
  FolderOpen,
  MessageSquare,
  Settings,
} as const

const navItems = [
  { href: '/', label: 'Dashboard', icon: 'LayoutDashboard' as const },
  { href: '/students', label: '학생 관리', icon: 'Users' as const },
  { href: '/schedule', label: '스케줄', icon: 'Calendar' as const },
  { href: '/materials', label: '자료', icon: 'FolderOpen' as const },
  { href: '/templates', label: '템플릿', icon: 'MessageSquare' as const },
  { href: '/settings', label: '설정', icon: 'Settings' as const },
] as const

export function Header({
  showMenuButton = false,
  onMenuClick,
}: {
  readonly showMenuButton?: boolean
  readonly onMenuClick?: () => void
}) {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-white/15 bg-white/70 px-4 backdrop-blur-xl dark:bg-black/40 md:px-6">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 shrink-0 transition-opacity hover:opacity-80">
        <div className="flex size-7 items-center justify-center rounded-lg bg-primary">
          <Rocket className="size-3.5 text-primary-foreground" />
        </div>
        <span className="text-sm font-bold tracking-tight hidden sm:inline">리아쌤</span>
      </Link>

      {/* Mobile menu button */}
      {showMenuButton && (
        <Button variant="ghost" size="icon" onClick={onMenuClick} className="shrink-0 md:hidden">
          <Menu className="size-5" />
        </Button>
      )}

      {/* Nav items — desktop */}
      <nav className="hidden md:flex items-center gap-0.5 flex-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href))
          const Icon = iconMap[item.icon]

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-all duration-150',
                isActive
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              <Icon className={cn('size-3.5 shrink-0', isActive && 'text-primary')} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Right side — logout */}
      <div className="ml-auto flex items-center gap-2">
        <form action={logout}>
          <button
            type="submit"
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium',
              'text-muted-foreground transition-all duration-150',
              'hover:bg-destructive/10 hover:text-destructive'
            )}
          >
            <LogOut className="size-3.5 shrink-0" />
            <span className="hidden sm:inline">로그아웃</span>
          </button>
        </form>
      </div>
    </header>
  )
}
