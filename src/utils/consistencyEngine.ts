import type { CharacterProfile, EnvironmentAnchor, ShotDetail } from '../types/director.ts';

export interface GeneratedScenePrompts {
  positivePromptEn: string;
  negativePrompt: string;
  videoPromptEn: string;
  cameraMotionDirective: string;
  injectedDetails: string[];
}

export interface ConflictCheckResult {
  hasConflict: boolean;
  warnings: string[];
  conflictingItems: {
    characterName: string;
    category: string;
    expected: string;
    found: string;
  }[];
}

/**
 * Standard colors & clothing keywords for conflict detection
 */
const CONFLICT_CLOTHING_RULES = [
  { pattern: /\b(?:red|scarlet|crimson|ruby)\s+(?:dress|jacket|coat|hoodie|shirt|suit|robe)\b/i, color: 'red' },
  { pattern: /\b(?:yellow|gold|amber)\s+(?:dress|jacket|coat|hoodie|shirt|suit)\b/i, color: 'yellow' },
  { pattern: /\b(?:green|emerald|olive)\s+(?:dress|jacket|coat|hoodie|shirt|suit)\b/i, color: 'green' },
  { pattern: /\b(?:white|cream|ivory)\s+(?:suit|tuxedo|coat|jacket|dress)\b/i, color: 'white' },
  { pattern: /\b(?:pink|purple|violet)\s+(?:jacket|dress|hoodie|shirt)\b/i, color: 'pink/purple' },
  { pattern: /\b(?:swimsuit|bikini|armor|spacesuit)\b/i, type: 'special_attire' },
];

const CONFLICT_HAIR_RULES = [
  { pattern: /\b(?:blonde|blond|golden|yellow)\s+hair\b/i, trait: 'blonde' },
  { pattern: /\b(?:red|ginger)\s+hair\b/i, trait: 'red hair' },
  { pattern: /\b(?:long|shoulder-length|ponytail|braided)\s+hair\b/i, trait: 'long/braided hair' },
  { pattern: /\b(?:bald|shaved head)\b/i, trait: 'bald' },
  { pattern: /\b(?:curly|wavy|afro)\s+hair\b/i, trait: 'curly hair' },
];

/**
 * Generates character-aware Image and Video prompts deterministically or via model output
 */
