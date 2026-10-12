import React from 'react';
import { X, ShieldAlert, Cpu, ExternalLink, Key, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { ProviderStatusInfo } from '../types/director';

interface ProviderStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  errorNotice?: {
    title: string;
    message: string;
    requirementsNotice?: string;
    setupInstructions?: string;
  } | null;
  providerStatuses?: {
    imageProviders: ProviderStatusInfo[];
    videoProviders: ProviderStatusInfo[];
  } | null;
  onOpenFreeTool?: () => void;
}

export const ProviderStatusModal: React.FC<ProviderStatusModalProps> = ({
  isOpen,
  onClose,
  errorNotice,
  providerStatuses,
  onOpenFreeTool,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full my-8 overflow-hidden shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">
                สถานะการเชื่อมต่อ AI Model (AIVC V3 Direct Engine)
              </h3>
              <p className="text-[11px] text-slate-400">
                ตรวจสอบความพร้อมของโมเดลสร้างภาพและวิดีโอจริงตามข้อกำหนดระบบ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-xs text-slate-300 max-h-[75vh] overflow-y-auto">
          {/* Active Error / Notice Alert if triggered by generation attempt */}
          {errorNotice && (
            <div className="bg-amber-950/30 border border-amber-500/40 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{errorNotice.title}</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                {errorNotice.message}
              </p>
              {errorNotice.requirementsNotice && (
                <div className="bg-slate-950/80 p-3 rounded-lg border border-amber-500/20 text-[11px] text-amber-200/90 font-mono">
                  {errorNotice.requirementsNotice}
                </div>
              )}
              {errorNotice.setupInstructions && (
                <div className="text-[11px] text-slate-300 space-y-1 pt-1">
                  <div className="font-semibold text-white">ขั้นตอนการตั้งค่า:</div>
                  <pre className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-[10px] text-slate-300 font-mono whitespace-pre-wrap">
                    {errorNotice.setupInstructions}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Real AI Model Provider Verification Cards */}
          <div className="space-y-4">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center justify-between">
              <span>ผลการตรวจสอบโมเดลจริง (Live Provider Diagnostics)</span>
              <span className="text-[10px] font-normal text-slate-400">
                ความจริงใจและโปร่งใส (No Fake Images / No Simulated Video)
              </span>
            </h4>

            {/* Image Providers */}
            <div className="space-y-2.5">
              <div className="text-[11px] font-semibold text-indigo-300 flex items-center gap-1.5">
                <span>1. โมเดลสร้างภาพ (Image Generation Providers)</span>
              </div>

              {providerStatuses?.imageProviders?.map((p) => (
                <div
                  key={p.id}
                  className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-white text-xs">{p.name}</div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        p.isAvailable
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {p.tier}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {p.statusMessage}
                  </p>

                  {p.setupInstructions && (
                    <p className="text-[10px] text-slate-400 bg-slate-900 p-2 rounded-lg border border-slate-800/80">
                      💡 {p.setupInstructions}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Video Providers */}
            <div className="space-y-2.5 pt-2">
              <div className="text-[11px] font-semibold text-rose-300 flex items-center gap-1.5">
                <span>2. โมเดลสร้างวิดีโอ (Video Generation Providers)</span>
              </div>

              {providerStatuses?.videoProviders?.map((p) => (
                <div
                  key={p.id}
                  className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-white text-xs">{p.name}</div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        p.isAvailable
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {p.tier}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {p.statusMessage}
                  </p>

                  {p.setupInstructions && (
                    <p className="text-[10px] text-slate-400 bg-slate-900 p-2 rounded-lg border border-slate-800/80">
                      💡 {p.setupInstructions}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Practical Free Workflow Alternative (Zero-Cost Guarantee) */}
          <div className="bg-indigo-950/20 border border-indigo-500/30 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs">
              <Info className="w-4 h-4 text-indigo-400" />
              <span>ทางเลือกฟรี 100% สำหรับผู้ใช้ที่ไม่มี Paid API Key:</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              ในระหว่างที่ยังไม่ได้เปิดใช้งาน Google Cloud Billing คุณยังคงสามารถใช้ฟังก์ชัน{' '}
              <strong className="text-white">"Copy Prompt & Open Tool"</strong> ในแต่ละ Scene เพื่อนำ Prompt ไปสร้างภาพใน{' '}
              <strong className="text-white">Bing Image Creator / SeaArt</strong> และสร้างคลิปฟรีใน{' '}
              <strong className="text-white">Kling AI (ฟรี 66 เครดิต/วัน)</strong> แล้วนำภาพ/คลิปที่ได้มาอัปโหลดหรือแปะ URL กลับเข้ามาเก็บไว้ในระบบได้ทันที!
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex items-center justify-between gap-3">
          <span className="text-[11px] text-slate-500">
            AIVC V3 Core • Direct Media Engine
          </span>
          <div className="flex items-center gap-2">
            {onOpenFreeTool && (
              <button
                onClick={() => {
                  onClose();
                  onOpenFreeTool();
                }}
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
              >
                เปิดเครื่องมือฟรี
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
