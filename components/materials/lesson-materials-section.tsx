'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { deleteMaterial, saveMaterialLink, deleteMaterialLink } from '@/app/actions/materials'
import { UploadMaterialDialog } from './upload-material-dialog'
import { LinkDialog } from './link-dialog'
import { SessionSlot } from './session-slot'
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
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
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
