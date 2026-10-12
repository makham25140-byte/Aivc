import React from 'react';
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  StopCircle
} from 'lucide-react';
import { BatchImageProgress } from '../hooks/useMediaGeneration';
import { ProductionBlueprint } from '../types/director';

interface BatchImageProgressModalProps {
  progress: BatchImageProgress;
  blueprint: ProductionBlueprint;
  onCancel: () => void;
  onClose: () => void;
  onRetryFailed: () => void;
}

export const BatchImageProgressModal: React.FC<BatchImageProgressModalProps> = ({
  progress,
  blueprint,
  onCancel,
  onClose,
  onRetryFailed,
}) => {
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);

  const percentage = progress.total > 0
    ? Math.round(((progress.succeededCount + progress.failedCount) / progress.total) * 100)
    : 0;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleOpenFreeTool = () => {
    const url = blueprint.mediaToolsConfig?.imageGeneratorUrl || 'https://copilot.microsoft.com/images/create';
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              {progress.isActive ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : progress.failedCount > 0 ? (
                <AlertCircle className="w-4 h-4 text-amber-400" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>สร้างภาพทุกฉากในโปรเจกต์ (Generate All Images)</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                {progress.isActive
                  ? `กำลังประมวลผลฉากที่ ${progress.current} จาก ${progress.total} (${progress.currentSceneId})...`
                  : progress.isAborted
                  ? 'หยุดการประมวลผลแล้ว'
                  : 'การประมวลผลเสร็จสิ้น'}
              </p>
            </div>
          </div>

          {!progress.isActive && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Progress Bar & Stats */}
        <div className="px-5 py-4 border-b border-slate-800/80 bg-slate-900/50 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium">ความคืบหน้า</span>
            <span className="font-mono font-bold text-indigo-400">{percentage}%</span>
          </div>

          <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                progress.failedCount > 0 && progress.succeededCount === 0
                  ? 'bg-rose-500'
                  : 'bg-gradient-to-r from-indigo-500 to-emerald-500'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] pt-1">
            <div className="flex items-center gap-3">
              <span className="text-slate-400">
                ทั้งหมด: <strong className="text-white">{progress.total}</strong> ฉาก
              </span>
              <span className="text-emerald-400">
                สำเร็จ: <strong>{progress.succeededCount}</strong>
              </span>
              <span className="text-rose-400">
                ไม่สำเร็จ: <strong>{progress.failedCount}</strong>
              </span>
            </div>

            {progress.isActive && (
              <button
                onClick={onCancel}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition text-[10px]"
              >
                <StopCircle className="w-3 h-3" />
                <span>ยกเลิก (Stop)</span>
              </button>
            )}
          </div>
        </div>

        {/* Scene by Scene Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 divide-y divide-slate-800/50">
          {blueprint.shots.map((shot) => {
            const result = progress.results.find((r) => r.shotNumber === shot.shotNumber);
            const isCurrentlyGenerating = progress.isActive && progress.current === shot.shotNumber;

            return (
              <div key={shot.shotNumber} className="pt-2 first:pt-0 flex items-start justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-indigo-300">{shot.sceneId || `SC-${shot.shotNumber}`}</span>
                    <span className="text-slate-400 text-[11px]">ช็อต {shot.shotNumber} ({shot.shotType})</span>
                    {shot.characterIds && shot.characterIds.length > 0 && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-800/50">
                        {shot.characterIds.length} ตัวละคร
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1">
                    {shot.imagePrompt?.positivePromptEn}
                  </p>

                  {result && !result.success && result.error && (
                    <div className="text-[10px] text-rose-400 bg-rose-950/30 border border-rose-800/40 rounded px-2 py-1 mt-1">
                      ⚠️ {result.error}
                    </div>
                  )}
                </div>

                <div className="shrink-0 flex items-center gap-1.5">
                  {isCurrentlyGenerating ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] font-medium animate-pulse border border-indigo-500/40">
                      <Loader2 className="w-2.5 h-2.5 animate-spin" />
                      <span>กำลังสร้าง...</span>
                    </span>
                  ) : result?.success || shot.generatedImage ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-medium border border-emerald-500/40">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      <span>พร้อมใช้งาน</span>
                    </span>
                  ) : result && !result.success ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[10px] font-medium border border-rose-500/40">
                      <AlertCircle className="w-2.5 h-2.5" />
                      <span>ไม่สำเร็จ</span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500">รอดำเนินการ</span>
                  )}

                  <button
                    onClick={() => handleCopy(shot.imagePrompt.positivePromptEn, `prompt-${shot.shotNumber}`)}
                    title="คัดลอก Prompt"
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  >
                    {copiedKey === `prompt-${shot.shotNumber}` ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Notice for Free Tier Alternatives if failures occurred */}
        {progress.failedCount > 0 && !progress.isActive && (
          <div className="px-5 py-3 bg-amber-950/20 border-t border-amber-500/30 text-[11px] text-amber-200/90 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-amber-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>ทางเลือกสร้างภาพฟรี 100% (No Cost):</span>
            </div>
            <p className="text-[11px] text-slate-300">
              Google AI Studio มีโควตาโมเดลสร้างภาพเป็น 0 บนบัญชี Free Tier คุณสามารถใช้ปุ่ม "Copy" คัดลอก Prompt จากฉากที่ไม่สำเร็จไปสร้างใน Bing Image Creator หรือ SeaArt.ai ฟรี แล้วอัปโหลดกลับเข้ามาในฉากได้ทันที!
            </p>
          </div>
        )}

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-slate-800 flex items-center justify-between bg-slate-950/60">
          <button
            onClick={handleOpenFreeTool}
            className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition font-medium"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>เปิด Bing Image Creator (ฟรี)</span>
          </button>

          <div className="flex items-center gap-2">
            {!progress.isActive && progress.failedCount > 0 && (
              <button
                onClick={onRetryFailed}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-sm transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>ลองใหม่เฉพาะฉากที่ไม่สำเร็จ</span>
              </button>
            )}

            {!progress.isActive && (
              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition"
              >
                ปิดหน้าต่าง
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