export function generateCharacterAwarePrompts(
  shot: ShotDetail,
  assignedCharacters: CharacterProfile[],
  environment?: EnvironmentAnchor
): GeneratedScenePrompts {
  const injectedDetails: string[] = [];
  const ratio = shot.imagePrompt?.aspectRatio || '9:16';
  const shotType = shot.shotType || 'Medium Shot';
  const cameraMovement = shot.cameraMovement || 'Static';

  // 1. Scene-specific action & composition
  const actionText = shot.actionDescription || 'Subject interacting with environment';
  const lightingText = shot.compositionAndLighting || 'Cinematic dramatic lighting';
  const envText = environment
    ? environment.consistencyPromptLock
    : 'Atmospheric cinematic environment with rich background depth';

  let characterPromptSegment = '';
  let negativePromptsList: string[] = [
    'blurry',
    'distorted anatomy',
    'extra limbs',
    'bad proportions',
    'low resolution',
    'watermark',
    'text',
  ];

  if (!assignedCharacters || assignedCharacters.length === 0) {
    // Zero characters assigned: scenery, cutaway, macro, or abstract visual
    characterPromptSegment = 'Scenery cinematic shot, no human characters in frame, pure focus on environment and atmospheric visual elements';
    injectedDetails.push('ฉากไม่มีตัวละคร (Pure Scenery / Visuals / Graphics)');
    injectedDetails.push(`มุมกล้อง: ${shotType} (${cameraMovement})`);
    injectedDetails.push(`การจัดแสง: ${lightingText.slice(0, 60)}...`);
  } else if (assignedCharacters.length === 1) {
    const char = assignedCharacters[0];
    const canonical = char.canonicalDescription || char.consistencyLockPrompt;
    const clothing = char.canonicalClothing || char.visualIdentity.clothing;
    const faceHair = char.visualIdentity.faceAndHair;

    characterPromptSegment = `${shotType} of ${canonical}. Permanent clothing: ${clothing}. Visual traits: ${faceHair}`;
    
    injectedDetails.push(`ตัวละครหลัก: ${char.name} (${char.role})`);
    if (char.isLocked !== false) {
      injectedDetails.push(`🔒 ล็อคเอกลักษณ์: ${clothing}`);
    }
    injectedDetails.push(`ใบหน้า/ผม: ${faceHair.slice(0, 50)}...`);

    if (char.negativePrompt) {
      negativePromptsList.push(char.negativePrompt);
    }
  } else {
    // Multiple characters assigned
    const charDescriptions = assignedCharacters.map((c, idx) => {
      const canonical = c.canonicalDescription || c.consistencyLockPrompt;
      const clothing = c.canonicalClothing || c.visualIdentity.clothing;
      injectedDetails.push(`ตัวละคร ${idx + 1}: ${c.name} (ล็อค: ${clothing.slice(0, 40)}...)`);
      if (c.negativePrompt) negativePromptsList.push(c.negativePrompt);
      return `Character ${idx + 1} (${c.name}): ${canonical}, wearing ${clothing}`;
    });

    characterPromptSegment = `${shotType} featuring ${assignedCharacters.length} key subjects: [${charDescriptions.join('; ')}]. Distinct interaction between characters`;
    injectedDetails.push(`ความต่อเนื่องหลายตัวละคร: แยกแยะอัตลักษณ์ชัดเจน ${assignedCharacters.length} คน`);
  }

  // Combine positive prompt: [Subject / Character Lock] + [Action & Emotion] + [Environment & Lighting] + [Technical Quality & Ratio]
  const positivePromptEn = `${characterPromptSegment}. Action & pose: ${actionText}. Environment & atmosphere: ${envText}. Lighting & mood: ${lightingText}. Highly detailed, photorealistic 8k, cinematic color grade, 35mm lens aesthetic --ar ${ratio}`;

  // Unique negative prompt
  const combinedNegative = Array.from(
    new Set(
      negativePromptsList
        .flatMap((p) => p.split(','))
        .map((s) => s.trim())
        .filter(Boolean)
    )
  ).join(', ');

  // Video Motion Prompt: character physical dynamics + camera directive
  let videoMotionEn = '';
  if (!assignedCharacters || assignedCharacters.length === 0) {
    videoMotionEn = `Smooth cinematic camera movement (${cameraMovement}), atmospheric environmental motion, floating particles, hyper-smooth 24fps film look`;
  } else if (assignedCharacters.length === 1) {
    videoMotionEn = `Camera ${cameraMovement} focused on ${assignedCharacters[0].name}, natural subtle breathing and realistic facial micro-expressions, smooth organic movement matching the action, cinematic 24fps motion`;
  } else {
    videoMotionEn = `Dynamic multi-character scene with camera ${cameraMovement}, natural interpersonal gestures, fluid realistic character interactions, cinematic cinematic depth of field`;
  }

  return {
    positivePromptEn,
    negativePrompt: combinedNegative,
    videoPromptEn: videoMotionEn,
    cameraMotionDirective: `Camera movement: ${cameraMovement}, subtle tracking`,
    injectedDetails,
  };
}

/**
 * Checks for conflicts between the scene's current prompt and the locked character profile
 */
export function detectConsistencyConflicts(
  shot: ShotDetail,
  assignedCharacters: CharacterProfile[]
): ConflictCheckResult {
  const warnings: string[] = [];
  const conflictingItems: ConflictCheckResult['conflictingItems'] = [];

  if (!assignedCharacters || assignedCharacters.length === 0) {
    // If 0 characters assigned, check if prompt mentions characters heavily
    return { hasConflict: false, warnings: [], conflictingItems: [] };
  }

  const promptText = (shot.imagePrompt?.positivePromptEn || '').toLowerCase();

  assignedCharacters.forEach((char) => {
    if (char.isLocked === false) return; // Not locked

    const charClothing = (char.canonicalClothing || char.visualIdentity.clothing || '').toLowerCase();
    const charHair = (char.visualIdentity.faceAndHair || '').toLowerCase();

    // 1. Check Clothing conflicts
    CONFLICT_CLOTHING_RULES.forEach((rule) => {
      const match = promptText.match(rule.pattern);
      if (match) {
        const foundPhrase = match[0];
        // If the locked clothing does NOT include this color or attire
        if (!charClothing.includes(rule.color || '') && !charClothing.includes(foundPhrase)) {
          const warning = `ตัวละคร '${char.name}' ล็อคชุดเป็น "${char.canonicalClothing || char.visualIdentity.clothing}" แต่ Prompt มีคำว่า "${foundPhrase}"`;
          warnings.push(warning);
          conflictingItems.push({
            characterName: char.name,
            category: 'เครื่องแต่งกาย (Clothing)',
            expected: char.canonicalClothing || char.visualIdentity.clothing,
            found: foundPhrase,
          });
        }
      }
    });

    // 2. Check Hair conflicts
    CONFLICT_HAIR_RULES.forEach((rule) => {
      const match = promptText.match(rule.pattern);
      if (match) {
        const foundPhrase = match[0];
        if (!charHair.includes(rule.trait) && !charHair.includes(foundPhrase)) {
          const warning = `ตัวละคร '${char.name}' ล็อคทรงผมเป็น "${char.visualIdentity.faceAndHair}" แต่ Prompt มีคำว่า "${foundPhrase}"`;
          warnings.push(warning);
          conflictingItems.push({
            characterName: char.name,
            category: 'ทรงผม (Hair)',
            expected: char.visualIdentity.faceAndHair,
            found: foundPhrase,
          });
        }
      }
    });
  });

  return {
    hasConflict: warnings.length > 0,
    warnings,
    conflictingItems,
  };
}

