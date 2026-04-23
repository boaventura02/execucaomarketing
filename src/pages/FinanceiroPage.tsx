import React, { useState, useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useData, Transaction, TransactionType, PaymentMethod, PaymentType, TransactionStatus } from "@/data/DataContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Pencil, Wallet, TrendingUp, TrendingDown, DollarSign, Filter, MoreHorizontal, Calendar as CalendarIcon, Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { format, subMonths, isWithinInterval, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from "recharts";
import { toast } from "@/hooks/use-toast";

export default function FinanceiroPage() {
  const { transactions, categories, summaries, addTransaction, updateTransaction, deleteTransaction, addCategory, updateCategory, deleteCategory } = useData();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  
  // Filters
  const [filterPeriod, setFilterPeriod] = useState("month");
  const [filterType, setFilterType] = useState<"all" | "entrada" | "saida">("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Form State
  const [formData, setFormData] = useState<Partial<Transaction>>({
    type: "entrada",
    value: 0,
    date: format(new Date(), "yyyy-MM-dd"),
    category: "",
    paymentMethod: "Pix",
    paymentType: "Normal",
    description: "",
    status: "Pago"
  });

  const clients = useMemo(() => Array.from(new Set(summaries.map(s => s.cliente))).sort(), [summaries]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const tDate = new Date(t.date);
      let periodMatch = true;
      if (filterPeriod === "month") {
        periodMatch = isWithinInterval(tDate, { start: startOfMonth(new Date()), end: endOfMonth(new Date()) });
      } else if (filterPeriod === "3months") {
        periodMatch = isWithinInterval(tDate, { start: subMonths(new Date(), 3), end: new Date() });
      } else if (filterPeriod === "6months") {
        periodMatch = isWithinInterval(tDate, { start: subMonths(new Date(), 6), end: new Date() });
      } else if (filterPeriod === "year") {
        periodMatch = isWithinInterval(tDate, { start: subMonths(new Date(), 12), end: new Date() });
      }

      const typeMatch = filterType === "all" || t.type === filterType;
      const categoryMatch = filterCategory === "all" || t.category === filterCategory;
      const searchMatch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (t.clientId && t.clientId.toLowerCase().includes(searchTerm.toLowerCase()));

      return periodMatch && typeMatch && categoryMatch && searchMatch;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, filterPeriod, filterType, filterCategory, searchTerm]);

  // KPIs
  const revenue = useMemo(() => filteredTransactions.filter(t => t.type === "entrada").reduce((acc, t) => acc + t.value, 0), [filteredTransactions]);
  const expenses = useMemo(() => filteredTransactions.filter(t => t.type === "saida").reduce((acc, t) => acc + t.value, 0), [filteredTransactions]);
  const profit = revenue - expenses;
  const toReceive = useMemo(() => transactions.filter(t => t.type === "entrada" && t.status === "Pendente").reduce((acc, t) => acc + t.value, 0), [transactions]);
  const toPay = useMemo(() => transactions.filter(t => t.type === "saida" && t.status === "Pendente").reduce((acc, t) => acc + t.value, 0), [transactions]);

  // Chart Data
  const chartData = useMemo(() => {
    const last6Months = Array.from({ length: 6 }).map((_, i) => {
      const d = subMonths(new Date(), 5 - i);
      return {
        name: format(d, "MMM", { locale: ptBR }),
        month: format(d, "yyyy-MM"),
        entradas: 0,
        saidas: 0
      };
    });

    transactions.forEach(t => {
      const month = t.date.substring(0, 7);
      const dataPoint = last6Months.find(m => m.month === month);
      if (dataPoint) {
        if (t.type === "entrada") dataPoint.entradas += t.value;
        else dataPoint.saidas += t.value;
      }
    });

    return last6Months;
  }, [transactions]);

  const handleOpenModal = (t?: Transaction) => {
    if (t) {
      setEditingTransaction(t);
      setFormData(t);
    } else {
      setEditingTransaction(null);
      setFormData({
        type: "entrada",
        value: 0,
        date: format(new Date(), "yyyy-MM-dd"),
        category: "Clientes",
        paymentMethod: "Pix",
        paymentType: "Normal",
        description: "",
        status: "Pago"
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.category || !formData.value || formData.value <= 0) {
      toast({ title: "Erro", description: "Preencha todos os campos obrigatórios.", variant: "destructive" });
      return;
    }

    if (editingTransaction) {
      updateTransaction(editingTransaction.id, formData as Transaction);
      toast({ title: "Sucesso", description: "Movimentação atualizada." });
    } else {
      addTransaction(formData as Omit<Transaction, "id">);
      toast({ title: "Sucesso", description: "Movimentação adicionada." });
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Deseja realmente excluir esta movimentação?")) {
      deleteTransaction(id);
      toast({ title: "Sucesso", description: "Movimentação excluída." });
    }
  };

  return (
    <AppLayout>
      <div className="p-6 bg-slate-950/5 min-h-screen text-slate-900">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-serif font-bold text-slate-900 flex items-center gap-2">
              <Wallet className="w-8 h-8 text-slate-700" />
              Financeiro
            </h2>
            <p className="text-slate-500 mt-1">Gestão de caixa e saúde financeira da agência</p>
          </div>
          <Button onClick={() => handleOpenModal()} className="bg-slate-900 hover:bg-slate-800 text-white shadow-lg">
            <Plus className="w-4 h-4 mr-2" />
            Nova movimentação
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-slate-200 p-1 rounded-xl">
            <TabsTrigger value="dashboard" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Dashboard</TabsTrigger>
            <TabsTrigger value="extrato" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Extrato</TabsTrigger>
            <TabsTrigger value="categorias" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Categorias</TabsTrigger>
            <TabsTrigger value="configuracoes" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Configurações</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6 animate-fade-in">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <Card className="border-none shadow-sm bg-white overflow-hidden relative">
                <div className="absolute top-0 left-0 w-1 h-full bg-green-500" />
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wider">Receitas (Período)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">R$ {revenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm bg-white overflow-hidden relative">
                <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wider">Despesas (Período)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">R$ {expenses.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm bg-white overflow-hidden relative">
                <div className={`absolute top-0 left-0 w-1 h-full ${profit >= 0 ? "bg-slate-800" : "bg-orange-500"}`} />
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wider">Lucro Líquido</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${profit >= 0 ? "text-slate-900" : "text-orange-600"}`}>
                    R$ {profit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </div>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm bg-white overflow-hidden relative">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total a Receber</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">R$ {toReceive.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm bg-white overflow-hidden relative">
                <div className="absolute top-0 left-0 w-1 h-full bg-purple-500" />
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total a Pagar</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">R$ {toPay.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm bg-slate-900 text-white overflow-hidden relative">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-slate-400 uppercase tracking-wider">Saldo Atual</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">R$ {balance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-none shadow-sm bg-white">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-slate-800">Fluxo de Caixa (Últimos 6 meses)</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} tickFormatter={(val) => `R$${val}`} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        formatter={(value) => [`R$ ${value}`, ""]}
                      />
                      <Legend iconType="circle" />
                      <Bar dataKey="entradas" fill="#22c55e" radius={[4, 4, 0, 0]} name="Entradas" />
                      <Bar dataKey="saidas" fill="#ef4444" radius={[4, 4, 0, 0]} name="Saídas" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-white">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-slate-800">Evolução do Saldo</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData.map((d, i, arr) => {
                      const prevBalance = i > 0 ? arr.slice(0, i).reduce((acc, curr) => acc + (curr.entradas - curr.saidas), 0) : 0;
                      return { ...d, saldo: prevBalance + (d.entradas - d.saidas) };
                    })}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} tickFormatter={(val) => `R$${val}`} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        formatter={(value) => [`R$ ${value}`, "Saldo"]}
                      />
                      <Line type="monotone" dataKey="saldo" stroke="#0f172a" strokeWidth={3} dot={{ r: 4, fill: "#0f172a" }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="extrato" className="space-y-4 animate-fade-in">
            <Card className="border-none shadow-sm bg-white">
              <CardHeader className="pb-2">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <CardTitle className="text-lg font-bold text-slate-800">Histórico de Movimentações</CardTitle>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                      <Input 
                        placeholder="Buscar..." 
                        className="pl-9 w-[200px] bg-slate-50 border-none" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                      <SelectTrigger className="w-[140px] bg-slate-50 border-none">
                        <SelectValue placeholder="Período" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="month">Mês atual</SelectItem>
                        <SelectItem value="3months">Últimos 3 meses</SelectItem>
                        <SelectItem value="6months">Últimos 6 meses</SelectItem>
                        <SelectItem value="year">Último 1 ano</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filterType} onValueChange={(v: any) => setFilterType(v)}>
                      <SelectTrigger className="w-[120px] bg-slate-50 border-none">
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="entrada">Entradas</SelectItem>
                        <SelectItem value="saida">Saídas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl overflow-hidden border border-slate-100">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="font-bold text-slate-700">Data</TableHead>
                        <TableHead className="font-bold text-slate-700">Tipo</TableHead>
                        <TableHead className="font-bold text-slate-700">Categoria</TableHead>
                        <TableHead className="font-bold text-slate-700">Descrição/Cliente</TableHead>
                        <TableHead className="font-bold text-slate-700 text-right">Valor</TableHead>
                        <TableHead className="font-bold text-slate-700">Status</TableHead>
                        <TableHead className="text-right"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-12 text-slate-400">
                            Nenhuma movimentação encontrada.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredTransactions.map((t) => (
                          <TableRow key={t.id} className="hover:bg-slate-50/50 transition-colors">
                            <TableCell className="font-medium">{format(new Date(t.date), "dd/MM/yyyy")}</TableCell>
                            <TableCell>
                              {t.type === "entrada" ? (
                                <Badge className="bg-green-100 text-green-700 border-none hover:bg-green-100">Entrada</Badge>
                              ) : (
                                <Badge className="bg-red-100 text-red-700 border-none hover:bg-red-100">Saída</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-slate-600">{t.category}</TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-semibold text-slate-800">{t.clientId || t.description}</span>
                                {t.clientId && t.description && <span className="text-xs text-slate-500">{t.description}</span>}
                              </div>
                            </TableCell>
                            <TableCell className={`text-right font-bold ${t.type === "entrada" ? "text-green-600" : "text-red-600"}`}>
                              R$ {t.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={t.status === "Pago" ? "border-green-200 text-green-700 bg-green-50" : "border-orange-200 text-orange-700 bg-orange-50"}>
                                {t.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="icon" onClick={() => handleOpenModal(t)} className="h-8 w-8 text-slate-400 hover:text-slate-900">
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)} className="h-8 w-8 text-slate-400 hover:text-red-600">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categorias" className="animate-fade-in">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-none shadow-sm bg-white">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold text-green-700">Categorias de Entrada</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {categories.filter(c => c.type === "entrada").map(c => (
                        <div key={c.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg group">
                          <span className="font-medium text-slate-700">{c.name}</span>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                              const newName = prompt("Novo nome da categoria:", c.name);
                              if (newName) updateCategory(c.id, newName);
                            }}><Pencil className="w-3.5 h-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => deleteCategory(c.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                          </div>
                        </div>
                      ))}
                      <Button variant="outline" className="w-full border-dashed mt-2" onClick={() => {
                        const name = prompt("Nome da nova categoria de entrada:");
                        if (name) addCategory(name, "entrada");
                      }}><Plus className="w-4 h-4 mr-2" /> Nova Categoria</Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold text-red-700">Categorias de Saída</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {categories.filter(c => c.type === "saida").map(c => (
                        <div key={c.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg group">
                          <span className="font-medium text-slate-700">{c.name}</span>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                              const newName = prompt("Novo nome da categoria:", c.name);
                              if (newName) updateCategory(c.id, newName);
                            }}><Pencil className="w-3.5 h-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => deleteCategory(c.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                          </div>
                        </div>
                      ))}
                      <Button variant="outline" className="w-full border-dashed mt-2" onClick={() => {
                        const name = prompt("Nome da nova categoria de saída:");
                        if (name) addCategory(name, "saida");
                      }}><Plus className="w-4 h-4 mr-2" /> Nova Categoria</Button>
                    </div>
                  </CardContent>
                </Card>
             </div>
          </TabsContent>

          <TabsContent value="configuracoes" className="animate-fade-in">
            <Card className="border-none shadow-sm bg-white max-w-2xl">
              <CardHeader>
                <CardTitle>Configurações Gerais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Formas de Pagamento Aceitas</Label>
                  <div className="flex flex-wrap gap-2">
                    {["Pix", "Boleto", "Cartão", "Dinheiro", "Outro"].map(f => (
                      <Badge key={f} variant="secondary" className="px-3 py-1">{f}</Badge>
                    ))}
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-100">
                  <h4 className="font-bold text-slate-800 mb-2">Backup de Dados</h4>
                  <p className="text-sm text-slate-500 mb-4">Os dados financeiros são armazenados localmente no seu navegador. Recomenda-se fazer exportações regulares para segurança.</p>
                  <Button variant="outline" onClick={() => {
                    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(transactions));
                    const downloadAnchorNode = document.createElement('a');
                    downloadAnchorNode.setAttribute("href", dataStr);
                    downloadAnchorNode.setAttribute("download", `financeiro_backup_${format(new Date(), "yyyy-MM-dd")}.json`);
                    document.body.appendChild(downloadAnchorNode);
                    downloadAnchorNode.click();
                    downloadAnchorNode.remove();
                  }}>Exportar Dados (JSON)</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add/Edit Dialog */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-[500px] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                {editingTransaction ? <Pencil className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                {editingTransaction ? "Editar Movimentação" : "Nova Movimentação"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="flex p-1 bg-slate-100 rounded-lg">
                <button 
                  className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${formData.type === "entrada" ? "bg-white shadow-sm text-green-600" : "text-slate-500"}`}
                  onClick={() => setFormData({...formData, type: "entrada", category: "Clientes"})}
                >Entrada</button>
                <button 
                  className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${formData.type === "saida" ? "bg-white shadow-sm text-red-600" : "text-slate-500"}`}
                  onClick={() => setFormData({...formData, type: "saida", category: "Outros"})}
                >Saída</button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Data</Label>
                  <Input id="date" type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="value">Valor (R$)</Label>
                  <Input id="value" type="number" step="0.01" value={formData.value} onChange={(e) => setFormData({...formData, value: parseFloat(e.target.value)})} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.filter(c => c.type === formData.type).map(c => (
                      <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.type === "entrada" && formData.category === "Clientes" && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <Label>Cliente</Label>
                  <Select value={formData.clientId} onValueChange={(v) => setFormData({...formData, clientId: v, description: `Recebimento de ${v}`})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Input id="description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Ex: Assinatura Adobe, Salário Ketlyn..." />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Forma de Pagamento</Label>
                  <Select value={formData.paymentMethod} onValueChange={(v: any) => setFormData({...formData, paymentMethod: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["Pix", "Boleto", "Cartão", "Dinheiro", "Outro"].map(f => (
                        <SelectItem key={f} value={f}>{f}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(v: any) => setFormData({...formData, status: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pago">Pago / Recebido</SelectItem>
                      <SelectItem value="Pendente">Pendente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                 <Label>Tipo de Pagamento</Label>
                 <Select value={formData.paymentType} onValueChange={(v: any) => setFormData({...formData, paymentType: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Normal">Normal</SelectItem>
                      <SelectItem value="Permuta">Permuta</SelectItem>
                      <SelectItem value="Outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
              </div>

              {(formData.paymentType === "Permuta" || formData.paymentType === "Outro") && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <Label htmlFor="payment_desc">Descrição do Pagamento (Obrigatório)</Label>
                  <Input id="payment_desc" required value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Descreva os detalhes da permuta ou outro..." />
                </div>
              )}
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} className="bg-slate-900 text-white">Salvar Movimentação</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
