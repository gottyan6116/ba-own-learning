import type { Metadata } from "next";
import { Inter, Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import { NotesProvider } from "@/lib/notes/NotesProvider";
import { ProjectsProvider } from "@/lib/projects/ProjectsProvider";
import { KnowledgeViewProvider } from "@/lib/knowledge/KnowledgeViewProvider";
import { KnowledgeModal } from "@/components/knowledge/KnowledgeModal";
import { AppHeader } from "@/components/layout/AppHeader";

/**
 * 日本語の視認性を最優先。欧文だけ Inter に寄せ、和文は Noto Sans JP。
 * 見た目は装飾ではなく、ウェイト差とサイズ差で作る。
 */
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-sans-jp",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: {
    default: "Business Knowledge System",
    template: "%s | Business Knowledge System",
  },
  description:
    "業務プロセス → システムカテゴリ → 製品 → 自分のメモ、の順で business / marketing / sales / IT ソリューションの知識を構造化して蓄積・復習するための個人用ナレッジシステム。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={`${inter.variable} ${notoSansJP.variable}`}>
      <body className="min-h-dvh">
        <AuthProvider>
          <NotesProvider>
            <ProjectsProvider>
              <KnowledgeViewProvider>
                <a
                  href="#main"
                  className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-[4px] focus:bg-[var(--color-ink)] focus:px-3 focus:py-2 focus:text-[13px] focus:text-white"
                >
                  メインコンテンツへスキップ
                </a>
                <div className="flex min-h-dvh flex-col">
                  <AppHeader />
                  <main id="main" className="flex min-h-0 flex-1 flex-col">
                    {children}
                  </main>
                </div>
                <KnowledgeModal />
              </KnowledgeViewProvider>
            </ProjectsProvider>
          </NotesProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
