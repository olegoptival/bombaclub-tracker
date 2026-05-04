# Bombaclub Tracker — Stage 4 backlog

Что осталось доделать из Этапа 4 (фичи). Каждый пункт самостоятелен —
можно брать в любом порядке, в любом чате с Claude.

---

## 1. Диспьюты (7-day window)

**Бизнес-правило (см. PROJECT_BRIEF.md):** игрок может оспорить результат
сессии в течение `clubs.dispute_window_days` дней (по умолчанию 7). Host
видит диспьют, может принять с правкой результата или отклонить.

**Требуемые поверхности:**
- Кнопка "Dispute this session" на `/sessions/[id]` — показывается player'у
  в чьей сессии он участвовал, если `now - session.ended_at <= dispute_window_days`,
  и если у сессии ещё нет открытого диспьюта от него.
- Форма диспьюта: текст описания (обязательно), опциональный скриншот
  (загружается в MinIO, как OCR-импорты).
- Server action создаёт `disputes` row со status='open', опционально
  переводит `sessions.status` → `disputed` (если хотим визуальный маркер).
- Список диспьютов для host: `/disputes` или внутри `/sessions/[id]`.
  Карточка диспьюта: автор, текст, скрин если есть, кнопки "Accept with edit"
  / "Reject" / "Request more info".
- Accept-with-edit: открывает форму с участниками сессии, host правит P&L,
  при сохранении — транзакция: создаём `ledger_entries` с reason='dispute_resolution'
  компенсирующие старые суммы для каждого затронутого, обновляем `session_results`,
  ставим `disputes.status='accepted'`, `sessions.status='ended'`.
- Reject: один клик, `disputes.status='rejected'`, `resolution_note` опционально.

**Подводные камни:**
- Диспьют меняет уже записанные balances. Используем существующий паттерн —
  не перезаписываем ledger, а добавляем компенсирующие записи. См. `src/lib/ledger/post.ts`.
- Если у сессии уже был settle-up закрыт — это сложнее. На MVP можно блокировать
  диспьют после settle-up: проверка "сессия попала ли в закрытый
  settlement_period" → если да, диспьют недоступен.

**Файлы для создания:**
- `src/app/sessions/[id]/dispute/page.tsx` + `actions.ts` + `form.tsx`
- `src/app/disputes/page.tsx` (host inbox)
- `src/app/disputes/[id]/page.tsx` (детальная карточка с действиями)

---

## 2. Управление членами клуба (host)

**Бизнес-правило:** host управляет своим клубом — может корректировать
балансы (с обязательной причиной), исключать членов, видеть историю
изменений по каждому.

**Требуемые поверхности:**
- `/members` — список всех `club_members` активного клуба для host'а.
  Каждая строка: nickname, роль, текущий баланс, статус, кнопки.
- Действия:
  - **Adjust balance** — модалка/форма: amount (positive/negative), reason
    (обязательно текст), записывает `ledger_entries` с
    reason='manual_adjustment' через `postLedgerEntry()`.
  - **Deactivate** — переводит `club_members.status` → 'inactive', записывает
    `inactive_reason`, `status_changed_at`, `status_changed_by`.
  - **Reactivate** — обратно в active.
  - **Change nickname** — простой апдейт.
  - **Change role** (player ↔ host) — для super-admin.
- Детальная карточка члена: вся история его `ledger_entries` — лента событий
  с фильтром по reason.

**Файлы:**
- `src/app/members/page.tsx`
- `src/app/members/[id]/page.tsx`
- `src/app/members/actions.ts` (adjust, deactivate, etc.)

---

## 3. 5-минутное окно отмены онлайн-сессии

**Бизнес-правило (DESIGN_PROMPT.md):** после финализации онлайн-сессии есть
5-минутное окно, в течение которого host может всё отменить. Telegram-уведомления
тоже отправляются с задержкой 5 минут — если host отменил, уведомления отзываются.

**Реализация:**
- Сейчас `finalizeSessionAction` сразу пишет в ledger и ставит `ended`. Это
  оставляем как есть, НО:
- При финализации в `notifications` создаём запись с `scheduled_for = now + 5min`
  для каждого участника-члена клуба. Worker (отдельная очередь `notify`) их
  разгребает по cron.
- На странице `/sessions/[id]` после финализации показываем banner
  "Notifications going out in 4:32. Undo this session" с countdown.
- Action `undoFinalizationAction`: только для host, только если
  `now - ended_at < 5min`. Транзакция: создаём компенсирующие
  `ledger_entries` (delta = -original_delta, reason='correction'),
  ставим `sessions.status='cancelled'`, `cancelled_at`, `cancelled_by`,
  отменяем pending notifications.

**Файлы:**
- `src/app/sessions/[id]/undo/actions.ts` — undoFinalizationAction
- worker: `apps/worker/src/queues/notify.ts` — обработчик отложенных уведомлений
- web: producer для notify — создаётся вместе с finalizeSessionAction

---

## 4. Auto-timeout оффлайн-сессий (12 часов)

