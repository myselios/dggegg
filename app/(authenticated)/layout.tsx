import { MobileLayout } from '@/components/nav/mobile-layout'
import { SWRProvider } from '@/components/providers/swr-provider'

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SWRProvider>
      <MobileLayout>{children}</MobileLayout>
    </SWRProvider>
  )
}
