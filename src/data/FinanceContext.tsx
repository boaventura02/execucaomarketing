import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { useData } from "./DataContext";
import { v4 as uuidv4 } from "uuid";

// Since uuid isn't in package.json, I'll use a simple generator
const genId = () => Math.random().toString(36).substring(2, 11);

export type PaymentMethod = "Pix" | "Cartão crédito" | "Cartão débito" | "Boleto" | "Dinheiro" | "Permuta" | "Outro";
export type TransactionType = "income" | "expense";
export type ContractType = "monthly" | "unique";

export interface ClientPaymentPart {
  id: string;
  method: PaymentMethod;
  value: number;
  notes?: string;
}

export interface ClientFinance {
  clientId: string; // references ClientRow.cliente (or id if it's stable)
  contractValue: number;
  startDate: string;
  endDate?: string;
  paymentDay: number;
  type: ContractType;
  paymentParts: ClientPaymentPart[];
}

export interface Transaction {
  id: string;
  type: TransactionType;
  category: string;
  name: string;
  date: string;
  method: PaymentMethod;
  value: number;
  notes?: string;
  document?: string; // CPF/CNPJ
  phone?: string;
}

export interface FinancialCategory {
  id: string;
  name: string;
}

interface FinanceContextType {
  clientFinances: ClientFinance[];
  transactions: Transaction[];
  categories: FinancialCategory[];
  
  // Actions for Client Finance
  updateClientFinance: (clientId: string, data: Partial<ClientFinance>) => void;
  addPaymentPart: (clientId: string, part: Omit<ClientPaymentPart, "id">) => void;
  removePaymentPart: (clientId: string, partId: string) => void;
  
  // Actions for Transactions
  addTransaction: (transaction: Omit<Transaction, "id">) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  
  // Actions for Categories
  addCategory: (name: string) => void;
  deleteCategory: (id: string) => void;
  
  // Dashboard Data
  dashboardData: {
    totalIncomes: number;
    totalExpenses: number;
    netProfit: number;
    currentBalance: number;
    toReceive: number;
    alreadyPaid: number;
  };
}

const FinanceContext = createContext<FinanceContextType | null>(null);

const STORAGE_KEY = "marketing_finance_data";

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const { summaries } = useData(); // We'll use summaries to get unique client names
  
  const [clientFinances, setClientFinances] = useState<ClientFinance[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<FinancialCategory[]>([
    { id: "1", name: "Clientes" },
    { id: "2", name: "Aluguel" },
    { id: "3", name: "Lanches" },
    { id: "4", name: "Ferramentas" },
    { id: "5", name: "Tráfego Pago" },
    { id: "6", name: "Outros" },
  ]);

  // Load from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.clientFinances) setClientFinances(parsed.clientFinances);
        if (parsed.transactions) setTransactions(parsed.transactions);
        if (parsed.categories) setCategories(parsed.categories);
      } catch (e) {
        console.error("Failed to parse finance data", e);
      }
    }
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ clientFinances, transactions, categories }));
  }, [clientFinances, transactions, categories]);

  const updateClientFinance = (clientId: string, data: Partial<ClientFinance>) => {
    setClientFinances(prev => {
      const existing = prev.find(f => f.clientId === clientId);
      if (existing) {
        return prev.map(f => f.clientId === clientId ? { ...f, ...data } : f);
      }
      return [...prev, {
        clientId,
        contractValue: 0,
        startDate: new Date().toISOString().split('T')[0],
        paymentDay: 1,
        type: 'monthly',
        paymentParts: [],
        ...data
      } as ClientFinance];
    });
  };

  const addPaymentPart = (clientId: string, part: Omit<ClientPaymentPart, "id">) => {
    setClientFinances(prev => {
      const existing = prev.find(f => f.clientId === clientId);
      const newPart = { ...part, id: genId() };
      if (existing) {
        return prev.map(f => f.clientId === clientId ? { 
          ...f, 
          paymentParts: [...f.paymentParts, newPart] 
        } : f);
      }
      return [...prev, {
        clientId,
        contractValue: 0,
        startDate: new Date().toISOString().split('T')[0],
        paymentDay: 1,
        type: 'monthly',
        paymentParts: [newPart]
      } as ClientFinance];
    });
  };

  const removePaymentPart = (clientId: string, partId: string) => {
    setClientFinances(prev => prev.map(f => f.clientId === clientId ? {
      ...f,
      paymentParts: f.paymentParts.filter(p => p.id !== partId)
    } : f));
  };

  const addTransaction = (transaction: Omit<Transaction, "id">) => {
    setTransactions(prev => [{ ...transaction, id: genId() }, ...prev]);
  };

  const updateTransaction = (id: string, updates: Partial<Transaction>) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const addCategory = (name: string) => {
    setCategories(prev => [...prev, { id: genId(), name }]);
  };

  const deleteCategory = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  const dashboardData = useMemo(() => {
    const totalIncomes = transactions
      .filter(t => t.type === "income")
      .reduce((acc, t) => acc + t.value, 0);
    
    const totalExpenses = transactions
      .filter(t => t.type === "expense")
      .reduce((acc, t) => acc + t.value, 0);

    const netProfit = totalIncomes - totalExpenses;
    const currentBalance = netProfit; // Simplified

    // These would typically come from specific client payment tracking
    // For now, let's assume "toReceive" is sum of all contracts minus income transactions categorized as "Clientes"
    const totalContracted = clientFinances.reduce((acc, f) => acc + f.contractValue, 0);
    const clientPaymentsReceived = transactions
      .filter(t => t.type === "income" && t.category === "Clientes")
      .reduce((acc, t) => acc + t.value, 0);
      
    return {
      totalIncomes,
      totalExpenses,
      netProfit,
      currentBalance,
      toReceive: Math.max(0, totalContracted - clientPaymentsReceived),
      alreadyPaid: clientPaymentsReceived
    };
  }, [transactions, clientFinances]);

  return (
    <FinanceContext.Provider value={{
      clientFinances,
      transactions,
      categories,
      updateClientFinance,
      addPaymentPart,
      removePaymentPart,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addCategory,
      deleteCategory,
      dashboardData
    }}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) throw new Error("useFinance must be used within FinanceProvider");
  return context;
}
