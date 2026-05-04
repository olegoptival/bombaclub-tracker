# Bombaclub Tracker

Web app for tracking poker results in a private club.
Domain: bombaclub.live

## Structure

- `db/` — PostgreSQL schema (source of truth, applied as raw SQL migration)
- `docs/` — historical project docs from the pre-pivot era (reference only)
- `reference/` — Python artifacts (settle-up algorithm, OCR prompt) to be ported to TS

## Stack

Next.js 15 (App Router) + TypeScript + Prisma + PostgreSQL + Redis + MinIO + Caddy.
Worker process (Node.js + BullMQ) for OCR and notifications.
