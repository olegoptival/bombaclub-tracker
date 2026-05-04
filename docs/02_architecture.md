# 02. Архитектура

## Высокоуровневая схема

```
       ┌──────────────────────────────────────────────┐
       │              Telegram Cloud                  │
       └────────────────────┬─────────────────────────┘
                            │
                   polling (MVP) ИЛИ
                   webhook (когда будет домен)
                            │
                            ▼
        ┌──────────────────────────────────────────┐
        │  Caddy (только при webhook-режиме)        │
        │  HTTPS termination для домена             │
        └────┬───────────────────┬─────────────────┘
             │                   │
             ▼                   ▼
   ┌────────────────────┐    ┌────────────────────┐
   │   Bot (Node.js)    │    │  MinIO             │
   │   - grammy         │    │  S3-compatible     │
   │   - FSM в Redis    │    │  для скринов       │
   │   - команды/кнопки │    └────────────────────┘
   │   - валидация ввода│             ▲
   └────────┬──────┬────┘             │
            │      │                  │ загрузка/скачивание
            │      └─── BullMQ ──┐    │
            │                    │    │
            │                    ▼    │
            │           ┌──────────────────┐
            │           │ Worker (Node.js) │
            │           │ - OCR via Claude │
            │           │ - settle-up      │
            │           │ - notifications  │
            │           │ - cron (timeouts)│
            │           └────────┬─────────┘
            │                    │
            │                    ▼
            │           ┌──────────────────┐
            └──────────►│   PostgreSQL     │
                        │   - data         │
                        │   - ledger       │
                        └──────────────────┘
                                ▲
                                │
                        ┌───────┴────────┐
                        │   Redis        │
                        │   - FSM state  │
                        │   - BullMQ     │
                        └────────────────┘
```

## Зачем разделение бот / worker

