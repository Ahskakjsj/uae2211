import React, { useState } from 'react';
import { 
  X, Sparkles, Copy, Check, Terminal, ArrowRight, ShieldCheck, 
  Key, FileCode, Cpu, ShieldAlert, Sliders, RefreshCw, Eye
} from 'lucide-react';
import { 
  fullDeobfuscate, 
  scanContent, 
  decryptXOR, 
  scrapeLuaBytecode, 
  beautifyLuaCode, 
  normalizeVariables, 
  analyzeAssetEscrow 
} from '../scannerRules';
import { EventOccurrence } from '../types';

interface DeobfuscatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportEvents?: (events: EventOccurrence[]) => void;
}

type TabMode = 'auto' | 'xor' | 'beautifier' | 'bytecode' | 'escrow' | 'variables';

interface PresetItem {
  id: string;
  name: string;
  category: string;
  code: string;
}

const PRESETS: PresetItem[] = [
  {
    id: 'hex',
    name: '1. Hex Escapes',
    category: 'Hex',
    code: `local ev = "\\x54\\x72\\x69\\x67\\x67\\x65\\x72\\x53\\x65\\x72\\x76\\x65\\x72\\x45\\x76\\x65\\x6e\\x74"\nlocal constStr = "6573783a676976654d6f6e6579"\nlocal num = 0x64\n_G[ev](constStr, num)`
  },
  {
    id: 'base64',
    name: '2. Base64',
    category: 'Base64',
    code: `local payload = "VHJpZ2dlclNlcnZlckV2ZW50KCJlc3g6Z2l2ZU1vbmV5IiwgOTk5OTk5OSk="\n-- Decodes automatically to printable Lua code\nloadstring(payload)()`
  },
  {
    id: 'xor',
    name: '3. XOR Encoding',
    category: 'XOR',
    code: `-- XOR Bitwise Encoded Constants\nlocal a = bit.bxor(101, 0) -- 'e'\nlocal b = bit32.bxor(115, 0) -- 's'\nlocal c = (120 ~ 0) -- 'x'\n-- Also try the dedicated XOR Tab with custom key!`
  },
  {
    id: 'string_char',
    name: '4. string.char',
    category: 'String.char',
    code: `local trigger = string.char(84, 114, 105, 103, 103, 101, 114, 83, 101, 114, 118, 101, 114, 69, 118, 101, 110, 116)\nlocal event = string.char(50+51, 115, 120, 58, 97, 100, 109, 105, 110)\n_G[trigger](event)`
  },
  {
    id: 'string_reverse',
    name: '5. string.reverse',
    category: 'String.reverse',
    code: `local func = string.reverse("tnevErevreSreggirT")\nlocal event = ("yenom_evig:xse"):reverse()\n_G[func](event)`
  },
  {
    id: 'unicode',
    name: '6. Unicode Escape',
    category: 'Unicode Escape',
    code: `local title = "\\u{54}\\u{72}\\u{69}\\u{67}\\u{67}\\u{65}\\u{72}\\u{53}\\u{65}\\u{72}\\u{76}\\u{65}\\u{72}\\u{45}\\u{76}\\u{65}\\u{6e}\\u{74}"\nlocal sub = "\\u0045\\u0053\\u0058"`
  },
  {
    id: 'decimal',
    name: '7. Decimal Encoding',
    category: 'Decimal Encoding',
    code: `local ev = "\\084\\114\\105\\103\\103\\101\\114\\083\\101\\114\\118\\101\\114\\069\\118\\101\\110\\116"\nlocal target = "\\101\\115\\120\\058\\103\\101\\116\\083\\104\\097\\114\\101\\100\\079\\098\\106\\101\\099\\116"`
  },
  {
    id: 'binary',
    name: '8. Binary Encoding',
    category: 'Binary Encoding',
    code: `local binStream = "01010100 01110010 01101001 01100111 01100111 01100101 01110010 01010011 01100101 01110010 01110110 01100101 01110010 01000101 01110110 01100101 01101110 01110100"`
  },
  {
    id: 'table_encoding',
    name: '9. Table Encoding',
    category: 'Table Encoding',
    code: `local _0xRegistry = { "TriggerServerEvent", "esx:giveInventoryItem", "superadmin" }\n_0xRegistry[1](_0xRegistry[2], "weapon_pistol", 1)`
  },
  {
    id: 'string_splitting',
    name: '10. String Splitting',
    category: 'String Splitting',
    code: `local fullEvent = table.concat({ "Trigger", "Server", "Event" })\nlocal cleanedEvent = string.sub("Xesx:admin_menuX", 2, 16)\n_G[fullEvent](cleanedEvent)`
  },
  {
    id: 'string_concat',
    name: '11. Concatenation',
    category: 'String Concatenation',
    code: `local ev = "Trig" .. "ger" .. "Server" .. "Event"\nlocal sub = ("esx" .. ":" .. "giveMoney")\nTriggerServerEvent("qb-core" .. ":" .. "server" .. ":" .. "giveItem")`
  },
  {
    id: 'bytecode',
    name: '12. Lua Bytecode',
    category: 'Lua Bytecode',
    code: `\x1bLuaQ\x00\x01\x04\x08\x04\x08\x00TriggerServerEvent\x00esx:giveMoney\x00secretAdminBackdoor\x00`
  },
  {
    id: 'minification',
    name: '13. Minification',
    category: 'Minification',
    code: `function buy(a,b)if a>10 then giveMoney(b)else return false end;print("done")end;RegisterServerEvent("shop:buy");AddEventHandler("shop:buy",buy);`
  },
  {
    id: 'control_flow',
    name: '14. Control-Flow',
    category: 'Control-Flow Obfuscation',
    code: `if 1 == 1 then\n    if true then\n        TriggerServerEvent("esx:bypassSecurity", (- -100))\n    end\nelse\n    local junk = "bogus_code_block"\nend`
  },
  {
    id: 'variable_renaming',
    name: '15. Variable Renaming',
    category: 'Variable Renaming',
    code: `local _0x4f8a2 = "admin"\nlocal _0x9b1c = function(lIllIIll)\n    return lIllIIll == _0x4f8a2\nend\nlocal _0x1a = _0x9b1c("admin")`
  },
  {
    id: 'dynamic_loading',
    name: '16. Dynamic Loading',
    category: 'Dynamic Loading',
    code: `loadstring("TriggerServerEvent('esx:unauthorizedPayload')")()\nassert(load("print('Injected RCE Payload')"))()`
  },
  {
    id: 'asset_escrow',
    name: '17. Asset Escrow',
    category: 'Asset Escrow',
    code: `-- CFX_ESCROW: FiveM / Tebex Asset Escrow Protected Module\n-- fxmanifest.lua:\nexports("getSharedData", function() end)\nRegisterCommand("admin_secret_command", function() end)`
  }
];

