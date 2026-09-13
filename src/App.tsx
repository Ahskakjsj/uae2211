import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Shield, 
  Search, 
  FileText, 
  Terminal, 
  ChevronRight, 
  ChevronLeft,
  AlertCircle, 
  AlertTriangle,
  Info, 
  Zap, 
  Download,
  Filter,
  ArrowRight,
  Database,
  Users,
  HardDrive,
  Copy,
  Check,
  Sparkles,
  Code2,
  Play,
  Trash2,
  ListChecks,
  SlidersHorizontal,
  ArrowLeftRight,
  ShieldCheck,
  ShieldAlert,
  Image as ImageIcon,
  ExternalLink,
  Crosshair,
  Wrench,
  Cpu,
  GitCompare,
  Radio,
  Gauge,
  Flame,
  Send,
  Bot
} from 'lucide-react';
import { EventOccurrence, Stats, SeverityLevel, ServerLogo, DetectedProtection } from './types';
import { scanContent, fullDeobfuscate, identifyProtections } from './scannerRules';
import { DEMO_LUA_SCRIPTS, DEMO_SERVER_LOGOS, DEMO_PROTECTIONS } from './demoData';
import { DeobfuscatorModal } from './components/DeobfuscatorModal';
import { QuickScanModal } from './components/QuickScanModal';
import { ExportModal } from './components/ExportModal';
import { ServerLogosModal } from './components/ServerLogosModal';
import { PayloadInjectorModal } from './components/PayloadInjectorModal';
import { PatchGeneratorModal } from './components/PatchGeneratorModal';
import { BytecodeInspectorModal } from './components/BytecodeInspectorModal';
import { SeverityPieChart } from './components/SeverityPieChart';
import { ScriptDiffModal } from './components/ScriptDiffModal';
import { SiteProtectionShieldModal, SecurityAlertToast } from './components/SiteProtectionShield';
import { DiscordWebhookTesterModal } from './components/DiscordWebhookTesterModal';
import { AntiCheatRulesModal } from './components/AntiCheatRulesModal';
import { BackdoorHunterModal } from './components/BackdoorHunterModal';
import { ResmonOptimizerModal } from './components/ResmonOptimizerModal';
import { AIAssistantModal } from './components/AIAssistantModal';
import { AIAssistantFloatingButton } from './components/AIAssistantFloatingButton';
import { initSecurityShield } from './securityEngine';

// --- Constants ---
const EVENT_TYPES = {
  server: { color: 'text-indigo-400', bg: 'bg-indigo-400/10', label: 'Server Event' },
  client: { color: 'text-emerald-400', bg: 'bg-emerald-400/10', label: 'Client Event' },
  local: { color: 'text-purple-400', bg: 'bg-purple-400/10', label: 'TriggerEvent' },
  register: { color: 'text-amber-400', bg: 'bg-amber-400/10', label: 'Registration' },
  vulnerability: { color: 'text-rose-500', bg: 'bg-rose-500/10', label: 'Security Risk' },
  command: { color: 'text-cyan-400', bg: 'bg-cyan-400/10', label: 'Command' },
  webhook: { color: 'text-indigo-300', bg: 'bg-indigo-500/10', label: 'Discord Webhook' },
};

