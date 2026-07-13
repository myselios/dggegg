'use client'

import { Download, ExternalLink, FileText, Link2, Trash2, Upload } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Material, SessionKey } from '@/lib/types/database'

type SessionSlotProps = {
  readonly sessionKey: SessionKey
  readonly label: string
  readonly material: Material | null
  readonly deletingId: string | null
  readonly onUpload: () => void
  readonly onCopyFileUrl: (url: string) => void
  readonly onCopyLinkUrl: (url: string) => void
  readonly onDeleteFile: (material: Material) => void
  readonly onAddLink: () => void
  readonly onDeleteLink: (session: SessionKey) => void
}

function shortenUrl(url: string): string {
  try {
    const u = new URL(url)
    return u.hostname.replace('www.', '')
  } catch {
    return url.slice(0, 20) + '...'
  }
}

export function SessionSlot({
  sessionKey,
  label,
  material,
  deletingId,
  onUpload,
  onCopyFileUrl,
  onCopyLinkUrl,
  onDeleteFile,
  onAddLink,
  onDeleteLink,
}: SessionSlotProps) {
  const hasFile = material !== null && material.file_url !== null
  const hasLink = material !== null && material.link_url !== null
  const isDeleting = material !== null && deletingId === material.id

  return (
    <div className="glass-card rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold">{label}</span>
        {hasFile || hasLink ? (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            등록됨
          </Badge>
        ) : (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">
            없음
          </Badge>
        )}
      </div>

      {/* 파일 영역 */}
      {hasFile && material ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-start gap-1.5">
            <FileText className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate text-xs text-foreground leading-relaxed" title={material.file_name ?? ''}>
              {material.file_name}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1">
            <Button asChild variant="outline" size="sm" className="h-7 px-2 text-xs">
              <a href={material.file_url!} target="_blank" rel="noopener noreferrer" download>
                <Download className="mr-1 size-3" />
                다운로드
              </a>
            </Button>
            <Button variant="outline" size="sm" className="h-7 px-2 text-xs"
              onClick={() => onCopyFileUrl(material.file_url!)}>
              <Link2 className="mr-1 size-3" />
              복사
            </Button>
            <Button variant="outline" size="sm"
              className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive hover:border-destructive"
              disabled={isDeleting}
              onClick={() => onDeleteFile(material)}>
              <Trash2 className="size-3" />
            </Button>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground"
              onClick={onUpload}>
              <Upload className="mr-1 size-3" />
              교체
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" size="sm" className="h-7 w-full text-xs" onClick={onUpload}>
          <Upload className="mr-1 size-3" />
          파일 업로드
        </Button>
      )}

      {/* 링크 영역 */}
      <div className="border-t pt-2 flex flex-col gap-1.5">
        <span className="text-[10px] text-muted-foreground font-medium">링크</span>
        {hasLink && material ? (
          <div className="flex flex-col gap-1">
            <span className="truncate text-xs text-foreground" title={material.link_url!}>
              {material.link_label || shortenUrl(material.link_url!)}
            </span>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" className="h-7 px-2 text-xs flex-1"
                onClick={() => onCopyLinkUrl(material.link_url!)}>
                <Link2 className="mr-1 size-3" />
                복사
              </Button>
              <Button asChild variant="outline" size="sm" className="h-7 px-2 text-xs">
                <a href={material.link_url!} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="size-3" />
                </a>
              </Button>
              <Button variant="ghost" size="sm"
                className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                onClick={() => onDeleteLink(sessionKey)}>
                <Trash2 className="size-3" />
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="ghost" size="sm" className="h-7 w-full text-xs text-muted-foreground border border-dashed"
            onClick={onAddLink}>
            <Link2 className="mr-1 size-3" />
            링크 등록
          </Button>
        )}
      </div>
    </div>
  )
}
