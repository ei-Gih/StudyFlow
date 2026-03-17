// app/layout.tsx
import type { Metadata } from "next";
import { Sora, DM_Mono } from "next/font/google";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import SessionProvider from "@/components/SessionProvider";
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
  weight: ["300", "400", "600", "700"],
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  variable: "--font-dm-mono",
  display: "swap",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: { default: "StudyFlow", template: "%s — StudyFlow" },
  description: "Plataforma avançada de gerenciamento de estudos com pomodoro, flashcards e analytics.",
  keywords: ["estudos", "pomodoro", "flashcards", "revisão espaçada", "produtividade"],
  authors: [{ name: "StudyFlow" }],
  openGraph: {
    title: "StudyFlow",
    description: "Estude com método, evolua com dados.",
    type: "website",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="pt-BR" className={`${sora.variable} ${dmMono.variable}`}>
      <body>
        <SessionProvider session={session}>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
