import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Table2, Presentation, RefreshCw, CheckCircle2, AlertTriangle, ExternalLink, Menu, X, Wallet } from "lucide-react";
import { useData } from "@/data/DataContext";
import logo from "@/assets/logo.png";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/clientes", label: "Clientes", icon: Users },
  { to: "/planilha", label: "Planilha", icon: Table2 },
  { to: "/apresentacao", label: "Apresentação", icon: Presentation },
  { to: "/financeiro", label: "Financeiro", icon: Wallet },
];


function SyncIndicator({ isSidebar = false }: { isSidebar?: boolean }) {
  const { syncStatus, lastSync, syncError, syncNow, sheetUrl } = useData();

  const formatTime = (d: Date | null) => {
    if (!d) return "—";
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  let icon = <RefreshCw className="w-3.5 h-3.5" />;
  let label = "Aguardando…";
  let color = "text-muted-foreground";
  let bg = isSidebar ? "bg-sidebar-accent/30" : "bg-muted/40";

  if (syncStatus === "syncing") {
    icon = <RefreshCw className="w-3.5 h-3.5 animate-spin" />;
    label = "Sincronizando…";
    color = "text-primary";
    bg = isSidebar ? "bg-primary/5" : "bg-primary/10";
  } else if (syncStatus === "success") {
    icon = <CheckCircle2 className="w-3.5 h-3.5" />;
    label = `Atualizado às ${formatTime(lastSync)}`;
    color = "text-status-delivered";
    bg = isSidebar ? "bg-status-delivered-bg/20" : "bg-status-delivered-bg/40";
  } else if (syncStatus === "error") {
    icon = <AlertTriangle className="w-3.5 h-3.5" />;
    label = "Erro de sincronização";
    color = "text-status-late";
    bg = isSidebar ? "bg-status-late-bg/20" : "bg-status-late-bg/40";
  }

  return (
    <div className={`flex ${isSidebar ? "flex-col gap-1 p-3 mt-auto border-t border-sidebar-border" : "items-center gap-2"}`}>
      <button
        onClick={() => syncNow()}
        disabled={syncStatus === "syncing"}
        title={syncError || "Clique para sincronizar agora"}
        className={`flex items-center gap-1.5 px-2 py-2 min-h-[36px] rounded-md text-[10px] font-medium transition-colors ${bg} ${color} hover:opacity-80 disabled:opacity-60 ${isSidebar ? "w-full" : ""}`}
      >
        {icon}
        <span className="truncate">{label}</span>
      </button>
      <a
        href={sheetUrl}
        target="_blank"
        rel="noopener noreferrer"
        title="Abrir planilha no Google Sheets"
        className={`flex items-center gap-1 px-2 py-2 min-h-[36px] rounded-md text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 transition-colors ${isSidebar ? "w-full" : ""}`}
      >
        <ExternalLink className="w-3.5 h-3.5" />
        <span>Abrir Planilha Google</span>
      </a>
    </div>
  );
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  return (
    <>
      <nav className="flex-1 px-3 pt-4 relative z-10 flex flex-col">
        <div className="flex-1">
          {navItems.map(item => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={onNavigate}
                className={`flex items-center gap-3 px-3 py-3 min-h-[44px] rounded-lg mb-1 text-sm font-medium transition-colors ${
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                }`}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </div>
        <SyncIndicator isSidebar />
      </nav>
      <div className="p-4 text-[10px] text-sidebar-foreground opacity-40 relative z-10">
        © 2026 Execução Marketing
      </div>
    </>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { syncError, syncStatus } = useData();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top header */}
      <header className="w-full bg-sidebar border-b border-sidebar-border px-4 sm:px-6 lg:px-10 py-4 sm:py-6 lg:py-8 flex items-center gap-3 sm:gap-6 lg:gap-8">
        {/* Mobile menu button */}
        <button
          onClick={() => setMobileOpen(true)}
          className="md:hidden flex-shrink-0 inline-flex items-center justify-center w-11 h-11 rounded-lg border border-sidebar-border bg-background text-foreground hover:bg-sidebar-accent transition-colors"
          aria-label="Abrir menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="h-12 sm:h-16 md:h-20 lg:h-32 flex items-center justify-center flex-shrink-0">
          <img src={logo} alt="Execução Marketing" className="h-full w-auto object-contain drop-shadow-xl" />
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-5xl font-serif font-bold italic tracking-tight text-foreground leading-tight truncate">
            Execução Marketing
          </h1>
          <p className="hidden sm:block text-xs sm:text-sm md:text-base text-sidebar-foreground opacity-80 mt-1 sm:mt-2">Painel de gestão de entregas</p>
        </div>
      </header>

      {syncStatus === "error" && syncError && (
        <div className="w-full bg-status-late-bg/40 border-b border-status-late/30 px-4 sm:px-6 lg:px-10 py-2 text-xs text-status-late flex items-start gap-2">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span><strong>Sincronização falhou:</strong> {syncError} — verifique se a planilha está com permissão "Qualquer pessoa com o link pode ver".</span>
        </div>
      )}

      <div className="flex flex-1 min-h-0">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-60 bg-sidebar flex-shrink-0 flex-col border-r border-sidebar-border relative overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-full pointer-events-none select-none opacity-[0.08] z-0">
            <img src={logo} alt="" className="h-full w-full object-contain" />
          </div>
          <SidebarNav />
        </aside>

        {/* Mobile Drawer */}
        {mobileOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <aside className="relative w-64 max-w-[85vw] bg-sidebar flex flex-col border-r border-sidebar-border shadow-xl animate-in slide-in-from-left duration-200">
              <div className="absolute inset-y-0 left-0 w-full pointer-events-none select-none opacity-[0.08] z-0">
                <img src={logo} alt="" className="h-full w-full object-contain" />
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-3 right-3 z-20 inline-flex items-center justify-center w-9 h-9 rounded-lg hover:bg-sidebar-accent transition-colors"
                aria-label="Fechar menu"
              >
                <X className="w-5 h-5" />
              </button>
              <SidebarNav onNavigate={() => setMobileOpen(false)} />
            </aside>
          </div>
        )}

        {/* Main */}
        <main className="flex-1 overflow-auto relative min-w-0">
          <div className="absolute inset-0 pointer-events-none select-none opacity-[0.04] z-0 flex items-center justify-center">
            <img src={logo} alt="" className="max-h-[80%] max-w-[60%] object-contain" />
          </div>
          <div className="relative z-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
