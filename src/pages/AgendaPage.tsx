import React, { useState, useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useRecordings, Recording, RecordingStatus, RecordingPriority, RecordingFrequency, ClientRecordingStatus } from "@/data/RecordingContext";
import { useData } from "@/data/DataContext";
import { Calendar as CalendarIcon, List, Plus, ChevronLeft, ChevronRight, Edit2, Trash2, Save, X, AlertCircle, CheckCircle2, Video, Clock, Info } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday, parseISO } from "date-fns";
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
  const { summaries } = useData();
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecording, setEditingRecording] = useState<Recording | null>(null);

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

  // Calendar Logic
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getDayRecordings = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return recordings.filter(r => r.date === dateStr);
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

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <div className="bg-muted rounded-lg p-1 flex items-center">
              <Button 
                variant={view === "calendar" ? "secondary" : "ghost"} 
                size="sm" 
                onClick={() => setView("calendar")}
                className="px-3"
              >
                <CalendarIcon className="w-4 h-4 mr-2" />
                Calendário
              </Button>
              <Button 
                variant={view === "list" ? "secondary" : "ghost"} 
                size="sm" 
                onClick={() => setView("list")}
                className="px-3"
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
                            className={`text-[10px] p-1 rounded border truncate shadow-sm transition-transform hover:scale-[1.02] ${
                              rec.priority === "Urgente" ? "bg-red-50 border-red-200 text-red-700" : 
                              rec.priority === "Atenção" ? "bg-yellow-50 border-yellow-200 text-yellow-700" : 
                              "bg-green-50 border-green-200 text-green-700"
                            }`}
                          >
                            <span className="font-bold">{rec.clientName}</span>
                            <div className="flex justify-between opacity-80">
                              <span>{rec.topic || "Sem tema"}</span>
                              <span>{rec.recordedVideos}/{rec.plannedVideos}</span>
                            </div>
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
