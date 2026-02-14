'use client'

import { SWRConfig } from 'swr'

export function SWRProvider({ children }: { readonly children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        dedupingInterval: 5000,
        revalidateOnFocus: false,
        errorRetryCount: 3,
      }}
    >
      {children}
    </SWRConfig>
  )
}
