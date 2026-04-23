import React, { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useData } from "@/data/DataContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Pencil, Wallet, TrendingUp, TrendingDown, DollarSign, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function FinanceiroPage() {
  const { transactions, categories, rows } = useData();
  const [activeTab, setActiveTab] = useState("dashboard");

  const revenue = transactions.filter(t => t.type === "entrada").reduce((acc, t) => acc + t.value, 0);
  const expenses = transactions.filter(t => t.type === "saida").reduce((acc, t) => acc + t.value, 0);
  const balance = revenue - expenses;

  return (
    <AppLayout>
      <div className="p-6 bg-slate-50 min-h-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-serif font-bold text-slate-900">Financeiro</h2>
          <Button>+ Nova movimentação</Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-slate-200">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="extrato">Extrato</TabsTrigger>
            <TabsTrigger value="categorias">Categorias</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">R$ {revenue.toFixed(2)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Despesas Totais</CardTitle>
                  <TrendingDown className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">R$ {expenses.toFixed(2)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
                  <DollarSign className="h-4 w-4 text-slate-500" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${balance >= 0 ? "text-slate-900" : "text-red-600"}`}>
                    R$ {balance.toFixed(2)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Saldo</CardTitle>
                  <Wallet className="h-4 w-4 text-slate-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900">R$ {balance.toFixed(2)}</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="extrato">
            <Card>
              <CardHeader>
                <CardTitle>Movimentações</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell>{t.date}</TableCell>
                        <TableCell className={t.type === "entrada" ? "text-green-600" : "text-red-600"}>
                          {t.type === "entrada" ? "Entrada" : "Saída"}
                        </TableCell>
                        <TableCell>{t.category}</TableCell>
                        <TableCell>{t.description}</TableCell>
                        <TableCell>R$ {t.value.toFixed(2)}</TableCell>
                        <TableCell>{t.status}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
