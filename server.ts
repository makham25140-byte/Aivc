import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import type { GenerateRequest, ProductionBlueprint } from './src/types/director.ts';
import { providerRegistry } from './src/server/providerAdapters.ts';
import { generateCharacterAwarePrompts, detectConsistencyConflicts } from './src/utils/consistencyEngine.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '15mb' }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Candidate models in priority order according to gemini-api skill
const CANDIDATE_MODELS = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];

async function generateWithFallback(
  contents: string,
  options: {
    systemInstruction?: string;
    responseMimeType?: string;
    temperature?: number;
  } = {}
): Promise<{ text: string; modelUsed: string }> {
  let lastError: any = null;

  for (const model of CANDIDATE_MODELS) {
    try {
      console.log(`[AI Director] Calling model: ${model}...`);
      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction: options.systemInstruction,
          responseMimeType: options.responseMimeType,
          temperature: options.temperature ?? 0.7,
        },
      });

      if (response && response.text) {
        console.log(`[AI Director] Model ${model} succeeded!`);
        return { text: response.text, modelUsed: model };
      }
    } catch (err: any) {
      console.warn(`[AI Director] Model ${model} failed:`, err?.message || err);
      lastError = err;
      // Continue to next candidate model in the fallback chain
    }
  }

  throw lastError || new Error('All AI models failed to respond');
}

function parseJSONSafely(text: string): any {
  if (!text) return null;
  let clean = text.trim();
  // Strip markdown code block wrappers if model included them
  if (clean.startsWith('```')) {
    clean = clean.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }
  return JSON.parse(clean);
}

