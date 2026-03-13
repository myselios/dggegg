'use client'

import { useState } from 'react'
import { Copy, Check, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import type { MessageTemplate } from '@/lib/types/database'

type Props = {
  template: MessageTemplate
  onEdit: (template: MessageTemplate) => void
  onDelete: (id: string) => void
}

export function TemplateCard({ template, onEdit, onDelete }: Props) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(template.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('복사에 실패했습니다')
    }
  }

  return (
    <div
      className="glass-card flex flex-col gap-3 rounded-2xl p-4"
      data-testid="template-card"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold leading-snug" data-testid="template-title">
          {template.title}
        </p>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="size-7"
            onClick={handleCopy}
            data-testid="template-copy-btn"
            title="복사"
          >
            {copied ? (
              <Check className="size-3.5 text-green-500" />
            ) : (
              <Copy className="size-3.5" />
            )}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="size-7"
            onClick={() => onEdit(template)}
            data-testid="template-edit-btn"
            title="수정"
          >
            <Pencil className="size-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="size-7 hover:text-destructive"
            onClick={() => onDelete(template.id)}
            data-testid="template-delete-btn"
            title="삭제"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>

      <p
        className="whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground"
        data-testid="template-content"
      >
        {template.content}
      </p>
    </div>
  )
}
