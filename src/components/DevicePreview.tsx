import React, { useState } from 'react';
import { GameConfig } from '../types';
import { GameCanvas } from './GameCanvas';
import { Smartphone, Tablet, Monitor, RefreshCw, Volume2, Wifi, Battery } from 'lucide-react';

interface DevicePreviewProps {
  config: GameConfig;
  onRestart?: () => void;
}

export const DevicePreview: React.FC<DevicePreviewProps> = ({ config }) => {
  const [deviceType, setDeviceType] = useState<'iphone' | 'android' | 'tablet'>('iphone');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 rounded-3xl shadow-2xl overflow-hidden border border-slate-800">
      {/* Device Toolbar Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold tracking-wide text-slate-300">Live Device Preview</span>
        </div>

        {/* Device Switcher Controls */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setDeviceType('iphone')}
            className={`p-1.5 rounded-lg text-xs font-medium transition-all ${
              deviceType === 'iphone' ? 'bg-rose-500 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="iPhone Frame"
          >
            <Smartphone className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeviceType('android')}
            className={`p-1.5 rounded-lg text-xs font-medium transition-all ${
              deviceType === 'android' ? 'bg-rose-500 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Android Frame"
          >
            <Smartphone className="w-4 h-4 rotate-90" />
          </button>
          <button
            onClick={() => setDeviceType('tablet')}
            className={`p-1.5 rounded-lg text-xs font-medium transition-all ${
              deviceType === 'tablet' ? 'bg-rose-500 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Tablet Frame"
          >
            <Tablet className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Frame Container */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-950/80 overflow-auto relative">
        {/* Smartphone Wrapper */}
        <div 
          className={`relative transition-all duration-300 shadow-2xl bg-slate-900 ${
            deviceType === 'iphone'
              ? 'w-[375px] h-[740px] rounded-[52px] border-[12px] border-slate-800 ring-1 ring-slate-700'
              : deviceType === 'android'
              ? 'w-[380px] h-[750px] rounded-[36px] border-[10px] border-slate-800 ring-1 ring-slate-700'
              : 'w-[640px] h-[700px] rounded-[24px] border-[16px] border-slate-800 ring-1 ring-slate-700'
          }`}
        >
          {/* Screen Display Content */}
          <div className="w-full h-full pt-2 pb-4 px-2 overflow-hidden flex flex-col bg-white rounded-[36px]">
            <GameCanvas config={config} />
          </div>

          {/* Home Indicator Bar */}
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 bg-slate-600 rounded-full z-30 pointer-events-none" />
        </div>
      </div>
    </div>
  );
};
