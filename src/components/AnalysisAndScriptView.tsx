import React from 'react';
import { Target, Users, Sparkles, MessageSquare, Clock, Smartphone, Zap, Film, Volume2 } from 'lucide-react';
import { ProductionBlueprint } from '../types/director';
import { speechSynthesizer } from '../utils/speechUtils';

interface AnalysisAndScriptViewProps {
  blueprint: ProductionBlueprint;
}

export const AnalysisAndScriptView: React.FC<AnalysisAndScriptViewProps> = ({ blueprint }) => {
  const { analysis, scriptFlow } = blueprint;

  const playScriptSection = (text: string) => {
    speechSynthesizer.speak(text);
  };

  return (
    <div className="space-y-8">
      {/* 1. Strategic Analysis Section (Requirement 1) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              ขั้นตอนที่ 1: การวิเคราะห์แนววิดีโอ กลุ่มผู้ชม และเป้าหมายเชิงกลยุทธ์
            </h3>
            <p className="text-xs text-slate-400">
              วางแกนหลักของเนื้อหาเพื่อกำหนดทิศทางการผลิตและจับความสนใจของผู้ชมให้อยู่หมัด
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Genre & Platform */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
              <Film className="w-3.5 h-3.5" />
              <span>แนววิดีโอ & แพลตฟอร์ม</span>
            </div>
            <div className="text-sm font-bold text-white">{analysis.genre}</div>
            <div className="text-xs text-slate-400">
              เหมาะสำหรับ: <span className="text-indigo-300 font-medium">{analysis.platformRecommendation}</span> ({analysis.aspectRatio})
            </div>
          </div>

          {/* Target Audience */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold uppercase tracking-wider">
              <Users className="w-3.5 h-3.5" />
              <span>กลุ่มผู้ชมเป้าหมาย (Target Audience)</span>
            </div>
            <div className="text-sm font-semibold text-slate-200">{analysis.targetAudience}</div>
            <div className="text-xs text-slate-400">
              ระยะเวลาเป้าหมาย: <span className="text-emerald-400 font-bold">{analysis.estimatedTotalDurationSec} วินาที</span>
            </div>
          </div>

          {/* Core Message & Goal */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>เป้าหมาย & สาระสำคัญ</span>
            </div>
            <div className="text-xs font-semibold text-amber-200">{analysis.objective}</div>
            <div className="text-xs text-slate-300 italic pt-1 border-t border-slate-800">
              "{analysis.coreMessage}"
            </div>
          </div>

          {/* Tone & Mood */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-purple-400 text-xs font-semibold uppercase tracking-wider">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>โทนและอารมณ์ (Tone & Mood)</span>
            </div>
            <div className="text-xs font-medium text-purple-200 leading-relaxed">
              {analysis.toneAndMood}
            </div>
          </div>

          {/* Viral Hook Strategy */}
          <div className="md:col-span-2 bg-gradient-to-r from-amber-950/30 via-slate-950 to-slate-950 p-4 rounded-xl border border-amber-500/30 space-y-1.5">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5" />
              <span>กลยุทธ์การเปิดเรื่องเพื่อหยุดนิ้วโป้งคนดู (Hook Strategy - 3 วินาทีแรก)</span>
            </div>
            <div className="text-xs text-amber-100 font-medium leading-relaxed">
              {analysis.hookStrategy}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Full Script Breakdown (Requirement 2) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                ขั้นตอนที่ 2: บทฉบับเต็มและโครงสร้างเวลา (Full Script & Timing)
              </h3>
              <p className="text-xs text-slate-400">
                เขียนบทที่ออกแบบจังหวะให้พอดีกับ {analysis.estimatedTotalDurationSec} วินาที โดยไม่สั้นหรือยาวจนเกินไป
              </p>
            </div>
          </div>

          <span className="text-xs font-mono px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg">
            เวลาเป้าหมาย: {analysis.estimatedTotalDurationSec}s
          </span>
        </div>

        <div className="space-y-4">
          {scriptFlow && scriptFlow.length > 0 ? (
            scriptFlow.map((item, idx) => (
              <div
                key={idx}
                className="bg-slate-950 border border-slate-800 rounded-xl p-4 transition-all hover:border-slate-700 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 text-xs font-bold flex items-center justify-center font-mono">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-indigo-400">
                      {item.section}
                    </span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800/80 text-emerald-400">
                      {item.timestamp}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 italic">
                      อารมณ์: <strong className="text-slate-300">{item.emotionalBeat}</strong>
                    </span>
                    <button
                      onClick={() => playScriptSection(item.thaiScript)}
                      title="ฟังเสียงอ่านท่อนนี้"
                      className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Thai Script Dialogue */}
                <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 text-sm text-slate-100 font-medium leading-relaxed">
                  "{item.thaiScript}"
                </div>

                {/* Visual Intent */}
                <div className="text-xs text-slate-400 flex items-center gap-1.5">
                  <span className="text-indigo-400 font-medium">ภาพที่สื่อ:</span>
                  <span>{item.visualIntent}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-slate-400 text-xs">
              ไม่มีข้อมูลโครงสร้างบทเสริม
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
