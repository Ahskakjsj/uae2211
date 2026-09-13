import React, { useState, useMemo, useRef } from 'react';
import { 
  X, 
  GitCompare, 
  Upload, 
  FileCode, 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  Check, 
  Copy, 
  ArrowRightLeft, 
  Columns, 
  List, 
  Search, 
  Sparkles,
  ChevronRight,
  Shield,
  FileText,
  Layers,
  Wrench,
  CheckCircle2,
  XCircle,
  HelpCircle
} from 'lucide-react';

interface ScriptDiffModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TriggerInfo {
  name: string;
  type: 'server' | 'client' | 'command' | 'local';
  line: number;
  hasSourceCheck: boolean;
  hasAceCheck: boolean;
  hasRateLimit: boolean;
  hasSanitization: boolean;
  rawLine: string;
}

interface DiffLine {
  type: 'unchanged' | 'added' | 'removed' | 'modified_trigger';
  oldLineNumber?: number;
  newLineNumber?: number;
  oldContent?: string;
  newContent?: string;
  triggerNote?: string;
}

// Demo Presets for instantaneous testing
const DEMO_PRESETS = {
  banking: {
    name: '💰 ثغرة تحويل أموال البنك (Unprotected Bank vs Alzaabi Guard)',
    fileA: `RegisterServerEvent("qb-banking:server:deposit")
AddEventHandler("qb-banking:server:deposit", function(amount)
    local xPlayer = ESX.GetPlayerFromId(source)
    -- VULNERABLE: No source check, No amount range check
    xPlayer.addAccountMoney('bank', tonumber(amount))
    TriggerClientEvent('esx:showNotification', source, "Deposited: " .. amount)
end)

RegisterServerEvent("qb-banking:server:giveCash")
AddEventHandler("qb-banking:server:giveCash", function(target, amount)
    -- VULNERABLE: Exploiters can give infinite money
    local targetPlayer = ESX.GetPlayerFromId(target)
    targetPlayer.addMoney(amount)
end)`,
    fileB: `-- [Alzaabi Security Hardened Version]
local _BankCooldown = {}

RegisterNetEvent("qb-banking:server:deposit", function(amount)
    local src = source
    -- SECURED: Source presence verification
    if not src or src <= 0 then return end

    -- SECURED: Anti-Spam Rate Limiting (3 seconds)
    local now = os.time()
    if _BankCooldown[src] and (now - _BankCooldown[src]) < 3 then
        TriggerClientEvent('esx:showNotification', src, "يرجى الانتظار بين العمليات!")
        return
    end
    _BankCooldown[src] = now

    -- SECURED: Sanitization & NaN prevention
    amount = tonumber(amount)
    if not amount or amount ~= amount or amount <= 0 or amount > 1000000 then
        DropPlayer(src, "Alzaabi Security: Attempted Banking NaN Exploit")
        return
    end

    local xPlayer = ESX.GetPlayerFromId(src)
    xPlayer.addAccountMoney('bank', amount)
    TriggerClientEvent('esx:showNotification', src, "تم إيداع: " .. amount)
end)

RegisterNetEvent("qb-banking:server:giveCash", function(target, amount)
    local src = source
    if not src or src <= 0 then return end
    
    -- SECURED: ACE Permission Protection for administrative transactions
    if not IsPlayerAceAllowed(src, "command.givecash") then
        DropPlayer(src, "Unauthorized admin trigger invocation")
        return
    end

    amount = tonumber(amount)
    if not amount or amount <= 0 then return end

    local targetPlayer = ESX.GetPlayerFromId(target)
    if targetPlayer then
        targetPlayer.addMoney(amount)
    end
end)`
  },
  revive: {
    name: '🩺 ثغرة الإنعاش وتخطي الموت (Admin Revive vs Verified Hook)',
    fileA: `RegisterServerEvent("esx_ambulancejob:revive")
AddEventHandler("esx_ambulancejob:revive", function(targetPlayer)
    -- VULNERABLE: Anyone can revive themselves or anyone remotely
    TriggerClientEvent('esx_ambulancejob:revive', targetPlayer)
end)`,
    fileB: `RegisterNetEvent("esx_ambulancejob:revive", function(targetPlayer)
    local src = source
    if not src or src <= 0 then return end

    local xPlayer = ESX.GetPlayerFromId(src)
    -- SECURED: Strictly verify job and admin status
    if xPlayer.job.name ~= 'ambulance' and not IsPlayerAceAllowed(src, "admin.revive") then
        print(string.format("^1[EXPLOIT BLOCKED]^7 Unauthorized revive by %s", GetPlayerName(src)))
        DropPlayer(src, "Security Shield: Unauthorized revive attempt")
        return
    end

    targetPlayer = tonumber(targetPlayer) or src
    TriggerClientEvent('esx_ambulancejob:revive', targetPlayer)
end)`
  }
};

