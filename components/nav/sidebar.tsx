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
  GraduationCap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { logout } from '@/app/actions/auth'

const iconMap = {
  LayoutDashboard,
  Users,
  Calendar,
  FolderOpen,
  MessageSquare,
  Settings,
} as const

const navItems = [
  { href: '/', label: '대시보드', icon: 'LayoutDashboard' as const },
  { href: '/students', label: '학생', icon: 'Users' as const },
  { href: '/schedule', label: '일정', icon: 'Calendar' as const },
  { href: '/materials', label: '자료', icon: 'FolderOpen' as const },
  { href: '/templates', label: '템플릿', icon: 'MessageSquare' as const },
  { href: '/settings', label: '설정', icon: 'Settings' as const },
] as const

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-screen w-56 flex-col border-r border-border bg-card">
      {/* Logo */}
      <Link
        href="/"
        className="flex h-16 items-center gap-2.5 px-5 transition-opacity hover:opacity-80"
      >
        <div className="flex size-9 items-center justify-center rounded-xl bg-primary shadow-sm">
          <GraduationCap className="size-5 text-primary-foreground" />
        </div>
        <h1 className="text-[15px] font-extrabold tracking-tight">리아쌤 OS</h1>
      </Link>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1 px-3 pt-3">
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
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors duration-150',
                isActive
                  ? 'bg-primary/10 text-primary font-bold'
                  : 'font-medium text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="size-[18px] shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Profile + Logout */}
      <div className="border-t border-border p-3">
        <div className="mb-1 flex items-center gap-3 px-3 py-2">
          <div className="flex size-8 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
            리
          </div>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-bold">리아쌤</p>
            <p className="truncate text-[11px] text-muted-foreground">IB 수학·과학</p>
          </div>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className={cn(
              'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium',
              'text-muted-foreground transition-colors duration-150',
              'hover:bg-destructive/10 hover:text-destructive'
            )}
          >
            <LogOut className="size-[18px] shrink-0" />
            로그아웃
          </button>
        </form>
      </div>
    </aside>
  )
}
