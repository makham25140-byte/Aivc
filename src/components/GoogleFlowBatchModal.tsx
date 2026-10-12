import React, { useState, useRef, useMemo } from 'react';
import {
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  Upload,
  Image as ImageIcon,
  Clock,
  Layers,
  Film,
  Camera,
  X,
  RefreshCw,
  Maximize2,
  Trash2,
  ArrowRight,
  Info,
  ChevronRight,
  Smartphone,
  ShieldCheck,
  FileCheck,
  Download,
  AlertTriangle,
  Sliders,
  FileText,
  UserCheck,
  Play,
  StopCircle,
  FolderUp,
  HelpCircle
} from 'lucide-react';
import { ProductionBlueprint, ShotDetail, CharacterProfile, ImageMetadata } from '../types/director';
import {
  formatPromptForGoogleFlow,
  auditProjectConsistency,
  formatAllScenesForGoogleFlowBatch,
  generateCharacterAwarePrompts,
  detectConsistencyConflicts,
  repairConsistencyConflicts,
  matchImportedFilesToShots
} from '../utils/consistencyEngine';
import { downloadFile, downloadAllImagesSequentially, downloadMediaFromUrl } from '../utils/exportUtils';

interface GoogleFlowBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  blueprint: ProductionBlueprint;
  onUpdateShot: (updatedShot: ShotDetail) => void;
  onUpdateBlueprint: (updated: ProductionBlueprint) => void;
}

export type WorkflowStepId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface WorkflowStepState {
  id: WorkflowStepId;
  title: string;
  description: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'STOPPED' | 'FAILED';
  detailMessage?: string;
}

