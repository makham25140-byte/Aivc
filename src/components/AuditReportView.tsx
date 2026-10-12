import React from 'react';
import { ShieldCheck, CheckCircle2, AlertTriangle, HelpCircle, FileCheck, BookOpen, Sparkles, Check } from 'lucide-react';
import { ContinuityAudit } from '../types/director';

interface AuditReportViewProps {
  audit: ContinuityAudit;
}

export const AuditReportView: React.FC<AuditReportViewProps> = ({ audit }) => {
  return (
    <div className="space-y-8">
      {/* Overview Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                ขั้นตอนที่ 9: ตรวจสอบความต่อเนื่องของเนื้อหาและแจ้งจุดที่ต้องแก้ไข (Continuity & Quality Audit)
              </h3>
              <p className="text-xs text-slate-400">
                ระบบผู้กำกับตรวจสอบความสอดคล้องของตัวละคร เครื่องแต่งกาย แสง จังหวะ และความถูกต้องของข้อมูล
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
                audit.characterConsistencyStatus === 'สมบูรณ์'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>สถานะความต่อเนื่อง: {audit.characterConsistencyStatus}</span>
            </span>
          </div>
        </div>

        {/* Section 1: Fact Check Verification (Strict requirement: "ห้ามแต่งข้อเท็จจริงขึ้นมาเองในวิดีโอแนวสาระความรู้") */}
        <div className="bg-gradient-to-r from-blue-950/30 via-slate-950 to-slate-950 border border-blue-500/30 rounded-xl p-5 space-y-3 mb-6">
          <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-wider">
            <BookOpen className="w-4 h-4" />
            <span>การตรวจสอบข้อเท็จจริง (Fact-Check Verification)</span>
          </div>

          <div className="space-y-2 text-xs text-slate-200">
            {audit.factCheckVerification.verificationNotes.map((note, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">{note}</p>
              </div>
            ))}

            {audit.factCheckVerification.potentialHallucinationAlerts?.length > 0 && (
              <div className="bg-rose-950/30 border border-rose-500/30 p-3 rounded-lg text-rose-300 mt-2 space-y-1">
                <div className="font-bold flex items-center gap-1 text-[11px]">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>จุดที่ต้องระวังความคลาดเคลื่อน (Potential Hallucination Alert):</span>
                </div>
                {audit.factCheckVerification.potentialHallucinationAlerts.map((alert, aIdx) => (
                  <p key={aIdx} className="text-[11px]">&bull; {alert}</p>
                ))}
              </div>
            )}

            {audit.factCheckVerification.sourcesOrCheckpoints?.length > 0 && (
              <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                <span className="font-semibold text-slate-300">แหล่งอ้างอิงและหลักการตรวจสอบ:</span>{' '}
                {audit.factCheckVerification.sourcesOrCheckpoints.join(' • ')}
              </div>
            )}
          </div>
        </div>

        {/* Audit Category Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Character Consistency Notes */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
            <h4 className="text-xs font-bold text-indigo-400 flex items-center gap-1.5 uppercase">
              <FileCheck className="w-3.5 h-3.5" />
              <span>ความต่อเนื่องของตัวละคร (Character Audit)</span>
            </h4>
            <div className="space-y-1.5 text-xs text-slate-300">
              {audit.characterAuditNotes.map((note, idx) => (
                <div key={idx} className="flex items-start gap-1.5">
                  <span className="text-indigo-400">&bull;</span>
                  <p>{note}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Wardrobe & Props */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
            <h4 className="text-xs font-bold text-rose-400 flex items-center gap-1.5 uppercase">
              <FileCheck className="w-3.5 h-3.5" />
              <span>เครื่องแต่งกาย & อุปกรณ์ประกอบฉาก (Wardrobe Check)</span>
            </h4>
            <div className="space-y-1.5 text-xs text-slate-300">
              {audit.wardrobeAndPropsCheck.map((note, idx) => (
                <div key={idx} className="flex items-start gap-1.5">
                  <span className="text-rose-400">&bull;</span>
                  <p>{note}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Lighting Continuity */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
            <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5 uppercase">
              <FileCheck className="w-3.5 h-3.5" />
              <span>ความต่อเนื่องของแสงและบรรยากาศ (Lighting Continuity)</span>
            </h4>
            <div className="space-y-1.5 text-xs text-slate-300">
              {audit.lightingContinuityCheck.map((note, idx) => (
                <div key={idx} className="flex items-start gap-1.5">
                  <span className="text-amber-400">&bull;</span>
                  <p>{note}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Pacing Check */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
            <h4 className="text-xs font-bold text-purple-400 flex items-center gap-1.5 uppercase">
              <FileCheck className="w-3.5 h-3.5" />
              <span>จังหวะการเล่าเรื่อง (Pacing & Retention)</span>
            </h4>
            <div className="space-y-1.5 text-xs text-slate-300">
              {audit.editingPacingCheck.map((note, idx) => (
                <div key={idx} className="flex items-start gap-1.5">
                  <span className="text-purple-400">&bull;</span>
                  <p>{note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Director Action Items */}
        <div className="mt-6 pt-5 border-t border-slate-800 space-y-3">
          <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>คำแนะนำจากผู้กำกับก่อนเริ่มกระบวนการผลิต (Director Action Checklist)</span>
          </h4>
          <div className="space-y-2">
            {audit.directorActionItems.map((item, idx) => (
              <div
                key={idx}
                className="bg-slate-950 p-3 rounded-xl border border-slate-850 flex items-start gap-2.5 text-xs text-slate-200"
              >
                <div className="w-4 h-4 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3" />
                </div>
                <p className="leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
