import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  X, 
  RotateCcw, 
  Copy, 
  Check, 
  ShieldCheck, 
  ChevronDown, 
  HelpCircle,
  ExternalLink,
  Code2,
  Terminal,
  MessageSquareQuote
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenQuickScan?: () => void;
  onOpenDeobfuscator?: () => void;
  onOpenBackdoorHunter?: () => void;
}

const SUGGESTIONS = [
  'ما هي وظيفة هذا الموقع وأهم ميزاته؟',
  'كيف أستخدم صائد الباك دور لاكتشاف الأبواب الخلفية؟',
  'كيف أحمي التريقرات الحساسة (فلوس، سيارات، رتب)؟',
  'كيف أفك تشفير سكريبت مشفر بـ Hex أو Base64؟',
  'ما هو الفرق بين TriggerServerEvent و RegisterNetEvent؟',
  'كيف أتجنب اللاق ومشاكل الرزمون (Resmon)؟'
];

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  onOpenQuickScan,
  onOpenDeobfuscator,
  onOpenBackdoorHunter
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'model',
      text: `مرحباً بك يا كابتن في **محرك الزعابي لفحص التريقرات**! 🛡️⚡\n\nأنا **مساعد الزعابي الذكي (FiveM AI Assistant)**، تم تدريبي لمساعدتك في أي استفسار عن هذا الموقع، وكيفية فحص وتأمين سكربتات وحزم FiveM، وصيد الباكدورات والهاكرز.\n\nتفضل باختيار أحد الأسئلة السريعة بالأسفل أو اكتب سؤالك مباشرة!`,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        scrollToBottom();
      }, 100);
    }
  }, [isOpen, messages]);

  const handleSend = async (customText?: string) => {
    const textToSend = (customText || inputText).trim();
    if (!textToSend || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    if (!customText) setInputText('');
    setIsLoading(true);

    try {
      // Build brief history for context
      const history = messages
        .filter(m => m.id !== 'welcome-msg')
        .slice(-6)
        .map(m => ({ role: m.role, text: m.text }));

      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: textToSend,
          history
        })
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      const replyText = data.reply || 'عذراً، لم أتمكن من الحصول على رد في الوقت الحالي. يرجى إعادة المحاولة.';

      const botMessage: ChatMessage = {
        id: `model-${Date.now()}`,
        role: 'model',
        text: replyText,
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        text: `حدث خطأ أثناء الاتصال بالذكاء الاصطناعي. يرجى التأكد من تشغيل الخادم والمحاولة مرة أخرى.`,
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome-msg-reset',
        role: 'model',
        text: `تمت إعادة تهيئة المحادثة بنجاح! 🚀\n\nأنا جاهز للإجابة عن أي سؤال يخص **محرك الزعابي لفحص التريقرات** وتأمين FiveM. ماذا تريد أن تعرف؟`,
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  if (!isOpen) return null;

  // Simple Markdown renderer for bold, code blocks, and bullets
  const renderFormattedText = (text: string) => {
    // Split into code blocks and normal lines
    const parts = text.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const lines = part.slice(3, -3).trim().split('\n');
        const lang = lines[0]?.match(/^[a-zA-Z0-9_-]+$/) ? lines[0] : '';
        const code = lang ? lines.slice(1).join('\n') : lines.join('\n');

        return (
          <div key={index} className="my-2 rounded-lg bg-black/70 border border-accent/20 overflow-hidden font-mono text-xs text-left" dir="ltr">
            <div className="flex items-center justify-between px-3 py-1.5 bg-white/[0.04] border-b border-accent/15 text-[11px] text-text-dim">
              <span className="text-accent flex items-center gap-1.5 font-bold uppercase text-[10px]">
                <Code2 className="w-3.5 h-3.5" />
                {lang || 'lua'}
              </span>
              <button
                onClick={() => handleCopyText(`code-${index}`, code)}
                className="flex items-center gap-1 text-[10px] text-text-dim hover:text-white transition-colors"
                title="نسخ الكود"
              >
                {copiedId === `code-${index}` ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">تم النسخ</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>نسخ</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-3 overflow-x-auto text-emerald-300 select-text font-mono leading-relaxed">
              <code>{code}</code>
            </pre>
          </div>
        );
      }

      // Normal text with inline markdown formatting
      return (
        <div key={index} className="space-y-1">
          {part.split('\n').map((line, lineIdx) => {
            if (!line.trim()) return <div key={lineIdx} className="h-1.5" />;

            // Bullet points
            const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('* ');
            const cleanedLine = isBullet ? line.trim().substring(2) : line;

            // Format bold text
            const formattedLine = cleanedLine.split(/(\*\*.*?\*\*)/g).map((seg, sIdx) => {
              if (seg.startsWith('**') && seg.endsWith('**')) {
                return (
                  <strong key={sIdx} className="font-bold text-white">
                    {seg.slice(2, -2)}
                  </strong>
                );
              }
              // Format inline code
              return seg.split(/(`.*?`)/g).map((sub, subIdx) => {
                if (sub.startsWith('`') && sub.endsWith('`')) {
                  return (
                    <code key={subIdx} className="px-1.5 py-0.5 rounded bg-accent/15 text-accent font-mono text-[11px] border border-accent/25 mx-0.5" dir="ltr">
                      {sub.slice(1, -1)}
                    </code>
                  );
                }
                return sub;
              });
            });

            if (isBullet) {
              return (
                <div key={lineIdx} className="flex items-start gap-2 pr-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 flex-shrink-0" />
                  <div className="flex-1">{formattedLine}</div>
                </div>
              );
            }

            return <p key={lineIdx}>{formattedLine}</p>;
          })}
        </div>
      );
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-modal-backdrop">
      <div 
        className="relative w-full max-w-2xl h-[90vh] max-h-[720px] flex flex-col bg-surface border border-accent/40 rounded-xl shadow-[0_0_50px_rgba(99,102,241,0.2)] overflow-hidden animate-modal-content"
        dir="rtl"
      >
        {/* Top Decorative HUD Border */}
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-accent to-transparent" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-white/[0.02] border-b border-white/10 select-none">
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-accent/20 border border-accent/40 shadow-[0_0_15px_rgba(99,102,241,0.3)]">
              <Bot className="w-5 h-5 text-accent" />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-surface animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-wide">
                  مساعد الزعابي الذكي
                </h3>
                <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-accent/20 text-accent border border-accent/30 rounded">
                  Gemini 3.8 Flash
                </span>
              </div>
              <p className="text-[11px] text-text-dim">
                اطرح أي سؤال حول الموقع، فحص التريقرات، وصيد الباكدور
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleClearChat}
              className="p-2 rounded-lg text-text-dim hover:text-white hover:bg-white/[0.06] transition-colors"
              title="إعادة بدء المحادثة"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-text-dim hover:text-white hover:bg-white/[0.06] transition-colors"
              title="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Tools Shortcuts Banner */}
        <div className="flex items-center justify-between gap-2 px-4 py-2 bg-black/40 border-b border-white/5 text-[11px] overflow-x-auto">
          <span className="text-text-dim flex items-center gap-1 flex-shrink-0">
            <Sparkles className="w-3 h-3 text-accent" />
            أدوات سريعة بالموقع:
          </span>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {onOpenQuickScan && (
              <button
                onClick={() => { onClose(); onOpenQuickScan(); }}
                className="px-2 py-0.5 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] transition-colors"
              >
                فحص كود سريع
              </button>
            )}
            {onOpenDeobfuscator && (
              <button
                onClick={() => { onClose(); onOpenDeobfuscator(); }}
                className="px-2 py-0.5 rounded bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] transition-colors"
              >
                مختبر فك التشفير
              </button>
            )}
            {onOpenBackdoorHunter && (
              <button
                onClick={() => { onClose(); onOpenBackdoorHunter(); }}
                className="px-2 py-0.5 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] transition-colors"
              >
                صائد الباكدور
              </button>
            )}
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 select-text smooth-scroll">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';

            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-1 select-none ${
                    isUser 
                      ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400' 
                      : 'bg-accent/20 border border-accent/40 text-accent'
                  }`}
                >
                  {isUser ? (
                    <span className="text-xs font-bold font-mono">أنت</span>
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </div>

                {/* Message Bubble */}
                <div className={`max-w-[85%] group ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
                  <div
                    className={`relative p-3.5 rounded-2xl text-xs leading-relaxed ${
                      isUser
                        ? 'bg-emerald-600/15 border border-emerald-500/30 text-emerald-100 rounded-tr-none'
                        : 'bg-white/[0.04] border border-white/10 text-text-main rounded-tl-none'
                    }`}
                  >
                    {renderFormattedText(msg.text)}

                    {/* Actions bar for bot message */}
                    {!isUser && (
                      <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-text-dim select-none">
                        <span className="font-mono">{msg.timestamp}</span>
                        <button
                          onClick={() => handleCopyText(msg.id, msg.text)}
                          className="flex items-center gap-1 hover:text-white transition-colors"
                          title="نسخ الإجابة"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">تم النسخ</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>نسخ</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                  {isUser && (
                    <span className="text-[10px] text-text-dim mt-1 px-1 font-mono">
                      {msg.timestamp}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {/* Typing Loading indicator */}
          {isLoading && (
            <div className="flex gap-3 items-center">
              <div className="w-7 h-7 rounded-lg bg-accent/20 border border-accent/40 text-accent flex items-center justify-center">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="px-4 py-2.5 rounded-2xl rounded-tl-none bg-white/[0.04] border border-white/10 flex items-center gap-2">
                <span className="text-xs text-accent font-medium">جاري التفكير وصياغة الرد...</span>
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce [animation-delay:0.4s]" />
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Prompts */}
        <div className="px-4 py-2 bg-white/[0.01] border-t border-white/5">
          <div className="flex items-center gap-1.5 mb-1.5 text-[10px] text-text-dim">
            <HelpCircle className="w-3 h-3 text-accent" />
            <span>أسئلة شائعة مقترحة:</span>
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {SUGGESTIONS.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(item)}
                disabled={isLoading}
                className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white/[0.03] hover:bg-accent/15 border border-white/10 hover:border-accent/30 text-[11px] text-text-dim hover:text-white transition-all disabled:opacity-50"
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-surface border-t border-white/10">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="اكتب سؤالك هنا عن الموقع، تريقرات FiveM، أو كيفية حماية السيرفر..."
              disabled={isLoading}
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 focus:border-accent focus:outline-none text-xs text-white placeholder:text-text-dim/60 shadow-inner"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-[0_0_15px_rgba(99,102,241,0.4)] transition-all cursor-pointer"
              title="إرسال"
            >
              <Send className="w-4 h-4 rotate-180" />
            </button>
          </form>
          <div className="flex items-center justify-between mt-2 px-1 text-[10px] text-text-dim/70">
            <span>مدعوم بـ Google Gemini الذكي وخبرات أمان FiveM</span>
            <span>محرك الزعابي لفحص وتأمين السيرفرات</span>
          </div>
        </div>
      </div>
    </div>
  );
};
