import asyncio
import json
import logging
import random
from typing import Optional

logger = logging.getLogger(__name__)

def _build_fallback_theory(topic: str, week_number: int, lesson_order: int) -> str:
    return f"""## {topic}

> Урок {lesson_order}, неделя {week_number}

### Введение

Эта тема является важной частью изучения языка 1С:Предприятие и OneScript.
Внимательно прочитайте материал и попробуйте примеры в редакторе.

### Основные концепции

Тема «**{topic}**» охватывает ключевые возможности языка 1С.

В OneScript реализован полный синтаксис языка 1С:Предприятие, что позволяет
изучать программирование без установки полной платформы.

### Пример кода

```1c
// Пример по теме: {topic}

// Объявление переменных
Перем Результат;

// Вывод сообщения
Сообщить("Изучаем: {topic}");

// Пример базовой конструкции
Перем Число = 42;
Сообщить("Значение: " + Строка(Число));
```

### Как работать с материалом

1. Прочитайте описание темы
2. Изучите пример кода выше
3. Перейдите на вкладку **Практика** и выполните задание
4. Используйте кнопку «Обновить теорию» для получения детального объяснения

## Ключевые моменты

- Язык 1С:Предприятие используется для автоматизации бизнес-процессов
- OneScript позволяет запускать 1С-скрипты без полной платформы
- Все примеры в курсе проверяются автоматически
- Используйте `Сообщить()` для вывода результата в консоль
- При затруднениях используйте подсказки в задании
"""

FALLBACK_MOTIVATIONS = [
    "Отличный прогресс! Вы уверенно движетесь к мастерству 1С-программирования!",
    "Каждая задача — шаг к профессионализму. Продолжайте в том же духе!",
    "Вы справились! 1С открывает огромные возможности — впереди ещё много интересного.",
    "Прекрасная работа! Ваши навыки 1С-программирования растут с каждым уроком.",
    "Так держать! Профессионалы 1С высоко ценятся на рынке труда.",
]

FALLBACK_FEEDBACK = [
    "Код написан корректно. Обратите внимание на читаемость — добавьте комментарии.",
    "Решение работает! Для улучшения попробуйте вынести повторяющийся код в процедуру.",
    "Хорошее решение. В 1С важно соблюдать соглашения об именовании переменных.",
    "Код верный. Попробуйте также обработать крайние случаи через Попытка...Исключение.",
]


async def _ask_gpt(prompt: str, timeout: float = 12.0) -> Optional[str]:
    try:
        import g4f
        from g4f.client import AsyncClient

        client = AsyncClient()
        response = await asyncio.wait_for(
            client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
            ),
            timeout=timeout,
        )
        content = response.choices[0].message.content
        if not content or not content.strip():
            return None
        return content
    except asyncio.TimeoutError:
        logger.warning(f"GPT request timed out after {timeout}s")
        return None
    except Exception as e:
        logger.warning(f"GPT request failed: {e}")
        return None


async def generate_theory(topic: str, week_number: int, lesson_order: int) -> str:
    # Глубина контента растёт с номером недели
    if week_number <= 3:
        depth = "Объясни максимально просто, с нуля, для абсолютного новичка. Объём: 350-500 слов. Приведи 2 коротких примера кода."
    elif week_number <= 6:
        depth = "Объясни концепцию подробно, предполагая знание основ синтаксиса 1С. Объём: 500-700 слов. Приведи 3 примера кода с комментариями."
    elif week_number <= 9:
        depth = "Раскрой тему глубоко, с практическими паттернами и типичными ошибками. Объём: 600-800 слов. Приведи 3-4 примера кода, включая реальный бизнес-сценарий."
    else:
        depth = "Раскрой тему на продвинутом уровне: алгоритмы, оптимизация, best practices. Объём: 700-900 слов. Приведи 4 примера кода с разбором производительности."

    prompt = f"""Ты — опытный преподаватель 1С:Предприятие и OneScript.
Напиши теоретическую статью для урока {lesson_order} недели {week_number}.
Тема: {topic}

Требования:
- Используй Markdown-форматирование (заголовки ##, ###, списки, жирный текст)
- {depth}
- Примеры кода ОБЯЗАТЕЛЬНО оборачивай в ```1c ... ``` (синтаксис OneScript/1С)
- Пиши на русском языке
- Все примеры должны быть рабочими в OneScript (использовать Сообщить() для вывода)
- В конце добавь раздел "## Ключевые моменты" с 3-5 пунктами

Тема урока: {topic}"""

    result = await _ask_gpt(prompt, timeout=20.0)
    return result or _build_fallback_theory(topic, week_number, lesson_order)


