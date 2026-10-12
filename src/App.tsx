import React, { useState, useEffect } from 'react';
import {
  Film,
  Target,
  UserCheck,
  Scissors,
  ShieldCheck,
  Download,
  BookOpen,
  Sparkles,
  Bot,
  AlertCircle,
  RotateCcw,
  Layers,
  CheckCircle2,
  Share2,
  Smartphone
} from 'lucide-react';
import { ProductionBlueprint, GenerateRequest, ShotDetail } from './types/director';
import { SAMPLE_BLUEPRINT_SCIENCE } from './data/sampleBlueprints';
import { Header } from './components/Header';
import { DirectorControlPanel } from './components/DirectorControlPanel';
import { StoryboardView } from './components/StoryboardView';
import { MediaGenerationManager } from './components/MediaGenerationManager';
import { AnalysisAndScriptView } from './components/AnalysisAndScriptView';
import { CharacterAndLocationBible } from './components/CharacterAndLocationBible';
import { AssemblyPlanView } from './components/AssemblyPlanView';
import { AuditReportView } from './components/AuditReportView';
import { FreePipelineGuideModal } from './components/FreePipelineGuideModal';
import { ExportModal } from './components/ExportModal';
import { DirectorAssistantDrawer } from './components/DirectorAssistantDrawer';
import { AndroidArchitectureHub } from './components/AndroidArchitectureHub';
import { Phase1DirectorInspector } from './components/Phase1DirectorInspector';
import { downloadFile, cleanProjectForExport } from './utils/exportUtils';

