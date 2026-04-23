import { AppLayout } from "@/components/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardTab } from "@/components/finance/DashboardTab";
import { ClientesFinanceTab } from "@/components/finance/ClientesFinanceTab";
import { MovimentacoesTab } from "@/components/finance/MovimentacoesTab";

export default function FinanceiroPage() {
  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl sm:text-4xl font-serif font-bold italic text-slate-50">Módulo Financeiro</h2>
          <p className="text-slate-400">Gestão de contratos e fluxo de caixa empresarial.</p>
        </div>

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8 bg-slate-900 border border-slate-800 p-1">
            <TabsTrigger 
              value="dashboard" 
              className="data-[state=active]:bg-slate-800 data-[state=active]:text-primary text-slate-400"
            >
              Dashboard
            </TabsTrigger>
            <TabsTrigger 
              value="clientes"
              className="data-[state=active]:bg-slate-800 data-[state=active]:text-primary text-slate-400"
            >
              Clientes
            </TabsTrigger>
            <TabsTrigger 
              value="movimentacoes"
              className="data-[state=active]:bg-slate-800 data-[state=active]:text-primary text-slate-400"
            >
              Movimentações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="animate-in fade-in-50 duration-500">
            <DashboardTab />
          </TabsContent>

          <TabsContent value="clientes" className="animate-in fade-in-50 duration-500">
            <ClientesFinanceTab />
          </TabsContent>

          <TabsContent value="movimentacoes" className="animate-in fade-in-50 duration-500">
            <MovimentacoesTab />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