export const ScriptDiffModal: React.FC<ScriptDiffModalProps> = ({
  isOpen,
  onClose
}) => {
  const [contentA, setContentA] = useState<string>(DEMO_PRESETS.banking.fileA);
  const [contentB, setContentB] = useState<string>(DEMO_PRESETS.banking.fileB);
  const [nameA, setNameA] = useState<string>('server_v1_vulnerable.lua');
  const [nameB, setNameB] = useState<string>('server_v2_secured.lua');
  const [viewMode, setViewMode] = useState<'split' | 'unified'>('split');
  const [filterMode, setFilterMode] = useState<'all' | 'changes' | 'triggers'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedDiff, setCopiedDiff] = useState(false);

  const fileInputRefA = useRef<HTMLInputElement | null>(null);
  const fileInputRefB = useRef<HTMLInputElement | null>(null);

  // Extract triggers and security characteristics from code
  const extractTriggers = (code: string): TriggerInfo[] => {
    const lines = code.split('\n');
    const triggers: TriggerInfo[] = [];

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('--')) return;

      const serverMatch = trimmed.match(/Register(?:Server)?Event\s*\(\s*["']([^"']+)["']/i);
      const clientMatch = trimmed.match(/RegisterNetEvent\s*\(\s*["']([^"']+)["']/i);
      const commandMatch = trimmed.match(/RegisterCommand\s*\(\s*["']([^"']+)["']/i);
      const handlerMatch = trimmed.match(/AddEventHandler\s*\(\s*["']([^"']+)["']/i);

      const eventName = serverMatch?.[1] || clientMatch?.[1] || commandMatch?.[1] || handlerMatch?.[1];

      if (eventName) {
        // Look ahead in subsequent 35 lines for security checks
        const contextLines = lines.slice(index, Math.min(lines.length, index + 35)).join('\n');
        
        const hasSourceCheck = /if\s+(?:not\s+src|src\s*<=?\s*0|source\s*<=?\s*0|not\s+source)/i.test(contextLines);
        const hasAceCheck = /IsPlayerAceAllowed|IsPlayerAdmin|CheckPermission/i.test(contextLines);
        const hasRateLimit = /cooldown|now\s*-\s*last|_BankCooldown|os\.time/i.test(contextLines);
        const hasSanitization = /tonumber|amount\s*~=\s*amount|string\.find|math\.abs/i.test(contextLines);

        let type: TriggerInfo['type'] = 'server';
        if (commandMatch) type = 'command';
        else if (clientMatch) type = 'client';

        triggers.push({
          name: eventName,
          type,
          line: index + 1,
          hasSourceCheck,
          hasAceCheck,
          hasRateLimit,
          hasSanitization,
          rawLine: trimmed
        });
      }
    });

    return triggers;
  };

  const triggersA = useMemo(() => extractTriggers(contentA), [contentA]);
  const triggersB = useMemo(() => extractTriggers(contentB), [contentB]);

  // Compute trigger-level differences
  const triggerComparison = useMemo(() => {
    const mapA = new Map<string, TriggerInfo>();
    triggersA.forEach(t => mapA.set(t.name, t));

    const mapB = new Map<string, TriggerInfo>();
    triggersB.forEach(t => mapB.set(t.name, t));

    const addedTriggers: TriggerInfo[] = [];
    const removedTriggers: TriggerInfo[] = [];
    const hardenedTriggers: { old: TriggerInfo; new: TriggerInfo; improvements: string[] }[] = [];
    const unchangedTriggers: TriggerInfo[] = [];

    // Check B against A
    triggersB.forEach(tB => {
      const tA = mapA.get(tB.name);
      if (!tA) {
        addedTriggers.push(tB);
      } else {
        const improvements: string[] = [];
        if (!tA.hasSourceCheck && tB.hasSourceCheck) improvements.push('إضافة التحقق من المصدر (Source Check)');
        if (!tA.hasAceCheck && tB.hasAceCheck) improvements.push('حماية بصلاحيات الأدمن (ACE Permissions)');
        if (!tA.hasRateLimit && tB.hasRateLimit) improvements.push('إضافة مانع سبام وتكرار (Rate Limiting)');
        if (!tA.hasSanitization && tB.hasSanitization) improvements.push('تنقية المعاملات والأموال (Input Sanitization)');

        if (improvements.length > 0) {
          hardenedTriggers.push({ old: tA, new: tB, improvements });
        } else {
          unchangedTriggers.push(tB);
        }
      }
    });

    // Check A against B for removed
    triggersA.forEach(tA => {
      if (!mapB.has(tA.name)) {
        removedTriggers.push(tA);
      }
    });

    // Security stats
    const vulnerableA = triggersA.filter(t => !t.hasSourceCheck && !t.hasAceCheck).length;
    const vulnerableB = triggersB.filter(t => !t.hasSourceCheck && !t.hasAceCheck).length;

    return {
      added: addedTriggers,
      removed: removedTriggers,
      hardened: hardenedTriggers,
      unchanged: unchangedTriggers,
      vulnerableA,
      vulnerableB
    };
  }, [triggersA, triggersB]);

  // Generate line-by-line Diff
  const diffLines = useMemo(() => {
    const linesA = contentA.split('\n');
    const linesB = contentB.split('\n');
    const result: DiffLine[] = [];

    // Simple yet effective LCS / aligned diff for scripts
    let i = 0;
    let j = 0;

    while (i < linesA.length || j < linesB.length) {
      const a = linesA[i];
      const b = linesB[j];

      if (i < linesA.length && j < linesB.length && a === b) {
        result.push({
          type: 'unchanged',
          oldLineNumber: i + 1,
          newLineNumber: j + 1,
          oldContent: a,
          newContent: b
        });
        i++;
        j++;
      } else if (j < linesB.length && (!linesA.slice(i, i + 5).includes(b) || i >= linesA.length)) {
        // Line added in B
        const isTriggerRelated = /Register(?:Net|Server)?Event|source|IsPlayerAceAllowed|DropPlayer|cooldown|AddEventHandler/i.test(b);
        result.push({
          type: isTriggerRelated ? 'modified_trigger' : 'added',
          newLineNumber: j + 1,
          newContent: b,
          triggerNote: isTriggerRelated ? 'تعديل / تحصين التريقر' : undefined
        });
        j++;
      } else if (i < linesA.length && (!linesB.slice(j, j + 5).includes(a) || j >= linesB.length)) {
        // Line removed from A
        result.push({
          type: 'removed',
          oldLineNumber: i + 1,
          oldContent: a
        });
        i++;
      } else {
        // Substitute / modify
        result.push({
          type: 'removed',
          oldLineNumber: i + 1,
          oldContent: a
        });
        result.push({
          type: 'added',
          newLineNumber: j + 1,
          newContent: b
        });
        i++;
        j++;
      }
    }

    return result;
  }, [contentA, contentB]);

  // Filtered diff
  const filteredDiff = useMemo(() => {
    return diffLines.filter(line => {
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesOld = line.oldContent?.toLowerCase().includes(query);
        const matchesNew = line.newContent?.toLowerCase().includes(query);
        if (!matchesOld && !matchesNew) return false;
      }

      // View mode filter
      if (filterMode === 'changes') {
        return line.type !== 'unchanged';
      }
      if (filterMode === 'triggers') {
        const text = (line.oldContent || '') + (line.newContent || '');
        return /Register(?:Net|Server)?Event|source|IsPlayerAceAllowed|DropPlayer|cooldown|AddEventHandler/i.test(text);
      }

      return true;
    });
  }, [diffLines, filterMode, searchQuery]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'A' | 'B') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (target === 'A') {
        setContentA(text);
        setNameA(file.name);
      } else {
        setContentB(text);
        setNameB(file.name);
      }
    };
    reader.readAsText(file);
  };

  const handleCopySummary = () => {
    const summary = `=== تقرير مقارنة سكريبتات FiveM وتحديثات التريقرات ===
الملف الأصلي: ${nameA} (${triggersA.length} تريقرات)
الملف المحدث: ${nameB} (${triggersB.length} تريقرات)

* تريقرات تم تحصينها أمنياً: ${triggerComparison.hardened.length}
${triggerComparison.hardened.map(h => `- ${h.new.name}: ${h.improvements.join(', ')}`).join('\n')}

* تريقرات جديدة مضافة: ${triggerComparison.added.length}
${triggerComparison.added.map(a => `+ ${a.name} (${a.type})`).join('\n')}

* تريقرات محذوفة: ${triggerComparison.removed.length}
${triggerComparison.removed.map(r => `- ${r.name}`).join('\n')}

* حالة الأمان:
الإصدار السابق: ${triggerComparison.vulnerableA} تريقرات بدون تحقق
الإصدار الجديد: ${triggerComparison.vulnerableB} تريقرات بدون تحقق`;

    navigator.clipboard.writeText(summary);
    setCopiedDiff(true);
    setTimeout(() => setCopiedDiff(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5 animate-modal-backdrop"
      onClick={onClose}
    >
      <div 
        onClick={e => e.stopPropagation()}
        className="w-full max-w-6xl bg-surface border border-accent/40 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[94vh] animate-modal-content"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-border bg-bg/90 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shadow-[0_0_15px_rgba(99,102,241,0.25)]">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white tracking-tight">
                  أداة مقارنة السكريبتات وكشف فروقات التريقرات
                </h3>
                <span className="text-[10px] font-mono text-accent bg-accent/10 px-2 py-0.5 rounded border border-accent/20">
                  Script Diff Studio
                </span>
              </div>
              <p className="text-xs text-text-dim mt-0.5">
                قارن بين نسختين من السكريبت بصرياً لكشف ترقيعات الحماية، التريقرات الجديدة، والتغييرات البرمجية
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Demo Selector */}
            <select
              onChange={e => {
                const key = e.target.value as keyof typeof DEMO_PRESETS;
                if (DEMO_PRESETS[key]) {
                  setContentA(DEMO_PRESETS[key].fileA);
                  setContentB(DEMO_PRESETS[key].fileB);
                  setNameA(`${key}_old.lua`);
                  setNameB(`${key}_secured.lua`);
                }
              }}
              className="bg-bg border border-border rounded-xl px-2.5 py-1.5 text-xs text-text-dim hover:text-white cursor-pointer focus:outline-none focus:border-accent"
            >
              <option value="">نماذج مقارنة جاهزة...</option>
              <option value="banking">{DEMO_PRESETS.banking.name}</option>
              <option value="revive">{DEMO_PRESETS.revive.name}</option>
            </select>

            <button
              onClick={handleCopySummary}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-text-dim hover:text-white border border-white/10 transition-colors cursor-pointer"
            >
              {copiedDiff ? <><Check className="w-3.5 h-3.5 text-emerald-400" /> تم النسخ</> : <><Copy className="w-3.5 h-3.5" /> نسخ الملخص</>}
            </button>

            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-text-dim hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Upload & Overview Strip */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse border-b border-border bg-bg/40">
          {/* File A Header */}
          <div className="p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 font-bold text-xs">
                A
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-white font-bold truncate max-w-[200px]" dir="ltr">
                    {nameA}
                  </span>
                  <span className="text-[10px] text-text-dim">({contentA.split('\n').length} سطر)</span>
                </div>
                <div className="text-[11px] text-rose-400/80 flex items-center gap-1 mt-0.5">
                  <ShieldAlert className="w-3 h-3" />
                  <span>{triggerComparison.vulnerableA} تريقرات بدون حماية</span>
                </div>
              </div>
            </div>

            <label className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-text-dim hover:text-white cursor-pointer transition-colors shrink-0">
              <Upload className="w-3 h-3" />
              <span>رفع النسخة (A)</span>
              <input 
                ref={fileInputRefA}
                type="file" 
                accept=".lua,.js,.ts,.txt"
                className="hidden" 
                onChange={e => handleFileUpload(e, 'A')}
              />
            </label>
          </div>

          {/* File B Header */}
          <div className="p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs">
                B
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-white font-bold truncate max-w-[200px]" dir="ltr">
                    {nameB}
                  </span>
                  <span className="text-[10px] text-text-dim">({contentB.split('\n').length} سطر)</span>
                </div>
                <div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-0.5 font-medium">
                  <ShieldCheck className="w-3 h-3" />
                  <span>{triggerComparison.vulnerableB === 0 ? 'محمي بالكامل (0 ثغرات)' : `${triggerComparison.vulnerableB} تريقرات مكشوفة`}</span>
                </div>
              </div>
            </div>

            <label className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-xs text-emerald-300 cursor-pointer transition-colors shrink-0">
              <Upload className="w-3 h-3" />
              <span>رفع النسخة (B)</span>
              <input 
                ref={fileInputRefB}
                type="file" 
                accept=".lua,.js,.ts,.txt"
                className="hidden" 
                onChange={e => handleFileUpload(e, 'B')}
              />
            </label>
          </div>
        </div>

        {/* Security & Trigger Impact Summary Cards */}
        <div className="p-3 border-b border-border bg-bg/20 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="font-bold">{triggerComparison.hardened.length}</span>
              <span>تريقرات تم تحصينها</span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="font-bold">+{triggerComparison.added.length}</span>
              <span>تريقرات جديدة</span>
            </div>

            {triggerComparison.removed.length > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
                <XCircle className="w-3.5 h-3.5" />
                <span className="font-bold">-{triggerComparison.removed.length}</span>
                <span>تريقرات محذوفة</span>
              </div>
            )}
          </div>

          {/* View Mode & Filter Controls */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="بحث في الفروقات..."
                className="w-32 sm:w-44 px-2.5 py-1 bg-bg border border-border rounded-lg text-xs text-white focus:outline-none focus:border-accent"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute left-2 top-1.5 text-text-dim hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Filter */}
            <div className="flex bg-bg border border-border rounded-lg p-0.5">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold ${filterMode === 'all' ? 'bg-white/10 text-white' : 'text-text-dim hover:text-white'}`}
              >
                الكل
              </button>
              <button
                onClick={() => setFilterMode('changes')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold ${filterMode === 'changes' ? 'bg-white/10 text-white' : 'text-text-dim hover:text-white'}`}
              >
                التغييرات فقط
              </button>
              <button
                onClick={() => setFilterMode('triggers')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold ${filterMode === 'triggers' ? 'bg-accent/20 text-accent' : 'text-text-dim hover:text-white'}`}
              >
                التريقرات
              </button>
            </div>

            {/* Layout Toggle */}
            <div className="flex bg-bg border border-border rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('split')}
                className={`p-1 rounded ${viewMode === 'split' ? 'bg-white/10 text-white' : 'text-text-dim hover:text-white'}`}
                title="عرض جانبي مزدوج (Side by Side)"
              >
                <Columns className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('unified')}
                className={`p-1 rounded ${viewMode === 'unified' ? 'bg-white/10 text-white' : 'text-text-dim hover:text-white'}`}
                title="عرض موحد (Unified Diff)"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Trigger Security Hardening Breakdown Panel (If changes detected) */}
        {triggerComparison.hardened.length > 0 && (
          <div className="px-4 py-2.5 bg-emerald-500/[0.04] border-b border-emerald-500/20 max-h-32 overflow-y-auto">
            <div className="text-[11px] font-bold text-emerald-400 mb-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>تحصينات أمنية مكتشفة في النسخة الجديدة (Security Hardening):</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {triggerComparison.hardened.map((item, idx) => (
                <div key={idx} className="flex items-start gap-1.5 text-xs text-text-dim p-1.5 rounded bg-bg/50 border border-border/50">
                  <span className="font-mono text-white font-bold" dir="ltr">{item.new.name}</span>
                  <span className="text-emerald-400 text-[11px]">← {item.improvements.join(' + ')}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Diff Content View */}
        <div className="flex-1 overflow-y-auto p-2 bg-[#0c0d12] font-mono text-xs select-text">
          {viewMode === 'unified' ? (
            /* Unified Diff View */
            <div className="space-y-0.5">
              {filteredDiff.map((line, idx) => (
                <div 
                  key={idx}
                  className={`flex items-start px-3 py-1 rounded transition-colors ${
                    line.type === 'added' ? 'bg-emerald-950/35 border-r-2 border-emerald-400 text-emerald-300' :
                    line.type === 'modified_trigger' ? 'bg-cyan-950/40 border-r-2 border-cyan-400 text-cyan-200' :
                    line.type === 'removed' ? 'bg-rose-950/35 border-r-2 border-rose-500 text-rose-300' :
                    'text-gray-300 hover:bg-white/[0.02]'
                  }`}
                  dir="ltr"
                >
                  <div className="w-16 shrink-0 flex items-center gap-2 text-gray-500 select-none text-[10px]">
                    <span className="w-6 text-right">{line.oldLineNumber || ''}</span>
                    <span className="w-6 text-right">{line.newLineNumber || ''}</span>
                    <span className="font-bold">
                      {line.type === 'added' || line.type === 'modified_trigger' ? '+' : line.type === 'removed' ? '-' : ' '}
                    </span>
                  </div>

                  <div className="flex-1 whitespace-pre-wrap break-all">
                    {line.oldContent || line.newContent}
                  </div>

                  {line.triggerNote && (
                    <span className="ml-2 text-[9px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded shrink-0" dir="rtl">
                      {line.triggerNote}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            /* Split Side-by-Side View */
            <div className="grid grid-cols-2 gap-2">
              {/* Left Side: Original A */}
              <div className="space-y-0.5 border-l border-border/50 pr-1">
                <div className="text-[10px] font-bold text-rose-400 mb-1 px-2 select-none">
                  النسخة السابقة (Original A)
                </div>
                {filteredDiff.map((line, idx) => (
                  <div 
                    key={`left-${idx}`}
                    className={`flex items-start px-2 py-0.5 rounded text-[11px] ${
                      line.type === 'removed' ? 'bg-rose-950/40 border-r-2 border-rose-500 text-rose-300' :
                      line.type === 'added' || line.type === 'modified_trigger' ? 'opacity-25 bg-black/20' :
                      'text-gray-300 hover:bg-white/[0.02]'
                    }`}
                    dir="ltr"
                  >
                    <span className="w-8 shrink-0 text-gray-500 select-none text-[10px] text-right pr-2">
                      {line.oldLineNumber || ''}
                    </span>
                    <div className="flex-1 whitespace-pre-wrap break-all min-h-[16px]">
                      {line.oldContent || ''}
                    </div>
                  </div>
                ))}
              </div>

              {/* Right Side: Patched B */}
              <div className="space-y-0.5 pl-1">
                <div className="text-[10px] font-bold text-emerald-400 mb-1 px-2 select-none">
                  النسخة المحدثة (Secured B)
                </div>
                {filteredDiff.map((line, idx) => (
                  <div 
                    key={`right-${idx}`}
                    className={`flex items-start px-2 py-0.5 rounded text-[11px] ${
                      line.type === 'added' ? 'bg-emerald-950/40 border-r-2 border-emerald-400 text-emerald-300' :
                      line.type === 'modified_trigger' ? 'bg-cyan-950/40 border-r-2 border-cyan-400 text-cyan-200' :
                      line.type === 'removed' ? 'opacity-25 bg-black/20' :
                      'text-gray-300 hover:bg-white/[0.02]'
                    }`}
                    dir="ltr"
                  >
                    <span className="w-8 shrink-0 text-gray-500 select-none text-[10px] text-right pr-2">
                      {line.newLineNumber || ''}
                    </span>
                    <div className="flex-1 whitespace-pre-wrap break-all min-h-[16px]">
                      {line.newContent || ''}
                    </div>
                    {line.triggerNote && (
                      <span className="ml-1 text-[8px] bg-cyan-500/20 text-cyan-300 px-1 py-0.5 rounded shrink-0" dir="rtl">
                        محصن
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer info and controls */}
        <div className="p-3 border-t border-border bg-bg/90 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-4 text-text-dim text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span>أسطر مضافة (+Added)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>أسطر محذوفة (-Removed)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              <span>تحديثات التريقرات (Trigger Patch)</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-white transition-colors cursor-pointer"
          >
            إغلاق أداة المقارنة
          </button>
        </div>
      </div>
    </div>
  );
};