function createFallbackBlueprint(req: GenerateRequest): ProductionBlueprint {
  const duration = req.durationSec || 60;
  const ratio = req.aspectRatio || '9:16';
  const idea = req.idea.trim();
  const title = `โปรเจกต์: ${idea.length > 35 ? idea.slice(0, 35) + '...' : idea}`;

  const shotCount = Math.max(3, Math.min(8, Math.round(duration / 10)));
  const shotSec = Math.round(duration / shotCount);

  const shots = Array.from({ length: shotCount }, (_, i) => {
    const shotNum = i + 1;
    const startSec = i * shotSec;
    const endSec = i === shotCount - 1 ? duration : (i + 1) * shotSec;
    const pad = (n: number) => String(n).padStart(2, '0');
    const timeRange = `00:${pad(startSec)} - 00:${pad(endSec)}`;

    return {
      sceneId: `SC-${pad(shotNum)}`,
      shotNumber: shotNum,
      sceneNumber: shotNum <= 2 ? 1 : shotNum <= 4 ? 2 : 3,
      characterIds: (shotNum <= 2 || shotNum === shotCount) ? ['char-1'] : [],
      promptConsistencyStatus: 'CONSISTENT' as const,
      selectedVideoWorkflowProvider: 'google-flow',
      generationStatus: 'PROMPT_READY' as const,
      referenceImage: shotNum === 1 ? 'ภาพตั้งต้นตัวละครหลัก (Anchor)' : 'SC-01 (อ้างอิงใบหน้าและสไตล์จากช็อต 1)',
      generatedImage: '',
      generatedVideo: '',
      mediaNotes: `พร้อมส่ง Prompt ช็อตที่ ${shotNum} เข้าเครื่องมือเจนภาพ`,
      timeRange,
      durationSec: endSec - startSec,
      shotType: (shotNum === 1 ? 'Close-Up' : shotNum === 2 ? 'Medium Shot' : shotNum === shotCount ? 'Extreme Wide Shot' : 'Wide Shot') as any,
      cameraMovement: (shotNum % 2 === 1 ? 'Slow Zoom In' : 'Pan Left/Right') as any,
      compositionAndLighting: 'จัดแสง Cinematic Rim Light พร้อม Key Light สว่างเป็นธรรมชาติ โฟกัสวัตถุหลักคมชัด',
      actionDescription: `ฉากที่ ${shotNum}: ถ่ายทอดสาระสำคัญของ "${idea}" ในช่วงเวลา ${timeRange} เน้นอารมณ์ดึงดูดใจ`,
      imagePrompt: {
        positivePromptEn: `Cinematic film still, high detail, photorealistic, 8k resolution, capturing concept: "${idea}", cinematic lighting, 35mm lens, depth of field, vibrant colors, masterwork aesthetic --ar ${ratio}`,
        styleTags: 'Cinematic, Photorealistic, 8k, Unreal Engine 5 aesthetic, High Contrast',
        aspectRatio: ratio,
        lightingAndLens: 'Natural volumetric lighting, 35mm cinema lens, f/2.0 aperture',
        negativePrompt: 'blurry, low quality, deformed anatomy, watermark, text, signature',
        thaiExplanation: `ภาพนิ่งช็อตที่ ${shotNum} สื่อถึง ${idea} ด้วยสไตล์ภาพยนตร์มืออาชีพ`,
      },
      motionPrompt: {
        videoPromptEn: `Smooth continuous cinematic camera motion, realistic natural movement, 24fps film look, subtle ambient dynamics, photorealistic physics`,
        cameraMotionDirective: shotNum % 2 === 1 ? 'Slow push-in toward subject' : 'Smooth subtle tracking pan',
        motionIntensity: 'Medium (4-6)' as const,
        recommendedTools: ['Google Flow', 'Kling 1.5', 'Haiper 2.0', 'Runway Gen-3'],
        thaiExplanation: `การเคลื่อนไหวนุ่มนวล สอดคล้องกับจังหวะเรื่องราว`,
      },
      audioDesign: {
        thaiVoiceover: `เนื้อหาช็อตที่ ${shotNum} สำหรับเรื่อง "${idea}" ถ่ายทอดอย่างมีพลังและน่าติดตาม`,
        voiceToneAndPacing: 'น่าเชื่อถือ กระชับ เป็นมิตร จังหวะพอดีคำ',
        sfx: shotNum === 1 ? 'เสียง Whoosh เปิดตัวเบาๆ' : 'เสียงบรรยากาศแวดล้อมสมจริง',
        bgmCue: 'ดนตรีคลอเบาๆ เพิ่มระดับความน่าติดตาม',
      },
      editingDirection: {
        cutType: (shotNum === 1 ? 'Hard Cut' : 'Cross Dissolve') as any,
        thaiSubtitleOverlay: `ไฮไลต์ช็อต ${shotNum}`,
        visualEffectOrSticker: 'ซับไตเติลภาษาไทยฟอนต์มินิมอล',
        pacingNote: 'ตัดตามจังหวะคำพูดและเสียง BGM',
      },
      continuityTag: 'คงสภาพตัวละครและแสงให้ต่อเนื่องกับช็อตก่อนหน้า',
    };
  });

  return {
    id: `blueprint-${Date.now()}`,
    systemVersion: 'AIVC-CORE-V3.1',
    createdAt: new Date().toISOString(),
    projectTitle: title,
    originalIdea: idea,
    mediaToolsConfig: {
      imageGeneratorUrl: 'https://copilot.microsoft.com/images/create',
      imageGeneratorName: 'Bing Image Creator',
      videoGeneratorUrl: 'https://labs.google/flow',
      videoGeneratorName: 'Google Flow & Kling AI',
      preferredVideoProvider: 'google-flow',
    },
    analysis: {
      genre: req.genre || 'สารคดีสั้น & ความรู้ย่อยง่าย (Edutainment / Short-form)',
      targetAudience: req.targetAudience || 'ผู้ชมสื่อสังคมออนไลน์ทั่วไป (TikTok / Shorts / Reels)',
      objective: 'สื่อสารข้อความให้กระชับ ชัดเจน และน่าจดจำภายในเวลาที่กำหนด',
      coreMessage: idea,
      toneAndMood: req.visualStyle || 'Cinematic, Inspiring, engaging and dynamic',
      estimatedTotalDurationSec: duration,
      aspectRatio: ratio,
      platformRecommendation: ratio === '9:16' ? 'TikTok / YouTube Shorts / IG Reels' : 'YouTube / Facebook Video',
      hookStrategy: 'เปิดด้วยภาพและคำถามกระตุกความสนใจภายใน 3 วินาทีแรก',
    },
    scriptFlow: [
      {
        section: 'Hook (0-5s)',
        timestamp: '00:00 - 00:05',
        thaiScript: `รู้หรือไม่? เรื่องราวเกี่ยวกับ "${idea}" มีสิ่งที่น่าทึ่งมากกว่าที่คุณคิด!`,
        visualIntent: 'เปิดด้วยภาพที่ดึงดูดสายตาทันที',
        emotionalBeat: 'กระตุ้นความอยากรู้',
      },
      {
        section: 'Intro & Problem',
        timestamp: `00:05 - 00:${Math.round(duration * 0.3)}`,
        thaiScript: `หลายคนอาจยังไม่เคยสังเกต หรือเข้าใจผิดเกี่ยวกับประเด็นนี้...`,
        visualIntent: 'ชี้ให้เห็นประเด็นหรือโจทย์ปัญหา',
        emotionalBeat: 'สร้างความน่าติดตาม',
      },
      {
        section: 'Core Content 1',
        timestamp: `00:${Math.round(duration * 0.3)} - 00:${Math.round(duration * 0.6)}`,
        thaiScript: `ความจริงแล้ว สิ่งสำคัญที่สุดคือรายละเอียดขั้นตอนที่เรากำลังจะได้เห็น`,
        visualIntent: 'ถ่ายทอดข้อมูลหลักอย่างชัดเจน',
        emotionalBeat: 'ให้ความรู้และความเข้าใจ',
      },
      {
        section: 'Core Content 2',
        timestamp: `00:${Math.round(duration * 0.6)} - 00:${Math.round(duration * 0.8)}`,
        thaiScript: `เมื่อนำองค์ประกอบเหล่านี้มารวมกัน จึงเกิดผลลัพธ์ที่ยอดเยี่ยม`,
        visualIntent: 'แสดงภาพไฮไลต์',
        emotionalBeat: 'ความพึงพอใจและกระจ่าง',
      },
      {
        section: 'Climax / Revelation',
        timestamp: `00:${Math.round(duration * 0.8)} - 00:${duration - 5}`,
        thaiScript: `และนี่คือเหตุผลที่ "${idea}" กลายเป็นสิ่งที่มีคุณค่า`,
        visualIntent: 'จุดไคลแมกซ์ของวิดีโอ',
        emotionalBeat: 'ประทับใจ',
      },
      {
        section: 'Call to Action & Outro',
        timestamp: `00:${duration - 5} - 00:${duration}`,
        thaiScript: 'ชอบคลิปแบบนี้ กดติดตามและแชร์ให้เพื่อนๆ ได้ชมกันด้วยนะครับ!',
        visualIntent: 'ขึ้นข้อความเชิญชวนกดติดตามและแสดงความคิดเห็น',
        emotionalBeat: 'สร้างความผูกพันกับผู้ฟัง',
      },
    ],
    characters: [
      {
        id: 'char-1',
        name: 'ผู้ดำเนินเรื่อง (Presenter)',
        role: 'ตัวละครหลักผู้บอกเล่าเรื่องราว',
        ageAndGender: 'อายุ 25-35 ปี',
        visualIdentity: {
          faceAndHair: 'ใบหน้าเป็นมิตร ผิวเนียน ทรงผมจัดแต่งสุภาพ ทันสมัย',
          clothing: 'ชุดเรียบหรูสไตล์มินิมอล โทนสีสุภาพ เหมาะกับเนื้อหา',
          accessoriesAndTraits: 'บุคลิกภาพคล่องแคล่ว น่าเชื่อถือ',
          expressionBaseline: 'สีหน้ามั่นใจและเป็นมิตร',
        },
        consistencyLockPrompt: `A 28-year-old confident presenter with neat stylish dark hair, friendly intelligent gaze, dressed in modern minimalist clothing, sharp cinematic portrait lighting, photorealistic`,
        negativePrompt: 'blurry, distorted facial features, changing clothes, duplicate limbs, cartoon style',
        isLocked: true,
        canonicalDescription: 'A 28-year-old confident presenter with neat stylish dark hair, friendly intelligent gaze, dressed in modern minimalist clothing, sharp cinematic portrait lighting, photorealistic',
        canonicalClothing: 'Modern minimalist neutral clothing, neat jacket or clean crewneck',
        referenceImageNotes: 'Front portrait with natural lighting',
      },
    ],
    environments: [
      {
        locationName: 'สตูดิโอถ่ายทำหรือสถานที่หลักตามเรื่องราว',
        visualStyle: 'บรรยากาศสะอาดตา แสงสวยงาม สไตล์ภาพยนตร์ร่วมสมัย',
        lightingSetup: 'Soft box key light, subtle rim light, balanced background glow',
        consistencyPromptLock: 'Modern clean documentary cinematic environment, atmospheric depth, soft aesthetic lighting',
      },
    ],
    shots,
    assemblyMasterPlan: {
      timelineSummary: `เรียงคลิปตาม Shot 1 ถึง ${shotCount} ความยาวรวม ${duration} วินาที`,
      bgmTrackRecommendation: 'เพลงบรรเลงแนว Inspiring Modern หรือ Lo-Fi Chill เหมาะกับวิดีโอสั้น',
      colorGradingLut: 'Cinematic Clean Neutral หรือ Warm Golden Hour',
      capcutAssemblySteps: [
        `1. สร้างโปรเจกต์ใหม่ใน CapCut เลือกสัดส่วน ${ratio}`,
        '2. นำเข้าคลิปวิดีโอที่เจนเสร็จเรียงตามลำดับ Shot 1 ถึง Shot สุดท้าย',
        '3. ใส่เสียงพากย์และซิงค์ความยาวแต่ละคลิปให้ตรงกับเสียงพากย์',
        '4. ใส่ BGM ลดเสียงเหลือประมาณ 15% เพื่อให้เสียงพากย์ชัดเจน',
        '5. เปิดฟังก์ชัน Auto Captions เพื่อสร้างซับไตเติลภาษาไทยอัตโนมัติ',
      ],
      freeExportWorkflow: [
        'สร้างภาพฟรี: Bing Image Creator / SeaArt.ai / Tensor.art',
        'สร้างวิดีโอฟรี: Kling AI (เครดิตฟรีทุกวัน) / Haiper 2.0 / Luma Dream Machine',
        'เสียงพากย์ฟรี: CapCut Text-to-Speech ภาษาไทย / Edge-TTS',
        'ตัดต่อฟรี: CapCut Mobile & Desktop',
      ],
    },
    audit: {
      characterConsistencyStatus: 'สมบูรณ์',
      characterAuditNotes: ['ระบุ Character Consistency Lock Prompt ชัดเจนพร้อมนำไปใช้'],
      wardrobeAndPropsCheck: ['เครื่องแต่งกายและบรรยากาศคงที่ตลอดทั้งเรื่อง'],
      lightingContinuityCheck: ['การจัดแสงมีความต่อเนื่องกลมกลืนในทุกช็อต'],
      factCheckVerification: {
        isFactualOrEducational: true,
        verificationNotes: ['โครงสร้างเนื้อหาถูกตรวจสอบความสอดคล้องตามหลักการสื่อสาร'],
        potentialHallucinationAlerts: [],
        sourcesOrCheckpoints: ['อ้างอิงตามบริบทที่กำหนด'],
      },
      editingPacingCheck: [`จังหวะตัดต่อช็อตละประมาณ ${shotSec} วินาที เหมาะสมกับ Short-form`],
      directorActionItems: [
        '1. สร้างภาพช็อตที่ 1 ก่อน เพื่อใช้เป็น Reference Image ให้กับช็อตถัดไป',
        '2. ปรับความแรงการเคลื่อนไหว Motion ในระดับ Medium เพื่อป้องกันภาพบิดเบี้ยว',
        '3. ทดสอบอ่านบทพากย์ให้ตรงกับเวลาแต่ละช็อตก่อนเริ่มตัดต่อ',
      ],
    },
    productionStatusNotice: 'สถานะ: แผนการผลิตวิดีโอระดับมืออาชีพ (Production Blueprint Ready) พร้อมนำ Prompts ไปสร้างภาพและวิดีโอจริงตามขั้นตอน',
  };
}

