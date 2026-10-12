import React, { useState } from 'react';
import {
  Film,
  Copy,
  Check,
  Volume2,
  VolumeX,
  Play,
  Square,
  Sparkles,
  Camera,
  Video,
  Scissors,
  Music,
  Info,
  Layers,
  ChevronDown,
  ChevronUp,
  Tag,
  AlertTriangle,
  FileSpreadsheet,
  LayoutGrid,
  ExternalLink,
  CheckSquare,
  Download,
  Loader2,
  Maximize2,
  Cpu,
  X,
  Image as ImageIcon
} from 'lucide-react';
import { ProductionBlueprint, ShotDetail, SceneGenerationStatus } from '../types/director';
import { speechSynthesizer } from '../utils/speechUtils';
import { useMediaGeneration } from '../hooks/useMediaGeneration';
import { ProviderStatusModal } from './ProviderStatusModal';
import { SceneCharacterSelector } from './SceneCharacterSelector';
import { PromptConsistencyInspector } from './PromptConsistencyInspector';
import { GoogleFlowWorkflowPanel } from './GoogleFlowWorkflowPanel';
import { BatchImageProgressModal } from './BatchImageProgressModal';
import { GoogleFlowBatchModal } from './GoogleFlowBatchModal';
import { ErrorBoundary } from './ErrorBoundary';

interface StoryboardViewProps {
  blueprint: ProductionBlueprint;
  onUpdateShot?: (updatedShot: ShotDetail) => void;
  onUpdateBlueprint?: (updated: ProductionBlueprint) => void;
}

