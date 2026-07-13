'use client'

import { useState } from 'react'
import { Copy, Check, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { MessageTemplate, TemplateCategory } from '@/lib/types/database'

const CATEGORY_META: Record<TemplateCategory, { readonly label: string; readonly badge: string }> = {
  first_consult: { label: '첫 상담', badge: 'border-primary/20 bg-primary/5 text-primary' },
  after_lesson: { label: '수업 후', badge: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  re_enrollment: { label: '재등록', badge: 'border-amber-200 bg-amber-50 text-amber-700' },
  other: { label: '기타', badge: 'border-border bg-muted text-muted-foreground' },
}

type Props = {
  template: MessageTemplate
  onEdit: (template: MessageTemplate) => void
  onDelete: (id: string) => void
}

export function TemplateCard({ template, onEdit, onDelete }: Props) {
  const [copied, setCopied] = useState(false)
  const category = CATEGORY_META[template.category]

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
      className="glass-card flex flex-col rounded-2xl p-4 transition-shadow hover:shadow-md"
      data-testid="template-card"
    >
      {/* 헤더 */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-1.5">
          <Badge variant="outline" className={cn('w-fit px-2 py-0 text-[10px] font-semibold', category.badge)}>
            {category.label}
          </Badge>
          <p className="text-sm font-bold leading-snug text-foreground" data-testid="template-title">
            {template.title}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <Button
            size="icon"
            variant="ghost"
            className="size-8 text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={handleCopy}
            data-testid="template-copy-btn"
            title="복사"
          >
            {copied ? (
              <Check className="size-3.5 text-emerald-600" />
            ) : (
              <Copy className="size-3.5" />
            )}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="size-8 text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={() => onEdit(template)}
            data-testid="template-edit-btn"
            title="수정"
          >
            <Pencil className="size-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="size-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            onClick={() => onDelete(template.id)}
            data-testid="template-delete-btn"
            title="삭제"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>

      <div className="border-t border-border pt-3" />

      {/* 내용 미리보기 */}
      <p
        className="line-clamp-6 flex-1 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground"
        data-testid="template-content"
      >
        {template.content}
      </p>
    </div>
  )
}