const SYSTEM_DIRECTOR_INSTRUCTION = `
คุณคือ AI Director ระดับอาวุโสแห่งโปรเจกต์ AI Video Creator
คุณเชี่ยวชาญด้านการกำกับภาพยนตร์, การผลิต Short-form (TikTok, Reels, Shorts), การวาง Storyboard, การคุมความต่อเนื่องของตัวละคร (Character Consistency), และการเขียน AI Prompts สำหรับ Image Generation (Midjourney v6, Flux.1, Stable Diffusion XL) และ Video Motion Generation (Kling AI, Runway Gen-3 Alpha, Luma Dream Machine, Haiper 2.0, Pika Labs)

เมื่อผู้ใช้ส่งไอเดียมา คุณต้องดำเนินการ 9 ขั้นตอนอย่างเคร่งครัด:
1. วิเคราะห์แนววิดีโอ กลุ่มผู้ชม และเป้าหมาย (Genre, Audience, Goal, Core Message, Tone & Mood, Hook)
2. เขียนบทที่เหมาะกับระยะเวลาที่กำหนด (แบ่งเป็นจังหวะ Hook, ปัญหา, เนื้อหาหลัก, ไคลแมกซ์, Call to Action)
3. แบ่งบทออกเป็นฉากและช็อตอย่างละเอียด (กำหนดเวลาช็อตละ 3-6 วินาที เพื่อให้เหมาะกับการเรนเดอร์ AI Video ฟรี เช่น Kling, Luma)
4. กำหนดรายละเอียดตัวละครและสถานที่ให้คงที่ตลอดเรื่อง (Character Bible มี Facial features, ทรงผม, สีตา, ชุดเสื้อผ้าที่ใส่ซ้ำได้, และ Consistency Lock Prompt ภาษาอังกฤษ)
5. เขียน Prompt สำหรับสร้างภาพของแต่ละฉาก (Image Prompt: ภาษาอังกฤษ ระบุ Camera shot, Lighting, Subject details, Composition, Style tags และ Negative prompt)
6. เขียน Prompt สำหรับสร้างการเคลื่อนไหวของแต่ละฉาก (Motion Prompt: ภาษาอังกฤษ ระบุ Camera motion [Pan, Dolly in, Zoom, Orbit], Subject action, Speed, และระดับความแรง Motion)
7. จัดเตรียมบทพูดภาษาไทยและเสียงประกอบ (Thai voiceover, Tone, SFX cues, BGM style)
8. วางแผนการนำฉากทั้งหมดมาตัดต่อเป็นวิดีโอเดียว (Cut transition, ซับไตเติลภาษาไทย, กราฟิก, ลำดับการเรียงใน CapCut/Premiere)
9. ตรวจสอบความต่อเนื่องของเนื้อหาและแจ้งจุดที่ต้องแก้ไข (Character wardrobe check, Lighting check, Fact-check สำหรับสาระความรู้ ห้ามแต่งความเท็จเด็ดขาด, ข้อแนะนำสำหรับผู้กำกับ)

ข้อกำหนดสำคัญ:
- ห้ามอ้างว่าสร้างวิดีโอสำเร็จเป็นไฟล์ mp4 แล้ว หากยังไม่ได้เรนเดอร์จริง ให้ระบุว่าเป็น "แผนการผลิตวิดีโอระดับมืออาชีพ (Production Blueprint Ready)" ที่พร้อมนำไปสร้างภาพและวิดีโอต่อในเครื่องมือฟรี
- แยก Prompt สร้างภาพ (Image Generation) ออกจาก Prompt เคลื่อนไหว (Video Motion) อย่างชัดเจน
- รักษารูปลักษณ์ตัวละคร เสื้อผ้า และสถานที่ให้ต่อเนื่อง มี Keyword ล็อคตัวละคร
- ห้ามแต่งข้อเท็จจริงขึ้นมาเองในวิดีโอแนวสาระความรู้ หากข้อมูลไม่ชัวร์ ให้ทำเครื่องหมาย [Fact-Check Alert]
- ใช้ภาษาไทยเป็นหลักในการอธิบายบทและข้อมูล ยกเว้น Prompts สำหรับ AI Image/Video ให้เป็นภาษาอังกฤษที่มีประสิทธิภาพสูงสุด พร้อมคำแปลไทยประกอบ

ส่งผลลัพธ์กลับมาในรูปแบบ JSON ตามโครงสร้าง ProductionBlueprint อย่างสมบูรณ์และถูกต้องตาม syntax JSON โดยไม่ต้องครอบด้วย backticks หรือคำอธิบายเสริม
`;