const SEVERITY_CONFIG: Record<SeverityLevel, { label: string; color: string; bg: string; border: string }> = {
  critical: { label: 'حرجة', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30' },
  high: { label: 'عالية', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
  medium: { label: 'متوسطة', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  low: { label: 'عادية', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' }
};

const computeStats = (
  events: EventOccurrence[], 
  filesCount: number, 
  luaCount: number, 
  protections: DetectedProtection[] = [],
  logos: ServerLogo[] = []
): Stats => {
  const criticalCount = events.filter(e => e.severity === 'critical').length;
  const highCount = events.filter(e => e.severity === 'high').length;
  const mediumCount = events.filter(e => e.severity === 'medium').length;
  const lowCount = events.filter(e => e.severity === 'low').length;
  const webhooks = events.filter(e => e.type === 'webhook').length;

  const score = Math.min(100,
    (criticalCount * 25) +
    (highCount * 15) +
    (webhooks * 10) +
    (events.filter(e => e.name.includes('Obfuscated') || e.category === 'Obfuscation').length * 12)
  );

  return {
    totalFiles: filesCount,
    luaFiles: luaCount,
    serverEvents: events.filter(e => e.type === 'server').length,
    clientEvents: events.filter(e => e.type === 'client').length,
    localEvents: events.filter(e => e.type === 'local').length,
    registrations: events.filter(e => e.type === 'register').length,
    vulnerabilities: events.filter(e => e.type === 'vulnerability').length,
    webhooks,
    criticalCount,
    highCount,
    mediumCount,
    lowCount,
    obfuscationScore: score,
    detectedProtections: protections,
    serverLogos: logos
  };
};

export default function App() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<EventOccurrence[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [selectedEvent, setSelectedEvent] = useState<EventOccurrence | null>(null);
  const [status, setStatus] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [copiedName, setCopiedName] = useState(false);

  // Modals state
  const [isDeobfuscatorOpen, setIsDeobfuscatorOpen] = useState(false);
  const [isQuickScanOpen, setIsQuickScanOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isLogosModalOpen, setIsLogosModalOpen] = useState(false);
  const [isInjectorOpen, setIsInjectorOpen] = useState(false);
  const [isPatchOpen, setIsPatchOpen] = useState(false);
  const [isBytecodeOpen, setIsBytecodeOpen] = useState(false);
  const [isDiffOpen, setIsDiffOpen] = useState(false);
  const [isProtectionOpen, setIsProtectionOpen] = useState(false);
  const [isWebhookTesterOpen, setIsWebhookTesterOpen] = useState(false);
  const [isACRulesOpen, setIsACRulesOpen] = useState(false);
  const [isBackdoorOpen, setIsBackdoorOpen] = useState(false);
  const [isResmonOpen, setIsResmonOpen] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);

  // Initialize anti-F12, anti-copy and encryption shield
  useEffect(() => {
    const cleanup = initSecurityShield();
    return cleanup;
  }, []);
  
  // Layout state: allows toggling sidebar between right and left
  const [sidebarPosition, setSidebarPosition] = useState<'right' | 'left'>('right');
  const [reversedColumns, setReversedColumns] = useState<boolean>(false);
  
  // Drag and drop & Progress state
  const [isDragging, setIsDragging] = useState(false);
  const [scanProgress, setScanProgress] = useState<{ current: number; total: number; fileName: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyField = (field: 'payload' | 'name', text: string) => {
    navigator.clipboard.writeText(text);
    if (field === 'payload') {
      setCopiedPayload(true);
      setTimeout(() => setCopiedPayload(false), 2000);
    } else {
      setCopiedName(true);
      setTimeout(() => setCopiedName(false), 2000);
    }
  };

  const deduplicateEvents = (events: EventOccurrence[]): EventOccurrence[] => {
    const map = new Map<string, EventOccurrence>();
    for (let i = 0; i < events.length; i++) {
      const item = events[i];
      const key = `${item.file}::${item.name}::${item.type}::${item.line}`;
      if (!map.has(key)) {
        map.set(key, item);
      }
    }
    return Array.from(map.values());
  };

  const processZipFile = async (file: File) => {
    if (!file) return;

    setLoading(true);
    setData([]);
    setStats(null);
    setSelectedEvent(null);
    setStatus('جاري فك ضغط وقراءة حزمة ZIP...');
    setScanProgress(null);

    try {
      // 1. Read binary ArrayBuffer first to avoid FileReader callback recursion inside JSZip
      const arrayBuffer = await file.arrayBuffer();
      
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      const content = await zip.loadAsync(arrayBuffer, { createFolders: false });
      
      const discoveredEvents: EventOccurrence[] = [];
      const discoveredLogos: ServerLogo[] = [];
      let luaFileCount = 0;

      const allPaths = Object.keys(content.files);
      const scriptPaths: string[] = [];
      const imageExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.svg'];
      const fileContentsSample = new Map<string, string>();

      // Filter valid scripts while ignoring noisy/large folders, and collect images/logos
      for (let i = 0; i < allPaths.length; i++) {
        const path = allPaths[i];
        const entry = content.files[path];
        if (!entry || entry.dir) continue;

        const lower = path.toLowerCase();
        if (
          lower.includes('node_modules/') ||
          lower.includes('.git/') ||
          lower.includes('dist/') ||
          lower.includes('build/') ||
          lower.includes('.cache/') ||
          lower.endsWith('.min.js')
        ) {
          continue;
        }

        // Check if image / logo candidate
        const isImage = imageExtensions.some(ext => lower.endsWith(ext));
        if (isImage) {
          try {
            const fileName = path.split('/').pop() || path;
            const ext = fileName.split('.').pop()?.toLowerCase() || 'png';
            const base64 = await entry.async('base64');
            const mime = ext === 'svg' ? 'image/svg+xml' : (ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : (ext === 'webp' ? 'image/webp' : 'image/png'));
            const dataUrl = `data:${mime};base64,${base64}`;
            discoveredLogos.push({
              id: `logo-${discoveredLogos.length + 1}`,
              fileName,
              filePath: path,
              dataUrl,
              size: Math.round((base64.length * 3) / 4),
              extension: ext
            });
          } catch (imgErr) {
            console.warn(`Could not read image: ${path}`, imgErr);
          }
          continue;
        }

        if (lower.endsWith('.lua') || lower.endsWith('.js') || lower.endsWith('.ts') || lower.endsWith('.fxap') || lower.endsWith('manifest.lua') || lower.endsWith('.cfg')) {
          scriptPaths.push(path);
        }
      }

      const totalScripts = scriptPaths.length;
      if (totalScripts === 0 && discoveredLogos.length === 0) {
        setStatus('لم يتم العثور على ملفات برمجية (.lua/.js/.ts) أو شعارات داخل الأرشيف');
        setLoading(false);
        return;
      }

      setStatus(`تم العثور على ${totalScripts} ملف برمجي و ${discoveredLogos.length} شعار. جاري الفحص...`);

      // 2. Process iteratively without recursion or thread lock
      for (let i = 0; i < totalScripts; i++) {
        const path = scriptPaths[i];
        const zipFile = content.files[path];
        if (!zipFile) continue;

        if (path.endsWith('.lua')) luaFileCount++;
        const shortName = path.split('/').pop() || path;
        setScanProgress({ current: i + 1, total: totalScripts, fileName: shortName });

        try {
          const fileContent = await zipFile.async('string');
          // Cache sample of file content for protection/anticheat signatures
          if (fileContentsSample.size < 50) {
            fileContentsSample.set(path, fileContent.substring(0, 10000));
          }
          
          // Safety guard: files larger than 2MB text are scanned without aggressive deobfuscation loops
          if (fileContent.length <= 2 * 1024 * 1024) {
            const occurrences = scanContent(fileContent, path);
            for (let j = 0; j < occurrences.length; j++) {
              discoveredEvents.push(occurrences[j]);
            }
          }
        } catch (readErr) {
          console.error(`Error reading ${path}:`, readErr);
        }

        // Yield execution to the browser every 2 files to keep UI responsive
        if (i % 2 === 0) {
          setStatus(`جاري فحص الملفات: (${i + 1}/${totalScripts}) ${shortName}`);
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
      }

      // 3. Identify Protections & AntiCheat systems across archive
      const detectedProtections = identifyProtections(allPaths, fileContentsSample);

      const uniqueEvents = deduplicateEvents(discoveredEvents);
      setData(uniqueEvents);
      setStats(computeStats(uniqueEvents, allPaths.length, luaFileCount, detectedProtections, discoveredLogos));
      setStatus(`اكتمل الفحص: تم تحليل ${luaFileCount} ملف برمجي، استخراج ${discoveredLogos.length} شعار، رصد ${detectedProtections.length} نظام حماية، واكتشاف ${uniqueEvents.length} تريقر`);
    } catch (err: any) {
      console.error('ZIP scanning error:', err);
      setStatus(`فشل قراءة الأرشيف: ${err?.message || 'الملف تالف أو غير صالح'}`);
    } finally {
      setLoading(false);
      setScanProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processZipFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processZipFile(files[0]);
    }
  };

  const handleLoadDemo = () => {
    setLoading(true);
    setStatus('Loading Demo FiveM Script Package with Server Logos & AntiCheat...');
    setTimeout(() => {
      const discovered: EventOccurrence[] = [];
      const fileNames = Object.keys(DEMO_LUA_SCRIPTS);
      const sampleMap = new Map<string, string>();
      for (let i = 0; i < fileNames.length; i++) {
        const name = fileNames[i];
        const content = DEMO_LUA_SCRIPTS[name];
        sampleMap.set(name, content);
        const events = scanContent(content, name);
        for (let j = 0; j < events.length; j++) {
          discovered.push(events[j]);
        }
      }
      const uniqueEvents = deduplicateEvents(discovered);
      setData(uniqueEvents);
      const demoProtections = DEMO_PROTECTIONS;
      const demoLogos = DEMO_SERVER_LOGOS;
      setStats(computeStats(uniqueEvents, fileNames.length + demoLogos.length, fileNames.length, demoProtections, demoLogos));
      setStatus(`Loaded demo package with ${demoLogos.length} server logos, ${demoProtections.length} protections, & ${uniqueEvents.length} triggers`);
      setLoading(false);
    }, 300);
  };

  const handleQuickScanResults = (events: EventOccurrence[], fileName: string) => {
    const combined = deduplicateEvents(data.concat(events));
    setData(combined);
    setStats(computeStats(combined, (stats?.totalFiles || 0) + 1, (stats?.luaFiles || 0) + 1));
    setStatus(`Snippet '${fileName}' scanned successfully`);
  };

  const handleDeobfuscatorImport = (events: EventOccurrence[]) => {
    const combined = deduplicateEvents(data.concat(events));
    setData(combined);
    setStats(computeStats(combined, (stats?.totalFiles || 0) + 1, (stats?.luaFiles || 0) + 1));
    setStatus(`Imported ${events.length} extracted events from Deobfuscator`);
  };

  const handleClearAll = () => {
    setData([]);
    setStats(null);
    setSelectedEvent(null);
    setStatus('Workspace reset. Ready for next package.');
  };

  const handleCopyAllNames = () => {
    const uniqueNames = Array.from(new Set(filteredData.map(e => e.name))).join('\n');
    navigator.clipboard.writeText(uniqueNames);
    setStatus(`Copied ${uniqueNames.split('\n').length} trigger names to clipboard!`);
  };

  const filteredData = useMemo(() => {
    return [...data].sort((a, b) => {
      const priority: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
      return (priority[b.severity] || 0) - (priority[a.severity] || 0);
    }).filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           item.file.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === 'all' || item.type === filterType;
      const matchesSeverity = severityFilter === 'all' || item.severity === severityFilter;
      return matchesSearch && matchesType && matchesSeverity;
    });
  }, [data, searchQuery, filterType, severityFilter]);

  const discoveredWebhooks = useMemo(() => {
    return data.filter(e => e.type === 'webhook' || e.context.includes('discord.com/api/webhooks/') || e.name.includes('discord.com/api/webhooks/'));
  }, [data]);

  const currentIndex = selectedEvent ? filteredData.findIndex(e => e.file === selectedEvent.file && e.name === selectedEvent.name && e.line === selectedEvent.line) : -1;
  const handlePrevEvent = () => {
    if (currentIndex > 0) setSelectedEvent(filteredData[currentIndex - 1]);
  };
  const handleNextEvent = () => {
    if (currentIndex >= 0 && currentIndex < filteredData.length - 1) {
      setSelectedEvent(filteredData[currentIndex + 1]);
    }
  };

  const getPayloadSnippet = (event: EventOccurrence) => {
    if (event.type === 'server') {
      return `TriggerServerEvent("${event.name}", source, ...args)`;
    } else if (event.type === 'client') {
      return `TriggerClientEvent("${event.name}", -1, ...args)`;
    } else if (event.type === 'register') {
      return `RegisterNetEvent("${event.name}", function(...args)\n    -- Server handler\nend)`;
    }
    return `TriggerEvent("${event.name}", ...args)`;
  };

  const getFixSnippet = (event: EventOccurrence) => {
    if (event.severity === 'critical' && event.name.includes('Admin')) {
      return `-- 🔒 Secure Implementation with Permission Check\nRegisterNetEvent("${event.name}", function(...args)\n    local src = source\n    if not IsPlayerAdmin(src) then\n        print(("[SECURITY] Unauthorized attempt to trigger %s by %s"):format("${event.name}", src))\n        DropPlayer(src, "Exploit Detected")\n        return\n    end\n    -- Secure logic here\nend)`;
    }
    if (event.type === 'server' || event.severity === 'high') {
      return `-- 🛡️ Server-Side Validation Pattern\nRegisterNetEvent("${event.name}", function(amount, target)\n    local src = source\n    if type(amount) ~= "number" or amount <= 0 or amount > 100000 then\n        return DropPlayer(src, "Invalid payload value")\n    end\n    -- Proceed with validated data\nend)`;
    }
    return `-- 🛡️ Event Sanitization\n-- Ensure "${event.name}" cannot be invoked repeatedly from unauthorized clients.`;
  };

  return (
    <div className="flex flex-col h-screen bg-bg text-text-main overflow-hidden">
      {/* App Background Image Overlay */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-[0.03]">
        <img 
          src="https://media.discordapp.net/attachments/1325833497407131660/1495110379410296932/image.png?ex=69e50d8c&is=69e3bc0c&hm=10734314e177a21945ea624eba5c4cb3e03280db35f9e6f0cec68f094523d20d&=&format=webp&quality=lossless&width=883&height=883" 
          alt="Site Background" 
          className="w-full h-full object-cover grayscale brightness-50"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* App Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface shrink-0 z-20">
        <div className="flex items-center gap-4">
          <img 
            src="https://media.discordapp.net/attachments/1325833497407131660/1495110379410296932/image.png?ex=69e50d8c&is=69e3bc0c&hm=10734314e177a21945ea624eba5c4cb3e03280db35f9e6f0cec68f094523d20d&=&format=webp&quality=lossless&width=883&height=883" 
            alt="Logo" 
            className="w-9 h-9 rounded-md shadow-[0_0_20px_rgba(99,102,241,0.3)] object-cover border border-accent/20"
            referrerPolicy="no-referrer"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-white leading-none">محلل تريقرات السيرفر</h1>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-accent/20 text-accent border border-accent/30">v4.5 HUD</span>
            </div>
            <p className="text-[10px] text-text-dim uppercase tracking-[1.5px] mt-1 font-medium">Advanced FiveM Trigger & Threat Protocol</p>
          </div>
        </div>

        {/* Header Action Tools */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* AI Assistant Button */}
          <button
            onClick={() => setIsAIAssistantOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-accent/20 to-indigo-500/20 hover:from-accent/30 hover:to-indigo-500/30 border border-accent/40 text-accent hover:text-white transition-all shadow-[0_0_15px_rgba(99,102,241,0.25)] cursor-pointer"
            title="مساعد الزعابي الذكي (AI) - اسأل أي سؤال عن الموقع وتأمين FiveM"
          >
            <Bot className="w-3.5 h-3.5 text-accent animate-pulse" />
            <span>مساعد الذكاء الاصطناعي (AI)</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </button>

          <button
            onClick={handleLoadDemo}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white/[0.04] hover:bg-accent/15 border border-white/10 hover:border-accent/40 text-text-dim hover:text-white transition-all shadow-sm"
            title="تحميل عينة برمجية واقعية للاختبار السريع"
          >
            <Play className="w-3.5 h-3.5 text-accent fill-accent" />
            <span className="hidden sm:inline">عينة تجريبية</span>
          </button>

          <button
            onClick={() => setIsQuickScanOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white/[0.04] hover:bg-cyan-500/15 border border-white/10 hover:border-cyan-500/40 text-text-dim hover:text-cyan-300 transition-all shadow-sm"
            title="فحص فوري لنص أو سكريبت كود محدد"
          >
            <Code2 className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">فحص كود سريع</span>
          </button>

          <button
            onClick={() => setIsDeobfuscatorOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white/[0.04] hover:bg-purple-500/15 border border-white/10 hover:border-purple-500/40 text-text-dim hover:text-purple-300 transition-all shadow-sm"
            title="مختبر فك التشفير اليدوي والمتعدد المراحل"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">مختبر فك التشفير</span>
          </button>

          <button
            onClick={() => setIsInjectorOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white/[0.04] hover:bg-cyan-500/15 border border-white/10 hover:border-cyan-500/40 text-text-dim hover:text-cyan-300 transition-all shadow-sm cursor-pointer"
            title="محاكي استدعاء واختبار التريقرات وصياغة البايلودات"
          >
            <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">محاكي التريقرات</span>
          </button>

          <button
            onClick={() => setIsPatchOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white/[0.04] hover:bg-emerald-500/15 border border-white/10 hover:border-emerald-500/40 text-text-dim hover:text-emerald-300 transition-all shadow-sm cursor-pointer"
            title="مولد ترقيعات الحماية البرمجية للتريقرات"
          >
            <Wrench className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">توليد الترقيعات</span>
          </button>

          <button
            onClick={() => setIsBytecodeOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white/[0.04] hover:bg-purple-500/15 border border-white/10 hover:border-purple-500/40 text-text-dim hover:text-purple-300 transition-all shadow-sm cursor-pointer"
            title="محلل ومستخرج نصوص وتريقرات الـ Lua Bytecode"
          >
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden lg:inline">محلل Bytecode</span>
          </button>

          <button
            onClick={() => setIsDiffOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white/[0.04] hover:bg-accent/20 border border-white/10 hover:border-accent/40 text-text-dim hover:text-white transition-all shadow-sm cursor-pointer"
            title="أداة مقارنة السكريبتات وكشف فروقات التريقرات بصرياً"
          >
            <GitCompare className="w-3.5 h-3.5 text-accent" />
            <span className="hidden sm:inline">مقارنة السكريبتات</span>
          </button>

          <button
            onClick={() => setIsWebhookTesterOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 hover:border-indigo-500/50 text-indigo-400 hover:text-indigo-300 transition-all shadow-sm cursor-pointer"
            title="فاحص الاتصال المباشر مع Discord Webhooks (Active / Dead)"
          >
            <Radio className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden md:inline">فاحص Webhooks</span>
            {discoveredWebhooks.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {discoveredWebhooks.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setIsBackdoorOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 hover:border-rose-500/50 text-rose-400 hover:text-rose-300 transition-all shadow-sm cursor-pointer"
            title="صائد الأبواب الخلفية والـ RCE وسحب التوكنات"
          >
            <Flame className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden xl:inline">صائد الباك دور</span>
          </button>

          <button
            onClick={() => setIsACRulesOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-500/50 text-amber-400 hover:text-amber-300 transition-all shadow-sm cursor-pointer"
            title="توليد قوائم وقواعد الأنتيشيت المباشرة (FiveGuard / WaveShield / Phoenix)"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden xl:inline">قواعد الأنتيشيت</span>
          </button>

          <button
            onClick={() => setIsProtectionOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500/50 text-emerald-400 hover:text-emerald-300 transition-all shadow-[0_0_15px_rgba(16,185,129,0.15)] cursor-pointer"
            title="درع الحماية والتشفير الشامل (Anti-F12 / Anti-Copy / Anti-Inspect)"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="hidden sm:inline">الحماية والتشفير</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </button>

          <button
            onClick={() => setIsExportOpen(true)}
            disabled={data.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white/[0.04] hover:bg-emerald-500/15 border border-white/10 hover:border-emerald-500/40 text-text-dim hover:text-emerald-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
            title="تصدير التقارير الأمنية وقوائم الأنتيشيت"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">تصدير التقارير</span>
          </button>

          {/* Server Logos Gallery Button */}
          {stats?.serverLogos && stats.serverLogos.length > 0 && (
            <button
              onClick={() => setIsLogosModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 hover:text-amber-200 transition-all shadow-sm cursor-pointer"
              title="استعراض وتحميل لوقوهات وشعارات السيرفر المستخرجة"
            >
              <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
              <span>لوقوهات السيرفر ({stats.serverLogos.length})</span>
            </button>
          )}

          {/* Detected Protection Badge in Header */}
          {stats?.detectedProtections && stats.detectedProtections.length > 0 && (
            <div 
              className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold"
              title={stats.detectedProtections.map(p => `${p.name} (${p.type})`).join(' | ')}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="truncate max-w-[170px]">حماية: {stats.detectedProtections[0].name}</span>
              {stats.detectedProtections.length > 1 && (
                <span className="px-1 py-0.2 bg-emerald-500/20 rounded text-[9px]">+{stats.detectedProtections.length - 1}</span>
              )}
            </div>
          )}

          {/* Toggle Sidebar Side */}
          <button
            onClick={() => setSidebarPosition(prev => prev === 'right' ? 'left' : 'right')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer border ${
              sidebarPosition === 'right' 
                ? 'bg-accent/15 border-accent/40 text-white' 
                : 'bg-white/[0.04] hover:bg-accent/15 border-white/10 hover:border-accent/40 text-text-dim hover:text-white'
            }`}
            title={sidebarPosition === 'right' ? 'نقل القائمة إلى اليسار' : 'نقل القائمة إلى اليمين'}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-accent" />
            <span className="text-[11px] font-medium">
              {sidebarPosition === 'right' ? 'القائمة: يمين' : 'القائمة: يسار'}
            </span>
          </button>

          <div className="hidden lg:flex items-center gap-2 px-2.5 py-1.5 bg-green-500/10 border border-green-500/20 rounded-md text-[10px] text-green-400 font-medium">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            فحص محلي 100%
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <main className={`flex-1 flex overflow-hidden transition-all duration-200 ${sidebarPosition === 'right' ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Results Area */}
        <section className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Top Bar for Results summary & Quick Actions */}
          {data.length > 0 && (
            <div className="px-6 py-2.5 bg-surface/80 border-b border-border flex items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3">
                <span className="font-mono text-text-dim">
                  تم العثور على <span className="font-bold text-accent">{filteredData.length}</span> من أصل <span className="font-bold text-white">{data.length}</span> حدث
                </span>

                {stats && stats.criticalCount > 0 && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" />
                    {stats.criticalCount} خطر حرج
                  </span>
                )}

                {filterType !== 'all' && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-accent/10 border border-accent/30 text-accent">
                    نوع: {filterType}
                  </span>
                )}
                {severityFilter !== 'all' && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-orange-500/10 border border-orange-500/30 text-orange-400">
                    مستوى: {severityFilter}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setReversedColumns(prev => !prev)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium transition-colors border cursor-pointer ${
                    reversedColumns 
                      ? 'bg-accent/20 border-accent/40 text-white' 
                      : 'bg-white/5 hover:bg-white/10 border-white/5 text-text-dim hover:text-white'
                  }`}
                  title="عكس ترتيب أعمدة الجدول"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5 text-cyan-400" />
                  <span>عكس الأعمدة</span>
                </button>

                <button
                  onClick={handleCopyAllNames}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-text-dim hover:text-white text-[11px] font-medium transition-colors"
                  title="نسخ جميع أسماء التريقرات المفلترة"
                >
                  <ListChecks className="w-3.5 h-3.5 text-accent" />
                  نسخ الأسماء
                </button>

                <button
                  onClick={handleClearAll}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[11px] font-medium transition-colors"
                  title="مسح النتائج وإعادة ضبط المحرك"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  مسح النتائج
                </button>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-auto bg-bg smooth-scroll">
            <table className="w-full text-left border-collapse table-fixed">
              <thead className="sticky top-0 z-10">
                <tr className="bg-surface">
                  {!reversedColumns ? (
                    <>
                      <th className="w-[38%] px-6 py-4 text-[11px] font-bold text-text-dim uppercase tracking-wider border-b border-border">Source File Path</th>
                      <th className="w-[44%] px-6 py-4 text-[11px] font-bold text-text-dim uppercase tracking-wider border-b border-border">Trigger Name (Event)</th>
                      <th className="w-[10%] px-4 py-4 text-[11px] font-bold text-text-dim uppercase tracking-wider border-b border-border text-center">Threat</th>
                      <th className="w-[8%] px-4 py-4 text-[11px] font-bold text-text-dim uppercase tracking-wider border-b border-border text-center">Line</th>
                    </>
                  ) : (
                    <>
                      <th className="w-[8%] px-4 py-4 text-[11px] font-bold text-text-dim uppercase tracking-wider border-b border-border text-center">Line</th>
                      <th className="w-[10%] px-4 py-4 text-[11px] font-bold text-text-dim uppercase tracking-wider border-b border-border text-center">Threat</th>
                      <th className="w-[44%] px-6 py-4 text-[11px] font-bold text-text-dim uppercase tracking-wider border-b border-border">Trigger Name (Event)</th>
                      <th className="w-[38%] px-6 py-4 text-[11px] font-bold text-text-dim uppercase tracking-wider border-b border-border">Source File Path</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-8 py-20">
                      {loading ? (
                        <div className="text-center space-y-4">
                          <div className="w-12 h-12 rounded-full border-2 border-accent border-t-transparent animate-spin mx-auto" />
                          <p className="text-sm font-mono text-text-dim">{status || 'جاري تحليل الأكواد وفك التشفيرات...'}</p>
                        </div>
                      ) : (
                        <div className="max-w-xl mx-auto text-center space-y-6">
                          <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/30 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(99,102,241,0.2)]">
                            <Database className="w-8 h-8 text-accent animate-pulse" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-white mb-2">منظومة فحص وتتبع تريقرات FiveM جاهزة</h3>
                            <p className="text-xs text-text-dim leading-relaxed">
                              اختر إحدى الطرق التالية للبدء: ارفع حزمة ريسورس ZIP كاملة، أو اختبر عينة جاهزة فوراً، أو الصق مقطع كود للفحص السريع.
                            </p>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                            <div 
                              onClick={() => fileInputRef.current?.click()}
                              onDragOver={handleDragOver}
                              onDragLeave={handleDragLeave}
                              onDrop={handleDrop}
                              className={`p-4 rounded-xl border cursor-pointer transition-all group ${
                                isDragging 
                                  ? 'bg-cyan-500/20 border-cyan-400 scale-105 shadow-[0_0_20px_rgba(6,182,212,0.3)]' 
                                  : 'bg-white/[0.02] hover:bg-accent/10 border-white/5 hover:border-accent/40'
                              }`}
                            >
                              <Zap className={`w-5 h-5 mx-auto mb-2 transition-transform group-hover:scale-110 ${isDragging ? 'text-cyan-300 animate-bounce' : 'text-accent'}`} />
                              <div className="text-xs font-bold text-white mb-1">
                                {isDragging ? 'أفلت الملف هنا' : 'رفع حزمة ZIP'}
                              </div>
                              <div className="text-[10px] text-text-dim">
                                {isDragging ? 'لبدء الفحص فوراً' : 'اسحب أو اضغط للاختيار'}
                              </div>
                            </div>

                            <div 
                              onClick={handleLoadDemo}
                              className="p-4 rounded-xl bg-white/[0.02] hover:bg-purple-500/10 border border-white/5 hover:border-purple-500/40 cursor-pointer transition-all group"
                            >
                              <Play className="w-5 h-5 text-purple-400 mx-auto mb-2 group-hover:scale-110 transition-transform fill-purple-400" />
                              <div className="text-xs font-bold text-white mb-1">عينة تجريبية واقعية</div>
                              <div className="text-[10px] text-text-dim">تحميل سكريبتات وثغرات بضغطة واحدة</div>
                            </div>

                            <div 
                              onClick={() => setIsQuickScanOpen(true)}
                              className="p-4 rounded-xl bg-white/[0.02] hover:bg-cyan-500/10 border border-white/5 hover:border-cyan-500/40 cursor-pointer transition-all group"
                            >
                              <Code2 className="w-5 h-5 text-cyan-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                              <div className="text-xs font-bold text-white mb-1">فحص كود مباشر</div>
                              <div className="text-[10px] text-text-dim">لصق مقتطف سكريبت سريع</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredData.map((event, idx) => (
                    <tr 
                      key={idx} 
                      onClick={() => setSelectedEvent(event)}
                      className={`group transition-all cursor-pointer relative ${selectedEvent === event ? 'bg-accent/10' : 'hover:bg-white/[0.03]'}`}
                    >
                      {!reversedColumns ? (
                        <>
                          <td className="px-6 py-3.5 overflow-hidden relative">
                            {selectedEvent === event && (
                              <div className="absolute right-0 top-0 bottom-0 w-1 bg-accent shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                            )}
                            <div className="text-[12px] text-text-dim font-mono truncate text-left group-hover:text-white transition-colors" dir="ltr">
                              {event.file}
                            </div>
                          </td>
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-3">
                              <span className={`w-2 h-2 rounded-full shrink-0 ${
                                event.severity === 'critical' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]' :
                                event.severity === 'high' ? 'bg-orange-500' :
                                event.type === 'webhook' ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]' :
                                event.type === 'server' ? 'bg-accent' : 
                                event.type === 'client' ? 'bg-green-400' : 'bg-purple-400'
                              }`} />
                              <div className={`text-[13px] font-mono truncate text-left ${
                                event.type === 'vulnerability' ? 'text-rose-400 font-bold' : 'text-indigo-300'
                              }`} dir="ltr">
                                {event.name}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${SEVERITY_CONFIG[event.severity].bg} ${SEVERITY_CONFIG[event.severity].color} ${SEVERITY_CONFIG[event.severity].border}`}>
                              {SEVERITY_CONFIG[event.severity].label}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <span className="inline-block px-2 py-0.5 rounded text-[11px] font-mono bg-border text-text-dim">
                              L{event.line}
                            </span>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3.5 text-center">
                            <span className="inline-block px-2 py-0.5 rounded text-[11px] font-mono bg-border text-text-dim">
                              L{event.line}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${SEVERITY_CONFIG[event.severity].bg} ${SEVERITY_CONFIG[event.severity].color} ${SEVERITY_CONFIG[event.severity].border}`}>
                              {SEVERITY_CONFIG[event.severity].label}
                            </span>
                          </td>
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-3">
                              <span className={`w-2 h-2 rounded-full shrink-0 ${
                                event.severity === 'critical' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]' :
                                event.severity === 'high' ? 'bg-orange-500' :
                                event.type === 'webhook' ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]' :
                                event.type === 'server' ? 'bg-accent' : 
                                event.type === 'client' ? 'bg-green-400' : 'bg-purple-400'
                              }`} />
                              <div className={`text-[13px] font-mono truncate text-left ${
                                event.type === 'vulnerability' ? 'text-rose-400 font-bold' : 'text-indigo-300'
                              }`} dir="ltr">
                                {event.name}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-3.5 overflow-hidden relative">
                            {selectedEvent === event && (
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                            )}
                            <div className="text-[12px] text-text-dim font-mono truncate text-left group-hover:text-white transition-colors" dir="ltr">
                              {event.file}
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Sidebar Controls */}
        <aside className={`w-80 ${sidebarPosition === 'right' ? 'border-l' : 'border-r'} border-border bg-surface flex flex-col p-6 gap-6 shrink-0 overflow-y-auto smooth-scroll`}>
          {/* Cyber Threat Level Gauge */}
          {stats && (
            <div className="p-3.5 rounded-xl bg-bg border border-border space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-text-dim tracking-wider">
                  <Shield className="w-3.5 h-3.5 text-accent" />
                  <span>مستوى الخطورة السيبرانية</span>
                </div>
                <span className={`text-[11px] font-mono font-bold ${
                  stats.obfuscationScore > 60 ? 'text-rose-400' :
                  stats.obfuscationScore > 30 ? 'text-orange-400' : 'text-emerald-400'
                }`}>
                  {stats.obfuscationScore}%
                </span>
              </div>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    stats.obfuscationScore > 60 ? 'bg-gradient-to-r from-orange-500 to-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.6)]' :
                    stats.obfuscationScore > 30 ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.max(5, stats.obfuscationScore)}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] font-mono text-text-dim/70">
                <span>مستقر</span>
                <span className="text-rose-400 font-bold">
                  {stats.criticalCount > 0 ? `${stats.criticalCount} ثغرة حرجة!` : 'آمن نسبياً'}
                </span>
              </div>
            </div>
          )}

          {/* Analysis Trigger - Local */}
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] uppercase font-black text-accent tracking-[2px]">قناة تغذية البيانات</label>
                <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
                    <div className="w-1.5 h-1.5 bg-accent/40 rounded-full" />
                </div>
            </div>
            
            <div 
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`group relative flex flex-col items-center justify-center py-8 rounded-xl cursor-pointer overflow-hidden border transition-all ${
                isDragging
                  ? 'border-cyan-400 bg-cyan-500/10 scale-[1.01] shadow-[0_0_30px_rgba(6,182,212,0.3)]'
                  : loading 
                    ? 'border-accent bg-accent/10' 
                    : 'border-white/10 hover:border-accent/40 bg-white/[0.03] hover:bg-accent/[0.03]'
              }`}
            >
              {/* Internal Corner Accents */}
              <div className="absolute top-2 left-2 w-3 h-3 border-t border-l border-accent/40 rounded-tl-sm group-hover:border-accent transition-colors" />
              <div className="absolute top-2 right-2 w-3 h-3 border-t border-r border-accent/40 rounded-tr-sm group-hover:border-accent transition-colors" />
              <div className="absolute bottom-2 left-2 w-3 h-3 border-b border-l border-accent/40 rounded-bl-sm group-hover:border-accent transition-colors" />
              <div className="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-accent/40 rounded-br-sm group-hover:border-accent transition-colors" />

              <div className={`w-12 h-12 rounded-full border border-dashed flex items-center justify-center mb-3 transition-all duration-500 ${
                isDragging 
                  ? 'border-cyan-400 bg-cyan-500/20 animate-bounce' 
                  : 'border-accent/20 group-hover:bg-accent/5 ' + (loading ? 'animate-pulse' : '')
              }`}>
                <Database className={`w-6 h-6 ${isDragging ? 'text-cyan-300' : loading ? 'text-accent' : 'text-text-dim group-hover:text-accent'} transition-colors`} />
              </div>

              <div className="text-center px-4 relative z-10 w-full max-w-[240px]">
                <p className="text-[11px] font-black text-white uppercase tracking-wider mb-1">
                  {isDragging ? 'أفلت ملف ZIP هنا الآن' : loading ? 'جاري فحص الحزمة...' : 'إدراج حزمة ZIP'}
                </p>
                <p className="text-[9px] font-mono text-text-dim">
                  {isDragging ? 'سيتم الفحص فور الإفلات' : loading ? 'قراءة وتحليل السكريبتات...' : 'اسحب الأرشيف أو اضغط للتصفح'}
                </p>

                {scanProgress && (
                  <div className="mt-3 w-full">
                    <div className="flex justify-between text-[8px] font-mono text-cyan-300 mb-1">
                      <span className="truncate max-w-[140px] text-right">{scanProgress.fileName}</span>
                      <span>{scanProgress.current}/{scanProgress.total}</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-cyan-400 transition-all duration-200"
                        style={{ width: `${Math.round((scanProgress.current / scanProgress.total) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button 
              disabled={loading}
              onClick={() => fileInputRef.current?.click()}
              className={`group relative w-full h-12 overflow-hidden rounded-xl bg-accent hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(99,102,241,0.2)] hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] border border-white/10`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              
              <div className="relative flex items-center justify-center gap-2">
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <Zap className="w-4 h-4 text-white animate-pulse" />
                )}
                <span className="text-[11px] font-black tracking-[2px] text-white uppercase italic drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
                  {loading ? 'جاري الفحص...' : 'فحص الحزمة الكاملة'}
                </span>
              </div>
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".zip" />
          </div>

          {/* Quick Action Hub */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-text-dim tracking-wider">أدوات الفك والتحليل السريع</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setIsQuickScanOpen(true)}
                className="flex items-center gap-1.5 p-2 rounded-lg bg-white/[0.02] hover:bg-cyan-500/10 border border-white/5 hover:border-cyan-500/30 text-[10px] font-bold text-text-dim hover:text-cyan-300 transition-all text-right"
              >
                <Code2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>فحص كود سريع</span>
              </button>

              <button
                onClick={() => setIsDeobfuscatorOpen(true)}
                className="flex items-center gap-1.5 p-2 rounded-lg bg-white/[0.02] hover:bg-purple-500/10 border border-white/5 hover:border-purple-500/30 text-[10px] font-bold text-text-dim hover:text-purple-300 transition-all text-right"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span>فك التشفير</span>
              </button>
            </div>
          </div>

          {/* Filtering */}
          <div className="space-y-3">
            <label className="text-[10px] uppercase font-bold text-text-dim tracking-wider">فلترة وتصفية النتائج</label>
            <div className="relative group">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim group-focus-within:text-accent transition-colors" />
              <input 
                type="text" 
                placeholder="ابحث عن تريقر أو مسار..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/5 rounded-lg py-2.5 px-9 text-xs text-white focus:outline-none focus:border-accent/50 focus:bg-accent/[0.02] transition-all pl-3 text-right placeholder:text-text-dim/50"
              />
            </div>
            
            {/* Type Filters */}
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'all', label: 'الكل' },
                { id: 'server', label: 'Server' },
                { id: 'client', label: 'Client' },
                { id: 'local', label: 'Trigger' },
                { id: 'register', label: 'Net' },
                { id: 'vulnerability', label: 'Risk' },
                { id: 'webhook', label: 'Discord' },
              ].map(type => (
                <button
                  key={type.id}
                  onClick={() => setFilterType(type.id)}
                  className={`group relative py-2 rounded text-[9px] font-bold uppercase transition-all border ${
                    filterType === type.id 
                      ? 'bg-accent/20 border-accent text-white shadow-[0_0_10px_rgba(99,102,241,0.2)]' 
                      : 'bg-white/[0.02] border-white/5 text-text-dim hover:border-accent/30 hover:text-white'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>

            {/* Severity Filter */}
            <div className="pt-1">
              <label className="text-[9px] uppercase font-bold text-text-dim/70 tracking-wider mb-1.5 block">مستوى الخطورة</label>
              <div className="grid grid-cols-4 gap-1">
                {[
                  { id: 'all', label: 'الكل' },
                  { id: 'critical', label: 'حرجة 🚨' },
                  { id: 'high', label: 'عالية' },
                  { id: 'medium', label: 'متوسطة' },
                ].map(sev => (
                  <button
                    key={sev.id}
                    onClick={() => setSeverityFilter(sev.id)}
                    className={`py-1.5 rounded text-[8px] font-bold uppercase transition-all border ${
                      severityFilter === sev.id
                        ? 'bg-rose-500/20 border-rose-500/50 text-white'
                        : 'bg-white/[0.02] border-white/5 text-text-dim hover:text-white'
                    }`}
                  >
                    {sev.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Statistics & Severity Distribution Chart */}
          <div className="space-y-3 pt-2 border-t border-border">
            <SeverityPieChart
              criticalCount={stats?.criticalCount || 0}
              highCount={stats?.highCount || 0}
              mediumCount={stats?.mediumCount || 0}
              lowCount={stats?.lowCount || 0}
              activeSeverity={severityFilter}
              onSelectSeverity={(sev) => setSeverityFilter(sev)}
            />

            <label className="text-[10px] uppercase font-bold text-text-dim tracking-wider">تحليلات السيرفر المباشرة</label>
            <div className="bg-bg border border-border rounded-xl p-3.5 divide-y divide-border/60">
              {[
                { label: 'ملفات Lua المفحوصة', value: stats?.luaFiles || 0, color: 'text-text-dim' },
                { label: 'تريقرات Server Event', value: stats?.serverEvents || 0, color: 'text-accent' },
                { label: 'تريقرات Client Event', value: stats?.clientEvents || 0, color: 'text-emerald-400' },
                { label: 'تريقرات TriggerEvent', value: stats?.localEvents || 0, color: 'text-purple-400' },
                { label: 'تهديدات أمنية محتملة', value: stats?.vulnerabilities || 0, color: 'text-rose-500 font-bold' },
                { label: 'روابط Webhooks سرية', value: stats?.webhooks || 0, color: 'text-indigo-400' },
                { label: 'النتائج المطابقة للفلتر', value: filteredData.length, color: 'text-emerald-400 font-bold' },
              ].map((stat, i) => (
                <div key={i} className="flex justify-between py-2 first:pt-0 last:pb-0 text-xs">
                  <span className="font-medium text-text-dim">{stat.label}</span>
                  <span className={`font-mono font-bold ${stat.color}`} dir="ltr">{stat.value.toLocaleString()}</span>
                </div>
              ))}
            </div>

            {/* Advanced Security Modules Quick Access */}
            <div className="bg-bg border border-border rounded-xl p-3 space-y-2">
              <label className="text-[10px] uppercase font-bold text-accent tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>أدوات الفحص والتحصين المتقدمة</span>
              </label>

              <div className="grid grid-cols-1 gap-1.5">
                <button
                  onClick={() => setIsInjectorOpen(true)}
                  className="w-full flex items-center justify-between p-2 rounded-lg bg-white/[0.02] hover:bg-cyan-500/10 border border-white/5 hover:border-cyan-500/30 text-xs transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Crosshair className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
                    <span className="text-white font-medium">محاكي التريقرات والبايلود</span>
                  </div>
                  <span className="text-[10px] text-cyan-400 font-mono">Test</span>
                </button>

                <button
                  onClick={() => setIsPatchOpen(true)}
                  className="w-full flex items-center justify-between p-2 rounded-lg bg-white/[0.02] hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-500/30 text-xs transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Wrench className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                    <span className="text-white font-medium">مولد ترقيعات الحماية</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-mono">Fix</span>
                </button>

                <button
                  onClick={() => setIsBytecodeOpen(true)}
                  className="w-full flex items-center justify-between p-2 rounded-lg bg-white/[0.02] hover:bg-purple-500/10 border border-white/5 hover:border-purple-500/30 text-xs transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Cpu className="w-3.5 h-3.5 text-purple-400 group-hover:scale-110 transition-transform" />
                    <span className="text-white font-medium">محلل ومفرغ Bytecode</span>
                  </div>
                  <span className="text-[10px] text-purple-400 font-mono">Dump</span>
                </button>

                <button
                  onClick={() => setIsDiffOpen(true)}
                  className="w-full flex items-center justify-between p-2 rounded-lg bg-white/[0.02] hover:bg-accent/15 border border-white/5 hover:border-accent/40 text-xs transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <GitCompare className="w-3.5 h-3.5 text-accent group-hover:scale-110 transition-transform" />
                    <span className="text-white font-medium">أداة مقارنة السكريبتات</span>
                  </div>
                  <span className="text-[10px] text-accent font-mono">Diff</span>
                </button>

                <button
                  onClick={() => setIsProtectionOpen(true)}
                  className="w-full flex items-center justify-between p-2 rounded-lg bg-emerald-500/[0.05] hover:bg-emerald-500/15 border border-emerald-500/20 hover:border-emerald-500/40 text-xs transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                    <span className="text-emerald-300 font-medium">درع الحماية وتشفير الموقع</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-mono">Lock</span>
                </button>

                <button
                  onClick={() => setIsWebhookTesterOpen(true)}
                  className="w-full flex items-center justify-between p-2 rounded-lg bg-indigo-500/[0.05] hover:bg-indigo-500/15 border border-indigo-500/20 hover:border-indigo-500/40 text-xs transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Radio className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
                    <span className="text-white font-medium">فاحص الـ Webhooks المباشر</span>
                  </div>
                  <span className="text-[10px] text-indigo-400 font-mono">Ping</span>
                </button>

                <button
                  onClick={() => setIsBackdoorOpen(true)}
                  className="w-full flex items-center justify-between p-2 rounded-lg bg-rose-500/[0.05] hover:bg-rose-500/15 border border-rose-500/20 hover:border-rose-500/40 text-xs transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Flame className="w-3.5 h-3.5 text-rose-400 group-hover:scale-110 transition-transform" />
                    <span className="text-white font-medium">صائد الأبواب الخلفية (Backdoors)</span>
                  </div>
                  <span className="text-[10px] text-rose-400 font-mono">Hunt</span>
                </button>

                <button
                  onClick={() => setIsACRulesOpen(true)}
                  className="w-full flex items-center justify-between p-2 rounded-lg bg-amber-500/[0.05] hover:bg-amber-500/15 border border-amber-500/20 hover:border-amber-500/40 text-xs transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                    <span className="text-white font-medium">مولد قواعد الأنتيشيت (Rules)</span>
                  </div>
                  <span className="text-[10px] text-amber-400 font-mono">AC</span>
                </button>

                <button
                  onClick={() => setIsResmonOpen(true)}
                  className="w-full flex items-center justify-between p-2 rounded-lg bg-cyan-500/[0.05] hover:bg-cyan-500/15 border border-cyan-500/20 hover:border-cyan-500/40 text-xs transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Gauge className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
                    <span className="text-white font-medium">محلل أداء السكريبت والـ Resmon</span>
                  </div>
                  <span className="text-[10px] text-cyan-400 font-mono">FPS</span>
                </button>
              </div>
            </div>

            {/* Discord Webhooks Live Status Card in Sidebar */}
            <div className="bg-bg border border-indigo-500/30 rounded-xl p-3 space-y-2.5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
                  <Radio className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                  <span>فاحص نشاط Webhooks</span>
                </div>
                <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
                  {discoveredWebhooks.length} مكتشف
                </span>
              </div>

              <p className="text-[11px] text-text-dim leading-relaxed">
                اختبار الاتصال المباشر مع خوادم Discord للتحقق الفوري من حالة الروابط المسربة (Active / Dead).
              </p>

              {discoveredWebhooks.length > 0 && (
                <div className="p-2 rounded-lg bg-black/30 border border-white/5 space-y-1 text-[11px]">
                  <div className="flex items-center justify-between text-text-dim">
                    <span>روابط تم رصدها بالملفات:</span>
                    <span className="font-mono text-white font-bold">{discoveredWebhooks.length}</span>
                  </div>
                  <div className="truncate font-mono text-[10px] text-indigo-300/80" dir="ltr">
                    {discoveredWebhooks[0].name.startsWith('http') ? discoveredWebhooks[0].name : discoveredWebhooks[0].context}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <button
                  onClick={() => setIsWebhookTesterOpen(true)}
                  className="py-1.5 px-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 hover:border-indigo-500/60 text-indigo-300 hover:text-white text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  title="فحص الاتصال والتأكد من نشاط الويب هوك"
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>فحص الاتصال</span>
                </button>

                <button
                  onClick={() => setIsWebhookTesterOpen(true)}
                  className="py-1.5 px-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-indigo-500/20"
                  title="تحويل وإرسال رسائل اللوق المخصصة وتحديد سبب الإرسال والعدد"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>تحويل اللوق</span>
                </button>
              </div>
            </div>

            {/* Server Logos Quick Gallery Card */}
            {stats?.serverLogos && stats.serverLogos.length > 0 && (
              <div className="bg-bg border border-amber-500/30 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                    <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                    <span>لوقوهات السيرفر ({stats.serverLogos.length})</span>
                  </div>
                  <button 
                    onClick={() => setIsLogosModalOpen(true)}
                    className="text-[10px] text-amber-400 hover:underline font-bold cursor-pointer"
                  >
                    عرض الكل
                  </button>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto py-1">
                  {stats.serverLogos.slice(0, 4).map((logo) => (
                    <div 
                      key={logo.id} 
                      onClick={() => setIsLogosModalOpen(true)}
                      className="w-14 h-14 rounded-lg bg-black/50 border border-border hover:border-amber-400/60 p-1 shrink-0 flex items-center justify-center cursor-pointer transition-all hover:scale-105"
                      title={logo.fileName}
                    >
                      <img 
                        src={logo.dataUrl} 
                        alt={logo.fileName} 
                        className="max-h-full max-w-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setIsLogosModalOpen(true)}
                  className="w-full py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تحميل جميع لوقوهات السيرفر</span>
                </button>
              </div>
            )}

            {/* Detected Protection Card */}
            {stats?.detectedProtections && stats.detectedProtections.length > 0 && (
              <div className="bg-bg border border-emerald-500/30 rounded-xl p-3 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>اسم الحماية والأنتيشيت المكتشف</span>
                </div>

                <div className="space-y-1.5">
                  {stats.detectedProtections.map((prot, idx) => (
                    <div key={idx} className="p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white font-mono">{prot.name}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                          {prot.type}
                        </span>
                      </div>
                      <p className="text-[10px] text-text-dim mt-1 line-clamp-2">
                        {prot.description}
                      </p>
                      {prot.vendor && (
                        <div className="text-[9px] text-emerald-400/80 mt-1 font-mono">
                          المطور/المصدر: {prot.vendor}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>
      </main>

      {/* Footer Status */}
      <footer className="px-6 py-3 bg-surface border-t border-border flex justify-between items-center shrink-0 z-20">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-3 text-[10px] font-bold text-text-dim tracking-widest uppercase">
            <span className="flex items-center gap-1.5">
              <ArrowRight className="w-3 h-3 text-accent" />
              Scanner Status: <span className="text-white font-mono">{status || 'Ready for Input'}</span>
            </span>
          </div>
          <p className="text-[10px] text-text-dim font-medium">
            جميع الحقوق محفوظة © | <span className="text-accent font-bold">الزعابي</span>
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-[10px] font-mono text-text-dim">
            PROTOCOL: AIS-SECURITY-v4.5
          </div>
          <a 
            href="https://discord.gg/uuuu" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 px-2 py-1 rounded bg-indigo-500/10 border border-indigo-500/20"
          >
            <Users className="w-3 h-3" />
            discord.gg/uuuu
          </a>
        </div>
      </footer>

      {/* Code Inspector Overlay */}
      {selectedEvent && (
        <div 
          onClick={() => setSelectedEvent(null)}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 animate-modal-backdrop"
        >
          <div 
            onClick={e => e.stopPropagation()}
            className="w-full max-w-2xl bg-surface border border-border rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-modal-content"
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-border flex justify-between items-center bg-white/[0.01]">
              <div className="space-y-1 min-w-0 flex-1 pl-4">
                <div className="flex items-center gap-2">
                  <h3 className={`font-bold text-base font-mono truncate ${selectedEvent.type === 'vulnerability' ? 'text-rose-400' : 'text-white'}`} dir="ltr">
                    {selectedEvent.name}
                  </h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${SEVERITY_CONFIG[selectedEvent.severity].bg} ${SEVERITY_CONFIG[selectedEvent.severity].color} ${SEVERITY_CONFIG[selectedEvent.severity].border}`}>
                    {SEVERITY_CONFIG[selectedEvent.severity].label}
                  </span>
                </div>
                <p className="text-xs text-text-dim truncate font-mono" dir="ltr">{selectedEvent.file} : L{selectedEvent.line}</p>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={handlePrevEvent}
                  disabled={currentIndex <= 0}
                  className="p-1.5 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 text-text-dim hover:text-white transition-colors"
                  title="الحدث السابق"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button 
                  onClick={handleNextEvent}
                  disabled={currentIndex >= filteredData.length - 1}
                  className="p-1.5 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 text-text-dim hover:text-white transition-colors"
                  title="الحدث التالي"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={() => setSelectedEvent(null)} className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-text-dim hover:text-white">
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4 overflow-y-auto">
              {selectedEvent.description && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                  <p className="text-[10px] text-rose-400 font-bold uppercase tracking-widest mb-1 flex items-center gap-2">
                     <Shield className="w-3 h-3" /> تقرير الفحص الأمني
                  </p>
                  <p className="text-xs text-rose-300 font-medium leading-relaxed">{selectedEvent.description}</p>
                </div>
              )}

              {/* Code Context */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase font-bold text-text-dim tracking-widest">موضع الكود في الملف (L{selectedEvent.line})</label>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleCopyField('name', selectedEvent.name)}
                      className="px-2 py-1 rounded text-[10px] font-bold text-text-dim hover:text-accent hover:bg-white/5 transition-all"
                    >
                      {copiedName ? 'تم نسخ الاسم!' : 'نسخ اسم التريقر فقط'}
                    </button>
                    <button 
                      onClick={() => handleCopy(selectedEvent.context)}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold transition-all ${
                        copied ? 'text-emerald-400 bg-emerald-400/10' : 'text-text-dim hover:text-accent hover:bg-white/5'
                      }`}
                    >
                      {copied ? <><Check className="w-3 h-3" /> تم النسخ!</> : <><Copy className="w-3 h-3" /> نسخ الكود</>}
                    </button>
                  </div>
                </div>
                <div 
                  id="code-context"
                  className="group relative bg-bg rounded-xl border border-border p-4 font-mono text-xs text-indigo-300/90 whitespace-pre overflow-x-auto select-text cursor-text" 
                  dir="ltr"
                >
                  {selectedEvent.context}
                </div>
              </div>

              {/* Simulation Trigger Payload */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase font-bold text-text-dim tracking-widest">صيغة استدعاء التريقر (Trigger Payload)</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsInjectorOpen(true)}
                      className="flex items-center gap-1 text-[10px] text-cyan-400 hover:underline font-mono"
                    >
                      <Crosshair className="w-3 h-3" />
                      فتح في محاكي التريقرات
                    </button>
                    <button 
                      onClick={() => handleCopyField('payload', getPayloadSnippet(selectedEvent))}
                      className="flex items-center gap-1 text-[10px] text-accent hover:underline font-mono"
                    >
                      {copiedPayload ? 'تم النسخ!' : 'نسخ الصيغة'}
                    </button>
                  </div>
                </div>
                <pre className="p-3 bg-bg rounded-lg border border-border font-mono text-xs text-emerald-400 overflow-x-auto" dir="ltr">
                  {getPayloadSnippet(selectedEvent)}
                </pre>
              </div>

              {/* Security Fix Recommendation */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase font-bold text-text-dim tracking-widest">الحماية والحل البرمجي المقترح (Security Patch)</label>
                  <button
                    onClick={() => setIsPatchOpen(true)}
                    className="flex items-center gap-1 text-[10px] text-emerald-400 hover:underline font-mono"
                  >
                    <Wrench className="w-3 h-3" />
                    توليد درع حماية متكامل
                  </button>
                </div>
                <pre className="p-3 bg-bg rounded-lg border border-border font-mono text-xs text-amber-300/90 overflow-x-auto leading-relaxed" dir="ltr">
                  {getFixSnippet(selectedEvent)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Functional Lab & Scanning Modals */}
      <DeobfuscatorModal 
        isOpen={isDeobfuscatorOpen}
        onClose={() => setIsDeobfuscatorOpen(false)}
        onImportEvents={handleDeobfuscatorImport}
      />

      <QuickScanModal
        isOpen={isQuickScanOpen}
        onClose={() => setIsQuickScanOpen(false)}
        onResultsReady={handleQuickScanResults}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        events={data}
        stats={stats}
        onOpenLogosModal={() => {
          setIsExportOpen(false);
          setIsLogosModalOpen(true);
        }}
      />

      <ServerLogosModal
        isOpen={isLogosModalOpen}
        onClose={() => setIsLogosModalOpen(false)}
        logos={stats?.serverLogos || []}
      />

      <PayloadInjectorModal
        isOpen={isInjectorOpen}
        onClose={() => setIsInjectorOpen(false)}
        selectedEvent={selectedEvent}
        allEvents={data}
      />

      <PatchGeneratorModal
        isOpen={isPatchOpen}
        onClose={() => setIsPatchOpen(false)}
        events={data}
      />

      <BytecodeInspectorModal
        isOpen={isBytecodeOpen}
        onClose={() => setIsBytecodeOpen(false)}
      />

      <ScriptDiffModal
        isOpen={isDiffOpen}
        onClose={() => setIsDiffOpen(false)}
      />

      <SiteProtectionShieldModal
        isOpen={isProtectionOpen}
        onClose={() => setIsProtectionOpen(false)}
      />

      <DiscordWebhookTesterModal
        isOpen={isWebhookTesterOpen}
        onClose={() => setIsWebhookTesterOpen(false)}
        discoveredEvents={data}
      />

      <AntiCheatRulesModal
        isOpen={isACRulesOpen}
        onClose={() => setIsACRulesOpen(false)}
        events={data}
      />

      <BackdoorHunterModal
        isOpen={isBackdoorOpen}
        onClose={() => setIsBackdoorOpen(false)}
        events={data}
      />

      <ResmonOptimizerModal
        isOpen={isResmonOpen}
        onClose={() => setIsResmonOpen(false)}
        events={data}
      />

      <AIAssistantModal
        isOpen={isAIAssistantOpen}
        onClose={() => setIsAIAssistantOpen(false)}
        onOpenQuickScan={() => setIsQuickScanOpen(true)}
        onOpenDeobfuscator={() => setIsDeobfuscatorOpen(true)}
        onOpenBackdoorHunter={() => setIsBackdoorOpen(true)}
      />

      <AIAssistantFloatingButton
        onClick={() => setIsAIAssistantOpen(true)}
        isOpen={isAIAssistantOpen}
      />

      <SecurityAlertToast />

      {/* Game Frame Shell Overlay */}
      <div className="fixed inset-0 pointer-events-none z-[100] select-none">
        {/* Subtle Scanlines */}
        <div className="absolute inset-0 crt-scanlines opacity-[0.06] will-change-transform" />
        
        {/* Main Precision Frame */}
        <div className="absolute inset-0 p-2">
          <div className="w-full h-full border border-accent/10 relative">
            {/* Ultra-Precise HUD Corners - Crosshair Style */}
            <div className="absolute -top-[1px] -left-[1px] w-8 h-8 flex">
              <div className="w-[3px] h-full bg-accent shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
              <div className="w-full h-[3px] bg-accent shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
            </div>
            <div className="absolute -top-[1px] -right-[1px] w-8 h-8 flex justify-end">
              <div className="w-full h-[3px] bg-accent shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
              <div className="w-[3px] h-full bg-accent shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
            </div>
            <div className="absolute -bottom-[1px] -left-[1px] w-8 h-8 flex flex-col justify-end">
              <div className="w-[3px] h-full bg-accent shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
              <div className="w-full h-[3px] bg-accent shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
            </div>
            <div className="absolute -bottom-[1px] -right-[1px] w-8 h-8 flex flex-col items-end justify-end">
              <div className="w-full h-[3px] bg-accent shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
              <div className="w-[3px] h-full bg-accent shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
            </div>

            {/* Diagnostic Side Scales */}
            <div className="absolute left-1 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 opacity-40">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className={`w-3 h-0.5 bg-accent ${i % 3 === 0 ? 'w-5 opacity-100' : ''}`} />
                ))}
            </div>
            <div className="absolute right-1 top-1/2 -translate-y-1/2 flex flex-col items-end gap-1.5 opacity-40">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className={`w-3 h-0.5 bg-accent ${i % 3 === 0 ? 'w-5 opacity-100' : ''}`} />
                ))}
            </div>

            {/* Top Calibration Bar */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 flex items-center gap-4 px-4 py-1 bg-bg border-x border-b border-accent/20 rounded-b-md">
                <span className="text-[7px] font-black text-accent tracking-[3px] uppercase">Terminal_Sync: Stable</span>
                <div className="w-16 h-[2px] bg-accent/10 rounded-full overflow-hidden">
                    <div className="h-full w-full bg-accent animate-scan-horizontal" />
                </div>
            </div>

            {/* Bottom Tech Decal */}
            <div className="absolute bottom-1 left-4 flex items-center gap-6">
                 <div className="flex gap-1.5">
                    {[1, 2, 3].map(i => <div key={i} className="w-1 h-3 bg-accent/20 skew-x-[-20deg]" />)}
                 </div>
                 <span className="text-[6px] font-mono text-text-dim uppercase tracking-[2px]">Alzaabia_Extraction_Engine_v4.0.9</span>
            </div>

            <div className="absolute bottom-1 right-4 flex items-center gap-4 text-[6px] font-mono text-accent/60 uppercase">
                <span>Coordinates: [54.37 / 24.45]</span>
                <div className="w-2 h-2 rounded-full border border-accent/40 flex items-center justify-center">
                    <div className="w-1 h-1 bg-accent rounded-full animate-pulse" />
                </div>
            </div>
          </div>
        </div>

        {/* Floating ID Tag */}
        <div className="absolute top-4 left-10 bg-accent text-[8px] font-black text-bg px-2 py-0.5 rounded shadow-lg">
          SEC-ID: 883-X
        </div>
      </div>
    </div>
  );
}

