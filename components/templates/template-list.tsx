'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TemplateCard } from './template-card'
import { TemplateDialog } from './template-dialog'
import { createTemplate, updateTemplate, deleteTemplate } from '@/app/actions/templates'
import type { MessageTemplate, MessageTemplateInsert, TemplateCategory } from '@/lib/types/database'

const CATEGORIES: { value: TemplateCategory; label: string }[] = [
  { value: 'first_consult', label: '첫 상담 후' },
  { value: 'after_lesson', label: '수업 종료 후' },
  { value: 're_enrollment', label: '재등록 안내' },
  { value: 'other', label: '기타' },
]

type Props = {
  initialTemplates: MessageTemplate[]
}

export function TemplateList({ initialTemplates }: Props) {
  const [templates, setTemplates] = useState<MessageTemplate[]>(initialTemplates)
  const [activeCategory, setActiveCategory] = useState<TemplateCategory>('first_consult')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | undefined>()

  const filtered = templates.filter((t) => t.category === activeCategory)

  const handleOpenCreate = () => {
    setEditingTemplate(undefined)
    setDialogOpen(true)
  }

  const handleOpenEdit = (template: MessageTemplate) => {
    setEditingTemplate(template)
    setDialogOpen(true)
  }

  const handleSave = async (data: MessageTemplateInsert) => {
    if (editingTemplate) {
      const result = await updateTemplate(editingTemplate.id, data)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      setTemplates((prev) =>
        prev.map((t) => (t.id === editingTemplate.id ? result.data : t))
      )
      toast.success('템플릿이 수정되었습니다')
    } else {
      const result = await createTemplate(data)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      setTemplates((prev) => [result.data, ...prev])
      toast.success('템플릿이 추가되었습니다')
    }
  }

  const handleDelete = async (id: string) => {
    const result = await deleteTemplate(id)
    if (!result.success) {
      toast.error(result.error)
      return
    }
    setTemplates((prev) => prev.filter((t) => t.id !== id))
    toast.success('템플릿이 삭제되었습니다')
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Tabs
          value={activeCategory}
          onValueChange={(v) => setActiveCategory(v as TemplateCategory)}
          className="flex-1"
        >
          <div className="flex items-center justify-between gap-4">
            <TabsList data-testid="category-tabs">
              {CATEGORIES.map(({ value, label }) => (
                <TabsTrigger key={value} value={value} data-testid={`tab-${value}`}>
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>

            <Button size="sm" onClick={handleOpenCreate} data-testid="new-template-btn">
              <Plus className="size-4 mr-1.5" />
              새 템플릿
            </Button>
          </div>

          {CATEGORIES.map(({ value }) => (
            <TabsContent key={value} value={value} className="mt-4">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground" data-testid="empty-state">
                  <p className="text-sm">아직 템플릿이 없어요.</p>
                  <p className="text-sm">새 템플릿을 추가해보세요.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {filtered.map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      onEdit={handleOpenEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      <TemplateDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        defaultCategory={activeCategory}
        template={editingTemplate}
      />
    </div>
  )
}