export default function App() {
  const [blueprint, setBlueprint] = useState<ProductionBlueprint>(() => {
    try {
      const saved = localStorage.getItem('AIVC_PROJECT_BLUEPRINT_V3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.shots) && parsed.shots.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load project from localStorage:', e);
    }
    return SAMPLE_BLUEPRINT_SCIENCE;
  });
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Auto-sync project changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('AIVC_PROJECT_BLUEPRINT_V3', JSON.stringify(blueprint));
    } catch (e) {
      console.warn('Failed to auto-save project to localStorage:', e);
    }
  }, [blueprint]);

  const handleManualSave = () => {
    try {
      localStorage.setItem('AIVC_PROJECT_BLUEPRINT_V3', JSON.stringify(blueprint));
      setSaveToast('บันทึกโปรเจกต์ลงในพื้นที่จัดเก็บของเบราว์เซอร์เรียบร้อยแล้ว (LocalStorage)');
      setTimeout(() => setSaveToast(null), 3000);
    } catch (e: any) {
      alert('ไม่สามารถบันทึกโปรเจกต์ได้: ' + (e?.message || 'พื้นที่จัดเก็บเต็ม'));
    }
  };
  const [activeTab, setActiveTab] = useState<
    'storyboard' | 'media-manager' | 'script' | 'characters' | 'assembly' | 'audit' | 'phase1' | 'android-architecture'
  >('storyboard');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals & Drawers
  const [isPipelineGuideOpen, setIsPipelineGuideOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  // Calculate project-wide media progress (Requirement 10)
  const totalScenes = blueprint.shots.length;
  const completedScenes = blueprint.shots.filter((s) => s.generationStatus === 'COMPLETED').length;
  const missingImages = blueprint.shots.filter((s) => !s.generatedImage && s.generationStatus !== 'COMPLETED').length;
  const missingVideos = blueprint.shots.filter((s) => !s.generatedVideo && s.generationStatus !== 'COMPLETED').length;
  const progressPercentage = totalScenes > 0 ? Math.round((completedScenes / totalScenes) * 100) : 0;

  const handleUpdateShot = (updatedShot: ShotDetail) => {
    setBlueprint((prev) => ({
      ...prev,
      shots: prev.shots.map((s) => (s.shotNumber === updatedShot.shotNumber ? updatedShot : s)),
    }));
  };

  const handleUpdateBlueprint = (updated: ProductionBlueprint) => {
    setBlueprint(updated);
  };

  const handleGenerate = async (req: GenerateRequest) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/director/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'ไม่สามารถติดต่อ AI Director ได้');
      }

      const data: ProductionBlueprint = await res.json();
      setBlueprint(data);
      setActiveTab('storyboard');
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการประมวลผล กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefineBlueprint = async (instruction: string) => {
    setIsRefining(true);
    try {
      const res = await fetch('/api/director/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blueprint, instruction }),
      });

      if (!res.ok) {
        throw new Error('ไม่สามารถปรับปรุง Blueprint ได้');
      }

      const updated = await res.json();
      setBlueprint(updated);
    } catch (err: any) {
      console.error(err);
      alert('ไม่สามารถอัปเดต Blueprint ได้: ' + err.message);
    } finally {
      setIsRefining(false);
    }
  };

  const handleResetProject = () => {
    try {
      localStorage.removeItem('AIVC_PROJECT_BLUEPRINT_V3');
    } catch {}
    setBlueprint(SAMPLE_BLUEPRINT_SCIENCE);
    setActiveTab('storyboard');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <Header
        onOpenPipelineGuide={() => setIsPipelineGuideOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onSaveProject={handleManualSave}
        onExportProjectJSON={() =>
          downloadFile(
            `AIVC-Project-${blueprint.id}.json`,
            cleanProjectForExport(blueprint),
            'application/json'
          )
        }
        onImportProjectJSON={(imported) => {
          setBlueprint(imported);
          setActiveTab('storyboard');
        }}
        onResetProject={handleResetProject}
        onSelectSample={() => setBlueprint(SAMPLE_BLUEPRINT_SCIENCE)}
        projectTitle={blueprint.projectTitle}
      />

      {/* Save Success Toast Banner */}
      {saveToast && (
        <div className="bg-emerald-950/90 border-b border-emerald-500/40 text-emerald-300 px-4 py-2 text-xs flex items-center justify-between animate-in fade-in sticky top-16 z-30">
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{saveToast}</span>
          </div>
          <button onClick={() => setSaveToast(null)} className="text-emerald-400 hover:text-white text-xs underline cursor-pointer">
            ปิด
          </button>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Error notification banner if any */}
        {errorMessage && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-xs text-rose-300 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-slate-400 hover:text-white underline text-xs"
            >
              ปิด
            </button>
          </div>
        )}

        {/* Director Input & Control Deck */}
        <DirectorControlPanel
          onGenerate={handleGenerate}
          isLoading={isLoading}
          onSelectSampleScience={() => setBlueprint(SAMPLE_BLUEPRINT_SCIENCE)}
        />

        {/* Production Project Header & Status Notice & Overall Progress Bar (Requirement 10) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  {blueprint.projectTitle}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                  AIVC V3.3.3 Active
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Blueprint Ready
                </span>
              </div>
              <p className="text-xs text-slate-400 line-clamp-2 max-w-3xl">
                ไอเดียตั้งต้น: "{blueprint.originalIdea}"
              </p>
            </div>

            {/* Explicit Notice Fulfilling Rule: "ห้ามอ้างว่าสร้างวิดีโอสำเร็จแล้ว หากยังไม่มีไฟล์วิดีโอจริง" */}
            <div className="bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800 text-xs flex items-center gap-3 shrink-0">
              <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${completedScenes === totalScenes ? 'bg-teal-400' : 'bg-amber-400 animate-pulse'}`} />
              <div>
                <div className="font-semibold text-slate-200">
                  สถานะการผลิต: {completedScenes === totalScenes ? 'สร้างสื่อครบสมบูรณ์ทุกฉาก' : 'กำลังดำเนินการสร้างสื่อตาม Scene'}
                </div>
                <div className="text-[11px] text-slate-400">
                  {missingImages === 0 && missingVideos === 0 ? '✓ ได้ไฟล์ภาพและวิดีโอครบแล้ว' : `ขาดภาพ ${missingImages} ฉาก • ขาดวิดีโอ ${missingVideos} ฉาก`}
                </div>
              </div>
            </div>
          </div>

          {/* Project Progress Bar (Requirement 10) */}
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1 flex-1 max-w-xl">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-400" />
                  <span>ความคืบหน้าการผลิตทั้งโปรเจกต์ (Overall Project Progress)</span>
                </span>
                <span className="font-mono text-indigo-300 font-bold">{progressPercentage}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-teal-400 transition-all duration-500 rounded-full"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs shrink-0">
              <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 font-mono text-[11px]">
                {completedScenes} / {totalScenes} ฉากเสร็จสมบูรณ์
              </span>
              <button
                onClick={() => setActiveTab('media-manager')}
                className="px-3 py-1 rounded-lg bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white font-medium text-xs border border-purple-500/30 transition flex items-center gap-1.5"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>เปิด Media Manager</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Workstation Tabs Navigation */}
        <div className="border-b border-slate-800">
          <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto pb-px scrollbar-none">
            {[
              {
                id: 'storyboard',
                label: '1. ผังช็อต & Prompts (Storyboard)',
                icon: Film,
                badge: `${blueprint.shots.length} ช็อต`,
                badgeColor: 'bg-indigo-500/10 text-indigo-400',
              },
              {
                id: 'media-manager',
                label: '2. Media Manager (ภาพ & วิดีโอจริง)',
                icon: Layers,
                badge: `${completedScenes}/${totalScenes} เสร็จ`,
                badgeColor: 'bg-purple-500/15 text-purple-300 font-bold border border-purple-500/30',
              },
              {
                id: 'script',
                label: '3. วิเคราะห์ & บทเต็ม (Script)',
                icon: Target,
                badge: `${blueprint.analysis.estimatedTotalDurationSec}s`,
                badgeColor: 'bg-emerald-500/10 text-emerald-400',
              },
              {
                id: 'characters',
                label: '4. คัมภีร์ตัวละคร & ฉาก (Bible)',
                icon: UserCheck,
                badge: `${blueprint.characters.length} คน`,
                badgeColor: 'bg-purple-500/10 text-purple-400',
              },
              {
                id: 'assembly',
                label: '5. แผนตัดต่อ CapCut (Assembly)',
                icon: Scissors,
                badge: blueprint.analysis.aspectRatio,
                badgeColor: 'bg-amber-500/10 text-amber-400',
              },
              {
                id: 'audit',
                label: '6. ตรวจสอบความต่อเนื่อง (Audit)',
                icon: ShieldCheck,
                badge: blueprint.audit.characterConsistencyStatus,
                badgeColor: 'bg-emerald-500/10 text-emerald-400',
              },
              {
                id: 'phase1',
                label: '7. ตรวจสอบ Phase 1 JSON (10 รายการ)',
                icon: Sparkles,
                badge: 'Phase 1 Ready',
                badgeColor: 'bg-indigo-500/10 text-indigo-400 font-bold',
              },
              {
                id: 'android-architecture',
                label: '8. แผนสร้างบน Android (ไม่ใช้ n8n)',
                icon: Smartphone,
                badge: '100% ฟรี',
                badgeColor: 'bg-emerald-500/10 text-emerald-400 font-bold',
              },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 py-3 px-3.5 border-b-2 font-medium text-xs whitespace-nowrap transition-all ${
                    isActive
                      ? 'border-indigo-500 text-white bg-slate-900/50 rounded-t-lg'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${tab.badgeColor}`}>
                    {tab.badge}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Workstation Content Tabs */}
        <div className="pb-16">
          {activeTab === 'storyboard' && (
            <StoryboardView
              blueprint={blueprint}
              onUpdateShot={handleUpdateShot}
            />
          )}

          {activeTab === 'media-manager' && (
            <MediaGenerationManager
              blueprint={blueprint}
              onUpdateBlueprint={handleUpdateBlueprint}
            />
          )}

          {activeTab === 'script' && (
            <AnalysisAndScriptView blueprint={blueprint} />
          )}

          {activeTab === 'characters' && (
            <CharacterAndLocationBible
              characters={blueprint.characters}
              environments={blueprint.environments}
              onUpdateCharacters={(updatedChars) =>
                setBlueprint((prev) => ({ ...prev, characters: updatedChars }))
              }
            />
          )}

          {activeTab === 'assembly' && (
            <AssemblyPlanView blueprint={blueprint} />
          )}

          {activeTab === 'audit' && (
            <AuditReportView audit={blueprint.audit} />
          )}

          {activeTab === 'phase1' && (
            <Phase1DirectorInspector blueprint={blueprint} />
          )}

          {activeTab === 'android-architecture' && (
            <AndroidArchitectureHub blueprint={blueprint} />
          )}
        </div>
      </main>

      {/* Floating AI Director Action Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsAssistantOpen(true)}
          className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-rose-600 hover:from-indigo-500 hover:to-rose-500 text-white rounded-full shadow-2xl shadow-indigo-500/40 font-semibold text-xs transition-all hover:scale-105"
        >
          <Bot className="w-4 h-4" />
          <span>คุยกับผู้กำกับ AI</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        </button>
      </div>

      {/* Free Pipeline Guide Modal */}
      <FreePipelineGuideModal
        isOpen={isPipelineGuideOpen}
        onClose={() => setIsPipelineGuideOpen(false)}
      />

      {/* Export Modal */}
      <ExportModal
        blueprint={blueprint}
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />

      {/* Director Assistant Drawer */}
      <DirectorAssistantDrawer
        blueprint={blueprint}
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        onRefineBlueprint={handleRefineBlueprint}
        isRefining={isRefining}
      />
    </div>
  );
}