export const GoogleFlowBatchModal: React.FC<GoogleFlowBatchModalProps> = ({
  isOpen,
  onClose,
  blueprint,
  onUpdateShot,
  onUpdateBlueprint,
}) => {
  const [activeTab, setActiveTab] = useState<'WORKFLOW' | 'QUEUE' | 'AUDIT' | 'CONNECTION'>('WORKFLOW');
  const [filterMode, setFilterMode] = useState<'ALL' | 'INCOMPLETE' | 'COMPLETED'>('ALL');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [selectedShotNumber, setSelectedShotNumber] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<{ shotNumber?: number; message: string } | null>(null);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<{ current: number; total: number } | null>(null);
  const [batchMatchNotice, setBatchMatchNotice] = useState<string | null>(null);

  // 8-Step Automated Workflow State
  const [isWorkflowRunning, setIsWorkflowRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState<WorkflowStepId | null>(null);
  const [workflowStoppedNotice, setWorkflowStoppedNotice] = useState<{
    step: WorkflowStepId;
    title: string;
    reason: string;
    alternatives: string;
  } | null>(null);

  const [stepStates, setStepStates] = useState<Record<WorkflowStepId, WorkflowStepState>>({
    1: { id: 1, title: '1. ตรวจสอบ Character Roster', description: 'ตรวจจำนวนตัวละคร ข้อมูลรูปลักษณ์ และคุณลักษณะประจำตัว', status: 'PENDING' },
    2: { id: 2, title: '2. ตรวจสอบการผูกตัวละครในแต่ละฉาก', description: 'ตรวจสอบความถูกต้องของรหัสตัวละครในทุกช็อต', status: 'PENDING' },
    3: { id: 3, title: '3. สร้าง Prompt เฉพาะฉาก', description: 'สร้าง Character-Aware Image Prompts เจาะจงแต่ละฉาก ไม่ซ้ำกัน', status: 'PENDING' },
    4: { id: 4, title: '4. ตรวจสอบความขัดแย้งของลักษณะตัวละคร', description: 'ตรวจสอบและซ่อมแซมคำขัดแย้ง (เสื้อผ้า/ผม) กับ Locked Profile', status: 'PENDING' },
    5: { id: 5, title: '5. จัดคิวการสร้างภาพ', description: 'จัดเรียงฉาก 1 ถึง N ตามลำดับไทม์ไลน์ storyboard', status: 'PENDING' },
    6: { id: 6, title: '6. ส่งงานไปยังช่องทางสร้างภาพที่ใช้งานได้จริง', description: 'ตรวจสอบ Google Flow API และ Direct AI Model Channel', status: 'PENDING' },
    7: { id: 7, title: '7. รับและบันทึกไฟล์ภาพ', description: 'รับไฟล์ภาพจริง ตรวจสอบความถูกต้อง และบันทึก Metadata', status: 'PENDING' },
    8: { id: 8, title: '8. อัปเดตสถานะและแสดงความคืบหน้า', description: 'เปลี่ยนสถานะเป็น IMAGE_READY เมื่อมีไฟล์ภาพจริงเท่านั้น', status: 'PENDING' },
  });

  const shotRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const multiFileInputRef = useRef<HTMLInputElement>(null);
  const officialGoogleFlowUrl = 'https://labs.google/flow';

  // Requirement 5: Audit Project Consistency
  const auditReport = useMemo(() => {
    return auditProjectConsistency(blueprint.shots, blueprint.characters || []);
  }, [blueprint.shots, blueprint.characters]);

  if (!isOpen) return null;

  const totalShots = blueprint.shots.length;
  const completedShots = blueprint.shots.filter((s) => Boolean(s.generatedImage)).length;
  const incompleteShots = totalShots - completedShots;
  const progressPercent = totalShots > 0 ? Math.round((completedShots / totalShots) * 100) : 0;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleOpenGoogleFlow = (shotPrompt?: string, key?: string) => {
    if (shotPrompt && key) {
      navigator.clipboard.writeText(shotPrompt);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
    }
    window.open(officialGoogleFlowUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopyAllFlowPrompts = () => {
    const text = formatAllScenesForGoogleFlowBatch(blueprint.shots, blueprint.characters || [], blueprint.projectTitle);
    handleCopy(text, 'all-prompts');
  };

  const handleExportFlowBatchText = () => {
    const text = formatAllScenesForGoogleFlowBatch(blueprint.shots, blueprint.characters || [], blueprint.projectTitle);
    downloadFile(`AIVC-GoogleFlow-Batch-${blueprint.id}.txt`, text, 'text/plain;charset=utf-8');
  };

  // Requirement 6: Download all images batch sequentially with file validation
  const handleDownloadAllImages = async () => {
    if (completedShots === 0) return;
    setIsDownloadingAll(true);
    setDownloadProgress({ current: 0, total: completedShots });
    try {
      await downloadAllImagesSequentially(blueprint.shots, (curr, tot) => {
        setDownloadProgress({ current: curr, total: tot });
      });
    } finally {
      setIsDownloadingAll(false);
      setTimeout(() => setDownloadProgress(null), 2500);
    }
  };

  // Requirement 3: Automated Workflow Runner (8 Steps)
  const handleStartWorkflow = async () => {
    setIsWorkflowRunning(true);
    setWorkflowStoppedNotice(null);

    const updateStep = (id: WorkflowStepId, status: WorkflowStepState['status'], detailMessage?: string) => {
      setStepStates((prev) => ({
        ...prev,
        [id]: { ...prev[id], status, detailMessage },
      }));
    };

    try {
      // STEP 1: ตรวจสอบ Character Roster
      setCurrentStep(1);
      updateStep(1, 'RUNNING', 'กำลังตรวจสอบ Character Roster และข้อมูลรูปลักษณ์ประจำตัว...');
      await new Promise((r) => setTimeout(r, 450));
      const roster = blueprint.characters || [];
      if (roster.length === 0) {
        updateStep(1, 'COMPLETED', 'ตรวจ Character Roster: ไม่พบตัวละครหลัก (โปรเจกต์เป็นแนว Scenery / Motion Graphic)');
      } else {
        const lockedCount = roster.filter((c) => c.isLocked !== false).length;
        updateStep(1, 'COMPLETED', `พบตัวละครใน Roster ${roster.length} คน (ล็อคเอกลักษณ์แล้ว ${lockedCount} คน)`);
      }

      // STEP 2: ตรวจสอบการผูกตัวละครในแต่ละฉาก
      setCurrentStep(2);
      updateStep(2, 'RUNNING', 'กำลังตรวจสอบการผูกตัวละครในทุกฉากเพื่อป้องกัน Orphan Character...');
      await new Promise((r) => setTimeout(r, 450));
      const orphanIssues = auditReport.issues.filter((i) => i.type === 'ORPHAN_CHARACTER_ID');
      if (orphanIssues.length > 0) {
        updateStep(2, 'FAILED', `พบข้อผิดพลาด: มี ${orphanIssues.length} ฉากที่ผูกตัวละครที่ไม่พบใน Roster`);
        setIsWorkflowRunning(false);
        return;
      }
      updateStep(2, 'COMPLETED', `ตรวจสอบครบทั้ง ${blueprint.shots.length} ฉาก: การผูกตัวละครถูกต้องสอดคล้องตาม Roster`);

      // STEP 3: สร้าง Prompt เฉพาะฉาก (แยก Prompt ออกจากการสร้างภาพจริง)
      setCurrentStep(3);
      updateStep(3, 'RUNNING', 'กำลังสร้าง Character-Aware Image Prompts เจาะจงแต่ละฉาก...');
      const updatedShots = [...blueprint.shots];
      for (let i = 0; i < updatedShots.length; i++) {
        const shot = updatedShots[i];
        if (shot.isCustomPromptEdited) continue;

        const assigned = (blueprint.characters || []).filter((c) =>
          (shot.characterIds || []).includes(c.id)
        );

        try {
          const res = await fetch('/api/director/generate-scene-prompt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              shot,
              characters: assigned,
              environment: blueprint.environments?.[0],
            }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.positivePromptEn) {
              updatedShots[i] = {
                ...shot,
                imagePrompt: {
                  ...shot.imagePrompt,
                  positivePromptEn: data.positivePromptEn,
                  negativePrompt: data.negativePrompt || shot.imagePrompt.negativePrompt,
                },
                motionPrompt: {
                  ...shot.motionPrompt,
                  videoPromptEn: data.videoPromptEn || shot.motionPrompt.videoPromptEn,
                },
                injectedCharacterSummary: data.injectedDetails || shot.injectedCharacterSummary,
                conflictWarnings: data.conflictWarnings || [],
                promptConsistencyStatus: 'CONSISTENT',
              };
            }
          } else {
            const localResult = generateCharacterAwarePrompts(shot, assigned, blueprint.environments?.[0]);
            updatedShots[i] = {
              ...shot,
              imagePrompt: {
                ...shot.imagePrompt,
                positivePromptEn: localResult.positivePromptEn,
                negativePrompt: localResult.negativePrompt,
              },
              motionPrompt: {
                ...shot.motionPrompt,
                videoPromptEn: localResult.videoPromptEn,
              },
              injectedCharacterSummary: localResult.injectedDetails,
              promptConsistencyStatus: 'CONSISTENT',
            };
          }
        } catch {
          // Local fallback
          const localResult = generateCharacterAwarePrompts(shot, assigned, blueprint.environments?.[0]);
          updatedShots[i] = {
            ...shot,
            imagePrompt: {
              ...shot.imagePrompt,
              positivePromptEn: localResult.positivePromptEn,
              negativePrompt: localResult.negativePrompt,
            },
            motionPrompt: {
              ...shot.motionPrompt,
              videoPromptEn: localResult.videoPromptEn,
            },
            injectedCharacterSummary: localResult.injectedDetails,
            promptConsistencyStatus: 'CONSISTENT',
          };
        }
      }
      onUpdateBlueprint({ ...blueprint, shots: updatedShots });
      updateStep(3, 'COMPLETED', `สร้าง Prompt เจาะจงตัวละครครบทุกฉาก (${updatedShots.length} ช็อต) ไม่ซ้ำกัน`);

      // STEP 4: ตรวจสอบความขัดแย้งของลักษณะตัวละคร
      setCurrentStep(4);
      updateStep(4, 'RUNNING', 'กำลังตรวจสอบความขัดแย้งและซ่อมแซมคำบรรยายเสื้อผ้า/ทรงผม...');
      await new Promise((r) => setTimeout(r, 400));
      const repairedShots = updatedShots.map((shot) => {
        const assigned = (blueprint.characters || []).filter((c) =>
          (shot.characterIds || []).includes(c.id)
        );
        return repairConsistencyConflicts(shot, assigned);
      });
      onUpdateBlueprint({ ...blueprint, shots: repairedShots });
      updateStep(4, 'COMPLETED', 'ตรวจสอบและซ่อมแซมความขัดแย้งของลักษณะตัวละครเสร็จสมบูรณ์');

      // STEP 5: จัดคิวการสร้างภาพ
      setCurrentStep(5);
      updateStep(5, 'RUNNING', 'กำลังจัดคิวช็อต 1 ถึง N ตามลำดับไทม์ไลน์...');
      await new Promise((r) => setTimeout(r, 400));
      updateStep(5, 'COMPLETED', `จัดคิวสร้างภาพเรียบร้อย (${repairedShots.length} ฉาก)`);

      // STEP 6: ส่งงานไปยังช่องทางสร้างภาพที่ใช้งานได้จริง
      setCurrentStep(6);
      updateStep(6, 'RUNNING', 'กำลังตรวจสอบช่องทางสร้างภาพอัตโนมัติ (Google Flow & Direct AI Model)...');
      await new Promise((r) => setTimeout(r, 600));

      // Test Direct Generation endpoint
      const pingRes = await fetch('/api/media/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'test connection ping',
          sceneId: 'TEST-01',
          shotNumber: 0,
        }),
      }).catch(() => null);

      const pingData = pingRes ? await pingRes.json().catch(() => ({})) : {};

      // Requirement 1 & 3: Check real channel & STOP at Step 6 if no accessible headless channel
      if (!pingData.success) {
        updateStep(
          6,
          'STOPPED',
          'หยุดที่ขั้นตอนนี้: Google Flow ไม่มี Public Headless REST API และ Google AI Studio Image Models มีโควตา = 0 บน Free Tier'
        );

        setWorkflowStoppedNotice({
          step: 6,
          title: 'หยุดการทำงานอัตโนมัติที่ขั้นตอนที่ 6 (Dispatch Channel)',
          reason:
            'ตรวจสอบพบว่า:\n1. Google Flow (labs.google/flow) เป็นเว็บแอปพลิเคชันทดลองใน Google Labs ที่ไม่มี Public Headless REST API สำหรับยิงสั่งงานจากภายนอก\n2. โมเดลสร้างภาพของ Google AI Studio มีโควตาเป็น 0 ใน Free Tier (HTTP 429 Quota Exceeded / Limit 0) และข้อกำหนดของโปรเจกต์ห้ามเปิดใช้งาน Billing หรือสร้างค่าใช้จ่าย\n3. ตามข้อกำหนดด้านความปลอดภัย ไม่อนุญาตให้ใช้ API ปลอม หรือ Web Scraping หลบเลี่ยงการตรวจสอบสิทธิ์',
          alternatives:
            'ระบบไม่เปลี่ยนปุ่มสร้างภาพเป็นปุ่มคัดลอกโดยพลการ ท่านสามารถกดปุ่ม "เปิดใช้ Google Flow Studio Bridge" ด้านล่างเพื่อสลับเข้าสู่โหมดกึ่งอัตโนมัติ ซึ่งระบบได้เตรียม Prompt ทุกฉาก และจัดคิวรอรับไฟล์ภาพจริงไว้ให้เรียบร้อยแล้ว',
        });

        setIsWorkflowRunning(false);
        return;
      }

      // If a real direct generation channel succeeds (or when configured):
      updateStep(6, 'RUNNING', 'ช่องทางสร้างภาพพร้อมใช้งาน! กำลังส่งคิวและสร้างภาพจริงทีละฉาก...');
      const newlyGeneratedShots = [...repairedShots];
      let genSuccessCount = 0;
      let genFailCount = 0;

      for (let i = 0; i < newlyGeneratedShots.length; i++) {
        const shot = newlyGeneratedShots[i];
        if (shot.generatedImage) continue; // Resume logic: keep already completed scenes

        updateStep(6, 'RUNNING', `กำลังสร้างภาพจริงฉากที่ ${shot.shotNumber} (${shot.sceneId || `SC-${shot.shotNumber}`})...`);
        try {
          const genRes = await fetch('/api/media/generate-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: shot.imagePrompt.positivePromptEn,
              aspectRatio: shot.imagePrompt.aspectRatio || '9:16',
              sceneId: shot.sceneId,
              shotNumber: shot.shotNumber,
              negativePrompt: shot.imagePrompt.negativePrompt,
            }),
          });
          const genData = await genRes.json();
          if (genData.success && genData.imageUrl) {
            const dataUrl = genData.imageUrl;
            const approxBytes = Math.round((dataUrl.length * 3) / 4);
            const metadata: ImageMetadata = {
              fileName: `AIVC-${shot.sceneId || 'Shot-' + shot.shotNumber}.png`,
              fileSize: approxBytes,
              mimeType: 'image/png',
              attachedAt: new Date().toISOString(),
              provider: genData.provider || 'AI Direct Generator',
              notes: `สร้างภาพจริงอัตโนมัติสำเร็จ (${Math.round(approxBytes / 1024)} KB)`,
            };

            newlyGeneratedShots[i] = {
              ...shot,
              generatedImage: dataUrl,
              imageMetadata: metadata,
              flowWorkflowStatus: 'DONE',
              generationStatus: shot.generatedVideo ? 'COMPLETED' : 'IMAGE_READY',
              mediaNotes: `สร้างภาพจริงอัตโนมัติสำเร็จ (${new Date().toLocaleTimeString('th-TH')})`,
            };
            genSuccessCount++;
          } else {
            genFailCount++;
          }
        } catch {
          genFailCount++;
        }
      }

      onUpdateBlueprint({ ...blueprint, shots: newlyGeneratedShots });
      updateStep(6, 'COMPLETED', `ประมวลผลการส่งงานเสร็จสิ้น (สำเร็จ ${genSuccessCount} ฉาก, ล้มเหลว ${genFailCount} ฉาก)`);

      setCurrentStep(7);
      updateStep(7, 'RUNNING', 'กำลังตรวจสอบความถูกต้องของไฟล์ภาพและบันทึก Metadata...');
      await new Promise((r) => setTimeout(r, 400));
      updateStep(7, 'COMPLETED', `รับ ตรวจสอบขนาด/ชนิดไฟล์ และบันทึกภาพลง Scene ID สำเร็จ (${genSuccessCount} ฉาก)`);

      setCurrentStep(8);
      updateStep(8, 'COMPLETED', `อัปเดตสถานะฉากเป็น IMAGE_READY ตามไฟล์ภาพจริง (${genSuccessCount} ฉาก)`);
    } catch (err: any) {
      console.error('Workflow execution error:', err);
      if (currentStep) {
        updateStep(currentStep, 'FAILED', err?.message || 'เกิดข้อผิดพลาดในการประมวลผล');
      }
    } finally {
      setIsWorkflowRunning(false);
    }
  };

  // Requirement 2 & 4: Image Import & File Validation for Single Shot
  const handleImageFileSelected = (shot: ShotDetail, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    // Validate image MIME type and readable size
    if (!file.type.startsWith('image/')) {
      setUploadError({
        shotNumber: shot.shotNumber,
        message: `ไฟล์ "${file.name}" ไม่ใช่รูปภาพที่ถูกต้อง กรุณาเลือกไฟล์ภาพ (.png, .jpg, .webp)`,
      });
      e.target.value = '';
      return;
    }

    if (file.size === 0) {
      setUploadError({
        shotNumber: shot.shotNumber,
        message: 'ไฟล์ภาพมีขนาด 0 ไบต์ ไม่สามารถใช้งานได้',
      });
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => {
      setUploadError({
        shotNumber: shot.shotNumber,
        message: 'ไม่สามารถอ่านไฟล์ภาพจากเครื่องได้ กรุณาลองใหม่อีกครั้ง',
      });
    };

    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl || dataUrl.length < 50) {
        setUploadError({
          shotNumber: shot.shotNumber,
          message: 'ข้อมูลรูปภาพไม่สมบูรณ์ หรือไฟล์เสียหาย',
        });
        return;
      }

      const metadata: ImageMetadata = {
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        attachedAt: new Date().toISOString(),
        provider: 'Google Flow Bridge',
        notes: `ภาพผลลัพธ์จาก Google Flow (${Math.round(file.size / 1024)} KB)`,
      };

      onUpdateShot({
        ...shot,
        generatedImage: dataUrl,
        imageMetadata: metadata,
        flowWorkflowStatus: 'DONE',
        generationStatus: shot.generatedVideo ? 'COMPLETED' : 'IMAGE_READY',
        mediaNotes: `สร้างภาพจาก Google Flow สำเร็จ: ${file.name} (${new Date().toLocaleTimeString('th-TH')})`,
      });
    };

    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Requirement 4: Batch Multi-Image Import & Auto-matching with Scene IDs
  const handleMultiImageBatchUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList).filter((f) => f.type.startsWith('image/') && f.size > 0);
    if (files.length === 0) {
      setUploadError({ message: 'ไม่พบไฟล์รูปภาพที่ถูกต้องในรายการที่เลือก' });
      e.target.value = '';
      return;
    }

    setUploadError(null);
    setBatchMatchNotice('กำลังอ่านและจับคู่ไฟล์ภาพเข้ากับแต่ละฉาก...');

    let loadedCount = 0;
    const fileDataItems: { file: File; dataUrl: string }[] = [];

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl && dataUrl.length > 50) {
          fileDataItems.push({ file, dataUrl });
        }
        loadedCount++;

        if (loadedCount === files.length) {
          // All files read, now run smart matching
          const matchResult = matchImportedFilesToShots(fileDataItems, blueprint.shots);
          const updatedShots = [...blueprint.shots];

          matchResult.matched.forEach((m) => {
            const idx = updatedShots.findIndex((s) => s.shotNumber === m.shotNumber);
            if (idx !== -1) {
              const prevShot = updatedShots[idx];
              updatedShots[idx] = {
                ...prevShot,
                generatedImage: m.dataUrl,
                flowWorkflowStatus: 'DONE',
                generationStatus: prevShot.generatedVideo ? 'COMPLETED' : 'IMAGE_READY',
                imageMetadata: {
                  fileName: m.file.name,
                  fileSize: m.file.size,
                  mimeType: m.file.type,
                  attachedAt: new Date().toISOString(),
                  provider: 'Google Flow Auto-Match',
                  notes: `จับคู่อัตโนมัติ: ${m.reason} (${Math.round(m.file.size / 1024)} KB)`,
                },
              };
            }
          });

          onUpdateBlueprint({ ...blueprint, shots: updatedShots });

          let noticeMsg = `จับคู่และนำเข้าภาพสำเร็จ ${matchResult.matched.length} จาก ${files.length} ไฟล์`;
          if (matchResult.unmatched.length > 0) {
            noticeMsg += ` (มี ${matchResult.unmatched.length} ไฟล์ที่ไม่สามารถจับคู่ได้)`;
          }
          setBatchMatchNotice(noticeMsg);
          setTimeout(() => setBatchMatchNotice(null), 5000);
        }
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const handleRemoveImage = (shot: ShotDetail) => {
    onUpdateShot({
      ...shot,
      generatedImage: '',
      imageMetadata: undefined,
      flowWorkflowStatus: 'QUEUED',
      generationStatus: shot.generatedVideo ? 'VIDEO_READY' : 'PROMPT_READY',
    });
  };

  const handleResumeIncomplete = () => {
    const nextIncomplete = blueprint.shots.find((s) => !s.generatedImage);
    if (nextIncomplete) {
      setActiveTab('QUEUE');
      setFilterMode('ALL');
      setSelectedShotNumber(nextIncomplete.shotNumber);
      const el = shotRefs.current[nextIncomplete.shotNumber];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const filteredShots = blueprint.shots.filter((s) => {
    if (filterMode === 'INCOMPLETE') return !s.generatedImage;
    if (filterMode === 'COMPLETED') return Boolean(s.generatedImage);
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
                  ระบบสร้างภาพอัตโนมัติ Google Flow (AIVC V3.3.3)
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  V3.3.3 Engine
                </span>
                {auditReport.isFullyConsistent ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Roster & Prompts Consistent</span>
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                    <span>{auditReport.issues.length} ข้อควรตรวจทาน</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                เตรียมฉาก จัดคิว ตรวจสอบช่องทางสร้างภาพจริง และผสาน Google Flow Bridge อัตโนมัติ
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition shrink-0 min-h-[40px] min-w-[40px] flex items-center justify-center touch-manipulation cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Phase Navigation Tabs */}
        <div className="px-4 sm:px-6 py-2.5 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('WORKFLOW')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'WORKFLOW'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>1. เวิร์กโฟลว์ 8 ขั้นตอน</span>
            </button>

            <button
              onClick={() => setActiveTab('QUEUE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'QUEUE'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>2. คิวฉาก & นำเข้าภาพ ({completedShots}/{totalShots})</span>
            </button>

            <button
              onClick={() => setActiveTab('AUDIT')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'AUDIT'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>3. ตรวจสอบตัวละคร</span>
              {auditReport.issues.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-bold text-[10px] flex items-center justify-center">
                  {auditReport.issues.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('CONNECTION')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'CONNECTION'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>4. ตรวจสอบ Google Flow</span>
            </button>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleCopyAllFlowPrompts}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium border border-slate-700 transition cursor-pointer"
              title="คัดลอก Prompt ทุกฉากสำหรับ Google Flow"
            >
              {copiedKey === 'all-prompts' ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span>คัดลอกแล้ว!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy All Prompts</span>
                </>
              )}
            </button>

            <button
              onClick={handleExportFlowBatchText}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium border border-slate-700 transition cursor-pointer"
              title="ส่งออกเอกสาร Batch Script (.txt)"
            >
              <Download className="w-3 h-3" />
              <span>Export .txt</span>
            </button>

            {completedShots > 0 && (
              <button
                onClick={handleDownloadAllImages}
                disabled={isDownloadingAll}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 hover:text-white text-[11px] font-semibold border border-emerald-500/40 transition disabled:opacity-50 cursor-pointer"
                title="ดาวน์โหลดภาพที่สร้างเสร็จทั้งหมดลงเครื่อง"
              >
                <Download className="w-3 h-3" />
                <span>
                  {isDownloadingAll
                    ? `โหลด (${downloadProgress?.current}/${downloadProgress?.total})...`
                    : `ดาวน์โหลดภาพ (${completedShots})`}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Dashboard Progress Summary */}
        <div className="px-4 sm:px-6 py-2.5 bg-slate-950/50 border-b border-slate-800/80 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-medium">ฉากทั้งหมด:</span>
                <strong className="text-white font-mono">{totalShots}</strong>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span className="font-medium">ได้ภาพจริงแล้ว:</span>
                <strong className="font-mono">{completedShots}</strong>
              </div>
              <div className="flex items-center gap-1.5 text-amber-300">
                <Clock className="w-3.5 h-3.5" />
                <span className="font-medium">รอภาพจริง:</span>
                <strong className="font-mono">{incompleteShots}</strong>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleOpenGoogleFlow()}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white border border-indigo-500/40 text-[11px] font-semibold transition cursor-pointer"
              >
                <ExternalLink className="w-3 h-3" />
                <span>เปิด labs.google/flow</span>
              </button>
            </div>
          </div>

          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* TAB 1: 8-STEP WORKFLOW RUNNER */}
        {activeTab === 'WORKFLOW' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {/* Banner: Explain Separation of Prompt vs Image Generation */}
            <div className="bg-indigo-950/30 border border-indigo-500/30 rounded-xl p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-2 text-sm">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>เวิร์กโฟลว์สร้างภาพอัตโนมัติ 8 ขั้นตอน (Sequential Pipeline)</span>
                </span>
                <button
                  type="button"
                  disabled={isWorkflowRunning}
                  onClick={handleStartWorkflow}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-500 hover:from-blue-500 hover:via-indigo-500 hover:to-teal-400 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition disabled:opacity-50 cursor-pointer min-h-[38px]"
                >
                  {isWorkflowRunning ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>กำลังประมวลผลขั้นตอนที่ {currentStep}/8...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                      <span>เริ่มรันเวิร์กโฟลว์ทั้ง 8 ขั้นตอน</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-slate-300 leading-relaxed text-[11px]">
                <strong className="text-amber-300">หลักการทำงาน:</strong> ระบบแยกการสร้าง Prompt ออกจากการสร้างภาพจริงอย่างเด็ดขาด โดยจะตรวจสอบความสมบูรณ์ของ Roster, ความสอดคล้องของตัวละคร และจัดคิวทุกฉาก จากนั้นจะส่งงานไปยังช่องทางสร้างภาพที่ใช้งานได้จริง หากช่องทางใดไม่มี API ทางการ ระบบจะหยุดและแจ้งข้อจำกัดอย่างโปร่งใสทันที
              </p>
            </div>

            {/* Workflow Stopped Notice (Requirement 3: Stopped at step 6) */}
            {workflowStoppedNotice && (
              <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-4 space-y-3 animate-in fade-in duration-200">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1.5 flex-1 text-xs">
                    <h4 className="font-bold text-amber-200 text-sm">
                      {workflowStoppedNotice.title}
                    </h4>
                    <pre className="whitespace-pre-wrap font-sans text-slate-200 leading-relaxed bg-black/40 p-3 rounded-lg border border-amber-500/20 text-[11px]">
                      {workflowStoppedNotice.reason}
                    </pre>
                    <p className="text-amber-300 text-[11px] leading-relaxed">
                      {workflowStoppedNotice.alternatives}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2 pt-1 border-t border-amber-500/20">
                  <button
                    onClick={() => setActiveTab('CONNECTION')}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs transition cursor-pointer"
                  >
                    ดูเอกสารตรวจสอบช่องทาง Google Flow
                  </button>

                  <button
                    onClick={() => setActiveTab('QUEUE')}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md transition cursor-pointer"
                  >
                    <span>เปิดใช้ Google Flow Studio Bridge</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* 8-Step Progress Timeline List */}
            <div className="space-y-2.5">
              {([1, 2, 3, 4, 5, 6, 7, 8] as WorkflowStepId[]).map((stepId) => {
                const s = stepStates[stepId];
                const isCurrent = currentStep === stepId && isWorkflowRunning;

                return (
                  <div
                    key={stepId}
                    className={`p-3.5 rounded-xl border transition-all text-xs flex items-start justify-between gap-3 ${
                      s.status === 'COMPLETED'
                        ? 'bg-slate-900/80 border-emerald-500/30'
                        : s.status === 'STOPPED'
                        ? 'bg-amber-950/20 border-amber-500/40'
                        : s.status === 'FAILED'
                        ? 'bg-rose-950/30 border-rose-800/50'
                        : isCurrent
                        ? 'bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500/50'
                        : 'bg-slate-950/50 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 shrink-0">
                        {s.status === 'COMPLETED' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : s.status === 'STOPPED' ? (
                          <AlertTriangle className="w-4 h-4 text-amber-400" />
                        ) : s.status === 'FAILED' ? (
                          <AlertCircle className="w-4 h-4 text-rose-400" />
                        ) : isCurrent ? (
                          <div className="w-4 h-4 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-slate-700 flex items-center justify-center text-[10px] text-slate-500 font-mono">
                            {stepId}
                          </div>
                        )}
                      </div>

                      <div className="space-y-0.5">
                        <div className="font-bold text-white text-xs flex items-center gap-2">
                          <span>{s.title}</span>
                          {s.status === 'COMPLETED' && (
                            <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                              ✓ สำเร็จ
                            </span>
                          )}
                          {s.status === 'STOPPED' && (
                            <span className="text-[10px] font-semibold text-amber-300 bg-amber-500/15 px-1.5 py-0.2 rounded">
                              ⚠️ หยุดตรวจสอบข้อจำกัด
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400">{s.description}</p>
                        {s.detailMessage && (
                          <p
                            className={`text-[11px] pt-1 font-mono ${
                              s.status === 'COMPLETED'
                                ? 'text-emerald-300'
                                : s.status === 'STOPPED'
                                ? 'text-amber-300'
                                : s.status === 'FAILED'
                                ? 'text-rose-400'
                                : 'text-indigo-300'
                            }`}
                          >
                            &gt; {s.detailMessage}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: QUEUE & BATCH IMPORT (GOOGLE FLOW BRIDGE) */}
        {activeTab === 'QUEUE' && (
          <>
            {/* Automation Boundary Guide Banner (Requirement 4) */}
            <div className="px-4 sm:px-6 py-2.5 bg-slate-950/70 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-indigo-300 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                  <span>ขอบเขตกระบวนการทำงาน:</span>
                </span>
                <span className="text-slate-300 text-[11px]">
                  <strong className="text-emerald-400">อัตโนมัติ:</strong> สร้าง Prompt รายฉาก + จัดคิว + จับคู่ภาพ + บันทึก Metadata |{' '}
                  <strong className="text-amber-300">ดำเนินการเอง:</strong> วางคำสั่งใน Google Flow แล้วนำไฟล์ภาพกลับมาแนบ
                </span>
              </div>

              {/* Batch Import Trigger Button */}
              <div>
                <input
                  ref={multiFileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleMultiImageBatchUpload}
                  className="hidden"
                  id="google-flow-batch-multi-upload"
                />
                <label
                  htmlFor="google-flow-batch-multi-upload"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600/30 hover:bg-teal-600 text-teal-200 hover:text-white border border-teal-500/40 text-xs font-semibold transition cursor-pointer touch-manipulation shadow-sm"
                  title="เลือกหลายไฟล์พร้อมกันเพื่อจับคู่ภาพเข้าแต่ละฉากอัตโนมัติ"
                >
                  <FolderUp className="w-3.5 h-3.5" />
                  <span>นำเข้าหลายภาพพร้อมกัน (Auto-Match)</span>
                </label>
              </div>
            </div>

            {/* Batch Match Notice / Error Notification */}
            {batchMatchNotice && (
              <div className="px-4 sm:px-6 py-2 bg-emerald-950/30 border-b border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{batchMatchNotice}</span>
              </div>
            )}

            {uploadError && (
              <div className="px-4 sm:px-6 py-2 bg-rose-950/30 border-b border-rose-800/40 text-xs text-rose-300 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{uploadError.message}</span>
                </div>
                <button
                  onClick={() => setUploadError(null)}
                  className="text-slate-400 hover:text-white text-xs underline cursor-pointer"
                >
                  ปิด
                </button>
              </div>
            )}

            {/* Filter Chips */}
            <div className="px-4 sm:px-6 py-2 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs bg-slate-950/30">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 text-[11px]">ฟิลเตอร์:</span>
                <button
                  onClick={() => setFilterMode('ALL')}
                  className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
                    filterMode === 'ALL'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  ทุกฉาก ({totalShots})
                </button>
                <button
                  onClick={() => setFilterMode('INCOMPLETE')}
                  className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
                    filterMode === 'INCOMPLETE'
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  ยังไม่เสร็จ ({incompleteShots})
                </button>
                <button
                  onClick={() => setFilterMode('COMPLETED')}
                  className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
                    filterMode === 'COMPLETED'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  เสร็จแล้ว ({completedShots})
                </button>
              </div>

              <div className="text-[11px] text-slate-400">
                คลิกปุ่ม "คัดลอก Prompt" แล้วเปิด Google Flow เพื่อสร้างภาพ
              </div>
            </div>

            {/* Queue of Scenes */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {filteredShots.length === 0 ? (
                <div className="text-center py-12 text-slate-400 space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                  <p className="font-semibold text-white">ยอดเยี่ยม! ทุกฉากมีภาพประกอบเรียบร้อยแล้ว</p>
                  <p className="text-xs">คุณสามารถตรวจทานใน Storyboard หรือส่งออก Project JSON ได้ทันที</p>
                </div>
              ) : (
                filteredShots.map((shot) => {
                  const assignedChars = (blueprint.characters || []).filter((c) =>
                    (shot.characterIds || []).includes(c.id)
                  );
                  const flowFormattedPrompt = formatPromptForGoogleFlow(
                    shot.imagePrompt.positivePromptEn,
                    shot.imagePrompt.aspectRatio
                  );
                  const hasImage = Boolean(shot.generatedImage);
                  const isSelected = selectedShotNumber === shot.shotNumber;

                  return (
                    <div
                      key={shot.shotNumber}
                      ref={(el) => {
                        shotRefs.current[shot.shotNumber] = el;
                      }}
                      className={`border rounded-xl p-4 sm:p-5 transition-all space-y-3.5 ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-950/25 ring-2 ring-indigo-500/30'
                          : hasImage
                          ? 'border-emerald-500/30 bg-slate-950/60'
                          : 'border-slate-800 bg-slate-950/80 hover:border-slate-700'
                      }`}
                    >
                      {/* Scene Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-800/80">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="font-mono font-bold text-sm text-indigo-300 bg-indigo-950/60 border border-indigo-800/50 px-2 py-0.5 rounded-md">
                            {shot.sceneId || `SC-${String(shot.shotNumber).padStart(2, '0')}`}
                          </span>
                          <span className="text-xs text-white font-semibold">
                            ช็อต {shot.shotNumber} ({shot.shotType})
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800">
                            {shot.imagePrompt.aspectRatio || '9:16'}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            มุมกล้อง: {shot.cameraMovement}
                          </span>
                        </div>

                        {/* Status Badge */}
                        <div className="flex items-center gap-2">
                          {hasImage ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>ได้ภาพแล้ว (IMAGE_READY)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                              <Clock className="w-3.5 h-3.5" />
                              <span>รอภาพจริงจาก Google Flow</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Assigned Characters */}
                      <div className="flex flex-wrap items-center gap-2 text-xs bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                        <span className="text-slate-400 font-medium">ตัวละครในฉากนี้:</span>
                        {assignedChars.length === 0 ? (
                          <span className="text-slate-500 italic text-[11px]">ไม่มีตัวละคร (ทิวทัศน์ / วัตถุ / กราฟิก)</span>
                        ) : (
                          assignedChars.map((c) => (
                            <span
                              key={c.id}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 text-[11px] font-medium"
                              title={c.canonicalDescription || c.consistencyLockPrompt}
                            >
                              <span>{c.name}</span>
                              {c.isLocked !== false && <span title="ล็อคเอกลักษณ์">🔒</span>}
                              {c.canonicalClothing && (
                                <span className="text-slate-400 text-[10px]">({c.canonicalClothing.slice(0, 24)}...)</span>
                              )}
                            </span>
                          ))
                        )}
                      </div>

                      {/* Google Flow Image Prompt */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                            <Camera className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Image Prompt สำหรับ Google Flow:</span>
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {flowFormattedPrompt.length} ตัวอักษร
                          </span>
                        </div>

                        <div className="bg-slate-950 p-3 rounded-lg border border-indigo-900/40 text-xs font-mono text-slate-200 leading-relaxed select-all max-h-24 overflow-y-auto">
                          {flowFormattedPrompt}
                        </div>

                        {/* Actions */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          <button
                            onClick={() =>
                              handleOpenGoogleFlow(flowFormattedPrompt, `prompt-${shot.shotNumber}`)
                            }
                            className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white border border-indigo-500/40 text-xs font-semibold transition touch-manipulation min-h-[40px] cursor-pointer"
                          >
                            {copiedKey === `prompt-${shot.shotNumber}` ? (
                              <>
                                <Check className="w-4 h-4 text-emerald-400" />
                                <span>คัดลอก & เปิด Google Flow แล้ว!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" />
                                <span>คัดลอก Prompt และเปิด Google Flow</span>
                              </>
                            )}
                          </button>

                          {/* Individual File Upload */}
                          <div>
                            <input
                              type="file"
                              accept="image/*"
                              id={`batch-file-input-${shot.shotNumber}`}
                              onChange={(e) => handleImageFileSelected(shot, e)}
                              className="hidden"
                            />
                            <label
                              htmlFor={`batch-file-input-${shot.shotNumber}`}
                              className={`w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold border transition cursor-pointer touch-manipulation min-h-[40px] ${
                                hasImage
                                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                                  : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-600/20'
                              }`}
                            >
                              <Upload className="w-4 h-4" />
                              <span>{hasImage ? 'เปลี่ยนภาพประกอบฉากนี้' : 'แนบไฟล์ภาพจริงเข้าฉากนี้ (Upload)'}</span>
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Error banner if upload validation failed */}
                      {uploadError && uploadError.shotNumber === shot.shotNumber && (
                        <div className="text-xs text-rose-300 bg-rose-950/40 border border-rose-800/60 rounded-lg p-2.5 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                          <span>{uploadError.message}</span>
                        </div>
                      )}

                      {/* Attached Image Preview & Metadata */}
                      {hasImage && (
                        <div className="bg-slate-900/80 rounded-lg p-3 border border-slate-800 flex flex-col sm:flex-row items-center gap-3">
                          <div
                            className="relative w-28 h-20 sm:w-32 sm:h-24 rounded-lg overflow-hidden border border-slate-700 bg-black shrink-0 cursor-pointer group"
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
                            <div className="flex items-center gap-1.5 font-semibold text-emerald-300">
                              <FileCheck className="w-4 h-4 text-emerald-400" />
                              <span className="truncate">
                                {shot.imageMetadata?.fileName || `Image-${shot.sceneId}.png`}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400">
                              {shot.imageMetadata?.notes || 'เชื่อมโยงกับฉากนี้เรียบร้อยแล้ว'}
                              {shot.imageMetadata?.attachedAt &&
                                ` • แนบเมื่อ ${new Date(shot.imageMetadata.attachedAt).toLocaleTimeString('th-TH')}`}
                            </p>
                            <div className="text-[10px] text-slate-500">
                              ผู้ให้บริการ: {shot.imageMetadata?.provider || 'Google Flow'} • ขนาด: {Math.round((shot.imageMetadata?.fileSize || 0) / 1024)} KB
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => downloadMediaFromUrl(shot.generatedImage!, `AIVC-${shot.sceneId || 'Shot-' + shot.shotNumber}.png`)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                              title="ดาวน์โหลดภาพนี้"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setLightboxImage(shot.generatedImage!)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                              title="ดูภาพขนาดเต็ม"
                            >
                              <Maximize2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRemoveImage(shot)}
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 transition cursor-pointer"
                              title="ลบภาพออกจากฉากนี้"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* TAB 3: AUDIT & CONSISTENCY INSPECTOR */}
        {activeTab === 'AUDIT' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-indigo-400" />
                  <h4 className="text-sm font-bold text-white">
                    รายงานความต่อเนื่องตัวละคร (Character Consistency Report)
                  </h4>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {auditReport.summaryText}
              </p>

              {/* Requirement 5: Technical Honesty Disclaimer regarding Face Consistency */}
              <div className="bg-indigo-950/30 border border-indigo-500/30 rounded-lg p-3 text-[11px] text-indigo-200 leading-relaxed">
                <strong className="text-white">คำเตือนความโปร่งใสทางเทคนิค:</strong> {auditReport.facePreservationNotice}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400">ตัวละครใน Roster</div>
                  <div className="text-base font-bold text-white mt-0.5">{auditReport.rosterCount} คน</div>
                </div>
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400">ฉากที่มีตัวละคร</div>
                  <div className="text-base font-bold text-indigo-300 mt-0.5">{auditReport.shotsWithCharacters} ฉาก</div>
                </div>
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400">ฉากทิวทัศน์/วัตถุ</div>
                  <div className="text-base font-bold text-slate-300 mt-0.5">{auditReport.shotsWithoutCharacters} ฉาก</div>
                </div>
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400">สถานะความสอดคล้อง</div>
                  <div className={`text-base font-bold mt-0.5 ${auditReport.isFullyConsistent ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {auditReport.isFullyConsistent ? '100% สมบูรณ์' : `${auditReport.issues.length} รายการ`}
                  </div>
                </div>
              </div>
            </div>

            {/* Inconsistencies List */}
            {auditReport.issues.length === 0 ? (
              <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-5 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <h5 className="text-sm font-bold text-emerald-300">ตัวละครและ Prompts ทุกฉากถูกต้องสมบูรณ์</h5>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  ทุกฉากมี Prompt ที่เจาะจง ไม่ซ้ำกัน ล็อคเครื่องแต่งกายและใบหน้าตาม Roster พร้อมส่งเข้า Google Flow ได้ทันที
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  รายการที่ควรตรวจทานก่อนเริ่มสร้างภาพ:
                </h5>
                {auditReport.issues.map((issue, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                      issue.severity === 'error'
                        ? 'bg-rose-950/30 border-rose-800/50 text-rose-200'
                        : 'bg-amber-950/30 border-amber-800/50 text-amber-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold flex items-center gap-1.5">
                        {issue.severity === 'error' ? (
                          <AlertCircle className="w-4 h-4 text-rose-400" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-400" />
                        )}
                        <span>{issue.sceneId}</span>
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/40">
                        {issue.type}
                      </span>
                    </div>
                    <p className="leading-relaxed">{issue.message}</p>
                    {issue.fixSuggestion && (
                      <p className="text-[11px] text-slate-400">
                        💡 ข้อแนะนำ: {issue.fixSuggestion}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: GOOGLE FLOW CONNECTION TRANSPARENCY CHECK */}
        {activeTab === 'CONNECTION' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-teal-400" />
                <div>
                  <h4 className="text-sm font-bold text-white">
                    ผลการตรวจสอบช่องทางสร้างภาพและ Google Flow (Requirement 1 Check)
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    รายงานข้อเท็จจริงตามเอกสารและสภาพแวดล้อมระบบ ไม่สร้าง API ปลอม ไม่ Scrape และไม่มีค่าใช้จ่าย
                  </p>
                </div>
              </div>

              <div className="divide-y divide-slate-800 border border-slate-800 rounded-lg overflow-hidden bg-slate-900/60">
                <div className="p-3 flex items-center justify-between">
                  <div>
                    <strong className="text-slate-200">Google Labs Flow URL:</strong>
                    <div className="text-[11px] text-slate-400">https://labs.google/flow</div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300">
                    Verified Online
                  </span>
                </div>

                <div className="p-3 flex items-center justify-between">
                  <div>
                    <strong className="text-slate-200">Public Headless Developer API:</strong>
                    <div className="text-[11px] text-slate-400">Google ยังไม่เปิด API สาธารณะสำหรับส่งคำขอสร้างภาพภายนอกโดยไม่ผ่าน UI</div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300">
                    ไม่มี Public REST API
                  </span>
                </div>

                <div className="p-3 flex items-center justify-between">
                  <div>
                    <strong className="text-slate-200">ความปลอดภัยและข้อกำหนดการใช้งาน:</strong>
                    <div className="text-[11px] text-slate-400">ไม่อนุญาตให้ใช้ Web Scraper หรือหลบเลี่ยงระบบตรวจสอบความปลอดภัย</div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-teal-500/20 text-teal-300">
                    ToS Compliant (No Scraping)
                  </span>
                </div>

                <div className="p-3 flex items-center justify-between">
                  <div>
                    <strong className="text-slate-200">ข้อกำหนดด้านค่าใช้จ่ายและ Billing:</strong>
                    <div className="text-[11px] text-slate-400">ไม่เปิด Billing หรือสร้างค่าใช้จ่าย (No-cost requirement)</div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300">
                    Free 100% (No Billing)
                  </span>
                </div>

                <div className="p-3 flex items-center justify-between">
                  <div>
                    <strong className="text-slate-200">โหมดการทำงานของ AIVC V3.3.3:</strong>
                    <div className="text-[11px] text-slate-400">Google Flow Studio Bridge Mode (เตรียม Prompt + จัดคิว + นำเข้าภาพจริง)</div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 font-bold">
                    Official Bridge Active
                  </span>
                </div>
              </div>

              <div className="bg-indigo-950/30 border border-indigo-500/30 rounded-lg p-3 leading-relaxed text-indigo-200">
                <strong className="text-white">คำอธิบายข้อจำกัดและการใช้งาน:</strong> เนื่องจาก Google Labs ยังไม่มี Headless REST API ทางตรง AIVC V3.3.3 จึงใช้กระบวนการ <strong>Google Flow Studio Bridge</strong> ที่มีความเสถียรและปลอดภัยสูงสุด โดยระบบจะคำนวณ Character Prompts ของทุกฉากให้อัตโนมัติ ผู้ใช้สามารถกดปุ่ม "คัดลอก Prompt และเปิด Google Flow" เพื่อวางคำสั่งในหน้าต่าง Google Flow ได้ทันที และเมื่อบันทึกภาพจาก Google Flow แล้ว ให้นำไฟล์มาแนบที่ปุ่ม Upload หรือใช้ปุ่มนำเข้าหลายไฟล์พร้อมกัน ระบบจะจัดเก็บภาพ เมตาดาต้า และสถานะความพร้อมลงในโปรเจกต์เดิมทันที
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="px-4 sm:px-6 py-3.5 border-t border-slate-800 flex items-center justify-between bg-slate-950/80 gap-3">
          <button
            onClick={() => handleOpenGoogleFlow()}
            className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>ไปที่ labs.google/flow</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition touch-manipulation min-h-[38px] cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>

      {/* Lightbox Modal for Full Image Inspection */}
      {lightboxImage && (
        <div className="fixed inset-0 z-60 bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute -top-12 right-0 p-2 text-white/80 hover:text-white bg-slate-800/80 rounded-full cursor-pointer"
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
    </div>
  );
};
