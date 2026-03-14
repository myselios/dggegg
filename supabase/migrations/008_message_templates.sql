-- 템플릿 보관함: 학부모 메시지 템플릿 저장
create table if not exists message_templates (
  id          uuid primary key default gen_random_uuid(),
  category    text not null check (category in ('first_consult', 'after_lesson', 're_enrollment', 'other')),
  title       text not null,
  content     text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- updated_at 자동 갱신 트리거
create or replace function update_updated_at_column()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger message_templates_updated_at
  before update on message_templates
  for each row execute function update_updated_at_column();

-- RLS 활성화 (쿠키 기반 인증 사용 — anon role로 접근)
alter table message_templates enable row level security;

create policy "Allow all for anon"
  on message_templates for all
  using (true)
  with check (true);
