import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  X, 
  Radio, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Copy, 
  Check, 
  Play, 
  Square, 
  RefreshCw, 
  Bot, 
  Palette, 
  Layers, 
  Flame, 
  FileText, 
  Sparkles,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { EventOccurrence } from '../types';
import { WebhookStatusItem } from './DiscordWebhookTesterModal';

interface DiscordLogForwarderModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialWebhookUrl?: string;
  initialReason?: string;
  availableWebhooks?: WebhookStatusItem[];
  discoveredEvents?: EventOccurrence[];
}

interface TransmissionLog {
  id: string;
  index: number;
  timestamp: string;
  status: 'pending' | 'success' | 'rate_limit' | 'error';
  statusCode?: number;
  latency?: number;
  detail: string;
}

const QUICK_REASONS = [
  { id: 'sec_breach', label: '🚨 تنبيه أمني: رصد اختراق أو تلاعب بالتريقر', icon: '🚨', color: 15158332 },
  { id: 'server_report', label: '📊 تقرير تدقيق السيرفر: ملخص الثغرات المكتشفة', icon: '📊', color: 3447003 },
  { id: 'backdoor_found', label: '🔥 رصد باب خلفي (Backdoor / RCE)', icon: '🔥', color: 15548997 },
  { id: 'conn_stress', label: '⚡ اختبار استجابة وضغط قنوات اللوق', icon: '⚡', color: 15844367 },
  { id: 'admin_broadcast', label: '📢 رسالة إدارية رسمية لسيرفر FiveM', icon: '📢', color: 10181046 },
  { id: 'exploit_kick', label: '🛑 تسجيل طرد/حظر لاعب مشبوه', icon: '🛑', color: 15105570 }
];

