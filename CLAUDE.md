# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Start development server (http://localhost:3000)
- `npm run build` — Production build
- `npm run start` — Start production server
- `npm run lint` — Run ESLint (runs `eslint` with flat config)

## Tech Stack

- Next.js 16 with App Router
- React 19, TypeScript 5 (strict mode)
- Tailwind CSS v4 (CSS-first config via `@import "tailwindcss"` in globals.css)
- ESLint 9 flat config with core-web-vitals + TypeScript rules

## Architecture

- **App Router**: All routes live in `app/` using file-based routing (`page.tsx`, `layout.tsx`)
- **Path alias**: `@/*` maps to project root (e.g., `import X from "@/app/something"`)
- **Styling**: Tailwind v4 with CSS custom properties for theming in `app/globals.css`; dark mode via `prefers-color-scheme`
- **Fonts**: Geist Sans and Geist Mono loaded via `next/font` in `app/layout.tsx`
- **No testing framework** is currently installed
