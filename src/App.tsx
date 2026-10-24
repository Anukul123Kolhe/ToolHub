import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { StorageProvider } from './context/StorageContext';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { GlobalSearchModal } from './components/search/GlobalSearchModal';

import { HomePage } from './pages/HomePage';
import { ToolsCatalogPage } from './pages/ToolsCatalogPage';
import { CategoryPage } from './pages/CategoryPage';
import { ToolWorkspacePage } from './pages/ToolWorkspacePage';
import { AIAssistantPage } from './pages/AIAssistantPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { HistoryPage } from './pages/HistoryPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { AboutPage } from './pages/AboutPage';
import { SettingsPage } from './pages/SettingsPage';
import { AIAssistantModal } from './components/ai/AIAssistantModal';

export const AppContent: React.FC = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);

  // Global Cmd+K / Ctrl+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fbfb]/90 dark:bg-[#061317] text-slate-900 dark:text-slate-100 bg-ambient-mesh transition-colors duration-200">
      <Header
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenAIAssistant={() => setIsAIAssistantOpen(true)}
      />

      <main className="flex-grow">
        <Routes>
          <Route
            path="/"
            element={
              <HomePage
                onOpenSearch={() => setIsSearchOpen(true)}
                onOpenAIAssistant={() => setIsAIAssistantOpen(true)}
              />
            }
          />
          <Route path="/tools" element={<ToolsCatalogPage />} />
          <Route path="/category/:categoryId" element={<CategoryPage />} />
          <Route path="/tool/:toolId" element={<ToolWorkspacePage />} />
          <Route path="/ai-assistant" element={<AIAssistantPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Footer />

      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      <AIAssistantModal
        isOpen={isAIAssistantOpen}
        onClose={() => setIsAIAssistantOpen(false)}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <StorageProvider>
        <HashRouter>
          <AppContent />
        </HashRouter>
      </StorageProvider>
    </ThemeProvider>
  );
};

export default App;