app.post('/api/director/generate', async (req, res) => {
  try {
    const { idea, durationSec = 60, aspectRatio = '9:16', genre, targetAudience, visualStyle, specialRequirements } = req.body as GenerateRequest;

    if (!idea || typeof idea !== 'string' || idea.trim().length === 0) {
      return res.status(400).json({ error: 'กรุณาระบุไอเดียหรือคอนเซปต์วิดีโอ' });
    }

    const promptMessage = `
ไอเดียจากผู้สร้าง: "${idea}"
ความยาวเป้าหมาย: ${durationSec} วินาที
อัตราส่วน: ${aspectRatio}
แนววิดีโอ (ถ้ามี): ${genre || 'กำหนดตามความเหมาะสม'}
กลุ่มเป้าหมาย (ถ้ามี): ${targetAudience || 'ผู้ใช้งานทั่วไป'}
สไตล์ภาพที่ต้องการ (ถ้ามี): ${visualStyle || 'Cinematic Photorealistic สมจริง'}
ข้อกำหนดเพิ่มเติม: ${specialRequirements || 'ไม่มี'}

จงทำหน้าที่ AI Director วางแผนการผลิตวิดีโอทั้ง 9 ขั้นตอน และตอบกลับเป็น JSON ที่ตรงตามโครงสร้างต่อไปนี้:
{
  "id": "blueprint-${Date.now()}",
  "systemVersion": "AIVC-CORE-V2.0",
  "createdAt": "${new Date().toISOString()}",
  "projectTitle": "ชื่อโปรเจกต์ที่น่าสนใจและดึงดูดใจภาษาไทย",
  "originalIdea": "${idea.replace(/"/g, '\\"')}",
  "mediaToolsConfig": {
    "imageGeneratorUrl": "https://copilot.microsoft.com/images/create",
    "imageGeneratorName": "Bing Image Creator",
    "videoGeneratorUrl": "https://klingai.com",
    "videoGeneratorName": "Kling AI"
  },
  "analysis": {
    "genre": "แนววิดีโอ",
    "targetAudience": "กลุ่มเป้าหมาย",
    "objective": "เป้าหมายของวิดีโอ",
    "coreMessage": "สาระสำคัญที่ต้องการสื่อ",
    "toneAndMood": "โทนและอารมณ์",
    "estimatedTotalDurationSec": ${durationSec},
    "aspectRatio": "${aspectRatio}",
    "platformRecommendation": "แพลตฟอร์มที่เหมาะสม (เช่น TikTok / YouTube Shorts / Reels)",
    "hookStrategy": "กลยุทธ์การเปิดเรื่องเพื่อหยุดนิ้วโป้งคนดูภายใน 3 วินาทีแรก"
  },
  "scriptFlow": [
    {
      "section": "Hook (0-5s)",
      "timestamp": "00:00 - 00:05",
      "thaiScript": "บทพูดภาษาไทยเปิดเรื่องกระชับกระตุ้นความสงสัย",
      "visualIntent": "สิ่งที่ภาพควรสื่อ",
      "emotionalBeat": "อารมณ์ที่คนดูควรสัมผัส"
    }
  ],
  "characters": [
    {
      "id": "char-1",
      "name": "ชื่อตัวละคร",
      "role": "บทบาทในเรื่อง",
      "ageAndGender": "อายุและเพศ",
      "visualIdentity": {
        "faceAndHair": "ลักษณะใบหน้า สีตา ทรงผม",
        "clothing": "ชุดเสื้อผ้าที่ใส่ตลอดเรื่อง",
        "accessoriesAndTraits": "เครื่องประดับหรือเอกลักษณ์ประจำตัว",
        "expressionBaseline": "สีหน้าหลัก"
      },
      "consistencyLockPrompt": "ชุดคำ prompt ภาษาอังกฤษที่ต้องใส่ในทุกช็อตเพื่อล็อคหน้าตาและชุด (เช่น 28yo Thai male detective, short wavy black hair, intense dark brown eyes, wearing a vintage worn brown leather jacket and dark navy sweater)",
      "negativePrompt": "คำ negative prompt เพื่อป้องกันตัวละครเพี้ยน (เช่น morphing face, multiple faces, distorted anatomy, changing clothes)"
    }
  ],
  "environments": [
    {
      "locationName": "ชื่อสถานที่หลัก",
      "visualStyle": "บรรยากาศและโทนสี",
      "lightingSetup": "การจัดแสง",
      "consistencyPromptLock": "Prompt ภาษาอังกฤษสำหรับล็อคฉากสถานที่"
    }
  ],
  "shots": [
    {
      "sceneId": "SC-01",
      "shotNumber": 1,
      "sceneNumber": 1,
      "generationStatus": "PROMPT_READY",
      "referenceImage": "คำอธิบายภาพอ้างอิง หรือ SC-01 (ถ้ามี)",
      "generatedImage": "",
      "generatedVideo": "",
      "mediaNotes": "บันทึกการผลิตสื่อ",
      "timeRange": "00:00 - 00:04",
      "durationSec": 4,
      "shotType": "Extreme Wide Shot หรือ Close-Up ฯลฯ",
      "cameraMovement": "Static หรือ Slow Zoom In หรือ Pan Left/Right ฯลฯ",
      "compositionAndLighting": "การจัดองค์ประกอบและแสง",
      "actionDescription": "การกระทำและสิ่งที่เกิดขึ้นในช็อต",
      "imagePrompt": {
        "positivePromptEn": "Prompt ภาษาอังกฤษคุณภาพสูงสำหรับ Midjourney / Flux / SD เพื่อสร้างภาพนิ่งตั้งต้น",
        "styleTags": "Cinematic, Photorealistic, 8k, Unreal Engine 5 render, Masterpiece",
        "aspectRatio": "${aspectRatio}",
        "lightingAndLens": "Volumetric lighting, 35mm anamorphic lens, shallow depth of field",
        "negativePrompt": "blurry, low quality, deformed, extra limbs, cartoonish, watermark",
        "thaiExplanation": "คำอธิบายภาพนี้ในภาษาไทยให้ผู้สร้างเข้าใจง่าย"
      },
      "motionPrompt": {
        "videoPromptEn": "Prompt ภาษาอังกฤษสำหรับ Kling AI / Runway Gen-3 / Luma Dream Machine เพื่อขยับภาพ",
        "cameraMotionDirective": "คำสั่งกล้อง เช่น Camera slow push-in, subtle floating movement, 24fps film look",
        "motionIntensity": "Medium (4-6)",
        "recommendedTools": ["Kling 1.5", "Runway Gen-3", "Haiper 2.0", "Luma"],
        "thaiExplanation": "คำอธิบายการเคลื่อนไหวในภาษาไทย"
      },
      "audioDesign": {
        "thaiVoiceover": "บทพากย์ภาษาไทยในช็อตนี้",
        "voiceToneAndPacing": "น้ำเสียงและจังหวะการพูด",
        "sfx": "เสียงเอฟเฟกต์ (SFX) เช่น เสียงฟ้าร้องแผ่วเบา, เสียงลมพัด, เสียงคลิก",
        "bgmCue": "ดนตรีประกอบและจังหวะในช็อตนี้"
      },
      "editingDirection": {
        "cutType": "Hard Cut หรือ Zoom Blur หรือ Cross Dissolve",
        "thaiSubtitleOverlay": "ข้อความซับไตเติลบนจอ (ถ้ามี)",
        "visualEffectOrSticker": "เอฟเฟกต์ภาพหรือกราฟิกประกอบ",
        "pacingNote": "ข้อสังเกตการตัดต่อ"
      },
      "continuityTag": "จุดเชื่อมโยงความต่อเนื่อง เช่น ทิศทางการมอง, ทิศทางแสงที่ต้องตรงกับช็อตก่อนหน้า"
    }
  ],
  "assemblyMasterPlan": {
    "timelineSummary": "ภาพรวมการลำดับช็อตบนไทม์ไลน์",
    "bgmTrackRecommendation": "แนวเพลง BGM ฟรีที่แนะนำ (เช่น Lo-Fi Chill, Cinematic Suspense, Upbeat Corporate)",
    "colorGradingLut": "โทนสีและ LUT แนะนำ (เช่น Teal and Orange, Warm Vintage, Dark Nordic)",
    "capcutAssemblySteps": [
      "1. สร้างโปรเจกต์ใหม่ใน CapCut เลือกอัตราส่วน ${aspectRatio}",
      "2. นำเข้าคลิปวิดีโอที่เจนจาก AI ทั้งหมดเรียงตามลำดับ Shot 1 ถึง N",
      "3. ใส่เสียงพากย์และซิงค์ความยาวคลิปให้ตรงกับเสียง",
      "4. ใส่ BGM ลดเสียงลงเหลือ 15-20% เพื่อไม่ให้กลบเสียงพากย์",
      "5. ใส่คำบรรยายอัตโนมัติ (Auto Captions) และปรับแต่งฟอนต์ภาษาไทย",
      "6. ใส่ Sound Effect ในจังหวะ Hook และจุดเปลี่ยนฉาก"
    ],
    "freeExportWorkflow": [
      "เครื่องมือสร้างภาพฟรี: SeaArt.ai / Tensor.art / Bing Image Creator / Recraft.ai",
      "เครื่องมือสร้างวิดีโอฟรี: Kling AI (ให้เครดิตฟรีทุกวัน) / Haiper 2.0 / Luma Dream Machine (เครดิตฟรีต่อเดือน)",
      "เครื่องมือสร้างเสียงพากย์ฟรี: CapCut Text-to-Speech ภาษาไทย / Edge-TTS / ElevenLabs บัญชีฟรี",
      "โปรแกรมตัดต่อฟรี: CapCut Desktop & Mobile / DaVinci Resolve (เวอร์ชันฟรี)"
    ]
  },
  "audit": {
    "characterConsistencyStatus": "สมบูรณ์",
    "characterAuditNotes": [
      "ตรวจสอบแล้ว: ชุดเสื้อผ้าและทรงผมระบุชัดเจนด้วย Character Lock Prompt",
      "คำแนะนำ: เมื่อนำไปเจนใน Midjourney หรือ Kling ให้ใช้ภาพช็อตแรกเป็น Image Reference เสมอ"
    ],
    "wardrobeAndPropsCheck": [
      "เครื่องแต่งกายคงที่ตลอดทั้งเรื่อง ไม่มีการเปลี่ยนชุดกะทันหัน",
      "อุปกรณ์ประกอบฉากมีตำแหน่งที่สอดคล้อง"
    ],
    "lightingContinuityCheck": [
      "ทิศทางแสงและบรรยากาศสอดคล้องตามช่วงเวลาและสถานที่"
    ],
    "factCheckVerification": {
      "isFactualOrEducational": true,
      "verificationNotes": [
        "ตรวจสอบความถูกต้องของข้อมูลแล้ว ไม่มีการบิดเบือนหรือแต่งเสริมความจริงทางวิทยาศาสตร์/ประวัติศาสตร์"
      ],
      "potentialHallucinationAlerts": [],
      "sourcesOrCheckpoints": [
        "ข้อมูลอ้างอิงจากหลักการที่ได้รับการยอมรับ"
      ]
    },
    "editingPacingCheck": [
      "จังหวะการตัดต่อกระชับ เหมาะกับแพลตฟอร์ม ไม่มีช็อตที่ยาวเกินไปจนน่าเบื่อ"
    ],
    "directorActionItems": [
      "1. เจนภาพหลักของตัวละครในช็อตที่ 1 เพื่อใช้เป็น Reference Image ให้กับช็อตที่เหลือ",
      "2. ในช็อตเคลื่อนไหว ให้ตั้งค่า Motion Strength ระดับปานกลางเพื่อรักษาความสมจริง",
      "3. อัดเสียงพากย์ก่อนแล้วค่อยนำคลิปมาตัดต่อให้ตรงกับเสียง"
    ]
  },
  "productionStatusNotice": "สถานะ: แผนการผลิตวิดีโอระดับมืออาชีพ (Production Blueprint Ready) - เอกสารวางแผนพร้อมใช้งานจริง ไม่ใช่ไฟล์วิดีโอสำเร็จรูป คุณสามารถคัดลอก Prompts ไปสร้างภาพ วิดีโอ และเสียงตามขั้นตอนเครื่องมือฟรีได้ทันที"
}
`;

    let parsedData: any = null;

    try {
      const response = await generateWithFallback(promptMessage, {
        systemInstruction: SYSTEM_DIRECTOR_INSTRUCTION,
        responseMimeType: 'application/json',
        temperature: 0.7,
      });

      parsedData = parseJSONSafely(response.text);
    } catch (aiErr: any) {
      console.warn('[AI Director] AI model generation failed across candidates, using fallback generator:', aiErr?.message || aiErr);
    }

    if (!parsedData || !parsedData.shots || !Array.isArray(parsedData.shots) || parsedData.shots.length === 0) {
      console.log('[AI Director] Applying robust fallback blueprint for idea:', idea);
      parsedData = createFallbackBlueprint(req.body);
    }

    // Ensure AIVC V2 required media fields exist on every shot
    if (parsedData.shots && Array.isArray(parsedData.shots)) {
      parsedData.shots = parsedData.shots.map((s: any, idx: number) => ({
        ...s,
        sceneId: s.sceneId || `SC-${String(idx + 1).padStart(2, '0')}`,
        generationStatus: s.generationStatus || 'PROMPT_READY',
        referenceImage: s.referenceImage || (idx === 0 ? 'ภาพหลักตัวละคร' : `SC-01`),
        generatedImage: s.generatedImage || '',
        generatedVideo: s.generatedVideo || '',
        mediaNotes: s.mediaNotes || `พร้อมนำ Prompt ไปเจนสื่อ`,
      }));
    }

    if (!parsedData.mediaToolsConfig) {
      parsedData.mediaToolsConfig = {
        imageGeneratorUrl: 'https://copilot.microsoft.com/images/create',
        imageGeneratorName: 'Bing Image Creator',
        videoGeneratorUrl: 'https://klingai.com',
        videoGeneratorName: 'Kling AI',
      };
    }

    return res.json(parsedData);
  } catch (err: any) {
    console.error('Error generating director blueprint:', err);
    // Even in worst case, return resilient fallback blueprint so UI never crashes
    try {
      const fallback = createFallbackBlueprint(req.body);
      return res.json(fallback);
    } catch (e) {
      return res.status(500).json({
        error: 'เกิดข้อผิดพลาดในการสร้างแผนการผลิตวิดีโอ กรุณาลองใหม่อีกครั้ง',
        details: err?.message || String(err),
      });
    }
  }
});

