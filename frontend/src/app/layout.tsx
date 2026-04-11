import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "1С Академия — Изучайте 1С программирование",
  description: "Интерактивная платформа для изучения языка программирования 1С:Предприятие и OneScript",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <div className="scan-overlay" />
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#111128",
              color: "#e0e0f0",
              border: "1px solid #1e1e3a",
              fontFamily: "JetBrains Mono, monospace",
              fontSize: "0.85rem",
            },
            success: {
              iconTheme: { primary: "#00ff88", secondary: "#111128" },
            },
            error: {
              iconTheme: { primary: "#ff2200", secondary: "#111128" },
            },
          }}
        />
      </body>
    </html>
  );
}