export const DiscordLogForwarderModal: React.FC<DiscordLogForwarderModalProps> = ({
  isOpen,
  onClose,
  initialWebhookUrl,
  initialReason,
  availableWebhooks = [],
  discoveredEvents = []
}) => {
  // Target webhook
  const [targetUrl, setTargetUrl] = useState('');
  
  // Message parameters
  const [reason, setReason] = useState('🚨 تنبيه أمني: فحص وتدقيق سكريبتات السيرفر');
  const [content, setContent] = useState('');
  const [useEmbed, setUseEmbed] = useState(true);
  
  // Custom bot details
  const [botName, setBotName] = useState('محرك الزعابي للأمان (Audit Shield)');
  const [avatarUrl, setAvatarUrl] = useState('https://cdn-icons-png.flaticon.com/512/9422/9422896.png');
  const [embedColor, setEmbedColor] = useState<number>(15158332); // Default Red/Crimson
  
  // Multi-send controls
  const [sendCount, setSendCount] = useState<number>(1);
  const [delayMs, setDelayMs] = useState<number>(1000); // 1000ms delay by default
  const [includeScanSummary, setIncludeScanSummary] = useState(true);
  
  // Transmission runtime state
  const [isSending, setIsSending] = useState(false);
  const [progressCount, setProgressCount] = useState(0);
  const [transmissionLogs, setTransmissionLogs] = useState<TransmissionLog[]>([]);
  const abortControllerRef = useRef<boolean>(false);
  const logsEndRef = useRef<HTMLDivElement>(null);
  
  const [copied, setCopied] = useState(false);

  // Initialize values when opened
  useEffect(() => {
    if (isOpen) {
      if (initialWebhookUrl) {
        setTargetUrl(initialWebhookUrl);
      } else if (availableWebhooks.length > 0) {
        // Pick first active or first available webhook
        const activeWh = availableWebhooks.find(w => w.status === 'active') || availableWebhooks[0];
        if (activeWh) setTargetUrl(activeWh.url);
      }

      if (initialReason) {
        setReason(initialReason);
      }

      // Populate default content with discovered events if available
      if (content === '') {
        generateDefaultReportContent();
      }
    }
  }, [isOpen, initialWebhookUrl, initialReason, availableWebhooks]);

  // Auto-scroll transmission logs
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transmissionLogs]);

  // Generate security scan report content
  const generateDefaultReportContent = () => {
    const totalEvents = discoveredEvents.length;
    const criticalEvents = discoveredEvents.filter(e => e.severity === 'CRITICAL').length;
    const highEvents = discoveredEvents.filter(e => e.severity === 'HIGH').length;
    
    let report = `تم إرسال هذا التقرير عبر **محرك الزعابي لفحص وحماية سيرفرات FiveM**.\n\n`;
    report += `**📊 نتائج الفحص الأمني:**\n`;
    report += `• إجمالي التريقرات المرصودة: **${totalEvents}**\n`;
    report += `• التهديدات الحرجة (CRITICAL): **${criticalEvents}**\n`;
    report += `• التهديدات العالية (HIGH): **${highEvents}**\n\n`;
    
    if (discoveredEvents.length > 0) {
      report += `**🔍 عينة من التريقرات المفحوصة:**\n`;
      discoveredEvents.slice(0, 4).forEach((ev, idx) => {
        report += `${idx + 1}. \`${ev.name}\` (${ev.file}:${ev.line})\n`;
      });
    }

    setContent(report);
  };

  if (!isOpen) return null;

  // Multi-message dispatcher engine
  const handleStartSending = async () => {
    const trimmedUrl = targetUrl.trim();
    if (!trimmedUrl) {
      alert('الرجاء إدخال رابط Discord Webhook صالح أولاً');
      return;
    }

    if (!trimmedUrl.includes('discord.com/api/webhooks/')) {
      alert('الرابط المدخل ليس رابط ديسكورد ويب هوك صالح (https://discord.com/api/webhooks/...)');
      return;
    }

    if (!reason.trim()) {
      alert('الرجاء كتابة سبب الإرسال');
      return;
    }

    setIsSending(true);
    setProgressCount(0);
    setTransmissionLogs([]);
    abortControllerRef.current = false;

    const count = Math.max(1, Math.min(sendCount, 100)); // Cap at 100 for safety

    for (let i = 1; i <= count; i++) {
      if (abortControllerRef.current) {
        setTransmissionLogs(prev => [
          ...prev,
          {
            id: `aborted_${Date.now()}`,
            index: i,
            timestamp: new Date().toLocaleTimeString('ar-SA'),
            status: 'error',
            detail: 'تم إيقاف عملية الإرسال يدوياً بواسطة المستخدم ⏹️'
          }
        ]);
        break;
      }

      const logId = `send_${i}_${Date.now()}`;
      const startTime = performance.now();

      // Build payload
      const timestampIso = new Date().toISOString();
      const sendTimeStr = new Date().toLocaleTimeString('ar-SA');

      const payload: any = {
        username: botName.trim() || 'محرك الزعابي للأمان',
        avatar_url: avatarUrl.trim() || undefined
      };

      if (useEmbed) {
        const fields = [
          {
            name: "📌 سبب الإرسال",
            value: `**${reason}**`,
            inline: false
          },
          {
            name: "🔢 رقم الإرسالية",
            value: `\`#${i} من أصل ${count}\``,
            inline: true
          },
          {
            name: "⏱️ توقيت الإرسال",
            value: `\`${sendTimeStr}\``,
            inline: true
          }
        ];

        if (includeScanSummary && discoveredEvents.length > 0) {
          const critCount = discoveredEvents.filter(e => e.severity === 'CRITICAL').length;
          fields.push({
            name: "🛡️ ملخص الأمان",
            value: `رصد **${discoveredEvents.length}** تريقر (${critCount} حرج)`,
            inline: true
          });
        }

        payload.embeds = [
          {
            title: `${reason.slice(0, 100)}`,
            description: content.trim() || 'لا توجد تفاصيل إضافية للوق.',
            color: embedColor,
            fields,
            footer: {
              text: `Alzaabi Security Engine • Transmission #${i}/${count}`
            },
            timestamp: timestampIso
          }
        ];
      } else {
        // Plain text message
        payload.content = `**[${reason}]**\n${content}\n\n*(إرسالية #${i} من أصل ${count} • ${sendTimeStr})*`;
      }

      try {
        const response = await fetch(trimmedUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const latency = Math.round(performance.now() - startTime);

        if (response.ok || response.status === 204 || response.status === 200) {
          setTransmissionLogs(prev => [
            ...prev,
            {
              id: logId,
              index: i,
              timestamp: sendTimeStr,
              status: 'success',
              statusCode: response.status,
              latency,
              detail: `تم الإرسال بنجاح إلى ديسكورد (Response: ${response.status} No Content - ${latency}ms)`
            }
          ]);
          setProgressCount(i);
        } else if (response.status === 429) {
          // Rate limited!
          let retryAfter = 1500;
          try {
            const errData = await response.json();
            if (errData.retry_after) {
              retryAfter = Math.ceil(errData.retry_after * 1000);
            }
          } catch (e) {}

          setTransmissionLogs(prev => [
            ...prev,
            {
              id: logId,
              index: i,
              timestamp: sendTimeStr,
              status: 'rate_limit',
              statusCode: 429,
              latency,
              detail: `⚠️ ديسكورد يطلب الانتظار ${Math.round(retryAfter / 1000)} ثانية (Rate Limit 429) - جاري التهدئة...`
            }
          ]);

          // Wait rate limit before next try
          await new Promise(r => setTimeout(r, retryAfter));
        } else {
          setTransmissionLogs(prev => [
            ...prev,
            {
              id: logId,
              index: i,
              timestamp: sendTimeStr,
              status: 'error',
              statusCode: response.status,
              latency,
              detail: `فشل الإرسال: رمز الاستجابة ${response.status} (${response.statusText || 'Error'})`
            }
          ]);
        }
      } catch (err: any) {
        const latency = Math.round(performance.now() - startTime);
        setTransmissionLogs(prev => [
          ...prev,
          {
            id: logId,
            index: i,
            timestamp: sendTimeStr,
            status: 'error',
            latency,
            detail: `خطأ بالاتصال: ${err?.message || 'تعذر الوصول إلى خوادم ديسكورد'}`
          }
        ]);
      }

      // Delay between sequential messages if not the last one
      if (i < count && !abortControllerRef.current) {
        await new Promise(r => setTimeout(r, delayMs));
      }
    }

    setIsSending(false);
  };

  const handleStopSending = () => {
    abortControllerRef.current = true;
    setIsSending(false);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5 animate-modal-backdrop"
      onClick={onClose}
    >
      <div 
        onClick={e => e.stopPropagation()}
        className="w-full max-w-4xl bg-surface border border-indigo-500/40 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] animate-modal-content"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border bg-bg/95 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.3)]">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white tracking-tight">
                  محول ومرسل رسائل اللوق (Discord Log Forwarder)
                </h3>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Custom Dispatcher
                </span>
              </div>
              <p className="text-xs text-text-dim mt-0.5">
                إرسال وتحويل رسائل اللوق إلى الـ Webhook مع تحديد سبب الإرسال وتكرار العدد والتحكم بالسرعة
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

        {/* Body Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          {/* Section 1: Target Webhook Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-indigo-400" />
                <span>رابط الويب هوك المستهدف (Target Webhook URL):</span>
              </label>

              {availableWebhooks.length > 0 && (
                <span className="text-[11px] text-text-dim">
                  مكتشف في السكربتات: <strong className="text-indigo-400 font-mono">{availableWebhooks.length}</strong> روابط
                </span>
              )}
            </div>

            {/* Quick dropdown if webhooks are available */}
            {availableWebhooks.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {availableWebhooks.map(wh => {
                  const isSelected = targetUrl === wh.url;
                  return (
                    <button
                      key={wh.id}
                      type="button"
                      onClick={() => setTargetUrl(wh.url)}
                      className={`text-right p-2 rounded-lg border text-xs transition-all flex items-center justify-between gap-2 cursor-pointer ${
                        isSelected 
                          ? 'bg-indigo-500/15 border-indigo-500/50 text-white shadow-sm' 
                          : 'bg-black/20 border-white/5 text-text-dim hover:border-white/15 hover:text-white'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${
                            wh.status === 'active' ? 'bg-emerald-400 animate-pulse' : 
                            wh.status === 'dead' ? 'bg-rose-400' : 'bg-amber-400'
                          }`} />
                          <span className="font-medium text-white truncate text-[11px]">
                            {wh.webhookName || wh.file || 'Discord Webhook'}
                          </span>
                        </div>
                        <p className="font-mono text-[10px] text-text-dim truncate mt-0.5">
                          {wh.url.slice(0, 45)}...
                        </p>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Direct Input Field */}
            <input
              type="url"
              value={targetUrl}
              onChange={e => setTargetUrl(e.target.value)}
              placeholder="https://discord.com/api/webhooks/1234567890/token..."
              className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 focus:border-indigo-500 focus:outline-none text-xs text-white font-mono placeholder:text-text-dim/50"
              dir="ltr"
            />
          </div>

          {/* Section 2: Reason for Sending (سبب الإرسال) */}
          <div className="space-y-2 p-3.5 rounded-xl bg-black/20 border border-white/5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                <span>سبب الإرسال (Reason for Sending):</span>
                <span className="text-rose-400 font-bold">*</span>
              </label>
              <span className="text-[10px] text-text-dim">سيظهر كعنوان وتصنيف رسمي داخل اللوق</span>
            </div>

            {/* Input field */}
            <input
              type="text"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="اكتب سبب الإرسال هنا (مثال: رصد تلاعب بالتريقرات / تنبيه أمني عاجل)..."
              className="w-full px-3 py-2 rounded-lg bg-surface/90 border border-rose-500/30 focus:border-rose-500 focus:outline-none text-xs text-white font-medium"
            />

            {/* Quick Reason Presets */}
            <div className="pt-1">
              <div className="text-[11px] text-text-dim mb-1.5 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>أسباب شائعة جاهزة للاختيار السريع:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_REASONS.map(qr => (
                  <button
                    key={qr.id}
                    type="button"
                    onClick={() => {
                      setReason(qr.label);
                      setEmbedColor(qr.color);
                    }}
                    className={`text-[11px] px-2.5 py-1 rounded-md border transition-all cursor-pointer ${
                      reason === qr.label
                        ? 'bg-rose-500/20 border-rose-500/50 text-white font-bold'
                        : 'bg-white/5 border-white/10 text-text-dim hover:text-white hover:border-white/20'
                    }`}
                  >
                    {qr.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: Send Count & Speed (عدد الإرسال والفاصل الزمني) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-black/20 border border-white/5">
            {/* Send Count */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  <span>عدد مرات الإرسال (Send Count):</span>
                </label>
                <span className="text-xs font-mono font-bold text-indigo-400">
                  {sendCount} {sendCount === 1 ? 'رسالة' : 'رسائل'}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {[1, 3, 5, 10, 20].map(cnt => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setSendCount(cnt)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer ${
                      sendCount === cnt
                        ? 'bg-indigo-500 text-white border-indigo-400 shadow-sm'
                        : 'bg-white/5 border-white/10 text-text-dim hover:text-white hover:border-white/20'
                    }`}
                  >
                    {cnt}
                  </button>
                ))}
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={sendCount}
                  onChange={e => setSendCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                  className="w-16 px-2 py-1.5 rounded-lg bg-surface border border-white/10 text-center font-mono text-xs text-white focus:outline-none focus:border-indigo-500"
                  title="أو أدخل رقماً مخصصاً (الحد الأقصى 100)"
                />
              </div>

              {sendCount > 5 && (
                <p className="text-[10px] text-amber-400 flex items-center gap-1 pt-0.5">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  <span>تنبيه: الإرسال المتكرر السريع قد يؤدي للحد الزمني (Rate Limit) في ديسكورد.</span>
                </p>
              )}
            </div>

            {/* Delay Interval */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>الفاصل الزمني بين الرسائل (Delay):</span>
                </label>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {delayMs} ms ({delayMs / 1000} ثانية)
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { label: 'سريع (500ms)', ms: 500 },
                  { label: 'متوازن (1s)', ms: 1000 },
                  { label: 'آمن (2s)', ms: 2000 }
                ].map(opt => (
                  <button
                    key={opt.ms}
                    type="button"
                    onClick={() => setDelayMs(opt.ms)}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-medium border transition-all cursor-pointer text-center ${
                      delayMs === opt.ms
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-bold'
                        : 'bg-white/5 border-white/10 text-text-dim hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-text-dim pt-0.5">
                الفاصل الزمني 1000ms موصى به لتجنب كود الخطأ 429 من خوادم ديسكورد.
              </p>
            </div>
          </div>

          {/* Section 4: Log Details / Message Content */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                <span>محتوى ونص رسالة اللوق (Log Details):</span>
              </label>

              <button
                type="button"
                onClick={generateDefaultReportContent}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer transition-colors bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20"
              >
                <RefreshCw className="w-3 h-3" />
                <span>تضمين تقرير الفحص الحالي تلقائياً</span>
              </button>
            </div>

            <textarea
              rows={4}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="اكتب تفاصيل اللوق أو التقرير هنا..."
              className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 focus:border-indigo-500 focus:outline-none text-xs text-white placeholder:text-text-dim/50 font-mono leading-relaxed"
            />
          </div>

          {/* Section 5: Custom Bot & Appearance (Optional details) */}
          <div className="p-3 rounded-xl bg-black/20 border border-white/5 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-white">
              <span className="flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5 text-purple-400" />
                <span>هوية البوت ومظهر الـ Embed في ديسكورد:</span>
              </span>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-[11px] text-text-dim cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useEmbed}
                    onChange={e => setUseEmbed(e.target.checked)}
                    className="accent-indigo-500 rounded"
                  />
                  <span>إرسال كـ Rich Embed منسق</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="text-[11px] text-text-dim block mb-1">اسم البوت (Username):</label>
                <input
                  type="text"
                  value={botName}
                  onChange={e => setBotName(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-surface border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-text-dim block mb-1">لون الشريط الجانبي (Color):</label>
                <div className="flex items-center gap-1.5">
                  {[
                    { label: 'أحمر', val: 15158332, bg: 'bg-rose-500' },
                    { label: 'أخضر', val: 3066993, bg: 'bg-emerald-500' },
                    { label: 'أصفر', val: 15844367, bg: 'bg-amber-500' },
                    { label: 'أزرق', val: 3447003, bg: 'bg-blue-500' },
                    { label: 'ديسكورد', val: 5793266, bg: 'bg-indigo-500' }
                  ].map(c => (
                    <button
                      key={c.val}
                      type="button"
                      onClick={() => setEmbedColor(c.val)}
                      className={`w-7 h-7 rounded-lg ${c.bg} flex items-center justify-center transition-all cursor-pointer ${
                        embedColor === c.val ? 'ring-2 ring-white scale-105' : 'opacity-70 hover:opacity-100'
                      }`}
                      title={c.label}
                    >
                      {embedColor === c.val && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] text-text-dim block mb-1">صورة البوت (Avatar URL):</label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={e => setAvatarUrl(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-surface border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          {/* Section 6: Live Transmission Monitor & Logs (if active or has sent) */}
          {(isSending || transmissionLogs.length > 0) && (
            <div className="space-y-2 p-3.5 rounded-xl bg-black/40 border border-indigo-500/30">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${isSending ? 'bg-indigo-400 animate-ping' : 'bg-emerald-400'}`} />
                  <span className="font-bold text-white">
                    حالة الإرسال المباشر: {progressCount} من أصل {sendCount}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-text-dim font-mono text-[11px]">
                    ({Math.round((progressCount / sendCount) * 100)}%)
                  </span>
                  {isSending && (
                    <button
                      type="button"
                      onClick={handleStopSending}
                      className="px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Square className="w-3 h-3 fill-current" />
                      <span>إيقاف فوري</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-300"
                  style={{ width: `${(progressCount / sendCount) * 100}%` }}
                />
              </div>

              {/* Transmission console logs */}
              <div className="max-h-36 overflow-y-auto space-y-1 pt-1 font-mono text-[11px]">
                {transmissionLogs.map(log => (
                  <div 
                    key={log.id} 
                    className={`px-2 py-1 rounded flex items-center justify-between border ${
                      log.status === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' :
                      log.status === 'rate_limit' ? 'bg-amber-500/10 border-amber-500/20 text-amber-300' :
                      'bg-rose-500/10 border-rose-500/20 text-rose-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="opacity-60 text-[10px]">{log.timestamp}</span>
                      <span className="font-bold">#{log.index}</span>
                      <span>{log.detail}</span>
                    </div>
                    {log.latency && (
                      <span className="opacity-75 text-[10px]">{log.latency}ms</span>
                    )}
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border bg-bg/95 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-text-dim flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              سيتم إرسال اللوق بعدد <strong className="text-white font-mono">{sendCount}</strong> مع تسجيل سبب الإرسال الرسمي.
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-text-dim hover:text-white transition-colors cursor-pointer"
            >
              إلغاء
            </button>

            {isSending ? (
              <button
                type="button"
                onClick={handleStopSending}
                className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-rose-500/20"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>إيقاف الإرسال</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStartSending}
                disabled={!targetUrl.trim() || !reason.trim()}
                className="flex-1 sm:flex-none px-6 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-xs font-bold text-white transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-3.5 h-3.5" />
                <span>بدء إرسال اللوق الآن ({sendCount})</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
