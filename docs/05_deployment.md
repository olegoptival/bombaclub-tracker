# 05. Развёртывание

## Что нужно подготовить заранее

1. **VPS** — минимум 1 vCPU, 2 GB RAM, 20 GB SSD
   Hetzner CX22 / DigitalOcean basic / Vultr Cloud Compute
2. **SSH-доступ** к VPS, привычный пакетный менеджер (рекомендуется Ubuntu 22.04+)
3. **Telegram-бот** через [@BotFather](https://t.me/BotFather):
   - команда `/newbot`, имя, username
   - получить токен, сохранить
4. **Anthropic API Key** для OCR — на console.anthropic.com
5. **Домен** — необязательно для старта (бот работает в polling). Понадобится только для webhook-режима.

## Установка зависимостей на VPS

```bash
# Docker + Compose plugin
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Утилиты
sudo apt install -y git make
```

## Развёртывание (полная инструкция)

```bash
# 1. Клонируешь репо
cd /opt
git clone <your-repo-url> poker-tracker
cd poker-tracker

# 2. Заполняешь .env
cp .env.example .env
nano .env
# Заполни:
# - TELEGRAM_BOT_TOKEN
# - ANTHROPIC_API_KEY
# - DB_PASSWORD (openssl rand -base64 24)
# - MINIO_PASSWORD (openssl rand -base64 24)
# Остальное — дефолтные значения, можно не трогать

# 3. Поднимаешь стек
docker compose up -d

# 4. Применяешь миграции
docker compose exec bot npx prisma migrate deploy

# 5. Создаёшь свой клуб (ты — host)
docker compose exec bot npm run create-club -- \
    --name "Четверги у Васи" \
    --host-telegram-id <твой-telegram-id> \
    --host-nickname "Don ron99" \
    --period week \
    --platforms clubgg \
    --host-clubgg-name "Don ron99" \
    --host-clubgg-id "2700-6386"
```

После этого:
- Бот пишет тебе в Telegram: "Тебе создан клуб «Четверги у Васи»"
- Ты пишешь /invite, получаешь ссылку, рассылаешь друзьям
- Они переходят, проходят онбординг, ты подтверждаешь
- Можешь играть и заводить сессии

## Как узнать свой Telegram ID

Напиши боту [@userinfobot](https://t.me/userinfobot) — он скажет твой ID.

Или после первого `/start` нашему боту — ID будет в логах:
```bash
docker compose logs bot | grep "telegram_chat_id"
```

## Переключение на webhook (когда появится домен)

```bash
# 1. Направь A-запись DNS на IP VPS
#    Например: poker.example.com → 1.2.3.4

# 2. Заполни Caddyfile
cat > Caddyfile <<EOF
poker.example.com {
    reverse_proxy /webhook bot:3000
}
EOF

# 3. Обнови .env
echo "DOMAIN=poker.example.com" >> .env
echo "BOT_MODE=webhook" >> .env
echo "WEBHOOK_URL=https://poker.example.com/webhook" >> .env

# 4. Перезапуск с Caddy
docker compose -f docker-compose.yml -f docker-compose.caddy.yml up -d

# 5. Зарегистрируй webhook у Telegram
docker compose exec bot npm run register-webhook
```

Caddy автоматически получит SSL-сертификат от Let's Encrypt и будет его обновлять.

## Деплой обновлений

```bash
cd /opt/poker-tracker
git pull
docker compose build bot worker
docker compose up -d bot worker
docker compose exec bot npx prisma migrate deploy   # если есть новые миграции
```

Можно обернуть в скрипт `deploy.sh`. На начальном этапе — руками.

## Бэкапы

Crontab на хосте (`crontab -e`):

```
# Ежедневный бэкап БД в 04:00
0 4 * * * /opt/poker-tracker/scripts/backup-db.sh
```

Скрипт `scripts/backup-db.sh`:
```bash
#!/bin/sh
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/var/backups/poker
mkdir -p "$BACKUP_DIR"
docker compose -f /opt/poker-tracker/docker-compose.yml exec -T postgres \
    pg_dump -U $DB_USER poker_tracker | gzip > "$BACKUP_DIR/poker_$TIMESTAMP.sql.gz"

# Оставляем последние 30 бэкапов
ls -t "$BACKUP_DIR"/poker_*.sql.gz | tail -n +31 | xargs -r rm
```

**Обязательно** копируй бэкапы наружу (на другой VPS / Google Drive через rclone / S3).

Восстановление:
```bash
gunzip < poker_20260415_040000.sql.gz | \
    docker compose exec -T postgres psql -U $DB_USER poker_tracker
```

## Мониторинг (минимум)

```bash
# Логи бота
docker compose logs -f bot

# Логи worker
docker compose logs -f worker

# Все логи разом
docker compose logs -f

# Использование ресурсов
docker stats
```

Серьёзный мониторинг (Prometheus, Grafana) — если когда-то понадобится. Для side-project с 10 пользователями — `docker logs` хватает.

## Траблшутинг

### Бот не отвечает

```bash
# Проверь что контейнер живой
docker compose ps

# Проверь логи
docker compose logs bot --tail 100

# Проверь подключение к БД
docker compose exec bot npx prisma db pull
```

### OCR не работает

```bash
# Проверь что worker крутится
docker compose ps worker
docker compose logs worker --tail 100

# Проверь что ANTHROPIC_API_KEY заполнен
docker compose exec worker env | grep ANTHROPIC

# Тест-вызов
docker compose exec worker node -e "
  fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5',
      max_tokens: 10,
      messages: [{role: 'user', content: 'say hi'}]
    })
  }).then(r => r.text()).then(console.log)
"
```

### MinIO недоступен

```bash
# Проверь что bucket создан
docker compose exec minio mc alias set local http://localhost:9000 $MINIO_USER $MINIO_PASSWORD
docker compose exec minio mc ls local

# Создать bucket вручную
docker compose exec minio mc mb local/poker-screens
```

### Очередь не обрабатывается

```bash
# Подключись к Redis CLI
docker compose exec redis redis-cli
> KEYS bull:*
> LLEN bull:ocr:waiting
```

## Что делать при критическом сбое

1. **Бэкап БД** есть — данные спасены. Восстановись из последнего бэкапа.
2. **Скрины в MinIO** при сбое postgres не теряются (отдельный volume). При сбое всего VPS — восстанавливай из бэкапа MinIO (если делаешь).
3. **Очередь Redis** при перезапуске потеряется — это **нормально**. Все важные операции (закрытие сессии, settle-up) идут через transactions Postgres, в очереди только OCR и уведомления, которые ретраятся.
