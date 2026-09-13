import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  ExternalLink, 
  Copy, 
  Check, 
  Send, 
  RotateCw, 
  Search, 
  ShieldCheck, 
  X, 
  Hash, 
  Server, 
  MessageSquare,
  Plus,
  Trash2,
  Activity,
  AlertCircle,
  Share2
} from 'lucide-react';
import { EventOccurrence } from '../types';
import { DiscordLogForwarderModal } from './DiscordLogForwarderModal';

export interface WebhookStatusItem {
  id: string;
  url: string;
  file?: string;
  line?: number;
  status: 'idle' | 'testing' | 'active' | 'dead' | 'error' | 'rate_limited';
  statusCode?: number;
  latency?: number;
  webhookName?: string;
  guildId?: string;
  channelId?: string;
  avatar?: string;
  errorMessage?: string;
  lastTested?: string;
  messageSent?: boolean;
}

interface DiscordWebhookTesterModalProps {
  isOpen: boolean;
  onClose: () => void;
  discoveredEvents: EventOccurrence[];
}

export const DiscordWebhookTesterModal: React.FC<DiscordWebhookTesterModalProps> = ({
  isOpen,
  onClose,
  discoveredEvents
}) => {
  const [webhooks, setWebhooks] = useState<WebhookStatusItem[]>([]);
  const [manualUrl, setManualUrl] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'dead' | 'pending'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sendingMsgId, setSendingMsgId] = useState<string | null>(null);
  const [isBatchTesting, setIsBatchTesting] = useState(false);
  
  // Forwarder modal state
  const [isForwarderOpen, setIsForwarderOpen] = useState(false);
  const [forwarderTargetUrl, setForwarderTargetUrl] = useState<string>('');
  const [forwarderReason, setForwarderReason] = useState<string>('');

  const openLogForwarder = (url?: string, customReason?: string) => {
    if (url) {
      setForwarderTargetUrl(url);
    } else if (webhooks.length > 0) {
      setForwarderTargetUrl(webhooks[0].url);
    }
    if (customReason) {
      setForwarderReason(customReason);
    }
    setIsForwarderOpen(true);
  };

  // Extract all unique webhooks from discovered occurrences
  useEffect(() => {
    const extracted: WebhookStatusItem[] = [];
    const seenUrls = new Set<string>();

    discoveredEvents.forEach((ev) => {
      // Find discord webhook URLs in name or context
      const textToSearch = `${ev.name} ${ev.context}`;
      const matches = textToSearch.match(/https:\/\/(?:ptb\.|canary\.)?discord\.com\/api\/webhooks\/[0-9]+\/[a-zA-Z0-9_\-]+/gi);
      
      if (matches) {
        matches.forEach((url) => {
          if (!seenUrls.has(url)) {
            seenUrls.add(url);
            extracted.push({
              id: `wh_${extracted.length + 1}_${Date.now()}`,
              url,
              file: ev.file,
              line: ev.line,
              status: 'idle'
            });
          }
        });
      } else if (ev.type === 'webhook' && ev.name.includes('discord.com')) {
        if (!seenUrls.has(ev.name)) {
          seenUrls.add(ev.name);
          extracted.push({
            id: `wh_${extracted.length + 1}_${Date.now()}`,
            url: ev.name,
            file: ev.file,
            line: ev.line,
            status: 'idle'
          });
        }
      }
    });

    setWebhooks(prev => {
      // Preserve status of already tested webhooks if URL matches
      const prevMap = new Map(prev.map(item => [item.url, item]));
      return extracted.map(item => prevMap.get(item.url) || item);
    });
  }, [discoveredEvents]);

  // Test a single webhook connection
  const testWebhook = async (id: string, url: string) => {
    setWebhooks(prev => prev.map(item => 
      item.id === id ? { ...item, status: 'testing', errorMessage: undefined } : item
    ));

    const startTime = performance.now();

    try {
      // Direct GET request to Discord Webhook API to inspect validity
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      const latency = Math.round(performance.now() - startTime);

      if (response.status === 200) {
        let json: any = {};
        try {
          json = await response.json();
        } catch (e) {}

        setWebhooks(prev => prev.map(item => 
          item.id === id ? {
            ...item,
            status: 'active',
            statusCode: 200,
            latency,
            webhookName: json.name || 'Discord Webhook',
            guildId: json.guild_id,
            channelId: json.channel_id,
            avatar: json.avatar,
            lastTested: new Date().toLocaleTimeString('ar-SA')
          } : item
        ));
      } else if (response.status === 404) {
        setWebhooks(prev => prev.map(item => 
          item.id === id ? {
            ...item,
            status: 'dead',
            statusCode: 404,
            latency,
            errorMessage: 'الويب هوك محذوف أو غير موجود (Unknown Webhook / 404)',
            lastTested: new Date().toLocaleTimeString('ar-SA')
          } : item
        ));
      } else if (response.status === 401) {
        setWebhooks(prev => prev.map(item => 
          item.id === id ? {
            ...item,
            status: 'dead',
            statusCode: 401,
            latency,
            errorMessage: 'رمز التوكن غير صالح (Invalid Webhook Token / 401)',
            lastTested: new Date().toLocaleTimeString('ar-SA')
          } : item
        ));
      } else if (response.status === 429) {
        setWebhooks(prev => prev.map(item => 
          item.id === id ? {
            ...item,
            status: 'rate_limited',
            statusCode: 429,
            latency,
            errorMessage: 'تجاوز معدل الطلبات (Rate Limited / 429)',
            lastTested: new Date().toLocaleTimeString('ar-SA')
          } : item
        ));
      } else {
        setWebhooks(prev => prev.map(item => 
          item.id === id ? {
            ...item,
            status: 'error',
            statusCode: response.status,
            latency,
            errorMessage: `استجابة غير متوقعة من خادم ديسكورد (${response.status})`,
            lastTested: new Date().toLocaleTimeString('ar-SA')
          } : item
        ));
      }
    } catch (err: any) {
      const latency = Math.round(performance.now() - startTime);
      setWebhooks(prev => prev.map(item => 
        item.id === id ? {
          ...item,
          status: 'error',
          latency,
          errorMessage: 'تعذر الاتصال بخوادم ديسكورد (خطأ شبكة أو جدار حماية)',
          lastTested: new Date().toLocaleTimeString('ar-SA')
        } : item
      ));
    }
  };

  // Test all webhooks sequentially or in batches
  const testAllWebhooks = async () => {
    if (webhooks.length === 0 || isBatchTesting) return;
    setIsBatchTesting(true);

    for (let i = 0; i < webhooks.length; i++) {
      const item = webhooks[i];
      await testWebhook(item.id, item.url);
      // Small pause to avoid hitting aggressive client-side rate limits
      await new Promise(r => setTimeout(r, 150));
    }

    setIsBatchTesting(false);
  };

  // Send a custom test ping message to the active webhook
  const sendTestMessage = async (item: WebhookStatusItem) => {
    setSendingMsgId(item.id);
    try {
      const payload = {
        username: "محرك الزعابي للأمان (Audit Shield)",
        avatar_url: "https://cdn-icons-png.flaticon.com/512/9422/9422896.png",
        embeds: [
          {
            title: "🛡️ اختبار اتصال Webhook ناجح",
            description: `تم فحص وتأكيد نشاط هذا الـ Webhook بنجاح عبر منصة **محرك الزعابي لفحص وحماية السيرفرات**.\n\n**الملف المصدر:** \`${item.file || 'إدخال يدوي'}\`\n**السطر:** \`${item.line || 1}\``,
            color: 3066993, // Emerald green
            footer: {
              text: "Alzaabi Security Engine • FiveM Threat Auditor"
            },
            timestamp: new Date().toISOString()
          }
        ]
      };

      const response = await fetch(item.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok || response.status === 204 || response.status === 200) {
        setWebhooks(prev => prev.map(w => w.id === item.id ? { ...w, messageSent: true } : w));
        setTimeout(() => {
          setWebhooks(prev => prev.map(w => w.id === item.id ? { ...w, messageSent: false } : w));
        }, 3000);
      } else {
        alert(`فشل إرسال الرسالة إلى ديسكورد: رمز الاستجابة ${response.status}`);
      }
    } catch (err: any) {
      alert(`خطأ أثناء إرسال رسالة الاختبار: ${err?.message || 'تعذر الاتصال'}`);
    } finally {
      setSendingMsgId(null);
    }
  };

  // Add manual webhook URL
  const handleAddManual = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = manualUrl.trim();
    if (!trimmed) return;

    if (!trimmed.includes('discord.com/api/webhooks/')) {
      alert('الرجاء إدخال رابط Discord Webhook صالح يحتوي على https://discord.com/api/webhooks/...');
      return;
    }

    const newId = `wh_manual_${Date.now()}`;
    const newItem: WebhookStatusItem = {
      id: newId,
      url: trimmed,
      file: 'إدخال يدوي مباشر',
      line: 1,
      status: 'idle'
    };

    setWebhooks(prev => [newItem, ...prev]);
    setManualUrl('');
    // Automatically test the newly added webhook
    testWebhook(newId, trimmed);
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const removeWebhook = (id: string) => {
    setWebhooks(prev => prev.filter(w => w.id !== id));
  };

  // Compute stats
  const totalCount = webhooks.length;
  const activeCount = webhooks.filter(w => w.status === 'active').length;
  const deadCount = webhooks.filter(w => w.status === 'dead' || w.status === 'error').length;
  const pendingCount = webhooks.filter(w => w.status === 'idle').length;

  // Filtered list
  const filteredWebhooks = webhooks.filter(item => {
    const matchesSearch = item.url.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (item.file && item.file.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (item.webhookName && item.webhookName.toLowerCase().includes(searchQuery.toLowerCase()));
    if (!matchesSearch) return false;

    if (statusFilter === 'active') return item.status === 'active';
    if (statusFilter === 'dead') return item.status === 'dead' || item.status === 'error';
    if (statusFilter === 'pending') return item.status === 'idle';
    return true;
  });

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5 animate-modal-backdrop"
      onClick={onClose}
    >
      <div 
        onClick={e => e.stopPropagation()}
        className="w-full max-w-5xl bg-surface border border-indigo-500/40 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] animate-modal-content"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border bg-bg/90 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.25)]">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white tracking-tight">
                  فاحص الاتصال المباشر مع Discord Webhooks
                </h3>
                <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                  Active / Dead Checker
                </span>
              </div>
              <p className="text-xs text-text-dim mt-0.5">
                اختبار الاتصال المباشر مع خوادم ديسكورد للتحقق من أن روابط الـ Webhooks المكتشفة حية ونشطة أو معطلة ومحذوفة
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

        {/* Stats & Quick Actions Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 sm:p-4 bg-bg/60 border-b border-border text-xs">
          <div className="p-2.5 rounded-xl bg-surface/70 border border-white/5 flex items-center justify-between">
            <div>
              <span className="text-text-dim text-[11px] block">إجمالي الويب هوك</span>
              <span className="text-base font-bold font-mono text-white">{totalCount}</span>
            </div>
            <Hash className="w-5 h-5 text-text-dim/50" />
          </div>

          <div className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between">
            <div>
              <span className="text-emerald-400 text-[11px] block">نشطة وشغالة (Active)</span>
              <span className="text-base font-bold font-mono text-emerald-400">{activeCount}</span>
            </div>
            <CheckCircle2 className="w-5 h-5 text-emerald-400/70" />
          </div>

          <div className="p-2.5 rounded-xl bg-rose-950/20 border border-rose-500/30 flex items-center justify-between">
            <div>
              <span className="text-rose-400 text-[11px] block">معطلة أو محذوفة (Dead)</span>
              <span className="text-base font-bold font-mono text-rose-400">{deadCount}</span>
            </div>
            <XCircle className="w-5 h-5 text-rose-400/70" />
          </div>

          <div className="p-2.5 rounded-xl bg-amber-950/20 border border-amber-500/30 flex items-center justify-between">
            <div>
              <span className="text-amber-400 text-[11px] block">قيد الانتظار (Pending)</span>
              <span className="text-base font-bold font-mono text-amber-400">{pendingCount}</span>
            </div>
            <Clock className="w-5 h-5 text-amber-400/70" />
          </div>
        </div>

        {/* Manual Add & Global Controls */}
        <div className="p-3 sm:p-4 border-b border-border bg-bg/40 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Manual Input Form */}
          <form onSubmit={handleAddManual} className="w-full sm:flex-1 flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="أدخل رابط Discord Webhook لاختباره يدوياً..."
                value={manualUrl}
                onChange={e => setManualUrl(e.target.value)}
                className="w-full bg-surface border border-border focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-white placeholder-text-dim font-mono focus:outline-none"
                dir="ltr"
              />
            </div>
            <button
              type="submit"
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-sm shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة وفحص</span>
            </button>
          </form>

          {/* Batch Controls & Forwarder */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => openLogForwarder(manualUrl || (webhooks[0]?.url || ''))}
              className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
              title="إرسال وتحويل رسائل اللوق وتحديد سبب الإرسال والعدد"
            >
              <Send className="w-3.5 h-3.5" />
              <span>تحويل وإرسال اللوق (Forward Logs)</span>
            </button>

            <button
              onClick={testAllWebhooks}
              disabled={totalCount === 0 || isBatchTesting}
              className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isBatchTesting ? 'animate-spin' : ''}`} />
              <span>{isBatchTesting ? 'جاري الفحص...' : 'اختبار اتصال الكل'}</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="px-4 py-2.5 bg-bg/30 border-b border-border flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'all' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold' : 'text-text-dim hover:text-white'
              }`}
            >
              الكل ({totalCount})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'active' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold' : 'text-text-dim hover:text-white'
              }`}
            >
              النشطة فقط ({activeCount})
            </button>
            <button
              onClick={() => setStatusFilter('dead')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'dead' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold' : 'text-text-dim hover:text-white'
              }`}
            >
              المعطلة والمحذوفة ({deadCount})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'pending' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold' : 'text-text-dim hover:text-white'
              }`}
            >
              غير المفحوصة ({pendingCount})
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-text-dim absolute right-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="بحث في الروابط أو الملفات..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-surface border border-border rounded-lg pr-8 pl-3 py-1 text-xs text-white placeholder-text-dim focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Webhook List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredWebhooks.length === 0 ? (
            <div className="p-10 rounded-xl bg-bg border border-border text-center space-y-2">
              <Radio className="w-8 h-8 text-text-dim mx-auto opacity-50" />
              <p className="text-sm font-bold text-white">لا توجد روابط Webhooks تطابق الفلتر الحالي</p>
              <p className="text-xs text-text-dim">
                يمكنك استيراد ملفات السيرفر لكشف الروابط تلقائياً، أو إضافة رابط يدوي في الأعلى.
              </p>
            </div>
          ) : (
            filteredWebhooks.map((item) => {
              const isTested = item.status !== 'idle' && item.status !== 'testing';

              return (
                <div 
                  key={item.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    item.status === 'active' 
                      ? 'bg-emerald-950/10 border-emerald-500/30' 
                      : item.status === 'dead' || item.status === 'error'
                      ? 'bg-rose-950/10 border-rose-500/30'
                      : item.status === 'testing'
                      ? 'bg-indigo-950/10 border-indigo-500/30 animate-pulse'
                      : 'bg-bg border-border'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      {/* Status Tag & Meta */}
                      <div className="flex flex-wrap items-center gap-2">
                        {item.status === 'idle' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/5 border border-white/10 text-text-dim flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            بانتظار الفحص
                          </span>
                        )}

                        {item.status === 'testing' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 flex items-center gap-1">
                            <RotateCw className="w-3 h-3 animate-spin" />
                            جاري الاتصال بخادم ديسكورد...
                          </span>
                        )}

                        {item.status === 'active' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center gap-1 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            نشط وحي (Active 200 OK)
                          </span>
                        )}

                        {item.status === 'dead' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 border border-rose-500/40 text-rose-300 flex items-center gap-1">
                            <XCircle className="w-3 h-3 text-rose-400" />
                            معطل أو محذوف (Dead {item.statusCode || 404})
                          </span>
                        )}

                        {item.status === 'rate_limited' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-amber-400" />
                            معدل طلبات زائد (Rate Limited)
                          </span>
                        )}

                        {item.status === 'error' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 border border-rose-500/40 text-rose-300 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 text-rose-400" />
                            تعذر الاتصال
                          </span>
                        )}

                        {item.latency !== undefined && (
                          <span className="text-[10px] font-mono text-text-dim">
                            {item.latency}ms
                          </span>
                        )}

                        {item.file && (
                          <span className="text-[10px] font-mono text-text-dim truncate max-w-xs" title={`${item.file}:${item.line}`}>
                            {item.file}:{item.line}
                          </span>
                        )}
                      </div>

                      {/* Webhook URL display */}
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono text-indigo-300 break-all bg-black/30 px-2 py-1 rounded border border-white/5 select-all" dir="ltr">
                          {item.url}
                        </code>
                        <button
                          onClick={() => copyToClipboard(item.id, item.url)}
                          className="p-1 rounded text-text-dim hover:text-white hover:bg-white/5 transition-colors shrink-0"
                          title="نسخ الرابط"
                        >
                          {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      {/* Webhook details if active */}
                      {item.status === 'active' && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px] text-text-dim">
                          <div className="flex items-center gap-1.5 bg-black/20 px-2 py-1 rounded border border-white/5">
                            <Server className="w-3 h-3 text-emerald-400" />
                            <span>الاسم: <strong className="text-white font-mono">{item.webhookName || 'Unknown'}</strong></span>
                          </div>
                          {item.guildId && (
                            <div className="flex items-center gap-1.5 bg-black/20 px-2 py-1 rounded border border-white/5">
                              <Hash className="w-3 h-3 text-indigo-400" />
                              <span>Guild ID: <strong className="text-white font-mono">{item.guildId}</strong></span>
                            </div>
                          )}
                          {item.channelId && (
                            <div className="flex items-center gap-1.5 bg-black/20 px-2 py-1 rounded border border-white/5">
                              <MessageSquare className="w-3 h-3 text-purple-400" />
                              <span>Channel ID: <strong className="text-white font-mono">{item.channelId}</strong></span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Error message if dead */}
                      {item.errorMessage && (
                        <p className="text-[11px] text-rose-400/90 pt-0.5">
                          {item.errorMessage}
                        </p>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-start">
                      <button
                        onClick={() => openLogForwarder(item.url, `🚨 تنبيه فحص السيرفر: رصد اتصال في ${item.file || 'FiveM'}`)}
                        className="px-2.5 py-1.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                        title="تحويل وإرسال رسائل اللوق، كتابة سبب الإرسال وتحديد عدد مرات الإرسال"
                      >
                        <Send className="w-3.5 h-3.5 text-indigo-400" />
                        <span>تحويل / إرسال اللوق</span>
                      </button>

                      <button
                        onClick={() => testWebhook(item.id, item.url)}
                        disabled={item.status === 'testing'}
                        className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-indigo-500/20 border border-white/10 hover:border-indigo-500/40 text-xs text-white transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        title="إعادة اختبار الاتصال"
                      >
                        <RotateCw className={`w-3.5 h-3.5 ${item.status === 'testing' ? 'animate-spin' : ''}`} />
                        <span>فحص الاتصال</span>
                      </button>

                      {item.status === 'active' && (
                        <button
                          onClick={() => sendTestMessage(item)}
                          disabled={sendingMsgId === item.id || item.messageSent}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                          title="إرسال رسالة سريعة إلى القناة في ديسكورد"
                        >
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{item.messageSent ? 'تم الإرسال!' : sendingMsgId === item.id ? 'جاري الإرسال...' : 'Ping سريع'}</span>
                        </button>
                      )}

                      <button
                        onClick={() => removeWebhook(item.id)}
                        className="p-1.5 rounded-lg text-text-dim hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="حذف من القائمة"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-border bg-bg/90 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-text-dim text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              يساعد فحص الـ Webhooks على اكتشاف الثغرات المسربة والتأكد من إمكانية استغلال قنوات الخادم أو كشف الهويات.
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 text-xs font-bold transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>

      {/* Embedded Discord Log Forwarder & Multi-Sender Modal */}
      <DiscordLogForwarderModal
        isOpen={isForwarderOpen}
        onClose={() => setIsForwarderOpen(false)}
        initialWebhookUrl={forwarderTargetUrl}
        initialReason={forwarderReason}
        availableWebhooks={webhooks}
        discoveredEvents={discoveredEvents}
      />
    </div>
  );
};