**Бот** — то, что должно отвечать **быстро** (Telegram даёт ~30 сек на ответ webhook'у, желательно укладываться в 1-2 сек):
- Получение сообщений и нажатий кнопок
- Управление состоянием диалога (FSM в Redis)
- Простые DB-запросы (показать баланс, историю)
- Постановка задач в очередь и моментальный ответ "обрабатываю..."

**Worker** — всё, что **долгое или фоновое**:
- OCR через Claude API (3-7 секунд)
- Settle-up на больших периодах
- Авто-таймауты сессий (cron-задача каждые N минут)
- Уведомления игрокам после закрытия сессии
- Любые batch-операции

Без этого разделения бот тормозит при OCR, Telegram переотправляет webhook'и, и пользователь получает дубликаты.

## Стек

| Компонент | Что выбрано | Почему |
|---|---|---|
| Язык | TypeScript / Node.js 20 LTS | Один язык на бот+worker, типы спасают от ошибок в FSM |
| Bot framework | **grammy** | Современная, отличная типизация, активная разработка |
| ORM | **Prisma** | Типобезопасность от схемы до запросов, миграции, отличный DX |
| Очередь | **BullMQ** (через Redis) | Стандарт для Node, retries, scheduled jobs из коробки |
| Хранилище | **MinIO** | S3-совместимое, локально в docker, бесплатно |
| Reverse proxy | **Caddy** | Auto-HTTPS из коробки одной строкой конфига |
| Логирование | **pino** | Самый быстрый JSON-логгер для Node |
| Валидация | **zod** | Везде где нужно проверять данные |
| Тесты | **vitest** | Быстрый, jest-совместимый |

### Что НЕ берём и почему

- ❌ **NestJS** — фреймворк "всё в одном" с DI и декораторами. Для бота избыточен.
- ❌ **TypeORM** — устарел, менее удобен чем Prisma.
- ❌ **MongoDB / NoSQL** — у нас сильно реляционные данные, нужны транзакции (особенно для ledger).
- ❌ **Kubernetes** — оверкилл для такого масштаба, docker-compose покрывает всё нужное.

## Режимы работы бота

Telegram даёт два режима, поддерживаем оба:

### Polling — без домена (для MVP)

Бот сам опрашивает Telegram. Не требует HTTPS, домена, входящего трафика.

```
BOT_MODE=polling
WEBHOOK_URL=  # пусто
```

### Webhook — когда будет домен

Telegram стучится к нам. Нужен валидный домен с HTTPS (Caddy + Let's Encrypt).

```
BOT_MODE=webhook
WEBHOOK_URL=https://poker.example.com/webhook
```

**Переключение** — одна переменная в `.env`. В коде это `if (config.BOT_MODE === 'webhook') {...} else {...}`.

## Структура репозитория

```
poker-tracker/
├── docker-compose.yml          базовый стек (без Caddy)
├── docker-compose.caddy.yml    overlay при появлении домена
├── docker-compose.dev.yml      override для локалки
├── .env.example
├── Caddyfile
├── README.md
│
├── prisma/
│   ├── schema.prisma           конвертация из db/schema.sql
│   ├── migrations/
│   └── seed.ts
│
├── src/
│   ├── bot/                    Telegram-бот
│   │   ├── index.ts            entry point с polling/webhook
│   │   ├── modes/
│   │   ├── handlers/           обработчики команд (/start, /balance, ...)
│   │   ├── scenes/             FSM-сцены grammy (онбординг, сессия, ...)
│   │   ├── keyboards/          inline-клавиатуры
│   │   └── texts/ru.ts         все тексты сообщений
│   │
│   ├── worker/                 фоновый воркер
│   │   ├── index.ts
│   │   ├── jobs/               OCR, notify, timeout
│   │   └── schedulers/         cron-задачи
│   │
│   ├── api/                    БУДУЩЕЕ: REST API для веб-фронта
│   │   ├── index.ts            Fastify (заглушка, не запускается)
│   │   └── routes/
│   │
│   ├── core/                   бизнес-логика, общая для бота и worker
│   │   ├── settle_up.ts
│   │   ├── session.ts
│   │   ├── ledger.ts
│   │   ├── ocr.ts
│   │   ├── matching.ts         OCR ↔ member_aliases
│   │   ├── permissions.ts
│   │   └── invites.ts
│   │
│   ├── db/
│   │   └── client.ts           PrismaClient singleton
│   │
│   ├── queue/
│   │   ├── client.ts
│   │   └── types.ts
│   │
│   ├── storage/
│   │   └── minio.ts            обёртка над S3 SDK
│   │
│   ├── config/
│   │   └── env.ts              zod-валидация .env
│   │
│   └── lib/
│       ├── logger.ts           pino instance
│       ├── errors.ts
│       └── utils.ts
│
├── tests/
├── scripts/
│   ├── backup-db.sh
│   ├── restore-db.sh
│   ├── create-club.ts          CLI для создания клуба (super-admin)
│   └── register-webhook.ts     регистрация webhook у Telegram
│
└── docker/
    ├── bot.Dockerfile
    ├── worker.Dockerfile
    └── api.Dockerfile          для будущего веб-API
```

## Принципиальное разделение слоёв

```
┌─────────────────────────────────────────┐
│  src/bot/  +  src/worker/  +  src/api/  │  ← UI / транспорт
└────────────────────┬────────────────────┘
                     │ вызывают
                     ▼
              ┌──────────────┐
              │  src/core/   │  ← бизнес-логика
              └──────┬───────┘
                     │ через
                     ▼
              ┌──────────────┐
              │  src/db/     │  ← Prisma
              └──────────────┘
```

`src/core/` **не знает** про grammy, BullMQ, Telegram. Получает PrismaClient, делает дело, возвращает результат. Это значит:
- Тестировать можно без бота
- Веб-API сможет переиспользовать ту же логику
- Менять UI-слой без переписывания логики

## Безопасность

- **Никаких API-ключей в коде**, только через `.env` (валидируется через zod при старте).
- **Postgres и Redis наружу не торчат**, только internal docker network.
- **MinIO консоль** (порт 9001) можно опционально открыть для админки.
- **Скрины в MinIO** доступны только серверу, не клиенту напрямую (выдача через бэкенд с проверкой прав).
- **Бэкапы БД** — обязательны с первого дня. Cron на хосте, копирование на внешнее хранилище.

## Бэкапы

Скрипт `scripts/backup-db.sh` запускается через crontab на хосте раз в сутки:

```bash
#!/bin/sh
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
docker compose exec -T postgres pg_dump -U $DB_USER poker_tracker | \
    gzip > /var/backups/poker/poker_$TIMESTAMP.sql.gz
ls -t /var/backups/poker/poker_*.sql.gz | tail -n +31 | xargs -r rm
```

Плюс **обязательно** копирование на внешнее хранилище (rclone к Google Drive / S3 / другому VPS).

## Расширяемость

### Когда появится домен
1. Заполнить `DOMAIN=` и `WEBHOOK_URL=` в `.env`
2. Сменить `BOT_MODE=webhook`
3. Запустить `docker compose -f docker-compose.yml -f docker-compose.caddy.yml up -d`
4. Зарегистрировать webhook: `docker compose exec bot npm run register-webhook`

### Когда понадобится веб-фронт
1. Раскомментировать сервис `api` в `docker-compose.yml`
2. Заполнить routes в `src/api/routes/`
3. Использовать те же `src/core/` модули — никакой дублирующей логики

### Когда понадобится мульти-клубный SaaS
1. Уже всё мультитенантно через `club_id`
2. Открыть регистрацию через веб-фронт (на боте остаётся приватная)
3. Добавить биллинг, лимиты по тарифу — отдельная история

## VPS-требования

**Минимум для MVP** (компания друзей, ~10 человек, ~5 сессий в неделю):
- 1 vCPU, 2 GB RAM, 20 GB SSD
- Hetzner CX22, DigitalOcean basic, Vultr Cloud Compute

**Использование ресурсов:**
- Postgres: ~150 MB RAM
- Redis: ~50 MB
- MinIO: ~100 MB
- Node.js × 2 (bot + worker): ~300 MB
- Caddy: ~30 MB
- **Итого: ~700 MB** — в 2 GB укладывается с запасом
