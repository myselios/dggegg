'use client'

import { useState, useMemo } from 'react'
import { addWeeks, subWeeks, isSameDay, isToday, format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { useScheduleEvents } from '@/lib/hooks/use-schedule'
import { getThreeWeekRange, getWeeksInRange } from '@/lib/utils/date'
import { CalendarEventBlock } from './calendar-event-block'
import { EventCreateDialog } from './event-create-dialog'
import { LessonNotePanel } from './lesson-note-panel'
import { Button } from '@/components/ui/button'
import type { ScheduleEventWithStudent } from '@/lib/types/database'

const HOURS = Array.from({ length: 15 }, (_, i) => i + 8) // 08:00 ~ 22:00

export function ThreeWeekCalendar() {
  const [baseDate, setBaseDate] = useState(new Date())
  const [selectedSlot, setSelectedSlot] = useState<{ date: Date; hour: number } | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEventWithStudent | null>(null)

  const { start, end } = useMemo(() => getThreeWeekRange(baseDate), [baseDate])
  const weeks = useMemo(() => getWeeksInRange(start, end), [start, end])
  const allDays = useMemo(() => weeks.flat(), [weeks])

  const { data: events, mutate } = useScheduleEvents(
    start.toISOString(),
    end.toISOString()
  )

  function getEventsForDayHour(day: Date, hour: number) {
    if (!events) return []
    return events.filter((e) => {
      const eventDate = new Date(e.start_at)
      return isSameDay(eventDate, day) && eventDate.getHours() === hour
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header: 네비게이션 */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">스케줄</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setBaseDate(subWeeks(baseDate, 1))}>
            &larr; 이전 주
          </Button>
          <Button variant="outline" size="sm" onClick={() => setBaseDate(new Date())}>
            오늘
          </Button>
          <Button variant="outline" size="sm" onClick={() => setBaseDate(addWeeks(baseDate, 1))}>
            다음 주 &rarr;
          </Button>
        </div>
      </div>

      {/* 주 구분 헤더 */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {weeks.map((week, i) => (
          <span key={i} className="flex-1 text-center font-medium">
            {format(week[0], 'M월 d일', { locale: ko })} ~ {format(week[6], 'M월 d일', { locale: ko })}
          </span>
        ))}
      </div>

      {/* 캘린더 그리드 */}
      <div className="overflow-x-auto">
        <div className="min-w-[1200px]">
          {/* 요일 헤더 */}
          <div className="grid grid-cols-[60px_repeat(21,1fr)] border-b">
            <div />
            {allDays.map((day, i) => (
              <div
                key={i}
                className={cn(
                  'border-l px-1 py-2 text-center text-xs',
                  isToday(day) && 'bg-primary/10 font-bold',
                  i % 7 === 0 && i > 0 && 'border-l-2 border-l-primary/30'
                )}
              >
                <div>{format(day, 'EEE', { locale: ko })}</div>
                <div className={cn(
                  'text-lg',
                  isToday(day) && 'rounded-full bg-primary text-primary-foreground mx-auto w-8 h-8 flex items-center justify-center'
                )}>
                  {format(day, 'd')}
                </div>
              </div>
            ))}
          </div>

          {/* 시간 그리드 */}
          {HOURS.map((hour) => (
            <div key={hour} className="grid grid-cols-[60px_repeat(21,1fr)] border-b">
              <div className="flex items-start justify-end pr-2 pt-1 text-xs text-muted-foreground">
                {`${hour}:00`}
              </div>
              {allDays.map((day, dayIdx) => {
                const cellEvents = getEventsForDayHour(day, hour)
                return (
                  <div
                    key={dayIdx}
                    className={cn(
                      'min-h-[48px] border-l p-0.5 cursor-pointer hover:bg-muted/50',
                      isToday(day) && 'bg-primary/5',
                      dayIdx % 7 === 0 && dayIdx > 0 && 'border-l-2 border-l-primary/30'
                    )}
                    onClick={() => setSelectedSlot({ date: day, hour })}
                  >
                    {cellEvents.map((event) => (
                      <CalendarEventBlock
                        key={event.id}
                        event={event}
                        onClick={() => {
                          setSelectedEvent(event)
                          setSelectedSlot(null)
                        }}
                      />
                    ))}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* 이벤트 생성 다이얼로그 */}
      {selectedSlot && (
        <EventCreateDialog
          date={selectedSlot.date}
          hour={selectedSlot.hour}
          onClose={() => setSelectedSlot(null)}
          onCreated={() => {
            setSelectedSlot(null)
            mutate()
          }}
        />
      )}

      {/* 수업 기록 패널 */}
      {selectedEvent && (
        <LessonNotePanel
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onUpdated={() => {
            setSelectedEvent(null)
            mutate()
          }}
        />
      )}
    </div>
  )
}