/**
 * Repairs conflicts by replacing contradictory phrases with the locked character's canonical traits
 */
export function repairConsistencyConflicts(
  shot: ShotDetail,
  assignedCharacters: CharacterProfile[]
): ShotDetail {
  if (!assignedCharacters || assignedCharacters.length === 0) {
    return {
      ...shot,
      promptConsistencyStatus: 'CONSISTENT',
      conflictWarnings: [],
    };
  }

  let updatedPrompt = shot.imagePrompt.positivePromptEn;

  assignedCharacters.forEach((char) => {
    if (char.isLocked === false) return;

    const canonicalClothing = char.canonicalClothing || char.visualIdentity.clothing;
    const canonicalHair = char.visualIdentity.faceAndHair;

    // Replace conflicting clothing phrases
    CONFLICT_CLOTHING_RULES.forEach((rule) => {
      if (rule.pattern.test(updatedPrompt)) {
        updatedPrompt = updatedPrompt.replace(rule.pattern, canonicalClothing);
      }
    });

    // Replace conflicting hair phrases
    CONFLICT_HAIR_RULES.forEach((rule) => {
      if (rule.pattern.test(updatedPrompt)) {
        updatedPrompt = updatedPrompt.replace(rule.pattern, canonicalHair);
      }
    });
  });

  return {
    ...shot,
    imagePrompt: {
      ...shot.imagePrompt,
      positivePromptEn: updatedPrompt,
    },
    promptConsistencyStatus: 'CONSISTENT',
    conflictWarnings: [],
  };
}

/**
 * Prepares reference image metadata and provider guidelines for AI workflows (Google Flow, Kling, SeaArt, etc.)
 */
export function prepareProviderReferences(characters: CharacterProfile[]): {
  referenceTags: string;
  assignedSummary: string;
  technicalGuidance: string;
} {
  if (!characters || characters.length === 0) {
    return {
      referenceTags: 'None (Scenery / VFX Shot)',
      assignedSummary: 'ไม่มีตัวละครในฉากนี้ (Scenery / B-Roll / Graphics)',
      technicalGuidance: 'ช็อตนี้เน้นบรรยากาศและสภาพแวดล้อม สามารถใช้ Text-to-Video หรือ Keyframe กราฟิกได้โดยตรง',
    };
  }

  const names = characters.map((c) => c.name).join(', ');
  const refNotes = characters
    .map((c) => `${c.name}: ${c.referenceImageNotes || c.canonicalClothing || 'Front portrait view'}`)
    .join(' | ');

  return {
    referenceTags: names,
    assignedSummary: `ตัวละครที่ล็อคในฉาก: ${names}`,
    technicalGuidance: `แนะนำให้นำ Reference Image ของ (${refNotes}) ไปใส่ในช่อง Image Reference / First Frame ของ Google Flow หรือ Video Generator เพื่อความสม่ำเสมอสูงสุด`,
  };
}

/**
 * Formats and optimizes prompt specifically for Google Flow / ImageFX / Veo
 * Strips parameter artifacts like --ar, --v and enhances with cinematic visual anchors
 */
