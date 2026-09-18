import React, { useState, useEffect } from 'react';
import { GameConfig, PlayStudioEventPayload } from './types';
import { defaultConfig } from './utils/defaultConfig';
import { AdminStudio } from './components/AdminStudio';
import { GameCanvas } from './components/GameCanvas';

export default function App() {
  const [config, setConfig] = useState<GameConfig>(() => {
    const saved = localStorage.getItem('bakery_game_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return defaultConfig;
      }
    }
    return defaultConfig;
  });

  const [mode, setMode] = useState<'admin' | 'player'>('admin');
  const [activeSection, setActiveSection] = useState<string>('welcome');
  const [isSaved, setIsSaved] = useState<boolean>(true);
  const [eventLogs, setEventLogs] = useState<PlayStudioEventPayload[]>([]);

  useEffect(() => {
    localStorage.setItem('bakery_game_config', JSON.stringify(config));
    setIsSaved(false);
  }, [config]);

  // Listen for PlayStudio events emitted on window
  useEffect(() => {
    const handleEventLog = (e: Event) => {
      const customEvent = e as CustomEvent<PlayStudioEventPayload>;
      if (customEvent.detail) {
        setEventLogs((prev) => [customEvent.detail, ...prev.slice(0, 49)]);
      }
    };

    window.addEventListener('42PLAYSTUDIO_EVENT_LOG', handleEventLog);
    return () => window.removeEventListener('42PLAYSTUDIO_EVENT_LOG', handleEventLog);
  }, []);

  const handleReset = () => {
    setConfig(defaultConfig);
    localStorage.removeItem('bakery_game_config');
    setIsSaved(true);
  };

  const handleSaveDraft = () => {
    localStorage.setItem('bakery_game_config', JSON.stringify(config));
    setIsSaved(true);
  };

  const handlePublishLive = () => {
    localStorage.setItem('bakery_game_config', JSON.stringify(config));
    setIsSaved(true);
    alert('Whitelabel configuration published live successfully!');
  };

  if (mode === 'player') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Real Mobile Player App Frame (iPhone SE 375x667) */}
        <div className="w-[375px] h-[667px] rounded-[36px] border-[12px] border-slate-800 bg-slate-900 shadow-2xl relative overflow-hidden flex flex-col">
          {/* Status bar */}
          <div 
            className="h-6 bg-slate-900 px-6 flex justify-between items-center text-[11px] font-semibold text-slate-400 select-none shrink-0 z-20 cursor-pointer"
            onDoubleClick={() => setMode('admin')}
            title="Double click to return to Admin Studio"
          >
            <span>9:41</span>
            <div className="w-3 h-3 rounded-full bg-slate-800" />
          </div>
          <div className="flex-1 overflow-hidden bg-white flex flex-col relative">
            <GameCanvas config={config} isStandalone={true} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans">
      <AdminStudio
        config={config}
        onChange={setConfig}
        onReset={handleReset}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        eventLogs={eventLogs}
        onClearLogs={() => setEventLogs([])}
        isSaved={isSaved}
        onSaveDraft={handleSaveDraft}
        onPublishLive={handlePublishLive}
        onOpenPlayerApp={() => setMode('player')}
      />
    </div>
  );
}
