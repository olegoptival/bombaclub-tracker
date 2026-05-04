-- ============================================================================
-- Poker Club Tracker — Schema v1.0
-- PostgreSQL 14+
--
-- Архитектурные принципы:
--   * UUID PK везде (gen_random_uuid)
--   * DECIMAL(15,2) для всех денежных полей
--   * Статусы — VARCHAR + CHECK (не enum, для гибкости миграций)
--   * Все таблицы привязаны к club_id (мультитенантная модель)
--   * Все изменения балансов идут через ledger_entries (append-only)
--   * Каскады продуманы: удаление клуба = каскад, удаление user = SET NULL в audit
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- для gen_random_uuid()


-- ============================================================================
-- ГРУППА 1: ПОЛЬЗОВАТЕЛИ И КЛУБЫ
-- ============================================================================

-- Глобальный аккаунт человека. Один email/telegram_chat_id = один user.
-- На фазе 1 (только бот) email и password_hash могут быть NULL.
CREATE TABLE users (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telegram_chat_id    BIGINT UNIQUE NOT NULL,
    telegram_username   VARCHAR(64),                 -- @vasya, может меняться юзером
    display_name        VARCHAR(128) NOT NULL,       -- имя для UI
    email               VARCHAR(255) UNIQUE,         -- для будущей веб-версии
    password_hash       VARCHAR(255),                -- для будущей веб-версии
    is_superuser        BOOLEAN NOT NULL DEFAULT FALSE,

    -- Текущий выбранный клуб (для команд, где контекст важен).
    -- Обновляется когда пользователь переключается между клубами.
    -- Для пользователей в одном клубе это просто его клуб.
    current_club_id     UUID,                        -- FK добавляется ниже (DEFERRABLE)

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_telegram_chat_id ON users(telegram_chat_id);


-- Клуб (компания друзей).
CREATE TABLE clubs (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                VARCHAR(128) NOT NULL,
    slug                VARCHAR(64) UNIQUE NOT NULL, -- для будущих URL
    created_by          UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,

    -- Период settle-up
    settlement_period   VARCHAR(16) NOT NULL DEFAULT 'manual'
        CHECK (settlement_period IN ('day', 'week', 'month', 'manual')),

    -- Какие платформы использует клуб (для обязательности алиасов)
    -- Пример: ['clubgg'] => при добавлении игрока ClubGG-ник обязателен
    required_aliases    TEXT[] NOT NULL DEFAULT '{}',

    -- Окно (в днях) после закрытия сессии, в течение которого можно открыть диспьют
    dispute_window_days INTEGER NOT NULL DEFAULT 7
        CHECK (dispute_window_days > 0),

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- FK для users.current_club_id — добавляем после создания clubs,
-- чтобы избежать циклической зависимости при создании таблиц
ALTER TABLE users
    ADD CONSTRAINT fk_users_current_club
    FOREIGN KEY (current_club_id) REFERENCES clubs(id) ON DELETE SET NULL;


-- Связь user ↔ club (многие-ко-многим). Это центральная сущность —
-- всё, что относится к "игроку в клубе", привязывается сюда.
CREATE TABLE club_members (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id             UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    role                VARCHAR(16) NOT NULL DEFAULT 'player'
        CHECK (role IN ('player', 'host')),

    nickname            VARCHAR(64) NOT NULL,        -- ник в этом клубе
    current_balance     DECIMAL(15,2) NOT NULL DEFAULT 0,  -- кэш, источник истины — ledger

    -- Жизненный цикл членства:
    --   pending   — заявка по инвайту, ждёт подтверждения host'ом
    --   active    — обычный активный член клуба
    --   rejected  — заявка отклонена host'ом
    --   inactive  — исключён из клуба host'ом
    status              VARCHAR(16) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'active', 'rejected', 'inactive')),
    rejected_reason     TEXT,                        -- причина отказа/исключения
    status_changed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status_changed_by   UUID REFERENCES users(id) ON DELETE SET NULL,

    joined_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (club_id, user_id),                       -- один user — одно членство в клубе
    UNIQUE (club_id, nickname)                       -- ники уникальны внутри клуба
);

CREATE INDEX idx_club_members_user ON club_members(user_id);
CREATE INDEX idx_club_members_club ON club_members(club_id);
CREATE INDEX idx_club_members_status ON club_members(club_id, status);


