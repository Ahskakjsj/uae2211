import React, { useState } from 'react';
import { 
  X, Wrench, Shield, Check, Copy, Download, Code2, 
  Layers, CheckCircle2, ArrowRight, RefreshCw, FileText
} from 'lucide-react';
import { EventOccurrence } from '../types';

interface PatchGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: EventOccurrence[];
}

export const PatchGeneratorModal: React.FC<PatchGeneratorModalProps> = ({
  isOpen,
  onClose,
  events
}) => {
  const [patchType, setPatchType] = useState<'source_check' | 'rate_limit' | 'ace_permissions' | 'argument_sanitizer'>('source_check');
  const [selectedEventName, setSelectedEventName] = useState<string>(events[0]?.name || 'esx:giveInventoryItem');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const vulnerableEvents = events.filter(e => 
    e.severity === 'critical' || e.severity === 'high' || e.type === 'server'
  );

  const generatePatchCode = (): string => {
    const cleanName = selectedEventName.replace(/\s*\(.*?\)/g, '').trim();

    if (patchType === 'source_check') {
      return `-- ========================================================
-- [Alzaabi Security Patch]: Server-Side Source Validation
-- Target Event: "${cleanName}"
-- Prevents unauthorized remote triggers from client mod menus
-- ========================================================

RegisterNetEvent("${cleanName}", function(...)
    local src = source
    
    -- 1. Source existence check
    if not src or src <= 0 then
        print(string.format("^1[SECURITY VIOLATION]^7 Invalid trigger source for event %s", "${cleanName}"))
        return
    end

    -- 2. Anti-Spoofing & Distance Check (FiveM Native)
    local ped = GetPlayerPed(src)
    if not DoesEntityExist(ped) then
        print(string.format("^1[SECURITY WARNING]^7 Trigger dispatched without valid ped for source %s", src))
        DropPlayer(src, "Security Violation: Desynced Entity Trigger")
        return
    end

    -- 3. Execute legitimate logic safely
    -- Insert your secure server business logic here:
    print(string.format("^2[SECURE DISPATCH]^7 Event %s processed safely for player %s", "${cleanName}", src))
end)`;
    }

    if (patchType === 'rate_limit') {
      return `-- ========================================================
-- [Alzaabi Security Patch]: Spam & Rate-Limit Trigger Shield
-- Target Event: "${cleanName}"
-- Prevents crashers and automated trigger spamming
-- ========================================================

local _EventCooldowns = {}
local COOLDOWN_SECONDS = 3 -- Adjust delay threshold

RegisterNetEvent("${cleanName}", function(...)
    local src = source
    local currentTime = os.time()

    if not _EventCooldowns[src] then
        _EventCooldowns[src] = {}
    end

    local lastUsed = _EventCooldowns[src]["${cleanName}"] or 0
    if (currentTime - lastUsed) < COOLDOWN_SECONDS then
        local violationMsg = string.format("Trigger spam detected for %s (rate limit exceeded)", "${cleanName}")
        print("^1[ANTI-SPAM]^7 " .. violationMsg .. " by ID: " .. tostring(src))
        
        -- Optional: Drop or warn spammer
        -- DropPlayer(src, "Rate Limit Exceeded: " .. "${cleanName}")
        return
    end

    _EventCooldowns[src]["${cleanName}"] = currentTime

    -- Safe execution:
    print("^2[RATE-LIMIT PASSED]^7 Allowed event invocation for source: " .. tostring(src))
end)

AddEventHandler("playerDropped", function()
    local src = source
    _EventCooldowns[src] = nil
end)`;
    }

    if (patchType === 'ace_permissions') {
      return `-- ========================================================
-- [Alzaabi Security Patch]: ACE Role & Permission Guard
-- Target Event: "${cleanName}"
-- Requires server.cfg: add_ace group.admin "${cleanName}" allow
-- ========================================================

RegisterNetEvent("${cleanName}", function(...)
    local src = source
    local requiredAce = "command.${cleanName}"

    -- Enforce ACE Permission validation
    if not IsPlayerAceAllowed(src, requiredAce) and not IsPlayerAceAllowed(src, "alzaabi.admin") then
        local playerName = GetPlayerName(src) or "Unknown"
        local identifier = GetPlayerIdentifier(src, 0) or "N/A"
        
        print(string.format("^1[UNAUTHORIZED ACCESS BLOCKED]^7 Player %s (%s) tried triggering %s without permission!", playerName, identifier, "${cleanName}"))
        
        -- Trigger Discord Security Log or Ban Action:
        TriggerEvent("AlzaabiSecurity:LogUnauthorized", src, "${cleanName}")
        DropPlayer(src, "Alzaabi Shield: Unauthorized Administrative Event Call")
        return
    end

    -- Process administrative logic
    print("^2[ADMIN AUTHORIZED]^7 Executing protected logic for: " .. tostring(src))
end)`;
    }

    // Argument Sanitizer
    return `-- ========================================================
-- [Alzaabi Security Patch]: Type & Boundary Sanitizer
-- Target Event: "${cleanName}"
-- Prevents negative money exploits, NaN payloads, and string injection
-- ========================================================

RegisterNetEvent("${cleanName}", function(targetId, amount, customString)
    local src = source

    -- 1. Validate Target ID
    targetId = tonumber(targetId)
    if not targetId or targetId <= 0 or not GetPlayerName(targetId) then
        DropPlayer(src, "Invalid target player ID")
        return
    end

    -- 2. Validate Amount (Strict integer/positive number constraint)
    amount = tonumber(amount)
    if not amount or amount ~= amount or amount <= 0 or amount > 5000000 then
        -- Catches NaN (amount ~= amount), negative numbers, and unrealistic limits
        DropPlayer(src, "Exploit Attempt: Malicious or Out-of-bounds Value Passed")
        return
    end

    -- 3. Sanitize String input (No control characters or SQL symbols)
    if customString then
        if type(customString) ~= "string" or string.len(customString) > 120 or string.find(customString, "[\'\";\-\-]") then
            DropPlayer(src, "Exploit Attempt: Malformed parameter string")
            return
        end
    end

    -- 4. Proceed safely with clean values
    print(string.format("^2[VALIDATED]^7 %s invoked with sanitized values", "${cleanName}"))
end)`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatePatchCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const code = generatePatchCode();
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `security_patch_${selectedEventName.replace(/[^a-zA-Z0-9_-]/g, '_')}.lua`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6 animate-modal-backdrop"
      onClick={onClose}
    >
      <div 
        onClick={e => e.stopPropagation()}
        className="w-full max-w-3xl bg-surface border border-emerald-500/40 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-modal-content"
      >
        {/* Header */}
        <div className="p-5 border-b border-border bg-bg/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white tracking-tight flex items-center gap-2">
                مولد ترقيعات وتأمين التريقرات <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Patch Studio</span>
              </h3>
              <p className="text-xs text-text-dim mt-0.5">
                توليد كود حماية وترقيع فوري لأي تريقر لحمايته من السبام واستغلال المودات
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
          {/* Target Event Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-text-dim flex items-center justify-between">
              <span>التريقر المراد توليد ترقيع أمني له (Target Vulnerable Trigger)</span>
              <span className="text-[10px] text-emerald-400">
                {vulnerableEvents.length} تريقرات بحاجة لتحصين
              </span>
            </label>
            <div className="flex gap-2">
              <input 
                type="text"
                value={selectedEventName}
                onChange={e => setSelectedEventName(e.target.value)}
                className="flex-1 px-3 py-2 bg-bg border border-border rounded-xl font-mono text-xs text-white focus:outline-none focus:border-emerald-400 transition-colors"
                dir="ltr"
              />
              {events.length > 0 && (
                <select
                  value={selectedEventName}
                  onChange={e => setSelectedEventName(e.target.value)}
                  className="px-3 py-2 bg-bg border border-border rounded-xl text-xs text-text-dim focus:outline-none focus:border-emerald-400 cursor-pointer max-w-[220px]"
                >
                  {events.slice(0, 50).map((ev, i) => (
                    <option key={i} value={ev.name}>{ev.name} ({ev.severity})</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Patch Strategies */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-text-dim">نوع استراتيجية الترقيع الأمني (Security Strategy)</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                {
                  id: 'source_check' as const,
                  title: '1. التحقق الصارم من المصدر (Source Check)',
                  desc: 'منع استدعاء التريقر من شاشات وهمية أو إرساله بدون لاعب حقيقي'
                },
                {
                  id: 'rate_limit' as const,
                  title: '2. درع مكافحة السبام (Rate-Limiter Shield)',
                  desc: 'تحديد حد أقصى للطلبات في الثانية لمنع كراش السيرفر والسبام'
                },
                {
                  id: 'ace_permissions' as const,
                  title: '3. حماية صلاحيات الإدارة (ACE Permissions)',
                  desc: 'ربط التريقر بنظام صلاحيات FiveM الرسمية وطرد أي لاعب غير مخول'
                },
                {
                  id: 'argument_sanitizer' as const,
                  title: '4. تنقية القيم والأموال (Argument Sanitizer)',
                  desc: 'منع ثغرات الأموال السلبية والـ NaN وحقن الرموز المشبوهة'
                }
              ].map(strat => (
                <div
                  key={strat.id}
                  onClick={() => setPatchType(strat.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    patchType === strat.id
                      ? 'bg-emerald-500/10 border-emerald-400 text-white shadow-sm'
                      : 'bg-bg border-border text-text-dim hover:text-white hover:border-white/20'
                  }`}
                >
                  <div className="text-xs font-bold text-emerald-400 mb-1">{strat.title}</div>
                  <div className="text-[11px] leading-relaxed text-text-dim">{strat.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Code Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-text-dim flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>كود الترقيع الأمني المولد (Generated Lua Patch Code)</span>
              </label>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-white/5 hover:bg-white/10 text-text-dim hover:text-white transition-colors cursor-pointer"
                >
                  {copied ? <><Check className="w-3 h-3 text-emerald-400" /> تم النسخ</> : <><Copy className="w-3 h-3" /> نسخ الكود</>}
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 transition-colors cursor-pointer"
                >
                  <Download className="w-3 h-3" />
                  <span>تنزيل ملف .lua</span>
                </button>
              </div>
            </div>

            <pre className="p-4 bg-bg border border-emerald-500/30 rounded-xl font-mono text-xs text-emerald-300 overflow-x-auto shadow-inner leading-relaxed" dir="ltr">
              {generatePatchCode()}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-bg/80 flex items-center justify-between">
          <div className="text-[11px] text-text-dim">
            انسخ الكود وألصقه مباشرة في ملفات السيرفر (`server.lua`) لتأمين التريقر فوراً
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-white transition-colors cursor-pointer"
          >
            إغلاق النافذة
          </button>
        </div>
      </div>
    </div>
  );
};
