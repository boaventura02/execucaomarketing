import { AppLayout } from "@/components/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFinance } from "@/data/FinanceContext";
import { TrendingUp, TrendingDown, DollarSign, Wallet, Users, ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function FinanceiroPage() {
  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-serif font-bold italic text-foreground">Financeiro</h2>
          <p className="text-muted-foreground">Gestão financeira e controle de fluxo de caixa.</p>
        </div>

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="clientes">Clientes</TabsTrigger>
            <TabsTrigger value="movimentacoes">Movimentações</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <DashboardTab />
          </TabsContent>

          <TabsContent value="clientes" className="space-y-6">
            <ClientesFinanceTab />
          </TabsContent>

          <TabsContent value="movimentacoes" className="space-y-6">
            <MovimentacoesTab />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

function DashboardTab() {
  const { dashboardData } = useFinance();
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total de Entradas</CardTitle>
          <ArrowUpRight className="h-4 w-4 text-status-delivered" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-status-delivered">R$ {dashboardData.totalIncomes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total de Saídas</CardTitle>
          <ArrowDownRight className="h-4 w-4 text-status-late" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-status-late">R$ {dashboardData.totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Lucro Líquido</CardTitle>
          <TrendingUp className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">R$ {dashboardData.netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        </CardContent>
      </Card>
    </div>
  );
}

function ClientesFinanceTab() {
  return <div>Módulo de Clientes Financeiro (Contratos)</div>;
}

function MovimentacoesTab() {
  return <div>Módulo de Movimentações (Entradas/Saídas)</div>;
}
