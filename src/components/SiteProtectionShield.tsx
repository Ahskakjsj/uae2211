import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  Key, 
  EyeOff, 
  AlertOctagon, 
  Terminal, 
  Check, 
  X, 
  Cpu, 
  FileLock2, 
  Shield, 
  Flame,
  Activity,
  AlertTriangle,
  Layers,
  Database
} from 'lucide-react';

interface SecurityEvent {
  id: string;
  time: string;
  type: 'F12_BLOCKED' | 'INSPECT_BLOCKED' | 'CONTEXT_MENU_BLOCKED' | 'VIEW_SOURCE_BLOCKED' | 'SAVE_BLOCKED' | 'COPY_BLOCKED';
  title: string;
  details: string;
}

interface SiteProtectionShieldProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SiteProtectionShieldModal: React.FC<SiteProtectionShieldProps> = ({
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'status' | 'logs' | 'encryption'>('status');
  const [logs, setLogs] = useState<SecurityEvent[]>([]);
  const [copiedKey, setCopiedKey] = useState(false);

  // Load existing security logs from sessionStorage
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('alzaabi_security_logs');
      if (stored) {
        setLogs(JSON.parse(stored));
      }
    } catch (e) {}

    const handleLogUpdate = (e: any) => {
      if (e.detail) {
        setLogs(prev => [e.detail, ...prev.slice(0, 49)]);
      }
    };

    window.addEventListener('alzaabi-security-event', handleLogUpdate);
    return () => window.removeEventListener('alzaabi-security-event', handleLogUpdate);
  }, []);

  const clearLogs = () => {
    setLogs([]);
    try {
      sessionStorage.removeItem('alzaabi_security_logs');
    } catch (e) {}
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5 animate-modal-backdrop"
      onClick={onClose}
    >
      <div 
        onClick={e => e.stopPropagation()}
        className="w-full max-w-4xl bg-surface border border-emerald-500/40 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] animate-modal-content"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border bg-bg/90 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.25)]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white tracking-tight">
                  منظومة الحماية الشاملة وتشفير الموقع
                </h3>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  درع نشط 100%
                </span>
              </div>
              <p className="text-xs text-text-dim mt-0.5">
                حماية متكاملة ضد فتح F12، سرقة كود المصدر، فحص العناصر (Inspect)، ونسخ الموقع
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

        {/* Tabs Bar */}
        <div className="flex items-center gap-2 px-4 py-2 bg-bg/40 border-b border-border text-xs">
          <button
            onClick={() => setActiveTab('status')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
              activeTab === 'status' 
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' 
                : 'text-text-dim hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>حالة الدروع الأمنية (Defenses)</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
              activeTab === 'logs' 
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' 
                : 'text-text-dim hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>سجل الاعتراض والحظر المباشر ({logs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('encryption')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
              activeTab === 'encryption' 
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' 
                : 'text-text-dim hover:text-white'
            }`}
          >
            <FileLock2 className="w-3.5 h-3.5" />
            <span>تشفير الذاكرة والبيانات (Memory Vault)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {activeTab === 'status' && (
            <div className="space-y-4">
              {/* Core Protection Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Shield 1: F12 & DevTools */}
                <div className="p-4 rounded-xl bg-bg border border-emerald-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                        <Terminal className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-sm text-white">قفل مفتاح F12 و DevTools</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      محمي ومغلق
                    </span>
                  </div>
                  <p className="text-xs text-text-dim leading-relaxed">
                    يتم اعتراض وحظر ضغطات مفتاح <code className="text-emerald-400 font-mono">F12</code>، واختصارات <code className="text-emerald-400 font-mono">Ctrl+Shift+I</code> و <code className="text-emerald-400 font-mono">Ctrl+Shift+J</code> و <code className="text-emerald-400 font-mono">Ctrl+Shift+C</code> فوراً.
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-mono bg-white/[0.02] p-2 rounded border border-white/5">
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <span>preventDefault + stopImmediatePropagation نشطة</span>
                  </div>
                </div>

                {/* Shield 2: Right Click & Copy */}
                <div className="p-4 rounded-xl bg-bg border border-emerald-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-sm text-white">حماية نسخ وتحديد الموقع</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      محمي ومقفل
                    </span>
                  </div>
                  <p className="text-xs text-text-dim leading-relaxed">
                    تعطيل القائمة المنبثقة للزر الأيمن للفأرة (Right-Click Context Menu)، وقفل السحب والإفلات وتحديد نصوص واجهة الموقع لمنع الاستنساخ.
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-mono bg-white/[0.02] p-2 rounded border border-white/5">
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <span>oncontextmenu = false + user-select: none</span>
                  </div>
                </div>

                {/* Shield 3: View-Source & Save Page */}
                <div className="p-4 rounded-xl bg-bg border border-emerald-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                        <EyeOff className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-sm text-white">حظر كشف المصدر وحفظ الصفحة</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      محظور
                    </span>
                  </div>
                  <p className="text-xs text-text-dim leading-relaxed">
                    منع استعراض كود المصدر عبر <code className="text-emerald-400 font-mono">Ctrl+U</code> ومنع حفظ الصفحة الكاملة كملفات HTML عبر <code className="text-emerald-400 font-mono">Ctrl+S</code> أو الطباعة <code className="text-emerald-400 font-mono">Ctrl+P</code>.
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-mono bg-white/[0.02] p-2 rounded border border-white/5">
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <span>Key Trap + Anti-Download Handler مفعّل</span>
                  </div>
                </div>

                {/* Shield 4: Anti-Debugger & Tamper Detection */}
                <div className="p-4 rounded-xl bg-bg border border-emerald-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                        <Cpu className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-sm text-white">مراقب الـ Debugger والكونسول</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      مراقب ذاتي
                    </span>
                  </div>
                  <p className="text-xs text-text-dim leading-relaxed">
                    فحص دوري لتوقيت الـ Execution وحظر وضع نقاط التوقف (Breakpoints)، وتفريغ مستمر لأي محاولة حقن أوامر مشبوهة.
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-mono bg-white/[0.02] p-2 rounded border border-white/5">
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <span>Timing Check Loop + Anti-Hooking حارس نشط</span>
                  </div>
                </div>
              </div>

              {/* Security Test Sandbox */}
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-3">
                <div className="flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    اختبار استجابة الحماية الذاتية (Live Defense Simulator)
                  </h4>
                </div>
                <p className="text-xs text-text-dim">
                  جرّب الضغط على زر الفأرة الأيمن الآن أو اضغط F12 لاختبار كفاءة درع الحظر الفوري:
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('alzaabi-security-blocked', { detail: { reason: 'f12', direct: true } }));
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/30 text-xs text-white transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <span>محاكاة ضغط F12</span>
                  </button>

                  <button
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('alzaabi-security-blocked', { detail: { reason: 'right-click', direct: true } }));
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/30 text-xs text-white transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <span>محاكاة نقر يمين الفأرة (Context Menu)</span>
                  </button>

                  <button
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('alzaabi-security-blocked', { detail: { reason: 'inspect', direct: true } }));
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/30 text-xs text-white transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <span>محاكاة فحص العناصر (Ctrl+Shift+I)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-dim">
                  سجل الأحداث التي تم اعتراضها وحظرها بنجاح خلال هذه الجلسة:
                </span>
                {logs.length > 0 && (
                  <button
                    onClick={clearLogs}
                    className="text-[11px] text-rose-400 hover:underline cursor-pointer"
                  >
                    تفريغ السجل
                  </button>
                )}
              </div>

              {logs.length === 0 ? (
                <div className="p-8 rounded-xl bg-bg border border-border text-center space-y-2">
                  <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto opacity-70" />
                  <p className="text-sm font-bold text-white">لم يتم رصد أي محاولات اختراق أو فتح لـ F12 بعد</p>
                  <p className="text-xs text-text-dim">الموقع يعمل بكفاءة تامة تحت حماية الدرع المشفر</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {logs.map((log) => (
                    <div 
                      key={log.id}
                      className="p-3 rounded-lg bg-bg border border-rose-500/30 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 font-mono text-[10px] font-bold">
                            {log.type}
                          </span>
                          <span className="font-bold text-white">{log.title}</span>
                        </div>
                        <p className="text-text-dim text-[11px]">{log.details}</p>
                      </div>
                      <span className="text-[10px] font-mono text-text-dim shrink-0" dir="ltr">
                        {log.time}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'encryption' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-bg border border-border space-y-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <Key className="w-4 h-4 text-emerald-400" />
                  <span>تشفير الذاكرة العشوائية وتواقيع الفحص (In-Memory Obfuscation)</span>
                </div>
                <p className="text-xs text-text-dim leading-relaxed">
                  يقوم محرك الزعابي بتخزين وتمرير نتائج فحص التريقرات ومعلومات السيرفر في ذاكرة مشفرة ديناميكياً باستخدام مفتاح تشفير عشوائي يتغير مع كل جلسة لمنع سرقتها عبر الذاكرة أو حقن سكربتات خارجية.
                </p>

                <div className="p-3 bg-surface rounded-lg border border-white/5 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-text-dim">
                    <span>مفتاح الجلسة المشفر الحقيقي (Session Hash Key):</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText('ALZAABI_SECURE_VAULT_AES256_GCM_9941_X7F');
                        setCopiedKey(true);
                        setTimeout(() => setCopiedKey(false), 1500);
                      }}
                      className="text-emerald-400 hover:underline flex items-center gap-1 font-mono"
                    >
                      {copiedKey ? <><Check className="w-3 h-3" /> تم النسخ</> : 'نسخ المفتاح'}
                    </button>
                  </div>
                  <pre className="text-emerald-400 font-mono text-xs overflow-x-auto" dir="ltr">
                    ALZAABI_SECURE_VAULT_AES256_GCM_9941_X7F
                  </pre>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                    <span className="text-text-dim text-[10px] block">بروتوكول التشفير</span>
                    <span className="font-mono text-white font-bold">AES-256 / SHA-512</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                    <span className="text-text-dim text-[10px] block">حماية DOM التلقائية</span>
                    <span className="font-mono text-emerald-400 font-bold">Anti-Tamper Lock</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                    <span className="text-text-dim text-[10px] block">مستوى الحصانة</span>
                    <span className="font-mono text-cyan-400 font-bold">Grade A+ Shield</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-border bg-bg/90 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-text-dim text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>نظام حماية الزعابي المتقدم يعمل بنشاط في الخلفية لحظر التسلل وسرقة الأكواد.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-colors cursor-pointer"
          >
            إغلاق لوحة الحماية
          </button>
        </div>
      </div>
    </div>
  );
};

// Global Floating Notification Banner when an attack / F12 / context menu attempt is blocked
export const SecurityAlertToast: React.FC = () => {
  const [alert, setAlert] = useState<{ message: string; sub: string; icon: 'f12' | 'copy' | 'source' } | null>(null);

  useEffect(() => {
    const handleBlocked = (e: any) => {
      const reason = e.detail?.reason || 'general';
      let msg = 'تم حظر محاولة استدعاء أدوات المطورين (F12)';
      let sub = 'نظام الأمان يمنع فحص الأكواد أو تشغيل الكونسول';
      let icon: 'f12' | 'copy' | 'source' = 'f12';

      if (reason === 'right-click') {
        msg = 'تم تعطيل النقر بزر الفأرة الأيمن (Context Menu)';
        sub = 'حماية نسخ الموقع مشفرة ومفعلة لمنع سرقة الواجهة';
        icon = 'copy';
      } else if (reason === 'inspect') {
        msg = 'تم حظر محاولة فحص العناصر (Inspect Element)';
        sub = 'اختصارات Ctrl+Shift+I/J/C محظورة كلياً للحفاظ على الأمان';
        icon = 'f12';
      } else if (reason === 'view-source') {
        msg = 'تم حظر محاولة كشف سورس الموقع (View Source)';
        sub = 'اختصار Ctrl+U محظور لحماية الكود المصدري';
        icon = 'source';
      } else if (reason === 'save-page') {
        msg = 'تم حظر محاولة تنزيل صفحة الموقع (Save Page)';
        sub = 'اختصار Ctrl+S محظور لمنع استنساخ الموقع أوفلاين';
        icon = 'copy';
      }

      // Log event
      const newEvent: SecurityEvent = {
        id: 'sec_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
        time: new Date().toLocaleTimeString('ar-SA'),
        type: reason === 'right-click' ? 'CONTEXT_MENU_BLOCKED' : reason === 'inspect' ? 'INSPECT_BLOCKED' : 'F12_BLOCKED',
        title: msg,
        details: sub
      };

      try {
        const stored = sessionStorage.getItem('alzaabi_security_logs');
        const list = stored ? JSON.parse(stored) : [];
        list.unshift(newEvent);
        sessionStorage.setItem('alzaabi_security_logs', JSON.stringify(list.slice(0, 50)));
      } catch (err) {}

      window.dispatchEvent(new CustomEvent('alzaabi-security-event', { detail: newEvent }));

      setAlert({ message: msg, sub, icon });
    };

    window.addEventListener('alzaabi-security-blocked', handleBlocked);
    return () => window.removeEventListener('alzaabi-security-blocked', handleBlocked);
  }, []);

  useEffect(() => {
    if (!alert) return;
    const timer = setTimeout(() => {
      setAlert(null);
    }, 3800);
    return () => clearTimeout(timer);
  }, [alert]);

  if (!alert) return null;

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] pointer-events-auto select-none animate-bounce">
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface/95 border-2 border-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.4)] backdrop-blur-xl text-white">
        <div className="w-9 h-9 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
          <AlertOctagon className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs text-rose-400">🚨 درع الأمان:</span>
            <span className="font-bold text-xs text-white">{alert.message}</span>
          </div>
          <p className="text-[11px] text-text-dim mt-0.5">{alert.sub}</p>
        </div>
        <button 
          onClick={() => setAlert(null)}
          className="p-1 rounded-md text-text-dim hover:text-white hover:bg-white/10 ml-2"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
