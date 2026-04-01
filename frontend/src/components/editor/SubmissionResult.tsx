"use client";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Zap, Trophy, Clock, Bot } from "lucide-react";

interface TestResult {
  input: string;
  expected: string;
  got: string;
  passed: boolean;
}

interface SubmissionResult {
  submission_id: number;
  is_correct: boolean;
  status: string;
  passed_tests: number;
  total_tests: number;
  test_results: TestResult[];
  execution_time_ms: number | null;
  output: string | null;
  error: string | null;
  ai_feedback: string | null;
  ai_score: number | null;
  xp_earned: number;
  new_achievements: Array<{ title: string; icon: string; xp_reward: number }>;
  new_level: number | null;
}

interface Props {
  result: SubmissionResult;
  onNewTask?: () => void;
}

export default function SubmissionResultComponent({ result, onNewTask }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      {/* Main verdict */}
      <div
        className="p-4 rounded-xl flex items-center gap-3"
        style={{
          background: result.is_correct
            ? "rgba(0,255,136,0.08)"
            : "rgba(255,34,0,0.08)",
          border: `1px solid ${result.is_correct ? "rgba(0,255,136,0.3)" : "rgba(255,34,0,0.3)"}`,
        }}
      >
        {result.is_correct ? (
          <CheckCircle size={24} style={{ color: "var(--neon-green)" }} />
        ) : (
          <XCircle size={24} style={{ color: "var(--neon-red)" }} />
        )}
        <div className="flex-1">
          <div
            className="font-display font-bold text-lg"
            style={{ color: result.is_correct ? "var(--neon-green)" : "var(--neon-red)" }}
          >
            {result.is_correct ? "РЕШЕНИЕ ВЕРНОЕ!" : "ПОПРОБУЙТЕ ЕЩЁ РАЗ"}
          </div>
          <div className="text-xs font-mono text-gray-400 mt-0.5">
            {result.passed_tests}/{result.total_tests} тестов пройдено
            {result.execution_time_ms !== null && ` · ${result.execution_time_ms}мс`}
          </div>
        </div>

        {/* XP earned */}
        {result.xp_earned > 0 && (
          <div className="flex items-center gap-1.5 xp-badge text-sm px-3 py-1">
            <Zap size={14} />+{result.xp_earned} XP
          </div>
        )}
      </div>

      {/* New level */}
      {result.new_level && (
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="p-3 rounded-xl text-center"
          style={{ background: "rgba(255,136,0,0.1)", border: "1px solid rgba(255,136,0,0.3)" }}
        >
          <div className="text-2xl mb-1">🎉</div>
          <div className="font-display font-bold" style={{ color: "var(--neon-orange)" }}>
            Новый уровень: {result.new_level}!
          </div>
        </motion.div>
      )}

      {/* New achievements */}
      {result.new_achievements.length > 0 && (
        <div className="space-y-2">
          {result.new_achievements.map((ach, i) => (
            <motion.div
              key={i}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              className="achievement-card p-3 flex items-center gap-3"
            >
              <span className="text-2xl">{ach.icon}</span>
              <div>
                <div className="font-mono font-bold text-sm text-white">
                  🏆 {ach.title}
                </div>
                <div className="xp-badge mt-1 inline-block">+{ach.xp_reward} XP</div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Test cases */}
      {result.test_results.length > 0 && (
        <div className="cyber-card p-4">
          <div className="text-xs font-display font-bold text-gray-400 mb-3">ТЕСТ-КЕЙСЫ</div>
          <div className="space-y-2">
            {result.test_results.map((tc, i) => (
              <div
                key={i}
                className="rounded-lg p-3 text-xs font-mono"
                style={{
                  background: tc.passed ? "rgba(0,255,136,0.05)" : "rgba(255,34,0,0.05)",
                  border: `1px solid ${tc.passed ? "rgba(0,255,136,0.15)" : "rgba(255,34,0,0.15)"}`,
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  {tc.passed ? (
                    <CheckCircle size={12} style={{ color: "var(--neon-green)" }} />
                  ) : (
                    <XCircle size={12} style={{ color: "var(--neon-red)" }} />
                  )}
                  <span className="text-gray-400">Тест {i + 1}</span>
                </div>
                {tc.input && (
                  <div className="mb-1">
                    <span className="text-gray-500">Ввод: </span>
                    <span className="text-gray-300">{tc.input}</span>
                  </div>
                )}
                <div className="mb-1">
                  <span className="text-gray-500">Ожидалось: </span>
                  <span style={{ color: "var(--neon-green)" }}>{tc.expected}</span>
                </div>
                {!tc.passed && (
                  <div>
                    <span className="text-gray-500">Получено: </span>
                    <span style={{ color: "var(--neon-red)" }}>{tc.got || "(нет вывода)"}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {result.error && (
        <div
          className="p-3 rounded-lg text-xs font-mono"
          style={{ background: "rgba(255,34,0,0.05)", border: "1px solid rgba(255,34,0,0.2)" }}
        >
          <div className="text-gray-400 mb-1">Ошибка выполнения:</div>
          <pre className="text-red-400 whitespace-pre-wrap">{result.error}</pre>
        </div>
      )}

      {/* AI Feedback */}
      {result.ai_feedback && (
        <div
          className="p-4 rounded-xl"
          style={{ background: "rgba(204,68,255,0.05)", border: "1px solid rgba(204,68,255,0.2)" }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Bot size={14} style={{ color: "#cc44ff" }} />
            <span className="text-xs font-display font-bold" style={{ color: "#cc44ff" }}>
              ИИ-АНАЛИЗ
            </span>
            {result.ai_score !== null && (
              <span className="ml-auto text-xs font-mono" style={{ color: "#cc44ff" }}>
                {result.ai_score}/100
              </span>
            )}
          </div>
          <p className="text-sm text-gray-300 leading-relaxed font-sans">{result.ai_feedback}</p>
        </div>
      )}

      {/* New task button */}
      {onNewTask && (
        <button onClick={onNewTask} className="btn-secondary w-full py-2 text-xs font-mono">
          Сгенерировать новую задачу
        </button>
      )}
    </motion.div>
  );
}
