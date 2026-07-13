'use client'

import { Repeat } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export type RecurringEndMode = 'count' | 'date'

const MIN_REPEAT_COUNT = 1
const MAX_REPEAT_COUNT = 52
const DEFAULT_REPEAT_COUNT = 12

type Props = {
  readonly isRecurring: boolean
  readonly onIsRecurringChange: (value: boolean) => void
  readonly endMode: RecurringEndMode
  readonly onEndModeChange: (mode: RecurringEndMode) => void
  readonly repeatCount: number
  readonly onRepeatCountChange: (count: number) => void
  readonly endDate: string
  readonly onEndDateChange: (date: string) => void
  readonly minDate: string
}

export function RecurringOptions({
  isRecurring,
  onIsRecurringChange,
  endMode,
  onEndModeChange,
  repeatCount,
  onRepeatCountChange,
  endDate,
  onEndDateChange,
  minDate,
}: Props) {
  return (
    <div className="flex flex-col gap-3 rounded-md border border-input p-3">
      <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          checked={isRecurring}
          onChange={(e) => onIsRecurringChange(e.target.checked)}
          className="h-4 w-4 rounded border-input accent-primary"
          data-testid="recurring-checkbox"
        />
        <Repeat className="h-4 w-4 text-muted-foreground" />
        매주 반복
      </label>

      {isRecurring && (
        <div className="flex flex-col gap-3 pl-6">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={endMode === 'count' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onEndModeChange('count')}
              className="flex-1"
              data-testid="recurring-mode-count"
            >
              N회 반복
            </Button>
            <Button
              type="button"
              variant={endMode === 'date' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onEndModeChange('date')}
              className="flex-1"
              data-testid="recurring-mode-date"
            >
              종료일 지정
            </Button>
          </div>

          {endMode === 'count' ? (
            <div className="flex flex-col gap-2">
              <Label>반복 횟수</Label>
              <Input
                type="number"
                min={MIN_REPEAT_COUNT}
                max={MAX_REPEAT_COUNT}
                value={repeatCount}
                onChange={(e) => onRepeatCountChange(Number(e.target.value))}
                data-testid="recurring-count-input"
              />
              <span className="text-xs text-muted-foreground">
                최대 {MAX_REPEAT_COUNT}회까지 반복할 수 있습니다
              </span>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Label>종료일</Label>
              <Input
                type="date"
                min={minDate}
                value={endDate}
                onChange={(e) => onEndDateChange(e.target.value)}
                data-testid="recurring-end-date-input"
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export { MIN_REPEAT_COUNT, MAX_REPEAT_COUNT, DEFAULT_REPEAT_COUNT }
