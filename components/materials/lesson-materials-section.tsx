'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Download, Link2, Trash2, Upload, FileText } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { deleteMaterial } from '@/app/actions/materials'
import { UploadMaterialDialog } from './upload-material-dialog'
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

type DialogState = {
  readonly open: boolean
  readonly session: SessionKey
  readonly sessionLabel: string
  readonly existingMaterial: Material | null
}

const CLOSED_DIALOG: DialogState = {
  open: false,
  session: 'OT',
  sessionLabel: 'OT',
  existingMaterial: null,
}

export function LessonMaterialsSection({ initialMaterials }: Props) {
  const [materials, setMaterials] = useState<ReadonlyArray<Material>>(initialMaterials)
  const [dialogState, setDialogState] = useState<DialogState>(CLOSED_DIALOG)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const materialBySession = (key: SessionKey): Material | null =>
    materials.find((m) => m.session === key) ?? null

  const openDialog = (session: SessionKey, sessionLabel: string) => {
    setDialogState({
      open: true,
      session,
      sessionLabel,
      existingMaterial: materialBySession(session),
    })
  }

  const handleUploaded = (uploaded: Material) => {
    setMaterials((prev) => {
      const filtered = prev.filter((m) => m.session !== uploaded.session)
      return [...filtered, uploaded]
    })
  }

  const handleCopyLink = async (fileUrl: string) => {
    await navigator.clipboard.writeText(fileUrl)
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
      setMaterials((prev) => prev.filter((m) => m.id !== material.id))
      toast.success('교재가 삭제되었습니다')
    } finally {
      setDeletingId(null)
    }
  }

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
              onUpload={() => openDialog(key, label)}
              onCopyLink={handleCopyLink}
              onDelete={handleDelete}
            />
          )
        })}
      </div>

      <UploadMaterialDialog
        session={dialogState.session}
        sessionLabel={dialogState.sessionLabel}
        existingMaterial={dialogState.existingMaterial}
        open={dialogState.open}
        onClose={() => setDialogState(CLOSED_DIALOG)}
        onUploaded={handleUploaded}
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
  readonly onCopyLink: (url: string) => void
  readonly onDelete: (material: Material) => void
}

function SessionSlot({
  label,
  material,
  deletingId,
  onUpload,
  onCopyLink,
  onDelete,
}: SessionSlotProps) {
  const isDeleting = material !== null && deletingId === material.id

  return (
    <div className="glass-card rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold">{label}</span>
        {material ? (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            등록됨
          </Badge>
        ) : (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">
            없음
          </Badge>
        )}
      </div>

      {material ? (
        <FilledSlot
          material={material}
          isDeleting={isDeleting}
          onCopyLink={onCopyLink}
          onDelete={onDelete}
          onUpload={onUpload}
        />
      ) : (
        <EmptySlot onUpload={onUpload} />
      )}
    </div>
  )
}

type FilledSlotProps = {
  readonly material: Material
  readonly isDeleting: boolean
  readonly onCopyLink: (url: string) => void
  readonly onDelete: (material: Material) => void
  readonly onUpload: () => void
}

function FilledSlot({ material, isDeleting, onCopyLink, onDelete, onUpload }: FilledSlotProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start gap-1.5">
        <FileText className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
        <span
          className="truncate text-xs text-foreground leading-relaxed"
          title={material.file_name}
        >
          {material.file_name}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-1">
        <Button
          asChild
          variant="outline"
          size="sm"
          className="h-7 px-2 text-xs"
        >
          <a href={material.file_url} target="_blank" rel="noopener noreferrer" download>
            <Download className="mr-1 size-3" />
            다운로드
          </a>
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() => onCopyLink(material.file_url)}
        >
          <Link2 className="mr-1 size-3" />
          복사
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive hover:border-destructive"
          disabled={isDeleting}
          onClick={() => onDelete(material)}
        >
          <Trash2 className="size-3" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-muted-foreground"
          onClick={onUpload}
        >
          <Upload className="mr-1 size-3" />
          교체
        </Button>
      </div>
    </div>
  )
}

function EmptySlot({ onUpload }: { readonly onUpload: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2 py-1">
      <span className="text-xs text-muted-foreground">파일 없음</span>
      <Button
        variant="outline"
        size="sm"
        className="h-7 w-full text-xs"
        onClick={onUpload}
      >
        <Upload className="mr-1 size-3" />
        업로드
      </Button>
    </div>
  )
}
