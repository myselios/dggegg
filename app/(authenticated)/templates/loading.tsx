export default function TemplatesLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="h-8 w-40 animate-pulse rounded-lg bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="glass-card h-36 animate-pulse rounded-2xl" />
        <div className="glass-card h-36 animate-pulse rounded-2xl" />
        <div className="glass-card h-36 animate-pulse rounded-2xl" />
        <div className="glass-card h-36 animate-pulse rounded-2xl" />
      </div>
    </div>
  )
}