async def generate_task(topic: str, difficulty: str, week_number: int) -> dict:
    difficulty_map = {"easy": "лёгкую", "medium": "среднюю", "hard": "сложную"}
    diff_ru = difficulty_map.get(difficulty, "лёгкую")

    difficulty_details = {
        "easy": (
            "Простая задача для новичка. "
            "Требует знания только базового синтаксиса (переменные, Сообщить, простые операции). "
            "Решается в 5-15 строк. "
            "Один очевидный способ решения."
        ),
        "medium": (
            "Задача среднего уровня. "
            "Требует использования циклов, условий, коллекций или процедур/функций. "
            "Решается в 15-40 строк. "
            "Нужно продумать алгоритм."
        ),
        "hard": (
            "Сложная задача. "
            "Требует комбинирования нескольких концепций: алгоритмы, рекурсия, ТаблицаЗначений, оптимизация. "
            "Решается в 30-80 строк. "
            "Несколько способов решения, нужен эффективный."
        ),
    }
    diff_desc = difficulty_details.get(difficulty, difficulty_details["easy"])

    prompt = f"""Ты — преподаватель 1С и OneScript. Создай задачу по программированию.

Тема: {topic}
Сложность: {diff_ru} (неделя {week_number} из 12)
Описание сложности: {diff_desc}

ВАЖНЫЕ ТРЕБОВАНИЯ:
1. Задача должна решаться на языке 1С/OneScript
2. Для вывода результата использовать ТОЛЬКО Сообщить()
3. Тест-кейсы: поле "input" оставляй пустым (""), "expected_output" — точный вывод Сообщить()
4. Задача должна быть связана с реальным бизнес-контекстом 1С (склад, зарплата, клиенты и т.д.) если возможно
5. solution_template должен содержать код-заготовку с комментариями что нужно сделать

Верни ТОЛЬКО валидный JSON без markdown-обёрток:
{{
  "title": "Название задачи на русском",
  "description": "Подробное описание: задача, что нужно сделать, пример входных данных и ожидаемого вывода.",
  "hints": ["Подсказка 1", "Подсказка 2", "Подсказка 3"],
  "test_cases": [
    {{"input": "", "expected_output": "точный текст вывода Сообщить()"}},
    {{"input": "", "expected_output": "точный текст второго теста"}}
  ],
  "solution_template": "// Задание: ...\n// Ваш код:\n\n",
  "category": "1с-основы"
}}"""

    result = await _ask_gpt(prompt, timeout=20.0)
    if result:
        try:
            # Clean possible markdown code blocks
            cleaned = result.strip()
            if cleaned.startswith("```"):
                cleaned = cleaned.split("```")[1]
                if cleaned.startswith("json"):
                    cleaned = cleaned[4:]
            return json.loads(cleaned.strip())
        except Exception as e:
            logger.warning(f"Failed to parse task JSON: {e}")

    # Fallback task — specific to the topic and difficulty
    difficulty_hints = {
        "easy": [
            f"Изучите синтаксис темы «{topic}» в разделе Теория",
            "Используйте Сообщить() для вывода результата",
            "Объявляйте переменные через Перем перед использованием",
        ],
        "medium": [
            f"Вспомните ключевые конструкции из темы «{topic}»",
            "Разбейте задачу на несколько шагов и реализуйте каждый",
            "Проверьте граничные случаи перед отправкой",
        ],
        "hard": [
            f"Примените продвинутые возможности темы «{topic}»",
            "Думайте об эффективности алгоритма: можно ли сделать быстрее?",
            "Обработайте возможные исключительные ситуации через Попытка...Исключение",
        ],
    }
    return {
        "title": f"Практическое задание: {topic}",
        "description": (
            f"Напишите программу на языке 1С/OneScript по теме «{topic}».\n\n"
            f"**Сложность:** {difficulty}\n\n"
            "**Задание:** Используя знания из текущего урока, создайте программу, "
            "которая демонстрирует работу с данной темой. "
            "Программа должна вывести результат через `Сообщить()`.\n\n"
            "**Ожидаемый вывод:** программа должна запуститься без ошибок "
            "и вывести осмысленный результат."
        ),
        "hints": difficulty_hints.get(difficulty, difficulty_hints["easy"]),
        "test_cases": [
            {"input": "", "expected_output": ""},
        ],
        "solution_template": (
            f"// Задание по теме: {topic}\n"
            "// Напишите ваш код ниже\n\n"
            "// Объявите нужные переменные\n"
            "Перем Результат;\n\n"
            "// Ваша логика здесь\n\n"
            "// Выведите результат\n"
            "Сообщить(Результат);\n"
        ),
        "category": "1с-основы",
    }


async def analyze_code(code: str, task_description: str, is_correct: bool) -> tuple[str, int]:
    verdict = "верное" if is_correct else "неверное"
    prompt = f"""Ты — ментор по 1С и OneScript. Проанализируй код студента.

Задание: {task_description[:300]}
Результат: {verdict} решение

Код студента:
```1c
{code[:1500]}
```

Дай краткую обратную связь (3-5 предложений на русском):
1. Что хорошо сделано
2. Что можно улучшить (стиль, эффективность, обработка ошибок)
3. Оценка от 0 до 100

Верни ТОЛЬКО JSON:
{{"feedback": "текст обратной связи", "score": 85}}"""

    result = await _ask_gpt(prompt, timeout=15.0)
    if result:
        try:
            cleaned = result.strip()
            if cleaned.startswith("```"):
                cleaned = cleaned.split("```")[1]
                if cleaned.startswith("json"):
                    cleaned = cleaned[4:]
            data = json.loads(cleaned.strip())
            return data.get("feedback", random.choice(FALLBACK_FEEDBACK)), data.get("score", 70)
        except Exception:
            pass

    score = random.randint(70, 95) if is_correct else random.randint(20, 50)
    return random.choice(FALLBACK_FEEDBACK), score


async def generate_motivation(username: str, xp: int, level: int) -> str:
    prompt = f"""Напиши мотивирующее сообщение для студента, изучающего 1С.
Имя: {username}, XP: {xp}, Уровень: {level}
Одно предложение, вдохновляющее, на русском языке."""

    result = await _ask_gpt(prompt, timeout=8.0)
    return result or random.choice(FALLBACK_MOTIVATIONS)
