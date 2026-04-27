import { useState, useEffect, useCallback, useMemo } from "react";
import { 
  Users, CheckCircle2, Clock, AlertTriangle, TrendingUp, 
  Play, Pause, ChevronLeft, ChevronRight, Maximize2, Minimize2, X, ArrowLeft
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie, Legend
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { useData } from "@/data/DataContext";
import { StatusBadge } from "@/components/StatusBadge";
import logo from "@/assets/logo.png";

const SLIDE_DURATION = 15000; // 15 seconds

const STATUS_COLORS: Record<string, string> = {
  "Concluído": "#22c55e",
  "Atrasado": "#ef4444",
  "Em andamento": "#3b82f6",
  "Revisão": "#f97316",
  "Pendente": "#eab308",
};

export default function PresentationMode({ onExit }: { onExit: () => void }) {
  const { summaries, rows } = useData();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Data Calculations
  const totalClientes = summaries.length;
  const totalContratado = summaries.reduce((s, c) => s + c.totalItems, 0);
  const totalEntregues = summaries.reduce((s, c) => s + c.totalEntregues, 0);
  const totalEntreguesPercent = totalContratado > 0 ? Math.round((totalEntregues / totalContratado) * 100) : 0;
  const totalPendentes = totalContratado - totalEntregues;
  const atrasadosCount = summaries.filter(c => c.status === "Atrasado").length;

  const porResponsavel = useMemo(() => {
    const map = new Map<string, { 
      responsavel: string; 
      clientes: number; 
      contratado: number; 
      entregue: number; 
      pendentes: number; 
      atrasados: number 
    }>();
    
    summaries.forEach(c => {
      const key = c.responsavel || "Sem responsável";
      if (!map.has(key)) {
        map.set(key, { responsavel: key, clientes: 0, contratado: 0, entregue: 0, pendentes: 0, atrasados: 0 });
      }
      const r = map.get(key)!;
      r.clientes += 1;
      r.contratado += c.totalItems;
      r.entregue += c.totalEntregues;
      r.pendentes += (c.totalItems - c.totalEntregues);
      if (c.status === "Atrasado") r.atrasados += 1;
    });
    
    return Array.from(map.values()).sort((a, b) => b.entregue - a.entregue);
  }, [summaries]);

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    summaries.forEach(c => { counts[c.status] = (counts[c.status] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [summaries]);

  // Priority ranking — clients that require the most attention based on STATUS
  const allPrioridade = useMemo(() => {
    const statusWeight: Record<string, number> = {
      "Atrasado": 100,
      "Pendente": 60,
      "Revisão": 40,
      "Em andamento": 20,
      "Concluído": 0,
    };
    return [...summaries]
      .map(c => {
        const pendentes = c.totalItems - c.totalEntregues;
        // Prioritize clients with local observations or general observations too
        const hasObs = (c.observacoes || (c.localObservacoes && c.localObservacoes.length > 0)) ? 50 : 0;
        const score = (statusWeight[c.status] ?? 10) + pendentes * 5 + (100 - c.progresso) + hasObs;
        return { ...c, pendentes, score };
      })
      .filter(c => c.status !== "Concluído" || (c.localObservacoes && c.localObservacoes.length > 0))
      .sort((a, b) => b.score - a.score);
  }, [summaries]);

  // Max 4 clients per slide
  const clientsChunks = useMemo(() => {
    const chunks = [];
    for (let i = 0; i < allPrioridade.length; i += 4) {
      chunks.push(allPrioridade.slice(i, i + 4));
    }
    return chunks.length > 0 ? chunks : [[]];
  }, [allPrioridade]);

  const totalSlides = 2 + clientsChunks.length;

  // Handle Fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((e) => {
        console.error(`Error attempting to enable fullscreen: ${e.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    
    // Auto-enter fullscreen on mount
    toggleFullscreen();

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, [toggleFullscreen]);

  // Slideshow Logic
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, SLIDE_DURATION);

    return () => clearInterval(timer);
  }, [isPaused, totalSlides]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onExit();
      if (e.key === "ArrowRight") setCurrentSlide((prev) => (prev + 1) % totalSlides);
      if (e.key === "ArrowLeft") setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
      if (e.key === " ") setIsPaused((prev) => !prev);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onExit, totalSlides]);

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col overflow-hidden text-foreground">
      {/* Top Controls */}
      <div className="absolute top-4 right-4 flex gap-2 z-[110]">
        <button
          onClick={onExit}
          className="flex items-center gap-2 px-4 py-2 bg-card border border-border shadow-lg rounded-full hover:bg-muted transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-bold uppercase tracking-wider">Voltar</span>
        </button>
        <button
          onClick={() => setIsPaused((p) => !p)}
          className={`flex items-center gap-2 px-4 py-2 border shadow-lg rounded-full transition-all ${
            isPaused ? "bg-yellow-500 text-white border-yellow-600 animate-pulse" : "bg-card border-border hover:bg-muted"
          }`}
        >
          {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
          <span className="text-sm font-bold uppercase tracking-wider">{isPaused ? "Pausado" : "Pausar"}</span>
        </button>
        <button
          onClick={toggleFullscreen}
          className="p-2.5 bg-card border border-border shadow-lg rounded-full hover:bg-muted transition-all"
        >
          {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
        </button>
        <button
          onClick={onExit}
          className="p-2.5 bg-destructive text-destructive-foreground border border-destructive shadow-lg rounded-full hover:bg-destructive/90 transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Side Navigation */}
      <button
        onClick={() => setCurrentSlide((p) => (p - 1 + totalSlides) % totalSlides)}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-[110] p-3 bg-card/80 border border-border shadow-xl rounded-full hover:bg-muted transition-all backdrop-blur-sm"
      >
        <ChevronLeft className="w-7 h-7" />
      </button>
      <button
        onClick={() => setCurrentSlide((p) => (p + 1) % totalSlides)}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-[110] p-3 bg-card/80 border border-border shadow-xl rounded-full hover:bg-muted transition-all backdrop-blur-sm"
      >
        <ChevronRight className="w-7 h-7" />
      </button>

      <div className="flex-1 relative">
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 p-8 lg:p-16 pt-20 flex flex-col justify-center overflow-y-auto"
          >
            {/* Slide 1: Resumo Geral */}
            {currentSlide === 0 && (
              <div className="space-y-12">
                <header className="text-center">
                  <h1 className="text-5xl lg:text-7xl font-serif font-bold mb-4">Resumo Geral</h1>
                  <p className="text-2xl text-muted-foreground">Status Executivo da Operação</p>
                </header>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  <KPISlideCard title="Total de Clientes" value={`${totalClientes}`} icon={Users} color="text-primary" />
                  <KPISlideCard title="Total de Entregues (%)" value={`${totalEntreguesPercent}%`} icon={CheckCircle2} color="text-green-500" />
                  <KPISlideCard title="Total de Pendentes (%)" value={`${100 - totalEntreguesPercent}%`} icon={Clock} color="text-yellow-500" />
                  <KPISlideCard title="Total de Atrasados (%)" value={`${totalClientes > 0 ? Math.round((atrasadosCount / totalClientes) * 100) : 0}%`} icon={AlertTriangle} color="text-red-500" />
                </div>
                <div className="flex justify-center">
                  <div className="bg-card rounded-3xl p-8 border border-border shadow-2xl flex flex-col items-center justify-center w-full max-w-2xl">
                    <h3 className="text-2xl font-bold mb-4">Status Geral (Porcentagem)</h3>
                    <div className="w-full h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie 
                            data={statusData} 
                            cx="50%" 
                            cy="50%" 
                            innerRadius={80} 
                            outerRadius={100} 
                            paddingAngle={5} 
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {statusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || "#8884d8"} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => [`${((value / totalClientes) * 100).toFixed(0)}%`, "Proporção"]} />
                          <Legend wrapperStyle={{ fontSize: '18px', fontWeight: 'bold' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Slide 2: Responsáveis */}
            {currentSlide === 1 && (
              <div className="space-y-8 h-full flex flex-col">
                <header className="text-center">
                  <h1 className="text-5xl lg:text-6xl font-serif font-bold mb-2">Resumo por Responsável</h1>
                  <p className="text-xl text-muted-foreground">Visão consolidada de carteira e status</p>
                </header>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 overflow-y-auto pr-2 pb-8">
                  {porResponsavel.map((r) => {
                    const entreguesCount = summaries.filter(s => (s.responsavel || "Sem responsável") === r.responsavel && s.status === "Concluído").length;
                    const pendentesCount = summaries.filter(s => (s.responsavel || "Sem responsável") === r.responsavel && s.status === "Pendente").length;
                    const emAndamentoCount = summaries.filter(s => (s.responsavel || "Sem responsável") === r.responsavel && s.status === "Em andamento").length;
                    const revisaoCount = summaries.filter(s => (s.responsavel || "Sem responsável") === r.responsavel && s.status === "Revisão").length;
                    
                    return (
                      <div key={r.responsavel} className="bg-card p-6 rounded-3xl border border-border shadow-xl flex flex-col gap-6">
                        <div className="flex items-center justify-between border-b border-border pb-4">
                          <h3 className="text-2xl font-black text-primary">{r.responsavel}</h3>
                          <div className="bg-primary/10 px-4 py-1 rounded-full text-primary font-bold">
                            {r.clientes} Clientes
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-green-500/10 p-4 rounded-2xl border border-green-500/20 text-center">
                            <div className="text-3xl font-black text-green-500">{entreguesCount}</div>
                            <div className="text-[10px] font-bold uppercase tracking-widest text-green-600/70">Entregues</div>
                          </div>
                          <div className="bg-red-500/10 p-4 rounded-2xl border border-red-500/20 text-center">
                            <div className="text-3xl font-black text-red-500">{r.atrasados}</div>
                            <div className="text-[10px] font-bold uppercase tracking-widest text-red-600/70">Atrasados</div>
                          </div>
                          <div className="bg-yellow-500/10 p-4 rounded-2xl border border-yellow-500/20 text-center">
                            <div className="text-3xl font-black text-yellow-500">{pendentesCount}</div>
                            <div className="text-[10px] font-bold uppercase tracking-widest text-yellow-600/70">Pendentes</div>
                          </div>
                          <div className="bg-blue-500/10 p-4 rounded-2xl border border-blue-500/20 text-center">
                            <div className="text-3xl font-black text-blue-500">{emAndamentoCount + revisaoCount}</div>
                            <div className="text-[10px] font-bold uppercase tracking-widest text-blue-600/70">Em Curso</div>
                          </div>
                        </div>

                        <div className="mt-auto">
                          <div className="flex justify-between text-xs font-bold mb-2 uppercase tracking-wider text-muted-foreground">
                            <span>Progresso Geral</span>
                            <span>{r.contratado > 0 ? Math.round((r.entregue / r.contratado) * 100) : 0}%</span>
                          </div>
                          <div className="h-3 bg-muted rounded-full overflow-hidden border border-border">
                            <div 
                              className="h-full bg-primary transition-all duration-1000" 
                              style={{ width: `${r.contratado > 0 ? Math.round((r.entregue / r.contratado) * 100) : 0}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Slides 3+: Clientes que Requerem Maior Atenção (Dinâmico) */}
            {currentSlide >= 2 && (
              <div className="space-y-8 h-full flex flex-col bg-red-500/5 -m-8 lg:-m-16 p-8 lg:p-16">
                <header className="text-center">
                  <h1 className="text-4xl lg:text-6xl font-serif font-bold text-red-600 mb-3 flex items-center justify-center gap-4">
                    <AlertTriangle className="w-14 h-14 animate-pulse" />
                    Clientes que Requerem Atenção
                    <AlertTriangle className="w-14 h-14 animate-pulse" />
                  </h1>
                  <p className="text-xl text-red-600/80 font-bold uppercase tracking-widest">
                    Página {currentSlide - 1} de {clientsChunks.length}
                  </p>
                </header>
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 overflow-hidden">
                  {clientsChunks[currentSlide - 2]?.length === 0 ? (
                    <div className="lg:col-span-2 flex items-center justify-center">
                      <div className="bg-green-100 dark:bg-green-950/30 p-16 rounded-3xl border-4 border-green-500 text-center">
                        <CheckCircle2 className="w-24 h-24 text-green-600 mx-auto mb-6" />
                        <h3 className="text-4xl font-bold text-green-800 dark:text-green-300">
                          Tudo em dia! Nenhum cliente requer atenção nesta página.
                        </h3>
                      </div>
                    </div>
                  ) : (
                    clientsChunks[currentSlide - 2]?.map((c, idx) => {
                      const isAtrasado = c.status === "Atrasado";
                      const borderColor = isAtrasado ? "border-red-500" : c.status === "Pendente" ? "border-yellow-500" : "border-orange-500";
                      const textColor = isAtrasado ? "text-red-600" : c.status === "Pendente" ? "text-yellow-600" : "text-orange-600";
                      const bgRank = isAtrasado ? "bg-red-600" : c.status === "Pendente" ? "bg-yellow-600" : "bg-orange-600";
                      
                      return (
                        <div
                          key={c.cliente}
                          className={`bg-card p-8 rounded-3xl border-4 ${borderColor} shadow-2xl flex flex-col gap-6`}
                        >
                          <div className="flex items-center gap-8">
                            <div className={`w-16 h-16 shrink-0 rounded-full ${bgRank} text-white flex items-center justify-center font-black text-3xl shadow-lg`}>
                              {((currentSlide - 2) * 4) + idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className={`text-3xl font-black truncate ${textColor}`}>{c.cliente}</h3>
                              <div className="flex items-center gap-3 mt-1 flex-wrap">
                                <StatusBadge status={c.status} />
                                <span className="text-lg font-bold text-muted-foreground truncate">
                                  {c.responsavel}
                                </span>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className={`text-5xl font-black ${textColor}`}>{c.pendentes}</div>
                              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                Pendências
                              </div>
                            </div>
                          </div>

                          {(c.observacoes || (c.localObservacoes && c.localObservacoes.length > 0)) && (
                            <div className="bg-muted/30 p-5 rounded-2xl border border-border/50">
                              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                                <Users className="w-3.5 h-3.5" /> Observações do Cliente
                              </p>
                              <div className="space-y-3 max-h-[160px] overflow-y-auto pr-2">
                                {c.observacoes && (
                                  <p className="text-sm italic text-foreground/80 leading-relaxed border-l-2 border-primary/30 pl-3 py-1">
                                    {c.observacoes}
                                  </p>
                                )}
                                {c.localObservacoes?.map((obs, i) => (
                                  <div key={i} className="text-sm text-foreground/80 leading-relaxed border-l-2 border-primary/30 pl-3 py-1">
                                    <span className="font-bold text-[10px] uppercase text-primary block mb-0.5">{obs.author} • {obs.timestamp}</span>
                                    {obs.text}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-muted w-full relative">
        <motion.div 
          className="h-full bg-primary"
          initial={{ width: "0%" }}
          animate={{ width: isPaused ? "0%" : "100%" }}
          transition={{ duration: SLIDE_DURATION / 1000, ease: "linear", repeat: Infinity }}
          key={`${currentSlide}-${isPaused}`}
        />
      </div>

      {/* Footer */}
      <footer className="h-20 border-t border-border flex items-center justify-between px-12 bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <img src={logo} alt="Logo" className="h-10 opacity-50" />
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Execução Marketing • Dashboard TV</p>
        </div>
        <div className="flex gap-4">
          {Array.from({ length: totalSlides }).map((_, i) => (
            <div 
              key={i} 
              className={`h-3 w-3 rounded-full transition-all duration-300 ${i === currentSlide ? "bg-primary scale-150" : "bg-muted"}`} 
            />
          ))}
        </div>
        <div className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
          {new Date().toLocaleDateString("pt-BR", { weekday: 'long', day: '2-digit', month: 'long' })}
        </div>
      </footer>
    </div>
  );
}

function KPISlideCard({ title, value, icon: Icon, color }: { title: string, value: string | number, icon: any, color: string }) {
  return (
    <div className="bg-card rounded-3xl p-10 border border-border shadow-2xl hover:border-primary/50 transition-all group">
      <div className="flex items-start justify-between mb-8">
        <div className={`p-4 rounded-2xl bg-muted group-hover:bg-primary/10 transition-colors`}>
          <Icon className={`w-10 h-10 ${color}`} />
        </div>
      </div>
      <div>
        <p className="text-lg font-bold text-muted-foreground uppercase tracking-wider mb-2">{title}</p>
        <p className="text-7xl font-black">{value}</p>
      </div>
    </div>
  );
}
