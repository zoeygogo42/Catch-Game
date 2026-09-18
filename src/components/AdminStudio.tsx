import React, { useState } from 'react';
import { GameConfig, LevelConfig, PlayStudioEventPayload, BackgroundState } from '../types';
import { ImageControl } from './ImageControl';
import { BackgroundControl } from './BackgroundControl';
import { DevicePreview } from './DevicePreview';
import { 
  Palette, Sliders, Layers, Image as ImageIcon, Activity, 
  Plus, Trash2, ArrowUp, ArrowDown, Save, RefreshCw, Smartphone, Check, Sparkles 
} from 'lucide-react';

interface AdminStudioProps {
  config: GameConfig;
  onChange: (newConfig: GameConfig) => void;
  onReset: () => void;
  activeSection: string;
  setActiveSection: (sec: string) => void;
  eventLogs: PlayStudioEventPayload[];
  onClearLogs: () => void;
  isSaved: boolean;
  onSaveDraft: () => void;
  onPublishLive: () => void;
  onOpenPlayerApp: () => void;
}

export const AdminStudio: React.FC<AdminStudioProps> = ({
  config,
  onChange,
  onReset,
  activeSection,
  setActiveSection,
  eventLogs,
  onClearLogs,
  isSaved,
  onSaveDraft,
  onPublishLive,
  onOpenPlayerApp,
}) => {
  const [saveStatusMsg, setSaveStatusMsg] = useState<string>('');

  const handleSectionSave = (sectionName: string) => {
    onSaveDraft();
    setSaveStatusMsg(`${sectionName} saved successfully!`);
    setTimeout(() => setSaveStatusMsg(''), 3000);
  };

  const handleBackgroundChange = (key: 'welcome' | 'play' | 'success' | 'failed', bgState: BackgroundState) => {
    const backgrounds = config.backgrounds || {
      welcome: { enabled: true, type: 'none', value: '', fallbackColor: '#FFF7F2' },
      play: { enabled: true, type: 'none', value: '', fallbackColor: '#FFF7F2' },
      success: { enabled: true, type: 'none', value: '', fallbackColor: '#FFF7F2' },
      failed: { enabled: true, type: 'none', value: '', fallbackColor: '#EAF7FF' },
    };
    
    const newBackgrounds = {
      ...backgrounds,
      [key]: bgState
    };

    const newBranding = { ...config.branding };
    if (key === 'welcome') {
      newBranding.welcomeBgUrl = bgState.enabled && bgState.type !== 'none' ? bgState.value : '';
    } else if (key === 'success') {
      newBranding.winBgUrl = bgState.enabled && bgState.type !== 'none' ? bgState.value : '';
    } else if (key === 'failed') {
      newBranding.gameOverBgUrl = bgState.enabled && bgState.type !== 'none' ? bgState.value : '';
    }

    onChange({
      ...config,
      branding: newBranding,
      backgrounds: newBackgrounds
    });
  };

  const handleLevelChange = (index: number, field: keyof LevelConfig, value: any) => {
    const newLevels = [...config.levels];
    newLevels[index] = { ...newLevels[index], [field]: value };
    onChange({ ...config, levels: newLevels });
  };

  const addLevel = () => {
    const newLevelId = config.levels.length + 1;
    const newLevel: LevelConfig = {
      id: newLevelId,
      name: `Stage ${newLevelId}`,
      targetScore: newLevelId * 150,
      durationSeconds: 35,
      fallSpeed: 2.5 + newLevelId * 0.5,
      spawnIntervalMs: Math.max(500, 1200 - newLevelId * 200),
      goldenProbability: 0.2,
      bombProbability: 0.15,
      backgroundGradient: 'from-amber-50 to-orange-100',
    };
    onChange({ ...config, levels: [...config.levels, newLevel] });
  };

  const removeLevel = (index: number) => {
    if (config.levels.length <= 1) return;
    const newLevels = config.levels.filter((_, i) => i !== index);
    onChange({ ...config, levels: newLevels });
  };

  const moveLevel = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= config.levels.length) return;
    const newLevels = [...config.levels];
    const temp = newLevels[index];
    newLevels[index] = newLevels[targetIdx];
    newLevels[targetIdx] = temp;
    onChange({ ...config, levels: newLevels });
  };

  const getBreadcrumb = () => {
    switch (activeSection) {
      case 'welcome': return 'Setup > App Welcome Screen & Results';
      case 'setup': return 'Setup > Game Mechanics, Levels & Assets';
      case 'preview': return 'Preview > Live Device Preview';
      case 'events': return 'Studio > 42PlayStudio Event Inspector';
      default: return 'Setup';
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 font-sans overflow-hidden">
      {/* 1. Left Sidebar (Dark Navy, ~240px) */}
      <aside className="w-60 bg-slate-900 text-slate-300 flex flex-col justify-between shrink-0 border-r border-slate-800">
        <div>
          {/* Sidebar Header */}
          <div className="p-5 border-b border-slate-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-400 flex items-center justify-center text-white font-bold text-xs shadow">
              TF
            </div>
            <div>
              <div className="text-xs font-black text-white tracking-wide">Bakery Basket Catch</div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Admin Studio</div>
            </div>
          </div>

          {/* Sidebar Navigation */}
          <nav className="p-3 space-y-1">
            {[
              { id: 'welcome', label: 'App Welcome Screen', icon: Palette },
              { id: 'setup', label: 'Game Setup', icon: Sliders },
              { id: 'preview', label: 'Device Preview', icon: Smartphone },
              { id: 'events', label: 'Event Inspector', icon: Activity },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                  {item.id === 'events' && eventLogs.length > 0 && (
                    <span className="ml-auto px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px]">
                      {eventLogs.length}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Status:</span>
            <span className={`font-semibold ${isSaved ? 'text-emerald-400' : 'text-amber-400'}`}>
              {isSaved ? '● Saved' : '○ Unsaved'}
            </span>
          </div>
          <button
            onClick={onOpenPlayerApp}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 shadow-sm"
          >
            Open Player App
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* 2. Top Header Bar */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-xs">
          <div className="text-xs font-bold text-slate-600">
            {getBreadcrumb()}
          </div>

          <div className="flex items-center gap-3">
            {saveStatusMsg && (
              <span className="text-xs text-emerald-600 font-semibold animate-fade-in flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> {saveStatusMsg}
              </span>
            )}
            <button
              onClick={onSaveDraft}
              className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" /> Save Draft
            </button>
            <button
              onClick={onPublishLive}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
            >
              Publish Live
            </button>
          </div>
        </header>

        {/* 3. Main Content Area */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-4xl mx-auto space-y-6">

            {/* ================= SECTION 1: APP WELCOME SCREEN ================= */}
            {activeSection === 'welcome' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight">App Welcome Screen Setup</h1>
                  <p className="text-xs text-slate-500 mt-1">Configure game title, branding colors, welcome background, and logo.</p>
                </div>

                {/* White Setting Card */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-5">
                  <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                    <h2 className="text-sm font-bold text-slate-900">General Branding & Header</h2>
                    <span className="text-[11px] text-slate-400 uppercase font-semibold">Branding</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Game Title</label>
                    <input
                      type="text"
                      value={config.branding.gameTitle}
                      onChange={(e) => onChange({ ...config, branding: { ...config.branding, gameTitle: e.target.value } })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Primary Brand Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={config.branding.primaryColor}
                          onChange={(e) => onChange({ ...config, branding: { ...config.branding, primaryColor: e.target.value } })}
                          className="w-10 h-10 rounded-xl cursor-pointer border border-slate-300 p-0.5 bg-white"
                        />
                        <input
                          type="text"
                          value={config.branding.primaryColor}
                          onChange={(e) => onChange({ ...config, branding: { ...config.branding, primaryColor: e.target.value } })}
                          className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Accent Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={config.branding.accentColor}
                          onChange={(e) => onChange({ ...config, branding: { ...config.branding, accentColor: e.target.value } })}
                          className="w-10 h-10 rounded-xl cursor-pointer border border-slate-300 p-0.5 bg-white"
                        />
                        <input
                          type="text"
                          value={config.branding.accentColor}
                          onChange={(e) => onChange({ ...config, branding: { ...config.branding, accentColor: e.target.value } })}
                          className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      onClick={onReset}
                      className="px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition-all"
                    >
                      Reset Section
                    </button>
                    <button
                      onClick={() => handleSectionSave('Welcome Screen')}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-all"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>

                {/* ================= BACKGROUNDS THEMES SETUP CARD ================= */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-6">
                  <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">Screen Background Themes</h2>
                      <p className="text-[11px] text-slate-500 mt-0.5">Customize individual screen backdrops with solid colors, uploaded assets, or public image URLs.</p>
                    </div>
                    <span className="text-[11px] text-slate-400 uppercase font-semibold">Themes</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <BackgroundControl
                      label="Welcome Screen Background"
                      state={config.backgrounds?.welcome || { enabled: true, type: 'none', value: '', fallbackColor: '#FFF7F2' }}
                      onChange={(bgState) => handleBackgroundChange('welcome', bgState)}
                      helperText="Backdrop visible on the home and start screen."
                    />

                    <BackgroundControl
                      label="Play/Game Screen Background"
                      state={config.backgrounds?.play || { enabled: true, type: 'none', value: '', fallbackColor: '#FFF7F2' }}
                      onChange={(bgState) => handleBackgroundChange('play', bgState)}
                      helperText="Backdrop visible during active catching gameplay."
                    />

                    <BackgroundControl
                      label="Success Screen Background"
                      state={config.backgrounds?.success || { enabled: true, type: 'none', value: '', fallbackColor: '#FFF7F2' }}
                      onChange={(bgState) => handleBackgroundChange('success', bgState)}
                      helperText="Backdrop visible on Level Complete / Victory screens."
                    />

                    <BackgroundControl
                      label="Failed Screen Background"
                      state={config.backgrounds?.failed || { enabled: true, type: 'none', value: '', fallbackColor: '#EAF7FF' }}
                      onChange={(bgState) => handleBackgroundChange('failed', bgState)}
                      helperText="Backdrop visible on the Defeat and Game Over screen."
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => handleSectionSave('Background Themes')}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-all"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ================= SECTION 2: GAME SETUP ================= */}
            {activeSection === 'setup' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight">Game Setup & Mechanics</h1>
                  <p className="text-xs text-slate-500 mt-1">Configure starting lives, timers, physics coefficients, and level design.</p>
                </div>

                {/* Mechanics Card */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-5">
                  <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                    <h2 className="text-sm font-bold text-slate-900">Core Mechanics & Physics</h2>
                    <span className="text-[11px] text-slate-400 uppercase font-semibold">Mechanics</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                        Starting Lives (Hearts): {config.mechanics.startingLives}
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        step="1"
                        value={config.mechanics.startingLives}
                        onChange={(e) => onChange({
                          ...config,
                          mechanics: { ...config.mechanics, startingLives: parseInt(e.target.value) }
                        })}
                        className="w-full accent-blue-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                        Default Level Duration: {config.mechanics.defaultDuration}s
                      </label>
                      <input
                        type="range"
                        min="15"
                        max="60"
                        step="5"
                        value={config.mechanics.defaultDuration}
                        onChange={(e) => onChange({
                          ...config,
                          mechanics: { ...config.mechanics, defaultDuration: parseInt(e.target.value) }
                        })}
                        className="w-full accent-blue-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                        Gravity Coefficient: {config.mechanics.gravityCoefficient}x
                      </label>
                      <input
                        type="range"
                        min="0.5"
                        max="2.0"
                        step="0.1"
                        value={config.mechanics.gravityCoefficient}
                        onChange={(e) => onChange({
                          ...config,
                          mechanics: { ...config.mechanics, gravityCoefficient: parseFloat(e.target.value) }
                        })}
                        className="w-full accent-blue-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                        Basket Speed: {config.mechanics.basketSpeed}
                      </label>
                      <input
                        type="range"
                        min="5"
                        max="20"
                        step="1"
                        value={config.mechanics.basketSpeed}
                        onChange={(e) => onChange({
                          ...config,
                          mechanics: { ...config.mechanics, basketSpeed: parseInt(e.target.value) }
                        })}
                        className="w-full accent-blue-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Level Designer Card */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-5">
                  <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                    <h2 className="text-sm font-bold text-slate-900">Level Designer</h2>
                    <button
                      onClick={addLevel}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Level
                    </button>
                  </div>

                  <div className="space-y-4">
                    {config.levels.map((lvl, idx) => (
                      <div key={lvl.id} className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <input
                              type="text"
                              value={lvl.name}
                              onChange={(e) => handleLevelChange(idx, 'name', e.target.value)}
                              className="font-bold text-slate-800 text-xs px-2 py-1 rounded-md border border-slate-300 bg-white"
                            />
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => moveLevel(idx, 'up')}
                              disabled={idx === 0}
                              className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-30"
                              title="Move Up"
                            >
                              <ArrowUp className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => moveLevel(idx, 'down')}
                              disabled={idx === config.levels.length - 1}
                              className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-30"
                              title="Move Down"
                            >
                              <ArrowDown className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => removeLevel(idx)}
                              disabled={config.levels.length <= 1}
                              className="p-1 text-rose-600 hover:text-rose-800 disabled:opacity-30 ml-2"
                              title="Delete Level"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                          <div>
                            <label className="block font-bold text-slate-600 mb-1">Target Score</label>
                            <input
                              type="number"
                              value={lvl.targetScore}
                              onChange={(e) => handleLevelChange(idx, 'targetScore', parseInt(e.target.value) || 0)}
                              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-semibold"
                            />
                          </div>
                          <div>
                            <label className="block font-bold text-slate-600 mb-1">Duration (s)</label>
                            <input
                              type="number"
                              value={lvl.durationSeconds}
                              onChange={(e) => handleLevelChange(idx, 'durationSeconds', parseInt(e.target.value) || 0)}
                              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-semibold"
                            />
                          </div>
                          <div>
                            <label className="block font-bold text-slate-600 mb-1">Fall Speed</label>
                            <input
                              type="number"
                              step="0.2"
                              value={lvl.fallSpeed}
                              onChange={(e) => handleLevelChange(idx, 'fallSpeed', parseFloat(e.target.value) || 1)}
                              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-semibold"
                            />
                          </div>
                          <div>
                            <label className="block font-bold text-slate-600 mb-1">Golden Prob</label>
                            <input
                              type="number"
                              step="0.05"
                              min="0"
                              max="1"
                              value={lvl.goldenProbability}
                              onChange={(e) => handleLevelChange(idx, 'goldenProbability', parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-semibold"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => handleSectionSave('Game Setup')}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-all"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>

                {/* 1. Item Gameplay Tuning (Basket states & sizing) */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-6">
                  <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">4. Item Gameplay Tuning</h2>
                      <p className="text-[11px] text-slate-500 mt-0.5">Configure basket images for different states and adjust physical dimension rules.</p>
                    </div>
                    <span className="text-[11px] text-slate-400 uppercase font-semibold">Tuning</span>
                  </div>

                  {/* 3 State Columns (Moving, Catch, Hit) */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {/* MOVING STATE */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700">MOVING (Normal)</span>
                      </div>
                      <ImageControl
                        label="Moving Sprite"
                        value={config.assets.basketImages?.moving?.value || config.assets.basketUrl}
                        onChange={(url) => {
                          const currentImages = config.assets.basketImages || {
                            moving: { enabled: true, type: 'url', value: '' },
                            catch: { enabled: true, type: 'url', value: '' },
                            hit: { enabled: true, type: 'url', value: '' },
                          };
                          onChange({
                            ...config,
                            assets: {
                              ...config.assets,
                              basketUrl: url, // Sync standard basketUrl too for backward-compatibility
                              basketImages: {
                                ...currentImages,
                                moving: { ...currentImages.moving, value: url, type: 'url' }
                              }
                            }
                          });
                        }}
                        helperText="The default normal basket image shown while dragging."
                      />
                    </div>

                    {/* CATCH STATE */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700">CATCH (Success)</span>
                      </div>
                      <ImageControl
                        label="Catch Sprite"
                        value={config.assets.basketImages?.catch?.value || ''}
                        onChange={(url) => {
                          const currentImages = config.assets.basketImages || {
                            moving: { enabled: true, type: 'url', value: '' },
                            catch: { enabled: true, type: 'url', value: '' },
                            hit: { enabled: true, type: 'url', value: '' },
                          };
                          onChange({
                            ...config,
                            assets: {
                              ...config.assets,
                              basketImages: {
                                ...currentImages,
                                catch: { ...currentImages.catch, value: url, type: 'url' }
                              }
                            }
                          });
                        }}
                        helperText="Basket image shown briefly after catching a good item."
                      />
                    </div>

                    {/* HIT STATE */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700">HIT (Hazard)</span>
                      </div>
                      <ImageControl
                        label="Hit Sprite"
                        value={config.assets.basketImages?.hit?.value || ''}
                        onChange={(url) => {
                          const currentImages = config.assets.basketImages || {
                            moving: { enabled: true, type: 'url', value: '' },
                            catch: { enabled: true, type: 'url', value: '' },
                            hit: { enabled: true, type: 'url', value: '' },
                          };
                          onChange({
                            ...config,
                            assets: {
                              ...config.assets,
                              basketImages: {
                                ...currentImages,
                                hit: { ...currentImages.hit, value: url, type: 'url' }
                              }
                            }
                          });
                        }}
                        helperText="Basket image shown briefly after catching a wrong/bad item."
                      />
                    </div>
                  </div>

                  {/* Size sliders below the columns */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-slate-700">Basket Width (% of Screen)</label>
                        <span className="text-[11px] font-semibold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                          {config.assets.basketSize ?? 18}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="30"
                        step="1"
                        value={config.assets.basketSize ?? 18}
                        onChange={(e) => onChange({ ...config, assets: { ...config.assets, basketSize: parseInt(e.target.value) || 18 } })}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                      <p className="text-[10px] text-slate-400">Determines the horizontal catchment area of the basket.</p>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-slate-700">Falling Treats Size (Pixels)</label>
                        <span className="text-[11px] font-semibold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                          {config.assets.itemSize ?? 42}px
                        </span>
                      </div>
                      <input
                        type="range"
                        min="25"
                        max="65"
                        step="1"
                        value={config.assets.itemSize ?? 42}
                        onChange={(e) => onChange({ ...config, assets: { ...config.assets, itemSize: parseInt(e.target.value) || 42 } })}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                      <p className="text-[10px] text-slate-400">Scales normal cakes, golden cupcakes, and coal hazards.</p>
                    </div>
                  </div>

                  {/* Debug Mode Toggle */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <h3 className="text-xs font-bold text-slate-800">Visual Debug Mode</h3>
                      <p className="text-[10px] text-slate-400">Display a translucent green rectangle overlay over the basket opening to calibrate and verify the active physical catch zone.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={config.mechanics.showDebugZone ?? false} 
                        onChange={(e) => onChange({
                          ...config,
                          mechanics: {
                            ...config.mechanics,
                            showDebugZone: e.target.checked
                          }
                        })}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => handleSectionSave('Item Gameplay Tuning')}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-all"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>

                {/* 2. Treat & Hazard Sprites Customization */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-5">
                  <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">Treat & Hazard Sprites</h2>
                      <p className="text-[11px] text-slate-500 mt-0.5">Customize sprites for the falling cakes, golden bonuses, and hazards.</p>
                    </div>
                    <span className="text-[11px] text-slate-400 uppercase font-semibold">Sprites</span>
                  </div>

                  <ImageControl
                    label="Normal Cake Sprite URL (+10 pts)"
                    value={config.assets.normalCakeUrl}
                    onChange={(url) => onChange({ ...config, assets: { ...config.assets, normalCakeUrl: url } })}
                    helperText="Standard falling treat."
                  />

                  <ImageControl
                    label="Golden Cupcake Sprite URL (+30 pts)"
                    value={config.assets.goldenCupcakeUrl}
                    onChange={(url) => onChange({ ...config, assets: { ...config.assets, goldenCupcakeUrl: url } })}
                    helperText="Bonus high-value treat."
                  />

                  <ImageControl
                    label="Coal / Bomb Sprite URL (-15 pts & 1 heart)"
                    value={config.assets.bombUrl}
                    onChange={(url) => onChange({ ...config, assets: { ...config.assets, bombUrl: url } })}
                    helperText="Hazard item to avoid."
                  />

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => handleSectionSave('Sprites')}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-all"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ================= SECTION 5: DEVICE PREVIEW ================= */}
            {activeSection === 'preview' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight">Live Mobile Device Preview</h1>
                  <p className="text-xs text-slate-500 mt-1">Test-play your whitelabel configurations instantly in a simulated mobile device frame.</p>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex justify-center items-center min-h-[780px]">
                  <DevicePreview config={config} />
                </div>
              </div>
            )}

            {/* ================= SECTION 6: EVENT INSPECTOR ================= */}
            {activeSection === 'events' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight">42PlayStudio Event Inspector</h1>
                    <p className="text-xs text-slate-500 mt-1">Inspect real-time lifecycle event payloads emitted via postMessage.</p>
                  </div>
                  <button
                    onClick={onClearLogs}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all"
                  >
                    Clear Logs
                  </button>
                </div>

                <div className="space-y-3">
                  {eventLogs.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-400">
                      <Activity className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p className="text-sm font-semibold">No game events emitted yet.</p>
                      <p className="text-xs mt-1">Play the game in the Device Preview tab to trigger lifecycle events.</p>
                    </div>
                  ) : (
                    eventLogs.map((ev, i) => (
                      <div key={i} className="bg-white rounded-xl p-4 shadow-xs border border-slate-200 font-mono text-xs">
                        <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100">
                          <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold text-[10px]">
                            {ev.event}
                          </span>
                          <span className="text-slate-400 text-[10px]">
                            {new Date(ev.timestamp).toLocaleTimeString()} (Session: {ev.sessionID})
                          </span>
                        </div>
                        <pre className="bg-slate-900 text-slate-200 p-3 rounded-lg overflow-x-auto text-[11px]">
                          {JSON.stringify(ev, null, 2)}
                        </pre>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
};
