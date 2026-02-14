import { logout } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'

export function Header() {
  return (
    <header className="flex h-14 items-center justify-between border-b px-6">
      <div />
      <form action={logout}>
        <Button variant="ghost" size="sm" type="submit">
          로그아웃
        </Button>
      </form>
    </header>
  )
}
