'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Download, Link2, Trash2, Upload, FileText, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { deleteMaterial, saveMaterialLink, deleteMaterialLink } from '@/app/actions/materials'
import { UploadMaterialDialog } from './upload-material-dialog'
import { LinkDialog } from './link-dialog'
import type { Material, SessionKey } from '@/lib/types/database'

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
  readonly initialMaterials: Material[]
}

type UploadDialogState = {
  readonly open: boolean
  readonly session: SessionKey
  readonly sessionLabel: string
  readonly existingMaterial: Material | null
}

type LinkDialogState = {
  readonly open: boolean
  readonly session: SessionKey
  readonly sessionLabel: string
}

const CLOSED_UPLOAD: UploadDialogState = {
  open: false,
  session: 'OT',
  sessionLabel: 'OT',
  existingMaterial: null,
}

const CLOSED_LINK: LinkDialogState = {
  open: false,
  session: 'OT',
  sessionLabel: 'OT',
}

export function LessonMaterialsSection({ initialMaterials }: Props) {
  const [materials, setMaterials] = useState<ReadonlyArray<Material>>(initialMaterials)
  const [uploadDialog, setUploadDialog] = useState<UploadDialogState>(CLOSED_UPLOAD)
  const [linkDialog, setLinkDialog] = useState<LinkDialogState>(CLOSED_LINK)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const materialBySession = (key: SessionKey): Material | null =>
    materials.find((m) => m.session === key) ?? null

  const openUpload = (session: SessionKey, sessionLabel: string) => {
    setUploadDialog({
      open: true,
      session,
      sessionLabel,
      existingMaterial: materialBySession(session),
    })
  }

  const openLink = (session: SessionKey, sessionLabel: string) => {
    setLinkDialog({ open: true, session, sessionLabel })
  }

  const handleUploaded = (uploaded: Material) => {
    setMaterials((prev) => {
      const filtered = prev.filter((m) => m.session !== uploaded.session)
      return [...filtered, uploaded]
    })
  }

  const handleCopyFileUrl = async (fileUrl: string) => {
    await navigator.clipboard.writeText(fileUrl)
    toast.success('링크가 복사되었습니다')
  }

  const handleCopyLinkUrl = async (linkUrl: string) => {
    await navigator.clipboard.writeText(linkUrl)
    toast.success('링크가 복사되었습니다')
  }

  const handleDelete = async (material: Material) => {
    setDeletingId(material.id)
    try {
      const result = await deleteMaterial(material.id)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      setMaterials((prev) => prev.map((m) =>
        m.session === material.session
          ? { ...m, file_name: null, file_url: null }
          : m
      ))
      toast.success('교재가 삭제되었습니다')
    } finally {
      setDeletingId(null)
    }
  }

  const handleSaveLink = async (url: string, label: string) => {
    const result = await saveMaterialLink(linkDialog.session, url, label || undefined)
    if (!result.success) {
      toast.error(result.error)
      return
    }
    setMaterials((prev) => {
      const existing = prev.find((m) => m.session === linkDialog.session)
      if (existing) {
        return prev.map((m) =>
          m.session === linkDialog.session
            ? { ...m, link_url: url, link_label: label || null }
            : m
        )
      }
      return [...prev, result.data]
    })
    toast.success('링크가 저장되었습니다')
    setLinkDialog(CLOSED_LINK)
  }

  const handleDeleteLink = async (session: SessionKey) => {
    const result = await deleteMaterialLink(session)
    if (!result.success) {
      toast.error(result.error)
      return
    }
    setMaterials((prev) =>
      prev.map((m) =>
        m.session === session ? { ...m, link_url: null, link_label: null } : m
      )
    )
    toast.success('링크가 삭제되었습니다')
  }

  const currentMaterial = materialBySession(linkDialog.session)

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {SESSIONS.map(({ key, label }) => {
          const material = materialBySession(key)
          return (
            <SessionSlot
              key={key}
              sessionKey={key}
              label={label}
              material={material}
              deletingId={deletingId}
              onUpload={() => openUpload(key, label)}
              onCopyFileUrl={handleCopyFileUrl}
              onCopyLinkUrl={handleCopyLinkUrl}
              onDeleteFile={handleDelete}
              onAddLink={() => openLink(key, label)}
              onDeleteLink={handleDeleteLink}
            />
          )
        })}
      </div>

      <UploadMaterialDialog
        session={uploadDialog.session}
        sessionLabel={uploadDialog.sessionLabel}
        existingMaterial={uploadDialog.existingMaterial}
        open={uploadDialog.open}
        onClose={() => setUploadDialog(CLOSED_UPLOAD)}
        onUploaded={handleUploaded}
      />

      <LinkDialog
        open={linkDialog.open}
        title={`${linkDialog.sessionLabel} 링크 등록`}
        initialUrl={currentMaterial?.link_url ?? ''}
        initialLabel={currentMaterial?.link_label ?? ''}
        onClose={() => setLinkDialog(CLOSED_LINK)}
        onSave={handleSaveLink}
      />
    </>
  )
}

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

function SessionSlot({
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

function shortenUrl(url: string): string {
  try {
    const u = new URL(url)
    return u.hostname.replace('www.', '')
  } catch {
    return url.slice(0, 20) + '...'
  }
}
