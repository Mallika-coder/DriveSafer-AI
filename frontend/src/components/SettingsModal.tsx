import React from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  earThresh: number;
  setEarThresh: (val: number) => void;
  marThresh: number;
  setMarThresh: (val: number) => void;
}

export default function SettingsModal({ isOpen, onClose, earThresh, setEarThresh, marThresh, setMarThresh }: SettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-[#121b2d] border border-[#1f2d47] rounded-xl p-8 w-full max-w-md shadow-2xl">
        <h2 className="text-2xl font-orbitron text-[#00d4ff] mb-6">Settings</h2>
        
        <div className="space-y-6">
          <div>
            <label className="flex justify-between text-gray-300 mb-2">
              <span>EAR Threshold (Drowsiness)</span>
              <span className="text-[#00d4ff]">{earThresh.toFixed(2)}</span>
            </label>
            <input 
              type="range" 
              min="0.1" max="0.4" step="0.01" 
              value={earThresh}
              onChange={(e) => setEarThresh(parseFloat(e.target.value))}
              className="w-full accent-[#00d4ff]"
            />
            <p className="text-xs text-gray-500 mt-1">Lower = more sensitive. Default: 0.25</p>
          </div>

          <div>
            <label className="flex justify-between text-gray-300 mb-2">
              <span>MAR Threshold (Yawn)</span>
              <span className="text-warning">{marThresh.toFixed(2)}</span>
            </label>
            <input 
              type="range" 
              min="0.3" max="1.0" step="0.01" 
              value={marThresh}
              onChange={(e) => setMarThresh(parseFloat(e.target.value))}
              className="w-full accent-warning"
            />
            <p className="text-xs text-gray-500 mt-1">Lower = more sensitive. Default: 0.60</p>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-[#00d4ff] text-[#0a0f1e] rounded font-bold hover:bg-white transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
