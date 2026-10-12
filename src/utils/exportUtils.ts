import { ProductionBlueprint } from '../types/director';

export function exportToCSV(blueprint: ProductionBlueprint): string {
  const headers = [
    'Shot #',
    'Scene #',
    'Time Range',
    'Duration (s)',
    'Shot Type',
    'Camera Movement',
    'Action Description',
    'Image Prompt (English)',
    'Image Style Tags',
    'Aspect Ratio',
    'Motion Prompt (English)',
    'Camera Motion Directive',
    'Recommended Video Tool',
    'Thai Voiceover',
    'SFX',
    'BGM',
    'Cut / Transition',
    'On-Screen Subtitle',
    'Continuity Check'
  ];

  const rows = blueprint.shots.map((shot) => [
    `Shot ${shot.shotNumber}`,
    `Scene ${shot.sceneNumber}`,
    shot.timeRange,
    shot.durationSec,
    `"${(shot.shotType || '').replace(/"/g, '""')}"`,
    `"${(shot.cameraMovement || '').replace(/"/g, '""')}"`,
    `"${(shot.actionDescription || '').replace(/"/g, '""')}"`,
    `"${(shot.imagePrompt?.positivePromptEn || '').replace(/"/g, '""')}"`,
    `"${(shot.imagePrompt?.styleTags || '').replace(/"/g, '""')}"`,
    shot.imagePrompt?.aspectRatio || '9:16',
    `"${(shot.motionPrompt?.videoPromptEn || '').replace(/"/g, '""')}"`,
    `"${(shot.motionPrompt?.cameraMotionDirective || '').replace(/"/g, '""')}"`,
    `"${(shot.motionPrompt?.recommendedTools?.join(', ') || '').replace(/"/g, '""')}"`,
    `"${(shot.audioDesign?.thaiVoiceover || '').replace(/"/g, '""')}"`,
    `"${(shot.audioDesign?.sfx || '').replace(/"/g, '""')}"`,
    `"${(shot.audioDesign?.bgmCue || '').replace(/"/g, '""')}"`,
    `"${(shot.editingDirection?.cutType || '').replace(/"/g, '""')}"`,
    `"${(shot.editingDirection?.thaiSubtitleOverlay || '').replace(/"/g, '""')}"`,
    `"${(shot.continuityTag || '').replace(/"/g, '""')}"`
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function downloadMediaFromUrl(url: string, filename: string): Promise<boolean> {
  try {
    if (!url || typeof url !== 'string' || url.trim() === '') {
      console.warn('Cannot download: image URL is empty');
      return false;
    }

    if (url.startsWith('data:')) {
      if (url.length < 50) {
        console.warn('Cannot download: data URL is corrupted or too short');
        return false;
      }
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return true;
    }

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: Failed to fetch media`);
    }
    const blob = await res.blob();
    if (blob.size === 0) {
      throw new Error('Downloaded file is empty (0 bytes)');
    }
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(objectUrl);
    return true;
  } catch (err) {
    console.error('Error downloading media:', err);
    if (url && url.startsWith('http')) {
      window.open(url, '_blank');
    }
    return false;
  }
}

export async function downloadAllImagesSequentially(
  shots: { sceneId?: string; shotNumber: number; generatedImage?: string }[],
  onProgress?: (current: number, total: number) => void
): Promise<{ downloaded: number; total: number }> {
  const readyShots = shots.filter((s) => Boolean(s.generatedImage && s.generatedImage.trim().length > 50));
  let downloaded = 0;
  for (let i = 0; i < readyShots.length; i++) {
    const shot = readyShots[i];
    const filename = `AIVC-${shot.sceneId || 'Shot-' + shot.shotNumber}-image.png`;
    const success = await downloadMediaFromUrl(shot.generatedImage!, filename);
    if (success) {
      downloaded++;
    }
    if (onProgress) {
      onProgress(i + 1, readyShots.length);
    }
    if (i < readyShots.length - 1) {
      // Delay to avoid browser popup blocks on rapid downloads
      await new Promise((resolve) => setTimeout(resolve, 350));
    }
  }
  return { downloaded, total: readyShots.length };
}

export function getAllImagePrompts(blueprint: ProductionBlueprint): string {
  return blueprint.shots
    .map(
      (s) =>
        `### Shot ${s.shotNumber} (${s.timeRange}) - ${s.shotType}\n` +
        `Prompt: ${s.imagePrompt.positivePromptEn}\n` +
        `Style: ${s.imagePrompt.styleTags}\n` +
        `Lighting/Lens: ${s.imagePrompt.lightingAndLens}\n` +
        `Negative: ${s.imagePrompt.negativePrompt}\n` +
        `--ar ${s.imagePrompt.aspectRatio}\n`
    )
    .join('\n----------------------------------------\n\n');
}

export function getAllMotionPrompts(blueprint: ProductionBlueprint): string {
  return blueprint.shots
    .map(
      (s) =>
        `### Shot ${s.shotNumber} (${s.timeRange}) - ${s.cameraMovement}\n` +
        `Video Prompt: ${s.motionPrompt.videoPromptEn}\n` +
        `Camera Directive: ${s.motionPrompt.cameraMotionDirective}\n` +
        `Intensity: ${s.motionPrompt.motionIntensity}\n` +
        `Recommended Free Tools: ${s.motionPrompt.recommendedTools.join(', ')}\n`
    )
    .join('\n----------------------------------------\n\n');
}

export function getFullThaiScript(blueprint: ProductionBlueprint): string {
  const header = `=== บทพากย์ภาษาไทยสำหรับวิดีโอ: ${blueprint.projectTitle} ===\nความยาวประมาณ: ${blueprint.analysis.estimatedTotalDurationSec} วินาที | สัดส่วน: ${blueprint.analysis.aspectRatio}\n\n`;
  const body = blueprint.shots
    .map(
      (s) =>
        `[${s.timeRange}] Shot ${s.shotNumber} (${s.shotType}):\n` +
        `บทพูด: "${s.audioDesign.thaiVoiceover}"\n` +
        `น้ำเสียง: ${s.audioDesign.voiceToneAndPacing}\n` +
        `SFX: ${s.audioDesign.sfx}\n` +
        `BGM: ${s.audioDesign.bgmCue}\n`
    )
    .join('\n');
  return header + body;
}

export function getCapCutGuideText(blueprint: ProductionBlueprint): string {
  return `=== แผนตัดต่อ CAPCUT / DAVINCI RESOLVE: ${blueprint.projectTitle} ===\n\n` +
    `ภาพรวมไทม์ไลน์: ${blueprint.assemblyMasterPlan.timelineSummary}\n` +
    `เพลง BGM แนะนำ: ${blueprint.assemblyMasterPlan.bgmTrackRecommendation}\n` +
    `โทนสี / LUT: ${blueprint.assemblyMasterPlan.colorGradingLut}\n\n` +
    `ขั้นตอนการประกอบร่างใน CapCut:\n` +
    blueprint.assemblyMasterPlan.capcutAssemblySteps.map((step, idx) => `${idx + 1}. ${step}`).join('\n') +
    `\n\nขั้นตอนเครื่องมือฟรี:\n` +
    blueprint.assemblyMasterPlan.freeExportWorkflow.map((w, idx) => `- ${w}`).join('\n');
}

/**
 * Prepares blueprint for JSON export ensuring all V3.1 fields are included
 * and temporary non-serializable blob URLs are safely handled
 */
export function cleanProjectForExport(blueprint: ProductionBlueprint): string {
  const exportData: ProductionBlueprint = {
    ...blueprint,
    systemVersion: 'AIVC-CORE-V3.3.3',
    characters: (blueprint.characters || []).map((c) => ({
      ...c,
      isLocked: c.isLocked !== false,
      canonicalDescription: c.canonicalDescription || c.consistencyLockPrompt,
      canonicalClothing: c.canonicalClothing || c.visualIdentity?.clothing || '',
      // Only keep referenceImageUrl if it's not a temporary blob URL
      referenceImageUrl: c.referenceImageUrl?.startsWith('blob:') ? undefined : c.referenceImageUrl,
      referenceImageNotes: c.referenceImageNotes || '',
    })),
    shots: (blueprint.shots || []).map((s) => ({
      ...s,
      characterIds: Array.isArray(s.characterIds) ? s.characterIds : [],
      promptConsistencyStatus: s.promptConsistencyStatus || 'CONSISTENT',
      selectedVideoWorkflowProvider: s.selectedVideoWorkflowProvider || 'google-flow',
      flowWorkflowStatus: s.flowWorkflowStatus,
      // Strip temporary blob URLs to prevent stale invalid references on reload
      generatedImage: s.generatedImage?.startsWith('blob:') ? '' : s.generatedImage,
      generatedVideo: s.generatedVideo?.startsWith('blob:') ? '' : s.generatedVideo,
      imageMetadata: s.imageMetadata ? {
        fileName: s.imageMetadata.fileName,
        fileSize: s.imageMetadata.fileSize,
        mimeType: s.imageMetadata.mimeType,
        attachedAt: s.imageMetadata.attachedAt,
        provider: s.imageMetadata.provider || 'Google Flow',
        notes: s.imageMetadata.notes,
      } : undefined,
      videoMetadata: s.videoMetadata ? {
        fileName: s.videoMetadata.fileName,
        fileSize: s.videoMetadata.fileSize,
        attachedAt: s.videoMetadata.attachedAt,
        provider: s.videoMetadata.provider || 'Google Flow',
        notes: s.videoMetadata.notes,
      } : undefined,
    })),
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Safely parses and normalizes imported project JSON, maintaining backward compatibility
 * with older AIVC projects (V1/V2/V3) that lack characterIds or lock settings
 */
export function parseImportedProjectJSON(jsonString: string): ProductionBlueprint {
  const parsed = JSON.parse(jsonString);

  if (!parsed || !parsed.shots || !Array.isArray(parsed.shots)) {
    throw new Error('โครงสร้างไฟล์ JSON ไม่ถูกต้อง: ขาดข้อมูล Shots');
  }

  // Normalize characters
  const characters = (Array.isArray(parsed.characters) ? parsed.characters : []).map((c: any, idx: number) => ({
    id: c.id || `char-${idx + 1}`,
    name: c.name || `ตัวละคร ${idx + 1}`,
    role: c.role || 'ตัวละคร',
    ageAndGender: c.ageAndGender || 'ไม่ระบุ',
    visualIdentity: c.visualIdentity || {
      faceAndHair: 'ตามคำอธิบายใน Prompt',
      clothing: 'ชุดมาตรฐาน',
      accessoriesAndTraits: 'ไม่มี',
      expressionBaseline: 'สีหน้าเป็นมิตร',
    },
    consistencyLockPrompt: c.consistencyLockPrompt || '',
    negativePrompt: c.negativePrompt || '',
    isLocked: c.isLocked !== undefined ? c.isLocked : true,
    canonicalDescription: c.canonicalDescription || c.consistencyLockPrompt || '',
    canonicalClothing: c.canonicalClothing || c.visualIdentity?.clothing || '',
    referenceImageUrl: c.referenceImageUrl || '',
    referenceImageNotes: c.referenceImageNotes || '',
  }));

  // Normalize shots (Backward Compatibility with older projects without character assignments)
  const shots = parsed.shots.map((s: any, idx: number) => ({
    ...s,
    shotNumber: s.shotNumber || idx + 1,
    sceneNumber: s.sceneNumber || 1,
    characterIds: Array.isArray(s.characterIds) ? s.characterIds : (characters.length > 0 && idx === 0 ? [characters[0].id] : []),
    promptConsistencyStatus: s.promptConsistencyStatus || 'CONSISTENT',
    selectedVideoWorkflowProvider: s.selectedVideoWorkflowProvider || 'google-flow',
    flowWorkflowStatus: s.flowWorkflowStatus || (s.generatedImage ? 'DONE' : 'QUEUED'),
    generationStatus: s.generationStatus || (s.generatedImage ? 'IMAGE_READY' : 'PROMPT_READY'),
    generatedImage: s.generatedImage || '',
    generatedVideo: s.generatedVideo || '',
    imageMetadata: s.imageMetadata || undefined,
    videoMetadata: s.videoMetadata || undefined,
  }));

  return {
    ...parsed,
    id: parsed.id || `blueprint-imported-${Date.now()}`,
    systemVersion: 'AIVC-CORE-V3.3.3',
    characters,
    shots,
  };
}
