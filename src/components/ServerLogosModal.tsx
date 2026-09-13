import React from 'react';
import { X, Download, Image as ImageIcon, ExternalLink, Archive } from 'lucide-react';
import { ServerLogo } from '../types';

interface ServerLogosModalProps {
  isOpen: boolean;
  onClose: () => void;
  logos: ServerLogo[];
}

export const ServerLogosModal: React.FC<ServerLogosModalProps> = ({ isOpen, onClose, logos }) => {
  if (!isOpen) return null;

  const downloadSingleLogo = (logo: ServerLogo) => {
    const a = document.createElement('a');
    a.href = logo.dataUrl;
    a.download = logo.fileName;
    a.click();
  };

  const downloadAllLogosAsZip = async () => {
    if (logos.length === 0) return;
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      
      for (const logo of logos) {
        // extract base64 data
        const base64Data = logo.dataUrl.split(',')[1];
        if (base64Data) {
          zip.file(logo.fileName, base64Data, { base64: true });
        }
      }

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `server_logos_${Date.now()}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to bundle logos into zip:', err);
      // Fallback: download individually
      logos.forEach(downloadSingleLogo);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6 animate-modal-backdrop"
      onClick={onClose}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl bg-surface border border-accent/30 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[88vh] animate-modal-content"
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-border bg-bg/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white tracking-tight">
                  معرض شعارات ولوقوهات السيرفر المستخرجة
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {logos.length} شعار
                </span>
              </div>
              <p className="text-[11px] text-text-dim mt-0.5">
                تم استخراج جميع صور وشعارات السيرفر تلقائياً من ملفات الحزمة ويمكنك تحميلها بجودتها الأصلية
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {logos.length > 0 && (
              <button
                onClick={downloadAllLogosAsZip}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-600 text-black transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)] cursor-pointer"
                title="تحميل كافة الشعارات في حزمة ZIP واحدة"
              >
                <Archive className="w-3.5 h-3.5 text-black" />
                <span>تحميل الكل (ZIP)</span>
              </button>
            )}
            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg text-text-dim hover:text-white hover:bg-white/5 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto max-h-[calc(88vh-140px)]">
          {logos.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-text-dim">
                <ImageIcon className="w-8 h-8 opacity-40" />
              </div>
              <p className="text-sm font-bold text-white">لم يتم العثور على شعارات حتى الآن</p>
              <p className="text-xs text-text-dim max-w-md mx-auto">
                قم برفع ملف ZIP يحتوي على ملفات السيرفر أو السكربتات (أيقونات، صور شعار السيرفر، أو شاشات التحميل)، وسيتم سحبها تلقائياً هنا.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {logos.map((logo) => (
                <div 
                  key={logo.id}
                  className="group bg-bg border border-border hover:border-amber-500/50 rounded-xl overflow-hidden transition-all duration-300 flex flex-col shadow-sm hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]"
                >
                  {/* Image Preview Area */}
                  <div className="relative h-40 w-full bg-black/40 flex items-center justify-center p-3 border-b border-border/60 overflow-hidden pattern-checkered">
                    <img 
                      src={logo.dataUrl} 
                      alt={logo.fileName}
                      className="max-h-full max-w-full object-contain rounded transition-transform duration-300 group-hover:scale-105 drop-shadow-md"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-2 left-2">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-black/70 text-amber-300 border border-amber-500/30 backdrop-blur-sm">
                        {logo.extension.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Details & Actions */}
                  <div className="p-3 flex flex-col justify-between flex-1 gap-2.5">
                    <div>
                      <h4 className="text-xs font-bold text-white font-mono truncate" dir="ltr" title={logo.fileName}>
                        {logo.fileName}
                      </h4>
                      <p className="text-[10px] text-text-dim font-mono truncate mt-0.5" dir="ltr" title={logo.filePath}>
                        {logo.filePath}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-text-dim/80 font-mono">
                        <span>الحجم: {formatFileSize(logo.size)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-border/40">
                      <button
                        onClick={() => downloadSingleLogo(logo)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 hover:text-amber-200 text-xs font-bold transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>تحميل اللوقو</span>
                      </button>

                      <a
                        href={logo.dataUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-text-dim hover:text-white border border-border transition-colors"
                        title="معاينة بالحجم الكامل"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-bg/50 flex items-center justify-between text-xs text-text-dim">
          <span>العدد الإجمالي: <strong className="text-white font-mono">{logos.length}</strong> شعار مكتشف</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
