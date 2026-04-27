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
      .filter(c => c.status === "Atrasado")
      .sort((a, b) => b.score - a.score);
  }, [summaries]);
  // Max 3 responsibles per slide
  const responsiblesChunks = useMemo(() => {
    const chunks = [];
    for (let i = 0; i < porResponsavel.length; i += 3) {
      chunks.push(porResponsavel.slice(i, i + 3));
    }
    return chunks.length > 0 ? chunks : [[]];
  }, [porResponsavel]);

  // Max 4 clients per slide
  const clientsChunks = useMemo(() => {
    const chunks = [];
    for (let i = 0; i < allPrioridade.length; i += 4) {
      chunks.push(allPrioridade.slice(i, i + 4));
    }
    return chunks.length > 0 ? chunks : [[]];
  }, [allPrioridade]);

  const totalSlides = 1 + responsiblesChunks.length + clientsChunks.length;

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
    <div className="fixed inset-0 z-[100] bg-background flex flex-col overflow-hidden text-foreground select-none">
      {/* Top Controls */}
      <div className="absolute top-[2vh] right-[2vw] flex gap-[1vw] z-[110]">
        <button
          onClick={onExit}
          className="flex items-center gap-[0.5vw] px-[1.5vw] py-[1vh] bg-card border border-border shadow-lg rounded-full hover:bg-muted transition-all"
        >
          <ArrowLeft className="w-[1.5vw] h-[1.5vw]" />
          <span className="text-[1.2vh] font-bold uppercase tracking-wider">Voltar</span>
        </button>
        <button
          onClick={() => setIsPaused((p) => !p)}
          className={`flex items-center gap-[0.5vw] px-[1.5vw] py-[1vh] border shadow-lg rounded-full transition-all ${
            isPaused ? "bg-yellow-500 text-white border-yellow-600 animate-pulse" : "bg-card border-border hover:bg-muted"
          }`}
        >
          {isPaused ? <Play className="w-[1.5vw] h-[1.5vw]" /> : <Pause className="w-[1.5vw] h-[1.5vw]" />}
          <span className="text-[1.2vh] font-bold uppercase tracking-wider">{isPaused ? "Pausado" : "Pausar"}</span>
        </button>
        <button
          onClick={toggleFullscreen}
          className="p-[1vh] bg-card border border-border shadow-lg rounded-full hover:bg-muted transition-all"
        >
          {isFullscreen ? <Minimize2 className="w-[1.5vw] h-[1.5vw]" /> : <Maximize2 className="w-[1.5vw] h-[1.5vw]" />}
        </button>
        <button
          onClick={onExit}
          className="p-[1vh] bg-destructive text-destructive-foreground border border-destructive shadow-lg rounded-full hover:bg-destructive/90 transition-all"
        >
          <X className="w-[1.5vw] h-[1.5vw]" />
        </button>
      </div>

      {/* Side Navigation */}
      <button
        onClick={() => setCurrentSlide((p) => (p - 1 + totalSlides) % totalSlides)}
        className="absolute left-[1vw] top-1/2 -translate-y-1/2 z-[110] p-[1vh] bg-card/80 border border-border shadow-xl rounded-full hover:bg-muted transition-all backdrop-blur-sm"
      >
        <ChevronLeft className="w-[2.5vw] h-[2.5vw]" />
      </button>
      <button
        onClick={() => setCurrentSlide((p) => (p + 1) % totalSlides)}
        className="absolute right-[1vw] top-1/2 -translate-y-1/2 z-[110] p-[1vh] bg-card/80 border border-border shadow-xl rounded-full hover:bg-muted transition-all backdrop-blur-sm"
      >
        <ChevronRight className="w-[2.5vw] h-[2.5vw]" />
      </button>

      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 p-[4vh] lg:p-[6vh] flex flex-col items-center justify-center overflow-hidden"
          >
            {/* Slide 1: Resumo Geral */}
            {currentSlide === 0 && (
              <div className="w-full max-w-[90vw] space-y-[4vh]">
                <header className="text-center">
                  <h1 className="text-[6vh] lg:text-[8vh] font-serif font-bold mb-[1vh]">Resumo Geral</h1>
                  <p className="text-[2.5vh] text-muted-foreground uppercase tracking-widest">Status Executivo da Operação</p>
                </header>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[2vw]">
                  <KPISlideCard title="Total de Clientes" value={`${totalClientes}`} icon={Users} color="text-primary" />
                  <KPISlideCard title="Total de Entregues (%)" value={`${totalEntreguesPercent}%`} icon={CheckCircle2} color="text-green-500" />
                  <KPISlideCard title="Total de Pendentes (%)" value={`${100 - totalEntreguesPercent}%`} icon={Clock} color="text-yellow-500" />
                  <KPISlideCard title="Total de Atrasados (%)" value={`${totalClientes > 0 ? Math.round((atrasadosCount / totalClientes) * 100) : 0}%`} icon={AlertTriangle} color="text-red-500" />
                </div>
                <div className="flex justify-center flex-1 min-h-0">
                  <div className="bg-card rounded-[3vh] p-[3vh] border border-border shadow-2xl flex flex-col items-center justify-center w-full max-w-[50vw] aspect-video">
                    <h3 className="text-[2.5vh] font-bold mb-[2vh]">Distribuição por Status</h3>
                    <div className="w-full h-full min-h-0 flex-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie 
                            data={statusData} 
                            cx="50%" 
                            cy="50%" 
                            innerRadius="60%" 
                            outerRadius="80%" 
                            paddingAngle={5} 
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {statusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || "#8884d8"} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ borderRadius: '1vh', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            formatter={(value: number) => [`${((value / totalClientes) * 100).toFixed(0)}%`, "Proporção"]} 
                          />
                          <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: '1.8vh', fontWeight: 'bold', paddingTop: '1vh' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Slides de Responsáveis (Dinâmico) */}
            {currentSlide >= 1 && currentSlide < 1 + responsiblesChunks.length && (
              <div className="w-full h-full flex flex-col items-center justify-center p-[2vh]">
                <header className="text-center mb-[4vh]">
                  <h1 className="text-[5vh] lg:text-[7vh] font-serif font-bold mb-[0.5vh]">Resumo por Responsável</h1>
                  <p className="text-[2vh] text-muted-foreground uppercase tracking-widest font-bold">Visão de Carteira • Página {currentSlide} de {responsiblesChunks.length}</p>
                </header>
                <div className="w-full flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[2vh] min-h-0 items-center justify-center">
                  {responsiblesChunks[currentSlide - 1]?.map((r) => {
                    const entreguesCount = summaries.filter(s => (s.responsavel || "Sem responsável") === r.responsavel && s.status === "Concluído").length;
                    const pendentesCount = summaries.filter(s => (s.responsavel || "Sem responsável") === r.responsavel && s.status === "Pendente").length;
                    const emAndamentoCount = summaries.filter(s => (s.responsavel || "Sem responsável") === r.responsavel && s.status === "Em andamento").length;
                    const revisaoCount = summaries.filter(s => (s.responsavel || "Sem responsável") === r.responsavel && s.status === "Revisão").length;
                    
                    return (
                      <div key={r.responsavel} className="bg-card p-[3vh] rounded-[3vh] border border-border shadow-xl flex flex-col gap-[2.5vh] h-full max-h-[35vh]">
                        <div className="flex items-center justify-between border-b border-border pb-[1.5vh]">
                          <h3 className="text-[2.5vh] font-black text-primary truncate max-w-[60%]">{r.responsavel}</h3>
                          <div className="bg-primary/10 px-[1.5vw] py-[0.5vh] rounded-full text-primary font-bold text-[1.5vh]">
                            {r.clientes} Clientes
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-[1.5vh] flex-1">
                          <StatusMiniCard label="Entregues" value={entreguesCount} color="green" />
                          <StatusMiniCard label="Atrasados" value={r.atrasados} color="red" />
                          <StatusMiniCard label="Pendentes" value={pendentesCount} color="yellow" />
                          <StatusMiniCard label="Em Curso" value={emAndamentoCount + revisaoCount} color="blue" />
                        </div>

                        <div className="mt-auto pt-[1vh]">
                          <div className="flex justify-between text-[1.2vh] font-bold mb-[0.5vh] uppercase tracking-wider text-muted-foreground">
                            <span>Progresso</span>
                            <span>{r.contratado > 0 ? Math.round((r.entregue / r.contratado) * 100) : 0}%</span>
                          </div>
                          <div className="h-[1vh] bg-muted rounded-full overflow-hidden border border-border">
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

            {/* Slides de Clientes em Atraso (Dinâmico) */}
            {currentSlide >= 1 + responsiblesChunks.length && (
              <div className="w-full h-full flex flex-col items-center justify-center p-[2vh]">
                <header className="text-center mb-[4vh]">
                  <h1 className="text-[5vh] lg:text-[7vh] font-serif font-bold text-red-600 flex items-center justify-center gap-[2vw]">
                    <AlertTriangle className="w-[6vh] h-[6vh] animate-pulse" />
                    Clientes em Atraso
                    <AlertTriangle className="w-[6vh] h-[6vh] animate-pulse" />
                  </h1>
                  <p className="text-[2vh] text-red-600/80 font-bold uppercase tracking-widest mt-[1vh]">
                    Página {currentSlide - responsiblesChunks.length} de {clientsChunks.length}
                  </p>
                </header>

                <div className="w-full flex-1 grid grid-cols-1 lg:grid-cols-2 gap-[3vh] min-h-0 items-center">
                  {clientsChunks[currentSlide - 1 - responsiblesChunks.length]?.length === 0 ? (
                    <div className="lg:col-span-2 flex items-center justify-center">
                      <div className="bg-green-100 dark:bg-green-950/30 p-[8vh] rounded-[4vh] border-[0.5vh] border-green-500 text-center">
                        <CheckCircle2 className="w-[10vh] h-[10vh] text-green-600 mx-auto mb-[3vh]" />
                        <h3 className="text-[4vh] font-bold text-green-800 dark:text-green-300">
                          Tudo em dia!
                        </h3>
                      </div>
                    </div>
                  ) : (
                    clientsChunks[currentSlide - 1 - responsiblesChunks.length]?.map((c, idx) => {
                      return (
                        <div
                          key={c.cliente}
                          className="bg-card p-[3vh] rounded-[3vh] border-[0.3vh] border-red-500 shadow-2xl flex flex-col gap-[2vh] h-full max-h-[35vh]"
                        >
                          <div className="flex items-center gap-[1.5vw]">
                            <div className="w-[6vh] h-[6vh] shrink-0 rounded-full bg-red-600 text-white flex items-center justify-center font-black text-[3vh] shadow-lg">
                              {((currentSlide - 1 - responsiblesChunks.length) * 4) + idx + 1}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="text-[3vh] font-black truncate">{c.cliente}</h3>
                              <p className="text-[1.8vh] font-bold text-red-600 uppercase tracking-widest">{c.responsavel}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-[1.5vw] py-[1vh] border-y border-border">
                            <MiniInfo label="Total" value={c.totalItems} />
                            <MiniInfo label="Entregue" value={c.totalEntregues} />
                            <MiniInfo label="Pendente" value={c.pendentes} />
                          </div>

                          {c.localObservacoes && c.localObservacoes.length > 0 && (
                            <div className="bg-muted/50 p-[1.5vh] rounded-[1.5vh] border-l-[0.5vh] border-red-500 flex-1 min-h-0 overflow-hidden">
                              <p className="text-[1.4vh] font-bold text-muted-foreground uppercase mb-[0.5vh]">Observações:</p>
                              <div className="text-[1.6vh] italic text-foreground line-clamp-3">
                                {c.localObservacoes.map((obs: any) => obs.text).join(" | ")}
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
      <div className="h-[1vh] bg-muted w-full relative">
        <motion.div 
          className="h-full bg-primary"
          initial={{ width: "0%" }}
          animate={{ width: isPaused ? "0%" : "100%" }}
          transition={{ duration: SLIDE_DURATION / 1000, ease: "linear", repeat: Infinity }}
          key={`${currentSlide}-${isPaused}`}
        />
      </div>

      {/* Footer */}
      <footer className="h-[10vh] border-t border-border flex items-center justify-between px-[4vw] bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-[1vw]">
          <img src={logo} alt="Logo" className="h-[5vh] opacity-50" />
          <p className="text-[1.5vh] font-bold text-muted-foreground uppercase tracking-widest">Execução Marketing • Dashboard TV</p>
        </div>
        <div className="flex gap-[0.8vw]">
          {Array.from({ length: totalSlides }).map((_, i) => (
            <div 
              key={i} 
              className={`h-[1.5vh] w-[1.5vh] rounded-full transition-all duration-300 ${i === currentSlide ? "bg-primary scale-150" : "bg-muted"}`} 
            />
          ))}
        </div>
        <div className="text-[1.5vh] font-bold text-muted-foreground uppercase tracking-widest">
          {new Date().toLocaleDateString("pt-BR", { weekday: 'long', day: '2-digit', month: 'long' })}
        </div>
      </footer>
    </div>
  );
}

function KPISlideCard({ title, value, icon: Icon, color }: { title: string, value: string | number, icon: any, color: string }) {
  return (
    <div className="bg-card rounded-[3vh] p-[4vh] border border-border shadow-2xl hover:border-primary/50 transition-all group">
      <div className="flex items-start justify-between mb-[3vh]">
        <div className={`p-[1.5vh] rounded-[1.5vh] bg-muted group-hover:bg-primary/10 transition-colors`}>
          <Icon className={`w-[4vh] h-[4vh] ${color}`} />
        </div>
      </div>
      <div>
        <p className="text-[1.8vh] font-bold text-muted-foreground uppercase tracking-wider mb-[1vh]">{title}</p>
        <p className="text-[7vh] font-black leading-none">{value}</p>
      </div>
    </div>
  );
}

function StatusMiniCard({ label, value, color }: { label: string, value: number, color: 'green' | 'red' | 'yellow' | 'blue' }) {
  const colors = {
    green: "bg-green-500/10 border-green-500/20 text-green-500 text-green-600/70",
    red: "bg-red-500/10 border-red-500/20 text-red-500 text-red-600/70",
    yellow: "bg-yellow-500/10 border-yellow-500/20 text-yellow-500 text-yellow-600/70",
    blue: "bg-blue-500/10 border-blue-500/20 text-blue-500 text-blue-600/70",
  };
  const [bg, border, text, labelCol] = colors[color].split(' ');
  
  return (
    <div className={`${bg} p-[1.5vh] rounded-[2vh] border ${border} text-center flex flex-col justify-center`}>
      <div className={`text-[3.5vh] font-black ${text}`}>{value}</div>
      <div className={`text-[1vh] font-bold uppercase tracking-widest ${labelCol}`}>{label}</div>
    </div>
  );
}

function MiniInfo({ label, value }: { label: string, value: number }) {
  return (
    <div className="text-center">
      <div className="text-[1.2vh] font-bold text-muted-foreground uppercase tracking-widest mb-[0.5vh]">{label}</div>
      <div className="text-[2.5vh] font-black">{value}</div>
    </div>
  );
}
