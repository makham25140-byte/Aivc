import React, { useState } from 'react';
import {
  Film,
  Camera,
  Video,
  ExternalLink,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  Clock,
  Upload,
  Link as LinkIcon,
  Globe,
  Download,
  FileCode,
  Sparkles,
  Layers,
  Image as ImageIcon,
  CheckSquare,
  AlertTriangle,
  RefreshCw,
  Eye,
  Trash2,
  Cpu,
  Play,
  Loader2,
  Maximize2,
  X,
  Info
} from 'lucide-react';
import { ProductionBlueprint, ShotDetail, SceneGenerationStatus, MediaToolsConfig } from '../types/director';
import { downloadFile } from '../utils/exportUtils';
import { useMediaGeneration } from '../hooks/useMediaGeneration';
import { ProviderStatusModal } from './ProviderStatusModal';
import { SceneCharacterSelector } from './SceneCharacterSelector';
import { PromptConsistencyInspector } from './PromptConsistencyInspector';
import { GoogleFlowWorkflowPanel } from './GoogleFlowWorkflowPanel';
import { BatchImageProgressModal } from './BatchImageProgressModal';
import { GoogleFlowBatchModal } from './GoogleFlowBatchModal';

interface MediaGenerationManagerProps {
  blueprint: ProductionBlueprint;
  onUpdateBlueprint: (updated: ProductionBlueprint) => void;
}

const DEFAULT_IMAGE_TOOLS = [
  { name: 'Bing Image Creator (Copilot)', url: 'https://copilot.microsoft.com/images/create', tier: 'DALL-E 3 ฟรี' },
  { name: 'SeaArt.ai', url: 'https://www.seaart.ai', tier: 'เหรียญฟรีทุกวัน (มี Face Swap)' },
  { name: 'Tensor.art', url: 'https://tensor.art', tier: '100 เครดิตฟรี/วัน' },
  { name: 'Recraft.ai', url: 'https://www.recraft.ai', tier: 'เวกเตอร์ & 3D ฟรี' },
  { name: 'Pollinations.ai', url: 'https://pollinations.ai', tier: 'ฟรี ไม่ต้องล็อกอิน' },
];

const DEFAULT_VIDEO_TOOLS = [
  { name: 'Google Flow (labs.google/flow)', url: 'https://labs.google/flow', tier: 'Google Labs AI Video Workspace' },
  { name: 'Kling AI (klingai.com)', url: 'https://klingai.com', tier: '66 เครดิตฟรีทุกวัน (5s)' },
  { name: 'Haiper 2.0', url: 'https://haiper.ai', tier: 'HD Video ฟรี' },
  { name: 'Luma Dream Machine', url: 'https://lumalabs.ai/dream-machine', tier: 'ฟรี 30 เจน/เดือน' },
  { name: 'Pika Labs', url: 'https://pika.art', tier: 'ฟรี' },
];

