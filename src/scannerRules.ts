import { EventOccurrence, DetectedProtection } from './types';

// ========================================================
// 17 Obfuscation & Decoding Engines:
// 1. Hex
// 2. Base64
// 3. XOR
// 4. String.char
// 5. String.reverse
// 6. Unicode Escape
// 7. Decimal Encoding
// 8. Binary Encoding
// 9. Table Encoding (Array & Map Constants)
// 10. String Splitting
// 11. String Concatenation
// 12. Lua Bytecode
// 13. Minification (Lua Beautifier)
// 14. Control-Flow Obfuscation
// 15. Variable Renaming (Identifier De-mangler)
// 16. Dynamic Loading (load / loadstring unwrap)
// 17. FiveM Asset Escrow (Cfx.re analysis)
// ========================================================

// 1. Hex Decoder
export const decodeHexEscapes = (text: string): string => {
  let result = text;
  // \x41 -> 'A'
  result = result.replace(/\\x([0-9A-Fa-f]{2})/g, (_, hex) => {
    try {
      return String.fromCharCode(parseInt(hex, 16));
    } catch {
      return _;
    }
  });

  // Hex literals 0x41 -> 65 (or char if within string context)
  result = result.replace(/0x([0-9A-Fa-f]+)/gi, (match, hex) => {
    try {
      const val = parseInt(hex, 16);
      return isNaN(val) ? match : val.toString();
    } catch {
      return match;
    }
  });

  // Long hex strings like "6573783a676976654d6f6e6579" (ASCII 32 to 126)
  result = result.replace(/["'`]([0-9A-Fa-f]{8,})["'`]/g, (match, hex) => {
    if (hex.length % 2 !== 0) return match;
    let decodedStr = '';
    for (let i = 0; i < hex.length; i += 2) {
      const byte = parseInt(hex.substring(i, i + 2), 16);
      if (byte < 32 || byte > 126) return match; // Not plain printable ascii
      decodedStr += String.fromCharCode(byte);
    }
    return `"${decodedStr}"`;
  });

  return result;
};

// 2. Base64 Decoder
export const decodeBase64Strings = (text: string): string => {
  return text.replace(/["'`]([A-Za-z0-9+/]{12,}={0,2})["'`]/g, (match, b64) => {
    try {
      const decodedStr = atob(b64);
      // Check if majority of decoded characters are printable
      let printable = 0;
      for (let i = 0; i < decodedStr.length; i++) {
        const c = decodedStr.charCodeAt(i);
        if (c >= 32 && c <= 126) printable++;
      }
      if (printable / decodedStr.length > 0.8) {
        return `"${decodedStr}"`;
      }
      return match;
    } catch {
      return match;
    }
  });
};

// 3. XOR Decryptor
export const decryptXOR = (text: string, keyInput: number | string): string => {
  const key = typeof keyInput === 'string' ? keyInput : String.fromCharCode(keyInput);
  if (!key) return text;

  let output = '';
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    const keyChar = key.charCodeAt(i % key.length);
    output += String.fromCharCode(charCode ^ keyChar);
  }
  return output;
};

// Auto-detect and resolve inline XOR patterns
export const autoResolveXOR = (text: string): string => {
  let result = text;

  // Pattern: bit.bxor(101, 5) or bit32.bxor(c, 12)
  result = result.replace(/(?:bit|bit32)\.bxor\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)/g, (_, a, b) => {
    try {
      const val = parseInt(a, 10) ^ parseInt(b, 10);
      return val.toString();
    } catch {
      return _;
    }
  });

  // Lua 5.3+ bitwise XOR: (101 ~ 5)
  result = result.replace(/\((\d+)\s*~\s*(\d+)\)/g, (_, a, b) => {
    try {
      return (parseInt(a, 10) ^ parseInt(b, 10)).toString();
    } catch {
      return _;
    }
  });

  return result;
};

