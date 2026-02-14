import { Sidebar } from '@/components/nav/sidebar'
import { Header } from '@/components/nav/header'

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 transition-all duration-300 ease-in-out">
          {children}
        </main>
      </div>
    </div>
  )
}
