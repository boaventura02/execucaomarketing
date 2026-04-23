import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFinance } from "@/data/FinanceContext";
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Wallet, DollarSign, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, PieChart, Pie } from "recharts";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function DashboardTab() {
  const { dashboardData, transactions, alerts } = useFinance();

  // Data for Incomes vs Expenses Chart
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return d.toLocaleString('pt-BR', { month: 'short' });
  }).reverse();

  const chartData = last6Months.map(month => {
    // This is a simplification. In a real app we'd filter by actual month
    return {
      name: month,
      entradas: Math.floor(Math.random() * 5000) + 5000,
      saidas: Math.floor(Math.random() * 3000) + 1000,
    };
  });

  const pieData = [
    { name: "Recebido", value: dashboardData.alreadyPaid, color: "#10b981" },
    { name: "A Receber", value: dashboardData.toReceive, color: "#f59e0b" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border-slate-800 bg-slate-900/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total de Entradas</CardTitle>
            <div className="p-2 bg-emerald-500/10 rounded-full">
              <ArrowUpRight className="h-4 w-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">
              R$ {dashboardData.totalIncomes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-slate-800 bg-slate-900/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total de Saídas</CardTitle>
            <div className="p-2 bg-rose-500/10 rounded-full">
              <ArrowDownRight className="h-4 w-4 text-rose-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-500">
              R$ {dashboardData.totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Lucro Líquido</CardTitle>
            <div className="p-2 bg-primary/10 rounded-full">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-50">
              R$ {dashboardData.netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Saldo Atual</CardTitle>
            <Wallet className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-50">
              R$ {dashboardData.currentBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Valores a Receber</CardTitle>
            <div className="p-2 bg-amber-500/10 rounded-full">
              <DollarSign className="h-4 w-4 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">
              R$ {dashboardData.toReceive.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Valores Pagos</CardTitle>
            <div className="p-2 bg-blue-500/10 rounded-full">
              <DollarSign className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">
              R$ {dashboardData.alreadyPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-slate-800 bg-slate-900/40">
          <CardHeader>
            <CardTitle className="text-slate-100">Entradas vs Saídas</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', color: '#f8fafc' }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Bar dataKey="entradas" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="saidas" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/40">
          <CardHeader>
            <CardTitle className="text-slate-100">Status de Recebíveis</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
             <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', color: '#f8fafc' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-2 ml-4">
              {pieData.map((entry, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-sm text-slate-400">{entry.name}: R$ {entry.value.toLocaleString('pt-BR')}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
