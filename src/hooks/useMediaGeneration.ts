import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ShotDetail,
  ImageProviderId,
  VideoProviderId,
  ProviderStatusInfo,
  DirectImageGenResponse,
  DirectVideoGenResponse,
  ProductionBlueprint,
} from '../types/director';
import { downloadMediaFromUrl, downloadAllImagesSequentially } from '../utils/exportUtils';

export interface GenerationErrorNotice {
  title: string;
  message: string;
  requirementsNotice?: string;
  setupInstructions?: string;
}

export interface BatchImageResult {
  shotNumber: number;
  sceneId: string;
  success: boolean;
  error?: string;
  requirementsNotice?: string;
}

export interface BatchImageProgress {
  isActive: boolean;
  total: number;
  current: number;
  currentSceneId: string;
  succeededCount: number;
  failedCount: number;
  results: BatchImageResult[];
  isAborted: boolean;
  isComplete: boolean;
}

export function useMediaGeneration(
  onUpdateShot?: (updatedShot: ShotDetail) => void,
  blueprint?: ProductionBlueprint
) {
  const [generatingImageShot, setGeneratingImageShot] = useState<number | null>(null);
  const [generatingVideoShot, setGeneratingVideoShot] = useState<number | null>(null);
  const [errorNotice, setErrorNotice] = useState<GenerationErrorNotice | null>(null);
  const [providerStatuses, setProviderStatuses] = useState<{
    imageProviders: ProviderStatusInfo[];
    videoProviders: ProviderStatusInfo[];
  } | null>(null);

  // Batch Image Generation Progress State
  const [batchProgress, setBatchProgress] = useState<BatchImageProgress | null>(null);
  const isBatchAbortedRef = useRef<boolean>(false);

  // Fetch real provider availability on mount
  const refreshProviderStatuses = useCallback(async () => {
    try {
      const res = await fetch('/api/media/providers');
      if (res.ok) {
        const data = await res.json();
        setProviderStatuses(data);
      }
    } catch (err) {
      console.warn('Failed to fetch media providers status:', err);
    }
  }, []);

  useEffect(() => {
    refreshProviderStatuses();
  }, [refreshProviderStatuses]);

  // Internal execution engine for a single shot image generation
  const executeImageGeneration = useCallback(
    async (
      shot: ShotDetail,
      aspectRatio?: '9:16' | '16:9' | '1:1' | '4:3' | '3:4',
      provider: ImageProviderId = 'google-gemini'
    ): Promise<{
      success: boolean;
      data?: DirectImageGenResponse;
      error?: string;
      requirementsNotice?: string;
      setupInstructions?: string;
    }> => {
      if (!shot.imagePrompt?.positivePromptEn) {
        return {
          success: false,
          error: 'ไม่พบ Positive Image Prompt ในฉากนี้ กรุณาสร้างหรือระบุ Prompt ก่อน',
        };
      }

      // Step 2 & 3: Retrieve assigned characters from blueprint roster
      const assignedCharacters = (blueprint?.characters || [])
        .filter((c) => (shot.characterIds || []).includes(c.id))
        .map((c) => ({
          id: c.id,
          name: c.name,
          role: c.role || '',
          canonicalDescription: c.canonicalDescription || c.consistencyLockPrompt || '',
          clothing: c.canonicalClothing || c.visualIdentity?.clothing || '',
          referenceImage: c.referenceImageNotes || c.referenceImageUrl || '',
        }));

      try {
        const res = await fetch('/api/media/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: shot.imagePrompt.positivePromptEn,
            negativePrompt: shot.imagePrompt.negativePrompt,
            aspectRatio: aspectRatio || shot.imagePrompt.aspectRatio || '9:16',
            sceneId: shot.sceneId || `SC-${String(shot.shotNumber).padStart(2, '0')}`,
            shotNumber: shot.shotNumber,
            provider,
            assignedCharacters,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const errMsg = errData?.error || `HTTP ${res.status}: ${res.statusText}`;
          return {
            success: false,
            error: errMsg,
            requirementsNotice: errData?.requirementsNotice,
            setupInstructions: errData?.setupInstructions,
          };
        }

        const data: DirectImageGenResponse = await res.json();

        if (data.success && data.imageUrl) {
          // Success: update scene and advance status to IMAGE_READY
          if (onUpdateShot) {
            onUpdateShot({
              ...shot,
              generatedImage: data.imageUrl,
              generationStatus: 'IMAGE_READY',
              mediaNotes: `สร้างภาพสำเร็จผ่านโมเดล ${data.model} (${new Date().toLocaleTimeString()})`,
            });
          }
          return { success: true, data };
        } else {
          return {
            success: false,
            data,
            error: data.error || 'โมเดลไม่สามารถสร้างภาพได้',
            requirementsNotice: data.requirementsNotice,
            setupInstructions: data.setupInstructions,
          };
        }
      } catch (err: any) {
        console.error(`[useMediaGeneration] Image generation error on shot ${shot.shotNumber}:`, err);
        return {
          success: false,
          error: err?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อเครือข่ายไปยังเซิร์ฟเวอร์สร้างภาพ',
        };
      }
    },
    [blueprint, onUpdateShot]
  );

  // Single Scene Image Generation (Manual or Individual Trigger)
  const generateImage = useCallback(
    async (
      shot: ShotDetail,
      aspectRatio?: '9:16' | '16:9' | '1:1' | '4:3' | '3:4',
      provider: ImageProviderId = 'google-gemini'
    ) => {
      setGeneratingImageShot(shot.shotNumber);
      setErrorNotice(null);

      const result = await executeImageGeneration(shot, aspectRatio, provider);

      if (!result.success) {
        setErrorNotice({
          title: `สถานะสร้างภาพฉาก ${shot.sceneId || shot.shotNumber}`,
          message: result.error || 'ไม่สามารถสร้างภาพได้',
          requirementsNotice: result.requirementsNotice,
          setupInstructions: result.setupInstructions,
        });
      }

      setGeneratingImageShot(null);
      return result;
    },
    [executeImageGeneration]
  );

  // Batch Image Generation for the Entire Project (Feature: Generate All Images)
  const generateAllImages = useCallback(
    async (options?: { retryFailedOnly?: boolean; provider?: ImageProviderId }) => {
      const shots = blueprint?.shots || [];
      if (shots.length === 0) return;

      let targetShots = [...shots];
      if (options?.retryFailedOnly) {
        // Only retry scenes that don't have a generatedImage or were marked as failed
        targetShots = targetShots.filter((s) => !s.generatedImage || s.generationStatus === 'FAILED');
      }

      if (targetShots.length === 0) {
        setErrorNotice({
          title: 'ทุกฉากมีภาพพร้อมแล้ว',
          message: 'ทุกฉากในโปรเจกต์นี้ได้รับการสร้างภาพเรียบร้อยแล้ว หากต้องการสร้างใหม่ ให้กด "Gen Image" ที่การ์ดฉากนั้นๆ โดยตรง',
        });
        return;
      }

      isBatchAbortedRef.current = false;
      setBatchProgress({
        isActive: true,
        total: targetShots.length,
        current: 1,
        currentSceneId: targetShots[0].sceneId || `SC-${targetShots[0].shotNumber}`,
        succeededCount: 0,
        failedCount: 0,
        results: [],
        isAborted: false,
        isComplete: false,
      });

      for (let i = 0; i < targetShots.length; i++) {
        if (isBatchAbortedRef.current) {
          setBatchProgress((prev) =>
            prev ? { ...prev, isActive: false, isAborted: true, isComplete: true } : null
          );
          break;
        }

        const currentShot = targetShots[i];
        setBatchProgress((prev) =>
          prev
            ? {
                ...prev,
                current: i + 1,
                currentSceneId: currentShot.sceneId || `SC-${currentShot.shotNumber}`,
              }
            : null
        );

        setGeneratingImageShot(currentShot.shotNumber);
        const result = await executeImageGeneration(currentShot, undefined, options?.provider);
        setGeneratingImageShot(null);

        setBatchProgress((prev) => {
          if (!prev) return null;
          const newResult: BatchImageResult = {
            shotNumber: currentShot.shotNumber,
            sceneId: currentShot.sceneId || `SC-${currentShot.shotNumber}`,
            success: result.success,
            error: result.error,
            requirementsNotice: result.requirementsNotice,
          };
          return {
            ...prev,
            succeededCount: result.success ? prev.succeededCount + 1 : prev.succeededCount,
            failedCount: !result.success ? prev.failedCount + 1 : prev.failedCount,
            results: [...prev.results, newResult],
          };
        });

        // Safe spacing delay (400ms) between sequential calls
        if (i < targetShots.length - 1 && !isBatchAbortedRef.current) {
          await new Promise((resolve) => setTimeout(resolve, 400));
        }
      }

      setBatchProgress((prev) =>
        prev ? { ...prev, isActive: false, isComplete: true } : null
      );
    },
    [blueprint, executeImageGeneration]
  );

  const cancelBatchImages = useCallback(() => {
    isBatchAbortedRef.current = true;
    setBatchProgress((prev) =>
      prev ? { ...prev, isActive: false, isAborted: true, isComplete: true } : null
    );
  }, []);

  const clearBatchProgress = useCallback(() => {
    setBatchProgress(null);
  }, []);

  // Direct Video Generation
  const generateVideo = useCallback(
    async (shot: ShotDetail, provider: VideoProviderId = 'google-veo') => {
      if (!shot.motionPrompt?.videoPromptEn) {
        setErrorNotice({
          title: 'ไม่พบ Motion Prompt สำหรับสร้างวิดีโอ',
          message: 'กรุณาระบุหรือตรวจสอบ Video Motion Prompt ในช็อตนี้ก่อน',
        });
        return;
      }

      setGeneratingVideoShot(shot.shotNumber);
      setErrorNotice(null);

      try {
        const res = await fetch('/api/media/generate-video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: shot.motionPrompt.videoPromptEn,
            imageUrl: shot.generatedImage || undefined,
            sceneId: shot.sceneId || `SC-${String(shot.shotNumber).padStart(2, '0')}`,
            shotNumber: shot.shotNumber,
            durationSec: shot.durationSec || 5,
            provider,
          }),
        });

        const data: DirectVideoGenResponse = await res.json();

        if (data.success && data.videoUrl) {
          if (onUpdateShot) {
            onUpdateShot({
              ...shot,
              generatedVideo: data.videoUrl,
              generationStatus: 'VIDEO_READY',
              mediaNotes: `สร้างวิดีโอสำเร็จผ่านโมเดล ${data.model} (${new Date().toLocaleTimeString()})`,
            });
          }
        } else {
          setErrorNotice({
            title: `สถานะโมเดลสร้างวิดีโอ (${data.provider || 'AI Video Provider'})`,
            message: data.error || 'โมเดลสร้างวิดีโอยังไม่พร้อมใช้งานในสภาวะแวดล้อมนี้',
            requirementsNotice: data.requirementsNotice,
            setupInstructions: data.setupInstructions,
          });
        }
      } catch (err: any) {
        console.error('Video generation request failed:', err);
        setErrorNotice({
          title: 'เกิดข้อผิดพลาดในการเชื่อมต่อเครือข่าย',
          message: err?.message || 'ไม่สามารถติดต่อเซิร์ฟเวอร์สร้างวิดีโอได้ กรุณาลองใหม่อีกครั้ง',
        });
      } finally {
        setGeneratingVideoShot(null);
      }
    },
    [onUpdateShot]
  );

  // Animate Reference Image (Image-to-Video)
  const animateReferenceImage = useCallback(
    async (shot: ShotDetail, provider: VideoProviderId = 'google-veo') => {
      const imageToAnimate = shot.generatedImage || shot.referenceImage;
      if (!imageToAnimate) {
        setErrorNotice({
          title: 'ยังไม่มีภาพตั้งต้นสำหรับสร้างวิดีโอ',
          message: 'กรุณากด "Generate Image" เพื่อสร้างภาพ หรืออัปโหลดภาพในฉากนี้ก่อนทำการ Animate',
        });
        return;
      }

      setGeneratingVideoShot(shot.shotNumber);
      setErrorNotice(null);

      try {
        const res = await fetch('/api/media/generate-video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: shot.motionPrompt?.videoPromptEn || 'Cinematic subtle motion',
            imageUrl: imageToAnimate,
            sceneId: shot.sceneId || `SC-${String(shot.shotNumber).padStart(2, '0')}`,
            shotNumber: shot.shotNumber,
            durationSec: shot.durationSec || 5,
            provider,
          }),
        });

        const data: DirectVideoGenResponse = await res.json();

        if (data.success && data.videoUrl) {
          if (onUpdateShot) {
            onUpdateShot({
              ...shot,
              generatedVideo: data.videoUrl,
              generationStatus: 'VIDEO_READY',
              mediaNotes: `สร้างคลิปจากภาพตั้งต้นสำเร็จผ่าน ${data.model}`,
            });
          }
        } else {
          setErrorNotice({
            title: `สถานะ Animate Reference Image (${data.provider || 'AI Video'})`,
            message: data.error || 'ต้องการ API Key หรือ Billing เพื่อแปลงภาพเป็นวิดีโอโดยตรง',
            requirementsNotice: data.requirementsNotice,
            setupInstructions: data.setupInstructions,
          });
        }
      } catch (err: any) {
        setErrorNotice({
          title: 'เกิดข้อผิดพลาดในการเชื่อมต่อ',
          message: err?.message || 'ไม่สามารถติดต่อบริการสร้างวิดีโอได้',
        });
      } finally {
        setGeneratingVideoShot(null);
      }
    },
    [onUpdateShot]
  );

  // Download Image
  const downloadImage = useCallback((shot: ShotDetail) => {
    if (!shot.generatedImage) return;
    const filename = `AIVC-${shot.sceneId || 'Shot-' + shot.shotNumber}-image.png`;
    downloadMediaFromUrl(shot.generatedImage, filename);
  }, []);

  // Download Video
  const downloadVideo = useCallback((shot: ShotDetail) => {
    if (!shot.generatedVideo) return;
    const filename = `AIVC-${shot.sceneId || 'Shot-' + shot.shotNumber}-video.mp4`;
    downloadMediaFromUrl(shot.generatedVideo, filename);
  }, []);

  // Download All Generated Images sequentially
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<{ current: number; total: number } | null>(null);

  const downloadAllImages = useCallback(async (): Promise<{ downloaded: number; total: number }> => {
    const readyShots = (blueprint?.shots || []).filter((s) => Boolean(s.generatedImage));
    if (readyShots.length === 0) {
      setErrorNotice({
        title: 'ยังไม่มีไฟล์ภาพในโปรเจกต์',
        message: 'กรุณาสร้างภาพหรือแนบภาพในแต่ละฉากก่อนกดดาวน์โหลดภาพทั้งหมด',
      });
      return { downloaded: 0, total: 0 };
    }

    setIsDownloadingAll(true);
    setDownloadProgress({ current: 0, total: readyShots.length });

    try {
      const result = await downloadAllImagesSequentially(
        blueprint?.shots || [],
        (current, total) => {
          setDownloadProgress({ current, total });
        }
      );
      return result;
    } finally {
      setIsDownloadingAll(false);
      setTimeout(() => setDownloadProgress(null), 3000);
    }
  }, [blueprint]);

  return {
    generatingImageShot,
    generatingVideoShot,
    errorNotice,
    clearErrorNotice: () => setErrorNotice(null),
    providerStatuses,
    refreshProviderStatuses,
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
  };
}