export function formatPromptForGoogleFlow(basePrompt: string, aspectRatio: string = '9:16'): string {
  if (!basePrompt) return '';
  // Clean Midjourney parameter artifacts like --ar 9:16 or --v 6
  const clean = basePrompt
    .replace(/--ar\s+[0-9:]+/gi, '')
    .replace(/--v\s+[0-9.]+/gi, '')
    .replace(/--style\s+[a-z0-9]+/gi, '')
    .trim();

  // Add Google Flow visual anchors while avoiding repetitive boilerplate
  if (!clean.toLowerCase().includes('aspect ratio')) {
    return `${clean}, aspect ratio ${aspectRatio}, cinematic production quality, sharp focus, 8k resolution`.trim();
  }
  return clean;
}

export interface ConsistencyIssue {
  shotNumber: number;
  sceneId: string;
  type: 'UNASSIGNED_CHARACTER' | 'ORPHAN_CHARACTER_ID' | 'MISSING_CHARACTER_DATA' | 'PROMPT_CONFLICT' | 'MISSING_PROMPT';
  severity: 'error' | 'warning' | 'info';
  message: string;
  fixSuggestion?: string;
}

export interface ProjectConsistencyAuditReport {
  isFullyConsistent: boolean;
  totalShots: number;
  rosterCount: number;
  shotsWithCharacters: number;
  shotsWithoutCharacters: number;
  issues: ConsistencyIssue[];
  warningsCount: number;
  errorsCount: number;
  summaryText: string;
  facePreservationNotice?: string;
}

/**
 * Project-wide consistency audit:
 * Checks whether all assigned characters exist in Roster,
 * whether characters have required identity traits,
 * whether prompts match character locks, and flags incomplete data before generation
 */
export function auditProjectConsistency(
  shots: ShotDetail[],
  characters: CharacterProfile[]
): ProjectConsistencyAuditReport {
  const issues: ConsistencyIssue[] = [];
  const charMap = new Map<string, CharacterProfile>();
  characters.forEach((c) => charMap.set(c.id, c));

  let shotsWithCharacters = 0;
  let shotsWithoutCharacters = 0;

  // 1. Audit Characters in Roster
  characters.forEach((char) => {
    if (!char.canonicalClothing && !char.visualIdentity?.clothing) {
      issues.push({
        shotNumber: 0,
        sceneId: 'ROSTER',
        type: 'MISSING_CHARACTER_DATA',
        severity: 'warning',
        message: `ตัวละคร '${char.name}' ใน Roster ยังไม่ระบุชุดเครื่องแต่งกายประจำตัว (Clothing)`,
        fixSuggestion: 'ระบุชุดเครื่องแต่งกายประจำตัวเพื่อรักษาความต่อเนื่องตลอดเรื่อง',
      });
    }
    if (!char.consistencyLockPrompt && !char.canonicalDescription) {
      issues.push({
        shotNumber: 0,
        sceneId: 'ROSTER',
        type: 'MISSING_CHARACTER_DATA',
        severity: 'warning',
        message: `ตัวละคร '${char.name}' ใน Roster ยังไม่มี Consistency Lock Prompt ภาษาอังกฤษ`,
        fixSuggestion: 'เพิ่ม Consistency Lock Prompt เพื่อใช้คุมหน้าตาใน AI Model',
      });
    }
  });

  // 2. Audit Each Shot
  shots.forEach((shot) => {
    const assignedIds = shot.characterIds || [];
    const sceneId = shot.sceneId || `SC-${String(shot.shotNumber).padStart(2, '0')}`;

    if (assignedIds.length === 0) {
      shotsWithoutCharacters++;
    } else {
      shotsWithCharacters++;
    }

    // Check if positive prompt is present
    if (!shot.imagePrompt?.positivePromptEn?.trim()) {
      issues.push({
        shotNumber: shot.shotNumber,
        sceneId,
        type: 'MISSING_PROMPT',
        severity: 'error',
        message: `ฉาก ${sceneId} (ช็อต ${shot.shotNumber}) ยังไม่มี Image Prompt`,
        fixSuggestion: 'กดสร้าง Prompt ใหม่ หรือเขียน Positive Prompt ภาษาอังกฤษ',
      });
    }

    // Check orphan character IDs (assigned character doesn't exist in roster)
    assignedIds.forEach((id) => {
      if (!charMap.has(id)) {
        issues.push({
          shotNumber: shot.shotNumber,
          sceneId,
          type: 'ORPHAN_CHARACTER_ID',
          severity: 'error',
          message: `ฉาก ${sceneId} ผูกตัวละครรหัส '${id}' ที่ไม่พบใน Character Roster`,
          fixSuggestion: 'เลือกตัวละครที่มีอยู่ใน Roster หรือลบการผูกออก',
        });
      }
    });

    // Check prompt conflicts against locked characters
    const assignedProfiles = assignedIds
      .map((id) => charMap.get(id))
      .filter((c): c is CharacterProfile => Boolean(c));

    const conflicts = detectConsistencyConflicts(shot, assignedProfiles);
    if (conflicts.hasConflict) {
      conflicts.warnings.forEach((warn) => {
        issues.push({
          shotNumber: shot.shotNumber,
          sceneId,
          type: 'PROMPT_CONFLICT',
          severity: 'warning',
          message: `ฉาก ${sceneId}: ${warn}`,
          fixSuggestion: 'ปรับ Prompt ในฉากให้ตรงกับชุดหรือลักษณะที่ล็อคไว้',
        });
      });
    }
  });

  const errorsCount = issues.filter((i) => i.severity === 'error').length;
  const warningsCount = issues.filter((i) => i.severity === 'warning').length;
  const isFullyConsistent = errorsCount === 0 && warningsCount === 0;

  let summaryText = '';
  if (isFullyConsistent) {
    summaryText = `ตรวจสอบความพร้อมสมบูรณ์: ทั้ง ${shots.length} ฉากมีตัวละครและ Prompts สอดคล้องตาม Character Roster พร้อมส่งเข้ากระบวนการผลิต`;
  } else if (errorsCount > 0) {
    summaryText = `พบข้อบกพร่องที่ต้องแก้ไขก่อนสร้างภาพ ${errorsCount} รายการ (และข้อแนะนำ ${warningsCount} รายการ)`;
  } else {
    summaryText = `ข้อมูลพร้อมสร้างภาพ โดยมีข้อแนะนำด้านความต่อเนื่อง ${warningsCount} รายการ`;
  }

  const facePreservationNotice =
    'หมายเหตุความโปร่งใสทางเทคนิค: ระบบล็อค Prompt เสื้อผ้า ทรงผม และคุณลักษณะประจำตัวเพื่อรักษาความต่อเนื่องของตัวละคร แต่โมเดล AI ทั่วไปไม่ได้การันตีการรักษาโครงหน้าเดิม 100% เสมือนคนจริงจนกว่าจะใช้ Image Reference ร่วมกับ Face-Adapter';

  return {
    isFullyConsistent,
    totalShots: shots.length,
    rosterCount: characters.length,
    shotsWithCharacters,
    shotsWithoutCharacters,
    issues,
    warningsCount,
    errorsCount,
    summaryText,
    facePreservationNotice,
  };
}

