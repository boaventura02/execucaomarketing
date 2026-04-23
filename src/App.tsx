import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DataProvider } from "@/data/DataContext";
import { FinanceProvider } from "@/data/FinanceContext";
import Index from "./pages/Index.tsx";
import ClientesPage from "./pages/ClientesPage.tsx";
import PlanilhaPage from "./pages/PlanilhaPage.tsx";
import ApresentacaoPage from "./pages/ApresentacaoPage.tsx";
import FinanceiroPage from "./pages/FinanceiroPage.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <DataProvider>
        <FinanceProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/clientes" element={<ClientesPage />} />
              <Route path="/planilha" element={<PlanilhaPage />} />
              <Route path="/apresentacao" element={<ApresentacaoPage />} />
              <Route path="/financeiro" element={<FinanceiroPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </FinanceProvider>
      </DataProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
