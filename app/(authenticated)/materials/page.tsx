import { FolderOpen } from 'lucide-react'

export default function MaterialsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-bold tracking-tight">자료 관리</h2>
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/60 py-20 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <FolderOpen className="size-6 text-muted-foreground/50" />
        </div>
        <p className="mt-4 text-sm font-medium text-muted-foreground">
          자료가 없습니다
        </p>
        <p className="mt-1 text-xs text-muted-foreground/60">
          학습 자료 관리 기능이 곧 추가됩니다
        </p>
      </div>
    </div>
  )
}
