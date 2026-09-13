import React, { useState, useMemo } from 'react';
import { 
  Crosshair, 
  Flame, 
  AlertOctagon, 
  Check, 
  Copy, 
  Download, 
  X, 
  ExternalLink, 
  Terminal, 
  ShieldAlert, 
  Sparkles, 
  FileCode, 
  Eye, 
  Globe, 
  Bug, 
  Wrench,
  Search,
  CheckCircle2
} from 'lucide-react';
import { EventOccurrence } from '../types';

interface BackdoorHunterModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: EventOccurrence[];
}

export interface BackdoorThreat {
  id: string;
  name: string;
  type: 'RCE' | 'NETWORK' | 'OS_EXEC' | 'ADMIN_PRIV' | 'SANDBOX_BYPASS' | 'OBFUSCATION';
  file: string;
  line: number;
  snippet: string;
  severity: 'critical' | 'high' | 'medium';
  description: string;
  exploitMechanism: string;
  recommendation: string;
}

export const BackdoorHunterModal: React.FC<BackdoorHunterModalProps> = ({
  isOpen,
  onClose,
  events
}) => {
  const [selectedThreat, setSelectedThreat] = useState<BackdoorThreat | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [sanitizedCode, setSanitizedCode] = useState<string>('');

  // Extract threats that match backdoor / exfiltration patterns
  const threats = useMemo(() => {
    const list: BackdoorThreat[] = [];

    events.forEach((ev, idx) => {
      const lowerName = ev.name.toLowerCase();
      const lowerContext = ev.context.toLowerCase();
      const lowerCat = (ev.category || '').toLowerCase();

      // 1. RCE / Loadstring / Beacon
      if (
        lowerName.includes('rce') || 
        lowerContext.includes('loadstring') || 
        lowerContext.includes('load(') ||
        lowerCat.includes('cipher') ||
        lowerName.includes('beacon')
      ) {
        list.push({
          id: `threat_${idx}`,
          name: ev.name || 'Remote Code Execution (RCE) / Dynamic Loader',
          type: 'RCE',
          file: ev.file,
          line: ev.line,
          snippet: ev.context,
          severity: 'critical',
          description: 'تنفيذ ديناميكي لأكواد خارجية عبر الذاكرة بدون فحص مسبق.',
          exploitMechanism: 'يقوم المخترق بتمرير أوامر برمجية عبر HTTP أو استدعاء خارجي لتحميل باك دور والتحكم بالسيرفر.',
          recommendation: 'احذف استدعاء loadstring واستبدله بوحدات برمجية ثابتة أو تحقق من الملف المصدر.'
        });
      }
      // 2. OS Calls
      else if (
        lowerContext.includes('os.execute') || 
        lowerContext.includes('os.remove') || 
        lowerContext.includes('os.rename') ||
        lowerName.includes('os library')
      ) {
        list.push({
          id: `threat_${idx}`,
          name: 'Dangerous OS Execution (أوامر نظام التشغيل)',
          type: 'OS_EXEC',
          file: ev.file,
          line: ev.line,
          snippet: ev.context,
          severity: 'critical',
          description: 'استدعاء أوامر نظام التشغيل والـ Shell مباشرة من داخل سكريبت اللعبة.',
          exploitMechanism: 'يمكن استغلاله لحذف ملفات الخادم، قفل السيرفر، أو تشغيل برمجيات خبيثة على نظام الـ VPS.',
          recommendation: 'احظر مكتبة os كلياً في إعدادات FiveM FXServer.'
        });
      }
      // 3. Hardcoded Admin Backdoor
      else if (
        lowerName.includes('admin backdoor') || 
        lowerContext.includes('superadmin') || 
        lowerContext.includes('add_principal') ||
        lowerContext.includes('group.admin')
      ) {
        list.push({
          id: `threat_${idx}`,
          name: 'Hardcoded Admin Backdoor (أدمن مخفي بهوية ثابتة)',
          type: 'ADMIN_PRIV',
          file: ev.file,
          line: ev.line,
          snippet: ev.context,
          severity: 'critical',
          description: 'منح رتبة أدمن أو صلاحيات عليا لهوية Steam أو Discord محددة مسبقاً داخل الكود.',
          exploitMechanism: 'يسمح لصاحب الكود أو المسرب بالحصول على أدمن تلقائياً بمجرد دخوله سيرفرك.',
          recommendation: 'احذف شرط الهوية الثابت واستخدم نظام الصلاحيات المعتمد (ACE Permissions).'
        });
      }
      // 4. Outbound Network & Webhook
      else if (
        ev.type === 'webhook' || 
        lowerContext.includes('discord.com/api/webhooks') ||
        lowerContext.includes('pastebin.com') ||
        lowerContext.includes('raw.githubusercontent') ||
        lowerContext.includes('performhttprequest')
      ) {
        list.push({
          id: `threat_${idx}`,
          name: ev.type === 'webhook' ? 'Discord Webhook Data Exfiltration' : 'Suspicious External HTTP Request',
          type: 'NETWORK',
          file: ev.file,
          line: ev.line,
          snippet: ev.context,
          severity: ev.type === 'webhook' ? 'medium' : 'high',
          description: 'اتصال خارجي لنقل بيانات السيرفر أو استقبال أوامر مشبوهة.',
          exploitMechanism: 'تسريب سجلات الأدمنية، عناوين الـ IP الخاصة باللاعبين، أو التواصل مع خوادم تحكم خارجية (C2).',
          recommendation: 'تأكد من أن الرابط يتبع لإدارتك وقم بتخزينه في ملف إعدادات داخلي محمي.'
        });
      }
      // 5. Sandbox Bypass & Debug
      else if (
        lowerContext.includes('rawget') || 
        lowerContext.includes('debug.setupvalue') || 
        lowerContext.includes('debug.getregistry')
      ) {
        list.push({
          id: `threat_${idx}`,
          name: 'Sandbox Bypass / Debug Manipulation',
          type: 'SANDBOX_BYPASS',
          file: ev.file,
          line: ev.line,
          snippet: ev.context,
          severity: 'high',
          description: 'التلاعب ببيئة Lua الافتراضية والوصول لمتغيرات النظام دون قيود.',
          exploitMechanism: 'تجاوز حمايات الميتاتيبل (Metatables) والوصول إلى دوال محظورة بالبيئة الآمنة.',
          recommendation: 'قفل مكتبة debug واستخدام المتغيرات المباشرة فقط.'
        });
      }
    });

    return list;
  }, [events]);

  // Set first threat as default selected
  React.useEffect(() => {
    if (threats.length > 0 && !selectedThreat) {
      setSelectedThreat(threats[0]);
    }
  }, [threats, selectedThreat]);

  // Generate sanitized version of snippet
  React.useEffect(() => {
    if (!selectedThreat) {
      setSanitizedCode('');
      return;
    }

    const original = selectedThreat.snippet;
    let sanitized = `-- 🛡️ [تم تحييد الثغرة بواسطة درع الزعابي]:\n-- الكود المعطل المشبوه:\n-- [[ ${original} ]]\n\n`;

    if (selectedThreat.type === 'RCE') {
      sanitized += `-- تم حظر التنفيذ الديناميكي. استخدم الدالة الآمنة التالية بدلاً منه:\nprint("[SECURITY] Blocked dynamic remote execution attempt.")`;
    } else if (selectedThreat.type === 'OS_EXEC') {
      sanitized += `-- تم حظر استدعاء أوامر النظام لحماية الخادم من الاختراق:\nprint("[SECURITY] Blocked dangerous OS execution attempt.")`;
    } else if (selectedThreat.type === 'ADMIN_PRIV') {
      sanitized += `-- تحقق آمن من الصلاحيات باستخدام ACE بدلاً من الهويات الثابتة:\nif IsPlayerAceAllowed(source, "command.admin") then\n    -- كود الأدمن الآمن هنا\nend`;
    } else if (selectedThreat.type === 'NETWORK') {
      sanitized += `-- تحقق من مسار الويب هوك وتأكد من استدعائه في بيئة الخادم فقط مع تشفير البيانات:\nlocal safeWebhook = GetConvar("server_log_webhook", "")\nif safeWebhook ~= "" then\n    -- PerformHttpRequest(safeWebhook, ...)\nend`;
    } else {
      sanitized += `-- تم تأمين السطر وتعطيل الوصول غير الآمن.`;
    }

    setSanitizedCode(sanitized);
  }, [selectedThreat]);

  const filteredThreats = threats.filter(t => {
    const matchesType = filterType === 'all' || t.type === filterType;
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.file.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.snippet.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(sanitizedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5 animate-modal-backdrop"
      onClick={onClose}
    >
      <div 
        onClick={e => e.stopPropagation()}
        className="w-full max-w-5xl bg-surface border border-rose-500/40 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] animate-modal-content"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border bg-bg/90 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.25)]">
              <Crosshair className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white tracking-tight">
                  صائد الأبواب الخلفية والاتصالات المشبوهة (Backdoor & C2 Hunter)
                </h3>
                <span className="text-[10px] font-mono text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                  {threats.length} تهديد مرصود
                </span>
              </div>
              <p className="text-xs text-text-dim mt-0.5">
                كشف الـ RCE، سحب التوكنات، أوامر النظام الخطيرة (os.execute)، واستدعاءات الخوادم الخارجية
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-text-dim hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-3 bg-bg/60 border-b border-border flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: 'all', label: `الكل (${threats.length})` },
              { id: 'RCE', label: 'تنفيذ كود (RCE)' },
              { id: 'OS_EXEC', label: 'أوامر نظام (OS)' },
              { id: 'ADMIN_PRIV', label: 'أدمن مخفي (Backdoor)' },
              { id: 'NETWORK', label: 'شبكة وويب هوك' },
              { id: 'SANDBOX_BYPASS', label: 'تجاوز الحماية' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
                  filterType === f.id 
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' 
                    : 'bg-surface text-text-dim border-white/5 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 text-text-dim absolute right-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="بحث في التهديدات..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-surface border border-border rounded-lg pr-8 pl-3 py-1 text-xs text-white placeholder-text-dim focus:outline-none focus:border-rose-500"
            />
          </div>
        </div>

        {/* Threat List (Left) & Threat Inspector / Sanitizer (Right) */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Threat List */}
          <div className="w-full lg:w-96 border-b lg:border-b-0 lg:border-l border-border bg-bg/40 flex flex-col max-h-64 lg:max-h-none overflow-hidden">
            <div className="p-3 border-b border-border flex items-center justify-between text-xs text-text-dim">
              <span>التهديدات المكتشفة ({filteredThreats.length})</span>
              <span className="text-[10px] text-rose-400 font-mono">انقر للفحص والتحييد</span>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {filteredThreats.length === 0 ? (
                <div className="p-8 text-center text-xs text-text-dim space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto opacity-70" />
                  <p className="font-bold text-white">لم يتم رصد أي أبواب خلفية في الفلتر الحالي</p>
                </div>
              ) : (
                filteredThreats.map(threat => {
                  const isSelected = selectedThreat?.id === threat.id;

                  return (
                    <button
                      key={threat.id}
                      onClick={() => setSelectedThreat(threat)}
                      className={`w-full text-right p-2.5 rounded-xl transition-all border cursor-pointer ${
                        isSelected 
                          ? 'bg-rose-500/15 border-rose-500/40 text-white shadow-sm' 
                          : 'bg-surface/50 border-transparent text-text-dim hover:text-white hover:bg-surface'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-bold text-xs text-white truncate">{threat.name}</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold uppercase shrink-0">
                          {threat.type}
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-text-dim truncate" dir="ltr">
                        {threat.file}:{threat.line}
                      </div>
                      <div className="text-[11px] font-mono text-rose-300/80 truncate bg-black/20 px-1.5 py-0.5 rounded mt-1" dir="ltr">
                        {threat.snippet}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Threat Inspector & Auto-Sanitizer (Right) */}
          <div className="flex-1 flex flex-col overflow-y-auto bg-bg p-4 space-y-4">
            {selectedThreat ? (
              <>
                {/* Threat Details Card */}
                <div className="p-4 rounded-xl bg-surface border border-border space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
                        <Flame className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-white">{selectedThreat.name}</h4>
                        <span className="text-[10px] font-mono text-text-dim" dir="ltr">
                          {selectedThreat.file} (السطر: {selectedThreat.line})
                        </span>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded text-xs font-bold font-mono bg-rose-500/20 text-rose-300 border border-rose-500/40 uppercase">
                      خطورة حرجة ({selectedThreat.severity})
                    </span>
                  </div>

                  <div className="space-y-2 text-xs text-text-dim leading-relaxed">
                    <p><strong className="text-white">طبيعة التهديد:</strong> {selectedThreat.description}</p>
                    <p><strong className="text-rose-400">آلية الاستغلال:</strong> {selectedThreat.exploitMechanism}</p>
                    <p><strong className="text-emerald-400">إجراء المعالجة الموصى به:</strong> {selectedThreat.recommendation}</p>
                  </div>

                  {/* Malicious Code Snippet */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-rose-400 flex items-center gap-1">
                      <AlertOctagon className="w-3.5 h-3.5" />
                      <span>الكود المشبوه المرصود في الملف:</span>
                    </label>
                    <pre className="p-2.5 rounded-lg bg-black/50 border border-rose-500/30 text-rose-300 font-mono text-xs overflow-x-auto" dir="ltr">
                      {selectedThreat.snippet}
                    </pre>
                  </div>
                </div>

                {/* Sanitized Code Generator */}
                <div className="p-4 rounded-xl bg-surface border border-emerald-500/30 space-y-3 flex-1 flex flex-col">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-emerald-400" />
                      <h4 className="font-bold text-xs text-white uppercase tracking-wider">
                        الكود الآمن المعقم (Auto-Sanitized Solution)
                      </h4>
                    </div>

                    <button
                      onClick={handleCopy}
                      className="px-3 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      {copied ? <><Check className="w-3.5 h-3.5" /> تم النسخ</> : <><Copy className="w-3.5 h-3.5" /> نسخ الكود المعقم</>}
                    </button>
                  </div>

                  <p className="text-xs text-text-dim">
                    يمكنك استبدال الكود المصاب بهذا الكود المعقم لتحييد الباك دور مع الحفاظ على استقرار السكريبت:
                  </p>

                  <div className="flex-1 overflow-auto p-3 font-mono text-xs text-emerald-300 bg-black/40 rounded-lg border border-white/5" dir="ltr">
                    <pre className="whitespace-pre">{sanitizedCode}</pre>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-12 text-center text-text-dim text-xs">
                اختر تهديداً من القائمة الجانبية لفحصه ومعالجته.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-border bg-bg/90 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-text-dim text-[11px]">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span>يقوم صائد الباك دور بفحص جميع المسارات الحساسة لمنع الاختراق الصامت للخادم.</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 text-xs font-bold transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
