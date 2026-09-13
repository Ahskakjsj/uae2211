import React, { useState } from 'react';
import { X, Download, Copy, Check, FileText, Shield, Code, ListFilter, Image as ImageIcon, ShieldCheck } from 'lucide-react';
import { EventOccurrence, Stats, ServerLogo } from '../types';
import { generateAntiCheatWhitelist, generateSecurityReport } from '../scannerRules';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: EventOccurrence[];
  stats: Stats | null;
  onOpenLogosModal?: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ 
  isOpen, 
  onClose, 
  events, 
  stats,
  onOpenLogosModal 
}) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);

  if (!isOpen) return null;

  const triggerNamesList = Array.from(new Set(
    events.map(e => e.name.replace(/\s*\(.*?\)/g, '').trim())
  )).filter(Boolean);

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const downloadFile = (content: string, fileName: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadReport = () => {
    const report = generateSecurityReport(events, stats);
    downloadFile(report, `fivem_security_audit_${Date.now()}.md`, 'text/markdown');
  };

  const handleDownloadWhitelist = () => {
    const luaCfg = generateAntiCheatWhitelist(events);
    downloadFile(luaCfg, 'alzaabi_anticheat_whitelist.lua', 'text/x-lua');
  };

  const handleDownloadJson = () => {
    downloadFile(JSON.stringify(events, null, 2), 'fivem_triggers_audit.json', 'application/json');
  };

  return (
    <div 
      className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6 animate-modal-backdrop"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-surface border border-accent/30 rounded-2xl overflow-hidden shadow-2xl flex flex-col animate-modal-content"
      >
        {/* Header */}
        <div className="p-5 border-b border-border bg-bg/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-accent/20 border border-accent/40 flex items-center justify-center text-accent">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white tracking-tight">
                مركز تصدير التقارير والأنتيشيت
              </h3>
              <p className="text-[11px] text-text-dim">
                خيارات تصدير ذكية متوافقة مع سيرفرات FiveM وأنظمة الحماية
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

        {/* Options Grid */}
        <div className="p-5 space-y-3.5">
          {/* 1. Anti-Cheat Whitelist */}
          <div className="p-4 rounded-xl bg-bg border border-border hover:border-accent/40 transition-all flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-xs text-white">ملف وايت ليست للأنتيشيت (Lua Whitelist)</span>
                <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">FiveM Ready</span>
              </div>
              <p className="text-[11px] text-text-dim">
                كود Lua جاهز لإضافته لحماية السيرفر يسمح فقط بالتريقرات المعتمدة ويحظر أي تريقر خارجي.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleCopy(generateAntiCheatWhitelist(events), 'whitelist')}
                className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-text-dim hover:text-white flex items-center gap-1 border border-border"
              >
                {copiedType === 'whitelist' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                نسخ
              </button>
              <button
                onClick={handleDownloadWhitelist}
                className="px-3 py-1.5 rounded-lg bg-accent/20 hover:bg-accent/30 text-accent font-bold text-xs flex items-center gap-1 border border-accent/30"
              >
                <Download className="w-3.5 h-3.5" />
                تحميل .lua
              </button>
            </div>
          </div>

          {/* 2. Full Security Audit Report */}
          <div className="p-4 rounded-xl bg-bg border border-border hover:border-accent/40 transition-all flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-accent" />
                <span className="font-bold text-xs text-white">تقرير أمني شامل (Security Audit Report)</span>
                <span className="text-[9px] font-mono text-accent bg-accent/10 px-1.5 py-0.5 rounded">Markdown / TXT</span>
              </div>
              <p className="text-[11px] text-text-dim">
                تقرير احترافي يتضمن تقييم المخاطر، الثغرات المكتشفة، وإرشادات حماية مخصصة لمالك السيرفر.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleCopy(generateSecurityReport(events, stats), 'report')}
                className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-text-dim hover:text-white flex items-center gap-1 border border-border"
              >
                {copiedType === 'report' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                نسخ
              </button>
              <button
                onClick={handleDownloadReport}
                className="px-3 py-1.5 rounded-lg bg-accent/20 hover:bg-accent/30 text-accent font-bold text-xs flex items-center gap-1 border border-accent/30"
              >
                <Download className="w-3.5 h-3.5" />
                تحميل .md
              </button>
            </div>
          </div>

          {/* 3. Discovered AntiCheats & Protections */}
          {stats?.detectedProtections && stats.detectedProtections.length > 0 && (
            <div className="p-4 rounded-xl bg-bg border border-border hover:border-emerald-500/40 transition-all flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-xs text-white">أنظمة الحماية والأنتيشيت المكتشفة ({stats.detectedProtections.length})</span>
                  <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">Detected Systems</span>
                </div>
                <p className="text-[11px] text-text-dim">
                  {stats.detectedProtections.map(p => p.name).join(' • ')}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleCopy(stats.detectedProtections!.map(p => `[${p.type}] ${p.name} - ${p.description} (Files: ${p.filesFound.join(', ')})`).join('\n'), 'protections')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center gap-1 border border-emerald-500/30"
                >
                  {copiedType === 'protections' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedType === 'protections' ? 'تم النسخ!' : 'نسخ أسماء الحمايات'}
                </button>
              </div>
            </div>
          )}

          {/* 4. Server Logos Download Gallery */}
          {stats?.serverLogos && stats.serverLogos.length > 0 && (
            <div className="p-4 rounded-xl bg-bg border border-border hover:border-amber-500/40 transition-all flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-xs text-white">لوقوهات وشعارات السيرفر المستخرجة ({stats.serverLogos.length})</span>
                  <span className="text-[9px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">PNG / JPG / WEBP</span>
                </div>
                <p className="text-[11px] text-text-dim">
                  تم استخراج جميع صور ولوقوهات السيرفر من ملفات الحزمة، يمكنك استعراضها وتحميلها بنقرة واحدة.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    onClose();
                    if (onOpenLogosModal) onOpenLogosModal();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs flex items-center gap-1 border border-amber-500/30 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  استعراض وتحميل اللوقوهات
                </button>
              </div>
            </div>
          )}

          {/* 5. Raw Trigger Names List */}
          <div className="p-4 rounded-xl bg-bg border border-border hover:border-accent/40 transition-all flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <ListFilter className="w-4 h-4 text-purple-400" />
                <span className="font-bold text-xs text-white">قائمة أسماء التريقرات فقط (Names List)</span>
                <span className="text-[9px] font-mono text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">{triggerNamesList.length} Trigger</span>
              </div>
              <p className="text-[11px] text-text-dim">
                نسخ أسماء كل التريقرات سطراً بسطر للصقها فورياً في أدواتك أو شات الديسكورد.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleCopy(triggerNamesList.join('\n'), 'names')}
                className="px-3 py-1.5 rounded-lg bg-accent hover:bg-accent/90 text-white font-bold text-xs flex items-center gap-1 shadow-[0_0_10px_rgba(99,102,241,0.2)]"
              >
                {copiedType === 'names' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedType === 'names' ? 'تم النسخ!' : 'نسخ القائمة'}
              </button>
            </div>
          </div>

          {/* 6. Raw JSON Export */}
          <div className="p-4 rounded-xl bg-bg border border-border hover:border-accent/40 transition-all flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-xs text-white">ملف بيانات خام (Raw JSON Audit)</span>
              </div>
              <p className="text-[11px] text-text-dim">
                بيانات مهيكلة للأحداث بصيغة JSON قابلة للتحليل البرمجي.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleDownloadJson}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-text-dim hover:text-white font-bold text-xs flex items-center gap-1 border border-border"
              >
                <Download className="w-3.5 h-3.5" />
                تحميل .json
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-bg/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
