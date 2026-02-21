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
    <aside className="flex h-screen w-60 flex-col border-r bg-muted/30">
      {/* Logo */}
      <Link href="/" className="flex h-14 items-center gap-2 border-b px-4 transition-opacity hover:opacity-80">
        <Rocket className="size-5 text-primary" />
        <h1 className="text-lg font-semibold tracking-tight">Rocket Tutor</h1>
      </Link>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1 p-3">
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
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium',
                'transition-all duration-200 ease-in-out',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="border-t p-3">
        <form action={logout}>
          <button
            type="submit"
            className={cn(
              'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium',
              'text-muted-foreground transition-all duration-200 ease-in-out',
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
