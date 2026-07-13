'use client'

import { Search, X, SlidersHorizontal } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

export type StudentFilters = {
  readonly school: string
  readonly course: string
}

const EMPTY_FILTERS: StudentFilters = { school: '', course: '' }

const COURSE_OPTIONS = [
  { value: 'Ab initio', label: 'Ab initio' },
  { value: 'SL', label: 'SL' },
  { value: 'HL', label: 'HL' },
  { value: 'IGCSE', label: 'IGCSE' },
  { value: 'MYP', label: 'MYP' },
  { value: '기타', label: '기타' },
] as const

function countActiveFilters(filters: StudentFilters): number {
  return Object.values(filters).filter(Boolean).length
}

export function StudentToolbar({
  searchQuery,
  onSearchChange,
  filters,
  onFiltersChange,
  schools,
}: {
  readonly searchQuery: string
  readonly onSearchChange: (query: string) => void
  readonly filters: StudentFilters
  readonly onFiltersChange: (filters: StudentFilters) => void
  readonly schools: readonly string[]
}) {
  const activeFilterCount = countActiveFilters(filters)
  const hasActiveFilters = activeFilterCount > 0 || searchQuery.length > 0

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="학생 검색 (이름 한/영)..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 pr-8"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <SlidersHorizontal className="size-4 text-muted-foreground hidden sm:block" />

        <Select
          value={filters.school || undefined}
          onValueChange={(v) => onFiltersChange({ ...filters, school: v })}
        >
          <SelectTrigger
            size="sm"
            className={cn(filters.school && 'border-primary text-primary')}
          >
            <SelectValue placeholder="학교" />
          </SelectTrigger>
          <SelectContent>
            {schools.map((school) => (
              <SelectItem key={school} value={school}>
                {school}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.course || undefined}
          onValueChange={(v) => onFiltersChange({ ...filters, course: v })}
        >
          <SelectTrigger
            size="sm"
            className={cn(filters.course && 'border-primary text-primary')}
          >
            <SelectValue placeholder="과정" />
          </SelectTrigger>
          <SelectContent>
            {COURSE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onSearchChange('')
              onFiltersChange(EMPTY_FILTERS)
            }}
            className="h-8 gap-1 text-xs"
          >
            <X className="size-3" />
            초기화
            <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
              {activeFilterCount + (searchQuery ? 1 : 0)}
            </Badge>
          </Button>
        )}
      </div>
    </div>
  )
}

export { EMPTY_FILTERS }
