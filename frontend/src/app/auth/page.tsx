"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useAuthStore } from "@/lib/store";
import { auth } from "@/lib/api";
import { Eye, EyeOff, BookOpen, Code2, Zap } from "lucide-react";

type Tab = "login" | "register" | "forgot";

export default function AuthPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [tab, setTab] = useState<Tab>("login");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    email: "",
    username: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (tab === "login") {
        const { data } = await auth.loginJson({ email: form.email, password: form.password });
        setAuth(data.access_token, data.user);
        toast.success(`Добро пожаловать, ${data.user.username}!`);
        router.push("/dashboard");
      } else if (tab === "register") {
        const { data } = await auth.register(form);
        setAuth(data.access_token, data.user);
        toast.success("Аккаунт создан! Добро пожаловать!");
        router.push("/dashboard");
      } else {
        await auth.forgotPassword(form.email);
        toast.success("Проверьте почту — временный пароль отправлен");
        setTab("login");
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "Произошла ошибка";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "var(--cyber-black)" }}
    >
      {/* Background decoration */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            "radial-gradient(circle at 25% 25%, #ff2200 0%, transparent 50%), radial-gradient(circle at 75% 75%, #ff8800 0%, transparent 50%)",
        }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="level-badge text-lg" style={{ width: 56, height: 56, fontSize: "1.2rem" }}>
              1C
            </div>
          </div>
          <h1 className="font-display font-bold text-3xl glow-red" style={{ color: "var(--neon-red)" }}>
            1С АКАДЕМИЯ
          </h1>
          <p className="text-gray-400 text-sm mt-1 font-mono">
            Изучайте 1С:Предприятие с ИИ-наставником
          </p>
        </motion.div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          {[
            { icon: <BookOpen size={14} />, text: "60 уроков" },
            { icon: <Code2 size={14} />, text: "OneScript" },
            { icon: <Zap size={14} />, text: "ИИ-анализ" },
          ].map((f, i) => (
            <div
              key={i}
              className="cyber-card p-2 flex flex-col items-center gap-1 text-xs font-mono text-gray-400"
            >
              <span style={{ color: "var(--neon-orange)" }}>{f.icon}</span>
              {f.text}
            </div>
          ))}
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="cyber-card p-6"
        >
          {/* Tabs */}
          <div className="flex gap-1 mb-6 p-1 rounded-lg" style={{ background: "rgba(255,255,255,0.03)" }}>
            {(["login", "register", "forgot"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="flex-1 py-1.5 rounded-md text-xs font-mono transition-all"
                style={
                  tab === t
                    ? {
                        background: "rgba(255, 34, 0, 0.2)",
                        color: "var(--neon-red)",
                        border: "1px solid rgba(255, 34, 0, 0.3)",
                      }
                    : { color: "#666" }
                }
              >
                {t === "login" ? "Войти" : t === "register" ? "Регистрация" : "Забыли пароль"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-3"
              >
                <div>
                  <label className="text-xs font-mono text-gray-400 mb-1 block">Email</label>
                  <input
                    name="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    placeholder="user@example.com"
                    className="cyber-input w-full px-3 py-2 text-sm font-mono"
                  />
                </div>

                {tab === "register" && (
                  <div>
                    <label className="text-xs font-mono text-gray-400 mb-1 block">
                      Имя пользователя
                    </label>
                    <input
                      name="username"
                      required
                      value={form.username}
                      onChange={handleChange}
                      placeholder="onec_developer"
                      className="cyber-input w-full px-3 py-2 text-sm font-mono"
                    />
                  </div>
                )}

                {tab !== "forgot" && (
                  <div>
                    <label className="text-xs font-mono text-gray-400 mb-1 block">Пароль</label>
                    <div className="relative">
                      <input
                        name="password"
                        type={showPassword ? "text" : "password"}
                        required
                        value={form.password}
                        onChange={handleChange}
                        placeholder="••••••••"
                        className="cyber-input w-full px-3 py-2 pr-10 text-sm font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                      >
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading}
              className="btn-neon w-full py-2.5 text-sm"
            >
              {loading
                ? "Загрузка..."
                : tab === "login"
                ? "Войти в систему"
                : tab === "register"
                ? "Создать аккаунт"
                : "Сбросить пароль"}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
