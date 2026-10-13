import React, { createContext, useContext, useEffect, useState } from 'react';
import { TOOL_MAP } from '../config/tools';
import { ToolRegistryItem } from '../types/tool';

export interface RecentItem {
  toolId: string;
  visitedAt: number;
}

export interface HistoryRecord {
  id: string;
  toolId: string;
  toolName: string;
  category: string;
  timestamp: number;
  summary: string;
}

interface StorageContextType {
  favorites: string[];
  isFavorite: (toolId: string) => boolean;
  toggleFavorite: (toolId: string) => void;
  recentTools: ToolRegistryItem[];
  recordToolUsage: (toolId: string, summary?: string) => void;
  history: HistoryRecord[];
  clearHistory: () => void;
  clearFavorites: () => void;
}

const StorageContext = createContext<StorageContextType | undefined>(undefined);

const FAVORITES_KEY = 'toolhub_favorites';
const RECENT_KEY = 'toolhub_recent';
const HISTORY_KEY = 'toolhub_history';

export const StorageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_KEY);
      return stored ? JSON.parse(stored) : ['image-compressor', 'pdf-merge', 'sgpa-calculator', 'dev-json-formatter', 'qr-generator'];
    } catch {
      return ['image-compressor', 'pdf-merge', 'sgpa-calculator', 'dev-json-formatter', 'qr-generator'];
    }
  });

  const [recentToolIds, setRecentToolIds] = useState<RecentItem[]>(() => {
    try {
      const stored = localStorage.getItem(RECENT_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [history, setHistory] = useState<HistoryRecord[]>(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    } catch (e) {
      console.error('Failed to save favorites to localStorage', e);
    }
  }, [favorites]);

  useEffect(() => {
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(recentToolIds));
    } catch (e) {
      console.error('Failed to save recent tools to localStorage', e);
    }
  }, [recentToolIds]);

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (e) {
      console.error('Failed to save history to localStorage', e);
    }
  }, [history]);

  const isFavorite = (toolId: string): boolean => favorites.includes(toolId);

  const toggleFavorite = (toolId: string) => {
    setFavorites((prev) =>
      prev.includes(toolId) ? prev.filter((id) => id !== toolId) : [...prev, toolId]
    );
  };

  const recordToolUsage = (toolId: string, summary?: string) => {
    const tool = TOOL_MAP.get(toolId);
    if (!tool) return;

    // Update recent tool list (keep max 10, newest first)
    setRecentToolIds((prev) => {
      const filtered = prev.filter((item) => item.toolId !== toolId);
      return [{ toolId, visitedAt: Date.now() }, ...filtered].slice(0, 10);
    });

    if (summary) {
      const record: HistoryRecord = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        toolId: tool.id,
        toolName: tool.name,
        category: tool.category,
        timestamp: Date.now(),
        summary,
      };
      setHistory((prev) => [record, ...prev].slice(0, 50));
    }
  };

  const clearHistory = () => {
    setHistory([]);
    setRecentToolIds([]);
  };

  const clearFavorites = () => {
    setFavorites([]);
  };

  // Convert recentToolIds to actual registered Tool objects
  const recentTools = recentToolIds
    .map((item) => TOOL_MAP.get(item.toolId))
    .filter((tool): tool is ToolRegistryItem => tool !== undefined);

  return (
    <StorageContext.Provider
      value={{
        favorites,
        isFavorite,
        toggleFavorite,
        recentTools,
        recordToolUsage,
        history,
        clearHistory,
        clearFavorites,
      }}
    >
      {children}
    </StorageContext.Provider>
  );
};

export const useStorage = (): StorageContextType => {
  const context = useContext(StorageContext);
  if (!context) {
    throw new Error('useStorage must be used within a StorageProvider');
  }
  return context;
};
