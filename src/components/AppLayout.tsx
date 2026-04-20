import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Table2, RefreshCw, CheckCircle2, AlertTriangle, ExternalLink } from "lucide-react";
import { useData } from "@/data/DataContext";
import logo from "@/assets/logo.png";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/clientes", label: "Clientes", icon: Users },
  { to: "/planilha", label: "Planilha", icon: Table2 },
];

function SyncIndicator() {
  const { syncStatus, lastSync, syncError, syncNow, sheetUrl } = useData();

  const formatTime = (d: Date | null) => {
    if (!d) return "—";
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  let icon = <RefreshCw className="w-3.5 h-3.5" />;
  let label = "Aguardando…";
  let color = "text-muted-foreground";
  let bg = "bg-muted/40";

  if (syncStatus === "syncing") {
    icon = <RefreshCw className="w-3.5 h-3.5 animate-spin" />;
    label = "Sincronizando…";
    color = "text-primary";
    bg = "bg-primary/10";
  } else if (syncStatus === "success") {
    icon = <CheckCircle2 className="w-3.5 h-3.5" />;
    label = `Atualizado às ${formatTime(lastSync)}`;
    color = "text-status-delivered";
    bg = "bg-status-delivered-bg/40";
  } else if (syncStatus === "error") {
    icon = <AlertTriangle className="w-3.5 h-3.5" />;
    label = "Erro de sincronização";
    color = "text-status-late";
    bg = "bg-status-late-bg/40";
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => syncNow()}
        disabled={syncStatus === "syncing"}
        title={syncError || "Clique para sincronizar agora"}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${bg} ${color} hover:opacity-80 disabled:opacity-60`}
      >
        {icon}
        <span className="hidden sm:inline">{label}</span>
      </button>
      <a
        href={sheetUrl}
        target="_blank"
        rel="noopener noreferrer"
        title="Abrir planilha no Google Sheets"
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      >
        <ExternalLink className="w-3.5 h-3.5" />
        <span className="hidden md:inline">Planilha</span>
      </a>
    </div>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { syncError, syncStatus } = useData();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top header com nome da empresa em destaque */}
      <header className="w-full bg-sidebar border-b border-sidebar-border px-6 lg:px-10 py-8 flex items-center gap-8 flex-wrap">
        <div className="h-24 lg:h-32 flex items-center justify-center flex-shrink-0">
          <img src={logo} alt="Execução Marketing" className="h-full w-auto object-contain drop-shadow-xl" />
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          <h1 className="text-3xl lg:text-5xl font-serif font-bold italic tracking-tight text-foreground leading-tight">
            Execução Marketing
          </h1>
          <p className="text-base text-sidebar-foreground opacity-80 mt-2">Painel de gestão de entregas</p>
        </div>
        <SyncIndicator />
      </header>

      {syncStatus === "error" && syncError && (
        <div className="w-full bg-status-late-bg/40 border-b border-status-late/30 px-6 lg:px-10 py-2 text-xs text-status-late flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
          <span><strong>Sincronização falhou:</strong> {syncError} — verifique se a planilha está com permissão "Qualquer pessoa com o link pode ver".</span>
        </div>
      )}

      <div className="flex flex-1 min-h-0">
      {/* Sidebar */}
      <aside className="w-60 bg-sidebar flex-shrink-0 flex flex-col border-r border-sidebar-border relative overflow-hidden">
        {/* Logo Background */}
        <div className="absolute inset-y-0 left-0 w-full pointer-events-none select-none opacity-[0.08] z-0">
          <img src={logo} alt="" className="h-full w-full object-contain" />
        </div>

        <nav className="flex-1 px-3 pt-4 relative z-10">
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
        <div className="p-4 text-[10px] text-sidebar-foreground opacity-40 relative z-10">
          © 2026 Execução Marketing
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto relative">
        {/* Logo Background */}
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