// 4. String.char Decoder
export const decodeStringChar = (text: string): string => {
  return text.replace(/(?:string\s*\.\s*char|string\s*\[\s*["'`]char["'`]\s*\])\s*\(([\s\d,\+\-\*]+)\)/gi, (match, args) => {
    try {
      const parts = args.split(',');
      let str = '';
      for (const part of parts) {
        const trimmed = part.trim();
        let code: number;
        if (/^[\d\s\+\-]+$/.test(trimmed)) {
          // Safe arithmetic evaluation for simple math like 50+50 without eval/Function
          const nums = trimmed.match(/[+-]?\s*\d+/g);
          code = nums ? nums.reduce((acc, n) => acc + parseInt(n.replace(/\s+/g, ''), 10), 0) : parseInt(trimmed, 10);
        } else {
          code = parseInt(trimmed, 10);
        }
        if (!isNaN(code) && code >= 0 && code <= 65535) {
          str += String.fromCharCode(code);
        } else {
          return match;
        }
      }
      return JSON.stringify(str);
    } catch {
      return match;
    }
  });
};

// 5. String.reverse Decoder
export const decodeStringReverse = (text: string): string => {
  let result = text;
  // string.reverse("...")
  result = result.replace(/(?:string\s*\.\s*reverse|string\s*\[\s*["'`]reverse["'`]\s*\])\s*\(\s*["'`](.*?)["'`]\s*\)/gi, (_, str) => {
    return JSON.stringify(str.split('').reverse().join(''));
  });
  // ("..."):reverse()
  result = result.replace(/["'`](.*?)["'`]\s*:\s*reverse\s*\(\s*\)/gi, (_, str) => {
    return JSON.stringify(str.split('').reverse().join(''));
  });
  return result;
};

// 6. Unicode Escape Decoder
export const decodeUnicodeEscapes = (text: string): string => {
  let result = text;
  // \u{1f600} or \u{41}
  result = result.replace(/\\u\{([0-9A-Fa-f]+)\}/g, (_, hex) => {
    try {
      return String.fromCodePoint(parseInt(hex, 16));
    } catch {
      return _;
    }
  });
  // \u0041
  result = result.replace(/\\u([0-9A-Fa-f]{4})/g, (_, hex) => {
    try {
      return String.fromCharCode(parseInt(hex, 16));
    } catch {
      return _;
    }
  });
  return result;
};

// 7. Decimal Encoding Decoder
export const decodeDecimalEscapes = (text: string): string => {
  let result = text;
  // Lua decimal escape: \120, \52, \065
  result = result.replace(/\\(\d{1,3})/g, (match, dec) => {
    const code = parseInt(dec, 10);
    return code >= 0 && code <= 255 ? String.fromCharCode(code) : match;
  });
  // Lua 5.2+ \z escape (skips following whitespace)
  result = result.replace(/\\z\s*/g, '');
  return result;
};

// 8. Binary Encoding Decoder
export const decodeBinaryStrings = (text: string): string => {
  return text.replace(/["'`]([01]{8}(?:\s+[01]{8}){2,})["'`]/g, (match, binStr) => {
    try {
      const bytes = binStr.trim().split(/\s+/);
      const chars = bytes.map((b: string) => String.fromCharCode(parseInt(b, 2))).join('');
      return `"${chars}"`;
    } catch {
      return match;
    }
  });
};

// 9. Table Encoding (Array & Map Constants)
export const decodeTableEncodings = (text: string): string => {
  let result = text;

  // Extract static constant tables: local _0xTable = { "event1", "event2", "event3" }
  const tableRegex = /local\s+([a-zA-Z0-9_]+)\s*=\s*\{\s*([a-zA-Z0-9_\-\s,"'\.\\]+?)\s*\}(?:\s*;)?/g;
  const tables: Record<string, string[]> = {};
  let match: RegExpExecArray | null;

  while ((match = tableRegex.exec(result)) !== null) {
    if (match.index === tableRegex.lastIndex) {
      tableRegex.lastIndex++;
    }
    const tableName = match[1];
    const rawItems = match[2];
    const items = rawItems.match(/["'`]([^"'`\r\n]*?)["'`]/g);
    if (items && items.length > 0) {
      tables[tableName] = items.map(s => s.slice(1, -1));
    }
  }

  // Replace references like _0xTable[1] with the actual string
  Object.entries(tables).forEach(([tableName, items]) => {
    items.forEach((item, index) => {
      // Lua 1-based indexing
      const luaIndex = index + 1;
      const refRegex = new RegExp(`${tableName}\\s*\\[\\s*${luaIndex}\\s*\\]`, 'g');
      result = result.replace(refRegex, `"${item}"`);
    });
  });

  // Table of numbers decoded: { 101, 115, 120, 58 } when combined with unpack or string.char
  result = result.replace(/\{\s*(\d{2,3}(?:\s*,\s*\d{2,3}){3,})\s*\}/g, (match, nums) => {
    try {
      const numbers = nums.split(',').map((n: string) => parseInt(n.trim(), 10));
      const isAscii = numbers.every((n: number) => n >= 32 && n <= 126);
      if (isAscii && numbers.length >= 4) {
        const decoded = numbers.map((n: number) => String.fromCharCode(n)).join('');
        return `{ "${decoded}" /* Decoded ASCII Table */ }`;
      }
      return match;
    } catch {
      return match;
    }
  });

  return result;
};

// 10. String Splitting & Slicing
export const decodeStringSplits = (text: string): string => {
  let result = text;

  // table.concat({ "esx", ":", "getSharedObject" })
  result = result.replace(/table\.concat\s*\(\s*\{([^}]+)\}\s*(?:,\s*["'`]([^"'`]*)["'`])?\s*\)/gi, (_, list, delim = '') => {
    try {
      const parts = list.match(/["'`]([^"'`]+)["'`]/g)?.map((s: string) => s.slice(1, -1)) || [];
      if (parts.length > 0) {
        return `"${parts.join(delim || '')}"`;
      }
      return _;
    } catch {
      return _;
    }
  });

  // string.sub("XTriggerEventX", 2, 13)
  result = result.replace(/string\.sub\s*\(\s*["'`]([^"'`\r\n]*?)["'`]\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/gi, (_, str, start, end) => {
    try {
      const s = parseInt(start, 10) - 1;
      const e = parseInt(end, 10);
      return `"${str.substring(s, e)}"`;
    } catch {
      return _;
    }
  });

  return result;
};

// 11. String Concatenation Resolver
export const decodeStringConcatenation = (text: string): string => {
  let result = text;
  let prev = '';
  let passes = 0;

  while (result !== prev && passes < 6) {
    prev = result;
    passes++;
    // "Trig" .. "ger" or 'Trig' + 'ger'
    result = result.replace(/["'`]([^"'`\\]*)["'`]\s*(?:\.\.|\+)\s*["'`]([^"'`\\]*)["'`]/g, '"$1$2"');
    // ("Trig" .. "ger")
    result = result.replace(/\(\s*["'`]([^"'`\\]*)["'`]\s*\)/g, '"$1"');
  }

  return result;
};

// 12. Lua Bytecode Scraper
export const scrapeLuaBytecode = (content: string): { cleaned: string; foundBytecode: boolean; strings: string[] } => {
  const isBytecode = content.includes('\x1bLua') || content.includes('\x27LuaQ') || content.includes('LuaQ') || content.includes('LuaR') || /\\x1bLua|\\27Lua/i.test(content);
  
  // Scrape printable strings with length >= 4
  const scrapedStrings = new Set<string>();
  const asciiMatches = content.match(/[\x20-\x7E]{4,}/g) || [];

  asciiMatches.forEach(item => {
    const trimmed = item.trim();
    // Filter out common compiler noise
    if (!/^[0-9]+$/.test(trimmed) && trimmed.length >= 4 && !trimmed.startsWith('===')) {
      scrapedStrings.add(trimmed);
    }
  });

  let cleaned = content;
  if (isBytecode) {
    const extractedList = Array.from(scrapedStrings).slice(0, 100);
    cleaned = `-- [ALZAABI ENGINE: DETECTED COMPILED LUA BYTECODE]\n` +
              `-- Scraped ${extractedList.length} string constants from bytecode pool:\n\n` +
              extractedList.map(s => `-- Discovered String: "${s}"`).join('\n') +
              `\n\n-- Original Payload Dump:\n` + content;
  }

  return {
    cleaned,
    foundBytecode: isBytecode,
    strings: Array.from(scrapedStrings)
  };
};

// 13. Minification Cleaner & Lua Beautifier (Linear parsing, 100% recursion-free)
export const beautifyLuaCode = (code: string): string => {
  if (!code) return '';

  // Step 1: Safely separate semicolons outside strings without backtracking lookaheads
  let inQuote: string | null = null;
  let splitSemicolons = '';

  for (let i = 0; i < code.length; i++) {
    const char = code[i];
    const prev = i > 0 ? code[i - 1] : '';

    if (inQuote) {
      splitSemicolons += char;
      if (char === inQuote && prev !== '\\') {
        inQuote = null;
      }
    } else {
      if (char === '"' || char === "'" || char === '`') {
        inQuote = char;
        splitSemicolons += char;
      } else if (char === ';') {
        splitSemicolons += ';\n';
      } else {
        splitSemicolons += char;
      }
    }
  }

  // Step 2: Line breaks on keywords
  let formatted = splitSemicolons
    .replace(/\b(then|do)\b(?!\s*\n)/g, '$1\n  ')
    .replace(/\b(else)\b/g, '\nelse\n  ')
    .replace(/\b(end)\b/g, '\nend\n');

  // Step 3: Indentation adjustment
  const lines = formatted.split('\n');
  let indent = 0;
  const result: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (/^(end|else|elseif|until|\})/.test(trimmed)) {
      indent = Math.max(0, indent - 1);
    }

    result.push('  '.repeat(indent) + trimmed);

    if (/\b(function|then|do|repeat)\b/.test(trimmed) && !/\bend\b/.test(trimmed)) {
      indent++;
    } else if (/\{$/.test(trimmed)) {
      indent++;
    }
  }

  return result.join('\n');
};

// 14. Control-Flow Obfuscation Cleaner
export const simplifyControlFlow = (text: string): string => {
  let result = text;

  // Opaque predicates: if true then X end -> X (bounded single-line/scoped)
  result = result.replace(/if\s+(?:true|1\s*==\s*1|2\s*>\s*1)\s+then\s+([^\n\r]{1,500}?)\s+end/gi, '$1');

  // Clean redundant dead branches: if false then X else Y end -> Y (bounded single-line/scoped)
  result = result.replace(/if\s+(?:false|1\s*==\s*0)\s+then\s+[^\n\r]{1,500}?\s+else\s+([^\n\r]{1,500}?)\s+end/gi, '$1');

  // Simplify VM double negation: (- -10) -> 10
  result = result.replace(/\(-\s*-\s*(\d+)\)/g, '$1');

  // Clean junk arithmetic: (x + 0 - 0)
  result = result.replace(/\((\d+)\s*[\+\-]\s*0\)/g, '$1')
                 .replace(/\(0\s*\+\s*(\d+)\)/g, '$1');

  return result;
};

// 15. Variable Renaming (De-mangler)
export const normalizeVariables = (code: string): string => {
  let result = code;
  // Match obfuscated identifier prefixes: _0x123abc, __var_0x..., l1ll1l
  const obfIdRegex = /\b(_0x[a-fA-F0-9]{3,}|[lI]{4,}|[oO0]{4,})\b/g;
  const foundNames = Array.from(new Set(code.match(obfIdRegex) || []));

  let varCounter = 1;
  foundNames.forEach(name => {
    const cleanName = `var_${varCounter++}`;
    const wordBoundaryRegex = new RegExp(`\\b${name}\\b`, 'g');
    result = result.replace(wordBoundaryRegex, cleanName);
  });

  return result;
};

// 16. Dynamic Loading Unwrapper (load / loadstring)
export const unwrapDynamicLoaders = (text: string): string => {
  let result = text;

  // loadstring("...")() or load("...")()
  result = result.replace(/(?:assert\s*\(\s*)?(?:loadstring|load)\s*\(\s*["'`]([^"'`\r\n]*?)["'`]\s*\)\s*(?:\))?\s*\(\s*\)/gi, (_, innerCode) => {
    return `\n-- [DEOBFUSCATED DYNAMIC EXECUTION PAYLOAD]:\n${innerCode}\n`;
  });

  // pcall(loadstring("..."))
  result = result.replace(/pcall\s*\(\s*(?:loadstring|load)\s*\(\s*["'`]([^"'`\r\n]*?)["'`]\s*\)\s*\)/gi, (_, innerCode) => {
    return `\n-- [DEOBFUSCATED PCALL PAYLOAD]:\n${innerCode}\n`;
  });

  return result;
};

// 17. FiveM Asset Escrow Analyzer
export const analyzeAssetEscrow = (content: string, filePath: string): {
  isEscrowed: boolean;
  notes: string[];
  exposedExports: string[];
} => {
  const notes: string[] = [];
  const exposedExports: string[] = [];

  const hasFxap = filePath.endsWith('.fxap') || content.includes('.fxap') || content.includes('fxap');
  const hasEscrowSignature = content.includes('CFX_ESCROW') || content.includes('fx_escrow') || content.includes('Tebex Escrow');
  const isBytecode = content.includes('\x1bLua') || content.includes('\x27LuaQ');

  const isEscrowed = hasFxap || hasEscrowSignature || (isBytecode && (filePath.includes('client') || filePath.includes('server')));

  if (isEscrowed) {
    notes.push('Resource is protected by Cfx.re / Tebex Asset Escrow.');
    notes.push('Core Lua bytecode is encrypted via server-bound license tokens.');
    notes.push('Important: Manifest files (fxmanifest.lua) and exported RPC triggers remain visible and vulnerable if not validated!');
  }

  // Look for exported events and commands that are still readable
  const exportMatches = content.match(/exports\s*\(\s*["'`]([a-zA-Z0-9_\-]+)["'`]/g) || [];
  exportMatches.forEach(exp => {
    const nameMatch = exp.match(/["'`]([a-zA-Z0-9_\-]+)["'`]/);
    if (nameMatch) exposedExports.push(nameMatch[1]);
  });

  const cmdMatches = content.match(/RegisterCommand\s*\(\s*["'`]([a-zA-Z0-9_\-]+)["'`]/g) || [];
  cmdMatches.forEach(cmd => {
    const nameMatch = cmd.match(/["'`]([a-zA-Z0-9_\-]+)["'`]/);
    if (nameMatch) exposedExports.push(`cmd:${nameMatch[1]}`);
  });

  return {
    isEscrowed,
    notes,
    exposedExports
  };
};

// ========================================================
// MASTER FULL DEOBFUSCATOR:
// Executes all 17 decoding & deobfuscation passes sequentially
// ========================================================
export const fullDeobfuscate = (content: string): string => {
  let decoded = content;
  let previous = '';
  let iterations = 0;

  // First pass: Bytecode Scraper check
  const bytecodeInfo = scrapeLuaBytecode(decoded);
  if (bytecodeInfo.foundBytecode) {
    decoded = bytecodeInfo.cleaned;
  }

  // Iterative multi-pass loop (up to 6 passes to unwind stacked layers)
  while (decoded !== previous && iterations < 6) {
    previous = decoded;
    iterations++;

    // 1. Hex Escapes & Numbers
    decoded = decodeHexEscapes(decoded);

    // 2. Base64
    decoded = decodeBase64Strings(decoded);

    // 3. XOR Auto Resolution
    decoded = autoResolveXOR(decoded);

    // 4. string.char(...)
    decoded = decodeStringChar(decoded);

    // 5. string.reverse(...)
    decoded = decodeStringReverse(decoded);

    // 6. Unicode Escapes \u{...}
    decoded = decodeUnicodeEscapes(decoded);

    // 7. Decimal Escapes \ddd
    decoded = decodeDecimalEscapes(decoded);

    // 8. Binary strings
    decoded = decodeBinaryStrings(decoded);

    // 9. Table Encoding
    decoded = decodeTableEncodings(decoded);

    // 10. String Splitting & Slicing
    decoded = decodeStringSplits(decoded);

    // 11. String Concatenation ("a" .. "b")
    decoded = decodeStringConcatenation(decoded);

    // 14. Control-flow simplification
    decoded = simplifyControlFlow(decoded);

    // 16. Dynamic loading unwrappers (load / loadstring)
    decoded = unwrapDynamicLoaders(decoded);
  }

  return decoded;
};

// ========================================================
// Scanner Engine: Scans and extracts FiveM events and threats
// ========================================================
export const scanContent = (content: string, filePath: string): EventOccurrence[] => {
  const occurrences: EventOccurrence[] = [];
  const normalizedContent = fullDeobfuscate(content);
  const lines = normalizedContent.split('\n');

  // Check for Asset Escrow detection
  const escrowInfo = analyzeAssetEscrow(content, filePath);
  if (escrowInfo.isEscrowed) {
    occurrences.push({
      name: 'Cfx.re Asset Escrow Detected',
      file: filePath,
      line: 1,
      type: 'vulnerability',
      context: escrowInfo.notes.join(' | '),
      description: 'Asset is escrowed. Triggers and exports must still be verified server-side.',
      remediation: 'Ensure exposed events in fxmanifest are protected with server source checks.',
      category: 'Asset Escrow',
      severity: 'low',
    });
  }

  const patterns = [
    {
      regex: /(?:LPH_|Luraph|Lura)/gi,
      type: 'vulnerability' as const,
      name: 'Luraph Obfuscator Detected',
      description: 'Found signatures of Luraph commercial Lua obfuscator. Frequently used to conceal backdoors, unauthorized licensing, or stolen code.',
      remediation: 'Review the source provider or request uncompiled source code to ensure no hidden execution threads exist.',
      category: 'Obfuscation',
      severity: 'high' as const
    },
    {
      regex: /(?:MoonSec|MoonS|MSec)/gi,
      type: 'vulnerability' as const,
      name: 'MoonSec Obfuscator Detected',
      description: 'Signatures of MoonSec VM protection with anti-debugging. Can mask malicious remote code loading.',
      remediation: 'Deobfuscate via VM dumping or verify resource authenticity.',
      category: 'Obfuscation',
      severity: 'high' as const
    },
    {
      regex: /(?:IronBrew|IBrew|Aztup|IronB)/gi,
      type: 'vulnerability' as const,
      name: 'IronBrew / AztupBrew Detected',
      description: 'Elite Lua VM bytecode converter detected. Highly suspicious when found in public FiveM leak scripts.',
      remediation: 'Isolate resource and inspect network activity with Wireshark/txAdmin logs.',
      category: 'Obfuscation',
      severity: 'high' as const
    },
    {
      regex: /(?:Xenon|Xeno|X-Protect)/gi,
      type: 'vulnerability' as const,
      name: 'Xenon Obfuscator Detected',
      description: 'Advanced FiveM-specific obfuscation signature detected with anti-tamper safeguards.',
      remediation: 'Inspect HTTP webhooks and outbound requests that might be bundled inside.',
      category: 'Obfuscation',
      severity: 'high' as const
    },
    {
      regex: /(?:PSObfuscator|PSObf|PS-)/gi,
      type: 'vulnerability' as const,
      name: 'PSObfuscator Detected',
      description: 'Common Lua obfuscator used to hide simple bypasses, tokens, or resource theft.',
      remediation: 'Use simple AST or string unscrambler to expose inner routines.',
      category: 'Obfuscation',
      severity: 'medium' as const
    },
    {
      regex: /rawget\s*\(\s*_G\s*,\s*["'`]([^"'`\r\n]+)["'`](?:\s*)\)/g,
      type: 'vulnerability' as const,
      name: 'Stealth Global Access (rawget bypass)',
      description: 'Accessing global environment via rawget to bypass security sandboxes and metatable hooks.',
      remediation: 'Replace with explicit function references or enforce metatable protection on _G.',
      category: 'Sandbox Bypass',
      severity: 'high' as const
    },
    {
      regex: /debug\.(?:getupvalue|setupvalue|getlocal|setlocal|getregistry)\s*\(/g,
      type: 'vulnerability' as const,
      name: 'Debug Library Exploitation',
      description: 'Direct abuse of Lua debug library. Allows manipulating private upvalues, bypassing token checks and tampering with core frameworks.',
      remediation: 'Disable debug library in server.cfg or sandbox Lua environment.',
      category: 'Privilege Escalation',
      severity: 'critical' as const
    },
    {
      regex: /(?:load|loadstring)\s*\(\s*[^)\r\n]*(?:\\x|\\u|string\.char|string\.reverse|PerformHttpRequest)[^)\r\n]*\)/g,
      type: 'vulnerability' as const,
      name: 'Encrypted Remote Code Execution (RCE)',
      description: 'Dynamic compilation and execution of obfuscated or downloaded Lua code. High probability of backdoor.',
      remediation: 'Remove loadstring calls. Use static modules with pre-defined exports.',
      category: 'RCE / Backdoor',
      severity: 'critical' as const
    },
    {
      regex: /Citizen\.CreateThread\s*\(\s*function\s*\(\s*\)\s*while\s+true\s+do\s*Citizen\.Wait\s*\([^)\r\n]*\)\s*PerformHttpRequest\s*\(/g,
      type: 'vulnerability' as const,
      name: 'FiveM Cipher Beacon Backdoor',
      description: 'Detected a looping HTTP beacon (Cipher backdoor signature) polling external servers for remote commands.',
      remediation: 'Delete this loop immediately and trace the destination URL in firewall.',
      category: 'Cipher Backdoor',
      severity: 'critical' as const
    },
    {
      regex: /os\.(?:execute|rename|remove|exit)\s*\(/g,
      type: 'vulnerability' as const,
      name: 'Dangerous OS Library Call',
      description: 'Execution of server operating system commands. Can format files, spawn malware, or shutdown the VPS.',
      remediation: 'Block the os library in FiveM fxserver configuration immediately.',
      category: 'System Compromise',
      severity: 'critical' as const
    },
    {
      regex: /if\s+[^=\r\n]*(?:Steam|Identifier|License|PlayerIdentifier)[^=\r\n]*==\s*["'`](steam:[0-9a-f]+|license:[0-9a-f]+|discord:[0-9]+)["'`]\s+then\s+[^;\r\n]*(?:admin|superadmin|god|permission)/gi,
      type: 'vulnerability' as const,
      name: 'Hardcoded Admin Backdoor Privilege',
      description: 'Grants admin or superadmin permissions based on a hardcoded Steam, Discord, or FiveM License ID.',
      remediation: 'Remove hardcoded identifier checks. Use ACE permissions or database-driven roles.',
      category: 'Backdoor',
      severity: 'critical' as const
    },
    {
      regex: /(?:MySQL\.query|MySQL\.Async\.fetchAll|exports\.oxmysql\:query_async)\s*\(\s*["'`][^"'`]*\s*(?:\.\.|\+)\s*[a-zA-Z0-9_\.]+/gi,
      type: 'vulnerability' as const,
      name: 'Potential SQL Injection Vulnerability',
      description: 'SQL query built using direct string concatenation without prepared statement parameters (?).',
      remediation: 'Use parameterized queries: MySQL.query("SELECT * FROM users WHERE id = ?", [targetId])',
      category: 'Injection',
      severity: 'high' as const
    },
    {
      regex: /ExecuteCommand\s*\(\s*["'`][^"'\r\n]*(?:add_principal|add_ace|quit|ensure)[^"'\r\n]*/gi,
      type: 'vulnerability' as const,
      name: 'Console RCON / ACE Command Injection',
      description: 'Script is invoking ExecuteCommand with sensitive administrative or permission-granting parameters.',
      remediation: 'Restrict ExecuteCommand calls or enforce strict server-side source validation.',
      category: 'Privilege Escalation',
      severity: 'high' as const
    },
    {
      regex: /(?:giveMoney|addMoney|giveItem|addAccountMoney|addItem)\s*\(\s*(?:amount|count|qty|\d+)/gi,
      type: 'vulnerability' as const,
      name: 'Unprotected Economy Mutator Detected',
      description: 'Direct economy modification detected. If triggered from client without server verification, players can exploit infinite money.',
      remediation: 'Always calculate prices and give items strictly server-side based on verified inventory & transactions.',
      category: 'Economy Exploit',
      severity: 'high' as const
    },
    {
      regex: /https:\/\/(?:ptb\.|canary\.)?discord\.com\/api\/webhooks\/[0-9]+\/[a-zA-Z0-9_\-]+/gi,
      type: 'webhook' as const,
      name: 'Discord Webhook URL Found',
      description: 'Discord Webhook detected. Can log player IP addresses, server chat, admin activities, or leak private data to unauthorized Discord channels.',
      remediation: 'Check if the webhook belongs to your server. Store webhooks in server-side convar or env variables.',
      category: 'Data Exfiltration',
      severity: 'medium' as const
    },
    {
      regex: /(?:TriggerServerEvent|TriggerClientEvent|TriggerEvent|RegisterNetEvent|RegisterServerEvent|_G\s*\[\s*["'`](TriggerServerEvent|TriggerClientEvent|TriggerEvent)["'`](?:\s*\])?)\s*\(\s*["'`]([^"'`\r\n]+)["'`](?:\s*[,)])?/g, 
      type: 'auto',
      severity: 'medium' as const
    },
    { 
      regex: /local\s+([a-zA-Z0-9_]+)\s*=\s*(?:TriggerServerEvent|TriggerClientEvent|TriggerEvent)/g,
      isAliasCapture: true
    }
  ];

  const aliases: Record<string, string> = {};

  lines.forEach((line, index) => {
    // Detect High Entropy row (Encrypted Bytecode / Obfuscated Buffer)
    if (line.length > 300 && (line.match(/\\x[0-9A-Fa-f]{2}/g)?.length || 0) > 10) {
      occurrences.push({
        name: 'Encrypted Bytecode Buffer Block',
        file: filePath,
        line: index + 1,
        type: 'vulnerability',
        context: line.substring(0, 200) + '...',
        description: 'Large block of hex-encoded bytecode data. The script contains hidden compiled VM instructions.',
        remediation: 'Use a dynamic memory dumper or analyze script runtime in a test sandbox.',
        category: 'Obfuscated Payload',
        severity: 'high',
      });
    }

    // Scan standard and advanced patterns
    patterns.forEach((p) => {
      let match;
      const staticRegex = new RegExp(p.regex);
      
      while ((match = staticRegex.exec(line)) !== null) {
        if (match[0].length === 0) {
          staticRegex.lastIndex++;
        }

        if ('isAliasCapture' in p) {
          aliases[match[1]] = line.includes('TriggerServerEvent') ? 'server' : line.includes('TriggerClientEvent') ? 'client' : 'local';
          continue;
        }

        const type = p.type === 'auto' 
          ? (line.includes('RegisterServerEvent') || line.includes('RegisterNetEvent') ? 'register'
             : line.includes('Server') ? 'server' 
             : line.includes('Client') ? 'client' 
             : 'local') 
          : p.type;
        
        const name = p.type === 'webhook' ? (match[0] || p.name) : (p.name || match[2] || match[1]);

        if (name) {
          occurrences.push({
            name: name,
            file: filePath,
            line: index + 1,
            type: type as any,
            context: line.trim(),
            description: p.description,
            remediation: p.remediation,
            category: p.category,
            severity: (name.includes('%') || name.includes('..')) ? 'high' : (p.severity || 'medium') as any,
          });
        }
      }
    });

    // Check captured aliases
    Object.entries(aliases).forEach(([alias, type]) => {
      const escapedAlias = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const aliasRegex = new RegExp(escapedAlias + "\\s*\\(\\s*[\"'`]([^\"'`\\r\\n]+)[\"'`](?:\\s*[,)])?", 'g');
      let aliasMatch;
      while ((aliasMatch = aliasRegex.exec(line)) !== null) {
        if (aliasMatch[0].length === 0) {
          aliasRegex.lastIndex++;
        }
        occurrences.push({
          name: aliasMatch[1] + " (via Dynamic Alias)",
          file: filePath,
          line: index + 1,
          type: type as any,
          context: line.trim(),
          description: `This event was dispatched via dynamic local alias variable '${alias}'.`,
          remediation: 'Verify whether the target event requires source validation.',
          category: 'Obfuscated Alias',
          severity: 'high' as any,
        });
      }
    });

    // Framework Constant Extraction (ESX, QBCore, vRP, Custom)
    const stringLiteralRegex = /["'`]([a-zA-Z0-9_\-\.]+:[a-zA-Z0-9_\-\.\/]+|esx_[a-zA-Z0-9_]+|qb\-[a-zA-Z0-9_]+|vrp:[a-zA-Z0-9_]+)["'`]/g;
    let literalMatch;
    while ((literalMatch = stringLiteralRegex.exec(line)) !== null) {
      if (literalMatch[0].length === 0) {
        stringLiteralRegex.lastIndex++;
      }
      const potentialEvent = literalMatch[1];
      
      // Strict Real-World Validation: Ignore URLs, web protocols, domains, file paths and HTML/NUI artifacts
      const lower = potentialEvent.toLowerCase();
      if (
        lower.startsWith('http:') ||
        lower.startsWith('https:') ||
        lower.startsWith('about:') ||
        lower.startsWith('file:') ||
        lower.startsWith('ftp:') ||
        lower.startsWith('ws:') ||
        lower.startsWith('wss:') ||
        lower.includes('//') ||
        lower.includes('.com') ||
        lower.includes('.org') ||
        lower.includes('.net') ||
        lower.includes('.io') ||
        lower.includes('github') ||
        lower.includes('.png') ||
        lower.includes('.jpg') ||
        lower.includes('.svg') ||
        lower.includes('.html') ||
        lower.includes('.css') ||
        lower.includes('.json') ||
        lower.includes('.woff') ||
        lower.includes('.ttf') ||
        lower.includes('%s') ||
        lower.includes('%d') ||
        lower.includes('px')
      ) {
        continue;
      }

      const isTriggerEvent = potentialEvent.toLowerCase().includes('trigger') || !potentialEvent.includes(':');
      occurrences.push({
        name: potentialEvent,
        file: filePath,
        line: index + 1,
        type: isTriggerEvent ? 'local' : 'server',
        context: line.trim(),
        description: 'Extracted framework event string constant discovered in script pool.',
        category: 'Framework Event',
        severity: 'medium',
      });
    }

    // Encrypted numeric array detection
    if (line.match(/\{\s*(?:\d{1,3}\s*,\s*){10,}/)) {
      occurrences.push({
        name: 'Encrypted ASCII Constant Array',
        file: filePath,
        line: index + 1,
        type: 'vulnerability',
        context: line.substring(0, 100) + '...',
        description: 'Detected large numeric byte array storing obfuscated strings or function tables.',
        category: 'Array Obfuscation',
        severity: 'medium',
      });
    }
  });

  return occurrences;
};

// Whitelist generator
export const generateAntiCheatWhitelist = (events: EventOccurrence[]): string => {
  const serverEvents = Array.from(new Set(
    events.filter(e => e.type === 'server' || e.type === 'register')
      .map(e => e.name.replace(/\s*\(.*?\)/g, '').trim())
      .filter(name => name.length > 2 && !name.includes(' ') && !name.includes('Detected'))
  ));

  const clientEvents = Array.from(new Set(
    events.filter(e => e.type === 'client')
      .map(e => e.name.replace(/\s*\(.*?\)/g, '').trim())
      .filter(name => name.length > 2 && !name.includes(' ') && !name.includes('Detected'))
  ));

  return `-- ========================================================
-- FiveM Anti-Cheat Event Whitelist Configuration
-- Generated by محرك الزعابي لتفتيش السيرفرات (Alzaabi Engine)
-- Date: ${new Date().toISOString().split('T')[0]}
-- ========================================================

Config = Config or {}

-- Authorized Server Events (Prevent unauthorized execution)
Config.WhitelistedServerEvents = {
${serverEvents.map(e => `    ["${e}"] = true,`).join('\n')}
}

-- Authorized Client Events
Config.WhitelistedClientEvents = {
${clientEvents.map(e => `    ["${e}"] = true,`).join('\n')}
}

-- Trigger Verification Guard
AddEventHandler("onResourceStart", function(resourceName)
    print("^2[Alzaabi Shield]^7 Whitelist initialized with ^3${serverEvents.length}^7 Server Events & ^3${clientEvents.length}^7 Client Events.")
end)
`;
};

// Security Report Generator
export const generateSecurityReport = (events: EventOccurrence[], stats: any): string => {
  const criticals = events.filter(e => e.severity === 'critical');
  const highs = events.filter(e => e.severity === 'high');
  const webhooks = events.filter(e => e.type === 'webhook');
  const protections: DetectedProtection[] = stats?.detectedProtections || [];

  return `# FiveM Security Audit & Trigger Analysis Report
**Generated By:** محرك الزعابي المتطور لفحص تريقرات وسيرفرات FiveM
**Audit Date:** ${new Date().toLocaleString('ar-AE')}
**Status:** ${criticals.length > 0 ? 'CRITICAL RISK DETECTED (مخاطر أمنية حرجة)' : 'STABLE (مستقر)'}

---

## 1. Executive Summary (الملخص التنفيذي)
- **Total Files Scanned:** ${stats?.totalFiles || 0}
- **Lua Scripts Inspected:** ${stats?.luaFiles || 0}
- **Total Triggers & Events:** ${events.length}
- **Critical Security Risks:** ${criticals.length}
- **High Severity Risks:** ${highs.length}
- **Discord Webhooks Found:** ${webhooks.length}
- **Obfuscation Threat Index:** ${stats?.obfuscationScore || 0}%
- **Identified Protections & Anticheats:** ${protections.length > 0 ? protections.map(p => p.name).join(', ') : 'None Detected'}

---

## 2. Identified Protection & Anti-Cheat Systems (أنظمة الحماية المشفرة والتشفير)
${protections.length === 0 ? '_No dedicated third-party anti-cheat or obfuscator systems identified._' : protections.map((p, idx) => `
### [${idx + 1}] ${p.name} (${p.type})
- **Vendor / Provider:** ${p.vendor || 'Unknown'}
- **Confidence:** ${p.confidence}
- **Details:** ${p.description}
- **Matched In Files:** ${p.filesFound.slice(0, 5).join(', ')}${p.filesFound.length > 5 ? ` (+${p.filesFound.length - 5} more)` : ''}
`).join('\n')}

---

## 3. High-Priority Vulnerabilities (أهم الثغرات والمخاطر المكتشفة)
${criticals.length === 0 ? '_No critical vulnerabilities discovered. Great job!_' : criticals.map((e, idx) => `
### [${idx + 1}] ${e.name}
- **File:** \`${e.file}\` (Line: ${e.line})
- **Threat Level:** CRITICAL
- **Category:** ${e.category || 'Vulnerability'}
- **Description:** ${e.description || 'N/A'}
- **Remediation:** ${e.remediation || 'Inspect code immediately and apply input validation.'}
- **Code Context:**
\`\`\`lua
${e.context}
\`\`\`
`).join('\n')}

---

## 4. Discovered Webhooks (روابط الويب هوك)
${webhooks.length === 0 ? '_No webhooks discovered._' : webhooks.map((w, idx) => `
- [${idx + 1}] \`${w.name}\` at \`${w.file}\` (L${w.line})
`).join('\n')}

---

## 5. Extracted Server Events & Triggers
| Event Name | Type | Severity | File | Line |
| :--- | :--- | :--- | :--- | :--- |
${events.slice(0, 100).map(e => `| \`${e.name}\` | ${e.type} | ${e.severity} | \`${e.file}\` | ${e.line} |`).join('\n')}
${events.length > 100 ? `\n_...and ${events.length - 100} more events._` : ''}

---
_Generated by Alzaabi FiveM Security Engine v4.5 - Protected under All Rights Reserved._
`;
};

// ========================================================
// Protection & AntiCheat Signature Detector
// Identifies major FiveM AntiCheats, Obfuscators & Security Suites
// ========================================================
export const identifyProtections = (
  filePaths: string[],
  fileContentsSample: Map<string, string> | Record<string, string>
): DetectedProtection[] => {
  const protections: DetectedProtection[] = [];
  const foundMap = new Map<string, DetectedProtection>();

  const addProtection = (prot: DetectedProtection) => {
    if (foundMap.has(prot.name)) {
      const existing = foundMap.get(prot.name)!;
      prot.filesFound.forEach(f => {
        if (!existing.filesFound.includes(f)) existing.filesFound.push(f);
      });
    } else {
      foundMap.set(prot.name, { ...prot });
    }
  };

  const getEntryContent = (path: string): string => {
    if (fileContentsSample instanceof Map) {
      return fileContentsSample.get(path) || '';
    }
    return (fileContentsSample as Record<string, string>)[path] || '';
  };

  // 1. Signature database
  const signatureRules = [
    // FiveGuard
    {
      name: 'FiveGuard AntiCheat',
      type: 'AntiCheat' as const,
      vendor: 'FiveGuard Team',
      confidence: 'High' as const,
      description: 'نظام حماية FiveGuard التجاري المتقدم لمكافحة برامج التخريب وحماية التريقرات والتطبيقات الخارجية.',
      pathRegex: /fiveguard|fg-ac|fg_ac/i,
      contentRegex: /fiveguard|FiveGuard|fg_event|fg_hook|fiveguard_ac/i
    },
    // Phoenix AntiCheat
    {
      name: 'Phoenix AntiCheat',
      type: 'AntiCheat' as const,
      vendor: 'Phoenix Protection',
      confidence: 'High' as const,
      description: 'حماية فينيكس المضادة للحقن وكشف التخريب وحماية أحداث السيرفر (Event Validator).',
      pathRegex: /phoenix(?:-|_)?ac|phoenixanticheat/i,
      contentRegex: /phoenix_ac|PhoenixAC|phoenix:check|phoenix:ban/i
    },
    // Wave AntiCheat
    {
      name: 'WaveShield AntiCheat',
      type: 'AntiCheat' as const,
      vendor: 'Wave Development',
      confidence: 'High' as const,
      description: 'نظام حماية WaveShield لكشف الحقن، الهاكات، ومنع استدعاء التريقرات العشوائية من الكلاينت.',
      pathRegex: /waveshield|wave-ac|wave_shield/i,
      contentRegex: /WaveShield|waveshield:event|wave_ban/i
    },
    // Alzaabi Shield
    {
      name: 'Alzaabi Security Shield',
      type: 'AntiCheat' as const,
      vendor: 'Alzaabi Engineering',
      confidence: 'High' as const,
      description: 'درع حماية الزعابي المتقدم لفحص التريقرات، كشف التشفير، وحماية سيرفرات FiveM بالكامل.',
      pathRegex: /alzaabi(?:-|_)?(?:shield|anticheat|security)/i,
      contentRegex: /alzaabi|Alzaabi Shield|Alzaabi Security/i
    },
    // Badger AntiCheat
    {
      name: 'Badger AntiCheat',
      type: 'AntiCheat' as const,
      vendor: 'Badger',
      confidence: 'High' as const,
      description: 'نظام Badger المجاني والشهير لمكافحة الأسلحة والمود منيو وفحص الكونسول.',
      pathRegex: /badger-anticheat|badger_anticheat/i,
      contentRegex: /Badger-AntiCheat|BadgerAntiCheat/i
    },
    // Reaper AC
    {
      name: 'Reaper AntiCheat',
      type: 'AntiCheat' as const,
      vendor: 'Reaper Team',
      confidence: 'High' as const,
      description: 'حماية ريبر FiveM لمنع استدعاء التريقرات غير المصرح بها وفحص سلامة اللاعبين.',
      pathRegex: /reaper-ac|reaperac/i,
      contentRegex: /reaper:ban|reaper_ac|ReaperAC/i
    },
    // FireAC
    {
      name: 'FireAC Protection',
      type: 'AntiCheat' as const,
      vendor: 'Fire Development',
      confidence: 'High' as const,
      description: 'نظام حماية FireAC المتخصص في تشفير التريقرات وكشف الرعشات والتنقل السريع (Noclip).',
      pathRegex: /fire-ac|fireac|fire_ac/i,
      contentRegex: /fireac:ban|fireac:check|FireAC/i
    },
    // NegronAC
    {
      name: 'Negron AntiCheat',
      type: 'AntiCheat' as const,
      vendor: 'Negron',
      confidence: 'High' as const,
      description: 'نظام Negron لمكافحة المود منيو والبوتات وحظر اللاعبين المخالفين.',
      pathRegex: /negron|negron-ac/i,
      contentRegex: /negron_ac|negron:ban/i
    },
    // Godmode / Anticheat generic script
    {
      name: 'FiveM Event Guard & Token System',
      type: 'AntiCheat' as const,
      vendor: 'Server Custom Security',
      confidence: 'Medium' as const,
      description: 'نظام حماية داخلي مبني على التوكنات العشوائية وحظر السبام للتريقرات.',
      pathRegex: /anticheat|anti-cheat|anti_cheat|ac-guard/i,
      contentRegex: /RegisterServerEvent\s*\(\s*["'`][^"'`]*anticheat/i
    },
    // Luraph
    {
      name: 'Luraph Obfuscator VM',
      type: 'Obfuscator' as const,
      vendor: 'Luraph Team',
      confidence: 'High' as const,
      description: 'تشفير Luraph الاحترافي المعتمد على Virtual Machine مخصصة لإخفاء الأكواد وحماية المنتجات.',
      pathRegex: /luraph/i,
      contentRegex: /LPH_INIT_LURAPH_VM|LPH_|luraph/i
    },
    // MoonSec
    {
      name: 'MoonSec Virtual Machine',
      type: 'Obfuscator' as const,
      vendor: 'MoonSec',
      confidence: 'High' as const,
      description: 'محرك تشفير MoonSec الشهير الذي يعتمد على تحويل الكود إلى Lua Bytecode مشفر بـ VM داخلي.',
      pathRegex: /moonsec/i,
      contentRegex: /MoonSec|MSec|moonsec_v/i
    },
    // IronBrew / AztupBrew
    {
      name: 'IronBrew / AztupBrew',
      type: 'Obfuscator' as const,
      vendor: 'IronBrew / Aztup',
      confidence: 'High' as const,
      description: 'مكثف تشفير IronBrew الشهير مع جدول ثوابت Bytecode معقد وتشفير Bitwise XOR.',
      pathRegex: /ironbrew|aztup/i,
      contentRegex: /IronBrew|AztupBrew|IBrew/i
    },
    // Cfx.re Asset Escrow
    {
      name: 'Cfx.re Asset Escrow System',
      type: 'Escrow' as const,
      vendor: 'FiveM / Cfx.re & Tebex',
      confidence: 'High' as const,
      description: 'نظام تشفير FiveM الرسمي (Tebex Asset Escrow) المقيد برخصة السيرفر وملف .fxap المشفر.',
      pathRegex: /\.fxap$/i,
      contentRegex: /CFX_ESCROW|fx_escrow|Tebex Escrow/i
    },
    // TXAdmin Guardian
    {
      name: 'txAdmin Built-in Guardian',
      type: 'AntiCheat' as const,
      vendor: 'Tabarra / Cfx.re',
      confidence: 'High' as const,
      description: 'نظام حماية وإدارة السيرفرات txAdmin الرسمي مع كشف التحذيرات وسجلات اللاعبين المحظورين.',
      pathRegex: /txData|txadmin/i,
      contentRegex: /txAdmin|txaEvent|txAdminClient/i
    },
    // Chocolate AC
    {
      name: 'Chocolate AntiCheat',
      type: 'AntiCheat' as const,
      vendor: 'Chocolate Dev',
      confidence: 'High' as const,
      description: 'أنتيشيت شهير يتميز بفحص هيدرات الشبكة ومنع سبام الأحداث وحظر المودرز.',
      pathRegex: /chocolate|chocolate-ac/i,
      contentRegex: /chocolate:ban|chocolate_ac/i
    },
    // EasyAdmin Shield
    {
      name: 'EasyAdmin & ACE Security',
      type: 'LicenseGuard' as const,
      vendor: 'Blumlaut',
      confidence: 'High' as const,
      description: 'نظام إدارة وصلاحيات مع تشفير واجهات الأدمن وحظر انتحال الهويات.',
      pathRegex: /easyadmin/i,
      contentRegex: /EasyAdmin|EasyAdmin:banPlayer/i
    },
    // Xenon Protect
    {
      name: 'Xenon Protect',
      type: 'Obfuscator' as const,
      vendor: 'Xenon',
      confidence: 'Medium' as const,
      description: 'نظام حماية Xenon مع مكافحة التعديل وحظر الـ Hooks وتشفير الدوال.',
      pathRegex: /xenon/i,
      contentRegex: /X-Protect|XenonSecurity|xenon_protect/i
    }
  ];

  // Scan file paths and sample contents
  filePaths.forEach(path => {
    const content = getEntryContent(path);
    const fileName = path.split('/').pop() || path;

    for (const rule of signatureRules) {
      const matchPath = rule.pathRegex.test(path);
      const matchContent = content ? rule.contentRegex.test(content) : false;

      if (matchPath || matchContent) {
        addProtection({
          name: rule.name,
          type: rule.type,
          vendor: rule.vendor,
          confidence: matchContent && matchPath ? 'High' : (matchContent ? 'High' : 'Medium'),
          description: rule.description,
          filesFound: [fileName]
        });
      }
    }
  });

  return Array.from(foundMap.values());
};

