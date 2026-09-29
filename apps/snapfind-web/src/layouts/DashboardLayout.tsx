import { useState, type ReactNode } from "react";
import Sidebar from "../components/Sidebar";
import { Header } from "../components/common/Header";

export default function DashboardLayout({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#0B1220] text-[#F7F5F0] overflow-hidden select-none">
      {/* Desktop sidebar */}
      <div className="hidden md:block h-full">
        <Sidebar />
      </div>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col h-full overflow-hidden">
        <Header title={title} onOpenMobileMenu={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8 bg-[#0B1220]">
          {children}
        </main>
      </div>
    </div>
  );
}