/**
 * Formats all scenes into a comprehensive batch text package suitable for copying or exporting to Google Flow
 */
export function formatAllScenesForGoogleFlowBatch(
  shots: ShotDetail[],
  characters: CharacterProfile[],
  projectTitle: string
): string {
  const charMap = new Map<string, CharacterProfile>();
  characters.forEach((c) => charMap.set(c.id, c));

  const header = `======================================================================
AIVC V3.3.3 - GOOGLE FLOW BATCH PRODUCTION WORKFLOW
PROJECT: ${projectTitle}
TOTAL SCENES: ${shots.length} | CHARACTERS: ${characters.length}
======================================================================
[CHARACTER ROSTER REFERENCE]
${characters.map((c, i) => `${i + 1}. ${c.name} (${c.role}): ${c.canonicalClothing || c.visualIdentity?.clothing || 'Standard'} | Lock: ${c.consistencyLockPrompt || c.canonicalDescription || 'None'}`).join('\n')}
======================================================================\n\n`;

  const scenesText = shots
    .map((shot) => {
      const sceneId = shot.sceneId || `SC-${String(shot.shotNumber).padStart(2, '0')}`;
      const assigned = (shot.characterIds || [])
        .map((id) => charMap.get(id))
        .filter((c): c is CharacterProfile => Boolean(c));
      const charNames = assigned.length > 0 ? assigned.map((c) => c.name).join(', ') : 'Scenery / Visual Only';
      const prompt = formatPromptForGoogleFlow(shot.imagePrompt.positivePromptEn, shot.imagePrompt.aspectRatio);

      return `--------------------------------------------------
SCENE: ${sceneId} (Shot #${shot.shotNumber})
TYPE: ${shot.shotType} | RATIO: ${shot.imagePrompt.aspectRatio || '9:16'}
CHARACTERS: ${charNames}
ACTION: ${shot.actionDescription}
--------------------------------------------------
GOOGLE FLOW PROMPT:
${prompt}
--------------------------------------------------
AUDIO VOICEOVER: "${shot.audioDesign.thaiVoiceover}"
`;
    })
    .join('\n');

  return header + scenesText;
}

