"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuthStore } from "@/lib/store";
import { tasks as tasksApi } from "@/lib/api";
import Navbar from "@/components/ui/Navbar";
import CodeEditor from "@/components/editor/CodeEditor";
import toast from "react-hot-toast";
import { Code2, Search, Filter, Plus, RefreshCw } from "lucide-react";

interface Task {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  category: string;
  hints: string[];
  solution_template: string | null;
  test_cases: Array<{ input: string; expected_output: string }>;
  time_limit_ms: number;
}

const DIFFICULTIES = ["", "easy", "medium", "hard"];
const DIFFICULTY_LABELS: Record<string, string> = {
  "": "Все",
  easy: "Лёгкие",
  medium: "Средние",
  hard: "Сложные",
};
const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "var(--neon-green)",
  medium: "var(--neon-orange)",
  hard: "var(--neon-red)",
};

const ONEC_TOPICS = [
  "Переменные и типы данных",
  "Условные операторы",
  "Циклы",
  "Процедуры и функции",
  "Массивы",
  "Структура и Соответствие",
  "ТаблицаЗначений",
  "Строки",
  "Даты и числа",
  "Алгоритмы",
];

export default function TasksPage() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [taskList, setTaskList] = useState<Task[]>([]);
  const [selected, setSelected] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [genTopic, setGenTopic] = useState(ONEC_TOPICS[0]);
  const [genDiff, setGenDiff] = useState("easy");
  const [showGenPanel, setShowGenPanel] = useState(false);
  const [mobileTab, setMobileTab] = useState<"list" | "editor">("list");

  useEffect(() => {
    if (!token) { router.push("/auth"); return; }
    loadTasks();
  }, [token, difficulty]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { limit: 50 };
      if (difficulty) params.difficulty = difficulty;
      if (search) params.search = search;
      const { data } = await tasksApi.list(params);
      setTaskList(data);
      if (data.length > 0 && !selected) setSelected(data[0]);
    } catch {
      toast.error("Ошибка загрузки задач");
    } finally {
      setLoading(false);
    }
  };

  const generateTask = async () => {
    setGenerating(true);
    try {
      const { data } = await tasksApi.generate({ topic: genTopic, difficulty: genDiff });
      setTaskList((prev) => [data, ...prev]);
      setSelected(data);
      setShowGenPanel(false);
      toast.success("Задача сгенерирована!");
    } catch {
      toast.error("Ошибка генерации задачи");
    } finally {
      setGenerating(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadTasks();
  };

  const handleSelectTask = (t: Task) => {
    setSelected(t);
    setMobileTab("editor");
  };

  return (
    <div className="min-h-screen bg-cyber-black">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Code2 size={20} style={{ color: "var(--neon-green)" }} />
              <h1 className="font-display font-bold text-xl" style={{ color: "var(--neon-green)" }}>
                ЗАДАЧИ
              </h1>
            </div>
            <p className="text-xs font-mono text-gray-500 mt-1">
              Практика программирования на 1С/OneScript
            </p>
          </div>
          <button
            onClick={() => setShowGenPanel(!showGenPanel)}
            className="btn-neon flex items-center gap-2 px-3 py-2 text-xs flex-shrink-0"
          >
            <Plus size={14} />
            <span className="hidden sm:inline">Сгенерировать задачу</span>
            <span className="sm:hidden">Задача</span>
          </button>
        </div>

        {/* Generate panel */}
        {showGenPanel && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="cyber-card p-4 mb-6"
          >
            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-mono text-gray-400 mb-1 block">Тема</label>
                <select
                  value={genTopic}
                  onChange={(e) => setGenTopic(e.target.value)}
                  className="cyber-input w-full px-3 py-2 text-sm"
                >
                  {ONEC_TOPICS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-mono text-gray-400 mb-1 block">Сложность</label>
                <select
                  value={genDiff}
                  onChange={(e) => setGenDiff(e.target.value)}
                  className="cyber-input w-full px-3 py-2 text-sm"
                >
                  <option value="easy">Лёгкая</option>
                  <option value="medium">Средняя</option>
                  <option value="hard">Сложная</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={generateTask}
                  disabled={generating}
                  className="btn-neon w-full py-2 text-sm flex items-center justify-center gap-2"
                >
                  {generating ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
                  {generating ? "Генерация..." : "Создать"}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Mobile tabs */}
        <div className="flex lg:hidden gap-1 mb-4 p-1 rounded-lg" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--cyber-border)" }}>
          <button
            onClick={() => setMobileTab("list")}
            className="flex-1 py-2 rounded text-xs font-mono transition-all"
            style={
              mobileTab === "list"
                ? { background: "rgba(255,136,0,0.15)", color: "var(--neon-orange)", border: "1px solid rgba(255,136,0,0.3)" }
                : { color: "#666", border: "1px solid transparent" }
            }
          >
            Список задач
          </button>
          <button
            onClick={() => setMobileTab("editor")}
            className="flex-1 py-2 rounded text-xs font-mono transition-all"
            style={
              mobileTab === "editor"
                ? { background: "rgba(255,136,0,0.15)", color: "var(--neon-orange)", border: "1px solid rgba(255,136,0,0.3)" }
                : { color: "#666", border: "1px solid transparent" }
            }
          >
            {selected ? selected.title.length > 20 ? selected.title.slice(0, 20) + "…" : selected.title : "Редактор"}
          </button>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Left: task list */}
          <div className={`lg:col-span-2 space-y-3 ${mobileTab === "editor" ? "hidden lg:block" : ""}`}>
            {/* Filters */}
            <div className="space-y-2">
              <form onSubmit={handleSearch} className="flex gap-2">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Поиск задач..."
                  className="cyber-input flex-1 px-3 py-2 text-sm font-mono"
                />
                <button type="submit" className="btn-secondary px-3 py-2">
                  <Search size={14} />
                </button>
              </form>
              <div className="flex gap-1">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className="flex-1 py-1.5 rounded text-xs font-mono transition-all"
                    style={
                      difficulty === d
                        ? {
                            background: d
                              ? `rgba(${d === "easy" ? "0,255,136" : d === "medium" ? "255,136,0" : "255,34,0"},0.15)`
                              : "rgba(255,255,255,0.08)",
                            color: d ? DIFFICULTY_COLORS[d] : "white",
                            border: `1px solid ${d ? DIFFICULTY_COLORS[d] : "rgba(255,255,255,0.2)"}`,
                          }
                        : { color: "#666", border: "1px solid transparent" }
                    }
                  >
                    {DIFFICULTY_LABELS[d]}
                  </button>
                ))}
              </div>
            </div>

            {/* Task list */}
            <div className="space-y-1 max-h-[calc(100vh-300px)] overflow-y-auto pr-1">
              {loading ? (
                <div className="text-xs font-mono text-gray-500 text-center py-8 animate-pulse">
                  Загрузка...
                </div>
              ) : taskList.length === 0 ? (
                <div className="text-xs font-mono text-gray-500 text-center py-8">
                  Задач не найдено
                </div>
              ) : (
                taskList.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleSelectTask(t)}
                    className="w-full text-left p-3 rounded-lg transition-all"
                    style={
                      selected?.id === t.id
                        ? {
                            background: "rgba(255,136,0,0.08)",
                            border: "1px solid rgba(255,136,0,0.25)",
                          }
                        : {
                            background: "rgba(255,255,255,0.02)",
                            border: "1px solid transparent",
                          }
                    }
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className="text-xs font-mono"
                        style={{ color: DIFFICULTY_COLORS[t.difficulty] }}
                      >
                        {DIFFICULTY_LABELS[t.difficulty]}
                      </span>
                      <span className="text-[10px] font-mono text-gray-600">{t.category}</span>
                    </div>
                    <div className="text-sm font-mono text-white truncate">{t.title}</div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right: editor */}
          <div className={`lg:col-span-3 ${mobileTab === "list" ? "hidden lg:block" : ""}`}>
            {selected ? (
              <CodeEditor task={selected} />
            ) : (
              <div className="cyber-card p-12 text-center">
                <Code2 size={40} className="mx-auto mb-4 text-gray-600" />
                <p className="text-gray-500 font-mono text-sm">
                  Выберите задачу из списка или сгенерируйте новую
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
