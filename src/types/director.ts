export interface CharacterProfile {
  id: string;
  name: string;
  role: string;
  ageAndGender: string;
  visualIdentity: {
    faceAndHair: string;
    clothing: string;
    accessoriesAndTraits: string;
    expressionBaseline: string;
  };
  consistencyLockPrompt: string; // The locked English prompt segment to copy into all shots
  negativePrompt: string;
  // AIVC V3.1: Character Consistency Lock & Reference Metadata
  isLocked?: boolean; // Default true - marks canonical lock status
  canonicalDescription?: string; // Canonical summary description
  canonicalClothing?: string; // Canonical clothing & accessories
  referenceImageUrl?: string; // Reference image preview / data URL / URL
  referenceImageNotes?: string; // Reference guide (e.g. front view, lighting anchor)
}

export interface VideoMetadata {
  fileName?: string;
  fileSize?: number;
  attachedAt?: string;
  provider?: string;
  duration?: number;
  notes?: string;
}

export interface ImageMetadata {
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  attachedAt?: string;
  provider?: string;
  dimensions?: { width: number; height: number };
  notes?: string;
}

export interface EnvironmentAnchor {
  locationName: string;
  visualStyle: string;
  lightingSetup: string;
  consistencyPromptLock: string;
}

export type SceneGenerationStatus =
  | 'PLANNED'
  | 'PROMPT_READY'
  | 'IMAGE_READY'
  | 'VIDEO_READY'
  | 'COMPLETED'
  | 'FAILED';

export type ImageProviderId = 'hf-flux' | 'pollinations' | 'google-gemini' | 'custom-api';
export type VideoProviderId = 'hf-sulphur' | 'google-veo' | 'external-api' | 'google-flow';

export interface ProviderStatusInfo {
  id: string;
  name: string;
  category: 'image' | 'video';
  isConfigured: boolean;
  isAvailable: boolean;
  tier: 'Free Tier' | 'Paid Tier Required' | 'API Key Required';
  statusMessage: string;
  setupInstructions?: string;
}

export interface DirectImageGenRequest {
  sceneId: string;
  shotNumber: number;
  prompt: string;
  aspectRatio: '9:16' | '16:9' | '1:1' | '4:3' | '3:4';
  provider?: ImageProviderId;
  negativePrompt?: string;
  assignedCharacters?: {
    id: string;
    name: string;
    role: string;
    canonicalDescription?: string;
    clothing?: string;
    referenceImage?: string;
  }[];
}

export interface DirectImageGenResponse {
  success: boolean;
  imageUrl?: string;
  provider: string;
  model: string;
  error?: string;
  requirementsNotice?: string;
  setupInstructions?: string;
}

export interface DirectVideoGenRequest {
  sceneId: string;
  shotNumber: number;
  prompt: string;
  imageUrl?: string; // For Image-to-Video
  durationSec?: number;
  provider?: VideoProviderId;
}

export interface DirectVideoGenResponse {
  success: boolean;
  videoUrl?: string;
  provider: string;
  model: string;
  status: 'COMPLETED' | 'PENDING' | 'REQUIRES_CONFIGURATION' | 'FAILED';
  taskId?: string;
  error?: string;
  requirementsNotice?: string;
  setupInstructions?: string;
}

export interface MediaToolsConfig {
  imageGeneratorUrl: string;
  imageGeneratorName: string;
  videoGeneratorUrl: string;
  videoGeneratorName: string;
  preferredImageProvider?: ImageProviderId;
  preferredVideoProvider?: VideoProviderId;
}

export interface ShotDetail {
  sceneId?: string; // e.g. "SC-01"
  shotNumber: number;
  sceneNumber: number;
  timeRange: string; // e.g. "00:00 - 00:05"
  durationSec: number;
  shotType: 'Extreme Wide Shot' | 'Wide Shot' | 'Medium Shot' | 'Close-Up' | 'Extreme Close-Up' | 'Over-the-Shoulder' | 'Point of View (POV)';
  cameraMovement: 'Static' | 'Pan Left/Right' | 'Tilt Up/Down' | 'Slow Zoom In' | 'Slow Zoom Out' | 'Dolly / Push In' | 'Orbit 360' | 'Tracking Shot' | 'Drone Aerial';
  compositionAndLighting: string;
  actionDescription: string;
  
  // AIVC V2: Media Generation Tracking
  generationStatus?: SceneGenerationStatus;
  referenceImage?: string; // Reference image URL or description
  generatedImage?: string; // Uploaded or linked generated image URL/data
  generatedVideo?: string; // Uploaded or linked generated video URL/data
  mediaNotes?: string;

