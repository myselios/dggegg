'use client'

import { useState } from 'react'
import { NotebookPen, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { TemplateCard } from './template-card'
import { TemplateDialog } from './template-dialog'
import { createTemplate, updateTemplate, deleteTemplate } from '@/app/actions/templates'
import type { MessageTemplate, MessageTemplateInsert } from '@/lib/types/database'

type Props = {
  initialTemplates: MessageTemplate[]
}

export function TemplateList({ initialTemplates }: Props) {
  const [templates, setTemplates] = useState<MessageTemplate[]>(initialTemplates)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | undefined>()

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
      <div className="flex items-center justify-end">
        <Button size="sm" onClick={handleOpenCreate} data-testid="new-template-btn">
          <Plus className="size-4 mr-1.5" />
          새 템플릿
        </Button>
      </div>

      {templates.length === 0 ? (
        <div
          className="glass-card flex flex-col items-center justify-center gap-2 rounded-2xl py-16 text-center text-muted-foreground"
          data-testid="empty-state"
        >
          <NotebookPen className="size-6 text-muted-foreground/60" />
          <p className="text-sm">아직 템플릿이 없어요.</p>
          <p className="text-sm">새 템플릿을 추가해보세요.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onEdit={handleOpenEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <TemplateDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        template={editingTemplate}
      />
    </div>
  )
}
