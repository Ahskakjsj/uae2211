import React, { useState } from 'react';
import { 
  X, Crosshair, Terminal, Play, Copy, Check, ShieldAlert, Sparkles, 
  Send, RefreshCw, AlertTriangle, Layers, Code, Zap
} from 'lucide-react';
import { EventOccurrence } from '../types';

interface PayloadInjectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedEvent?: EventOccurrence | null;
  allEvents?: EventOccurrence[];
}

export const PayloadInjectorModal: React.FC<PayloadInjectorModalProps> = ({
  isOpen,
  onClose,
  selectedEvent,
  allEvents = []
}) => {
  const [targetEvent, setTargetEvent] = useState<string>(selectedEvent?.name || '');
  const [eventType, setEventType] = useState<'server' | 'client' | 'command'>('server');
  const [presetType, setPresetType] = useState<string>('custom');
  const [customArgs, setCustomArgs] = useState<string>('{\n  "amount": 999999,\n  "account": "bank"\n}');
  const [logs, setLogs] = useState<Array<{ id: string; time: string; text: string; status: 'info' | 'success' | 'danger' | 'warning' }>>([
    {
      id: 'log-0',
      time: new Date().toLocaleTimeString(),
      text: '[INJECTOR ENGINE READY] - محاكي الاستدعاء والتجربة جاهز لفحص رد فعل الخادم',
      status: 'info'
    }
  ]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  if (!isOpen) return null;

  // Generate payload code based on selections
  const generateExecutableCode = (): string => {
    const cleanName = targetEvent.replace(/\s*\(.*?\)/g, '').trim();
    if (eventType === 'command') {
      return `ExecuteCommand("${cleanName}")`;
    }
    
    // Parse parameters
    let parsedArgs = '';
    try {
      if (customArgs.trim()) {
        const obj = JSON.parse(customArgs);
        if (Array.isArray(obj)) {
          parsedArgs = obj.map(item => typeof item === 'string' ? `"${item}"` : JSON.stringify(item)).join(', ');
        } else if (typeof obj === 'object') {
          parsedArgs = Object.values(obj).map(v => typeof v === 'string' ? `"${v}"` : JSON.stringify(v)).join(', ');
        } else {
          parsedArgs = String(obj);
        }
      }
    } catch {
      parsedArgs = customArgs;
    }

    if (eventType === 'server') {
      return `TriggerServerEvent("${cleanName}"${parsedArgs ? `, ${parsedArgs}` : ''})`;
    } else {
      return `TriggerClientEvent("${cleanName}", -1${parsedArgs ? `, ${parsedArgs}` : ''})`;
    }
  };

  const handleApplyPreset = (type: string) => {
    setPresetType(type);
    if (type === 'money') {
      setCustomArgs('{\n  "amount": 500000,\n  "type": "cash"\n}');
    } else if (type === 'item') {
      setCustomArgs('{\n  "item": "weapon_pistol",\n  "count": 1\n}');
    } else if (type === 'admin') {
      setCustomArgs('{\n  "group": "superadmin",\n  "permission": "god"\n}');
    } else if (type === 'sqli') {
      setCustomArgs('{\n  "identifier": "steam:1100001\' OR 1=1 --"\n}');
    } else if (type === 'empty') {
      setCustomArgs('{}');
    }
  };

  const handleSimulateExecution = () => {
    if (!targetEvent.trim()) return;
    setIsExecuting(true);
    const code = generateExecutableCode();
    
    const newLog = {
      id: `log-${Date.now()}`,
      time: new Date().toLocaleTimeString(),
      text: `[SEND] جاري إرسال البايلود إلى الخادم: ${code}`,
      status: 'warning' as const
    };

    setLogs(prev => [newLog, ...prev]);

    setTimeout(() => {
      let resultText = '';
      let resultStatus: 'info' | 'success' | 'danger' | 'warning' = 'info';

      const isProtected = targetEvent.toLowerCase().includes('ban') || targetEvent.toLowerCase().includes('anticheat');
      const isCritical = targetEvent.toLowerCase().includes('admin') || targetEvent.toLowerCase().includes('give');

      if (isProtected) {
        resultText = `[BLOCKED] تم حظر التريقر من قبل الحماية (Trigger Blocked by Anticheat Signature)`;
        resultStatus = 'danger';
      } else if (isCritical) {
        resultText = `[VULNERABLE RESPONSE] الخادم لم يطلب Source Verification! التريقر استجاب بنجاح (Exploit Vector Confirmed)`;
        resultStatus = 'danger';
      } else {
        resultText = `[DISPATCHED] تم تنفيذ الحدث بنجاح دون أخطاء (Event Triggered Successfully)`;
        resultStatus = 'success';
      }

      setLogs(prev => [
        {
          id: `log-${Date.now() + 1}`,
          time: new Date().toLocaleTimeString(),
          text: resultText,
          status: resultStatus
        },
        ...prev
      ]);
      setIsExecuting(false);
    }, 600);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generateExecutableCode());
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6 animate-modal-backdrop"
      onClick={onClose}
    >
      <div 
        onClick={e => e.stopPropagation()}
        className="w-full max-w-3xl bg-surface border border-cyan-500/40 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-modal-content"
      >
        {/* Header */}
        <div className="p-5 border-b border-border bg-bg/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
              <Crosshair className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white tracking-tight flex items-center gap-2">
                محاكي اختبار واستدعاء التريقرات <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">Trigger Lab</span>
              </h3>
              <p className="text-xs text-text-dim mt-0.5">
                توليد أكواد الاستدعاء واختبار استجابة التريقرات والثغرات وصياغة بايلودات الحماية
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
          {/* Target Event Input & Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-text-dim flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                <span>اسم التريقر / الحدث المستهدف (Target Event Name)</span>
              </label>
              {allEvents.length > 0 && (
                <span className="text-[10px] text-text-dim">
                  متوفر {allEvents.length} حدث مكتشف
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <input 
                type="text"
                value={targetEvent}
                onChange={e => setTargetEvent(e.target.value)}
                placeholder="esx:giveInventoryItem أو qb-banking:server:deposit"
                className="flex-1 px-3 py-2 bg-bg border border-border rounded-xl font-mono text-xs text-white focus:outline-none focus:border-cyan-400 transition-colors"
                dir="ltr"
              />

              {allEvents.length > 0 && (
                <select
                  onChange={e => {
                    if (e.target.value) setTargetEvent(e.target.value);
                  }}
                  className="px-3 py-2 bg-bg border border-border rounded-xl text-xs text-text-dim focus:outline-none focus:border-cyan-400 cursor-pointer max-w-[200px]"
                >
                  <option value="">اختر من التريقرات...</option>
                  {allEvents.slice(0, 50).map((ev, i) => (
                    <option key={i} value={ev.name}>{ev.name} ({ev.type})</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Event Type & Quick Presets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-dim">نوع الاستدعاء (Trigger Method)</label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-bg border border-border rounded-xl">
                <button
                  type="button"
                  onClick={() => setEventType('server')}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                    eventType === 'server' 
                      ? 'bg-accent text-white shadow-sm' 
                      : 'text-text-dim hover:text-white'
                  }`}
                >
                  Server Event
                </button>
                <button
                  type="button"
                  onClick={() => setEventType('client')}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                    eventType === 'client' 
                      ? 'bg-emerald-600 text-white shadow-sm' 
                      : 'text-text-dim hover:text-white'
                  }`}
                >
                  Client Event
                </button>
                <button
                  type="button"
                  onClick={() => setEventType('command')}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                    eventType === 'command' 
                      ? 'bg-orange-500 text-white shadow-sm' 
                      : 'text-text-dim hover:text-white'
                  }`}
                >
                  Command
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-dim">قوالب البيانات الجاهزة (Payload Templates)</label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'money', label: '💵 أموال (Money)' },
                  { id: 'item', label: '📦 عناصر (Item)' },
                  { id: 'admin', label: '👑 صلاحيات (Admin)' },
                  { id: 'sqli', label: '💉 فحص حقن SQL' },
                  { id: 'empty', label: '⚡ فارغ' }
                ].map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleApplyPreset(p.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all cursor-pointer ${
                      presetType === p.id 
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' 
                        : 'bg-bg border-border text-text-dim hover:text-white'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Parameters Payload JSON */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-text-dim flex items-center justify-between">
              <span>المعاملات الممررة (Payload Arguments - JSON)</span>
              <span className="text-[10px] font-mono text-text-dim">صيغة مصفوفة أو كائن</span>
            </label>
            <textarea
              value={customArgs}
              onChange={e => setCustomArgs(e.target.value)}
              rows={3}
              className="w-full p-3 bg-bg border border-border rounded-xl font-mono text-xs text-emerald-400 focus:outline-none focus:border-cyan-400 transition-colors"
              dir="ltr"
            />
          </div>

          {/* Output Code Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-text-dim flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-accent" />
                <span>كود الاستدعاء المولد (Generated Lua Payload)</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-white/5 hover:bg-white/10 text-text-dim hover:text-white transition-colors"
                >
                  {copiedScript ? <><Check className="w-3 h-3 text-emerald-400" /> تم النسخ</> : <><Copy className="w-3 h-3" /> نسخ الكود</>}
                </button>
              </div>
            </div>
            <pre className="p-3 bg-bg border border-cyan-500/30 rounded-xl font-mono text-xs text-cyan-300 overflow-x-auto shadow-inner" dir="ltr">
              {generateExecutableCode()}
            </pre>
          </div>

          {/* Simulation Console Log Output */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-text-dim flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>سجل المحاكاة التفاعلية (Simulation Console)</span>
              </label>
              <button
                onClick={() => setLogs([])}
                className="text-[10px] text-text-dim hover:text-white"
              >
                مسح السجل
              </button>
            </div>
            
            <div className="h-32 overflow-y-auto p-3 bg-black/70 border border-border rounded-xl font-mono text-[11px] space-y-1.5">
              {logs.map(log => (
                <div 
                  key={log.id} 
                  className={`flex items-start gap-2 ${
                    log.status === 'danger' ? 'text-rose-400 font-bold' :
                    log.status === 'warning' ? 'text-amber-300' :
                    log.status === 'success' ? 'text-emerald-400' : 'text-text-dim'
                  }`}
                  dir="ltr"
                >
                  <span className="text-[10px] opacity-50">[{log.time}]</span>
                  <span className="break-all">{log.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-border bg-bg/80 flex items-center justify-between">
          <div className="text-[11px] text-text-dim">
            محاكي آمن لا يؤثر على الخوادم الحية | مبني لأغراض اختبار الثغرات وتأمين السيرفر
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSimulateExecution}
              disabled={isExecuting || !targetEvent.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              {isExecuting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-white" />}
              <span>تشغيل المحاكاة (Test Payload)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
