import React, { useState, useEffect } from 'react';
import { BackgroundState } from '../types';
import { validateImageUrl } from '../utils/imageUtils';
import { ImageIcon, Trash2, CheckCircle2, AlertCircle, RefreshCw, Upload } from 'lucide-react';

interface BackgroundControlProps {
  label: string;
  state: BackgroundState;
  onChange: (newState: BackgroundState) => void;
  helperText?: string;
}

export const BackgroundControl: React.FC<BackgroundControlProps> = ({
  label,
  state = { enabled: true, type: 'none', value: '', fallbackColor: '#FFF7F2' },
  onChange,
  helperText,
}) => {
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Validate URL whenever state type or value changes
  useEffect(() => {
    if (state.type === 'url' && state.value.trim()) {
      validateUrl(state.value);
    } else {
      setError('');
      setSuccess('');
    }
  }, [state.value, state.type]);

  const validateUrl = async (url: string) => {
    const res = await validateImageUrl(url);
    if (!res.isValid) {
      setError(res.error || 'Invalid image URL');
      setSuccess('');
    } else {
      setError('');
      setSuccess('Image validated & loaded successfully!');
      if (res.convertedUrl !== url) {
        onChange({ ...state, value: res.convertedUrl });
      }
    }
  };

  const handleToggle = (enabled: boolean) => {
    onChange({ ...state, enabled });
  };

  const handleTypeChange = (type: 'none' | 'upload' | 'url') => {
    onChange({ ...state, type });
  };

  const handleUrlInput = (url: string) => {
    onChange({ ...state, value: url });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        onChange({ ...state, value: result });
        setSuccess('Image uploaded successfully!');
        setError('');
      }
    };
    reader.onerror = () => {
      setError('Failed to read uploaded file.');
    };
    reader.readAsDataURL(file);
  };

  const handleColorChange = (color: string) => {
    onChange({ ...state, fallbackColor: color });
  };

  const clearImage = () => {
    onChange({ ...state, value: '' });
    setError('');
    setSuccess('');
  };

  const showInputControls = state.enabled && state.type !== 'none';

  return (
    <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-200/80 space-y-4">
      {/* 1. Header (Label & Show Toggle) */}
      <div className="flex items-center justify-between">
        <div>
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">{label}</label>
          {helperText && <p className="text-[10px] text-slate-400 mt-0.5">{helperText}</p>}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500 font-medium">Show Background</span>
          <label className="relative inline-flex items-center cursor-pointer select-none">
            <input
              type="checkbox"
              checked={state.enabled}
              onChange={(e) => handleToggle(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>

      {state.enabled && (
        <div className="space-y-4 pt-1">
          {/* 2. Source Selector Buttons */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Source Type</span>
            <div className="flex bg-slate-200/70 p-1 rounded-xl text-xs w-full max-w-xs">
              {(['none', 'upload', 'url'] as const).map((sourceType) => (
                <button
                  key={sourceType}
                  type="button"
                  onClick={() => handleTypeChange(sourceType)}
                  className={`flex-1 py-1.5 rounded-lg font-bold transition-all capitalize ${
                    state.type === sourceType
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {sourceType === 'none' ? 'None (Color)' : sourceType}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Image Input Details (Upload/URL) */}
          {showInputControls && (
            <div className="flex gap-4 items-start bg-white p-4 rounded-xl border border-slate-200/60 shadow-xs">
              {/* Image Preview Window */}
              <div className="w-20 h-20 rounded-xl bg-slate-50 border border-slate-300/80 overflow-hidden flex items-center justify-center shrink-0 relative group shadow-inner">
                {state.value ? (
                  <>
                    <img
                      src={state.value}
                      alt="Background preview"
                      className="w-full h-full object-cover"
                      onError={() => setError('Image failed to load / render')}
                    />
                    <button
                      type="button"
                      onClick={clearImage}
                      className="absolute inset-0 bg-slate-900/60 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-bold gap-1"
                      title="Remove Image"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <ImageIcon className="w-6 h-6 text-slate-300" />
                )}
              </div>

              {/* Upload or URL Action Side Panel */}
              <div className="flex-1 min-w-0 space-y-2">
                {state.type === 'upload' ? (
                  <div className="space-y-2">
                    <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg border border-blue-200 cursor-pointer transition-all">
                      <Upload className="w-3.5 h-3.5" />
                      {state.value ? 'Replace Image' : 'Upload Image'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                    {state.value && (
                      <button
                        type="button"
                        onClick={clearImage}
                        className="ml-2 inline-flex items-center gap-1 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-lg border border-rose-200 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <input
                      type="url"
                      value={state.value}
                      onChange={(e) => handleUrlInput(e.target.value)}
                      placeholder="https://... image link"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                    />
                    {state.value && (
                      <button
                        type="button"
                        onClick={clearImage}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-slate-800 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Clear URL
                      </button>
                    )}
                  </div>
                )}

                {error && (
                  <p className="text-xs text-rose-600 flex items-center gap-1 font-medium bg-rose-50/50 p-1.5 rounded-lg border border-rose-100">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
                  </p>
                )}
                {success && !error && (
                  <p className="text-xs text-emerald-600 flex items-center gap-1 font-medium bg-emerald-50/50 p-1.5 rounded-lg border border-emerald-100">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> {success}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 4. Fallback Background Color */}
          <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200/60 max-w-sm">
            <div className="space-y-0.5 flex-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Fallback Color</span>
              <p className="text-[9px] text-slate-400">Used if image is loading or type is None</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={state.fallbackColor}
                onChange={(e) => handleColorChange(e.target.value)}
                className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 p-0.5 bg-white shrink-0"
              />
              <input
                type="text"
                value={state.fallbackColor}
                onChange={(e) => handleColorChange(e.target.value)}
                className="w-20 px-2 py-1 rounded-lg border border-slate-300 text-xs font-mono uppercase text-center focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
