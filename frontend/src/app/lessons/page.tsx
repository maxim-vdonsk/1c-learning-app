"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/lib/store";
import { lessons } from "@/lib/api";
import Navbar from "@/components/ui/Navbar";
import toast from "react-hot-toast";
import { ChevronDown, ChevronRight, CheckCircle, Circle, BookOpen, Lock } from "lucide-react";

interface Lesson {
  id: number;
  title: string;
  slug: string;
  description: string;
  topic: string;
  order: number;
  is_completed: boolean;
  theory_read: boolean;
}

interface Week {
  id: number;
  number: number;
  title: string;
  description: string;
  lessons: Lesson[];
  lessons_completed: number;
  total_lessons: number;
}

interface Course {
  weeks: Week[];
  total_lessons: number;
  completed_lessons: number;
  progress_percent: number;
}

export default function LessonsPage() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [openWeeks, setOpenWeeks] = useState<Set<number>>(new Set([1]));

  useEffect(() => {
    if (!token) { router.push("/auth"); return; }
    loadCourse();
  }, [token]);

  const loadCourse = async () => {
    try {
      const { data } = await lessons.getCourse();
      setCourse(data);
      // Auto-open first incomplete week
      const firstIncomplete = data.weeks.find(
        (w: Week) => w.lessons_completed < w.total_lessons
      );
      if (firstIncomplete) setOpenWeeks(new Set([firstIncomplete.number]));
    } catch {
      toast.error("Ошибка загрузки курса");
    } finally {
      setLoading(false);
    }
  };

  const toggleWeek = (num: number) => {
    const next = new Set(openWeeks);
    if (next.has(num)) next.delete(num);
    else next.add(num);
    setOpenWeeks(next);
  };

  if (loading || !course) {
    return (
      <div className="min-h-screen bg-cyber-black flex items-center justify-center">
        <div className="font-mono text-gray-400 animate-pulse">Загрузка курса...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cyber-black">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen size={24} style={{ color: "var(--neon-orange)" }} />
            <h1 className="font-display font-bold text-2xl" style={{ color: "var(--neon-orange)" }}>
              УЧЕБНЫЙ ПЛАН
            </h1>
          </div>
          <p className="text-gray-400 text-sm font-mono">
            12 недель · {course.total_lessons} уроков · Язык 1С:Предприятие & OneScript
          </p>

          {/* Overall progress */}
          {course.total_lessons > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-xs font-mono text-gray-400 mb-2">
                <span>Общий прогресс</span>
                <span style={{ color: "var(--neon-orange)" }}>
                  {course.completed_lessons} / {course.total_lessons} ({course.progress_percent}%)
                </span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${course.progress_percent}%` }} />
              </div>
            </div>
          )}

          {course.total_lessons === 0 && (
            <div className="mt-4 p-4 rounded-lg text-sm font-mono text-gray-400 border border-dashed border-cyber-border">
              Курс не инициализирован. Перейдите на{" "}
              <Link href="/dashboard" className="underline" style={{ color: "var(--neon-red)" }}>
                главную страницу
              </Link>{" "}
              для инициализации курса.
            </div>
          )}
        </motion.div>

        {/* Weeks */}
        <div className="space-y-3">
          {course.weeks.map((week, wi) => {
            const isOpen = openWeeks.has(week.number);
            const weekComplete = week.lessons_completed === week.total_lessons && week.total_lessons > 0;
            const weekPct = week.total_lessons > 0
              ? (week.lessons_completed / week.total_lessons) * 100
              : 0;

            return (
              <motion.div
                key={week.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: wi * 0.05 }}
                className="cyber-card overflow-hidden"
              >
                {/* Week header */}
                <button
                  onClick={() => toggleWeek(week.number)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-white hover:bg-opacity-5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex items-center justify-center w-8 h-8 rounded-full text-xs font-display font-bold"
                      style={{
                        background: weekComplete
                          ? "rgba(0,255,136,0.15)"
                          : "rgba(255,34,0,0.15)",
                        border: `1px solid ${weekComplete ? "rgba(0,255,136,0.4)" : "rgba(255,34,0,0.3)"}`,
                        color: weekComplete ? "var(--neon-green)" : "var(--neon-red)",
                      }}
                    >
                      {week.number}
                    </div>
                    <div>
                      <div className="font-mono font-medium text-sm text-white">
                        {week.title}
                      </div>
                      <div className="text-xs text-gray-500 font-mono mt-0.5">
                        {week.lessons_completed}/{week.total_lessons} уроков
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center gap-2">
                      <div
                        className="h-1 w-20 rounded-full"
                        style={{ background: "var(--cyber-border)" }}
                      >
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${weekPct}%`,
                            background: weekComplete
                              ? "var(--neon-green)"
                              : "linear-gradient(90deg, var(--neon-red), var(--neon-orange))",
                          }}
                        />
                      </div>
                      <span className="text-xs font-mono text-gray-500">
                        {Math.round(weekPct)}%
                      </span>
                    </div>
                    {isOpen ? (
                      <ChevronDown size={16} className="text-gray-400" />
                    ) : (
                      <ChevronRight size={16} className="text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Lessons */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ borderTop: "1px solid var(--cyber-border)" }}
                    >
                      <div className="p-2">
                        {week.lessons.length === 0 ? (
                          <div className="px-4 py-3 text-xs font-mono text-gray-500">
                            Уроки загружаются...
                          </div>
                        ) : (
                          week.lessons.map((lesson, li) => (
                            <Link
                              key={lesson.id}
                              href={`/lessons/${lesson.id}`}
                              className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all hover:bg-white hover:bg-opacity-5 group"
                            >
                              <div className="flex-shrink-0">
                                {lesson.is_completed ? (
                                  <CheckCircle size={16} style={{ color: "var(--neon-green)" }} />
                                ) : (
                                  <Circle size={16} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div
                                  className="text-sm font-mono truncate transition-colors"
                                  style={lesson.is_completed ? { color: "var(--neon-green)" } : {}}
                                >
                                  <span className="text-gray-500 mr-2">
                                    {week.number}.{lesson.order}
                                  </span>
                                  {lesson.title}
                                </div>
                                {lesson.description && (
                                  <div className="text-xs text-gray-500 truncate mt-0.5">
                                    {lesson.description}
                                  </div>
                                )}
                              </div>
                              {lesson.theory_read && !lesson.is_completed && (
                                <span className="text-xs font-mono text-gray-600 flex-shrink-0">
                                  читал
                                </span>
                              )}
                            </Link>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
