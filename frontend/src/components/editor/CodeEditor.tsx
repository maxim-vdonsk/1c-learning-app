"use client";
import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { submissions, tasks } from "@/lib/api";
import SubmissionResultComponent from "./SubmissionResult";
import toast from "react-hot-toast";
import { Play, Lightbulb, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface Task {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  hints: string[];
  solution_template: string | null;
  test_cases: Array<{ input: string; expected_output: string }>;
  time_limit_ms: number;
}

interface Props {
  task: Task;
  lessonId?: number;
  onTaskRegenerate?: () => void;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "var(--neon-green)",
  medium: "var(--neon-orange)",
  hard: "var(--neon-red)",
};

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: "Лёгкая",
  medium: "Средняя",
  hard: "Сложная",
};

// 1C/OneScript language definition for Monaco
const ONEC_KEYWORDS = [
  "Процедура", "КонецПроцедуры", "Функция", "КонецФункции",
  "Если", "Тогда", "ИначеЕсли", "Иначе", "КонецЕсли",
  "Пока", "Для", "Каждого", "Из", "По", "Цикл", "КонецЦикла",
  "Перем", "Возврат", "Прервать", "Продолжить",
  "Новый", "Попытка", "Исключение", "КонецПопытки",
  "Выбор", "Когда", "КонецВыбора",
  "Истина", "Ложь", "Неопределено", "Null",
  "И", "ИЛИ", "НЕ", "Экспорт", "Знач",
  "ВызватьИсключение",
];

const ONEC_BUILTIN = [
  "Сообщить", "Предупреждение", "ОписаниеОшибки",
  "Строка", "Число", "Булево", "Дата", "ТипЗнч", "Тип",
  "Лев", "Прав", "Сред", "СтрДлина", "Найти", "СтрЗаменить",
  "СтрНайти", "СтрРазделить", "СтрСоединить", "СтрСодержит",
  "СтрНачинаетсяС", "СтрЗаканчиваетсяНа", "ВРег", "НРег",
  "Формат", "ТекущаяДата", "Год", "Месяц", "День",
  "Час", "Минута", "Секунда", "ДобавитьМесяц", "НачалоПериода",
  "КонецПериода", "РазностьДат",
  "Окр", "Цел", "Abs", "Макс", "Мин", "Случайное",
  "КаталогВременныхФайлов", "КаталогДокументов",
  "ЗаписатьJSON", "ПрочитатьJSON",
];

