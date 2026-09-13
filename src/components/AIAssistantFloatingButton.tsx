import React, { useState } from 'react';
import { Bot, Sparkles, MessageSquare, X } from 'lucide-react';

interface AIAssistantFloatingButtonProps {
  onClick: () => void;
  isOpen: boolean;
}

export const AIAssistantFloatingButton: React.FC<AIAssistantFloatingButtonProps> = ({
  onClick,
  isOpen
}) => {
  const [showTooltip, setShowTooltip] = useState(true);

  return (
    <div className="fixed bottom-5 left-5 z-40 flex flex-col items-start gap-2 select-none" dir="rtl">
      {/* Interactive Tooltip Callout bubble on initial load */}
      {showTooltip && !isOpen && (
        <div className="relative flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface/95 border border-accent/40 shadow-[0_4px_20px_rgba(99,102,241,0.25)] text-xs text-white backdrop-blur-md transition-all duration-300">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span className="font-bold text-accent">مساعد الزعابي الذكي:</span>
            <span className="text-text-dim text-[11px]">عندك سؤال عن الموقع؟ اسألني هنا!</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowTooltip(false);
            }}
            className="text-text-dim hover:text-white p-0.5 transition-colors cursor-pointer"
            title="إخفاء التنبيه"
          >
            <X className="w-3 h-3" />
          </button>
          {/* Arrow pointing down */}
          <div className="absolute -bottom-1 left-6 w-2 h-2 bg-surface border-b border-r border-accent/40 rotate-45" />
        </div>
      )}

      {/* Main Floating Trigger Button */}
      <button
        onClick={onClick}
        className="group relative flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-accent/90 to-indigo-600 hover:from-accent hover:to-indigo-500 text-white shadow-[0_4px_20px_rgba(99,102,241,0.35)] hover:shadow-[0_6px_25px_rgba(99,102,241,0.5)] border border-white/20 transition-all duration-300 ease-out cursor-pointer hover:-translate-y-0.5 active:translate-y-0 active:scale-98"
        title="فتح مساعد الزعابي الذكي (AI)"
      >
        <div className="relative">
          <Bot className="w-5 h-5 text-white transition-transform duration-300 group-hover:scale-110" />
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 border-2 border-indigo-600" />
        </div>

        <div className="flex flex-col items-start leading-tight">
          <span className="text-xs font-bold tracking-wide flex items-center gap-1">
            الذكاء الاصطناعي
            <span className="text-[9px] px-1 py-0.2 bg-white/20 rounded font-mono">AI</span>
          </span>
          <span className="text-[9px] text-white/80 font-normal">
            اسأل عن أي شيء بالموقع
          </span>
        </div>
      </button>
    </div>
  );
};
