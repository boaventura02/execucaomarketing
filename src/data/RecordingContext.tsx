import React, { createContext, useContext, useState, useEffect } from "react";
import { useData } from "./DataContext";

export type RecordingStatus = "Agendado" | "Concluído" | "Cancelado";
export type RecordingPriority = "Urgente" | "Atenção" | "OK";
export type RecordingFrequency = "Semanal" | "Quinzenal" | "Mensal";
export type ClientRecordingStatus = "Normal" | "Sem conteúdo";

export interface Recording {
  id: string;
  groupId?: string; // Links recurring recordings
  clientId: string; 
  clientName: string;
  date: string;
  time?: string; // HH:mm
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
  addRecording: (recording: Omit<Recording, "id" | "groupId">, recurring?: RecordingFrequency) => void;
  updateRecording: (id: string, recording: Partial<Recording>, clientSettingsUpdates?: Partial<ClientRecordingSettings>) => void;
  deleteRecording: (id: string, deleteAllType?: "single" | "group" | "client") => void;
  updateClientSettings: (clientName: string, settings: Partial<ClientRecordingSettings>) => void;
  updateManualVideos: (clientName: string, month: Date, count: number) => void;
  resetMonthlyData: () => void;
  getProductionStats: (clientName: string, targetMonth?: Date) => {
    contracted: number;
    recorded: number;
    manualRecorded: number;
    totalRecorded: number;
    remaining: number;
    excess: number;
    isFinished: boolean;
  };
}

const RecordingContext = createContext<RecordingContextType | undefined>(undefined);

export const RecordingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { summaries } = useData();
  const [recordings, setRecordings] = useState<Recording[]>(() => {
    const saved = localStorage.getItem("recording_data");
    return saved ? JSON.parse(saved) : [];
  });

  const [clientSettings, setClientSettings] = useState<Record<string, ClientRecordingSettings>>(() => {
    const saved = localStorage.getItem("client_recording_settings");
  const [manualVideos, setManualVideos] = useState<Record<string, Record<string, number>>>(() => {
    const saved = localStorage.getItem("manual_recorded_videos");
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem("manual_recorded_videos", JSON.stringify(manualVideos));
  }, [manualVideos]);

  useEffect(() => {
    localStorage.setItem("recording_data", JSON.stringify(recordings));
  }, [recordings]);

  useEffect(() => {
    localStorage.setItem("client_recording_settings", JSON.stringify(clientSettings));
  }, [clientSettings]);

  useEffect(() => {
    const lastReset = localStorage.getItem("last_monthly_reset");
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${now.getMonth()}`;
    
    if (lastReset !== currentMonthKey) {
      resetMonthlyData();
      localStorage.setItem("last_monthly_reset", currentMonthKey);
    }
  }, []);

  // Sync settings with DataContext summaries
  useEffect(() => {
    setClientSettings(prev => {
      const next = { ...prev };
      summaries.forEach(client => {
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
  }, [summaries]);

  const addRecording = (recording: Omit<Recording, "id" | "groupId">, recurring?: RecordingFrequency) => {
    const baseId = crypto.randomUUID();
    const groupId = recurring ? crypto.randomUUID() : undefined;
    const newRecordings: Recording[] = [{ ...recording, id: baseId, groupId }];

    if (recurring) {
      const baseDate = new Date(recording.date + "T12:00:00");
      let occurrences = 0;
      
      const maxOccurrences = recurring === "Mensal" ? 2 : 4;
      
      while (occurrences < maxOccurrences) {
        occurrences++;
        let nextDate = new Date(baseDate);
        if (recurring === "Semanal") nextDate.setDate(baseDate.getDate() + (7 * occurrences));
        else if (recurring === "Quinzenal") nextDate.setDate(baseDate.getDate() + (14 * occurrences));
        else if (recurring === "Mensal") nextDate.setMonth(baseDate.getMonth() + occurrences);

        newRecordings.push({
          ...recording,
          id: crypto.randomUUID(),
          groupId,
          date: nextDate.toISOString().split("T")[0]
        });
      }
    }

    setRecordings(prev => [...prev, ...newRecordings]);
  };

  const updateRecording = (id: string, updates: Partial<Recording>, clientSettingsUpdates?: Partial<ClientRecordingSettings>) => {
    setRecordings(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    
    // Auto-update client settings if provided
    if (clientSettingsUpdates) {
      const recording = recordings.find(r => r.id === id);
      if (recording) {
        updateClientSettings(recording.clientName, clientSettingsUpdates);
      }
    }
  };

  const deleteRecording = (id: string, deleteType: "single" | "group" | "client" = "single") => {
    const recording = recordings.find(r => r.id === id);
    if (!recording) return;

    if (deleteType === "client") {
      setRecordings(prev => prev.filter(r => r.clientName !== recording.clientName));
      return;
    }

    if (deleteType === "group" && recording.groupId) {
      setRecordings(prev => prev.filter(r => r.groupId !== recording.groupId));
      return;
    }

    setRecordings(prev => prev.filter(r => r.id !== id));
  };

  const updateClientSettings = (clientName: string, updates: Partial<ClientRecordingSettings>) => {
    setClientSettings(prev => ({
      ...prev,
      [clientName]: { ...prev[clientName], ...updates }
    }));
  };

  const updateManualVideos = (clientName: string, month: Date, count: number) => {
    const monthKey = `${month.getFullYear()}-${month.getMonth()}`;
    setManualVideos(prev => ({
      ...prev,
      [clientName]: {
        ...(prev[clientName] || {}),
        [monthKey]: count
      }
    }));
  };

  const resetMonthlyData = () => {
    // Only clear recordings from previous months that are completed
    // Or just clear all if the user wants to "start fresh"
    // Usually "zerar a lista" means clearing the historical data for the monthly stats
    setRecordings(prev => {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      // Keep only future recordings or recordings from the current month
      return prev.filter(r => {
        const d = new Date(r.date);
        const isFuture = d > now;
        const isCurrentMonth = d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        return isFuture || isCurrentMonth;
      });
    });
  };

  const getProductionStats = (clientName: string, targetMonth?: Date) => {
    const settings = clientSettings[clientName];
    const contracted = settings?.reelsContracted || 0;
    
    // Get all completed recordings for this client in the specified month
    const now = targetMonth || new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const monthlyRecordings = recordings.filter(r => {
      const d = new Date(r.date + "T12:00:00");
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
      resetMonthlyData,
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
