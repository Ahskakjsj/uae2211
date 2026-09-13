import React, { useState } from 'react';
import { 
  X, Cpu, Radio, Shield, Zap, Search, Copy, Check, 
  Layers, Lock, Database, Code, CheckCircle2, RefreshCw
} from 'lucide-react';

interface BytecodeInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInjectDecoded?: (code: string) => void;
}

export const BytecodeInspectorModal: React.FC<BytecodeInspectorModalProps> = ({
  isOpen,
  onClose,
  onInjectDecoded
}) => {
  const [bytecodeInput, setBytecodeInput] = useState<string>(
    `-- FiveM Lua 5.3 / 5.4 Bytecode Sample or VM Strings
\x1bLuaQ\x00\x01\x04\x08\x04\x08\x00
TriggerServerEvent
esx:giveInventoryItem
weapon_assaultrifle
admin_godmode_bypass
PerformHttpRequest
https://discord.com/api/webhooks/1234567890/token_secret
DropPlayer
Citizen.CreateThread`
  );

  const [extractedStrings, setExtractedStrings] = useState<string[]>([]);
  const [extractedOpCodes, setExtractedOpCodes] = useState<string[]>([]);
  const [hasScanned, setHasScanned] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleAnalyze = () => {
    // 1. Scrape ASCII & UTF-8 printable string constants of length >= 4
    const stringMatches = Array.from(
      new Set(
        (bytecodeInput.match(/[a-zA-Z0-9_\-:\/\.]{4,}/g) || []).filter(
          str => !/^\d+$/.test(str)
        )
      )
    );

    // 2. Look for Lua VM opcodes and native headers
    const opcodes: string[] = [];
    if (bytecodeInput.includes('\x1bLua') || bytecodeInput.includes('LuaQ') || bytecodeInput.includes('LuaR')) {
      opcodes.push('HEADER: Lua Bytecode Signature Valid (Lua 5.1-5.4)');
    }
    if (bytecodeInput.includes('CLOSURE') || bytecodeInput.includes('GETGLOBAL') || bytecodeInput.includes('CALL')) {
      opcodes.push('OPCODE: Lua Standard Execution Cycle Found');
    }
    if (bytecodeInput.includes('TriggerServerEvent')) {
      opcodes.push('RPC: Client-to-Server Network Dispatch Detected');
    }
    if (bytecodeInput.includes('PerformHttpRequest')) {
      opcodes.push('HTTP: Outbound Network Request Beacon Detected');
    }
    if (bytecodeInput.includes('DropPlayer')) {
      opcodes.push('SECURITY: Disconnection / Ban Event Hook Detected');
    }

    setExtractedStrings(stringMatches);
    setExtractedOpCodes(opcodes);
    setHasScanned(true);
  };

  const handleCopyString = (str: string, index: number) => {
    navigator.clipboard.writeText(str);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6 animate-modal-backdrop"
      onClick={onClose}
    >
      <div 
        onClick={e => e.stopPropagation()}
        className="w-full max-w-3xl bg-surface border border-purple-500/40 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-modal-content"
      >
        {/* Header */}
        <div className="p-5 border-b border-border bg-bg/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white tracking-tight flex items-center gap-2">
                محلل البايت كود والـ VM <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">Bytecode Dumper</span>
              </h3>
              <p className="text-xs text-text-dim mt-0.5">
                استخراج الثوابت، التريقرات والنصوص المخفية من داخل ملفات Lua Bytecode المشفرة
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-text-dim hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Bytecode / Raw Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-text-dim flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-purple-400" />
                <span>المدخلات المشفرة أو كود البايت كود (Raw Bytecode / Encrypted VM Stream)</span>
              </label>
              <button
                onClick={handleAnalyze}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition-all shadow-md cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 fill-white" />
                <span>تحليل واستخراج الثوابت</span>
              </button>
            </div>
            <textarea
              value={bytecodeInput}
              onChange={e => setBytecodeInput(e.target.value)}
              rows={5}
              placeholder="ألصق كود البايت كود أو الأحرف المشفرة هنا..."
              className="w-full p-3 bg-bg border border-border rounded-xl font-mono text-xs text-purple-300 focus:outline-none focus:border-purple-400 transition-colors select-text"
              dir="ltr"
            />
          </div>

          {/* Analysis Findings */}
          {hasScanned && (
            <div className="space-y-4">
              {/* VM Opcode Detections */}
              {extractedOpCodes.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" />
                    <span>توقيعات الـ VM والأوب كود المكتشفة:</span>
                  </label>
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl font-mono text-xs text-emerald-300 space-y-1" dir="ltr">
                    {extractedOpCodes.map((op, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>{op}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Extracted String Constants */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-text-dim flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-accent" />
                    <span>النصوص والتريقرات المستخرجة ({extractedStrings.length})</span>
                  </label>
                  {extractedStrings.length > 0 && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(extractedStrings.join('\n'));
                      }}
                      className="text-[11px] text-accent hover:underline cursor-pointer font-medium"
                    >
                      نسخ جميع النصوص
                    </button>
                  )}
                </div>

                {extractedStrings.length === 0 ? (
                  <div className="p-4 bg-bg border border-border rounded-xl text-center text-xs text-text-dim">
                    لم يتم العثور على نصوص مقروءة صريحة. قد يكون الكود مشفر بطبقة تشفير إضافية.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1">
                    {extractedStrings.map((str, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-lg bg-bg border border-border hover:border-purple-400/50 transition-colors group"
                      >
                        <span className="font-mono text-xs text-white truncate max-w-[240px]" dir="ltr">
                          {str}
                        </span>
                        <button
                          onClick={() => handleCopyString(str, idx)}
                          className="p-1 rounded bg-white/5 hover:bg-white/10 text-text-dim hover:text-white transition-colors"
                          title="نسخ"
                        >
                          {copiedIndex === idx ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-bg/80 flex items-center justify-between">
          <div className="text-[11px] text-text-dim">
            يساعدك في استخراج الروابط السرية والتريقرات المخفية داخل سكريبتات الـ Tebex والـ Escrow
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-white transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