export const StoryboardView: React.FC<StoryboardViewProps> = ({ blueprint, onUpdateShot, onUpdateBlueprint }) => {
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeSpeakingShotIndex, setActiveSpeakingShotIndex] = useState<number | null>(null);
  const [isPlayingAllAudio, setIsPlayingAllAudio] = useState(false);
  const [expandedShotIndex, setExpandedShotIndex] = useState<number | null>(0);
  const [shotAspectRatios, setShotAspectRatios] = useState<Record<number, '9:16' | '16:9' | '1:1' | '4:3' | '3:4'>>({});
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);
  const [openFlowWorkflowShot, setOpenFlowWorkflowShot] = useState<number | null>(null);
  const [isGoogleFlowBatchOpen, setIsGoogleFlowBatchOpen] = useState(false);

  const {
    generatingImageShot,
    generatingVideoShot,
    errorNotice,
    clearErrorNotice,
    providerStatuses,
    generateImage,
    generateAllImages,
    batchProgress,
    cancelBatchImages,
    clearBatchProgress,
    generateVideo,
    animateReferenceImage,
    downloadImage,
    downloadVideo,
    downloadAllImages,
    isDownloadingAll,
    downloadProgress,
  } = useMediaGeneration(onUpdateShot, blueprint);

  const imageToolUrl = blueprint.mediaToolsConfig?.imageGeneratorUrl || 'https://copilot.microsoft.com/images/create';
  const videoToolUrl = blueprint.mediaToolsConfig?.videoGeneratorUrl || 'https://klingai.com';

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  const handleOpenTool = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleToggleCompleted = (shot: ShotDetail) => {
    if (!onUpdateShot) return;
    const newStatus: SceneGenerationStatus = shot.generationStatus === 'COMPLETED' ? 'PROMPT_READY' : 'COMPLETED';
    onUpdateShot({
      ...shot,
      generationStatus: newStatus,
    });
  };

  const handleStatusChange = (shot: ShotDetail, newStatus: SceneGenerationStatus) => {
    if (!onUpdateShot) return;
    onUpdateShot({
      ...shot,
      generationStatus: newStatus,
    });
  };

  const getStatusBadge = (status?: SceneGenerationStatus) => {
    switch (status) {
      case 'PLANNED':
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-800 text-slate-400 border border-slate-700">PLANNED</span>;
      case 'PROMPT_READY':
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">PROMPT_READY</span>;
      case 'IMAGE_READY':
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">IMAGE_READY</span>;
      case 'VIDEO_READY':
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">VIDEO_READY</span>;
      case 'COMPLETED':
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40">COMPLETED</span>;
      case 'FAILED':
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40">FAILED</span>;
      default:
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-500/15 text-indigo-400">PROMPT_READY</span>;
    }
  };

  const handleSpeakShot = (shot: ShotDetail, index: number) => {
    if (activeSpeakingShotIndex === index) {
      speechSynthesizer.stop();
      setActiveSpeakingShotIndex(null);
      return;
    }

    speechSynthesizer.stop();
    setActiveSpeakingShotIndex(index);
    speechSynthesizer.speak(shot.audioDesign.thaiVoiceover, {
      onEnd: () => {
        setActiveSpeakingShotIndex(null);
      },
      onError: () => {
        setActiveSpeakingShotIndex(null);
      },
    });
  };

  const handlePlayAllAudio = () => {
    if (isPlayingAllAudio) {
      speechSynthesizer.stop();
      setIsPlayingAllAudio(false);
      setActiveSpeakingShotIndex(null);
      return;
    }

    setIsPlayingAllAudio(true);
    let currentIdx = 0;

    const playNext = () => {
      if (currentIdx >= blueprint.shots.length) {
        setIsPlayingAllAudio(false);
        setActiveSpeakingShotIndex(null);
        return;
      }

      const shot = blueprint.shots[currentIdx];
      setActiveSpeakingShotIndex(currentIdx);
      speechSynthesizer.speak(shot.audioDesign.thaiVoiceover, {
        onEnd: () => {
          currentIdx++;
          setTimeout(playNext, 600); // Small pause between shots
        },
        onError: () => {
          setIsPlayingAllAudio(false);
          setActiveSpeakingShotIndex(null);
        },
      });
    };

    playNext();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Notice: Compliance with Rule */}
      <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-start gap-2.5 text-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-amber-300">
              ข้อกำหนดกระบวนการผลิต:
            </span>{' '}
            นี่คือ "แผนการผลิตระดับมืออาชีพ (Production Blueprint)" ไม่ใช่ไฟล์วิดีโอสำเร็จรูป
            ระบบได้แยก <strong className="text-white">Prompt สร้างภาพ (Image)</strong> ออกจาก{' '}
            <strong className="text-white">Prompt เคลื่อนไหว (Motion)</strong> ชัดเจน
            เพื่อให้คุณนำไปเจนภาพและวิดีโอฟรีตามขั้นตอน
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handlePlayAllAudio}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition text-xs ${
              isPlayingAllAudio
                ? 'bg-rose-500 text-white animate-pulse'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
            }`}
          >
            {isPlayingAllAudio ? (
              <>
                <Square className="w-3.5 h-3.5" />
                <span>หยุด Table-Read</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>ฟังเสียงพากย์ทั้งเรื่อง (Table-Read)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Control Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2">
          <Film className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-semibold text-white">
            ผังช็อต Storyboard ({blueprint.shots.length} ช็อต • รวม {blueprint.analysis.estimatedTotalDurationSec} วินาที)
          </span>
          <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-slate-800 text-slate-300 border border-slate-700">
            {blueprint.analysis.aspectRatio}
          </span>
        </div>

        {/* Action Controls & View Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Requirement C: One-Click Workflow "เริ่มสร้างภาพทุกฉาก" */}
          <button
            type="button"
            onClick={() => setIsGoogleFlowBatchOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-500 hover:from-blue-500 hover:via-indigo-500 hover:to-teal-400 text-white shadow-md shadow-indigo-600/30 transition cursor-pointer min-h-[36px] touch-manipulation"
            title="เริ่มกระบวนการจัดเตรียมและสร้างภาพทุกฉากผ่าน Google Flow (AIVC V3.3)"
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>เริ่มสร้างภาพทุกฉาก (Google Flow)</span>
          </button>

          {/* Requirement E: Download All Images in Storyboard */}
          {blueprint.shots.some((s) => Boolean(s.generatedImage)) && (
            <button
              type="button"
              onClick={downloadAllImages}
              disabled={isDownloadingAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 hover:text-white border border-emerald-500/40 transition cursor-pointer min-h-[36px]"
              title="ดาวน์โหลดภาพจริงทั้งหมดในโปรเจกต์"
            >
              <Download className="w-3.5 h-3.5" />
              <span>
                {isDownloadingAll
                  ? `โหลด (${downloadProgress?.current}/${downloadProgress?.total})...`
                  : `ดาวน์โหลดภาพ (${blueprint.shots.filter((s) => Boolean(s.generatedImage)).length})`}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsDiagnosticsOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 transition cursor-pointer min-h-[36px]"
            title="ตรวจสถานะโมเดลจริง AI Engine"
          >
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">AI Diagnostics</span>
          </button>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setViewMode('table')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition ${
                viewMode === 'table'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>ตารางผังช็อต (Table)</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition ${
                viewMode === 'cards'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>การ์ดผังภาพ (Cards)</span>
            </button>
          </div>
        </div>
      </div>

      {/* TABLE VIEW: Requirement 3, 5, 6, 7, 8 in clean readable format */}
      {viewMode === 'table' ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/90 text-slate-300 border-b border-slate-800 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-3 w-16 text-center">ช็อต</th>
                  <th className="py-3 px-3 w-24">เวลา & มุมกล้อง</th>
                  <th className="py-3 px-4 w-64">การกระทำและสิ่งที่เกิดขึ้น</th>
                  <th className="py-3 px-4 min-w-[280px] bg-indigo-950/20 text-indigo-200 border-x border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-indigo-400" />
                        Prompt สร้างภาพ (Image)
                      </span>
                      <span className="text-[10px] text-indigo-400 lowercase">Midjourney / Flux</span>
                    </div>
                  </th>
                  <th className="py-3 px-4 min-w-[280px] bg-rose-950/20 text-rose-200 border-r border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Video className="w-3.5 h-3.5 text-rose-400" />
                        Prompt การเคลื่อนไหว (Motion)
                      </span>
                      <span className="text-[10px] text-rose-400 lowercase">Kling / Runway / Luma</span>
                    </div>
                  </th>
                  <th className="py-3 px-4 min-w-[220px]">บทพากย์ไทย & เสียง (Audio)</th>
                  <th className="py-3 px-3 w-36">การตัดต่อ & ซับไตเติล</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {blueprint.shots.map((shot, idx) => {
                  const isSpeaking = activeSpeakingShotIndex === idx;
                  return (
                    <tr
                      key={shot.shotNumber}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isSpeaking ? 'bg-indigo-950/40 ring-1 ring-indigo-500' : ''
                      }`}
                    >
                      {/* Shot Number & Scene */}
                      <td className="py-4 px-3 text-center align-top font-mono space-y-1.5">
                        <div className="font-bold text-white text-xs bg-purple-950/60 text-purple-300 py-0.5 px-2 rounded border border-purple-800/60 inline-block">
                          {shot.sceneId || `SC-${String(shot.shotNumber).padStart(2, '0')}`}
                        </div>
                        <div className="text-[11px] font-bold text-white bg-slate-800 py-0.5 px-1.5 rounded-lg block border border-slate-700">
                          Shot #{shot.shotNumber}
                        </div>
                        <div className="pt-0.5">
                          {getStatusBadge(shot.generationStatus)}
                        </div>

                        {/* Assigned Characters in Table */}
                        <div className="pt-1 flex flex-wrap justify-center gap-1 max-w-[130px] mx-auto">
                          {(shot.characterIds || []).length === 0 ? (
                            <span className="text-[9px] text-slate-500 italic">ไม่มีตัวละคร</span>
                          ) : (
                            (blueprint.characters || [])
                              .filter((c) => (shot.characterIds || []).includes(c.id))
                              .map((c) => (
                                <span
                                  key={c.id}
                                  className="px-1.5 py-0.2 rounded text-[9px] font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 truncate"
                                  title={`ตัวละคร: ${c.name} (${c.role})`}
                                >
                                  {c.name} {c.isLocked !== false && '🔒'}
                                </span>
                              ))
                          )}
                        </div>

                        {onUpdateShot && (
                          <div className="pt-1">
                            <button
                              onClick={() => handleToggleCompleted(shot)}
                              className={`text-[9px] px-2 py-0.5 rounded font-semibold transition ${
                                shot.generationStatus === 'COMPLETED'
                                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 hover:bg-teal-500/30'
                                  : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
                              }`}
                            >
                              {shot.generationStatus === 'COMPLETED' ? '✓ เสร็จแล้ว' : 'Mark Done'}
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Time & Camera */}
                      <td className="py-4 px-3 align-top space-y-1.5">
                        <div className="font-mono text-emerald-400 font-semibold">
                          {shot.timeRange}
                        </div>
                        <div className="text-[11px] font-medium text-slate-200 bg-slate-800/70 px-2 py-0.5 rounded border border-slate-700/60 inline-block">
                          {shot.shotType}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                          {shot.cameraMovement}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          ({shot.durationSec} วินาที)
                        </div>
                      </td>

                      {/* Action & Scene */}
                      <td className="py-4 px-4 align-top space-y-2">
                        <p className="text-slate-200 text-xs leading-relaxed font-medium">
                          {shot.actionDescription}
                        </p>
                        <div className="text-[11px] text-slate-400 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                          <span className="text-amber-400 font-medium">แสง & องค์ประกอบ:</span>{' '}
                          {shot.compositionAndLighting}
                        </div>
                        {shot.continuityTag && (
                          <div className="text-[10px] text-indigo-300 bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-900/50 inline-block">
                            ความต่อเนื่อง: {shot.continuityTag}
                          </div>
                        )}
                      </td>

                      {/* Image Prompt Column (Requirement 5 + V3 Controls) */}
                      <td className="py-4 px-4 align-top bg-indigo-950/10 border-x border-slate-800 space-y-2">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
                            Positive Image Prompt
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() =>
                                handleCopy(
                                  shot.imagePrompt.positivePromptEn,
                                  `img-${shot.shotNumber}`
                                )
                              }
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white transition text-[10px]"
                            >
                              {copiedKey === `img-${shot.shotNumber}` ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span>คัดลอกแล้ว</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenTool(imageToolUrl)}
                              title="เปิดเว็บสร้างภาพในแท็บใหม่"
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition text-[10px] border border-slate-700"
                            >
                              <ExternalLink className="w-2.5 h-2.5" />
                              <span>เปิดเว็บ</span>
                            </button>
                          </div>
                        </div>

                        {/* V3 Quick Action Buttons for Table Row */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          <button
                            type="button"
                            disabled={generatingImageShot === shot.shotNumber}
                            onClick={() => generateImage(shot, shotAspectRatios[shot.shotNumber] || (shot.imagePrompt.aspectRatio as any) || '9:16')}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-950 text-white text-[10px] font-medium transition cursor-pointer shadow-sm"
                            title="Generate Image with AI"
                          >
                            {generatingImageShot === shot.shotNumber ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Camera className="w-3 h-3" />
                            )}
                            <span>{generatingImageShot === shot.shotNumber ? 'Creating...' : 'Gen Image'}</span>
                          </button>

                          {shot.generatedImage && (
                            <button
                              type="button"
                              onClick={() => downloadImage(shot)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-indigo-300 text-[10px] transition border border-indigo-500/30"
                              title="Download Image"
                            >
                              <Download className="w-3 h-3" />
                              <span>Save</span>
                            </button>
                          )}
                        </div>

                        {/* Table View Thumbnail if Generated */}
                        {shot.generatedImage && (
                          <div className="relative w-24 h-16 rounded-lg overflow-hidden border border-indigo-500/40 bg-slate-900 group cursor-pointer" onClick={() => setLightboxImage(shot.generatedImage!)}>
                            <img src={shot.generatedImage} alt={`Shot ${shot.shotNumber}`} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px]">
                              <Maximize2 className="w-3 h-3" />
                            </div>
                          </div>
                        )}

                        <div className="bg-slate-950/80 p-2.5 rounded-lg border border-indigo-900/40 text-[11px] font-mono text-slate-300 leading-relaxed max-h-36 overflow-y-auto select-all">
                          {shot.imagePrompt.positivePromptEn}
                        </div>

                        <div className="text-[10px] text-slate-400 space-y-1">
                          <div>
                            <span className="text-indigo-300">Style:</span> {shot.imagePrompt.styleTags}
                          </div>
                          <div>
                            <span className="text-indigo-300">Lens & Lighting:</span> {shot.imagePrompt.lightingAndLens}
                          </div>
                          <div className="text-slate-500 italic">
                            💡 {shot.imagePrompt.thaiExplanation}
                          </div>
                        </div>
                      </td>

                      {/* Motion Prompt Column (Requirement 6 + V3 Controls) */}
                      <td className="py-4 px-4 align-top bg-rose-950/10 border-r border-slate-800 space-y-2">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider">
                            Video Motion Prompt
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() =>
                                handleCopy(
                                  shot.motionPrompt.videoPromptEn,
                                  `motion-${shot.shotNumber}`
                                )
                              }
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-600/30 hover:bg-rose-600 text-rose-200 hover:text-white transition text-[10px]"
                            >
                              {copiedKey === `motion-${shot.shotNumber}` ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span>คัดลอกแล้ว</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenTool(videoToolUrl)}
                              title="เปิดเว็บสร้างวิดีโอในแท็บใหม่"
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition text-[10px] border border-slate-700"
                            >
                              <ExternalLink className="w-2.5 h-2.5" />
                              <span>เปิดเว็บ</span>
                            </button>
                          </div>
                        </div>

                        {/* V3 Quick Action Buttons for Video in Table Row */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          <button
                            type="button"
                            disabled={generatingVideoShot === shot.shotNumber}
                            onClick={() => generateVideo(shot)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-rose-600 hover:bg-rose-500 disabled:bg-rose-950 text-white text-[10px] font-medium transition cursor-pointer shadow-sm"
                            title="Generate Video with AI"
                          >
                            {generatingVideoShot === shot.shotNumber ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Video className="w-3 h-3" />
                            )}
                            <span>{generatingVideoShot === shot.shotNumber ? 'Creating...' : 'Gen Video'}</span>
                          </button>

                          {shot.generatedVideo && (
                            <button
                              type="button"
                              onClick={() => downloadVideo(shot)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-rose-300 text-[10px] transition border border-rose-500/30"
                              title="Download Video"
                            >
                              <Download className="w-3 h-3" />
                              <span>Save</span>
                            </button>
                          )}
                        </div>

                        {/* Table View Video player if Generated */}
                        {shot.generatedVideo && (
                          <div className="rounded-lg overflow-hidden border border-rose-500/40 bg-black w-44">
                            <video src={shot.generatedVideo} controls playsInline className="w-full max-h-24 object-contain" />
                          </div>
                        )}

                        <div className="bg-slate-950/80 p-2.5 rounded-lg border border-rose-900/40 text-[11px] font-mono text-slate-300 leading-relaxed max-h-36 overflow-y-auto select-all">
                          {shot.motionPrompt.videoPromptEn}
                        </div>

                        <div className="space-y-1 text-[10px]">
                          <div className="flex items-center justify-between text-slate-300">
                            <span>คำสั่งกล้อง: {shot.motionPrompt.cameraMotionDirective}</span>
                            <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-mono">
                              ความแรง {shot.motionPrompt.motionIntensity}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1 pt-1">
                            {shot.motionPrompt.recommendedTools?.map((tool, tIdx) => (
                              <span
                                key={tIdx}
                                className="px-1.5 py-0.5 rounded bg-slate-800 text-[9px] text-slate-300 border border-slate-700"
                              >
                                {tool}
                              </span>
                            ))}
                          </div>
                          <div className="text-slate-500 italic pt-0.5">
                            🎬 {shot.motionPrompt.thaiExplanation}
                          </div>
                        </div>
                      </td>

                      {/* Thai Voiceover & Audio (Requirement 7) */}
                      <td className="py-4 px-4 align-top space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase">
                            บทพากย์ภาษาไทย
                          </span>
                          <button
                            onClick={() => handleSpeakShot(shot, idx)}
                            title="ฟังเสียงอ่านบทพากย์นี้"
                            className={`p-1 rounded text-[11px] flex items-center gap-1 transition ${
                              isSpeaking
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                            }`}
                          >
                            <Volume2 className="w-3 h-3" />
                            <span>{isSpeaking ? 'กำลังเล่น' : 'ฟังเสียง'}</span>
                          </button>
                        </div>

                        <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800 text-xs text-amber-200 font-medium leading-relaxed">
                          "{shot.audioDesign.thaiVoiceover}"
                        </div>

                        <div className="space-y-1 text-[10px] text-slate-400">
                          <div>
                            <span className="text-slate-500">น้ำเสียง:</span> {shot.audioDesign.voiceToneAndPacing}
                          </div>
                          {shot.audioDesign.sfx && (
                            <div>
                              <span className="text-emerald-400">SFX:</span> {shot.audioDesign.sfx}
                            </div>
                          )}
                          {shot.audioDesign.bgmCue && (
                            <div>
                              <span className="text-indigo-400">BGM:</span> {shot.audioDesign.bgmCue}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Editing Direction (Requirement 8) */}
                      <td className="py-4 px-3 align-top space-y-2">
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-[10px] font-medium text-slate-300 border border-slate-700">
                          <Scissors className="w-3 h-3 text-indigo-400" />
                          <span>{shot.editingDirection.cutType}</span>
                        </div>

                        {shot.editingDirection.thaiSubtitleOverlay && (
                          <div className="text-[10px] text-slate-300 bg-slate-950/80 p-1.5 rounded border border-slate-800/80">
                            <span className="text-amber-400 font-semibold">ซับบนจอ:</span>{' '}
                            {shot.editingDirection.thaiSubtitleOverlay}
                          </div>
                        )}

                        <div className="text-[10px] text-slate-400 leading-tight">
                          {shot.editingDirection.pacingNote}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* CARD STORYBOARD VIEW: Visual Director Film Slate View */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {blueprint.shots.map((shot, idx) => {
            const isSpeaking = activeSpeakingShotIndex === idx;
            const isExpanded = expandedShotIndex === idx;

            return (
              <div
                key={shot.shotNumber}
                className={`bg-slate-900 border rounded-2xl overflow-hidden shadow-xl transition-all ${
                  isSpeaking
                    ? 'border-indigo-500 ring-2 ring-indigo-500/50'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Film Slate Card Header */}
                <div className="bg-slate-950 px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex flex-col items-center justify-center font-bold text-white text-[11px] font-mono leading-none">
                      <span className="text-[9px] text-purple-300">{shot.sceneId || `SC-${String(shot.shotNumber).padStart(2, '0')}`}</span>
                      <span>#{shot.shotNumber}</span>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white flex items-center gap-2">
                        <span>ฉาก {shot.sceneNumber} • {shot.shotType}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 font-mono">
                          {shot.timeRange} ({shot.durationSec}s)
                        </span>
                        {getStatusBadge(shot.generationStatus)}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                        <span>การเคลื่อนกล้อง: {shot.cameraMovement}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {onUpdateShot && (
                      <button
                        onClick={() => handleToggleCompleted(shot)}
                        className={`text-[10px] px-2 py-1 rounded-lg font-semibold transition ${
                          shot.generationStatus === 'COMPLETED'
                            ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                        }`}
                      >
                        {shot.generationStatus === 'COMPLETED' ? '✓ เสร็จแล้ว' : 'Mark Done'}
                      </button>
                    )}
                    <button
                      onClick={() => handleSpeakShot(shot, idx)}
                      className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition ${
                        isSpeaking
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setExpandedShotIndex(isExpanded ? null : idx)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                    >
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 space-y-4">
                  {/* Action Summary */}
                  <div>
                    <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <Film className="w-3.5 h-3.5 text-indigo-400" />
                      การกระทำในช็อต (Action & Framing)
                    </h4>
                    <p className="text-xs text-slate-200 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                      {shot.actionDescription}
                    </p>
                  </div>

                  {/* Thai Dialogue & Audio */}
                  <div className="bg-amber-950/10 border border-amber-500/20 rounded-xl p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-amber-300 flex items-center gap-1">
                        <Volume2 className="w-3 h-3 text-amber-400" />
                        บทพากย์ภาษาไทย
                      </span>
                      <span className="text-slate-400 text-[10px]">
                        น้ำเสียง: {shot.audioDesign.voiceToneAndPacing}
                      </span>
                    </div>
                    <p className="text-xs text-amber-100 font-medium">
                      "{shot.audioDesign.thaiVoiceover}"
                    </p>
                    {(shot.audioDesign.sfx || shot.audioDesign.bgmCue) && (
                      <div className="text-[10px] text-slate-400 flex flex-wrap gap-3 pt-1 border-t border-amber-500/15">
                        {shot.audioDesign.sfx && (
                          <span>
                            <strong className="text-emerald-400">SFX:</strong> {shot.audioDesign.sfx}
                          </span>
                        )}
                        {shot.audioDesign.bgmCue && (
                          <span>
                            <strong className="text-indigo-400">BGM:</strong> {shot.audioDesign.bgmCue}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* FEATURE 1: Scene Character Assignment (V3.1) */}
                  {onUpdateShot && (
                    <SceneCharacterSelector
                      characters={blueprint.characters || []}
                      selectedCharacterIds={shot.characterIds || []}
                      onChange={(updatedIds) =>
                        onUpdateShot({
                          ...shot,
                          characterIds: updatedIds,
                        })
                      }
                      shotNumber={shot.shotNumber}
                      sceneId={shot.sceneId}
                    />
                  )}

                  {/* FEATURE 2 & 3: Automatic Character-Aware Prompts & Consistency Inspector */}
                  {onUpdateShot && (
                    <PromptConsistencyInspector
                      shot={shot}
                      assignedCharacters={(blueprint.characters || []).filter((c) =>
                        (shot.characterIds || []).includes(c.id)
                      )}
                      environment={blueprint.environments?.[0]}
                      onUpdateShot={onUpdateShot}
                    />
                  )}

                  {/* FEATURE 4: Google Flow Workflow Toggle & Panel */}
                  {onUpdateShot && (
                    <div className="pt-0.5">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                          <Film className="w-3.5 h-3.5 text-teal-400" />
                          <span>Google Flow วิดีโอเวิร์กโฟลว์ (Google Labs)</span>
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setOpenFlowWorkflowShot(
                              openFlowWorkflowShot === shot.shotNumber ? null : shot.shotNumber
                            )
                          }
                          className="text-[11px] font-semibold text-teal-300 hover:text-white px-2.5 py-1 rounded-lg bg-teal-600/20 hover:bg-teal-600/40 border border-teal-500/30 transition touch-manipulation min-h-[32px]"
                        >
                          {openFlowWorkflowShot === shot.shotNumber
                            ? '▲ ปิด Google Flow Panel'
                            : '▼ เปิด Google Flow เวิร์กโฟลว์'}
                        </button>
                      </div>

                      {openFlowWorkflowShot === shot.shotNumber && (
                        <div className="mb-3 animate-in fade-in duration-200">
                          <GoogleFlowWorkflowPanel
                            shot={shot}
                            assignedCharacters={(blueprint.characters || []).filter((c) =>
                              (shot.characterIds || []).includes(c.id)
                            )}
                            onUpdateShot={onUpdateShot}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Prompts Section: Separated Image vs Motion */}
                  <div className="space-y-3 pt-1">
                    {/* V3 DIRECT MEDIA GENERATION TOOLBAR */}
                    <div className="bg-slate-950 p-3 rounded-xl border border-indigo-500/30 space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                          Direct AI Media Controls
                        </span>

                        <div className="flex items-center gap-1 text-[11px]">
                          <span className="text-slate-400">Ratio:</span>
                          <select
                            value={shotAspectRatios[shot.shotNumber] || (shot.imagePrompt.aspectRatio as any) || '9:16'}
                            onChange={(e) =>
                              setShotAspectRatios({
                                ...shotAspectRatios,
                                [shot.shotNumber]: e.target.value as any,
                              })
                            }
                            className="bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-[10px] text-indigo-300 font-medium"
                          >
                            <option value="9:16">9:16 (Shorts)</option>
                            <option value="16:9">16:9 (Landscape)</option>
                            <option value="1:1">1:1 (Square)</option>
                            <option value="4:3">4:3 (Classic)</option>
                            <option value="3:4">3:4 (Portrait)</option>
                          </select>
                        </div>
                      </div>

                      {/* 5 Clear Action Controls: Generate Image, Generate Video, Animate Reference Image, Download Image, Download Video */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                        {/* 1. Generate Image */}
                        <button
                          type="button"
                          disabled={generatingImageShot === shot.shotNumber}
                          onClick={() =>
                            generateImage(
                              shot,
                              shotAspectRatios[shot.shotNumber] || (shot.imagePrompt.aspectRatio as any) || '9:16'
                            )
                          }
                          className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900/60 text-white text-[11px] font-medium shadow-sm transition cursor-pointer"
                          title="สร้างภาพโดยตรงจาก Image Prompt"
                        >
                          {generatingImageShot === shot.shotNumber ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span>Generating...</span>
                            </>
                          ) : (
                            <>
                              <Camera className="w-3 h-3" />
                              <span>Generate Image</span>
                            </>
                          )}
                        </button>

                        {/* 2. Generate Video */}
                        <button
                          type="button"
                          disabled={generatingVideoShot === shot.shotNumber}
                          onClick={() => generateVideo(shot)}
                          className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:bg-rose-900/60 text-white text-[11px] font-medium shadow-sm transition cursor-pointer"
                          title="สร้างวิดีโอโดยตรงจาก Video Motion Prompt"
                        >
                          {generatingVideoShot === shot.shotNumber ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span>Generating...</span>
                            </>
                          ) : (
                            <>
                              <Video className="w-3 h-3" />
                              <span>Generate Video</span>
                            </>
                          )}
                        </button>

                        {/* 3. Animate Reference Image */}
                        <button
                          type="button"
                          disabled={generatingVideoShot === shot.shotNumber || (!shot.generatedImage && !shot.referenceImage)}
                          onClick={() => animateReferenceImage(shot)}
                          className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-[11px] font-medium shadow-sm transition col-span-2 sm:col-span-1 cursor-pointer"
                          title="แปลงภาพตั้งต้นเป็นคลิปวิดีโอ (Image-to-Video)"
                        >
                          {generatingVideoShot === shot.shotNumber ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span>Animating...</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3 h-3" />
                              <span>Animate Reference</span>
                            </>
                          )}
                        </button>

                        {/* 4. Download Image */}
                        {shot.generatedImage && (
                          <button
                            type="button"
                            onClick={() => downloadImage(shot)}
                            className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white border border-indigo-500/30 text-[11px] font-medium transition cursor-pointer"
                            title="ดาวน์โหลดภาพที่สร้างได้"
                          >
                            <Download className="w-3 h-3" />
                            <span>Download Image</span>
                          </button>
                        )}

                        {/* 5. Download Video */}
                        {shot.generatedVideo && (
                          <button
                            type="button"
                            onClick={() => downloadVideo(shot)}
                            className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-300 hover:text-white border border-rose-500/30 text-[11px] font-medium transition cursor-pointer"
                            title="ดาวน์โหลดคลิปวิดีโอที่สร้างได้"
                          >
                            <Download className="w-3 h-3" />
                            <span>Download Video</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Generated Visual Asset Previews in Card */}
                    {(shot.generatedImage || shot.generatedVideo) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        {shot.generatedImage && (
                          <div className="relative rounded-xl overflow-hidden border border-indigo-500/40 bg-slate-950 group">
                            <img
                              src={shot.generatedImage}
                              alt={`Shot ${shot.shotNumber}`}
                              className="w-full max-h-40 object-contain bg-black/40"
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setLightboxImage(shot.generatedImage!)}
                                className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-white text-[10px] flex items-center gap-1"
                              >
                                <Maximize2 className="w-3 h-3" />
                                <span>ขยาย</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => downloadImage(shot)}
                                className="p-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] flex items-center gap-1"
                              >
                                <Download className="w-3 h-3" />
                                <span>ดาวน์โหลด</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {shot.generatedVideo && (
                          <div className="rounded-xl overflow-hidden border border-rose-500/40 bg-black">
                            <video
                              src={shot.generatedVideo}
                              controls
                              playsInline
                              className="w-full max-h-40 object-contain"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Image Prompt Box */}
                    <div className="bg-indigo-950/20 border border-indigo-500/30 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-indigo-300 flex items-center gap-1.5">
                          <Camera className="w-3.5 h-3.5 text-indigo-400" />
                          Image Prompt (สร้างภาพนิ่ง)
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() =>
                              handleCopy(shot.imagePrompt.positivePromptEn, `card-img-${shot.shotNumber}`)
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-medium transition"
                          >
                            {copiedKey === `card-img-${shot.shotNumber}` ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-300" />
                                <span>คัดลอกแล้ว</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy Image Prompt</span>
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenTool(imageToolUrl)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] transition border border-slate-700"
                            title="เปิดเว็บสร้างภาพในแท็บใหม่"
                          >
                            <ExternalLink className="w-2.5 h-2.5" />
                            <span>เปิดเว็บ</span>
                          </button>
                        </div>
                      </div>

                      <div className="bg-slate-950 p-2.5 rounded-lg border border-indigo-900/40 text-[11px] font-mono text-slate-300 leading-relaxed max-h-24 overflow-y-auto select-all">
                        {shot.imagePrompt.positivePromptEn}
                      </div>

                      <div className="text-[10px] text-slate-400 flex items-center justify-between">
                        <span>Ratio: {shot.imagePrompt.aspectRatio}</span>
                        <span className="italic">{shot.imagePrompt.thaiExplanation}</span>
                      </div>
                    </div>

                    {/* Motion Prompt Box */}
                    <div className="bg-rose-950/20 border border-rose-500/30 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-rose-300 flex items-center gap-1.5">
                          <Video className="w-3.5 h-3.5 text-rose-400" />
                          Motion Prompt (สร้างการเคลื่อนไหว)
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() =>
                              handleCopy(shot.motionPrompt.videoPromptEn, `card-motion-${shot.shotNumber}`)
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-medium transition"
                          >
                            {copiedKey === `card-motion-${shot.shotNumber}` ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-300" />
                                <span>คัดลอกแล้ว</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy Motion Prompt</span>
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenTool(videoToolUrl)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] transition border border-slate-700"
                            title="เปิดเว็บสร้างวิดีโอในแท็บใหม่"
                          >
                            <ExternalLink className="w-2.5 h-2.5" />
                            <span>เปิดเว็บ</span>
                          </button>
                        </div>
                      </div>

                      <div className="bg-slate-950 p-2.5 rounded-lg border border-rose-900/40 text-[11px] font-mono text-slate-300 leading-relaxed max-h-24 overflow-y-auto select-all">
                        {shot.motionPrompt.videoPromptEn}
                      </div>

                      <div className="text-[10px] text-slate-400 flex items-center justify-between">
                        <span>เครื่องมือแนะนำ: {shot.motionPrompt.recommendedTools?.join(', ')}</span>
                        <span className="text-rose-400 font-mono">{shot.motionPrompt.motionIntensity}</span>
                      </div>
                    </div>
                  </div>

                  {/* Editing & Continuity details */}
                  <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <Scissors className="w-3 h-3 text-indigo-400" />
                      <span>รอยต่อ: <strong>{shot.editingDirection.cutType}</strong></span>
                    </div>
                    {shot.editingDirection.thaiSubtitleOverlay && (
                      <div className="text-amber-300">
                        ซับ: "{shot.editingDirection.thaiSubtitleOverlay}"
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox Modal for Storyboard Image Inspection */}
      {lightboxImage && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute -top-10 right-0 p-2 text-white/80 hover:text-white bg-slate-800/80 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={lightboxImage}
              alt="Fullscreen preview"
              className="max-w-full max-h-[85vh] rounded-xl object-contain shadow-2xl border border-slate-700"
            />
          </div>
        </div>
      )}

      {/* Provider Status Diagnostics Modal */}
      <ProviderStatusModal
        isOpen={isDiagnosticsOpen || Boolean(errorNotice)}
        onClose={() => {
          setIsDiagnosticsOpen(false);
          clearErrorNotice();
        }}
        errorNotice={errorNotice}
        providerStatuses={providerStatuses}
        onOpenFreeTool={() => handleOpenTool(imageToolUrl)}
      />

      {/* Batch Image Generation Progress Modal */}
      {batchProgress && (
        <BatchImageProgressModal
          progress={batchProgress}
          blueprint={blueprint}
          onCancel={cancelBatchImages}
          onClose={clearBatchProgress}
          onRetryFailed={() => generateAllImages({ retryFailedOnly: true })}
        />
      )}

      {/* Requirement C: Google Flow Batch One-Click Modal ("เริ่มสร้างภาพทุกฉาก") */}
      <ErrorBoundary fallbackTitle="เกิดข้อผิดพลาดในการแสดงผลหน้าต่าง Google Flow (ข้อมูลฉากยังคงปลอดภัย)">
        <GoogleFlowBatchModal
          isOpen={isGoogleFlowBatchOpen}
          onClose={() => setIsGoogleFlowBatchOpen(false)}
          blueprint={blueprint}
          onUpdateShot={onUpdateShot || (() => {})}
          onUpdateBlueprint={onUpdateBlueprint || (() => {})}
        />
      </ErrorBoundary>
    </div>
  );
};
