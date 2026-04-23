import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { KpiCard } from "@/components/KpiCard";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  ArrowUpCircle, 
  ArrowDownCircle,
  Plus,
  Filter,
  Calendar,
  AlertCircle
} from "lucide-react";
import { useData } from "@/data/DataContext";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Mock data for initial state
const INITIAL_RECEITAS = [
  { id: "1", cliente: "La Barca Gastronomia", valor: 2500, vencimento: "2026-05-10", status: "Pago", formaPagamento: "Pix", observacoes: "Mensalidade Abril" },
  { id: "2", cliente: "Amis Store", valor: 1800, vencimento: "2026-05-15", status: "Pendente", formaPagamento: "Boleto", observacoes: "Contrato 3 meses" },
  { id: "3", cliente: "Aires Contabilidade", valor: 3200, vencimento: "2026-05-05", status: "Atrasado", formaPagamento: "Transferência", observacoes: "Serviços extras" },
];

const INITIAL_DESPESAS = [
  { id: "1", descricao: "Aluguel Sala", categoria: "Infraestrutura", valor: 2000, vencimento: "2026-05-05", status: "Pago", responsavel: "Gestão" },
  { id: "2", descricao: "Adobe Creative Cloud", categoria: "Ferramentas", valor: 250, vencimento: "2026-05-12", status: "Pendente", responsavel: "Design" },
  { id: "3", descricao: "Tráfego Pago - Meta Ads", categoria: "Tráfego", valor: 5000, vencimento: "2026-05-20", status: "Pendente", responsavel: "Tráfego" },
];

