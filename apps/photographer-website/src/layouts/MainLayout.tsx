import type { ReactNode } from "react";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-ink text-ivory">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-brass focus:px-4 focus:py-2 focus:text-ink"
      >
        Skip to content
      </a>
      <Header />
      <main id="main-content" className="flex-1 pt-20">
        {children}
      </main>
      <Footer />
    </div>
  );
}
