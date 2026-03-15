-- 주차별 메모: 스케줄 화면 옆에 표시되는 한 주 단위 메모
create table if not exists weekly_memos (
  id          uuid primary key default gen_random_uuid(),
  week_key    text not null unique,  -- e.g. "2026-W11" (ISO week)
  content     text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- updated_at 자동 갱신 트리거 (update_updated_at_column 함수는 008에서 이미 생성됨)
create trigger weekly_memos_updated_at
  before update on weekly_memos
  for each row execute function update_updated_at_column();

-- RLS (쿠키 기반 인증 — anon role)
alter table weekly_memos enable row level security;

create policy "Allow all for anon"
  on weekly_memos for all
  using (true)
  with check (true);