export const DeobfuscatorModal: React.FC<DeobfuscatorModalProps> = ({ isOpen, onClose, onImportEvents }) => {
  const [activeTab, setActiveTab] = useState<TabMode>('auto');
  const [input, setInput] = useState<string>(PRESETS[0].code);
  const [output, setOutput] = useState<string>('');
  const [xorKey, setXorKey] = useState<string>('5');
  const [copied, setCopied] = useState(false);
  const [extractedCount, setExtractedCount] = useState<number | null>(null);
  const [escrowReport, setEscrowReport] = useState<{ isEscrowed: boolean; notes: string[]; exposedExports: string[] } | null>(null);

  if (!isOpen) return null;

  const handleDeobfuscate = () => {
    setEscrowReport(null);

    if (activeTab === 'auto') {
      const result = fullDeobfuscate(input);
      setOutput(result);
      const discovered = scanContent(result, "deobfuscator_lab.lua");
      setExtractedCount(discovered.length);
    } else if (activeTab === 'xor') {
      const numericKey = parseInt(xorKey, 10);
      const keyParam = isNaN(numericKey) ? xorKey : numericKey;
      const result = decryptXOR(input, keyParam);
      setOutput(result);
      const discovered = scanContent(result, "xor_lab.lua");
      setExtractedCount(discovered.length);
    } else if (activeTab === 'beautifier') {
      const result = beautifyLuaCode(input);
      setOutput(result);
      setExtractedCount(null);
    } else if (activeTab === 'bytecode') {
      const info = scrapeLuaBytecode(input);
      setOutput(info.cleaned);
      setExtractedCount(info.strings.length);
    } else if (activeTab === 'variables') {
      const result = normalizeVariables(input);
      setOutput(result);
      setExtractedCount(null);
    } else if (activeTab === 'escrow') {
      const report = analyzeAssetEscrow(input, 'resource/fxmanifest.lua');
      setEscrowReport(report);
      setOutput(
        `-- [Cfx.re FiveM Asset Escrow Analysis Report]\n` +
        `-- Status: ${report.isEscrowed ? 'PROTECTED BY ESCROW (محمي بنظام التشفير)' : 'NOT ESCROWED (غير مشفر بـ Escrow)'}\n\n` +
        report.notes.map(n => `-- Note: ${n}`).join('\n') +
        `\n\n-- Discovered Exposed RPC Exports & Commands:\n` +
        (report.exposedExports.length > 0 
          ? report.exposedExports.map(e => `-- Exposed: ${e}`).join('\n') 
          : `-- No public exports found.`)
      );
      setExtractedCount(report.exposedExports.length);
    }
  };

  const handleLoadPreset = (preset: PresetItem) => {
    setInput(preset.code);
    if (preset.id === 'xor') {
      setActiveTab('xor');
    } else if (preset.id === 'minification') {
      setActiveTab('beautifier');
    } else if (preset.id === 'bytecode') {
      setActiveTab('bytecode');
    } else if (preset.id === 'variable_renaming') {
      setActiveTab('variables');
    } else if (preset.id === 'asset_escrow') {
      setActiveTab('escrow');
    } else {
      setActiveTab('auto');
    }
    // Auto-run deobfuscation
    setTimeout(() => {
      const result = fullDeobfuscate(preset.code);
      setOutput(result);
      const discovered = scanContent(result, `${preset.id}.lua`);
      setExtractedCount(discovered.length);
    }, 50);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImportToMain = () => {
    if (!onImportEvents) return;
    const discovered = scanContent(output || fullDeobfuscate(input), "deobfuscator_lab.lua");
    onImportEvents(discovered);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5 animate-modal-backdrop"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl bg-surface border border-accent/30 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] animate-modal-content"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border bg-bg/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/20 border border-accent/40 flex items-center justify-center text-accent shadow-[0_0_15px_rgba(99,102,241,0.25)]">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-white tracking-tight flex items-center gap-2">
                مختبر فك التشفيرات الـ 17 المتقدمة
                <span className="text-[10px] font-mono text-accent bg-accent/10 px-2 py-0.5 rounded-full border border-accent/30">
                  17 Deobfuscation Engines
                </span>
              </h3>
              <p className="text-[11px] text-text-dim">
                Hex, Base64, XOR, String.char, Reverse, Unicode, Decimal, Binary, Table, Slicing, Concat, Bytecode, Minify, Flow, Renaming, Dynamic, Escrow
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

        {/* Engine Tabs */}
        <div className="px-4 sm:px-5 pt-3 pb-2 bg-surface/60 border-b border-border flex items-center gap-1.5 overflow-x-auto text-xs font-bold no-scrollbar">
          <button
            onClick={() => setActiveTab('auto')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shrink-0 ${
              activeTab === 'auto'
                ? 'bg-accent text-white shadow-[0_0_10px_rgba(99,102,241,0.4)]'
                : 'bg-white/[0.03] text-text-dim hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            فك شامل (All 17 Engines)
          </button>

          <button
            onClick={() => setActiveTab('xor')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shrink-0 ${
              activeTab === 'xor'
                ? 'bg-cyan-500 text-black font-extrabold shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                : 'bg-white/[0.03] text-text-dim hover:text-white hover:bg-white/5'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            مفكك XOR مع مفتاح مخصص
          </button>

          <button
            onClick={() => setActiveTab('beautifier')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shrink-0 ${
              activeTab === 'beautifier'
                ? 'bg-emerald-500 text-black font-extrabold shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                : 'bg-white/[0.03] text-text-dim hover:text-white hover:bg-white/5'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            منسق الأكواد (Un-minify & Beautify)
          </button>

          <button
            onClick={() => setActiveTab('bytecode')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shrink-0 ${
              activeTab === 'bytecode'
                ? 'bg-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.4)]'
                : 'bg-white/[0.03] text-text-dim hover:text-white hover:bg-white/5'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            مستخرج نصوص Bytecode
          </button>

          <button
            onClick={() => setActiveTab('variables')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shrink-0 ${
              activeTab === 'variables'
                ? 'bg-amber-500 text-black font-extrabold shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                : 'bg-white/[0.03] text-text-dim hover:text-white hover:bg-white/5'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            منظف المتغيرات المبهمة
          </button>

          <button
            onClick={() => setActiveTab('escrow')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shrink-0 ${
              activeTab === 'escrow'
                ? 'bg-rose-500 text-white shadow-[0_0_10px_rgba(244,63,94,0.4)]'
                : 'bg-white/[0.03] text-text-dim hover:text-white hover:bg-white/5'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            فاحص FiveM Escrow
          </button>
        </div>

        {/* Presets Quick Selector Bar */}
        <div className="px-4 sm:px-5 py-2.5 bg-bg/60 border-b border-border flex items-center gap-2 overflow-x-auto text-[11px] no-scrollbar">
          <span className="text-text-dim font-bold shrink-0 flex items-center gap-1">
            <Eye className="w-3 h-3 text-accent" />
            عينات سريعة للتجربة:
          </span>
          {PRESETS.map(preset => (
            <button
              key={preset.id}
              onClick={() => handleLoadPreset(preset)}
              className="px-2.5 py-1 rounded-md bg-white/[0.03] hover:bg-accent/20 border border-white/5 hover:border-accent/40 text-text-dim hover:text-white transition-all shrink-0 font-mono"
            >
              {preset.name}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* XOR Key Controls if in XOR mode */}
          {activeTab === 'xor' && (
            <div className="p-3 bg-cyan-950/30 border border-cyan-500/30 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-cyan-200">مفتاح التشفير XOR (XOR Key):</span>
                <input
                  type="text"
                  value={xorKey}
                  onChange={(e) => setXorKey(e.target.value)}
                  placeholder="رقم أو كلمة (مثال: 5 أو secret)"
                  className="bg-bg border border-cyan-500/40 rounded-lg px-2.5 py-1 font-mono text-cyan-300 w-32 focus:outline-none focus:border-cyan-400 text-xs"
                />
              </div>
              <div className="text-[11px] text-cyan-300/80 font-mono">
                يعمل مع bit.bxor ومفاتيح التشفير الرقمية أو النصية
              </div>
            </div>
          )}

          {/* Input Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-bold text-text-dim flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-accent" />
                الصق النص أو الكود المراد تحليله وفك تشفيره:
              </label>
              <button
                onClick={() => setInput('')}
                className="text-[11px] text-text-dim hover:text-accent transition-colors"
              >
                مسح الحقل
              </button>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="ضع كود Lua مشفر هنا..."
              rows={5}
              className="w-full bg-bg border border-border focus:border-accent rounded-xl p-3.5 font-mono text-xs text-indigo-200/90 focus:outline-none transition-all resize-none selection:bg-accent/30"
              dir="ltr"
            />
          </div>

          {/* Action Button */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={handleDeobfuscate}
              className="px-6 py-2.5 rounded-xl bg-accent hover:bg-accent/90 text-white font-bold text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(99,102,241,0.35)] transition-all active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              {activeTab === 'auto' ? 'تشغيل فك التشفير الشامل (17 تقنية)' : 
               activeTab === 'xor' ? 'فك تشفير XOR الآن' :
               activeTab === 'beautifier' ? 'تنسيق وتجميل كود Lua' :
               activeTab === 'bytecode' ? 'استخراج نصوص Bytecode' :
               activeTab === 'variables' ? 'تنظيف وتبسيط أسماء المتغيرات' : 'فحص كود وحماية Escrow'}
            </button>

            <div className="text-[11px] text-text-dim flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              يدعم فك التشفير التكراري متعدد الطبقات (Multi-pass loop)
            </div>
          </div>

          {/* Output Box */}
          {output && (
            <div className="space-y-2 pt-2 border-t border-border">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  النتيجة بعد المعالجة وفك التشفير:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-text-dim hover:text-white text-[11px] transition-all"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copied ? 'تم النسخ!' : 'نسخ الكود المفكوك'}
                  </button>
                  {onImportEvents && extractedCount !== null && extractedCount > 0 && (
                    <button
                      onClick={handleImportToMain}
                      className="flex items-center gap-1 px-3 py-1 rounded-lg bg-accent/20 hover:bg-accent/30 text-accent font-bold text-[11px] border border-accent/40 transition-all"
                    >
                      إرسال لجدول الفحص العام ({extractedCount} حدث)
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
              <div
                className="w-full bg-bg/95 border border-emerald-500/30 rounded-xl p-4 font-mono text-xs text-emerald-300 max-h-56 overflow-y-auto whitespace-pre-wrap select-text leading-relaxed"
                dir="ltr"
              >
                {output}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

