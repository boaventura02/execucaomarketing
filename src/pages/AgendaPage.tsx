import React, { useState, useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useRecordings, Recording, RecordingStatus, RecordingPriority, RecordingFrequency, ClientRecordingStatus } from "@/data/RecordingContext";
import { useData } from "@/data/DataContext";
import { Calendar as CalendarIcon, List, Plus, ChevronLeft, ChevronRight, Edit2, Trash2, Save, X, AlertCircle, CheckCircle2, Video, Clock, Info } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday, parseISO, startOfWeek, endOfWeek, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const AgendaPage = () => {
  const { recordings, clientSettings, addRecording, updateRecording, deleteRecording, updateClientSettings, getProductionStats } = useRecordings();
  const { summaries, updateRow, rows } = useData();
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCompletionDialogOpen, setIsCompletionDialogOpen] = useState(false);
  const [recordingToComplete, setRecordingToComplete] = useState<Recording | null>(null);
  const [editingRecording, setEditingRecording] = useState<Recording | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    clientName: "",
    date: format(new Date(), "yyyy-MM-dd"),
    plannedVideos: 1,
    recordedVideos: 0,
    topic: "",
    status: "Agendado" as RecordingStatus,
    priority: "OK" as RecordingPriority,
    scriptStatus: "Pendente"
  });


  const resetForm = () => {
    setFormData({
      clientName: "",
      date: format(selectedDate || new Date(), "yyyy-MM-dd"),
      plannedVideos: 1,
      recordedVideos: 0,
      topic: "",
      status: "Agendado",
      priority: "OK",
      scriptStatus: "Pendente"
    });
    setEditingRecording(null);
  };

  const handleAddRecording = () => {
    if (!formData.clientName) return;
    addRecording({
      ...formData,
      clientId: formData.clientName
    });
    setIsDialogOpen(false);
    resetForm();
  };

  const handleUpdateRecording = () => {
    if (!editingRecording) return;
    updateRecording(editingRecording.id, formData);
    setIsDialogOpen(false);
    resetForm();
  };

  const handleEditClick = (recording: Recording) => {
    setEditingRecording(recording);
    setFormData({
      clientName: recording.clientName,
      date: recording.date,
      plannedVideos: recording.plannedVideos,
      recordedVideos: recording.recordedVideos,
      topic: recording.topic,
      status: recording.status,
      priority: recording.priority,
      scriptStatus: recording.scriptStatus
    });
    setIsDialogOpen(true);
  };

  const handleCompleteRecording = (recording: Recording) => {
    setRecordingToComplete(recording);
    setFormData({
      ...formData,
      recordedVideos: recording.plannedVideos || 0
    });
    setIsCompletionDialogOpen(true);
  };

  const confirmCompletion = () => {
    if (!recordingToComplete) return;
    updateRecording(recordingToComplete.id, {
      status: "Concluído",
      recordedVideos: formData.recordedVideos
    });

    // Update the "spreadsheet" (DataContext)
    // Find the "Gravação Presencial" or "Reels" row for this client
    const clientRows = rows.filter(r => r.cliente === recordingToComplete.clientName);
    const targetRow = clientRows.find(r => 
      r.tipoConteudo.toLowerCase().includes("gravação") || 
      r.tipoConteudo.toLowerCase().includes("reels")
    ) || clientRows[0];

    if (targetRow) {
      const currentVideos = targetRow.videosGravados || 0;
      updateRow(targetRow.id, {
        videosGravados: currentVideos + formData.recordedVideos,
        statusEntrega: "Concluído"
      });
    }

    setIsCompletionDialogOpen(false);
    setRecordingToComplete(null);
  };


  // Calendar Logic
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getDayRecordings = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return recordings.filter(r => r.date === dateStr && (
      !searchTerm || 
      r.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.topic && r.topic.toLowerCase().includes(searchTerm.toLowerCase()))
    ));
  };


  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  // Sort and Filter Logic for List View
  const sortedClients = useMemo(() => {
    return summaries
      .filter(s => !s.congelado) // Only active clients
      .map(client => {
        const stats = getProductionStats(client.cliente);
        const settings = clientSettings[client.cliente];
        const nextRecording = recordings
          .filter(r => r.clientName === client.cliente && r.status === "Agendado")
          .sort((a, b) => a.date.localeCompare(b.date))[0];
        
        // Priority Score
        let priorityScore = 0;
        if (settings?.status === "Sem conteúdo") priorityScore = 100;
        else if (!stats.isFinished) priorityScore = 50;
        else if (nextRecording) priorityScore = 20;

        return {
          ...client,
          stats,
          settings,
          nextRecording,
          priorityScore
        };
      })
      .sort((a, b) => b.priorityScore - a.priorityScore);
  }, [summaries, recordings, clientSettings, getProductionStats]);

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold font-serif italic">Agenda de Gravações</h2>
            <p className="text-muted-foreground text-sm">Gestão inteligente de produção de vídeos</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Input
                placeholder="Pesquisar cliente ou tema..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
              <Info className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            </div>

            <div className="bg-muted rounded-lg p-1 flex items-center w-full sm:w-auto">
              <Button 
                variant={view === "calendar" ? "secondary" : "ghost"} 
                size="sm" 
                onClick={() => setView("calendar")}
                className="flex-1 sm:flex-none px-3"
              >
                <CalendarIcon className="w-4 h-4 mr-2" />
                Calendário
              </Button>
              <Button 
                variant={view === "list" ? "secondary" : "ghost"} 
                size="sm" 
                onClick={() => setView("list")}
                className="flex-1 sm:flex-none px-3"
              >
                <List className="w-4 h-4 mr-2" />
                Lista
              </Button>
            </div>


            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Gravação
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>{editingRecording ? "Editar Gravação" : "Agendar Nova Gravação"}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Cliente</Label>
                    <Select 
                      value={formData.clientName} 
                      onValueChange={(v) => setFormData({...formData, clientName: v})}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Selecione o cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {summaries.filter(s => !s.congelado).map(s => (
                          <SelectItem key={s.cliente} value={s.cliente}>{s.cliente}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Data</Label>
                    <Input 
                      type="date" 
                      className="col-span-3" 
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Vídeos Planejados</Label>
                    <Input 
                      type="number" 
                      className="col-span-3" 
                      value={formData.plannedVideos}
                      onChange={(e) => setFormData({...formData, plannedVideos: parseInt(e.target.value) || 0})}
                    />
                  </div>

                  {formData.status === "Concluído" && (
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">Vídeos Gravados</Label>
                      <Input 
                        type="number" 
                        className="col-span-3" 
                        value={formData.recordedVideos}
                        onChange={(e) => setFormData({...formData, recordedVideos: parseInt(e.target.value) || 0})}
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Tema</Label>
                    <Input 
                      className="col-span-3" 
                      placeholder="Ex: Coleção de Verão" 
                      value={formData.topic}
                      onChange={(e) => setFormData({...formData, topic: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Status</Label>
                    <Select 
                      value={formData.status} 
                      onValueChange={(v: RecordingStatus) => setFormData({...formData, status: v})}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Agendado">Agendado</SelectItem>
                        <SelectItem value="Concluído">Concluído</SelectItem>
                        <SelectItem value="Cancelado">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Prioridade</Label>
                    <Select 
                      value={formData.priority} 
                      onValueChange={(v: RecordingPriority) => setFormData({...formData, priority: v})}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OK">🟢 OK</SelectItem>
                        <SelectItem value="Atenção">🟡 Atenção</SelectItem>
                        <SelectItem value="Urgente">🔴 Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                  <Button onClick={editingRecording ? handleUpdateRecording : handleAddRecording}>
                    {editingRecording ? "Salvar Alterações" : "Agendar"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isCompletionDialogOpen} onOpenChange={setIsCompletionDialogOpen}>
              <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    Concluir Gravação
                  </DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="text-sm text-muted-foreground">
                    Você está concluindo a gravação de <span className="font-bold text-foreground">{recordingToComplete?.clientName}</span>.
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Vídeos Gravados</Label>
                    <Input 
                      type="number" 
                      className="col-span-3" 
                      value={formData.recordedVideos}
                      onChange={(e) => setFormData({...formData, recordedVideos: parseInt(e.target.value) || 0})}
                      autoFocus
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground italic text-center">
                    Este valor será somado ao total de produção mensal do cliente.
                  </p>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCompletionDialogOpen(false)}>Voltar</Button>
                  <Button className="bg-green-600 hover:bg-green-700" onClick={confirmCompletion}>
                    Confirmar e Concluir
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>


        {/* Weekly Board - Trello Style */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Quadro de Produção Semanal
            </h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
            {eachDayOfInterval({
              start: startOfWeek(new Date(), { weekStartsOn: 0 }),
              end: endOfWeek(new Date(), { weekStartsOn: 0 })
            }).map((day, index) => {
              const dayRecs = getDayRecordings(day);
              const isDayToday = isToday(day);
              
              return (
                <div key={index} className="flex flex-col gap-3 min-w-[150px]">
                  <div className={`p-2 rounded-t-lg border-b-2 text-center ${isDayToday ? "bg-primary text-primary-foreground border-primary" : "bg-muted/50 text-muted-foreground border-muted"}`}>
                    <p className="text-[10px] uppercase font-bold tracking-wider leading-none">
                      {format(day, "EEEE", { locale: ptBR })}
                    </p>
                    <p className="text-sm font-bold">
                      {format(day, "dd/MM")}
                    </p>
                  </div>
                  
                  <div className="flex flex-col gap-2 min-h-[100px]">
                    {dayRecs.length === 0 ? (
                      <div className="flex-1 flex items-center justify-center border-2 border-dashed border-muted/50 rounded-b-lg p-2">
                        <span className="text-[10px] text-muted-foreground italic text-center">Nenhum agendamento</span>
                      </div>
                    ) : (
                      dayRecs.map(rec => (
                        <Card 
                          key={rec.id} 
                          className={`border-l-4 shadow-sm hover:shadow-md transition-all ${
                            rec.status === "Concluído" ? "border-l-green-500 bg-green-50/30 opacity-70" :
                            rec.priority === "Urgente" ? "border-l-red-500 bg-red-50/30" : 
                            rec.priority === "Atenção" ? "border-l-yellow-500 bg-yellow-50/30" : 
                            "border-l-blue-500 bg-blue-50/30"
                          }`}
                        >
                          <div className="p-2 space-y-2">
                            <div className="flex justify-between items-start gap-1">
                              <span className={`text-[11px] font-bold leading-tight ${rec.status === "Concluído" ? "line-through" : ""}`}>
                                {rec.clientName}
                              </span>
                              <div className="flex gap-0.5 shrink-0">
                                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleEditClick(rec)}>
                                  <Edit2 className="w-2.5 h-2.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive" onClick={() => deleteRecording(rec.id)}>
                                  <Trash2 className="w-2.5 h-2.5" />
                                </Button>
                              </div>
                            </div>
                            
                            <p className="text-[10px] text-muted-foreground italic line-clamp-2">
                              {rec.topic || "Sem tema"}
                            </p>
                            
                            <div className="flex items-center justify-between gap-1 pt-1">
                              <span className="text-[9px] font-medium flex items-center gap-0.5">
                                <Video className="w-3 h-3" />
                                {rec.recordedVideos}/{rec.plannedVideos}
                              </span>
                              
                              {rec.status !== "Concluído" && (
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="h-6 w-6 p-0 bg-green-600 text-white hover:bg-green-700 rounded-full"
                                  onClick={() => handleCompleteRecording(rec)}
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {view === "calendar" ? (

          <Card className="border-sidebar-border shadow-sm overflow-hidden">
            <CardHeader className="bg-sidebar/50 border-b py-3 flex flex-row items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={prevMonth}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <h3 className="text-lg font-semibold capitalize">
                  {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
                </h3>
                <Button variant="outline" size="icon" onClick={nextMonth}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(new Date())}>
                Hoje
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-7 border-b bg-muted/30">
                {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(day => (
                  <div key={day} className="py-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 auto-rows-[120px]">
                {/* Empty cells for padding */}
                {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                  <div key={`empty-${i}`} className="border-r border-b bg-muted/10" />
                ))}
                
                {days.map(day => {
                  const dayRecordings = getDayRecordings(day);
                  const isCurrentToday = isToday(day);
                  
                  return (
                    <div 
                      key={day.toISOString()} 
                      className={`border-r border-b p-1 overflow-y-auto hover:bg-muted/5 transition-colors cursor-pointer relative ${isCurrentToday ? "bg-primary/5" : ""}`}
                      onClick={() => {
                        setSelectedDate(day);
                        setFormData(prev => ({ ...prev, date: format(day, "yyyy-MM-dd") }));
                        setIsDialogOpen(true);
                      }}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${isCurrentToday ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
                          {format(day, "d")}
                        </span>
                        {dayRecordings.length > 0 && (
                          <span className="text-[10px] bg-primary/10 text-primary px-1 rounded font-bold">
                            {dayRecordings.length}
                          </span>
                        )}
                      </div>
                      <div className="space-y-1">
                        {dayRecordings.map(rec => (
                          <div 
                            key={rec.id} 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditClick(rec);
                            }}
                            className={`group relative text-[10px] p-1 rounded border truncate shadow-sm transition-transform hover:scale-[1.02] ${
                              rec.status === "Concluído" ? "bg-slate-50 border-slate-200 text-slate-500" :
                              rec.priority === "Urgente" ? "bg-red-50 border-red-200 text-red-700" : 
                              rec.priority === "Atenção" ? "bg-yellow-50 border-yellow-200 text-yellow-700" : 
                              "bg-green-50 border-green-200 text-green-700"
                            }`}
                          >
                            <div className="flex items-center gap-1">
                              {rec.status === "Concluído" && <CheckCircle2 className="w-2.5 h-2.5 text-green-600 shrink-0" />}
                              <span className={`font-bold truncate ${rec.status === "Concluído" ? "line-through opacity-60" : ""}`}>
                                {rec.clientName}
                              </span>
                            </div>
                            <div className="flex justify-between opacity-80">
                              <span className="truncate">{rec.topic || "Sem tema"}</span>
                              <span>{rec.recordedVideos}/{rec.plannedVideos}</span>
                            </div>
                            
                            {rec.status !== "Concluído" && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCompleteRecording(rec);
                                }}
                                className="absolute -right-1 -top-1 bg-green-600 text-white rounded-full p-0.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ))}

                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* List View - Strategic Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               {/* Quick Stats */}
               <Card className="bg-red-50 border-red-200">
                 <CardHeader className="py-3">
                   <CardTitle className="text-sm font-medium text-red-700 flex items-center">
                     <AlertCircle className="w-4 h-4 mr-2" />
                     Sem Conteúdo
                   </CardTitle>
                 </CardHeader>
                 <CardContent>
                   <div className="text-2xl font-bold text-red-800">
                     {Object.values(clientSettings).filter(s => s.status === "Sem conteúdo").length}
                   </div>
                 </CardContent>
               </Card>
               <Card className="bg-yellow-50 border-yellow-200">
                 <CardHeader className="py-3">
                   <CardTitle className="text-sm font-medium text-yellow-700 flex items-center">
                     <Clock className="w-4 h-4 mr-2" />
                     Produção Pendente
                   </CardTitle>
                 </CardHeader>
                 <CardContent>
                   <div className="text-2xl font-bold text-yellow-800">
                     {sortedClients.filter(c => !c.stats.isFinished).length}
                   </div>
                 </CardContent>
               </Card>
               <Card className="bg-green-50 border-green-200">
                 <CardHeader className="py-3">
                   <CardTitle className="text-sm font-medium text-green-700 flex items-center">
                     <CheckCircle2 className="w-4 h-4 mr-2" />
                     Produção Concluída
                   </CardTitle>
                 </CardHeader>
                 <CardContent>
                   <div className="text-2xl font-bold text-green-800">
                     {sortedClients.filter(c => c.stats.isFinished).length}
                   </div>
                 </CardContent>
               </Card>
            </div>

            <Card className="border-sidebar-border shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-sidebar/50 text-muted-foreground font-medium border-b">
                    <tr>
                      <th className="px-4 py-3">Cliente</th>
                      <th className="px-4 py-3">Próxima Gravação</th>
                      <th className="px-4 py-3">Frequência</th>
                      <th className="px-4 py-3 text-center">Contratado</th>
                      <th className="px-4 py-3 text-center">Produzido</th>
                      <th className="px-4 py-3 text-center">Saldo</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {sortedClients.map(client => (
                      <tr 
                        key={client.cliente} 
                        className={`hover:bg-muted/30 transition-colors ${client.settings?.status === "Sem conteúdo" ? "bg-red-50/50" : ""}`}
                      >
                        <td className="px-4 py-3">
                          <div className="font-semibold flex items-center gap-2">
                            {client.cliente}
                            {client.settings?.status === "Sem conteúdo" && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <AlertCircle className="w-4 h-4 text-red-500 animate-pulse" />
                                  </TooltipTrigger>
                                  <TooltipContent>Cliente sem conteúdo — agendar urgente!</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                          <div className="text-[10px] text-muted-foreground">Resp: {client.responsavel}</div>
                        </td>
                        <td className="px-4 py-3">
                          {client.nextRecording ? (
                            <div className="flex flex-col">
                              <span className="font-medium">{format(parseISO(client.nextRecording.date), "dd/MM/yyyy")}</span>
                              <span className="text-[10px] text-muted-foreground">{client.nextRecording.topic}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground italic">Não agendado</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Select 
                            value={client.settings?.frequency || "Quinzenal"}
                            onValueChange={(v: RecordingFrequency) => updateClientSettings(client.cliente, { frequency: v })}
                          >
                            <SelectTrigger className="h-7 w-32 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Semanal">Semanal</SelectItem>
                              <SelectItem value="Quinzenal">Quinzenal</SelectItem>
                              <SelectItem value="Mensal">Mensal</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-4 py-3 text-center font-medium">{client.stats.contracted}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant="secondary" className="font-bold">
                            {client.stats.recorded}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {client.stats.excess > 0 ? (
                            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200">
                              +{client.stats.excess} Excedente
                            </Badge>
                          ) : (
                            <span className={`font-bold ${client.stats.remaining > 0 ? "text-orange-600" : "text-green-600"}`}>
                              {client.stats.remaining}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <Badge variant={client.stats.isFinished ? "default" : "outline"} className={client.stats.isFinished ? "bg-green-100 text-green-700 hover:bg-green-100 border-green-200" : ""}>
                              {client.stats.isFinished ? "Produção Concluída" : "Em Produção"}
                            </Badge>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className={`h-6 text-[10px] px-2 ${client.settings?.status === "Sem conteúdo" ? "bg-red-100 text-red-700 hover:bg-red-200" : "text-muted-foreground"}`}
                              onClick={() => updateClientSettings(client.cliente, { status: client.settings?.status === "Sem conteúdo" ? "Normal" : "Sem conteúdo" })}
                            >
                              {client.settings?.status === "Sem conteúdo" ? "Marcar como Normal" : "Marcar Sem Conteúdo"}
                            </Button>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="w-8 h-8"
                              onClick={() => {
                                setFormData(prev => ({ ...prev, clientName: client.cliente }));
                                setIsDialogOpen(true);
                              }}
                            >
                              <CalendarIcon className="w-3 h-3" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="w-8 h-8"
                              onClick={() => {
                                // Just open settings dialog or similar
                              }}
                            >
                              <Info className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default AgendaPage;