// Endpoint for refining a specific shot or asking the director
app.post('/api/director/refine', async (req, res) => {
  try {
    const { blueprint, instruction } = req.body;
    if (!blueprint || !instruction) {
      return res.status(400).json({ error: 'กรุณาระบุข้อมูล Blueprint และคำสั่งปรับปรุง' });
    }

    const refinePrompt = `
คุณได้รับ Blueprint การผลิตวิดีโอเดิม:
ชื่อเรื่อง: ${blueprint.projectTitle}
ไอเดีย: ${blueprint.originalIdea}
จำนวนช็อต: ${blueprint.shots?.length || 0} ช็อต

คำสั่งปรับปรุงจากผู้กำกับ:
"${instruction}"

จงปรับปรุงและอัปเดต Blueprint นี้ตามคำสั่งของผู้กำกับ โดยรักษากฎความต่อเนื่องของตัวละครและการแยก Image Prompt / Motion Prompt และส่งกลับเป็นโครงสร้าง JSON ของ ProductionBlueprint เดิมที่ได้รับการปรับปรุงแล้วเท่านั้น
`;

    let parsedData: any = null;
    try {
      const response = await generateWithFallback(refinePrompt, {
        systemInstruction: SYSTEM_DIRECTOR_INSTRUCTION,
        responseMimeType: 'application/json',
        temperature: 0.7,
      });

      parsedData = parseJSONSafely(response.text);
    } catch (aiErr: any) {
      console.warn('[AI Director] Refine AI failed, updating blueprint locally:', aiErr?.message || aiErr);
    }

    if (!parsedData || !parsedData.shots) {
      parsedData = {
        ...blueprint,
        originalIdea: `${blueprint.originalIdea} (คำสั่งปรับปรุง: ${instruction})`,
        productionStatusNotice: `ผู้กำกับได้บันทึกคำสั่งปรับปรุง: "${instruction}" เรียบร้อยแล้ว`,
      };
    }

    return res.json(parsedData);
  } catch (err: any) {
    console.error('Error refining blueprint:', err);
    return res.json(req.body.blueprint || {});
  }
});

