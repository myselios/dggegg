# 디자인 통일 설계 — Minimal Clean

## 개요
사이트 전체 디자인을 Notion/Linear 스타일의 미니멀 클린으로 통일.

## 디자인 토큰
- Spacing: gap-4(카드 내), gap-6(섹션), gap-8(페이지 섹션)
- Padding: p-4(카드), p-6(페이지)
- Border-radius: rounded-lg(카드), rounded-md(버튼), rounded-full(배지)
- Shadow: shadow-none 기본, shadow-sm 호버/강조
- Border: border-border/40(카드), border-border(구분선)
- Icon: size-4(인라인), size-5(헤더), size-8(빈 상태)

## 타이포그래피
- 페이지 제목: text-2xl font-bold tracking-tight
- 섹션 제목: text-base font-semibold
- 카드 제목: text-sm font-medium
- 본문: text-sm
- 보조: text-xs text-muted-foreground

## 상태 색상 (중앙화)
- active/success: emerald
- warning: amber
- error: red
- ended: gray
- info: blue

## 수정 파일
- app/globals.css
- app/(authenticated)/page.tsx
- components/dashboard/*.tsx
- components/students/student-board.tsx, student-card.tsx
- components/nav/sidebar.tsx, header.tsx
- lib/constants/colors.ts (신규)
