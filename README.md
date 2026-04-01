# 1С Академия

Интерактивная платформа для изучения языка программирования **1С:Предприятие** и **OneScript** — с ИИ-генерацией уроков, встроенным редактором кода, выполнением программ в sandbox и геймификацией.

---

## Возможности

- **60 уроков** — структурированный 12-недельный курс от основ до алгоритмов
- **ИИ-преподаватель** — теория и задачи генерируются под каждый урок
- **Редактор кода** — Monaco Editor с подсветкой синтаксиса 1С/OneScript
- **Выполнение кода** — sandbox на OneScript в изолированном Docker-контейнере
- **Геймификация** — XP, уровни, серии дней, достижения, таблица лидеров
- **ИИ-анализ решений** — обратная связь и оценка кода после каждой отправки
- **Авторизация** — регистрация, вход, восстановление пароля

---

## Стек

| Слой | Технологии |
|------|-----------|
| Backend | FastAPI, PostgreSQL, SQLAlchemy (async), Alembic, JWT |
| Frontend | Next.js 14, TypeScript, Tailwind CSS, Framer Motion |
| Редактор | Monaco Editor с кастомным языком 1С |
| Sandbox | OneScript (oscript) в Docker |
| ИИ | gpt4free (GPT-4o-mini) |
| Инфра | Docker Compose, Caddy (auto-HTTPS) |

---

## Структура проекта

```
1c-learning-app/
├── backend/                  # FastAPI приложение
│   └── app/
│       ├── api/v1/           # Эндпоинты (auth, lessons, tasks, submissions...)
│       ├── core/             # Конфигурация, БД, безопасность
│       ├── models/           # SQLAlchemy модели
│       ├── schemas/          # Pydantic схемы
│       ├── repositories/     # Слой доступа к данным
│       ├── services/         # Бизнес-логика (AI, sandbox, auth...)
│       └── data/             # Учебный план (12 недель × 5 уроков)
├── frontend/                 # Next.js приложение
│   └── src/
│       ├── app/              # Страницы (auth, dashboard, lessons, tasks)
│       ├── components/       # CodeEditor, SubmissionResult, Navbar
│       └── lib/              # API клиент, Zustand store
├── sandbox/                  # Dockerfile для OneScript-окружения
├── postgres/                 # Инициализация БД
├── docker-compose.yml        # Продакшен
├── docker-compose.dev.yml    # Разработка
├── Caddyfile                 # Обратный прокси
└── Makefile                  # Команды управления
```

---

## Быстрый старт

### Разработка

```bash
git clone https://github.com/maxim-vdonsk/1c-learning-app.git
cd 1c-learning-app

make dev
```

Сервисы поднимаются автоматически:

| Сервис | URL |
|--------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API docs (Swagger) | http://localhost:8000/docs |

### Первый запуск

1. Зарегистрируйтесь на странице `/auth`
2. На главной нажмите **«Инициализировать курс»** — создастся 60 уроков
3. Перейдите в раздел **«Уроки»** и начните обучение

---

## Продакшен

```bash
cp .env.example .env
# Заполните .env: SECRET_KEY, POSTGRES_PASSWORD, DOMAIN
make prod
```

Caddy автоматически получит TLS-сертификат Let's Encrypt для вашего домена.

### Переменные окружения

| Переменная | Описание |
|-----------|---------|
| `SECRET_KEY` | JWT-секрет (генерировать: `openssl rand -hex 32`) |
| `POSTGRES_PASSWORD` | Пароль базы данных |
| `DOMAIN` | Ваш домен для HTTPS |
| `SMTP_HOST` / `SMTP_USER` / `SMTP_PASSWORD` | Email для восстановления пароля (опционально) |

---

## Учебный план

| Неделя | Тема |
|--------|------|
| 1 | Знакомство с 1С и OneScript |
| 2 | Переменные и типы данных |
| 3 | Операторы и выражения |
| 4 | Условные операторы |
| 5 | Циклы |
| 6 | Процедуры и функции |
| 7 | Массивы |
| 8 | Коллекции: Структура, Соответствие, СписокЗначений |
| 9 | ТаблицаЗначений |
| 10 | Строки и числа (углублённо) |
| 11 | Файлы, JSON и обработка ошибок |
| 12 | Алгоритмы и финальный проект |

---

## API

После запуска полная документация доступна по адресу `/docs` (Swagger UI).

Основные эндпоинты:

```
POST /api/v1/auth/register       — Регистрация
POST /api/v1/auth/login/json     — Вход
GET  /api/v1/lessons/course      — Структура курса с прогрессом
GET  /api/v1/lessons/{id}/theory — Теория урока (генерируется ИИ)
GET  /api/v1/tasks/lesson/{id}   — Задача к уроку (генерируется ИИ)
POST /api/v1/submissions/        — Отправить решение
GET  /api/v1/progress/dashboard  — Статистика и лидерборд
```

---

## Лицензия

MIT