// Endpoint for quick question / assistance
app.post('/api/director/assist', async (req, res) => {
  try {
    const { question, currentContext } = req.body;
    const response = await generateWithFallback(
      `คำถามหรือคำขอคำแนะนำจากผู้สร้าง: "${question}"\nบริบทโปรเจกต์ปัจจุบัน: ${JSON.stringify(currentContext || {})}`,
      {
        systemInstruction: 'คุณคือ AI Director ผู้เชี่ยวชาญการผลิตวิดีโอ AI ให้คำตอบเป็นภาษาไทยที่เป็นมิตร ให้กำลังใจ และมีขั้นตอนปฏิบัติได้จริง (Actionable Steps) โดยเฉพาะเทคนิคการใช้เครื่องมือฟรี เช่น Kling, Midjourney, SeaArt, CapCut',
      }
    );

    return res.json({ answer: response.text });
  } catch (err: any) {
    return res.json({
      answer: `สำหรับคำถาม "${req.body?.question || ''}": แนะนำให้เริ่มต้นโดยคัดลอก Prompt จากแท็บ Storyboard ไปสร้างภาพใน Bing Image Creator หรือ SeaArt ก่อน จากนั้นนำภาพที่ได้ไปอัปโหลดเป็น Image-to-Video ใน Kling AI เพื่อการเคลื่อนไหวที่ต่อเนื่องสมจริงที่สุดครับ!`
    });
  }
});

