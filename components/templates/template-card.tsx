'use client'

import { useState } from 'react'
import { Copy, Check, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import type { MessageTemplate } from '@/lib/types/database'

const STICKY_COLORS = [
  'bg-yellow-100 border-yellow-200 dark:bg-yellow-900/30 dark:border-yellow-700/40',
  'bg-blue-100 border-blue-200 dark:bg-blue-900/30 dark:border-blue-700/40',
  'bg-green-100 border-green-200 dark:bg-green-900/30 dark:border-green-700/40',
  'bg-pink-100 border-pink-200 dark:bg-pink-900/30 dark:border-pink-700/40',
  'bg-purple-100 border-purple-200 dark:bg-purple-900/30 dark:border-purple-700/40',
  'bg-orange-100 border-orange-200 dark:bg-orange-900/30 dark:border-orange-700/40',
]

function getStickyColor(id: string) {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) & 0xffffff
  }
  return STICKY_COLORS[hash % STICKY_COLORS.length]
}

type Props = {
  template: MessageTemplate
  onEdit: (template: MessageTemplate) => void
  onDelete: (id: string) => void
}

export function TemplateCard({ template, onEdit, onDelete }: Props) {
  const [copied, setCopied] = useState(false)
  const colorClass = getStickyColor(template.id)

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
      className={`flex flex-col rounded-xl border p-4 shadow-sm transition-shadow hover:shadow-md ${colorClass}`}
      data-testid="template-card"
    >
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <p className="text-sm font-semibold leading-snug" data-testid="template-title">
          {template.title}
        </p>
        <div className="flex shrink-0 items-center gap-0.5">
          <Button
            size="icon"
            variant="ghost"
            className="size-7 hover:bg-black/10 dark:hover:bg-white/10"
            onClick={handleCopy}
            data-testid="template-copy-btn"
            title="복사"
          >
            {copied ? (
              <Check className="size-3.5 text-green-600" />
            ) : (
              <Copy className="size-3.5" />
            )}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="size-7 hover:bg-black/10 dark:hover:bg-white/10"
            onClick={() => onEdit(template)}
            data-testid="template-edit-btn"
            title="수정"
          >
            <Pencil className="size-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="size-7 hover:bg-black/10 dark:hover:bg-white/10 hover:text-destructive"
            onClick={() => onDelete(template.id)}
            data-testid="template-delete-btn"
            title="삭제"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* 구분선 */}
      <div className="border-t border-current opacity-10 mb-3" />

      {/* 내용 — 전체 표시 */}
      <p
        className="whitespace-pre-wrap text-sm leading-relaxed flex-1"
        data-testid="template-content"
      >
        {template.content}
      </p>
    </div>
  )
}
