import { useState, useMemo } from "react";
import { useFinance, Transaction, TransactionType, PaymentMethod } from "@/data/FinanceContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Search, Filter, Trash2, Edit2, ArrowUpCircle, ArrowDownCircle, Download } from "lucide-react";
import { toast } from "sonner";
import { useData } from "@/data/DataContext";

export function MovimentacoesTab() {
  const { transactions, categories, addTransaction, deleteTransaction, updateTransaction } = useFinance();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | TransactionType>("all");
  const [filterMonth, setFilterMonth] = useState<string>("all");

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           t.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === "all" || t.type === filterType;
      
      let matchesMonth = true;
      if (filterMonth !== "all") {
        const date = new Date(t.date);
        const now = new Date();
        if (filterMonth === "current") {
          matchesMonth = date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        } else if (filterMonth === "3months") {
          const threeMonthsAgo = new Date();
          threeMonthsAgo.setMonth(now.getMonth() - 3);
          matchesMonth = date >= threeMonthsAgo;
        } else if (filterMonth === "6months") {
          const sixMonthsAgo = new Date();
          sixMonthsAgo.setMonth(now.getMonth() - 6);
          matchesMonth = date >= sixMonthsAgo;
        } else if (filterMonth === "year") {
          const oneYearAgo = new Date();
          oneYearAgo.setFullYear(now.getFullYear() - 1);
          matchesMonth = date >= oneYearAgo;
        }
      }
      
      return matchesSearch && matchesType && matchesMonth;
    });
  }, [transactions, searchTerm, filterType, filterMonth]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-xl font-bold text-slate-100">Extrato de Movimentações</h3>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-bold">
              <Plus className="h-4 w-4 mr-2" />
              Nova Movimentação
            </Button>
          </DialogTrigger>
          <TransactionModal />
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input 
            placeholder="Buscar..." 
            className="pl-10 bg-slate-900 border-slate-800 text-slate-100" 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Select value={filterType} onValueChange={(v: any) => setFilterType(v)}>
          <SelectTrigger className="bg-slate-900 border-slate-800 text-slate-100">
            <Filter className="h-4 w-4 mr-2 text-slate-500" />
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
            <SelectItem value="all">Todos os Tipos</SelectItem>
            <SelectItem value="income">Entradas</SelectItem>
            <SelectItem value="expense">Saídas</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterMonth} onValueChange={setFilterMonth}>
          <SelectTrigger className="bg-slate-900 border-slate-800 text-slate-100">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
            <SelectItem value="all">Todo o período</SelectItem>
            <SelectItem value="current">Mês Atual</SelectItem>
            <SelectItem value="3months">Últimos 3 Meses</SelectItem>
            <SelectItem value="6months">Últimos 6 Meses</SelectItem>
            <SelectItem value="year">Último 1 Ano</SelectItem>
          </SelectContent>
        </Select>
        
        <Button variant="outline" className="border-slate-800 text-slate-400 hover:bg-slate-800">
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
      </div>

      <div className="rounded-md border border-slate-800 bg-slate-900/40 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-800/50">
            <TableRow className="border-slate-800 hover:bg-transparent">
              <TableHead className="text-slate-300">Data</TableHead>
              <TableHead className="text-slate-300">Tipo</TableHead>
              <TableHead className="text-slate-300">Nome / Categoria</TableHead>
              <TableHead className="text-slate-300 text-right">Valor</TableHead>
              <TableHead className="text-slate-300 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.length === 0 ? (
              <TableRow className="hover:bg-transparent border-slate-800">
                <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                  Nenhuma movimentação encontrada.
                </TableCell>
              </TableRow>
            ) : (
              filteredTransactions.map(t => (
                <TableRow key={t.id} className="border-slate-800 hover:bg-slate-800/30">
                  <TableCell className="text-slate-400">
                    {new Date(t.date).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    {t.type === 'income' ? (
                      <div className="flex items-center text-emerald-500 font-medium">
                        <ArrowUpCircle className="h-4 w-4 mr-1.5" />
                        Entrada
                      </div>
                    ) : (
                      <div className="flex items-center text-rose-500 font-medium">
                        <ArrowDownCircle className="h-4 w-4 mr-1.5" />
                        Saída
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-slate-200">{t.name}</div>
                    <div className="text-xs text-slate-500">{t.category}</div>
                  </TableCell>
                  <TableCell className={`text-right font-bold ${t.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>
                    R$ {t.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-rose-500 hover:text-rose-400 hover:bg-rose-500/10"
                      onClick={() => {
                        deleteTransaction(t.id);
                        toast.success("Movimentação excluída");
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function TransactionModal() {
  const { categories, addTransaction } = useFinance();
  const [type, setType] = useState<TransactionType>("income");
  const [category, setCategory] = useState("Clientes");
  const [name, setName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [method, setMethod] = useState<PaymentMethod>("Pix");
  const [value, setValue] = useState(0);
  const [notes, setNotes] = useState("");
  const [document, setDocument] = useState("");
  const [phone, setPhone] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (value <= 0) {
      toast.error("O valor não pode ser negativo ou zero");
      return;
    }
    
    if (category === "Clientes" && (!document || !phone)) {
      toast.error("CPF/CNPJ e Telefone são obrigatórios para a categoria Clientes");
      return;
    }

    if ((method === "Permuta" || method === "Outro") && !notes) {
      toast.error("Observação é obrigatória para Permuta ou Outro");
      return;
    }

    addTransaction({
      type,
      category,
      name,
      date,
      method,
      value,
      notes,
      document,
      phone
    });
    
    toast.success("Movimentação registrada!");
    // Form will reset naturally when dialog closes or we could reset state here
  };

  const paymentMethods: PaymentMethod[] = ["Pix", "Cartão crédito", "Cartão debitó", "Boleto", "Dinheiro", "Permuta", "Outro"];

  return (
    <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-800 text-slate-100">
      <DialogHeader>
        <DialogTitle className="text-2xl font-serif italic">Nova Movimentação</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="grid gap-4 py-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Tipo</Label>
            <div className="flex gap-2">
              <Button 
                type="button"
                variant={type === "income" ? "default" : "outline"} 
                className={`flex-1 ${type === "income" ? "bg-emerald-600 hover:bg-emerald-500" : "border-slate-800"}`}
                onClick={() => setType("income")}
              >
                Entrada
              </Button>
              <Button 
                type="button"
                variant={type === "expense" ? "default" : "outline"}
                className={`flex-1 ${type === "expense" ? "bg-rose-600 hover:bg-rose-500" : "border-slate-800"}`}
                onClick={() => setType("expense")}
              >
                Saída
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="date">Data</Label>
            <Input id="date" type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-slate-800 border-slate-700" required />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="bg-slate-800 border-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">
                {categories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="method">Forma de Pagamento</Label>
            <Select value={method} onValueChange={(v: PaymentMethod) => setMethod(v)}>
              <SelectTrigger className="bg-slate-800 border-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">
                {paymentMethods.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Nome da Transação</Label>
          <Input id="name" placeholder="Ex: Pagamento mensalidade Jan" value={name} onChange={e => setName(e.target.value)} className="bg-slate-800 border-slate-700" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="value">Valor (R$)</Label>
          <Input id="value" type="number" step="0.01" value={value || ""} onChange={e => setValue(Number(e.target.value))} className="bg-slate-800 border-slate-700" required />
        </div>

        {category === "Clientes" && (
          <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-slate-800/50 border border-slate-700">
            <div className="space-y-2">
              <Label htmlFor="doc">CPF / CNPJ</Label>
              <Input id="doc" value={document} onChange={e => setDocument(e.target.value)} className="bg-slate-800 border-slate-700" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} className="bg-slate-800 border-slate-700" required />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="notes">Observações</Label>
          <Input id="notes" placeholder="Detalhes adicionais..." value={notes} onChange={e => setNotes(e.target.value)} className="bg-slate-800 border-slate-700" />
        </div>

        <DialogFooter className="mt-4">
          <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 font-bold">Registrar Movimentação</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
