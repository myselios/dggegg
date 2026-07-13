'use client'

import { useTemplates } from '@/lib/hooks/use-templates'
import { TemplateList } from '@/components/templates/template-list'

export default function TemplatesPage() {
  const { data: templates, isLoading } = useTemplates()

  return (
    <div className="flex flex-col gap-6">
      <h2 data-testid="page-title" className="text-2xl font-bold tracking-tight">
        템플릿 보관함
      </h2>
      {isLoading || !templates ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="glass-card h-36 animate-pulse rounded-2xl" />
          <div className="glass-card h-36 animate-pulse rounded-2xl" />
          <div className="glass-card h-36 animate-pulse rounded-2xl" />
          <div className="glass-card h-36 animate-pulse rounded-2xl" />
        </div>
      ) : (
        <TemplateList initialTemplates={templates} />
      )}
    </div>
  )
}
