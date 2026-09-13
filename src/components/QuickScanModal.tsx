import React, { useState } from 'react';
import { X, Code2, Zap, FileCode, CheckCircle2 } from 'lucide-react';
import { scanContent } from '../scannerRules';
import { EventOccurrence } from '../types';

interface QuickScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResultsReady?: (events: EventOccurrence[], fileName: string) => void;
  onScanComplete?: (events: EventOccurrence[], fileName: string) => void;
}

export const QuickScanModal: React.FC<QuickScanModalProps> = ({ 
  isOpen, 
  onClose, 
  onResultsReady,
  onScanComplete 
}) => {
  const [code, setCode] = useState<string>('');
  const [fileName, setFileName] = useState<string>('custom_script.lua');
  const [analyzing, setAnalyzing] = useState(false);

  if (!isOpen) return null;

  const handleScan = () => {
    if (!code.trim()) return;
    setAnalyzing(true);
    setTimeout(() => {
      const targetFileName = fileName.trim() || 'snippet.lua';
      const occurrences = scanContent(code, targetFileName);
      if (typeof onResultsReady === 'function') {
        onResultsReady(occurrences, targetFileName);
      }
      if (typeof onScanComplete === 'function') {
        onScanComplete(occurrences, targetFileName);
      }
      setAnalyzing(false);
      onClose();
    }, 400);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6 animate-modal-backdrop"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-surface border border-accent/30 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-modal-content"
      >
        {/* Header */}
        <div className="p-5 border-b border-border bg-bg/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-accent/20 border border-accent/40 flex items-center justify-center text-accent">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white tracking-tight flex items-center gap-2">
                فحص كود مباشر <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Quick Snippet</span>
              </h3>
              <p className="text-[11px] text-text-dim">
                الصق كود ملف مشبوه لفحصه واستخراج التريقرات والثغرات دون الحاجة لملف ZIP
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-dim hover:text-white hover:bg-white/5 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="p-5 space-y-4 flex-1 overflow-y-auto">
          <div>
            <label className="text-xs font-bold text-text-dim mb-1.5 block flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5 text-accent" />
              اسم الملف الوهمي (File Name):
            </label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="مثال: esx_policejob/server.lua"
              className="w-full bg-bg border border-border focus:border-accent rounded-lg py-2 px-3 text-xs font-mono text-white focus:outline-none transition-all"
              dir="ltr"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <label className="font-bold text-text-dim">كود الملف (Lua / JS):</label>
              <button
                onClick={() => setCode(`-- سكريبت تجريبي
RegisterServerEvent("esx_addon:giveReward")
AddEventHandler("esx_addon:giveReward", function(amount)
    giveMoney(amount)
end)

-- Discord Logger
local webhook = "https://discord.com/api/webhooks/999999/testWebhookSecret"
PerformHttpRequest(webhook, function() end, 'POST')
`)}
                className="text-[11px] text-accent hover:underline"
              >
                إدراج نموذج تجريبي
              </button>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="الصق كود Lua هنا..."
              rows={10}
              className="w-full bg-bg border border-border focus:border-accent rounded-xl p-3.5 font-mono text-xs text-indigo-200/90 focus:outline-none transition-all resize-none selection:bg-accent/30"
              dir="ltr"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-bg/50 flex items-center justify-between">
          <span className="text-[11px] text-text-dim font-mono">
            {code.split('\n').filter(Boolean).length} أسطر برمجية
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-text-dim hover:text-white text-xs transition-colors"
            >
              إلغاء
            </button>
            <button
              disabled={!code.trim() || analyzing}
              onClick={handleScan}
              className="px-5 py-2 rounded-lg bg-accent hover:bg-accent/90 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all"
            >
              {analyzing ? (
                <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <Zap className="w-3.5 h-3.5" />
              )}
              فحص واستخراج النتائج
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
