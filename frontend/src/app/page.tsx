"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";

export default function Home() {
  const router = useRouter();
  const { token } = useAuthStore();

  useEffect(() => {
    if (token) {
      router.replace("/dashboard");
    } else {
      router.replace("/auth");
    }
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-cyber-black">
      <div className="text-center">
        <div
          className="text-4xl font-display font-bold glow-red mb-4"
          style={{ color: "var(--neon-red)" }}
        >
          1С АКАДЕМИЯ
        </div>
        <div className="text-cyber-border font-mono text-sm animate-pulse">
          Загрузка...
        </div>
      </div>
    </div>
  );
}