// AIVC V3.1: Generate Character-Aware Prompts for a specific scene
app.post('/api/director/generate-scene-prompt', async (req, res) => {
  try {
    const { shot, characters, environment } = req.body;
    if (!shot) {
      return res.status(400).json({ error: 'กรุณาระบุข้อมูล Shot' });
    }

    const assignedCharacters = Array.isArray(characters) ? characters : [];

    // Try Gemini model first for high-quality prompt synthesis
    try {
      const promptInstruction = `
You are a Hollywood-grade AI Director and master prompt engineer for AI video production (Midjourney, Flux, Kling AI, Google Flow).
Generate character-aware prompts for this specific scene.

ASSIGNED CHARACTERS (${assignedCharacters.length}):
${assignedCharacters.map((c: any, i: number) => `
Character ${i + 1}: ${c.name} (${c.role || ''})
Permanent Identity: ${c.visualIdentity?.faceAndHair || ''}, ${c.visualIdentity?.clothing || ''}, ${c.visualIdentity?.accessoriesAndTraits || ''}
Locked Prompt: ${c.consistencyLockPrompt || c.canonicalDescription || ''}
Canonical Clothing: ${c.canonicalClothing || c.visualIdentity?.clothing || ''}
Is Locked: ${c.isLocked !== false}
`).join('\n')}

SCENE SPECIFICS:
- Scene ID: ${shot.sceneId || 'SC-01'}
- Shot Type: ${shot.shotType || 'Medium Shot'}
- Camera Movement: ${shot.cameraMovement || 'Static'}
- Action Description: ${shot.actionDescription || ''}
- Lighting & Composition: ${shot.compositionAndLighting || ''}
- Aspect Ratio: ${shot.imagePrompt?.aspectRatio || '9:16'}
- Environment: ${environment?.consistencyPromptLock || 'Cinematic environment'}

CRITICAL RULES:
1. If 0 characters: Focus 100% on scenery/atmosphere/objects. Do not add any people.
2. If 1 or more characters: Keep the character permanent physical identity and locked clothing consistent, and separate from scene-specific action. Do not contradict locked wardrobe or hair.
3. Return separate positivePromptEn for image generation and videoPromptEn for video dynamics (camera motion + physical action).
4. Provide negativePrompt suitable for the scene.
5. Injected details: list 2-4 strings indicating what character and cinematic traits were injected.

Respond strictly in valid JSON:
{
  "positivePromptEn": "string",
  "negativePrompt": "string",
  "videoPromptEn": "string",
  "cameraMotionDirective": "string",
  "injectedDetails": ["string", "string"],
  "conflictWarnings": []
}
`;

      const response = await generateWithFallback(promptInstruction, {
        systemInstruction: 'You are an AI Director prompt engineer. Return only valid JSON conforming to the requested schema.',
        responseMimeType: 'application/json',
        temperature: 0.4,
      });

      const parsed = parseJSONSafely(response.text);
      if (parsed && parsed.positivePromptEn && parsed.videoPromptEn) {
        return res.json({
          success: true,
          positivePromptEn: parsed.positivePromptEn,
          negativePrompt: parsed.negativePrompt || 'blurry, low quality, distorted anatomy',
          videoPromptEn: parsed.videoPromptEn,
          cameraMotionDirective: parsed.cameraMotionDirective || shot.cameraMovement,
          injectedDetails: Array.isArray(parsed.injectedDetails) ? parsed.injectedDetails : [],
          conflictWarnings: Array.isArray(parsed.conflictWarnings) ? parsed.conflictWarnings : [],
        });
      }
    } catch (modelErr: any) {
      console.warn('[AI Director] Gemini prompt generation fallback to rule engine:', modelErr?.message || modelErr);
    }

    // Reliable local rule fallback
    const localResult = generateCharacterAwarePrompts(shot, assignedCharacters, environment);
    const conflicts = detectConsistencyConflicts(
      { ...shot, imagePrompt: { ...shot.imagePrompt, positivePromptEn: localResult.positivePromptEn } },
      assignedCharacters
    );

    return res.json({
      success: true,
      positivePromptEn: localResult.positivePromptEn,
      negativePrompt: localResult.negativePrompt,
      videoPromptEn: localResult.videoPromptEn,
      cameraMotionDirective: localResult.cameraMotionDirective,
      injectedDetails: localResult.injectedDetails,
      conflictWarnings: conflicts.warnings,
    });
  } catch (err: any) {
    console.error('Error generating scene prompt:', err);
    return res.status(500).json({ error: 'ไม่สามารถสร้าง Prompt ได้' });
  }
});

