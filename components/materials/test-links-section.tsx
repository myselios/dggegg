'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Link2, Trash2, ExternalLink, FlaskConical } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { upsertTestLink, deleteTestLink } from '@/app/actions/test-links'
import { LinkDialog } from './link-dialog'
import type { TestLink, SessionKey } from '@/lib/types/database'

const SESSIONS: ReadonlyArray<{ readonly key: SessionKey; readonly label: string }> = [
  { key: 'OT', label: 'OT' },
  { key: '1', label: '1회차' },
  { key: '2', label: '2회차' },
  { key: '3', label: '3회차' },
  { key: '4', label: '4회차' },
  { key: '5', label: '5회차' },
  { key: '6', label: '6회차' },
  { key: '7', label: '7회차' },
]

type Props = {
  readonly initialLinks: TestLink[]
}

type DialogState = {
  readonly open: boolean
  readonly session: SessionKey
  readonly sessionLabel: string
}

const CLOSED: DialogState = { open: false, session: 'OT', sessionLabel: 'OT' }

export function TestLinksSection({ initialLinks }: Props) {
  const [links, setLinks] = useState<ReadonlyArray<TestLink>>(initialLinks)
  const [dialog, setDialog] = useState<DialogState>(CLOSED)

  const linkBySession = (key: SessionKey): TestLink | null =>
    links.find((l) => l.session === key) ?? null

  const openDialog = (session: SessionKey, sessionLabel: string) => {
    setDialog({ open: true, session, sessionLabel })
  }

  const handleSave = async (url: string, label: string) => {
    const result = await upsertTestLink(dialog.session, url, label || undefined)
    if (!result.success) {
      toast.error(result.error)
      return
    }
    setLinks((prev) => {
      const filtered = prev.filter((l) => l.session !== dialog.session)
      return [...filtered, result.data]
    })
    toast.success('테스트링크가 저장되었습니다')
    setDialog(CLOSED)
  }

  const handleCopy = async (url: string) => {
    await navigator.clipboard.writeText(url)
    toast.success('링크가 복사되었습니다')
  }

  const handleDelete = async (session: SessionKey) => {
    const result = await deleteTestLink(session)
    if (!result.success) {
      toast.error(result.error)
      return
    }
    setLinks((prev) => prev.filter((l) => l.session !== session))
    toast.success('테스트링크가 삭제되었습니다')
  }

  const currentLink = linkBySession(dialog.session)

  return (
    <>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <FlaskConical className="size-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">테스트링크</h3>
          <span className="text-xs text-muted-foreground">구글폼 등 테스트 링크를 회차별로 관리합니다</span>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {SESSIONS.map(({ key, label }) => {
            const link = linkBySession(key)
            return (
              <TestLinkSlot
                key={key}
                sessionKey={key}
                label={label}
                link={link}
                onAdd={() => openDialog(key, label)}
                onCopy={handleCopy}
                onDelete={handleDelete}
              />
            )
          })}
        </div>
      </div>

      <LinkDialog
        open={dialog.open}
        title={`${dialog.sessionLabel} 테스트링크 등록`}
        initialUrl={currentLink?.url ?? ''}
        initialLabel={currentLink?.label ?? ''}
        onClose={() => setDialog(CLOSED)}
        onSave={handleSave}
      />
    </>
  )
}

type SlotProps = {
  readonly sessionKey: SessionKey
  readonly label: string
  readonly link: TestLink | null
  readonly onAdd: () => void
  readonly onCopy: (url: string) => void
  readonly onDelete: (session: SessionKey) => void
}

function TestLinkSlot({ sessionKey, label, link, onAdd, onCopy, onDelete }: SlotProps) {
  return (
    <div className="glass-card flex flex-col gap-3 rounded-2xl p-4 transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-bold text-foreground">{label}</span>
        <Badge
          variant="outline"
          className={cn(
            'px-2 py-0 text-[10px] font-semibold',
            link
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-border text-muted-foreground'
          )}
        >
          {link ? '등록됨' : '없음'}
        </Badge>
      </div>

      {link ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5 rounded-lg bg-muted/60 px-2.5 py-2">
            <FlaskConical className="size-3.5 shrink-0 text-primary" />
            <span className="truncate text-xs font-medium text-foreground" title={link.url}>
              {link.label || shortenUrl(link.url)}
            </span>
          </div>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" className="h-8 flex-1 px-2 text-xs"
              onClick={() => onCopy(link.url)}>
              <Link2 className="mr-1 size-3" />
              복사
            </Button>
            <Button asChild variant="outline" size="sm" className="h-8 px-2 text-xs">
              <a href={link.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-3" />
              </a>
            </Button>
            <Button variant="ghost" size="sm"
              className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(sessionKey)}>
              <Trash2 className="size-3" />
            </Button>
          </div>
          <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground"
            onClick={onAdd}>
            수정
          </Button>
        </div>
      ) : (
        <Button variant="ghost" size="sm"
          className="h-8 w-full border border-dashed text-xs text-muted-foreground"
          onClick={onAdd}>
          <Link2 className="mr-1 size-3" />
          링크 등록
        </Button>
      )}
    </div>
  )
}

function shortenUrl(url: string): string {
  try {
    const u = new URL(url)
    return u.hostname.replace('www.', '')
  } catch {
    return url.slice(0, 20) + '...'
  }
}
