import React, { useState } from 'react';
import {
  FileCheck2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Download,
  Terminal,
  Code2,
  BookOpen,
  Film,
  Layers,
  Sparkles
} from 'lucide-react';
import { ProductionBlueprint } from '../types/director';
import { downloadFile } from '../utils/exportUtils';

interface Phase1DirectorInspectorProps {
  blueprint: ProductionBlueprint;
}

export const Phase1DirectorInspector: React.FC<Phase1DirectorInspectorProps> = ({ blueprint }) => {
  const [copiedJSON, setCopiedJSON] = useState(false);

  // Validate the 10 required items from Phase 1
  const validationItems = [
    {
      id: 1,
      title: '1. ชื่อวิดีโอและแนวคิดหลัก (Title & Core Concept)',
      isValid: Boolean(blueprint.projectTitle && blueprint.analysis?.coreMessage),
      value: `${blueprint.projectTitle} - ${blueprint.analysis?.coreMessage}`,
    },
    {
      id: 2,
      title: '2. กลุ่มเป้าหมายและแพลตฟอร์ม (Audience & Platform)',
      isValid: Boolean(blueprint.analysis?.targetAudience && blueprint.analysis?.platformRecommendation),
      value: `กลุ่มเป้าหมาย: ${blueprint.analysis?.targetAudience} | แพลตฟอร์ม: ${blueprint.analysis?.platformRecommendation}`,
    },
    {
      id: 3,
      title: '3. ความยาวรวม (Total Duration)',
      isValid: typeof blueprint.analysis?.estimatedTotalDurationSec === 'number' && blueprint.analysis.estimatedTotalDurationSec > 0,
      value: `${blueprint.analysis?.estimatedTotalDurationSec} วินาที (${blueprint.shots?.length || 0} ช็อต)`,
    },
    {
      id: 4,
      title: '4. รูปแบบภาพและอัตราส่วนภาพ (Visual Style & Aspect Ratio)',
      isValid: Boolean(blueprint.analysis?.aspectRatio && blueprint.analysis?.toneAndMood),
      value: `สัดส่วน: ${blueprint.analysis?.aspectRatio} | โทนภาพ: ${blueprint.analysis?.toneAndMood}`,
    },
    {
      id: 5,
      title: '5. Character Bible (คัมภีร์ตัวละครและ Consistency Lock)',
      isValid: Array.isArray(blueprint.characters) && blueprint.characters.length > 0 && Boolean(blueprint.characters[0]?.consistencyLockPrompt),
      value: `${blueprint.characters?.length || 0} ตัวละคร พร้อม Consistency Lock Prompt และ Negative Prompt`,
    },
    {
      id: 6,
      title: '6. Scene List พร้อมเวลาเริ่มต้นและสิ้นสุด (Scenes & Timestamps)',
      isValid: Array.isArray(blueprint.shots) && blueprint.shots.length > 0 && Boolean(blueprint.shots[0]?.timeRange),
      value: `ครบ ${blueprint.shots?.length || 0} ช็อต (เช่น ${blueprint.shots?.[0]?.timeRange || ''}..)`,
    },
    {
      id: 7,
      title: '7. บทพูดภาษาไทย (Thai Dialogue & Voiceover)',
      isValid: Array.isArray(blueprint.shots) && blueprint.shots.every((s) => Boolean(s.audioDesign?.thaiVoiceover)),
      value: `มีบทพูดภาษาไทยครบทุกช็อตพร้อมจังหวะน้ำเสียง`,
    },
    {
      id: 8,
      title: '8. Prompt ภาษาอังกฤษสำหรับแต่ละฉาก (Image & Motion Prompts)',
      isValid: Array.isArray(blueprint.shots) && blueprint.shots.every((s) => Boolean(s.imagePrompt?.positivePromptEn && s.motionPrompt?.videoPromptEn)),
      value: `แยก Image Prompts และ Motion Prompts ออกจากกัน 100%`,
    },
    {
      id: 9,
      title: '9. แนวทางเสียงและการตัดต่อ (Audio & Assembly Direction)',
      isValid: Boolean(blueprint.assemblyMasterPlan?.timelineSummary && blueprint.shots?.[0]?.editingDirection?.cutType),
      value: `ระบุ Cut Type, BGM, SFX และขั้นตอนประกอบร่างใน CapCut`,
    },
    {
      id: 10,
      title: '10. Checklist ตรวจคุณภาพ (Quality Control Checklist)',
      isValid: Boolean(blueprint.audit?.characterConsistencyStatus && blueprint.audit?.factCheckVerification),
      value: `ตรวจสอบความต่อเนื่องตัวละคร + แฟกต์เช็ก + รายการข้อควรแก้ไข`,
    },
  ];

  const allPassed = validationItems.every((item) => item.isValid);

  const jsonString = JSON.stringify(blueprint, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopiedJSON(true);
    setTimeout(() => setCopiedJSON(false), 2000);
  };

  const handleDownload = () => {
    downloadFile(`Phase1-AI-Director-${blueprint.id}.json`, jsonString, 'application/json');
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-indigo-950/60 via-slate-900 to-emerald-950/40 border border-indigo-500/30 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Phase 1: ต้นแบบ AI Director & ตรวจสอบโครงสร้างข้อมูล 10 รายการ</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${allPassed ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border-rose-500/30'}`}>
                  {allPassed ? '✓ ผ่านการตรวจสอบ 10/10' : 'รอการตรวจสอบ'}
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                ส่งออกผลลัพธ์เป็นมาตรฐาน JSON เพื่อให้ระบบใน Phase 2–6 นำไปประมวลผลต่อได้โดยอัตโนมัติ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition"
            >
              {copiedJSON ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>คัดลอก JSON แล้ว</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy JSON</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
            >
              <Download className="w-4 h-4" />
              <span>ดาวน์โหลด JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* 10 Items Verification Checklist */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-emerald-400" />
          <span>ผลการตรวจสอบโครงสร้างข้อมูล 10 รายการตามข้อกำหนด Phase 1</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {validationItems.map((item) => (
            <div
              key={item.id}
              className={`p-3.5 rounded-xl border flex items-start gap-3 transition ${
                item.isValid
                  ? 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                  : 'bg-rose-950/20 border-rose-500/30'
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {item.isValid ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                )}
              </div>
              <div className="min-w-0 space-y-0.5">
                <div className="text-xs font-bold text-white truncate">{item.title}</div>
                <div className="text-[11px] text-slate-400 truncate">{item.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Raw JSON Code Inspector */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
            <Code2 className="w-4 h-4 text-indigo-400" />
            <span>โครงสร้าง JSON ฉบับสมบูรณ์ (Machine-Readable Blueprint)</span>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            {blueprint.shots?.length || 0} ช็อต • Valid JSON Syntax
          </span>
        </div>

        <div className="relative">
          <pre className="bg-slate-950 border border-slate-850 rounded-xl p-4 text-[11px] font-mono text-emerald-300/90 max-h-96 overflow-y-auto overflow-x-auto leading-relaxed select-all">
            {jsonString}
          </pre>
        </div>
      </div>
    </div>
  );
};
