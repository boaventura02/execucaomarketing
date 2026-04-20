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

  const totalSlides = 5;

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

  // Data Calculations
  const totalClientes = summaries.length;
  const totalContratado = summaries.reduce((s, c) => s + c.totalItems, 0);
  const totalEntregues = summaries.reduce((s, c) => s + c.totalEntregues, 0);
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

  const productionData = useMemo(() => {
    const data = [
      { name: "Stories", entregue: 0, contratado: 0 },
      { name: "Reels", entregue: 0, contratado: 0 },
    ];
    
    rows.forEach(r => {
      const tipo = r.tipoConteudo.toLowerCase();
      const qtd = parseInt(r.quantidadeContratada) || 0;
      const entregue = r.statusGeral === "Concluído" ? qtd : 0;
      
      if (tipo.includes("story") || tipo.includes("stories")) {
        data[0].contratado += qtd;
        data[0].entregue += entregue;
      } else if (tipo.includes("reel")) {
        data[1].contratado += qtd;
        data[1].entregue += entregue;
      }
    });
    return data;
  }, [rows]);

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    summaries.forEach(c => { counts[c.status] = (counts[c.status] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [summaries]);

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col overflow-hidden text-foreground">
      {/* Top Controls (always visible & interactive) */}
      <div className="absolute top-4 right-4 flex gap-2 z-[110]">
        <button
          onClick={onExit}
          title="Voltar para o site"
          className="flex items-center gap-2 px-4 py-2 bg-card border border-border shadow-lg rounded-full hover:bg-muted transition-all hover:scale-105 active:scale-95"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-bold uppercase tracking-wider">Voltar ao site</span>
        </button>
        <button
          onClick={() => setIsPaused((p) => !p)}
          title={isPaused ? "Retomar apresentação" : "Pausar este slide"}
          className={`flex items-center gap-2 px-4 py-2 border shadow-lg rounded-full transition-all hover:scale-105 active:scale-95 ${
            isPaused
              ? "bg-yellow-500 text-white border-yellow-600 hover:bg-yellow-600 animate-pulse"
              : "bg-card border-border hover:bg-muted"
          }`}
        >
          {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
          <span className="text-sm font-bold uppercase tracking-wider">
            {isPaused ? "Pausado" : "Pausar slide"}
          </span>
        </button>
        <button
          onClick={toggleFullscreen}
          title={isFullscreen ? "Sair tela cheia" : "Tela cheia"}
          className="p-2.5 bg-card border border-border shadow-lg rounded-full hover:bg-muted transition-all hover:scale-105 active:scale-95"
        >
          {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
        </button>
        <button
          onClick={onExit}
          title="Fechar apresentação (ESC)"
          className="p-2.5 bg-destructive text-destructive-foreground border border-destructive shadow-lg rounded-full hover:bg-destructive/90 transition-all hover:scale-105 active:scale-95"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Side Navigation Arrows */}
      <button
        onClick={() => setCurrentSlide((p) => (p - 1 + totalSlides) % totalSlides)}
        title="Slide anterior"
        className="absolute left-4 top-1/2 -translate-y-1/2 z-[110] p-3 bg-card/80 border border-border shadow-xl rounded-full hover:bg-muted hover:scale-110 active:scale-95 transition-all backdrop-blur-sm"
      >
        <ChevronLeft className="w-7 h-7" />
      </button>
      <button
        onClick={() => setCurrentSlide((p) => (p + 1) % totalSlides)}
        title="Próximo slide"
        className="absolute right-4 top-1/2 -translate-y-1/2 z-[110] p-3 bg-card/80 border border-border shadow-xl rounded-full hover:bg-muted hover:scale-110 active:scale-95 transition-all backdrop-blur-sm"
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
            className="absolute inset-0 p-8 lg:p-16 flex flex-col justify-center"
          >
            {/* Slide 1: Visão Geral */}
            {currentSlide === 0 && (
              <div className="space-y-12">
                <header className="text-center">
                  <h1 className="text-5xl lg:text-7xl font-serif font-bold mb-4">Visão Geral</h1>
                  <p className="text-2xl text-muted-foreground">Resumo Executivo em Tempo Real</p>
                </header>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <KPISlideCard title="Total de Clientes" value={totalClientes} icon={Users} color="text-primary" />
                  <KPISlideCard title="Conteúdos Contratados" value={totalContratado} icon={TrendingUp} color="text-primary" />
                  <KPISlideCard title="Conteúdos Entregues" value={totalEntregues} icon={CheckCircle2} color="text-green-500" />
                  <KPISlideCard title="Pendências" value={totalPendentes} icon={Clock} color="text-yellow-500" />
                  <KPISlideCard title="Clientes em Atraso" value={atrasadosCount} icon={AlertTriangle} color="text-red-500" />
                  <div className="bg-card rounded-3xl p-8 border border-border shadow-2xl flex flex-col items-center justify-center">
                    <h3 className="text-2xl font-bold mb-4">Status Geral</h3>
                    <div className="w-full h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                            {statusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || "#8884d8"} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Slide 2: Performance por Responsável */}
            {currentSlide === 1 && (
              <div className="space-y-8 h-full flex flex-col">
                <header className="text-center">
                  <h1 className="text-5xl lg:text-6xl font-serif font-bold mb-2">Performance por Responsável</h1>
                  <p className="text-xl text-muted-foreground">Entregas e Clientes por Membro da Equipe</p>
                </header>
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                  <div className="bg-card rounded-3xl p-8 border border-border shadow-2xl h-[500px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={porResponsavel} layout="vertical" margin={{ left: 100, right: 30 }}>
                        <XAxis type="number" hide />
                        <YAxis 
                          dataKey="responsavel" 
                          type="category" 
                          tick={{ fontSize: 18, fontWeight: 'bold' }} 
                          width={120}
                        />
                        <Tooltip />
                        <Bar dataKey="entregue" fill="#22c55e" radius={[0, 4, 4, 0]} name="Entregues" />
                        <Bar dataKey="pendentes" fill="#eab308" radius={[0, 4, 4, 0]} name="Pendentes" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-4 overflow-auto max-h-[600px] pr-4">
                    {porResponsavel.map((r, i) => (
                      <div key={r.responsavel} className="bg-card p-6 rounded-2xl border border-border flex items-center justify-between shadow-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                            {i + 1}
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold">{r.responsavel}</h3>
                            <p className="text-muted-foreground">{r.clientes} clientes ativos</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold text-green-500">{r.entregue}</div>
                          <div className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Entregas</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Slide 3: Status Geral dos Clientes */}
            {currentSlide === 2 && (
              <div className="space-y-8 h-full flex flex-col">
                <header className="text-center">
                  <h1 className="text-5xl lg:text-6xl font-serif font-bold mb-2">Status dos Clientes</h1>
                  <p className="text-xl text-muted-foreground">Monitoramento Geral de Saúde dos Contratos</p>
                </header>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-hidden p-2">
                  {summaries.slice(0, 12).map((c) => (
                    <div key={c.cliente} className={`p-6 rounded-3xl border-2 shadow-xl bg-card flex flex-col justify-between transition-all ${
                      c.status === "Atrasado" ? "border-red-500/50" : 
                      c.status === "Concluído" ? "border-green-500/50" : "border-border"
                    }`}>
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="text-xl font-bold leading-tight">{c.cliente}</h3>
                          <StatusBadge status={c.status} />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Progresso</span>
                            <span className="font-bold">{c.progresso}%</span>
                          </div>
                          <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-1000 ${
                                c.progresso === 100 ? "bg-green-500" : 
                                c.status === "Atrasado" ? "bg-red-500" : "bg-primary"
                              }`}
                              style={{ width: `${c.progresso}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="mt-6 flex justify-between items-end">
                        <div>
                          <p className="text-[10px] uppercase text-muted-foreground font-bold">Responsável</p>
                          <p className="font-semibold">{c.responsavel}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] uppercase text-muted-foreground font-bold">Entrega</p>
                          <p className="font-bold text-lg">{c.totalEntregues}/{c.totalItems}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {summaries.length > 12 && (
                    <div className="flex items-center justify-center text-muted-foreground italic">
                      + {summaries.length - 12} outros clientes...
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Slide 4: Produção por Tipo de Conteúdo */}
            {currentSlide === 3 && (
              <div className="space-y-12 h-full flex flex-col">
                <header className="text-center">
                  <h1 className="text-5xl lg:text-6xl font-serif font-bold mb-2">Produção por Tipo</h1>
                  <p className="text-xl text-muted-foreground">Stories vs Reels: Desempenho de Produção</p>
                </header>
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                  <div className="bg-card rounded-3xl p-12 border border-border shadow-2xl h-[500px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={productionData}>
                        <XAxis dataKey="name" tick={{ fontSize: 24, fontWeight: 'bold' }} />
                        <YAxis tick={{ fontSize: 18 }} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: 20, paddingTop: 20 }} />
                        <Bar dataKey="contratado" fill="hsl(var(--primary))" name="Contratado" radius={[10, 10, 0, 0]} />
                        <Bar dataKey="entregue" fill="#22c55e" name="Entregue" radius={[10, 10, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-8">
                    {productionData.map(item => {
                      const perc = item.contratado > 0 ? Math.round((item.entregue / item.contratado) * 100) : 0;
                      return (
                        <div key={item.name} className="bg-card p-10 rounded-3xl border border-border shadow-2xl">
                          <h3 className="text-4xl font-bold mb-6 flex justify-between items-center">
                            {item.name}
                            <span className="text-primary">{perc}%</span>
                          </h3>
                          <div className="grid grid-cols-2 gap-8 text-center">
                            <div>
                              <p className="text-sm uppercase text-muted-foreground font-bold mb-2">Entregues</p>
                              <p className="text-6xl font-bold text-green-500">{item.entregue}</p>
                            </div>
                            <div>
                              <p className="text-sm uppercase text-muted-foreground font-bold mb-2">Restantes</p>
                              <p className="text-6xl font-bold text-yellow-500">{item.contratado - item.entregue}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Slide 5: Alertas e Pendências */}
            {currentSlide === 4 && (
              <div className="space-y-8 h-full flex flex-col bg-red-500/5 -m-8 lg:-m-16 p-8 lg:p-16">
                <header className="text-center">
                  <h1 className="text-5xl lg:text-7xl font-serif font-bold text-red-600 mb-4 flex items-center justify-center gap-4">
                    <AlertTriangle className="w-16 h-16 animate-pulse" />
                    Alertas e Pendências
                    <AlertTriangle className="w-16 h-16 animate-pulse" />
                  </h1>
                  <p className="text-2xl text-red-600/80 font-bold uppercase tracking-widest">Atenção Prioritária</p>
                </header>
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-12 overflow-hidden">
                  <div className="space-y-6">
                    <h2 className="text-3xl font-bold border-b-4 border-red-500 pb-2 mb-6">Clientes Atrasados</h2>
                    <div className="space-y-4 overflow-auto max-h-[500px] pr-4">
                      {summaries.filter(c => c.status === "Atrasado").map(c => (
                        <div key={c.cliente} className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border-4 border-red-500 shadow-2xl flex items-center justify-between">
                          <div>
                            <h3 className="text-3xl font-black text-red-600">{c.cliente}</h3>
                            <p className="text-lg font-bold text-muted-foreground">Responsável: {c.responsavel}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-4xl font-black text-red-600">{c.totalItems - c.totalEntregues}</div>
                            <div className="text-sm font-bold uppercase">Pendências</div>
                          </div>
                        </div>
                      ))}
                      {summaries.filter(c => c.status === "Atrasado").length === 0 && (
                        <div className="bg-green-100 p-12 rounded-3xl border-4 border-green-500 text-center">
                          <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
                          <h3 className="text-3xl font-bold text-green-800">Nenhum cliente em atraso!</h3>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-6">
                    <h2 className="text-3xl font-bold border-b-4 border-yellow-500 pb-2 mb-6">Próximos Prazos</h2>
                    <div className="space-y-4 overflow-auto max-h-[500px] pr-4">
                      {rows.filter(r => r.statusGeral !== "Concluído" && r.prazoFinal).sort((a, b) => a.prazoFinal.localeCompare(b.prazoFinal)).slice(0, 8).map(r => (
                        <div key={r.id} className="bg-card p-6 rounded-2xl border-2 border-yellow-500 shadow-xl flex items-center justify-between">
                          <div>
                            <h3 className="text-xl font-bold">{r.cliente}</h3>
                            <p className="text-sm text-muted-foreground">{r.tipoConteudo}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-yellow-600">{new Date(r.prazoFinal).toLocaleDateString("pt-BR")}</div>
                            <div className="text-[10px] font-bold uppercase">Prazo Final</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
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

      {/* Footer / Slide Indicator */}
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
