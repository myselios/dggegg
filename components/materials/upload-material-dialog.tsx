'use client'

import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Upload, FileText } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { uploadMaterial } from '@/app/actions/materials'
import type { Material, SessionKey } from '@/lib/types/database'

type Props = {
  readonly session: SessionKey
  readonly sessionLabel: string
  readonly existingMaterial: Material | null
  readonly open: boolean
  readonly onClose: () => void
  readonly onUploaded: (material: Material) => void
}

export function UploadMaterialDialog({
  session,
  sessionLabel,
  existingMaterial,
  open,
  onClose,
  onUploaded,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const isReplaceMode = existingMaterial !== null

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    setSelectedFile(file)
  }

  const handleClose = () => {
    setSelectedFile(null)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
    onClose()
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const result = await uploadMaterial(session, formData)

      if (!result.success) {
        toast.error(result.error)
        return
      }

      toast.success(`${sessionLabel} 교재가 업로드되었습니다`)
      onUploaded(result.data)
      handleClose()
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {sessionLabel} 교재 {isReplaceMode ? '교체' : '업로드'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {isReplaceMode && (
            <p className="text-sm text-muted-foreground">
              기존 파일{' '}
              <span className="font-medium text-foreground">
                {existingMaterial.file_name}
              </span>
              을 새 파일로 교체합니다.
            </p>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="material-file" className="text-sm font-semibold text-foreground">
              파일 선택{' '}
              <span className="text-xs font-normal text-muted-foreground">
                (PDF, PPT, PPTX · 최대 50MB)
              </span>
            </Label>

            <div
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border px-4 py-8 text-center transition-colors hover:border-primary/50 hover:bg-primary/5"
              onClick={() => inputRef.current?.click()}
            >
              <FileText className="size-6 shrink-0 text-muted-foreground" />
              <span className="truncate text-sm font-medium text-foreground">
                {selectedFile ? selectedFile.name : '파일을 선택하세요'}
              </span>
              {!selectedFile && (
                <span className="text-xs text-muted-foreground">클릭하여 파일을 업로드하세요</span>
              )}
            </div>

            <input
              ref={inputRef}
              id="material-file"
              type="file"
              accept=".pdf,.ppt,.pptx"
              className="sr-only"
              onChange={handleFileChange}
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isUploading}
            >
              취소
            </Button>
            <Button
              type="button"
              disabled={!selectedFile || isUploading}
              onClick={handleUpload}
            >
              {isUploading ? (
                <>
                  <Upload className="mr-2 size-4 animate-pulse" />
                  업로드 중...
                </>
              ) : (
                <>
                  <Upload className="mr-2 size-4" />
                  {isReplaceMode ? '교체' : '업로드'}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