export const MediaGenerationManager: React.FC<MediaGenerationManagerProps> = ({
  blueprint,
  onUpdateBlueprint,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);
  const [isGoogleFlowBatchOpen, setIsGoogleFlowBatchOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [shotAspectRatios, setShotAspectRatios] = useState<Record<number, '9:16' | '16:9' | '1:1' | '4:3' | '3:4'>>({});

  const handleUpdateShot = (updatedShot: ShotDetail) => {
    const originalIndex = blueprint.shots.findIndex((s) => s.shotNumber === updatedShot.shotNumber);
    if (originalIndex !== -1) {
      const updatedShots = [...blueprint.shots];
      updatedShots[originalIndex] = updatedShot;
      onUpdateBlueprint({
        ...blueprint,
        shots: updatedShots,
      });
    }
  };

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
  } = useMediaGeneration(handleUpdateShot, blueprint);

  // Tools Configuration state
  const currentTools: MediaToolsConfig = blueprint.mediaToolsConfig || {
    imageGeneratorUrl: 'https://copilot.microsoft.com/images/create',
    imageGeneratorName: 'Bing Image Creator',
    videoGeneratorUrl: 'https://klingai.com',
    videoGeneratorName: 'Kling AI',
  };

  const [imageToolUrl, setImageToolUrl] = useState(currentTools.imageGeneratorUrl);
  const [videoToolUrl, setVideoToolUrl] = useState(currentTools.videoGeneratorUrl);

  const handleSaveToolUrls = () => {
    const updated: ProductionBlueprint = {
      ...blueprint,
      mediaToolsConfig: {
        ...currentTools,
        imageGeneratorUrl: imageToolUrl.trim() || 'https://copilot.microsoft.com/images/create',
        videoGeneratorUrl: videoToolUrl.trim() || 'https://klingai.com',
      },
    };
    onUpdateBlueprint(updated);
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleOpenUrl = (url: string) => {
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const updateShotField = (shotIndex: number, fields: Partial<ShotDetail>) => {
    const updatedShots = [...blueprint.shots];
    updatedShots[shotIndex] = {
      ...updatedShots[shotIndex],
      ...fields,
    };
    onUpdateBlueprint({
      ...blueprint,
      shots: updatedShots,
    });
  };

  const handleStatusChange = (shotIndex: number, newStatus: SceneGenerationStatus) => {
    updateShotField(shotIndex, { generationStatus: newStatus });
  };

  const handleFileUpload = (
    shotIndex: number,
    field: 'generatedImage' | 'referenceImage' | 'generatedVideo',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Read file as Data URL for local preview on mobile
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const updates: Partial<ShotDetail> = { [field]: result };
      // If uploading an image, automatically advance status if planned
      if (field === 'generatedImage' && (!updatedShots[shotIndex].generationStatus || updatedShots[shotIndex].generationStatus === 'PLANNED' || updatedShots[shotIndex].generationStatus === 'PROMPT_READY')) {
        updates.generationStatus = 'IMAGE_READY';
      } else if (field === 'generatedVideo') {
        updates.generationStatus = 'VIDEO_READY';
      }
      updateShotField(shotIndex, updates);
    };
    reader.readAsDataURL(file);
  };

  const handleExportProjectJSON = () => {
    const jsonStr = JSON.stringify(blueprint, null, 2);
    downloadFile(`AIVC-Project-${blueprint.id}.json`, jsonStr, 'application/json');
  };

  const updatedShots = blueprint.shots.map((s, idx) => ({
    ...s,
    sceneId: s.sceneId || `SC-${String(idx + 1).padStart(2, '0')}`,
    generationStatus: s.generationStatus || 'PROMPT_READY',
  }));

  // Statistics calculation
  const totalScenes = updatedShots.length;
  const statusCounts = {
    PLANNED: updatedShots.filter((s) => s.generationStatus === 'PLANNED').length,
    PROMPT_READY: updatedShots.filter((s) => s.generationStatus === 'PROMPT_READY').length,
    IMAGE_READY: updatedShots.filter((s) => s.generationStatus === 'IMAGE_READY').length,
    VIDEO_READY: updatedShots.filter((s) => s.generationStatus === 'VIDEO_READY').length,
    COMPLETED: updatedShots.filter((s) => s.generationStatus === 'COMPLETED').length,
    FAILED: updatedShots.filter((s) => s.generationStatus === 'FAILED').length,
  };

  const missingImagesCount = updatedShots.filter((s) => !s.generatedImage && s.generationStatus !== 'COMPLETED').length;
  const missingVideosCount = updatedShots.filter((s) => !s.generatedVideo && s.generationStatus !== 'COMPLETED').length;
  const completedCount = statusCounts.COMPLETED;

  const filteredShots = filterStatus === 'ALL'
    ? updatedShots
    : updatedShots.filter((s) => s.generationStatus === filterStatus);

  const getStatusBadge = (status?: SceneGenerationStatus) => {
    switch (status) {
      case 'PLANNED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">PLANNED (วางแผน)</span>;
      case 'PROMPT_READY':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">PROMPT_READY (พร้อมเจน)</span>;
      case 'IMAGE_READY':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">IMAGE_READY (ได้ภาพแล้ว)</span>;
      case 'VIDEO_READY':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">VIDEO_READY (ได้วิดีโอแล้ว)</span>;
      case 'COMPLETED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40">COMPLETED (เสร็จสมบูรณ์)</span>;
      case 'FAILED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40">FAILED (ต้องแก้ไข)</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400">PLANNED</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Media Generation Manager Overview */}
      <div className="bg-gradient-to-r from-indigo-950/60 via-slate-900 to-purple-950/40 border border-indigo-500/30 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Media Generation Manager (AIVC V3.3)</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/15 text-teal-300 border border-teal-500/30">
                  Google Flow Studio Bridge
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                จัดการขั้นตอนสร้างภาพและวิดีโอแยกตาม Scene ควบคุมสถานะจริง และสร้างภาพผ่าน Google Flow หรือ Direct AI Models
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Requirement C: One-Click Workflow "เริ่มสร้างภาพทุกฉาก" */}
            <button
              type="button"
              onClick={() => setIsGoogleFlowBatchOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-500 hover:from-blue-500 hover:via-indigo-500 hover:to-teal-400 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition cursor-pointer min-h-[36px]"
              title="เริ่มสร้างภาพทุกฉากผ่าน Google Flow (AIVC V3.3)"
            >
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>เริ่มสร้างภาพทุกฉาก (Google Flow)</span>
            </button>

            <button
              type="button"
              onClick={() => generateAllImages()}
              disabled={batchProgress?.isActive}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold shadow-sm transition disabled:opacity-50 cursor-pointer min-h-[36px]"
              title="สั่งให้โมเดล AI ในระบบสร้างภาพอัตโนมัติทีละฉาก"
            >
              {batchProgress?.isActive ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                  <span>กำลังสร้าง ({batchProgress.current}/{batchProgress.total})...</span>
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4 text-indigo-400" />
                  <span>สร้างภาพทุกฉาก (AI Direct)</span>
                </>
              )}
            </button>

            {/* Requirement E: Download All Images */}
            <button
              type="button"
              onClick={downloadAllImages}
              disabled={isDownloadingAll || statusCounts.IMAGE_READY + statusCounts.COMPLETED === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 hover:text-white border border-emerald-500/40 text-xs font-semibold shadow-sm transition disabled:opacity-50 cursor-pointer min-h-[36px]"
              title="ดาวน์โหลดภาพจริงที่สร้างเสร็จแล้วทั้งหมดลงเครื่อง"
            >
              <Download className="w-4 h-4" />
              <span>
                {isDownloadingAll
                  ? `กำลังโหลด (${downloadProgress?.current}/${downloadProgress?.total})...`
                  : `ดาวน์โหลดภาพทั้งหมด (${statusCounts.IMAGE_READY + statusCounts.COMPLETED})`}
              </span>
            </button>

            <button
              type="button"
              onClick={handleExportProjectJSON}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md transition cursor-pointer min-h-[36px]"
              title="ส่งออกไฟล์ JSON ทั้งหมดพร้อมสถานะและลิงก์สื่อ"
            >
              <FileCode className="w-4 h-4" />
              <span>Export Project JSON</span>
            </button>
          </div>
        </div>

        {/* Truthful Status Notice */}
        <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed text-[11px]">
            <strong className="text-amber-300">กฎความโปร่งใส (Truth in Media):</strong>{' '}
            ระบบนี้จะไม่จำลองหรือแสดงสถานะว่ามีวิดีโอสำเร็จ หากยังไม่ได้สร้างจริง{' '}
            คุณสามารถคัดลอก Prompt แล้วกดเปิดเว็บไซต์ฟรี จากนั้นนำภาพหรือคลิปที่ได้มาใส่ในแต่ละ Scene แล้วทำเครื่องหมายสถานะตามจริง
          </div>
        </div>

        {/* Dashboard Progress Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 pt-1">
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-400 font-medium">ทั้งหมด</div>
            <div className="text-base font-bold text-white mt-0.5">{totalScenes} ฉาก</div>
          </div>
          <div className="bg-slate-950/70 p-3 rounded-xl border border-indigo-900/30">
            <div className="text-[10px] text-indigo-400 font-medium">Prompt พร้อม</div>
            <div className="text-base font-bold text-indigo-300 mt-0.5">{statusCounts.PROMPT_READY} ฉาก</div>
          </div>
          <div className="bg-slate-950/70 p-3 rounded-xl border border-emerald-900/30">
            <div className="text-[10px] text-emerald-400 font-medium">ได้ภาพแล้ว</div>
            <div className="text-base font-bold text-emerald-300 mt-0.5">{statusCounts.IMAGE_READY} ฉาก</div>
          </div>
          <div className="bg-slate-950/70 p-3 rounded-xl border border-purple-900/30">
            <div className="text-[10px] text-purple-400 font-medium">ได้วิดีโอแล้ว</div>
            <div className="text-base font-bold text-purple-300 mt-0.5">{statusCounts.VIDEO_READY} ฉาก</div>
          </div>
          <div className="bg-slate-950/70 p-3 rounded-xl border border-teal-900/30">
            <div className="text-[10px] text-teal-400 font-medium">สมบูรณ์ (Completed)</div>
            <div className="text-base font-bold text-teal-300 mt-0.5">{completedCount} / {totalScenes}</div>
          </div>
          <div className="bg-slate-950/70 p-3 rounded-xl border border-rose-900/30">
            <div className="text-[10px] text-rose-400 font-medium">ต้องแก้ไข (Failed)</div>
            <div className="text-base font-bold text-rose-400 mt-0.5">{statusCounts.FAILED} ฉาก</div>
          </div>
        </div>

        {/* Missing Media Alert Banner */}
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>
              สถานะความพร้อม: <strong>{missingImagesCount === 0 ? '✓ ได้ภาพครบแล้ว' : `ยังขาดภาพนิ่ง ${missingImagesCount} ฉาก`}</strong> •{' '}
              <strong>{missingVideosCount === 0 ? '✓ ได้วิดีโอครบแล้ว' : `ยังขาดวิดีโอ ${missingVideosCount} ฉาก`}</strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <span>ความคืบหน้า:</span>
            <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-teal-400"
                style={{ width: `${Math.round((completedCount / totalScenes) * 100)}%` }}
              />
            </div>
            <span className="font-mono text-white font-semibold">
              {Math.round((completedCount / totalScenes) * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* Tool URLs Configuration Card (Requirement 7) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              ตั้งค่าเว็บไซต์สร้างภาพและวิดีโอ (Custom Tool URLs)
            </h3>
          </div>
          <span className="text-[10px] text-slate-400">
            คลิกปุ่ม "เปิดเว็บ" ในแต่ละ Scene จะเปิดตาม URL ที่ตั้งไว้นี้
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Image Generator URL input */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5" />
                <span>URL เว็บสร้างภาพ (Image Generator)</span>
              </label>
              <button
                onClick={() => handleOpenUrl(imageToolUrl)}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                <span>ทดสอบเปิด</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </button>
            </div>

            <div className="flex gap-2">
              <input
                type="url"
                value={imageToolUrl}
                onChange={(e) => setImageToolUrl(e.target.value)}
                placeholder="https://copilot.microsoft.com/images/create"
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                onClick={handleSaveToolUrls}
                className="px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white text-xs font-medium transition"
              >
                บันทึก
              </button>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1 pt-1">
              <span className="text-[10px] text-slate-500">ทางเลือกฟรี:</span>
              {DEFAULT_IMAGE_TOOLS.map((t, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setImageToolUrl(t.url);
                    const updated = {
                      ...blueprint,
                      mediaToolsConfig: {
                        ...currentTools,
                        imageGeneratorUrl: t.url,
                        imageGeneratorName: t.name,
                      },
                    };
                    onUpdateBlueprint(updated);
                  }}
                  className={`text-[10px] px-2 py-0.5 rounded transition ${
                    imageToolUrl === t.url
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Video Generator URL input */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-rose-300 flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5" />
                <span>URL เว็บสร้างวิดีโอ (Video Generator)</span>
              </label>
              <button
                onClick={() => handleOpenUrl(videoToolUrl)}
                className="text-[10px] text-rose-400 hover:text-rose-300 flex items-center gap-1"
              >
                <span>ทดสอบเปิด</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </button>
            </div>

            <div className="flex gap-2">
              <input
                type="url"
                value={videoToolUrl}
                onChange={(e) => setVideoToolUrl(e.target.value)}
                placeholder="https://klingai.com"
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
              <button
                onClick={handleSaveToolUrls}
                className="px-3 py-1.5 rounded-lg bg-rose-600/30 hover:bg-rose-600 text-rose-200 hover:text-white text-xs font-medium transition"
              >
                บันทึก
              </button>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1 pt-1">
              <span className="text-[10px] text-slate-500">ทางเลือกฟรี:</span>
              {DEFAULT_VIDEO_TOOLS.map((t, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setVideoToolUrl(t.url);
                    const updated = {
                      ...blueprint,
                      mediaToolsConfig: {
                        ...currentTools,
                        videoGeneratorUrl: t.url,
                        videoGeneratorName: t.name,
                      },
                    };
                    onUpdateBlueprint(updated);
                  }}
                  className={`text-[10px] px-2 py-0.5 rounded transition ${
                    videoToolUrl === t.url
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Scenes Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2">
          <Film className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-bold text-white">
            รายการ Scene และสถานะการผลิตสื่อ ({filteredShots.length} / {totalScenes} ฉาก)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Provider Diagnostics button */}
          <button
            type="button"
            onClick={() => setIsDiagnosticsOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 text-xs font-medium transition"
            title="ตรวจสถานะโมเดลจริง AI Engine"
          >
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            <span>AI Model Diagnostics</span>
          </button>

          {/* Filter Badges */}
          <div className="flex flex-wrap gap-1 text-xs">
            {['ALL', 'PLANNED', 'PROMPT_READY', 'IMAGE_READY', 'VIDEO_READY', 'COMPLETED', 'FAILED'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition ${
                  filterStatus === st
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Scene Media Cards List (Requirements 2, 3, 4 + V3 Direct Generation) */}
      <div className="space-y-5">
        {filteredShots.map((shot, idx) => {
          const originalIndex = blueprint.shots.findIndex((s) => s.shotNumber === shot.shotNumber);
          const sceneIdentifier = shot.sceneId || `SC-${String(shot.shotNumber).padStart(2, '0')}`;
          const isCompleted = shot.generationStatus === 'COMPLETED';
          const currentRatio = shotAspectRatios[shot.shotNumber] || (shot.imagePrompt.aspectRatio as any) || '9:16';
          const isGeneratingImg = generatingImageShot === shot.shotNumber;
          const isGeneratingVid = generatingVideoShot === shot.shotNumber;

          return (
            <div
              key={shot.shotNumber}
              className={`bg-slate-900 border rounded-2xl p-5 shadow-xl transition-all space-y-4 ${
                isCompleted
                  ? 'border-teal-500/40 bg-slate-900/90'
                  : shot.generationStatus === 'FAILED'
                  ? 'border-rose-500/40'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Scene Card Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center font-bold text-white text-xs font-mono">
                    {sceneIdentifier}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <span>Shot #{shot.shotNumber} • {shot.shotType}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 font-mono">
                        {shot.timeRange} ({shot.durationSec}s)
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      กล้อง: {shot.cameraMovement} • {shot.actionDescription}
                    </div>
                  </div>
                </div>

                {/* Status Dropdown & Mark as Completed Button */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-400 hidden sm:inline">สถานะ:</span>
                    <select
                      value={shot.generationStatus || 'PROMPT_READY'}
                      onChange={(e) => handleStatusChange(originalIndex, e.target.value as SceneGenerationStatus)}
                      className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-medium focus:outline-none focus:ring-1 focus:ring-purple-500"
                    >
                      <option value="PLANNED">PLANNED (วางแผน)</option>
                      <option value="PROMPT_READY">PROMPT_READY (พร้อมเจน)</option>
                      <option value="IMAGE_READY">IMAGE_READY (ได้ภาพแล้ว)</option>
                      <option value="VIDEO_READY">VIDEO_READY (ได้วิดีโอแล้ว)</option>
                      <option value="COMPLETED">COMPLETED (เสร็จสมบูรณ์)</option>
                      <option value="FAILED">FAILED (มีปัญหา/แก้ Prompt)</option>
                    </select>
                  </div>

                  <button
                    onClick={() =>
                      handleStatusChange(
                        originalIndex,
                        isCompleted ? 'IMAGE_READY' : 'COMPLETED'
                      )
                    }
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold transition ${
                      isCompleted
                        ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 hover:bg-teal-500/30'
                        : 'bg-teal-600 hover:bg-teal-500 text-white shadow-sm'
                    }`}
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>{isCompleted ? '✓ เสร็จแล้ว' : 'Mark Completed'}</span>
                  </button>
                </div>
              </div>

              {/* FEATURE 1: Scene Character Assignment (AIVC V3.1) */}
              <SceneCharacterSelector
                characters={blueprint.characters || []}
                selectedCharacterIds={shot.characterIds || []}
                onChange={(updatedIds) =>
                  handleUpdateShot({
                    ...shot,
                    characterIds: updatedIds,
                  })
                }
                sceneId={sceneIdentifier}
                shotNumber={shot.shotNumber}
              />

              {/* FEATURE 2 & 3: Automatic Character-Aware Prompts & Consistency Inspector */}
              <PromptConsistencyInspector
                shot={shot}
                assignedCharacters={(blueprint.characters || []).filter((c) =>
                  (shot.characterIds || []).includes(c.id)
                )}
                environment={blueprint.environments?.[0]}
                onUpdateShot={handleUpdateShot}
              />

              {/* FEATURE 4: Google Flow Workflow Integration Panel */}
              <GoogleFlowWorkflowPanel
                shot={shot}
                assignedCharacters={(blueprint.characters || []).filter((c) =>
                  (shot.characterIds || []).includes(c.id)
                )}
                onUpdateShot={handleUpdateShot}
              />

              {/* FEATURE 3: V3 DIRECT MEDIA GENERATION CONTROLS BAR */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-indigo-500/30 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Direct AI Generation Controls
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
                      V3 Engine
                    </span>
                  </div>

                  {/* Aspect Ratio Selector */}
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-[11px] text-slate-400">Aspect Ratio:</span>
                    <select
                      value={currentRatio}
                      onChange={(e) =>
                        setShotAspectRatios({
                          ...shotAspectRatios,
                          [shot.shotNumber]: e.target.value as any,
                        })
                      }
                      className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-indigo-300 font-medium focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="9:16">9:16 (แนวตั้ง TikTok/Shorts)</option>
                      <option value="16:9">16:9 (แนวนอน YouTube)</option>
                      <option value="1:1">1:1 (จัตุรัส Square)</option>
                      <option value="4:3">4:3 (มาตรฐาน Standard)</option>
                      <option value="3:4">3:4 (ภาพบุคคล Portrait)</option>
                    </select>
                  </div>
                </div>

                {/* Clearly Labeled Action Buttons: Generate Image, Generate Video, Animate Reference Image, Download Image, Download Video */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 pt-1">
                  {/* 1. Generate Image */}
                  <button
                    type="button"
                    disabled={isGeneratingImg}
                    onClick={() => generateImage(shot, currentRatio)}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900/60 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition cursor-pointer"
                    title="สร้างภาพโดยตรงจาก Image Prompt"
                  >
                    {isGeneratingImg ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                        <span>Generating Image...</span>
                      </>
                    ) : (
                      <>
                        <Camera className="w-3.5 h-3.5" />
                        <span>Generate Image</span>
                      </>
                    )}
                  </button>

                  {/* 2. Generate Video */}
                  <button
                    type="button"
                    disabled={isGeneratingVid}
                    onClick={() => generateVideo(shot)}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:bg-rose-900/60 text-white text-xs font-semibold shadow-md shadow-rose-600/20 transition cursor-pointer"
                    title="สร้างวิดีโอโดยตรงจาก Video Motion Prompt"
                  >
                    {isGeneratingVid ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                        <span>Generating Video...</span>
                      </>
                    ) : (
                      <>
                        <Video className="w-3.5 h-3.5" />
                        <span>Generate Video</span>
                      </>
                    )}
                  </button>

                  {/* 3. Animate Reference Image */}
                  <button
                    type="button"
                    disabled={isGeneratingVid || (!shot.generatedImage && !shot.referenceImage)}
                    onClick={() => animateReferenceImage(shot)}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-md shadow-purple-600/20 transition cursor-pointer"
                    title={
                      shot.generatedImage || shot.referenceImage
                        ? 'แปลงภาพตั้งต้นเป็นวิดีโอ (Image-to-Video)'
                        : 'ต้องมีภาพในฉากนี้ก่อนทำการ Animate'
                    }
                  >
                    {isGeneratingVid ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                        <span>Animating...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" />
                        <span>Animate Reference Image</span>
                      </>
                    )}
                  </button>

                  {/* 4. Download Image */}
                  <button
                    type="button"
                    disabled={!shot.generatedImage}
                    onClick={() => downloadImage(shot)}
                    className={`inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                      shot.generatedImage
                        ? 'bg-slate-800 hover:bg-indigo-600/30 text-indigo-300 hover:text-white border-indigo-500/40'
                        : 'bg-slate-800/40 text-slate-600 border-slate-800 cursor-not-allowed'
                    }`}
                    title={shot.generatedImage ? 'ดาวน์โหลดภาพที่สร้างได้' : 'ยังไม่มีภาพสำหรับดาวน์โหลด'}
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Image</span>
                  </button>

                  {/* 5. Download Video */}
                  <button
                    type="button"
                    disabled={!shot.generatedVideo}
                    onClick={() => downloadVideo(shot)}
                    className={`inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                      shot.generatedVideo
                        ? 'bg-slate-800 hover:bg-rose-600/30 text-rose-300 hover:text-white border-rose-500/40'
                        : 'bg-slate-800/40 text-slate-600 border-slate-800 cursor-not-allowed'
                    }`}
                    title={shot.generatedVideo ? 'ดาวน์โหลดคลิปวิดีโอที่สร้างได้' : 'ยังไม่มีวิดีโอสำหรับดาวน์โหลด'}
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Video</span>
                  </button>
                </div>
              </div>

              {/* Requirement 2: 4 Utility Action Buttons Bar (Prompt Copies & Web Tools) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-0.5">
                {/* 1. Copy Image Prompt */}
                <button
                  type="button"
                  onClick={() => handleCopy(shot.imagePrompt.positivePromptEn, `img-${shot.shotNumber}`)}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 text-indigo-200 text-xs font-medium transition"
                >
                  {copiedKey === `img-${shot.shotNumber}` ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>คัดลอกแล้ว!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Image Prompt</span>
                    </>
                  )}
                </button>

                {/* 2. Copy Video Motion Prompt */}
                <button
                  type="button"
                  onClick={() => handleCopy(shot.motionPrompt.videoPromptEn, `motion-${shot.shotNumber}`)}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/40 border border-rose-500/30 text-rose-200 text-xs font-medium transition"
                >
                  {copiedKey === `motion-${shot.shotNumber}` ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>คัดลอกแล้ว!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Video Motion</span>
                    </>
                  )}
                </button>

                {/* 3. Open Image Generator */}
                <button
                  type="button"
                  onClick={() => handleOpenUrl(imageToolUrl)}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition border border-slate-700"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Open Image Tool</span>
                </button>

                {/* 4. Open Video Generator */}
                <button
                  type="button"
                  onClick={() => handleOpenUrl(videoToolUrl)}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition border border-slate-700"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-rose-400" />
                  <span>Open Video Tool</span>
                </button>
              </div>

              {/* Requirement 3: Detailed Data Storage Fields for Scene */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
                {/* Left Column: Prompts Display */}
                <div className="space-y-3">
                  {/* Image Prompt Preview */}
                  <div className="bg-slate-950 p-3 rounded-xl border border-indigo-900/30 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-indigo-300">
                      <span className="flex items-center gap-1">
                        <Camera className="w-3.5 h-3.5" />
                        <span>Image Prompt ({currentRatio})</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        Style: {shot.imagePrompt.styleTags}
                      </span>
                    </div>
                    <div className="bg-slate-900/90 p-2 rounded-lg text-[11px] font-mono text-slate-300 leading-relaxed max-h-24 overflow-y-auto select-all">
                      {shot.imagePrompt.positivePromptEn}
                    </div>
                  </div>

                  {/* Video Motion Prompt Preview */}
                  <div className="bg-slate-950 p-3 rounded-xl border border-rose-900/30 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-rose-300">
                      <span className="flex items-center gap-1">
                        <Video className="w-3.5 h-3.5" />
                        <span>Video Motion Prompt</span>
                      </span>
                      <span className="text-[10px] text-rose-400 font-mono">
                        {shot.motionPrompt.motionIntensity}
                      </span>
                    </div>
                    <div className="bg-slate-900/90 p-2 rounded-lg text-[11px] font-mono text-slate-300 leading-relaxed max-h-24 overflow-y-auto select-all">
                      {shot.motionPrompt.videoPromptEn}
                    </div>
                  </div>
                </div>

                {/* Right Column: Assets Inputs & Live Visual Inspection Preview */}
                <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                    <span>ข้อมูลสื่อที่สร้างจริง (Media Assets Tracker)</span>
                    {getStatusBadge(shot.generationStatus)}
                  </div>

                  {/* Reference Image Input */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
                      <span>ภาพอ้างอิง (Reference Image URL หรือคำอธิบาย)</span>
                      {shot.referenceImage && <span className="text-emerald-400 text-[10px]">✓ มีข้อมูล</span>}
                    </label>
                    <input
                      type="text"
                      value={shot.referenceImage || ''}
                      onChange={(e) => updateShotField(originalIndex, { referenceImage: e.target.value })}
                      placeholder="เช่น SC-01 (ดร. นภันต์) หรือแปะ URL ภาพ"
                      className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>

                  {/* Generated Image Input & Interactive Preview */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-medium text-slate-400">
                      <span className="flex items-center gap-1">
                        <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                        <span>ภาพนิ่งที่สร้างได้ (Generated Image)</span>
                      </span>
                      {shot.generatedImage ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => downloadImage(shot)}
                            className="text-indigo-400 hover:text-indigo-300 text-[10px] flex items-center gap-1"
                            title="ดาวน์โหลดภาพ"
                          >
                            <Download className="w-2.5 h-2.5" />
                            <span>โหลดภาพ</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => updateShotField(originalIndex, { generatedImage: '' })}
                            className="text-rose-400 hover:text-rose-300 text-[10px] flex items-center gap-1"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                            <span>ลบ</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-amber-400 text-[10px]">⚠️ ยังไม่มีภาพ</span>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={shot.generatedImage?.startsWith('data:') ? '[ไฟล์ภาพบันทึกแล้ว]' : shot.generatedImage || ''}
                        onChange={(e) => updateShotField(originalIndex, { generatedImage: e.target.value })}
                        placeholder="แปะ URL รูปภาพ หรือกด 'Generate Image' ด้านบน"
                        className="flex-1 bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />

                      {/* File upload button for mobile */}
                      <label className="cursor-pointer px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center gap-1 transition">
                        <Upload className="w-3 h-3" />
                        <span className="hidden sm:inline">อัปโหลด</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileUpload(originalIndex, 'generatedImage', e)}
                        />
                      </label>
                    </div>

                    {/* Interactive Image Inspection Component */}
                    {shot.generatedImage && (
                      <div className="mt-2 relative rounded-xl overflow-hidden border border-indigo-500/40 bg-slate-900 group">
                        <img
                          src={shot.generatedImage}
                          alt={`Shot ${shot.shotNumber} generated`}
                          className="w-full max-h-48 object-contain bg-black/50"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                          <button
                            type="button"
                            onClick={() => setLightboxImage(shot.generatedImage!)}
                            className="p-2 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-white text-xs flex items-center gap-1"
                            title="ดูภาพขนาดใหญ่"
                          >
                            <Maximize2 className="w-3.5 h-3.5" />
                            <span>ขยาย</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => downloadImage(shot)}
                            className="p-2 rounded-lg bg-indigo-600/90 hover:bg-indigo-500 text-white text-xs flex items-center gap-1"
                            title="ดาวน์โหลดภาพ"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>ดาวน์โหลด</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Generated Video Input & Interactive Video Player */}
                  <div className="space-y-2 pt-1 border-t border-slate-850">
                    <div className="flex items-center justify-between text-[11px] font-medium text-slate-400">
                      <span className="flex items-center gap-1">
                        <Video className="w-3.5 h-3.5 text-rose-400" />
                        <span>วิดีโอที่สร้างได้ (Generated Video)</span>
                      </span>
                      {shot.generatedVideo ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => downloadVideo(shot)}
                            className="text-rose-400 hover:text-rose-300 text-[10px] flex items-center gap-1"
                            title="ดาวน์โหลดคลิป"
                          >
                            <Download className="w-2.5 h-2.5" />
                            <span>โหลดคลิป</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => updateShotField(originalIndex, { generatedVideo: '' })}
                            className="text-rose-400 hover:text-rose-300 text-[10px] flex items-center gap-1"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                            <span>ลบ</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-amber-400 text-[10px]">⚠️ ยังไม่มีวิดีโอ</span>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={shot.generatedVideo?.startsWith('data:') ? '[ไฟล์วิดีโอบันทึกแล้ว]' : shot.generatedVideo || ''}
                        onChange={(e) => updateShotField(originalIndex, { generatedVideo: e.target.value })}
                        placeholder="แปะ URL วิดีโอ หรือกด 'Generate Video' ด้านบน"
                        className="flex-1 bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                      />

                      {/* Video upload button for mobile */}
                      <label className="cursor-pointer px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center gap-1 transition">
                        <Upload className="w-3 h-3" />
                        <span className="hidden sm:inline">อัปโหลด</span>
                        <input
                          type="file"
                          accept="video/*"
                          className="hidden"
                          onChange={(e) => handleFileUpload(originalIndex, 'generatedVideo', e)}
                        />
                      </label>
                    </div>

                    {/* Interactive HTML5 Video Player */}
                    {shot.generatedVideo && (
                      <div className="mt-2 rounded-xl overflow-hidden border border-rose-500/40 bg-black shadow-lg">
                        <video
                          src={shot.generatedVideo}
                          controls
                          playsInline
                          className="w-full max-h-48 object-contain"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Lightbox Modal for Image Inspection */}
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

      {/* Provider Status & Error Diagnostics Modal */}
      <ProviderStatusModal
        isOpen={isDiagnosticsOpen || Boolean(errorNotice)}
        onClose={() => {
          setIsDiagnosticsOpen(false);
          clearErrorNotice();
        }}
        errorNotice={errorNotice}
        providerStatuses={providerStatuses}
        onOpenFreeTool={() => handleOpenUrl(imageToolUrl)}
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

      {/* Google Flow Batch Modal (Requirement C: One-Click Workflow) */}
      <GoogleFlowBatchModal
        isOpen={isGoogleFlowBatchOpen}
        onClose={() => setIsGoogleFlowBatchOpen(false)}
        blueprint={blueprint}
        onUpdateShot={handleUpdateShot}
        onUpdateBlueprint={onUpdateBlueprint}
      />
    </div>
  );
};
