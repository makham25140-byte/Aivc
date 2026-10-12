import React, { useRef } from 'react';
import { Clapperboard, Sparkles, BookOpen, Download, RotateCcw, ShieldCheck, Film, FileCode, Upload, Save } from 'lucide-react';
import { ProductionBlueprint } from '../types/director';
import { parseImportedProjectJSON } from '../utils/exportUtils';

interface HeaderProps {
  onOpenPipelineGuide: () => void;
  onOpenExportModal: () => void;
  onSaveProject?: () => void;
  onExportProjectJSON?: () => void;
  onImportProjectJSON?: (imported: ProductionBlueprint) => void;
  onResetProject: () => void;
  onSelectSample: () => void;
  projectTitle: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenPipelineGuide,
  onOpenExportModal,
  onSaveProject,
  onExportProjectJSON,
  onImportProjectJSON,
  onResetProject,
  onSelectSample,
  projectTitle,
}) => {
  const jsonInputRef = useRef<HTMLInputElement>(null);

  const handleJsonFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onImportProjectJSON) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const imported = parseImportedProjectJSON(text);
        onImportProjectJSON(imported);
      } catch (err: any) {
        alert('ไม่สามารถนำเข้าไฟล์ JSON ได้: ' + (err.message || 'โครงสร้างไม่ถูกต้อง'));
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-rose-500/20 shrink-0">
            <Clapperboard className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">
                AIVC V3.3.3
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gradient-to-r from-blue-500/20 to-teal-500/20 text-teal-300 border border-teal-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                Google Flow Studio & Character Consistency
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate max-w-xs sm:max-w-md">
              {projectTitle || 'ระบบจัดการผลิตภาพและวิดีโอ AI อัตโนมัติผ่าน Google Flow (AIVC V3.3.3)'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onSelectSample}
            title="โหลดตัวอย่างวิดีโอสำเร็จรูป"
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-lg transition-colors min-h-[36px]"
          >
            <Film className="w-3.5 h-3.5 text-indigo-400" />
            ตัวอย่าง 60s
          </button>

          <button
            onClick={onOpenPipelineGuide}
            title="ดูวิธีสร้างวิดีโอแบบฟรี 100%"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg transition-colors min-h-[36px]"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">คู่มือสร้างฟรี 100%</span>
            <span className="sm:hidden">วิธีฟรี</span>
          </button>

          {/* Save Project button (Persistence) */}
          {onSaveProject && (
            <button
              onClick={onSaveProject}
              title="บันทึกโปรเจกต์ลงในเบราว์เซอร์ (LocalStorage)"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-600/20 hover:bg-emerald-600 hover:text-white border border-emerald-500/40 rounded-lg transition-all min-h-[36px]"
            >
              <Save className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">บันทึกโปรเจกต์</span>
              <span className="sm:hidden">บันทึก</span>
            </button>
          )}

          {/* Import JSON button */}
          {onImportProjectJSON && (
            <>
              <input
                ref={jsonInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleJsonFileSelected}
                className="hidden"
                id="header-import-json"
              />
              <label
                htmlFor="header-import-json"
                title="นำเข้าโปรเจกต์ JSON (รองรับไฟล์เก่าและใหม่)"
                className="cursor-pointer hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition min-h-[36px]"
              >
                <Upload className="w-3.5 h-3.5 text-teal-400" />
                <span>Import JSON</span>
              </label>
            </>
          )}

          {onExportProjectJSON && (
            <button
              onClick={onExportProjectJSON}
              title="ส่งออก Project JSON ทั้งหมด (รวมตัวละครและ metadata)"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-200 bg-purple-600/30 hover:bg-purple-600 hover:text-white border border-purple-500/40 rounded-lg transition-all min-h-[36px]"
            >
              <FileCode className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden md:inline">Export Project JSON</span>
              <span className="md:hidden">JSON</span>
            </button>
          )}

          <button
            onClick={onOpenExportModal}
            title="ส่งออกเอกสารและคัดลอก Prompts ทั้งหมด"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm shadow-indigo-500/30 transition-all min-h-[36px]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Center</span>
          </button>

          <button
            onClick={onResetProject}
            title="สร้างโปรเจกต์ใหม่"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
