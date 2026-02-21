'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Calendar,
  FolderOpen,
  LogOut,
  Rocket,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { logout } from '@/app/actions/auth'

const iconMap = {
  LayoutDashboard,
  Users,
  Calendar,
  FolderOpen,
} as const

const navItems = [
  { href: '/', label: 'Dashboard', icon: 'LayoutDashboard' as const },
  { href: '/students', label: '학생 관리', icon: 'Users' as const },
  { href: '/schedule', label: '스케줄', icon: 'Calendar' as const },
  { href: '/materials', label: '자료 관리', icon: 'FolderOpen' as const },
] as const

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-white/15 bg-sidebar backdrop-blur-xl">
      {/* Logo */}
      <Link href="/" className="flex h-14 items-center gap-2.5 border-b border-white/15 px-5 transition-opacity hover:opacity-80">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
          <Rocket className="size-4 text-primary-foreground" />
        </div>
        <h1 className="text-base font-bold tracking-tight">Rocket Tutor</h1>
      </Link>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-0.5 px-3 pt-4">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
          Menu
        </p>
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
                'flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium',
                'transition-all duration-150',
                isActive
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              <Icon className={cn('size-4 shrink-0', isActive && 'text-primary')} />
              {item.label}
              {isActive && (
                <span className="ml-auto size-1.5 rounded-full bg-primary" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="border-t border-white/15 p-3">
        <form action={logout}>
          <button
            type="submit"
            className={cn(
              'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium',
              'text-muted-foreground transition-all duration-150',
              'hover:bg-destructive/10 hover:text-destructive'
            )}
          >
            <LogOut className="size-4 shrink-0" />
            로그아웃
          </button>
        </form>
      </div>
    </aside>
  )
}
