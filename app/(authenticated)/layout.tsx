import { Sidebar } from '@/components/nav/sidebar'
import { Header } from '@/components/nav/header'
import { SWRProvider } from '@/components/providers/swr-provider'

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SWRProvider>
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6 transition-all duration-300 ease-in-out">
            {children}
          </main>
        </div>
      </div>
    </SWRProvider>
  )
}