export default function FinanceiroPage() {
  const { summaries } = useData();
  const [receitas, setReceitas] = useState(INITIAL_RECEITAS);
  const [despesas, setDespesas] = useState(INITIAL_DESPESAS);

  const totalReceitas = receitas.reduce((acc, curr) => acc + curr.valor, 0);
  const totalReceitasPagas = receitas.filter(r => r.status === "Pago").reduce((acc, curr) => acc + curr.valor, 0);
  const totalReceitasPendentes = receitas.filter(r => r.status !== "Pago").reduce((acc, curr) => acc + curr.valor, 0);
  
  const totalDespesas = despesas.reduce((acc, curr) => acc + curr.valor, 0);
  const totalDespesasPagas = despesas.filter(d => d.status === "Pago").reduce((acc, curr) => acc + curr.valor, 0);
  
  const lucroLiquido = totalReceitasPagas - totalDespesasPagas;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pago":
        return <Badge className="bg-status-delivered-bg text-status-delivered hover:bg-status-delivered-bg/80 border-status-delivered/20">Pago</Badge>;
      case "Pendente":
        return <Badge className="bg-status-pending-bg text-status-pending hover:bg-status-pending-bg/80 border-status-pending/20">Pendente</Badge>;
      case "Atrasado":
        return <Badge className="bg-status-late-bg text-status-late hover:bg-status-late-bg/80 border-status-late/20">Atrasado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-10 space-y-8 max-w-[1600px] mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground italic">Gestão Financeira</h2>
            <p className="text-muted-foreground mt-1">Controle interno e fluxo de caixa da agência.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Calendar className="w-4 h-4" />
              Maio 2026
            </Button>
            <Button size="sm" className="gap-2 bg-primary text-primary-foreground">
              <Plus className="w-4 h-4" />
              Nova Transação
            </Button>
          </div>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <KpiCard 
            title="Receita Total" 
            value={formatCurrency(totalReceitas)} 
            icon={TrendingUp} 
            color="text-emerald-500" 
            bgColor="bg-emerald-500/10" 
            delay={0}
          />
          <KpiCard 
            title="Despesas" 
            value={formatCurrency(totalDespesas)} 
            icon={TrendingDown} 
            color="text-rose-500" 
            bgColor="bg-rose-500/10" 
            delay={100}
          />
          <KpiCard 
            title="Lucro Líquido" 
            value={formatCurrency(lucroLiquido)} 
            icon={Wallet} 
            color="text-blue-500" 
            bgColor="bg-blue-500/10" 
            delay={200}
          />
          <KpiCard 
            title="A Receber" 
            value={formatCurrency(totalReceitasPendentes)} 
            icon={ArrowUpCircle} 
            color="text-amber-500" 
            bgColor="bg-amber-500/10" 
            delay={300}
          />
          <KpiCard 
            title="A Pagar" 
            value={formatCurrency(totalDespesas - totalDespesasPagas)} 
            icon={ArrowDownCircle} 
            color="text-purple-500" 
            bgColor="bg-purple-500/10" 
            delay={400}
          />
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="resumo" className="w-full">
          <TabsList className="bg-muted/50 p-1 mb-6">
            <TabsTrigger value="resumo">Resumo</TabsTrigger>
            <TabsTrigger value="receitas">Contas a Receber</TabsTrigger>
            <TabsTrigger value="despesas">Contas a Pagar</TabsTrigger>
            <TabsTrigger value="fluxo">Fluxo de Caixa</TabsTrigger>
          </TabsList>

          <TabsContent value="resumo" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-card/50 border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-status-pending" />
                    Alertas Financeiros
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-status-late-bg/20 border border-status-late/20">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-status-late" />
                      <span className="text-sm font-medium">Fatura Atrasada: Aires Contabilidade</span>
                    </div>
                    <span className="text-sm font-bold text-status-late">{formatCurrency(3200)}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-status-pending-bg/20 border border-status-pending/20">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-status-pending" />
                      <span className="text-sm font-medium">Vence amanhã: Adobe Creative Cloud</span>
                    </div>
                    <span className="text-sm font-bold text-status-pending">{formatCurrency(250)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg">Distribuição de Despesas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Tráfego Pago</span>
                        <span className="font-medium">68%</span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: '68%' }} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Infraestrutura</span>
                        <span className="font-medium">27%</span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary/60" style={{ width: '27%' }} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Ferramentas</span>
                        <span className="font-medium">5%</span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary/30" style={{ width: '5%' }} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="receitas">
            <Card className="bg-card/50 border-border/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Contas a Receber</CardTitle>
                  <CardDescription>Receitas vinculadas aos clientes ativos.</CardDescription>
                </div>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="w-4 h-4" />
                  Filtrar
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Forma</TableHead>
                      <TableHead>Observações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {receitas.map((rec) => (
                      <TableRow key={rec.id}>
                        <TableCell className="font-medium">{rec.cliente}</TableCell>
                        <TableCell>{formatCurrency(rec.valor)}</TableCell>
                        <TableCell>{rec.vencimento}</TableCell>
                        <TableCell>{getStatusBadge(rec.status)}</TableCell>
                        <TableCell>{rec.formaPagamento}</TableCell>
                        <TableCell className="text-muted-foreground">{rec.observacoes}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="despesas">
            <Card className="bg-card/50 border-border/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Contas a Pagar</CardTitle>
                  <CardDescription>Registro de despesas e custos operacionais.</CardDescription>
                </div>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="w-4 h-4" />
                  Filtrar
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Responsável</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {despesas.map((desp) => (
                      <TableRow key={desp.id}>
                        <TableCell className="font-medium">{desp.descricao}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-normal">{desp.categoria}</Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(desp.valor)}</TableCell>
                        <TableCell>{desp.vencimento}</TableCell>
                        <TableCell>{getStatusBadge(desp.status)}</TableCell>
                        <TableCell>{desp.responsavel}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fluxo">
            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Fluxo de Caixa Mensal</CardTitle>
                <CardDescription>Visualização de entradas e saídas acumuladas.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-end justify-between gap-2 pt-10 px-4">
                  {[35, 45, 30, 60, 40, 75, 55, 65, 80, 70, 90, 85].map((val, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                      <div 
                        className="w-full bg-primary/20 hover:bg-primary/40 transition-colors rounded-t-sm relative" 
                        style={{ height: `${val}%` }}
                      >
                        <div 
                          className="absolute bottom-0 w-full bg-primary rounded-t-sm" 
                          style={{ height: `${val * 0.7}%` }} 
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground rotate-45 sm:rotate-0 mt-2">
                        {['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][i]}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                    <p className="text-xs text-muted-foreground uppercase">Saldo Anterior</p>
                    <p className="text-xl font-bold">{formatCurrency(12500)}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                    <p className="text-xs text-muted-foreground uppercase">Resultado do Mês</p>
                    <p className="text-xl font-bold text-status-delivered">+{formatCurrency(3500)}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-primary text-primary-foreground border border-primary/50">
                    <p className="text-xs opacity-80 uppercase">Saldo Acumulado</p>
                    <p className="text-xl font-bold">{formatCurrency(16000)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}