**Бизнес-правило:** если оффлайн-сессия `in_progress` 12 часов без новых
событий (`last_activity_at`) — автоматически закрывается. Все игроки которые
не cash-out'нули — отмечаются с `cash_out_amount = их total_buy_in`
(P&L=0), ставится флаг `auto_closed=true`.

**Реализация:**
- Cron-задача в worker'е через BullMQ Repeatable jobs — каждые 30 минут
  проверяет.
- SQL: `SELECT * FROM sessions WHERE status='in_progress' AND type='offline' AND last_activity_at < NOW() - INTERVAL '12 hours'`
- Для каждой найденной — закрытие как в endSessionAction, но без блокировки
  на missing cash-outs (вместо них — авто-cash-out с amount=total_buy_in
  для каждого незакрытого).

**Файлы:**
- `apps/worker/src/queues/timeout.ts` — repeatable cron job
- `apps/worker/src/index.ts` — registerCron(timeoutQueue) в main()

---

## 5. Telegram-нотификатор

**Бизнес-правило:** опциональная фича — игрок привязал свой
`telegram_chat_id` в профиле, получает уведомления о событиях в клубе:
сессия закрыта, balance changed, dispute opened, settle-up due.

**Реализация:**
- Создать Telegram Bot через @BotFather, токен в `.env` как `TELEGRAM_BOT_TOKEN`.
- В worker'е новая очередь `telegram-notify`. На каждое событие где сейчас
  пишем в `notifications` — добавляем job в эту очередь, если у участника
  заполнен telegram_chat_id.
- Никакого "управляющего бота" — просто исходящие уведомления через
  `sendMessage`. Юзер ничего не отвечает.
- В профиле (`/profile`) — поле для ввода telegram_chat_id и кнопка
  "Send test message" для проверки что чат правильный.

**Файлы:**
- `apps/worker/src/lib/telegram.ts` — простая обёртка вокруг fetch к Bot API
- `apps/worker/src/queues/telegram.ts` — обработчик
- `src/app/profile/page.tsx` + actions для редактирования telegram_chat_id

---

## 6. UI-доводка по макетам

**Источник:** `tokens.css`, `components.jsx`, `dashboard.jsx`, `wizard.jsx`,
`fork-and-offline.jsx` в project knowledge.

**Что нужно портировать в TS компоненты:**
- `MoneyDisplay` — у нас уже есть упрощённая версия, нужна полная с вариантами hero/lg/md/sm
- `PlayerAvatar` — initials с детерминированным цветом, ring для guest
- `Icon` — централизованный SVG компонент с набором иконок (home, list, scale, users, plus, bell, check, x, chevD, arrowR, upload, image, monitor, felt, spade и т.д.)
- `MobileHeader` — клуб-свитчер + bell + avatar
- `BottomNav` — Home / Sessions / Settle-up / Members / Profile (mobile)
- `TopNav` (desktop)
- `StatusBadge` — для sessions и members
- `EmptyState` — иллюстрация + headline + description + CTA
- `Sparkline` — мини-график для balance trend

**Применение по экранам:**
- `/` (dashboard player) — hero balance, sparkline, last sessions, nav
- `/sessions/new` — больше контраста между Online/Offline cards (icons и accent)
- `/sessions/[id]/upload` — состояния OCR-tile (см. wizard.jsx OCRTile)
- `/sessions/[id]/match` — прогресс matching (1 of 3)
- `/sessions/[id]/review` — финальная сводка
- `/sessions/[id]` — карточка сессии
- `/sessions/[id]/live` — самый важный для одной руки за столом
- `/settle-up` — визуализация переводов стрелочками
- `/admin/*` — более plain operations console
- `/login`, `/first-login` — оформить как в макете

**Подход:**
- Выделить ~3-5 часов
- Сначала компоненты в `src/components/ui/` (Icon, MoneyDisplay, etc.)
- Потом по одному экрану — заменять inline-стили на компоненты + tailwind
- В конце — проверка mobile 390px viewport (Chrome DevTools)

---

## 7. Прочее (мелочёвка из брифа)

- **Sessions list** (`/sessions`) — сейчас нет глобального списка сессий,
  только последние 3 на dashboard. Сделать страницу с фильтрами по
  типу/периоду, инфинит-скроллом.
- **Recent activity feed** на dashboard — лента "John won 230 yesterday in
  Online NLH bomba".
- **Notification bell** в header — если есть unread.
- **Profile page** — настоящие поля (telegram_chat_id, change password,
  list of club aliases per club).
- **Audit log** в `/admin/audit` — глобальная лента ledger_entries для
  super-admin'а (помечен как disabled в nav.tsx — пока заглушка).
- **Multi-club switcher** — если у пользователя несколько активных
  membership'ов, дать ему свитчер и обновлять `users.current_club_id`.

---

## Порядок исполнения который я бы предложил

1. UI-доводка (#6) — после неё все остальные фичи будут добавляться в уже
   нормальном виде, а не "сначала функционально, потом косметически".
2. Member management (#2) — нужна для корректировок и dispute resolution.
3. Disputes (#1).
4. 5-минутное окно отмены (#3) + auto-timeout (#4) — оба требуют worker-cron.
5. Telegram (#5) — последним, опциональная радость.
6. Прочее (#7) — кусками между крупными фичами.

