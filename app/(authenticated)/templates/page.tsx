import { getTemplates } from '@/app/actions/templates'
import { TemplateList } from '@/components/templates/template-list'

export const dynamic = 'force-dynamic'

export default async function TemplatesPage() {
  const result = await getTemplates()
  const templates = result.success ? result.data : []

  return (
    <div className="flex flex-col gap-6">
      <h2 data-testid="page-title" className="text-2xl font-bold tracking-tight">
        템플릿 보관함
      </h2>
      <TemplateList initialTemplates={templates} />
    </div>
  )
}
