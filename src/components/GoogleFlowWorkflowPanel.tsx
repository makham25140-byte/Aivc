import React, { useState, useRef } from 'react';
import {
  ExternalLink,
  Copy,
  Check,
  Video,
  Upload,
  Sparkles,
  Link as LinkIcon,
  FileCheck,
  Film,
  Camera,
  Layers,
  Info,
  ChevronDown,
  ChevronUp,
  Trash2,
  Play,
  Download,
  Maximize2,
  AlertCircle,
  Image as ImageIcon,
  X
} from 'lucide-react';
import { ShotDetail, CharacterProfile, VideoMetadata, ImageMetadata } from '../types/director';
import { formatPromptForGoogleFlow } from '../utils/consistencyEngine';
import { OFFICIAL_GOOGLE_FLOW_URL, OFFICIAL_GOOGLE_FLOW_LABS_URL, safeOpenGoogleFlow } from '../utils/flowLinks';

interface GoogleFlowWorkflowPanelProps {
  shot: ShotDetail;
  assignedCharacters: CharacterProfile[];
  onUpdateShot: (updatedShot: ShotDetail) => void;
}

export const GoogleFlowWorkflowPanel: React.FC<GoogleFlowWorkflowPanelProps> = ({
  shot,
  assignedCharacters,
  onUpdateShot,
}) => {
  const [activeWorkflowTab, setActiveWorkflowTab] = useState<'IMAGE' | 'VIDEO'>('IMAGE');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(false);
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const officialFlowUrl = OFFICIAL_GOOGLE_FLOW_URL;
  const [flowOpenNotice, setFlowOpenNotice] = useState<{ message: string; url: string } | null>(null);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleOpenGoogleFlow = async (promptToCopy?: string, fieldName?: string) => {
    if (fieldName) {
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    }
    const result = await safeOpenGoogleFlow(promptToCopy);
    if (result.isBlockedByPopupBlocker) {
      setFlowOpenNotice({
        message: result.errorMessage || 'เบราว์เซอร์บล็อกหน้าต่างแท็บใหม่ กรุณาคลิกปุ่มเปิดโดยตรง',
        url: result.targetUrl,
      });
    } else {
      setFlowOpenNotice(null);
    }
  };

  // Requirement D: Image Import & File Validation
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError(null);

    // Validate image MIME type
    if (!file.type.startsWith('image/')) {
      setFileError(`ไฟล์ "${file.name}" ไม่ใช่รูปภาพ กรุณาเลือกไฟล์ภาพ เช่น .jpg, .png, .webp`);
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => {
      setFileError('ไม่สามารถอ่านไฟล์ภาพจากเครื่องได้');
    };
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) {
        setFileError('ข้อมูลรูปภาพว่างเปล่า');
        return;
      }

      const metadata: ImageMetadata = {
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        attachedAt: new Date().toISOString(),
        provider: 'Google Flow',
        notes: `ภาพผลลัพธ์จาก Google Flow (${Math.round(file.size / 1024)} KB)`,
      };

      onUpdateShot({
        ...shot,
        generatedImage: dataUrl,
        imageMetadata: metadata,
        flowWorkflowStatus: 'DONE',
        generationStatus: shot.generatedVideo ? 'COMPLETED' : 'IMAGE_READY',
        mediaNotes: `สร้างภาพจาก Google Flow สำเร็จ: ${file.name}`,
      });
    };

    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveImage = () => {
    onUpdateShot({
      ...shot,
      generatedImage: '',
      imageMetadata: undefined,
      flowWorkflowStatus: 'QUEUED',
      generationStatus: shot.generatedVideo ? 'VIDEO_READY' : 'PROMPT_READY',
    });
  };

  // Local Video File Attachment
  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError(null);

    if (!file.type.startsWith('video/')) {
      setFileError(`ไฟล์ "${file.name}" ไม่ใช่วิดีโอ กรุณาเลือกไฟล์วิดีโอ เช่น .mp4, .webm`);
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => {
      setFileError('ไม่สามารถอ่านไฟล์วิดีโอได้');
    };
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const metadata: VideoMetadata = {
        fileName: file.name,
        fileSize: file.size,
        attachedAt: new Date().toISOString(),
        provider: 'Google Flow',
        notes: `ไฟล์วิดีโอจาก Google Flow (${Math.round(file.size / 1024)} KB)`,
      };

      onUpdateShot({
        ...shot,
        generatedVideo: dataUrl,
        videoMetadata: metadata,
        generationStatus: shot.generatedImage ? 'COMPLETED' : 'VIDEO_READY',
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleAttachVideoUrl = () => {
    if (!videoUrlInput.trim()) return;
    const metadata: VideoMetadata = {
      fileName: 'Remote Video Link',
      attachedAt: new Date().toISOString(),
      provider: 'Google Flow',
      notes: `ลิงก์วิดีโอ: ${videoUrlInput.trim()}`,
    };

    onUpdateShot({
      ...shot,
      generatedVideo: videoUrlInput.trim(),
      videoMetadata: metadata,
      generationStatus: shot.generatedImage ? 'COMPLETED' : 'VIDEO_READY',
    });
    setVideoUrlInput('');
    setShowUrlInput(false);
  };

  const handleRemoveVideo = () => {
    onUpdateShot({
      ...shot,
      generatedVideo: '',
      videoMetadata: undefined,
      generationStatus: shot.generatedImage ? 'IMAGE_READY' : 'PROMPT_READY',
    });
  };

  const hasAttachedImage = Boolean(shot.generatedImage);
  const hasAttachedVideo = Boolean(shot.generatedVideo);

  const googleFlowImagePrompt = formatPromptForGoogleFlow(
    shot.imagePrompt?.positivePromptEn || '',
    shot.imagePrompt?.aspectRatio || '9:16'
  );

  return (
    <div className="bg-gradient-to-b from-indigo-950/40 via-slate-900 to-slate-950 border border-indigo-500/30 rounded-xl p-4 sm:p-5 space-y-4 shadow-lg">
      {/* Provider Header & Truth in Connection Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-indigo-500/20">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-indigo-600/30 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-xs sm:text-sm font-bold text-white tracking-wide">
                Google Flow AI Studio (Image & Video Workflow)
              </h4>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                Official Bridge Mode
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              สร้างภาพนิ่งและวิดีโอผ่าน Google Flow (flow.google.com) พร้อมระบบล็อคตัวละคร
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={OFFICIAL_GOOGLE_FLOW_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 transition min-h-[40px] touch-manipulation cursor-pointer"
            title="เปิด flow.google.com ในแท็บใหม่โดยตรง (ป้องกันการโดนบล็อกป๊อปอัป)"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>เปิดเว็บ Google Flow (flow.google.com)</span>
          </a>
        </div>
      </div>

      {/* Anti-Blank Popup Blocked Fallback Banner */}
      {flowOpenNotice && (
        <div className="p-3 bg-amber-950/85 border border-amber-500/40 rounded-xl text-xs text-amber-200 flex flex-col md:flex-row md:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{flowOpenNotice.message}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <a
              href={flowOpenNotice.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow transition cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>เปิด flow.google.com ในแท็บใหม่</span>
            </a>
            <a
              href={OFFICIAL_GOOGLE_FLOW_LABS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs border border-slate-700 transition cursor-pointer"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Google Labs Flow</span>
            </a>
            <button
              type="button"
              onClick={() => handleOpenGoogleFlow(googleFlowImagePrompt, 'image-prompt')}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600/40 hover:bg-indigo-600 text-indigo-200 hover:text-white border border-indigo-500/40 text-xs transition cursor-pointer"
            >
              <span>ลองเปิดใหม่อีกครั้ง</span>
            </button>
            <button
              type="button"
              onClick={() => setFlowOpenNotice(null)}
              className="p-1 text-slate-400 hover:text-white"
              title="ปิดการแจ้งเตือน"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Workflow Mode Tabs (IMAGE vs VIDEO) */}
      <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
        <button
          onClick={() => setActiveWorkflowTab('IMAGE')}
          className={`flex-1 py-1.5 px-3 rounded-md font-semibold transition flex items-center justify-center gap-1.5 ${
            activeWorkflowTab === 'IMAGE'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Camera className="w-3.5 h-3.5" />
          <span>1. สร้างภาพนิ่งใน Google Flow (Image Studio)</span>
          {hasAttachedImage && <Check className="w-3.5 h-3.5 text-emerald-400" />}
        </button>

        <button
          onClick={() => setActiveWorkflowTab('VIDEO')}
          className={`flex-1 py-1.5 px-3 rounded-md font-semibold transition flex items-center justify-center gap-1.5 ${
            activeWorkflowTab === 'VIDEO'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Video className="w-3.5 h-3.5" />
          <span>2. สร้างวิดีโอขยับภาพ (Motion Studio)</span>
          {hasAttachedVideo && <Check className="w-3.5 h-3.5 text-emerald-400" />}
        </button>
      </div>

      {/* Error Banner if any */}
      {fileError && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-2.5 text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{fileError}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 1: GOOGLE FLOW IMAGE WORKFLOW                        */}
      {/* ======================================================== */}
      {activeWorkflowTab === 'IMAGE' && (
        <div className="space-y-4">
          {/* Image Prompt Bridge */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-teal-300 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-teal-400" />
                <span>Image Prompt สำหรับใส่ใน Google Flow (ช็อต {shot.shotNumber}):</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {shot.imagePrompt?.aspectRatio || '9:16'}
              </span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded p-2.5 text-xs font-mono text-slate-200 leading-relaxed max-h-24 overflow-y-auto select-all">
              {googleFlowImagePrompt}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                onClick={() => handleCopy(googleFlowImagePrompt, 'image-prompt')}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-teal-600/30 hover:bg-teal-600 text-teal-200 hover:text-white font-semibold text-xs border border-teal-500/40 transition min-h-[40px] touch-manipulation"
              >
                {copiedField === 'image-prompt' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span>คัดลอก Image Prompt แล้ว!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>คัดลอก Image Prompt</span>
                  </>
                )}
              </button>

              <button
                onClick={() => handleOpenGoogleFlow(googleFlowImagePrompt, 'image-prompt')}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition min-h-[40px] touch-manipulation shadow-sm"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>คัดลอกแล้วเปิด Google Flow</span>
              </button>
            </div>
          </div>

          {/* Character Lock Tags */}
          {assignedCharacters.length > 0 && (
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-slate-400 font-medium">ตัวละครล็อคในฉาก:</span>
                {assignedCharacters.map((c) => (
                  <span
                    key={c.id}
                    className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 font-medium text-[11px]"
                  >
                    {c.name} {c.isLocked !== false && '🔒'}
                  </span>
                ))}
              </div>

              <button
                onClick={() =>
                  handleCopy(
                    assignedCharacters.map((c) => c.consistencyLockPrompt).join('; '),
                    'char-locks'
                  )
                }
                className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium touch-manipulation"
              >
                {copiedField === 'char-locks' ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>คัดลอก Lock Prompt แล้ว</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>คัดลอก Lock Prompt ตัวละคร</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Attach Result Image Box */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-teal-400" />
                <span className="text-xs font-bold text-white">
                  แนบไฟล์รูปภาพจาก Google Flow เข้าสู่ฉากนี้ (Attach Image)
                </span>
              </div>

              {hasAttachedImage && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  มีภาพแล้ว (IMAGE_READY)
                </span>
              )}
            </div>

            {hasAttachedImage ? (
              <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                <div
                  className="relative w-32 h-24 rounded-lg overflow-hidden border border-slate-700 bg-black shrink-0 cursor-pointer group"
                  onClick={() => setLightboxImage(shot.generatedImage!)}
                >
                  <img
                    src={shot.generatedImage}
                    alt={`Scene ${shot.sceneId}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs transition">
                    <Maximize2 className="w-4 h-4" />
                  </div>
                </div>

                <div className="flex-1 min-w-0 space-y-1 text-xs">
                  <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-emerald-400" />
                    <span className="truncate">
                      {shot.imageMetadata?.fileName || 'รูปภาพของฉากนี้'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {shot.imageMetadata?.notes || 'ภาพพร้อมใช้งาน'}
                    {shot.imageMetadata?.attachedAt &&
                      ` • แนบเมื่อ ${new Date(shot.imageMetadata.attachedAt).toLocaleTimeString('th-TH')}`}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    สามารถส่งต่อไปสร้างวิดีโอ (Motion) หรือจัดเรียงใน Storyboard
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setLightboxImage(shot.generatedImage!)}
                    className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
                  >
                    ขยายดู
                  </button>
                  <button
                    onClick={handleRemoveImage}
                    className="px-2.5 py-1.5 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-medium transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id={`flow-image-upload-${shot.shotNumber}`}
                />
                <label
                  htmlFor={`flow-image-upload-${shot.shotNumber}`}
                  className="cursor-pointer border-2 border-dashed border-teal-500/40 hover:border-teal-400 bg-teal-950/20 hover:bg-teal-950/40 rounded-xl p-4 flex flex-col items-center justify-center gap-2 text-center transition min-h-[90px] touch-manipulation"
                >
                  <Upload className="w-5 h-5 text-teal-400" />
                  <span className="text-xs font-semibold text-teal-200">
                    เลือกไฟล์รูปภาพที่ดาวน์โหลดจาก Google Flow (.png, .jpg, .webp)
                  </span>
                  <span className="text-[10px] text-slate-400">
                    คลิกเพื่อเปิดอัลบั้มรูปภาพหรือไฟล์ในเครื่อง
                  </span>
                </label>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: GOOGLE FLOW VIDEO WORKFLOW                        */}
      {/* ======================================================== */}
      {activeWorkflowTab === 'VIDEO' && (
        <div className="space-y-4">
          {/* Motion Prompt Bridge */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-indigo-300 flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5 text-indigo-400" />
                <span>Video Motion Prompt (ช็อต {shot.shotNumber}):</span>
              </span>
              <span className="text-[10px] text-slate-400">
                {shot.motionPrompt?.motionIntensity || 'Medium'}
              </span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded p-2.5 text-xs font-mono text-slate-200 leading-relaxed max-h-24 overflow-y-auto select-all">
              {shot.motionPrompt?.videoPromptEn || 'No motion prompt available'}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                onClick={() => handleCopy(shot.motionPrompt?.videoPromptEn || '', 'motion')}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white font-semibold text-xs border border-indigo-500/40 transition min-h-[40px] touch-manipulation"
              >
                {copiedField === 'motion' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span>คัดลอก Motion Prompt แล้ว!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>คัดลอก Video Motion Prompt</span>
                  </>
                )}
              </button>

              <button
                onClick={() => handleOpenGoogleFlow(shot.motionPrompt?.videoPromptEn, 'motion')}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition min-h-[40px] touch-manipulation shadow-sm"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>คัดลอกแล้วเปิด Google Flow</span>
              </button>
            </div>
          </div>

          {/* Attach Video Section */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white">
                  แนบไฟล์วิดีโอผลลัพธ์เข้าสู่ช็อต (Attach Video)
                </span>
              </div>

              {hasAttachedVideo && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  มีวิดีโอแล้ว
                </span>
              )}
            </div>

            {hasAttachedVideo ? (
              <div className="space-y-3">
                <div className="relative rounded-lg overflow-hidden bg-black border border-slate-800 aspect-[9/16] sm:aspect-video max-h-72 w-full flex items-center justify-center">
                  <video
                    src={shot.generatedVideo}
                    controls
                    playsInline
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-200 truncate">
                      {shot.videoMetadata?.fileName || 'วิดีโอของช็อตนี้'}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {shot.videoMetadata?.notes || 'พร้อมใช้งานในขั้นตอนตัดต่อ'}
                      {shot.videoMetadata?.attachedAt &&
                        ` • แนบเมื่อ ${new Date(shot.videoMetadata.attachedAt).toLocaleTimeString('th-TH')}`}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleRemoveVideo}
                      className="px-2.5 py-1.5 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 flex items-center gap-1 text-[11px] font-medium transition"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>ลบออก</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    className="hidden"
                    id={`flow-video-upload-${shot.shotNumber}`}
                  />
                  <label
                    htmlFor={`flow-video-upload-${shot.shotNumber}`}
                    className="cursor-pointer border-2 border-dashed border-indigo-500/40 hover:border-indigo-400 bg-indigo-950/20 hover:bg-indigo-950/40 rounded-xl p-4 flex flex-col items-center justify-center gap-2 text-center transition min-h-[90px] touch-manipulation"
                  >
                    <Upload className="w-5 h-5 text-indigo-400" />
                    <span className="text-xs font-semibold text-indigo-200">
                      เลือกไฟล์วิดีโอจากเครื่อง (.mp4, .webm)
                    </span>
                    <span className="text-[10px] text-slate-400">
                      อัปโหลดคลิปที่เรนเดอร์จาก Google Flow
                    </span>
                  </label>
                </div>

                <div className="flex flex-col justify-center">
                  {!showUrlInput ? (
                    <button
                      onClick={() => setShowUrlInput(true)}
                      className="border border-slate-800 bg-slate-900/60 hover:bg-slate-900 rounded-xl p-4 flex flex-col items-center justify-center gap-2 text-center transition min-h-[90px] touch-manipulation"
                    >
                      <LinkIcon className="w-5 h-5 text-slate-400" />
                      <span className="text-xs font-semibold text-slate-300">
                        ใส่ลิงก์ URL ของวิดีโอ
                      </span>
                      <span className="text-[10px] text-slate-500">
                        กรณีจัดเก็บไว้บน Google Drive / Cloud
                      </span>
                    </button>
                  ) : (
                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-2">
                      <input
                        type="url"
                        placeholder="https://example.com/video.mp4"
                        value={videoUrlInput}
                        onChange={(e) => setVideoUrlInput(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setShowUrlInput(false)}
                          className="px-2.5 py-1 text-slate-400 hover:text-white text-xs"
                        >
                          ยกเลิก
                        </button>
                        <button
                          onClick={handleAttachVideoUrl}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold"
                        >
                          บันทึก URL
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Instruction Guide Dropdown */}
      <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950/40">
        <button
          onClick={() => setIsInstructionsOpen(!isInstructionsOpen)}
          className="w-full px-3 py-2.5 flex items-center justify-between text-xs font-semibold text-slate-300 hover:text-white bg-slate-900/40 transition touch-manipulation"
        >
          <span className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-indigo-400" />
            <span>คำแนะนำการใช้งาน Google Flow (labs.google/flow) คู่กับ AIVC V3.3</span>
          </span>
          {isInstructionsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {isInstructionsOpen && (
          <div className="p-3.5 space-y-2 text-xs text-slate-300 border-t border-slate-800/80 leading-relaxed bg-slate-950/90">
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-300 font-bold flex items-center justify-center shrink-0 text-[10px]">
                1
              </span>
              <p>
                กดปุ่ม <strong>"คัดลอก Image Prompt"</strong> และเปิด Google Flow จากปุ่มด้านบน
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-300 font-bold flex items-center justify-center shrink-0 text-[10px]">
                2
              </span>
              <p>
                วาง Prompt ใน Google Flow เพื่อเจนภาพนิ่ง และดาวน์โหลดไฟล์ภาพมายังโทรศัพท์/คอมพิวเตอร์
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-300 font-bold flex items-center justify-center shrink-0 text-[10px]">
                3
              </span>
              <p>
                กดปุ่ม <strong>"เลือกไฟล์รูปภาพที่ดาวน์โหลดจาก Google Flow"</strong> ด้านบนเพื่อเชื่อมภาพเข้ากับฉากนี้
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-300 font-bold flex items-center justify-center shrink-0 text-[10px]">
                4
              </span>
              <p>
                สลับไปที่แท็บ <strong>"สร้างวิดีโอขยับภาพ"</strong> เพื่อคัดลอก Video Motion Prompt ไปเรนเดอร์ภาพเคลื่อนไหวต่อเนื่อง
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute -top-10 right-0 p-2 text-white/80 hover:text-white bg-slate-800/80 rounded-full"
            >
              <Trash2 className="hidden" />
              <span>✕ ปิด</span>
            </button>
            <img
              src={lightboxImage}
              alt="Preview"
              className="max-w-full max-h-[85vh] rounded-xl object-contain shadow-2xl border border-slate-700"
            />
          </div>
        </div>
      )}
    </div>
  );
};
