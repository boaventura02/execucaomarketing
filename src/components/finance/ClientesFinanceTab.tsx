import { useState } from "react";
import { useData } from "@/data/DataContext";
import { useFinance, PaymentMethod, ContractType } from "@/data/FinanceContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Edit2, Trash2, CreditCard, Banknote, Landmark } from "lucide-react";
import { toast } from "sonner";

export function ClientesFinanceTab() {
  const { summaries } = useData();
  const { clientFinances, updateClientFinance, addPaymentPart, removePaymentPart } = useFinance();
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  
  // Unique list of clients from operational data
  const clients = Array.from(new Set(summaries.map(s => s.cliente))).sort();

  const getFinance = (clientId: string) => {
    return clientFinances.find(f => f.clientId === clientId) || {
      clientId,
      contractValue: 0,
      startDate: "",
      paymentDay: 1,
      type: "monthly" as ContractType,
      paymentParts: []
    };
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-slate-100">Contratos de Clientes</h3>
      </div>

      <div className="rounded-md border border-slate-800 bg-slate-900/40 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-800/50">
            <TableRow className="border-slate-800 hover:bg-transparent">
              <TableHead className="text-slate-300">Cliente</TableHead>
              <TableHead className="text-slate-300">Valor Contrato</TableHead>
              <TableHead className="text-slate-300">Tipo</TableHead>
              <TableHead className="text-slate-300">Dia Pagamento</TableHead>
              <TableHead className="text-slate-300 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map(clientName => {
              const finance = getFinance(clientName);
              return (
                <TableRow key={clientName} className="border-slate-800 hover:bg-slate-800/30">
                  <TableCell className="font-medium text-slate-200">{clientName}</TableCell>
                  <TableCell className="text-slate-300">
                    R$ {finance.contractValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-slate-300">
                    {finance.type === 'monthly' ? 'Recorrente' : 'Único'}
                  </TableCell>
                  <TableCell className="text-slate-300">{finance.paymentDay}</TableCell>
                  <TableCell className="text-right">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-primary">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <ContractModal clientName={clientName} finance={finance} />
                    </Dialog>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function ContractModal({ clientName, finance }: { clientName: string, finance: any }) {
  const { updateClientFinance, addPaymentPart, removePaymentPart } = useFinance();
  const [contractValue, setContractValue] = useState(finance.contractValue);
  const [paymentDay, setPaymentDay] = useState(finance.paymentDay);
  const [type, setType] = useState<ContractType>(finance.type);
  const [startDate, setStartDate] = useState(finance.startDate);

  // For adding payment part
  const [newPartMethod, setNewPartMethod] = useState<PaymentMethod>("Pix");
  const [newPartValue, setNewPartValue] = useState(0);
  const [newPartNotes, setNewPartNotes] = useState("");

  const handleSaveContract = () => {
    updateClientFinance(clientName, {
      contractValue,
      paymentDay,
      type,
      startDate
    });
    toast.success("Contrato atualizado com sucesso!");
  };

  const handleAddPart = () => {
    if (newPartValue <= 0) {
      toast.error("O valor deve ser maior que zero");
      return;
    }
    if ((newPartMethod === "Permuta" || newPartMethod === "Outro") && !newPartNotes) {
      toast.error("Observação é obrigatória para Permuta ou Outro");
      return;
    }
    addPaymentPart(clientName, {
      method: newPartMethod,
      value: newPartValue,
      notes: newPartNotes
    });
    setNewPartValue(0);
    setNewPartNotes("");
    toast.success("Forma de pagamento adicionada!");
  };

  const paymentMethods: PaymentMethod[] = ["Pix", "Cartão crédito", "Cartão débito", "Boleto", "Dinheiro", "Permuta", "Outro"];

  return (
    <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-800 text-slate-100">
      <DialogHeader>
        <DialogTitle className="text-2xl font-serif italic">Contrato: {clientName}</DialogTitle>
      </DialogHeader>
      
      <div className="grid gap-6 py-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="value">Valor Total (R$)</Label>
            <Input 
              id="value" 
              type="number" 
              value={contractValue} 
              onChange={e => setContractValue(Number(e.target.value))}
              className="bg-slate-800 border-slate-700"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="day">Dia de Pagamento</Label>
            <Input 
              id="day" 
              type="number" 
              min="1" max="31" 
              value={paymentDay} 
              onChange={e => setPaymentDay(Number(e.target.value))}
              className="bg-slate-800 border-slate-700"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="type">Tipo</Label>
            <Select value={type} onValueChange={(v: ContractType) => setType(v)}>
              <SelectTrigger className="bg-slate-800 border-slate-700">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">
                <SelectItem value="monthly">Recorrente Mensal</SelectItem>
                <SelectItem value="unique">Pagamento Único</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="start">Data de Início</Label>
            <Input 
              id="start" 
              type="date" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)}
              className="bg-slate-800 border-slate-700"
            />
          </div>
        </div>

        <Button onClick={handleSaveContract} className="w-full">Salvar Configurações Base</Button>

        <div className="space-y-4 pt-4 border-t border-slate-800">
          <h4 className="font-bold flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Divisão de Pagamento
          </h4>
          
          <div className="space-y-3">
            {finance.paymentParts.map((part: any) => (
              <div key={part.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                <div>
                  <div className="font-medium">{part.method}</div>
                  <div className="text-sm text-slate-400">R$ {part.value.toLocaleString('pt-BR')}</div>
                  {part.notes && <div className="text-xs text-slate-500 italic mt-1">Obs: {part.notes}</div>}
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-rose-500 hover:text-rose-400 hover:bg-rose-500/10"
                  onClick={() => removePaymentPart(clientName, part.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="grid gap-3 p-4 rounded-lg bg-slate-800/30 border border-slate-800">
            <div className="grid grid-cols-2 gap-2">
              <Select value={newPartMethod} onValueChange={(v: PaymentMethod) => setNewPartMethod(v)}>
                <SelectTrigger className="bg-slate-800 border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">
                  {paymentMethods.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input 
                placeholder="Valor (R$)" 
                type="number" 
                value={newPartValue || ""} 
                onChange={e => setNewPartValue(Number(e.target.value))}
                className="bg-slate-800 border-slate-700"
              />
            </div>
            <Input 
              placeholder="Observação (obrigatória para Permuta/Outro)" 
              value={newPartNotes} 
              onChange={e => setNewPartNotes(e.target.value)}
              className="bg-slate-800 border-slate-700"
            />
            <Button variant="secondary" onClick={handleAddPart} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Parte
            </Button>
          </div>
        </div>
      </div>
    </DialogContent>
  );
}
