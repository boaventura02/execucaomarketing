import React, { createContext, useContext, useState, useEffect } from "react";
import { useData } from "./DataContext";

export type RecordingStatus = "Agendado" | "Concluído" | "Cancelado";
export type RecordingPriority = "Urgente" | "Atenção" | "OK";
export type RecordingFrequency = "Semanal" | "Quinzenal" | "Mensal";
export type ClientRecordingStatus = "Normal" | "Sem conteúdo";

export interface Recording {
  id: string;
  clientId: string; // matches client name from DataContext for now
  clientName: string;
  date: string;
  plannedVideos: number;
  recordedVideos: number;
  topic: string;
  status: RecordingStatus;
  priority: RecordingPriority;
  scriptStatus: string;
}

export interface ClientRecordingSettings {
  clientName: string;
  frequency: RecordingFrequency;
  status: ClientRecordingStatus;
  reelsContracted: number;
}

interface RecordingContextType {
  recordings: Recording[];
  clientSettings: Record<string, ClientRecordingSettings>;
  addRecording: (recording: Omit<Recording, "id">) => void;
  updateRecording: (id: string, recording: Partial<Recording>) => void;
  deleteRecording: (id: string) => void;
  updateClientSettings: (clientName: string, settings: Partial<ClientRecordingSettings>) => void;
  getProductionStats: (clientName: string) => {
    contracted: number;
    recorded: number;
    remaining: number;
    excess: number;
    isFinished: boolean;
  };
}

const RecordingContext = createContext<RecordingContextType | undefined>(undefined);

export const RecordingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { clients } = useData();
  const [recordings, setRecordings] = useState<Recording[]>(() => {
    const saved = localStorage.getItem("recording_data");
    return saved ? JSON.parse(saved) : [];
  });

  const [clientSettings, setClientSettings] = useState<Record<string, ClientRecordingSettings>>(() => {
    const saved = localStorage.getItem("client_recording_settings");
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem("recording_data", JSON.stringify(recordings));
  }, [recordings]);

  useEffect(() => {
    localStorage.setItem("client_recording_settings", JSON.stringify(clientSettings));
  }, [clientSettings]);

  // Sync settings with DataContext clients
  useEffect(() => {
    setClientSettings(prev => {
      const next = { ...prev };
      clients.forEach(client => {
        if (!next[client.cliente]) {
          // Find contracted reels from items
          const reelsItem = client.items.find(i => i.tipo.toLowerCase().includes("reels"));
          const contracted = reelsItem ? parseInt(reelsItem.quantidade) || 0 : 0;
          
          next[client.cliente] = {
            clientName: client.cliente,
            frequency: "Quinzenal",
            status: "Normal",
            reelsContracted: contracted
          };
        } else {
          // Update contracted if it changed in DataContext
          const reelsItem = client.items.find(i => i.tipo.toLowerCase().includes("reels"));
          const contracted = reelsItem ? parseInt(reelsItem.quantidade) || 0 : 0;
          if (next[client.cliente].reelsContracted !== contracted && contracted > 0) {
            next[client.cliente].reelsContracted = contracted;
          }
        }
      });
      return next;
    });
  }, [clients]);

  const addRecording = (recording: Omit<Recording, "id">) => {
    const id = crypto.randomUUID();
    setRecordings(prev => [...prev, { ...recording, id }]);
  };

  const updateRecording = (id: string, updates: Partial<Recording>) => {
    setRecordings(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const deleteRecording = (id: string) => {
    setRecordings(prev => prev.filter(r => r.id !== id));
  };

  const updateClientSettings = (clientName: string, updates: Partial<ClientRecordingSettings>) => {
    setClientSettings(prev => ({
      ...prev,
      [clientName]: { ...prev[clientName], ...updates }
    }));
  };

  const getProductionStats = (clientName: string) => {
    const settings = clientSettings[clientName];
    const contracted = settings?.reelsContracted || 0;
    
    // Get all completed recordings for this client in the current month
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const monthlyRecordings = recordings.filter(r => {
      const d = new Date(r.date);
      return r.clientName === clientName && 
             r.status === "Concluído" && 
             d.getMonth() === currentMonth && 
             d.getFullYear() === currentYear;
    });

    const recorded = monthlyRecordings.reduce((sum, r) => sum + r.recordedVideos, 0);
    const remaining = Math.max(0, contracted - recorded);
    const excess = Math.max(0, recorded - contracted);
    const isFinished = recorded >= contracted && contracted > 0;

    return { contracted, recorded, remaining, excess, isFinished };
  };

  return (
    <RecordingContext.Provider value={{
      recordings,
      clientSettings,
      addRecording,
      updateRecording,
      deleteRecording,
      updateClientSettings,
      getProductionStats
    }}>
      {children}
    </RecordingContext.Provider>
  );
};

export const useRecordings = () => {
  const context = useContext(RecordingContext);
  if (!context) throw new Error("useRecordings must be used within RecordingProvider");
  return context;
};