export default function CodeEditor({ task, lessonId, onTaskRegenerate }: Props) {
  const [code, setCode] = useState(
    task.solution_template ||
      "// Напишите ваш код на языке 1С/OneScript\n\n"
  );
  const [result, setResult] = useState<null | object>(null);
  const [loading, setLoading] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [hintIndex, setHintIndex] = useState(0);
  const [showDesc, setShowDesc] = useState(true);

  // Reset when task changes
  useEffect(() => {
    setCode(task.solution_template || "// Напишите ваш код на языке 1С/OneScript\n\n");
    setResult(null);
    setHintIndex(0);
    setShowHints(false);
  }, [task.id]);

  const handleSubmit = async () => {
    if (!code.trim()) { toast.error("Введите код!"); return; }
    setLoading(true);
    setResult(null);
    try {
      const { data } = await submissions.submit({ task_id: task.id, code });
      setResult(data);
      if (data.is_correct) toast.success("Верно! Отличная работа!");
      else toast.error("Не совсем... Попробуйте ещё раз");
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Ошибка отправки";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const showNextHint = () => {
    if (!showHints) { setShowHints(true); return; }
    if (hintIndex < task.hints.length - 1) setHintIndex(hintIndex + 1);
  };

  const beforeMount = (monaco: unknown) => {
    const m = monaco as {
      languages: {
        register: (opts: { id: string }) => void;
        setMonarchTokensProvider: (id: string, tokens: object) => void;
        registerCompletionItemProvider: (id: string, provider: object) => void;
        CompletionItemKind: { Keyword: number; Function: number };
      };
    };
    m.languages.register({ id: "onescript" });
    m.languages.setMonarchTokensProvider("onescript", {
      keywords: ONEC_KEYWORDS,
      builtins: ONEC_BUILTIN,
      tokenizer: {
        root: [
          [/\/\/.*$/, "comment"],
          [/"[^"]*"/, "string"],
          [/'[^']*'/, "string"],
          [/\d+\.?\d*/, "number"],
          [
            /[а-яА-ЯёЁa-zA-Z_][а-яА-ЯёЁa-zA-Z0-9_]*/,
            {
              cases: {
                "@keywords": "keyword",
                "@builtins": "predefined",
                "@default": "identifier",
              },
            },
          ],
          [/[;,\.]/, "delimiter"],
          [/[()[\]{}]/, "bracket"],
        ],
      },
    });
    m.languages.registerCompletionItemProvider("onescript", {
      provideCompletionItems: () => ({
        suggestions: [
          ...ONEC_KEYWORDS.map((k) => ({
            label: k,
            kind: m.languages.CompletionItemKind.Keyword,
            insertText: k,
          })),
          ...ONEC_BUILTIN.map((b) => ({
            label: b,
            kind: m.languages.CompletionItemKind.Function,
            insertText: b,
          })),
        ],
      }),
    });
  };

  return (
    <div className="space-y-4">
      {/* Task description */}
      <div className="cyber-card overflow-hidden">
        <button
          onClick={() => setShowDesc(!showDesc)}
          className="w-full flex items-center justify-between p-4 hover:bg-white hover:bg-opacity-5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span
              className="text-xs font-mono px-2 py-0.5 rounded"
              style={{
                background: `rgba(${task.difficulty === "easy" ? "0,255,136" : task.difficulty === "medium" ? "255,136,0" : "255,34,0"},0.1)`,
                border: `1px solid rgba(${task.difficulty === "easy" ? "0,255,136" : task.difficulty === "medium" ? "255,136,0" : "255,34,0"},0.3)`,
                color: DIFFICULTY_COLORS[task.difficulty],
              }}
            >
              {DIFFICULTY_LABELS[task.difficulty]}
            </span>
            <h3 className="font-mono font-bold text-sm text-white">{task.title}</h3>
          </div>
          {showDesc ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
        </button>
        {showDesc && (
          <div className="px-4 pb-4 text-sm font-mono text-gray-300 leading-relaxed whitespace-pre-line border-t border-cyber-border pt-3">
            {task.description}
          </div>
        )}
      </div>

      {/* Monaco Editor */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: "1px solid var(--cyber-border)" }}
      >
        <div
          className="flex items-center justify-between px-3 py-2"
          style={{
            background: "rgba(255,255,255,0.02)",
            borderBottom: "1px solid var(--cyber-border)",
          }}
        >
          <span className="text-xs font-mono text-gray-500">1С / OneScript</span>
          <button
            onClick={() => setCode(task.solution_template || "")}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            <RotateCcw size={11} /> Сбросить
          </button>
        </div>
        <MonacoEditor
          height={typeof window !== "undefined" && window.innerWidth < 640 ? "260px" : "320px"}
          language="onescript"
          value={code}
          onChange={(v) => setCode(v || "")}
          beforeMount={beforeMount}
          theme="vs-dark"
          options={{
            fontSize: typeof window !== "undefined" && window.innerWidth < 640 ? 13 : 14,
            fontFamily: "JetBrains Mono, Fira Code, monospace",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            lineNumbers: "on",
            roundedSelection: true,
            padding: { top: 12, bottom: 12 },
            suggest: { showKeywords: true },
            wordWrap: "on",
          }}
        />
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-2">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="btn-neon flex-1 flex items-center justify-center gap-2 py-3 sm:py-2.5 text-sm"
        >
          <Play size={14} />
          {loading ? "Выполняется..." : "Запустить и проверить"}
        </button>

        {task.hints.length > 0 && (
          <button
            onClick={showNextHint}
            className="btn-secondary flex items-center justify-center gap-2 px-4 py-3 sm:py-2.5 text-sm"
            style={showHints ? { borderColor: "var(--neon-orange)", color: "var(--neon-orange)" } : {}}
          >
            <Lightbulb size={14} />
            {showHints ? `Подсказка ${hintIndex + 1}/${task.hints.length}` : "Подсказка"}
          </button>
        )}
      </div>

      {/* Hints */}
      {showHints && task.hints[hintIndex] && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-lg text-sm font-mono text-gray-300"
          style={{
            background: "rgba(255,136,0,0.05)",
            border: "1px solid rgba(255,136,0,0.2)",
          }}
        >
          <span style={{ color: "var(--neon-orange)" }}>💡 </span>
          {task.hints[hintIndex]}
        </motion.div>
      )}

      {/* Result */}
      {result && (
        <SubmissionResultComponent
          result={result as Parameters<typeof SubmissionResultComponent>[0]["result"]}
          onNewTask={onTaskRegenerate}
        />
      )}
    </div>
  );
}
