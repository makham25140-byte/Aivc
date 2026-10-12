import React, { useState } from 'react';
import {
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Wrench,
  Check,
  Info,
  ChevronDown,
  ChevronUp,
  Tag,
  HelpCircle,
  Copy
} from 'lucide-react';
import { ShotDetail, CharacterProfile, EnvironmentAnchor } from '../types/director';
import {
  generateCharacterAwarePrompts,
  detectConsistencyConflicts,
  repairConsistencyConflicts,
} from '../utils/consistencyEngine';

interface PromptConsistencyInspectorProps {
  shot: ShotDetail;
  assignedCharacters: CharacterProfile[];
  environment?: EnvironmentAnchor;
  onUpdateShot: (updatedShot: ShotDetail) => void;
}

export const PromptConsistencyInspector: React.FC<PromptConsistencyInspectorProps> = ({
  shot,
  assignedCharacters,
  environment,
  onUpdateShot,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showConfirmRegenerate, setShowConfirmRegenerate] = useState(false);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
  const [justRepaired, setJustRepaired] = useState(false);

  // Check conflicts
  const conflictResult = detectConsistencyConflicts(shot, assignedCharacters);
  const hasConflicts = conflictResult.hasConflict;

  const handleRegeneratePrompts = async () => {
    setIsGenerating(true);
    setShowConfirmRegenerate(false);

    try {
      // First attempt API call to server
      const res = await fetch('/api/director/generate-scene-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shot,
          characters: assignedCharacters,
          environment,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          onUpdateShot({
            ...shot,
            imagePrompt: {
              ...shot.imagePrompt,
              positivePromptEn: data.positivePromptEn,
              negativePrompt: data.negativePrompt,
            },
            motionPrompt: {
              ...shot.motionPrompt,
              videoPromptEn: data.videoPromptEn,
              cameraMotionDirective: data.cameraMotionDirective,
            },
            injectedCharacterSummary: data.injectedDetails,
            conflictWarnings: data.conflictWarnings,
            promptConsistencyStatus: data.conflictWarnings.length > 0 ? 'CONFLICT_DETECTED' : 'CONSISTENT',
            isCustomPromptEdited: false,
          });
          return;
        }
      }
    } catch (err) {
      console.warn('API prompt generation fallback to local engine:', err);
    } finally {
      setIsGenerating(false);
    }

    // Client-side rule engine fallback
    const result = generateCharacterAwarePrompts(shot, assignedCharacters, environment);
    const conflicts = detectConsistencyConflicts(
      { ...shot, imagePrompt: { ...shot.imagePrompt, positivePromptEn: result.positivePromptEn } },
      assignedCharacters
    );

    onUpdateShot({
      ...shot,
      imagePrompt: {
        ...shot.imagePrompt,
        positivePromptEn: result.positivePromptEn,
        negativePrompt: result.negativePrompt,
      },
      motionPrompt: {
        ...shot.motionPrompt,
        videoPromptEn: result.videoPromptEn,
        cameraMotionDirective: result.cameraMotionDirective,
      },
      injectedCharacterSummary: result.injectedDetails,
      conflictWarnings: conflicts.warnings,
      promptConsistencyStatus: conflicts.hasConflict ? 'CONFLICT_DETECTED' : 'CONSISTENT',
      isCustomPromptEdited: false,
    });
  };

  const handleRepairConflicts = () => {
    const repaired = repairConsistencyConflicts(shot, assignedCharacters);
    onUpdateShot(repaired);
    setJustRepaired(true);
    setTimeout(() => setJustRepaired(false), 2500);
  };

  const injectedSummary = shot.injectedCharacterSummary || [
    assignedCharacters.length > 0
      ? `ตัวละครที่ล็อค: ${assignedCharacters.map((c) => c.name).join(', ')}`
      : 'ไม่มีตัวละครในฉากนี้ (Scenery / Visuals)',
    `มุมกล้อง: ${shot.shotType}`,
    `ความต่อเนื่อง: ${shot.continuityTag || 'รักษาโทนสีและแสง'}`,
  ];

  return (
    <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-3">
      {/* Header and Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          {hasConflicts ? (
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          ) : (
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <div>
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>การควบคุมความต่อเนื่อง (Character Consistency Lock)</span>
              {hasConflicts ? (
                <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  พบข้อขัดแย้ง
                </span>
              ) : (
                <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  สอดคล้องตามตัวละคร
                </span>
              )}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasConflicts && (
            <button
              onClick={handleRepairConflicts}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-sm transition touch-manipulation min-h-[36px]"
              title="ซ่อมแซมคำใน Prompt ให้กลับมาตรงกับชุดและผมที่ล็อคไว้"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>{justRepaired ? 'ซ่อมแซมแล้ว!' : 'ซ่อมแซมความสอดคล้อง'}</span>
            </button>
          )}

          <button
            onClick={() => {
              if (shot.isCustomPromptEdited) {
                setShowConfirmRegenerate(true);
              } else {
                handleRegeneratePrompts();
              }
            }}
            disabled={isGenerating}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white border border-indigo-500/40 text-xs font-semibold transition touch-manipulation min-h-[36px]"
            title="สร้าง Prompt ใหม่ตามตัวละครที่เลือกในฉากนี้"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'กำลังสร้าง Prompt...' : 'สร้าง Prompt ตามตัวละคร'}</span>
          </button>
        </div>
      </div>

      {/* Confirmation Dialog if User Previously Edited Prompt */}
      {showConfirmRegenerate && (
        <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-500/30 text-xs text-amber-200 space-y-2">
          <div className="font-semibold flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>คำเตือน: คุณเคยแก้ไขข้อความ Prompt นี้ด้วยตนเอง</span>
          </div>
          <p className="text-[11px] text-slate-300">
            การสร้าง Prompt ใหม่จะเขียนทับการแก้ไขเดิมด้วยข้อมูลตัวละครที่ล็อคไว้ คุณต้องการดำเนินการต่อหรือไม่?
          </p>
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              onClick={() => setShowConfirmRegenerate(false)}
              className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:text-white text-xs"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleRegeneratePrompts}
              className="px-3 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold"
            >
              ยืนยันสร้างใหม่
            </button>
          </div>
        </div>
      )}

      {/* Conflict Warning Alerts if Found */}
      {hasConflicts && (
        <div className="bg-amber-950/20 border border-amber-500/30 rounded-lg p-2.5 space-y-1.5 text-xs text-amber-300">
          <div className="font-semibold flex items-center gap-1 text-[11px]">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>ตรวจพบคำอธิบายที่ขัดแย้งกับโปรไฟล์ตัวละครที่ล็อคไว้:</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-300">
            {conflictResult.warnings.map((w, idx) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Injected Breakdown Preview Badges (Feature 2 Requirement) */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-lg p-2.5 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            <span>องค์ประกอบตัวละครและฉากที่ผนวกลงใน Prompt (Injected Details Preview):</span>
          </span>
          <button
            onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
            className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5 font-medium"
          >
            {isDetailsExpanded ? 'ย่อรายละเอียด' : 'ดูคำอธิบายเต็ม'}
            {isDetailsExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {injectedSummary.map((item, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-indigo-200 border border-slate-700 max-w-full truncate"
            >
              <Tag className="w-2.5 h-2.5 text-indigo-400 shrink-0" />
              <span className="truncate">{item}</span>
            </span>
          ))}
        </div>

        {isDetailsExpanded && (
          <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-300 space-y-1.5">
            <div>
              <span className="text-slate-400 font-medium">ตัวละครที่ถูกเลือก ({assignedCharacters.length} คน):</span>
              {assignedCharacters.length === 0 ? (
                <span className="text-slate-400 ml-1">ไม่มีตัวละคร (เน้นฉาก/สเปเชียลเอฟเฟกต์)</span>
              ) : (
                <div className="mt-1 space-y-1">
                  {assignedCharacters.map((c) => (
                    <div key={c.id} className="p-1.5 rounded bg-slate-950 border border-slate-800 font-mono text-[10px]">
                      <span className="text-indigo-300 font-bold">{c.name}</span>: {c.canonicalClothing || c.visualIdentity.clothing} | {c.visualIdentity.faceAndHair}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="text-[10px] text-slate-400 flex items-start gap-1 pt-1">
              <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
              <span>
                <strong>หมายเหตุทางเทคนิค:</strong> ระบบล็อคความต่อเนื่องทำงานในระดับ Prompt (Semantic Token Control) แยกคุณลักษณะถาวรออกจากแอ็กชันเฉพาะฉาก หากโมเดลรองรับ Reference Image แนะนำให้นำภาพตัวละครไปแนบในโมเดลด้วย
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
