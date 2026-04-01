"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuthStore } from "@/lib/store";
import { progress, achievements, lessons } from "@/lib/api";
import Navbar from "@/components/ui/Navbar";
import toast from "react-hot-toast";
import {
  Flame, Zap, Trophy, Star, BookOpen, Code2,
  TrendingUp, Crown, Medal
} from "lucide-react";

interface Dashboard {
  username: string;
  xp_points: number;
  level: number;
  streak_days: number;
  rating: number;
  lessons_completed: number;
  total_lessons: number;
  progress_percent: number;
  submissions_count: number;
  correct_submissions: number;
  leaderboard: Array<{
    rank: number;
    username: string;
    xp_points: number;
    level: number;
    streak_days: number;
    is_current_user: boolean;
  }>;
}

interface Achievement {
  id: number;
  achievement: {
    title: string;
    description: string;
    icon: string;
    xp_reward: number;
  };
  earned_at: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { token, user, updateUser } = useAuthStore();
  const [data, setData] = useState<Dashboard | null>(null);
  const [myAchievements, setMyAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { router.push("/auth"); return; }
    loadData();
  }, [token]);

  const loadData = async () => {
    try {
      const [dashRes, achRes] = await Promise.all([
        progress.dashboard(),
        achievements.mine(),
      ]);
      setData(dashRes.data);
      setMyAchievements(achRes.data);
      if (dashRes.data) {
        updateUser({
          xp_points: dashRes.data.xp_points,
          level: dashRes.data.level,
          streak_days: dashRes.data.streak_days,
        });
      }
    } catch {
      toast.error("Ошибка загрузки данных");
    } finally {
      setLoading(false);
    }
  };

  const initCourse = async () => {
    try {
      const res = await lessons.initialize();
      toast.success(res.data.message);
    } catch {
      toast.error("Ошибка инициализации курса");
    }
  };

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-cyber-black flex items-center justify-center">
        <div className="font-mono text-gray-400 animate-pulse">Загрузка...</div>
      </div>
    );
  }

  const stats = [
    {
      icon: <Flame size={20} style={{ color: "var(--neon-red)" }} />,
      label: "Серия дней",
      value: `${data.streak_days} 🔥`,
      glow: "glow-red",
    },
    {
      icon: <Zap size={20} style={{ color: "var(--neon-orange)" }} />,
      label: "Очки опыта",
      value: `${data.xp_points} XP`,
      glow: "glow-orange",
    },
    {
      icon: <Star size={20} style={{ color: "var(--neon-yellow)" }} />,
      label: "Уровень",
      value: data.level,
      glow: "",
    },
    {
      icon: <Trophy size={20} style={{ color: "#cc44ff" }} />,
      label: "Рейтинг",
      value: data.rating.toFixed(0),
      glow: "",
    },
  ];

  return (
    <div className="min-h-screen bg-cyber-black">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-display font-bold text-2xl" style={{ color: "var(--neon-red)" }}>
            Привет, {data.username}! 👋
          </h1>
          <p className="text-gray-400 text-sm font-mono mt-1">
            Уровень {data.level} • {data.xp_points} XP до следующего уровня:{" "}
            {500 - (data.xp_points % 500)} XP
          </p>
        </motion.div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="cyber-card p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                {s.icon}
                <span className="text-xs font-mono text-gray-400">{s.label}</span>
              </div>
              <div className={`font-display font-bold text-2xl ${s.glow}`}>
                {s.value}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Course progress */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="cyber-card p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BookOpen size={18} style={{ color: "var(--neon-orange)" }} />
                  <h2 className="font-display font-bold text-sm" style={{ color: "var(--neon-orange)" }}>
                    ПРОГРЕСС КУРСА
                  </h2>
                </div>
                <span className="text-xs font-mono text-gray-400">
                  {data.lessons_completed} / {data.total_lessons} уроков
                </span>
              </div>

              <div className="progress-bar mb-3">
                <div className="progress-fill" style={{ width: `${data.progress_percent}%` }} />
              </div>
              <div className="text-right text-xs font-mono" style={{ color: "var(--neon-orange)" }}>
                {data.progress_percent}%
              </div>

              {data.total_lessons === 0 && (
                <div className="mt-4 p-3 rounded-lg text-xs font-mono text-gray-400 border border-dashed border-cyber-border">
                  Курс не инициализирован.{" "}
                  <button
                    onClick={initCourse}
                    className="underline hover:text-white transition-colors"
                    style={{ color: "var(--neon-red)" }}
                  >
                    Инициализировать курс (60 уроков)
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 mt-4">
                <Link
                  href="/lessons"
                  className="btn-neon px-4 py-2 text-center text-xs block"
                >
                  Продолжить обучение
                </Link>
                <Link
                  href="/tasks"
                  className="btn-secondary px-4 py-2 text-center text-xs block"
                >
                  Практика задач
                </Link>
              </div>
            </motion.div>

            {/* Submissions stats */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="cyber-card p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <Code2 size={18} style={{ color: "var(--neon-green)" }} />
                <h2 className="font-display font-bold text-sm" style={{ color: "var(--neon-green)" }}>
                  РЕШЕНИЯ
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg text-center" style={{ background: "rgba(0,255,136,0.05)", border: "1px solid rgba(0,255,136,0.15)" }}>
                  <div className="text-2xl font-display font-bold glow-green">{data.correct_submissions}</div>
                  <div className="text-xs font-mono text-gray-400 mt-1">Верных решений</div>
                </div>
                <div className="p-3 rounded-lg text-center" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--cyber-border)" }}>
                  <div className="text-2xl font-display font-bold text-gray-300">{data.submissions_count}</div>
                  <div className="text-xs font-mono text-gray-400 mt-1">Всего попыток</div>
                </div>
              </div>
              {data.submissions_count > 0 && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs font-mono text-gray-400 mb-1">
                    <span>Точность</span>
                    <span style={{ color: "var(--neon-green)" }}>
                      {Math.round((data.correct_submissions / data.submissions_count) * 100)}%
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${Math.round((data.correct_submissions / data.submissions_count) * 100)}%`,
                        background: "linear-gradient(90deg, var(--neon-green), #00aa55)",
                      }}
                    />
                  </div>
                </div>
              )}
            </motion.div>

            {/* Achievements */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="cyber-card p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <Trophy size={18} style={{ color: "var(--neon-yellow)" }} />
                <h2 className="font-display font-bold text-sm" style={{ color: "var(--neon-yellow)" }}>
                  ДОСТИЖЕНИЯ ({myAchievements.length})
                </h2>
              </div>
              {myAchievements.length === 0 ? (
                <p className="text-xs font-mono text-gray-500">
                  Завершайте уроки и решайте задачи для получения достижений!
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {myAchievements.slice(0, 6).map((ua) => (
                    <div key={ua.id} className="achievement-card p-3 text-center">
                      <div className="text-2xl mb-1">{ua.achievement.icon}</div>
                      <div className="text-xs font-mono text-gray-300 font-medium">
                        {ua.achievement.title}
                      </div>
                      <div className="xp-badge mt-1 inline-block">+{ua.achievement.xp_reward} XP</div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          {/* Right column — Leaderboard */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="cyber-card p-6 h-fit"
          >
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={18} style={{ color: "#cc44ff" }} />
              <h2 className="font-display font-bold text-sm" style={{ color: "#cc44ff" }}>
                ЛИДЕРЫ
              </h2>
            </div>

            {data.leaderboard.length === 0 ? (
              <p className="text-xs font-mono text-gray-500">Пока никого нет</p>
            ) : (
              <div className="space-y-2">
                {data.leaderboard.map((entry) => (
                  <div
                    key={entry.rank}
                    className="flex items-center gap-3 p-2 rounded-lg transition-all"
                    style={
                      entry.is_current_user
                        ? {
                            background: "rgba(255, 34, 0, 0.08)",
                            border: "1px solid rgba(255, 34, 0, 0.2)",
                          }
                        : { background: "rgba(255,255,255,0.02)" }
                    }
                  >
                    <div className="w-6 text-center">
                      {entry.rank === 1 ? (
                        <Crown size={14} style={{ color: "var(--neon-yellow)" }} />
                      ) : entry.rank === 2 ? (
                        <Medal size={14} style={{ color: "#aaa" }} />
                      ) : entry.rank === 3 ? (
                        <Medal size={14} style={{ color: "#cd7f32" }} />
                      ) : (
                        <span className="text-xs font-mono text-gray-500">#{entry.rank}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className={`text-xs font-mono truncate ${entry.is_current_user ? "font-bold" : ""}`}
                        style={entry.is_current_user ? { color: "var(--neon-red)" } : { color: "#ccc" }}
                      >
                        {entry.username}
                        {entry.is_current_user && " (вы)"}
                      </div>
                      <div className="text-[10px] text-gray-500 font-mono">
                        Ур. {entry.level} • 🔥{entry.streak_days}
                      </div>
                    </div>
                    <div className="text-xs font-mono" style={{ color: "var(--neon-orange)" }}>
                      {entry.xp_points}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