-- Алиасы игрока на разных платформах (ClubGG, PPPoker, etc.).
-- Используется для авто-сопоставления при OCR-импорте.
CREATE TABLE member_aliases (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_member_id      UUID NOT NULL REFERENCES club_members(id) ON DELETE CASCADE,
    source              VARCHAR(32) NOT NULL,        -- 'clubgg', 'pppoker', etc.
    alias_name          VARCHAR(64) NOT NULL,        -- 'Yakirsneh'
    alias_id            VARCHAR(32),                 -- '5527-4545' (опц.)
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Один и тот же ник на одной платформе не может принадлежать двум членам клуба
    UNIQUE (source, alias_name, alias_id)
);

CREATE INDEX idx_member_aliases_lookup ON member_aliases(source, alias_name);
CREATE INDEX idx_member_aliases_member ON member_aliases(club_member_id);


-- Инвайты для добавления игроков в клуб
CREATE TABLE club_invites (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id             UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    token               VARCHAR(32) UNIQUE NOT NULL,
    created_by          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at          TIMESTAMPTZ NOT NULL,
    used_by_user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    used_at             TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_club_invites_token ON club_invites(token) WHERE used_at IS NULL;


-- ============================================================================
-- ГРУППА 2: СЕССИИ И СТОЛЫ
-- ============================================================================

-- Сессия = одна встреча для игры
CREATE TABLE sessions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id             UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    host_id             UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    co_host_id          UUID REFERENCES users(id) ON DELETE SET NULL,

    type                VARCHAR(16) NOT NULL
        CHECK (type IN ('online', 'offline')),

    -- Жизненный цикл сессии:
    --   created     — создана, для оффлайна события ещё не вводились
    --   in_progress — идёт (только оффлайн; онлайн закрывается одной транзакцией)
    --   ended       — нормально завершена
    --   disputed    — есть открытый диспьют по этой сессии
    --   cancelled   — отменена в 5-минутном окне после закрытия
    status              VARCHAR(16) NOT NULL DEFAULT 'created'
        CHECK (status IN ('created', 'in_progress', 'ended', 'disputed', 'cancelled')),

    title               VARCHAR(255),                -- 'Четверг у Васи' (опц.)
    started_at          TIMESTAMPTZ,                 -- фактическое начало (для онлайн = время первой руки из скрина)
    ended_at            TIMESTAMPTZ,                 -- фактическое завершение
    last_activity_at    TIMESTAMPTZ,                 -- для авто-таймаута оффлайн

    -- Авто-закрытие через 12 часов отсутствия активности
    auto_closed         BOOLEAN NOT NULL DEFAULT FALSE,

    -- Отмена сессии в 5-минутном окне после закрытия (compensating ledger entries)
    cancelled_at        TIMESTAMPTZ,
    cancelled_by        UUID REFERENCES users(id) ON DELETE SET NULL,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Один host — одна активная сессия в клубе одновременно
CREATE UNIQUE INDEX idx_one_active_session_per_host_per_club
    ON sessions(club_id, host_id)
    WHERE status = 'in_progress';

CREATE INDEX idx_sessions_club_status ON sessions(club_id, status);
CREATE INDEX idx_sessions_active ON sessions(last_activity_at) WHERE status = 'in_progress';


-- Стол внутри сессии. Обычно 1 на 1, но модель позволяет несколько.
CREATE TABLE tables (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id          UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    name                VARCHAR(64),                 -- 'NLH bomba', опц.
    game_type           VARCHAR(32) DEFAULT 'NLH',   -- NLH / PLO / etc.
    blinds              VARCHAR(16),                 -- '1/2'
    min_buy_in          DECIMAL(15,2),
    max_buy_in          DECIMAL(15,2),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tables_session ON tables(session_id);


-- Участники сессии. Может быть либо член клуба, либо гость.
CREATE TABLE session_participants (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id          UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,

    -- Один из двух: либо член клуба, либо гость
    club_member_id      UUID REFERENCES club_members(id) ON DELETE RESTRICT,
    guest_name          VARCHAR(64),                 -- если гость — отображаемое имя

    joined_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Ровно одно из двух заполнено
    CONSTRAINT chk_member_xor_guest CHECK (
        (club_member_id IS NOT NULL AND guest_name IS NULL) OR
        (club_member_id IS NULL AND guest_name IS NOT NULL)
    ),

    -- Член клуба не может быть участником одной сессии дважды
    UNIQUE (session_id, club_member_id)
);

CREATE INDEX idx_participants_session ON session_participants(session_id);
CREATE INDEX idx_participants_member ON session_participants(club_member_id);


-- ============================================================================
-- ГРУППА 3: СОБЫТИЯ ИГРЫ
-- ============================================================================

-- Каждое событие "игрок занёс жетоны за стол"
CREATE TABLE buy_in_events (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_id            UUID NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
    participant_id      UUID NOT NULL REFERENCES session_participants(id) ON DELETE CASCADE,
    amount              DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    occurred_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by          UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Soft-delete: для "отмены последнего события" в активной оффлайн-сессии.
    -- Запись остаётся в БД, но не учитывается в расчётах (WHERE deleted_at IS NULL).
    deleted_at          TIMESTAMPTZ,
    deleted_by          UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_buyins_table ON buy_in_events(table_id);
CREATE INDEX idx_buyins_participant ON buy_in_events(participant_id);


-- Каждое событие "игрок вышел из-за стола"
CREATE TABLE cash_out_events (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_id            UUID NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
    participant_id      UUID NOT NULL REFERENCES session_participants(id) ON DELETE CASCADE,
    stack_amount        DECIMAL(15,2) NOT NULL CHECK (stack_amount >= 0),
    occurred_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by          UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Soft-delete (см. buy_in_events)
    deleted_at          TIMESTAMPTZ,
    deleted_by          UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_cashouts_table ON cash_out_events(table_id);
CREATE INDEX idx_cashouts_participant ON cash_out_events(participant_id);


-- ============================================================================
-- ГРУППА 4: ИТОГИ И SETTLE-UP
-- ============================================================================

-- Snapshot результатов на момент закрытия сессии.
-- Денормализация: можно посчитать из событий, но мы фиксируем для производительности
-- и чтобы правки задним числом не меняли исторические снимки.
CREATE TABLE session_results (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id          UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    participant_id      UUID NOT NULL REFERENCES session_participants(id) ON DELETE CASCADE,

    total_buy_in        DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_cash_out      DECIMAL(15,2) NOT NULL DEFAULT 0,
    profit_loss         DECIMAL(15,2) NOT NULL DEFAULT 0,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (session_id, participant_id)
);

CREATE INDEX idx_results_session ON session_results(session_id);
CREATE INDEX idx_results_participant ON session_results(participant_id);


-- Период settle-up клуба
CREATE TABLE settlement_periods (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id             UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    period_start        DATE NOT NULL,
    period_end          DATE NOT NULL,
    status              VARCHAR(16) NOT NULL DEFAULT 'open'
        CHECK (status IN ('open', 'closed', 'cancelled')),
    closed_at           TIMESTAMPTZ,
    closed_by           UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (period_end >= period_start)
);

CREATE INDEX idx_periods_club ON settlement_periods(club_id, status);


-- Конкретные переводы (результат алгоритма минимизации)
CREATE TABLE settlement_transfers (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_id           UUID NOT NULL REFERENCES settlement_periods(id) ON DELETE CASCADE,
    from_member_id      UUID NOT NULL REFERENCES club_members(id) ON DELETE RESTRICT,
    to_member_id        UUID NOT NULL REFERENCES club_members(id) ON DELETE RESTRICT,
    amount              DECIMAL(15,2) NOT NULL CHECK (amount > 0),

    confirmed_by_from   BOOLEAN NOT NULL DEFAULT FALSE,
    confirmed_by_to     BOOLEAN NOT NULL DEFAULT FALSE,
    confirmed_at        TIMESTAMPTZ,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (from_member_id <> to_member_id)
);

CREATE INDEX idx_transfers_period ON settlement_transfers(period_id);
CREATE INDEX idx_transfers_from ON settlement_transfers(from_member_id);
CREATE INDEX idx_transfers_to ON settlement_transfers(to_member_id);


-- ============================================================================
-- ГРУППА 5: СПОРЫ
-- ============================================================================

CREATE TABLE disputes (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id          UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    raised_by           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    description         TEXT NOT NULL,
    screenshot_url      VARCHAR(512),                -- ссылка на S3/локальное хранилище

    status              VARCHAR(16) NOT NULL DEFAULT 'open'
        CHECK (status IN ('open', 'accepted', 'rejected')),

    resolved_by         UUID REFERENCES users(id) ON DELETE SET NULL,
    resolution_note     TEXT,
    resolved_at         TIMESTAMPTZ,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_disputes_session ON disputes(session_id);
CREATE INDEX idx_disputes_status ON disputes(status);


-- ============================================================================
-- ГРУППА 6: OCR-ИМПОРТЫ (для онлайн-сессий)
-- ============================================================================

-- Скриншот ClubGG (или другой платформы), загруженный в сессию.
-- Одна онлайн-сессия может содержать несколько скринов одного или разных столов.
-- Итоговый P&L игрока в сессии = сумма его P&L по всем подтверждённым скринам.
CREATE TABLE ocr_imports (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id            UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    table_id              UUID REFERENCES tables(id) ON DELETE SET NULL,

    -- Файл
    image_url             VARCHAR(512) NOT NULL,        -- ссылка в MinIO
    image_hash            VARCHAR(64) NOT NULL,         -- sha256 для дедупа

    -- Жизненный цикл
    status                VARCHAR(16) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'processing', 'parsed', 'confirmed', 'rejected', 'failed')),

    -- OCR-результат
    raw_response          JSONB,                        -- полный ответ Vision API as-is
    parsed_data           JSONB,                        -- структурированный результат парсинга
    provider              VARCHAR(32),                  -- 'claude' / 'gpt4o' / etc.
    confidence_score      DECIMAL(3,2),                 -- 0.00-1.00
    error_message         TEXT,                         -- если status = 'failed'

    -- Метаданные распознанного скрина
    snapshot_period_start TIMESTAMPTZ,                  -- из шапки скрина: '2026-04-28 22:14:20'
    snapshot_period_end   TIMESTAMPTZ,                  -- из шапки скрина: '2026-04-29 10:14:20'

    -- Подтверждение host'ом
    uploaded_by           UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    confirmed_by          UUID REFERENCES users(id) ON DELETE SET NULL,
    confirmed_at          TIMESTAMPTZ,

    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at          TIMESTAMPTZ
);

CREATE INDEX idx_ocr_session ON ocr_imports(session_id);
CREATE INDEX idx_ocr_status ON ocr_imports(status);
CREATE INDEX idx_ocr_table ON ocr_imports(table_id);

-- Защита от загрузки одного и того же скрина дважды в одну сессию
CREATE UNIQUE INDEX idx_ocr_unique_image_per_session
    ON ocr_imports(session_id, image_hash);


-- Распознанные результаты по каждому игроку для каждого скрина.
-- Промежуточный слой между ocr_imports и session_results.
-- Финальный session_results.profit_loss = SUM(ocr_screen_results.profit_loss)
-- по всем подтверждённым скринам сессии.
CREATE TABLE ocr_screen_results (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ocr_import_id         UUID NOT NULL REFERENCES ocr_imports(id) ON DELETE CASCADE,
    participant_id        UUID NOT NULL REFERENCES session_participants(id) ON DELETE CASCADE,

    -- Что распознали в скрине (для отладки и истории сопоставления)
    recognized_name       VARCHAR(64),                  -- 'Yakirsneh'
    recognized_alias_id   VARCHAR(32),                  -- '5527-4545'

    profit_loss           DECIMAL(15,2) NOT NULL,
    fee                   DECIMAL(15,2) NOT NULL DEFAULT 0,

    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Один игрок — один результат на конкретный скрин
    UNIQUE (ocr_import_id, participant_id)
);

CREATE INDEX idx_screen_results_import ON ocr_screen_results(ocr_import_id);
CREATE INDEX idx_screen_results_participant ON ocr_screen_results(participant_id);


-- ============================================================================
-- ГРУППА 7: AUDIT LEDGER (append-only)
-- ============================================================================

-- ВАЖНО: эта таблица никогда не редактируется и не удаляется.
-- Любое изменение баланса игрока = новая запись.
-- Это источник истины для current_balance в club_members.
CREATE TABLE ledger_entries (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id             UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    member_id           UUID NOT NULL REFERENCES club_members(id) ON DELETE CASCADE,

    delta               DECIMAL(15,2) NOT NULL,      -- может быть + или -
    balance_after       DECIMAL(15,2) NOT NULL,      -- баланс после операции

    reason              VARCHAR(32) NOT NULL
        CHECK (reason IN (
            'session_result',        -- результат сессии
            'manual_adjustment',     -- ручная корректировка host'а
            'dispute_resolution',    -- по итогам спора
            'settlement_transfer',   -- перевод между игроками
            'correction'             -- исправление ошибки
        )),

    description         TEXT,                        -- человеко-читаемое объяснение

    -- Ссылки на источник операции (опц., в зависимости от reason)
    session_id          UUID REFERENCES sessions(id) ON DELETE SET NULL,
    transfer_id         UUID REFERENCES settlement_transfers(id) ON DELETE SET NULL,
    dispute_id          UUID REFERENCES disputes(id) ON DELETE SET NULL,

    actor_user_id       UUID REFERENCES users(id) ON DELETE SET NULL,  -- кто инициировал
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ledger_member_time ON ledger_entries(member_id, created_at);
CREATE INDEX idx_ledger_club_time ON ledger_entries(club_id, created_at);
CREATE INDEX idx_ledger_session ON ledger_entries(session_id) WHERE session_id IS NOT NULL;


-- Защита: запретить UPDATE/DELETE на ledger_entries
CREATE OR REPLACE FUNCTION prevent_ledger_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'ledger_entries is append-only — % not allowed', TG_OP;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ledger_no_update
    BEFORE UPDATE ON ledger_entries
    FOR EACH ROW EXECUTE FUNCTION prevent_ledger_modification();

CREATE TRIGGER trg_ledger_no_delete
    BEFORE DELETE ON ledger_entries
    FOR EACH ROW EXECUTE FUNCTION prevent_ledger_modification();


-- ============================================================================
-- ГРУППА 8: NOTIFICATIONS (очередь уведомлений → Telegram)
-- ============================================================================

-- Очередь уведомлений: бот/worker создают записи, отдельный воркер
-- разбирает pending и шлёт через Telegram API.
-- Это даёт идемпотентность, отложенные уведомления (5 мин после
-- закрытия сессии), и историю для отладки.
CREATE TABLE notifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Тип события для выбора шаблона.
    -- Примеры: 'session_ended', 'dispute_opened', 'settle_up_closed',
    --          'application_received', 'application_approved',
    --          'application_rejected', 'balance_adjusted', 'excluded_from_club',
    --          'session_inactive_warning', 'session_auto_closed',
    --          'application_pending_reminder', 'dispute_pending_reminder'
    event_type      VARCHAR(64) NOT NULL,

    -- Данные для подстановки в шаблон сообщения.
    -- Структура зависит от event_type — проверяется в коде, не в БД.
    payload         JSONB NOT NULL DEFAULT '{}',

    -- Жизненный цикл уведомления
    status          VARCHAR(16) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
    error_message   TEXT,                            -- если status = 'failed'
    retry_count     INTEGER NOT NULL DEFAULT 0,

    -- Когда отправлять (для отложенных уведомлений типа 5 мин после сессии)
    scheduled_for   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sent_at         TIMESTAMPTZ,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Воркер запрашивает только готовые к отправке pending'и
CREATE INDEX idx_notifications_pending
    ON notifications(scheduled_for)
    WHERE status = 'pending';

-- Для истории и UI ("мои уведомления")
CREATE INDEX idx_notifications_user_time ON notifications(user_id, created_at DESC);


-- ============================================================================
-- ГРУППА 9: ВСПОМОГАТЕЛЬНЫЕ ТРИГГЕРЫ
-- ============================================================================

-- Авто-обновление updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_clubs_updated_at
    BEFORE UPDATE ON clubs FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_sessions_updated_at
    BEFORE UPDATE ON sessions FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- Авто-обновление last_activity_at в sessions при добавлении событий
CREATE OR REPLACE FUNCTION update_session_activity()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE sessions
    SET last_activity_at = NOW()
    WHERE id = (SELECT session_id FROM tables WHERE id = NEW.table_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_buyin_activity
    AFTER INSERT ON buy_in_events
    FOR EACH ROW EXECUTE FUNCTION update_session_activity();

CREATE TRIGGER trg_cashout_activity
    AFTER INSERT ON cash_out_events
    FOR EACH ROW EXECUTE FUNCTION update_session_activity();
