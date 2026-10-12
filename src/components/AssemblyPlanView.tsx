import React from 'react';
import { Scissors, Sliders, Music, Palette, CheckSquare, Layers, Download, Sparkles } from 'lucide-react';
import { ProductionBlueprint } from '../types/director';
import { getCapCutGuideText, downloadFile } from '../utils/exportUtils';

interface AssemblyPlanViewProps {
  blueprint: ProductionBlueprint;
}

export const AssemblyPlanView: React.FC<AssemblyPlanViewProps> = ({ blueprint }) => {
  const { assemblyMasterPlan, shots } = blueprint;

  const handleDownloadCapCutGuide = () => {
    const text = getCapCutGuideText(blueprint);
    downloadFile(`CapCut-Editing-Guide-${blueprint.id}.txt`, text, 'text/plain;charset=utf-8');
  };

  return (
    <div className="space-y-8">
      {/* Overview Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                ขั้นตอนที่ 8: แผนการนำฉากทั้งหมดมาตัดต่อเป็นวิดีโอเดียว (Video Assembly Master Plan)
              </h3>
              <p className="text-xs text-slate-400">
                รวมคลิป AI วิดีโอทั้งหมดเข้าสู่โปรแกรมตัดต่อ (CapCut / DaVinci Resolve) พร้อมเสียงและกราฟิก
              </p>
            </div>
          </div>

          <button
            onClick={handleDownloadCapCutGuide}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>ดาวน์โหลดคู่มือตัดต่อ (.txt)</span>
          </button>
        </div>

        {/* Master Direction Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-1.5">
            <div className="text-xs font-bold text-indigo-400 flex items-center gap-1.5 uppercase">
              <Layers className="w-3.5 h-3.5" />
              <span>ภาพรวมการเรียงไทม์ไลน์</span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed">
              {assemblyMasterPlan.timelineSummary}
            </p>
          </div>

          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-1.5">
            <div className="text-xs font-bold text-rose-400 flex items-center gap-1.5 uppercase">
              <Music className="w-3.5 h-3.5" />
              <span>ดนตรี BGM แนะนำ</span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed">
              {assemblyMasterPlan.bgmTrackRecommendation}
            </p>
          </div>

          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-1.5">
            <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5 uppercase">
              <Palette className="w-3.5 h-3.5" />
              <span>โทนสีภาพ & LUT ที่แนะนำ</span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed">
              {assemblyMasterPlan.colorGradingLut}
            </p>
          </div>
        </div>
      </div>

      {/* Visual Timeline Sequence Strip */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h4 className="text-sm font-bold text-white flex items-center gap-2">
          <span>แผนผังลำดับช็อตบนไทม์ไลน์ตัดต่อ (Timeline Track View)</span>
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {shots.map((shot, idx) => (
            <div
              key={shot.shotNumber}
              className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col justify-between hover:border-indigo-500/50 transition group"
            >
              <div>
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span className="text-indigo-400">Shot {shot.shotNumber}</span>
                  <span className="text-[10px] text-emerald-400 font-mono">{shot.durationSec}s</span>
                </div>
                <div className="text-[11px] font-semibold text-slate-200 line-clamp-1">
                  {shot.shotType}
                </div>
                <div className="text-[10px] text-slate-400 line-clamp-2 mt-1">
                  {shot.actionDescription}
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-850 flex items-center justify-between text-[10px]">
                <span className="text-amber-400">{shot.editingDirection.cutType}</span>
                <span className="text-slate-500 font-mono">{shot.timeRange}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Step by Step CapCut Assembly Instructions */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-emerald-400" />
          <h4 className="text-sm font-bold text-white uppercase tracking-wider">
            ขั้นตอนการตัดต่อในโปรแกรม CapCut (Desktop & Mobile) ทีละขั้นตอน
          </h4>
        </div>

        <div className="space-y-3">
          {assemblyMasterPlan.capcutAssemblySteps.map((step, idx) => (
            <div
              key={idx}
              className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5 flex items-start gap-3 text-xs text-slate-200"
            >
              <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-300 flex items-center justify-center font-bold font-mono shrink-0 mt-0.5 text-[11px]">
                {idx + 1}
              </span>
              <p className="leading-relaxed">{step}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
