"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useAuthStore } from "@/lib/store";
import { lessons, tasks } from "@/lib/api";
import Navbar from "@/components/ui/Navbar";
import CodeEditor from "@/components/editor/CodeEditor";
import toast from "react-hot-toast";
import { BookOpen, Code2, RefreshCw, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

type Tab = "theory" | "practice";

interface LessonData {
  id: number;
  title: string;
  topic: string;
  theory_content: string;
  week_number: number;
}

interface TaskData {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  hints: string[];
  solution_template: string | null;
  test_cases: Array<{ input: string; expected_output: string }>;
  time_limit_ms: number;
}

export default function LessonPage() {
  const router = useRouter();
  const params = useParams();
  const lessonId = Number(params.id);
  const { token } = useAuthStore();

  const [tab, setTab] = useState<Tab>("theory");
  const [lessonData, setLessonData] = useState<LessonData | null>(null);
  const [taskData, setTaskData] = useState<TaskData | null>(null);
  const [theoryLoading, setTheoryLoading] = useState(true);
  const [taskLoading, setTaskLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    if (!token) { router.push("/auth"); return; }
    if (lessonId) loadTheory();
  }, [token, lessonId]);

  const loadTheory = async (regen = false) => {
    regen ? setRegenerating(true) : setTheoryLoading(true);
    try {
      const { data } = await lessons.getTheory(lessonId, regen);
      setLessonData(data);
    } catch {
      toast.error("Ошибка загрузки теории");
    } finally {
      setTheoryLoading(false);
      setRegenerating(false);
    }
  };

  const loadTask = async () => {
    if (taskData) return;
    setTaskLoading(true);
    try {
      const { data } = await tasks.getLessonTask(lessonId);
      setTaskData(data);
    } catch {
      toast.error("Ошибка загрузки задачи");
    } finally {
      setTaskLoading(false);
    }
  };

  const handleTabChange = (t: Tab) => {
    setTab(t);
    if (t === "practice" && !taskData) loadTask();
  };

  const handleTaskRegenerate = async () => {
    if (!lessonData) return;
    setTaskLoading(true);
    setTaskData(null);
    try {
      const { data } = await tasks.generate({
        topic: lessonData.topic,
        difficulty: "easy",
        lesson_id: lessonId,
      });
      setTaskData(data);
      toast.success("Новая задача сгенерирована!");
    } catch {
      toast.error("Ошибка генерации задачи");
    } finally {
      setTaskLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cyber-black">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Back */}
        <Link
          href="/lessons"
          className="inline-flex items-center gap-2 text-xs font-mono text-gray-500 hover:text-gray-300 transition-colors mb-6"
        >
          <ArrowLeft size={12} /> Назад к урокам
        </Link>

        {/* Title */}
        {lessonData && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
            <h1 className="font-display font-bold text-xl" style={{ color: "var(--neon-orange)" }}>
              {lessonData.title}
            </h1>
            <p className="text-xs font-mono text-gray-500 mt-1">Неделя {lessonData.week_number} · {lessonData.topic}</p>
          </motion.div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--cyber-border)" }}>
          {(["theory", "practice"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => handleTabChange(t)}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-mono transition-all"
              style={
                tab === t
                  ? {
                      background: "rgba(255,136,0,0.15)",
                      color: "var(--neon-orange)",
                      border: "1px solid rgba(255,136,0,0.3)",
                    }
                  : { color: "#666" }
              }
            >
              {t === "theory" ? <BookOpen size={14} /> : <Code2 size={14} />}
              {t === "theory" ? "Теория" : "Практика"}
            </button>
          ))}
        </div>

        {/* Theory Tab */}
        {tab === "theory" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {theoryLoading ? (
              <div className="cyber-card p-8 text-center">
                <div className="font-mono text-gray-400 animate-pulse text-sm">
                  ИИ генерирует теорию для вас...
                </div>
                <div className="text-xs text-gray-600 mt-2 font-mono">
                  Это может занять до 30 секунд
                </div>
              </div>
            ) : lessonData?.theory_content ? (
              <div className="cyber-card p-6">
                <div className="flex items-center justify-end mb-4">
                  <button
                    onClick={() => loadTheory(true)}
                    disabled={regenerating}
                    className="btn-secondary flex items-center gap-2 px-3 py-1.5 text-xs"
                  >
                    <RefreshCw size={12} className={regenerating ? "animate-spin" : ""} />
                    {regenerating ? "Генерация..." : "Обновить теорию"}
                  </button>
                </div>
                <div className="markdown-content">
                  <ReactMarkdown
                    components={{
                      code({ className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || "");
                        const isBlock = !!(props as { node?: unknown } & typeof props).node;
                        return match ? (
                          <SyntaxHighlighter
                            style={oneDark as Record<string, React.CSSProperties>}
                            language={match[1] === "1c" ? "javascript" : match[1]}
                            PreTag="div"
                          >
                            {String(children).replace(/\n$/, "")}
                          </SyntaxHighlighter>
                        ) : (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        );
                      },
                    }}
                  >
                    {lessonData.theory_content}
                  </ReactMarkdown>
                </div>

                {/* Go to practice */}
                <div className="mt-8 pt-4 border-t border-cyber-border flex justify-end">
                  <button
                    onClick={() => handleTabChange("practice")}
                    className="btn-neon flex items-center gap-2 px-5 py-2.5 text-sm"
                  >
                    <Code2 size={14} /> Перейти к практике
                  </button>
                </div>
              </div>
            ) : (
              <div className="cyber-card p-8 text-center text-gray-500 font-mono text-sm">
                Теория не найдена
              </div>
            )}
          </motion.div>
        )}

        {/* Practice Tab */}
        {tab === "practice" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {taskLoading ? (
              <div className="cyber-card p-8 text-center">
                <div className="font-mono text-gray-400 animate-pulse text-sm">
                  ИИ генерирует задачу по теме урока...
                </div>
              </div>
            ) : taskData ? (
              <CodeEditor
                task={taskData}
                lessonId={lessonId}
                onTaskRegenerate={handleTaskRegenerate}
              />
            ) : (
              <div className="cyber-card p-8 text-center">
                <div className="text-gray-500 font-mono text-sm mb-4">Задача не загружена</div>
                <button onClick={loadTask} className="btn-neon px-4 py-2 text-sm">
                  Загрузить задачу
                </button>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
