export default function MaterialsLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="h-8 w-32 animate-pulse rounded-lg bg-muted" />
      <div className="h-10 w-48 animate-pulse rounded-xl bg-muted" />
      <div className="flex flex-col gap-4">
        <div className="glass-card h-40 animate-pulse rounded-2xl" />
        <div className="glass-card h-40 animate-pulse rounded-2xl" />
        <div className="glass-card h-40 animate-pulse rounded-2xl" />
      </div>
    </div>
  )
}