export interface MatchedImportItem {
  shotNumber: number;
  sceneId: string;
  dataUrl: string;
  file: File;
  reason: string;
}

export interface MatchImportResult {
  matched: MatchedImportItem[];
  unmatched: { file: File; reason: string }[];
}

/**
 * Automatically matches imported real image files to storyboard scenes by analyzing
 * scene IDs, shot numbers, or fallback sequence ordering
 */
export function matchImportedFilesToShots(
  files: { file: File; dataUrl: string }[],
  shots: ShotDetail[]
): MatchImportResult {
  const matched: MatchedImportItem[] = [];
  const unmatched: { file: File; reason: string }[] = [];
  const assignedShotNumbers = new Set<number>();

  for (const item of files) {
    const filename = item.file.name.toLowerCase();
    let foundShot: ShotDetail | undefined;
    let matchReason = '';

    // 1. Try matching by exact scene ID e.g. SC-01, SC01, SC_01
    for (const shot of shots) {
      if (assignedShotNumbers.has(shot.shotNumber)) continue;
      const sceneId = (shot.sceneId || `SC-${String(shot.shotNumber).padStart(2, '0')}`).toLowerCase();
      const cleanSceneId = sceneId.replace(/[^a-z0-9]/g, '');
      const cleanFilename = filename.replace(/[^a-z0-9]/g, '');

      if (cleanFilename.includes(cleanSceneId)) {
        foundShot = shot;
        matchReason = `ตรงกับรหัสฉาก ${shot.sceneId || 'SC-' + shot.shotNumber}`;
        break;
      }
    }

    // 2. Try matching by shot number e.g. shot1, shot-1, shot_01, scene1, scene-1
    if (!foundShot) {
      for (const shot of shots) {
        if (assignedShotNumbers.has(shot.shotNumber)) continue;
        const shotPatterns = [
          `shot${shot.shotNumber}`,
          `shot-${shot.shotNumber}`,
          `shot_${shot.shotNumber}`,
          `scene${shot.shotNumber}`,
          `scene-${shot.shotNumber}`,
          `scene_${shot.shotNumber}`,
          `s${shot.shotNumber}_`,
          `_${shot.shotNumber}.`,
          `-${shot.shotNumber}.`,
        ];
        if (shotPatterns.some((p) => filename.includes(p))) {
          foundShot = shot;
          matchReason = `ตรงกับเลขช็อต #${shot.shotNumber}`;
          break;
        }
      }
    }

    if (foundShot) {
      assignedShotNumbers.add(foundShot.shotNumber);
      matched.push({
        shotNumber: foundShot.shotNumber,
        sceneId: foundShot.sceneId || `SC-${String(foundShot.shotNumber).padStart(2, '0')}`,
        dataUrl: item.dataUrl,
        file: item.file,
        reason: matchReason,
      });
    } else {
      unmatched.push({
        file: item.file,
        reason: 'ไม่พบรหัสฉากหรือเลขช็อตที่ระบุในชื่อไฟล์',
      });
    }
  }

  // 3. Fallback: match remaining unmatched files to incomplete shots sequentially
  const incompleteShots = shots.filter(
    (s) => !assignedShotNumbers.has(s.shotNumber) && !s.generatedImage
  );
  const stillUnmatched: { file: File; reason: string }[] = [];

  for (let i = 0; i < unmatched.length; i++) {
    const un = unmatched[i];
    if (i < incompleteShots.length) {
      const shot = incompleteShots[i];
      assignedShotNumbers.add(shot.shotNumber);
      const fileData = files.find((f) => f.file === un.file);
      if (fileData) {
        matched.push({
          shotNumber: shot.shotNumber,
          sceneId: shot.sceneId || `SC-${String(shot.shotNumber).padStart(2, '0')}`,
          dataUrl: fileData.dataUrl,
          file: un.file,
          reason: `จับคู่ตามลำดับฉากที่ยังไม่มีภาพ (${shot.sceneId || '#' + shot.shotNumber})`,
        });
      }
    } else {
      stillUnmatched.push(un);
    }
  }

  return { matched, unmatched: stillUnmatched };
}