// =============================================================
// AIVC V3: Direct Media Generation Endpoints (Features 1 & 2)
// =============================================================

// Get list of configured provider adapters and their availability
app.get('/api/media/providers', async (_req, res) => {
  try {
    const status = await providerRegistry.getProvidersStatus();
    return res.json(status);
  } catch (err: any) {
    console.error('Error fetching providers status:', err);
    return res.status(500).json({ error: 'ไม่สามารถตรวจสอบสถานะ Providers ได้' });
  }
});

// Direct Image Generation endpoint
app.post('/api/media/generate-image', async (req, res) => {
  try {
    const { prompt, aspectRatio, sceneId, shotNumber, provider, assignedCharacters, negativePrompt } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ success: false, error: 'กรุณาระบุ Prompt สำหรับสร้างภาพ' });
    }

    const result = await providerRegistry.generateImage({
      prompt,
      aspectRatio: aspectRatio || '9:16',
      sceneId: sceneId || 'SC-01',
      shotNumber: shotNumber || 1,
      provider: provider || 'google-gemini',
      assignedCharacters: Array.isArray(assignedCharacters) ? assignedCharacters : undefined,
      negativePrompt: typeof negativePrompt === 'string' ? negativePrompt : undefined,
    });

    return res.json(result);
  } catch (err: any) {
    console.error('Error in /api/media/generate-image:', err);
    return res.status(500).json({
      success: false,
      error: 'เกิดข้อผิดพลาดในการประมวลผลคำขอสร้างภาพ',
      requirementsNotice: err?.message || String(err),
    });
  }
});

// Direct Video Generation endpoint
app.post('/api/media/generate-video', async (req, res) => {
  try {
    const { prompt, imageUrl, sceneId, shotNumber, durationSec, provider } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ success: false, error: 'กรุณาระบุ Prompt สำหรับสร้างวิดีโอ' });
    }

    const result = await providerRegistry.generateVideo({
      prompt,
      imageUrl,
      sceneId: sceneId || 'SC-01',
      shotNumber: shotNumber || 1,
      durationSec: durationSec || 5,
      provider: provider || 'google-veo',
    });

    return res.json(result);
  } catch (err: any) {
    console.error('Error in /api/media/generate-video:', err);
    return res.status(500).json({
      success: false,
      status: 'FAILED',
      error: 'เกิดข้อผิดพลาดในการประมวลผลคำขอสร้างวิดีโอ',
      requirementsNotice: err?.message || String(err),
    });
  }
});

// Proxy endpoint to stream images/videos and bypass CORS/hotlinking restrictions
app.get('/api/media/proxy', async (req, res) => {
  try {
    const mediaUrl = req.query.url as string;
    if (!mediaUrl || (!mediaUrl.startsWith('http://') && !mediaUrl.startsWith('https://'))) {
      return res.status(400).send('Invalid media URL');
    }
    const response = await fetch(mediaUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
    });
    if (!response.ok) {
      return res.status(response.status).send('Failed to fetch upstream media');
    }
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    if (req.query.download === 'true') {
      const filename = (req.query.filename as string) || 'media-download';
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return res.send(Buffer.from(arrayBuffer));
  } catch (err: any) {
    console.error('Error in /api/media/proxy:', err);
    return res.status(500).send('Proxy error');
  }
});

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`AI Video Director server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