  // AIVC V3.1: Character Assignment, Consistency & Workflow Tracking
  characterIds?: string[]; // IDs of assigned characters from blueprint.characters (zero, one, or multiple)
  promptConsistencyStatus?: 'CONSISTENT' | 'CONFLICT_DETECTED' | 'UNCHECKED';
  conflictWarnings?: string[]; // List of warnings if prompt conflicts with locked character profiles
  injectedCharacterSummary?: string[]; // Breakdown of character traits injected into generated prompt
  isCustomPromptEdited?: boolean; // Flag to preserve manual edits from accidental regeneration
  videoMetadata?: VideoMetadata; // Attached video metadata (e.g. from Google Flow or local upload)
  imageMetadata?: ImageMetadata; // Attached image metadata (file name, file size, attached date)
  flowWorkflowStatus?: 'QUEUED' | 'OPENED_IN_FLOW' | 'IMAGE_ATTACHED' | 'DONE'; // AIVC V3.3 Google Flow workflow tracker
  selectedVideoWorkflowProvider?: string; // Provider choice per shot, e.g. 'google-flow'

  // Requirement 5: Prompt สร้างภาพ
  imagePrompt: {
    positivePromptEn: string;
    styleTags: string;
    aspectRatio: '9:16' | '16:9' | '1:1';
    lightingAndLens: string;
    negativePrompt: string;
    thaiExplanation: string;
  };

  // Requirement 6: Prompt สร้างการเคลื่อนไหว
  motionPrompt: {
    videoPromptEn: string;
    cameraMotionDirective: string;
    motionIntensity: 'Low (1-3)' | 'Medium (4-6)' | 'High (7-10)';
    recommendedTools: string[]; // e.g. ["Kling 1.5", "Runway Gen-3", "Haiper 2.0", "Luma Dream Machine"]
    thaiExplanation: string;
  };

  // Requirement 7: บทพูดภาษาไทย & เสียงประกอบ
  audioDesign: {
    thaiVoiceover: string;
    voiceToneAndPacing: string;
    sfx: string;
    bgmCue: string;
  };

  // Requirement 8: แผนตัดต่อ & Transitions
  editingDirection: {
    cutType: 'Hard Cut' | 'Cross Dissolve' | 'Zoom Blur' | 'Whip Pan' | 'Match Cut' | 'Fade to Black';
    thaiSubtitleOverlay: string;
    visualEffectOrSticker: string;
    pacingNote: string;
  };

  // Continuity notes
  continuityTag: string;
}

export interface VideoAnalysis {
  genre: string;
  targetAudience: string;
  objective: string;
  coreMessage: string;
  toneAndMood: string;
  estimatedTotalDurationSec: number;
  aspectRatio: '9:16' | '16:9' | '1:1';
  platformRecommendation: string;
  hookStrategy: string;
}

export interface FullScriptItem {
  section: 'Hook (0-5s)' | 'Intro & Problem' | 'Core Content 1' | 'Core Content 2' | 'Climax / Revelation' | 'Call to Action & Outro';
  timestamp: string;
  thaiScript: string;
  visualIntent: string;
  emotionalBeat: string;
}

export interface ContinuityAudit {
  characterConsistencyStatus: 'สมบูรณ์' | 'มีข้อควรระวัง' | 'ต้องแก้ไข';
  characterAuditNotes: string[];
  wardrobeAndPropsCheck: string[];
  lightingContinuityCheck: string[];
  factCheckVerification: {
    isFactualOrEducational: boolean;
    verificationNotes: string[];
    potentialHallucinationAlerts: string[];
    sourcesOrCheckpoints: string[];
  };
  editingPacingCheck: string[];
  directorActionItems: string[];
}

export interface ProductionBlueprint {
  id: string;
  systemVersion?: string; // e.g. "AIVC-CORE-V2.0"
  createdAt: string;
  projectTitle: string;
  originalIdea: string;
  
  // Media Tools Configuration (AIVC V2)
  mediaToolsConfig?: MediaToolsConfig;

  // 1. วิเคราะห์
  analysis: VideoAnalysis;
  
  // 2. บทฉบับเต็ม
  scriptFlow: FullScriptItem[];
  
  // 3 & 5 & 6 & 7 & 8. ช็อตและ Prompt
  shots: ShotDetail[];
  
  // 4. ตัวละครและสถานที่
  characters: CharacterProfile[];
  environments: EnvironmentAnchor[];
  
  // 8. แผนตัดต่อภาพรวม
  assemblyMasterPlan: {
    timelineSummary: string;
    bgmTrackRecommendation: string;
    colorGradingLut: string;
    capcutAssemblySteps: string[];
    freeExportWorkflow: string[];
  };
  
  // 9. ตรวจสอบความต่อเนื่อง
  audit: ContinuityAudit;
  
  // ข้อกำหนด: สถานะการผลิต (ห้ามอ้างว่าวิดีโอเสร็จแล้วถ้ายังไม่ได้เรนเดอร์)
  productionStatusNotice: string;
}

export interface GenerateRequest {
  idea: string;
  durationSec?: number;
  aspectRatio?: '9:16' | '16:9' | '1:1';
  genre?: string;
  targetAudience?: string;
  visualStyle?: string;
  specialRequirements?: string;
}
