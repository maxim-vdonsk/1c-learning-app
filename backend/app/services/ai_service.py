import asyncio
import json
import logging
import random
from typing import Optional

logger = logging.getLogger(__name__)

FALLBACK_THEORY = """
## Тема урока

Этот урок посвящён изучению языка программирования 1С.

### Основные концепции

Язык 1С:Предприятие — мощный инструмент для автоматизации бизнес-процессов.
В OneScript реализован основной синтаксис языка 1С, что позволяет изучать
программирование без установки полной платформы.

### Пример кода

```1c
// Простой пример на языке 1С
Сообщить("Привет, мир!");

Перем Число = 42;
Сообщить("Число: " + Строка(Число));
```

### Практика

Попробуйте написать свою первую программу и выполните задание в разделе «Практика».
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


async def _ask_gpt(prompt: str, timeout: float = 30.0) -> Optional[str]:
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
        return response.choices[0].message.content
    except Exception as e:
        logger.warning(f"GPT request failed: {e}")
        return None


async def generate_theory(topic: str, week_number: int, lesson_order: int) -> str:
    prompt = f"""Ты — опытный преподаватель 1С:Предприятие и OneScript.
Напиши подробную теоретическую статью для урока {lesson_order} недели {week_number}.
Тема: {topic}

Требования к статье:
- Используй Markdown-форматирование
- Объясни концепцию простым языком с нуля
- Приведи 2-3 практических примера кода на языке 1С/OneScript
- Примеры кода оборачивай в ```1c ... ```
- Объём: 400-600 слов
- Пиши на русском языке
- Включи раздел "Ключевые моменты" в конце

Тема урока: {topic}"""

    result = await _ask_gpt(prompt, timeout=45.0)
    return result or FALLBACK_THEORY.replace("Тема урока", f"Тема урока: {topic}")


async def generate_task(topic: str, difficulty: str, week_number: int) -> dict:
    difficulty_map = {"easy": "лёгкую", "medium": "среднюю", "hard": "сложную"}
    diff_ru = difficulty_map.get(difficulty, "лёгкую")

    prompt = f"""Ты — преподаватель 1С и OneScript. Создай задачу по программированию.

Тема: {topic}
Сложность: {diff_ru} (неделя {week_number})

Верни ТОЛЬКО валидный JSON без markdown-обёрток:
{{
  "title": "Название задачи на русском",
  "description": "Подробное описание задачи. Что нужно сделать, входные данные, ожидаемый результат.",
  "hints": ["Подсказка 1", "Подсказка 2", "Подсказка 3"],
  "test_cases": [
    {{"input": "входные данные 1", "expected_output": "ожидаемый вывод 1"}},
    {{"input": "входные данные 2", "expected_output": "ожидаемый вывод 2"}},
    {{"input": "входные данные 3", "expected_output": "ожидаемый вывод 3"}}
  ],
  "solution_template": "// Напишите здесь ваш код на языке 1С\\n\\n",
  "category": "1с-основы"
}}

Важно: тест-кейсы должны проверять вывод через Сообщить() в OneScript."""

    result = await _ask_gpt(prompt, timeout=45.0)
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

    # Fallback task
    return {
        "title": f"Задача по теме: {topic}",
        "description": (
            f"Напишите программу на языке 1С/OneScript по теме «{topic}».\n\n"
            "Программа должна вывести результат через Сообщить()."
        ),
        "hints": [
            "Используйте Сообщить() для вывода результата",
            "Объявляйте переменные через Перем",
            "Проверьте синтаксис перед отправкой",
        ],
        "test_cases": [
            {"input": "", "expected_output": "Привет, мир!"},
        ],
        "solution_template": "// Напишите ваш код здесь\n\nСообщить(\"Привет, мир!\");\n",
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

    result = await _ask_gpt(prompt, timeout=30.0)
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

    result = await _ask_gpt(prompt, timeout=15.0)
    return result or random.choice(FALLBACK_MOTIVATIONS)
