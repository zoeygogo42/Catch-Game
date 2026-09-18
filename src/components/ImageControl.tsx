import React, { useState } from 'react';
import { validateImageUrl } from '../utils/imageUtils';
import { Image as ImageIcon, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

interface ImageControlProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  helperText?: string;
}

export const ImageControl: React.FC<ImageControlProps> = ({ label, value, onChange, helperText }) => {
  const [mode, setMode] = useState<'url' | 'upload'>('url');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const handleUrlChange = async (url: string) => {
    onChange(url);
    if (!url.trim()) {
      setError('');
      setSuccess('');
      return;
    }

    const res = await validateImageUrl(url);
    if (!res.isValid) {
      setError(res.error || 'Invalid image URL');
      setSuccess('');
    } else {
      setError('');
      setSuccess('Image validated & loaded successfully!');
      if (res.convertedUrl !== url) {
        onChange(res.convertedUrl);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        onChange(result);
        setSuccess('Image uploaded successfully!');
        setError('');
      }
    };
    reader.onerror = () => {
      setError('Failed to read uploaded file.');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-200 space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-800 uppercase tracking-wide">{label}</label>
        <div className="flex items-center gap-1 bg-slate-200 p-0.5 rounded-lg text-xs">
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${mode === 'url' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'}`}
          >
            URL
          </button>
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${mode === 'upload' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'}`}
          >
            Upload
          </button>
        </div>
      </div>

      <div className="flex gap-4 items-start">
        {/* Preview box */}
        <div className="w-20 h-20 rounded-xl bg-white border border-slate-300 overflow-hidden flex items-center justify-center shrink-0 relative group shadow-xs">
          {value ? (
            <>
              <img src={value} alt="Preview" className="w-full h-full object-cover" onError={() => setError('Image failed to load')} />
              <button
                type="button"
                onClick={() => onChange('')}
                className="absolute inset-0 bg-slate-900/60 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-bold gap-1"
                title="Remove Image"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          ) : (
            <ImageIcon className="w-6 h-6 text-slate-400" />
          )}
        </div>

        {/* Input area */}
        <div className="flex-1 space-y-2">
          {mode === 'url' ? (
            <div>
              <input
                type="url"
                value={value}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://... or Google Drive link"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          ) : (
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              />
            </div>
          )}

          <p className="text-[11px] text-slate-500">
            {helperText || 'Use a direct public image URL. Google Drive share links will be auto-converted.'}
          </p>

          {error && (
            <p className="text-xs text-rose-600 flex items-center gap-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
            </p>
          )}
          {success && (
            <p className="text-xs text-emerald-600 flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> {success}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
