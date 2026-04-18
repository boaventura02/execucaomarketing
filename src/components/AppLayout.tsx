import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, BarChart3, Table2 } from "lucide-react";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/clientes", label: "Clientes", icon: Users },
  { to: "/planilha", label: "Planilha", icon: Table2 },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top header com nome da empresa em destaque */}
      <header className="w-full bg-sidebar border-b border-sidebar-border px-6 lg:px-10 py-5 flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-sidebar-primary flex items-center justify-center">
          <BarChart3 className="w-6 h-6 text-sidebar-primary-foreground" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-3xl lg:text-5xl font-serif font-bold italic tracking-tight text-foreground leading-none">
            Execução Marketing
          </h1>
          <p className="text-xs text-sidebar-foreground opacity-60 mt-1">Painel de gestão de entregas</p>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
      {/* Sidebar */}
      <aside className="w-60 bg-sidebar flex-shrink-0 flex flex-col border-r border-sidebar-border">
        <nav className="flex-1 px-3 pt-4">
          {navItems.map(item => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm font-medium transition-colors ${
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 text-[10px] text-sidebar-foreground opacity-40">
          © 2026 Execução Marketing
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
      </div>
    </div>
  );
}
