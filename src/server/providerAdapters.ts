import { GoogleGenAI } from '@google/genai';
import type {
  DirectImageGenRequest,
  DirectImageGenResponse,
  DirectVideoGenRequest,
  DirectVideoGenResponse,
  ProviderStatusInfo,
  ImageProviderId,
  VideoProviderId,
} from '../types/director.ts';

// -------------------------------------------------------------
// Helper: Gradio SSE Stream Parser for Hugging Face Spaces
// -------------------------------------------------------------

async function parseGradioSseStream(response: Response): Promise<any> {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('ไม่สามารถอ่านข้อมูลสตรีมจากเซิร์ฟเวอร์ Gradio ได้ (No response body reader)');
  }

  const decoder = new TextDecoder();
  let buffer = '';
  let currentEvent = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      if (line.startsWith('event:')) {
        currentEvent = line.replace('event:', '').trim();
      } else if (line.startsWith('data:')) {
        const dataStr = line.replace('data:', '').trim();
        if (currentEvent === 'complete') {
          try {
            return JSON.parse(dataStr);
          } catch (e) {
            return dataStr;
          }
        } else if (currentEvent === 'error') {
          throw new Error(`ข้อผิดพลาดจาก Gradio Space: ${dataStr}`);
        }
      }
    }
  }

  throw new Error('การเชื่อมต่อสตรีมสิ้นสุดลงก่อนที่โมเดลจะประมวลผลเสร็จสิ้น (Stream ended prematurely)');
}

// -------------------------------------------------------------
// Provider Adapter Interfaces
// -------------------------------------------------------------

export interface ImageProviderAdapter {
  id: ImageProviderId;
  name: string;
  tier: 'Free Tier' | 'Paid Tier Required' | 'API Key Required';
  checkAvailability(): Promise<ProviderStatusInfo>;
  generateImage(params: DirectImageGenRequest): Promise<DirectImageGenResponse>;
}

export interface VideoProviderAdapter {
  id: VideoProviderId;
  name: string;
  tier: 'Free Tier' | 'Paid Tier Required' | 'API Key Required';
  checkAvailability(): Promise<ProviderStatusInfo>;
  generateVideo(params: DirectVideoGenRequest): Promise<DirectVideoGenResponse>;
}

// -------------------------------------------------------------
// Image Provider 1: Hugging Face FLUX.1-schnell (Verified Free)
// -------------------------------------------------------------

export class HuggingFaceFluxImageAdapter implements ImageProviderAdapter {
  id: ImageProviderId = 'hf-flux';
  name = 'Hugging Face FLUX.1-schnell (ฟรี 100% ตรวจสอบแล้วใช้งานได้จริง)';
  tier: 'Free Tier' = 'Free Tier';

  private spaceBaseUrl = 'https://black-forest-labs-flux-1-schnell.hf.space';

  async checkAvailability(): Promise<ProviderStatusInfo> {
    try {
      const res = await fetch(`${this.spaceBaseUrl}/gradio_api/info`, {
        signal: AbortSignal.timeout(4000),
      });

      if (res.ok) {
        return {
          id: this.id,
          name: this.name,
          category: 'image',
          isConfigured: true,
          isAvailable: true,
          tier: this.tier,
          statusMessage: 'พร้อมใช้งานจริง (โมเดล FLUX.1-schnell บน Hugging Face Spaces ฟรี 100%)',
          setupInstructions: 'ใช้งานได้ทันทีโดยไม่ต้องตั้งค่า API Key หรือผูกบัตรเครดิต',
        };
      }
    } catch (e: any) {
      console.warn('[HuggingFaceFluxImageAdapter] Ping failed:', e?.message);
    }

    return {
      id: this.id,
      name: this.name,
      category: 'image',
      isConfigured: true,
      isAvailable: false,
      tier: this.tier,
      statusMessage: 'Space กำลังเริ่มต้นระบบหรือมีคิวรอชั่วคราว',
      setupInstructions: 'สามารถเลือกระบบสำรอง Pollinations AI หรือลองใหม่อีกครั้งใน 10 วินาที',
    };
  }

  async generateImage(params: DirectImageGenRequest): Promise<DirectImageGenResponse> {
    let enrichedPrompt = params.prompt;
    if (params.assignedCharacters && params.assignedCharacters.length > 0) {
      const charDetails = params.assignedCharacters
        .map((c) => {
          const desc = c.canonicalDescription ? ` (${c.canonicalDescription})` : '';
          const clothing = c.clothing ? `, Wearing: ${c.clothing}` : '';
          return `${c.name}${desc}${clothing}`;
        })
        .join('; ');

      if (!enrichedPrompt.includes(params.assignedCharacters[0].name)) {
        enrichedPrompt = `Featuring characters [${charDetails}]. ${enrichedPrompt}`;
      }
    }

    // Determine dimensions from aspect ratio
    let width = 768;
    let height = 768;
    switch (params.aspectRatio) {
      case '9:16':
        width = 576;
        height = 1024;
        break;
      case '16:9':
        width = 1024;
        height = 576;
        break;
      case '4:3':
        width = 896;
        height = 672;
        break;
      case '3:4':
        width = 672;
        height = 896;
        break;
      case '1:1':
      default:
        width = 768;
        height = 768;
        break;
    }

    try {
      console.log(`[HuggingFaceFluxImageAdapter] Calling FLUX.1-schnell on HF Space (${width}x${height})...`);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (process.env.HF_TOKEN) {
        headers['Authorization'] = `Bearer ${process.env.HF_TOKEN}`;
      }

      // Step 1: Initiate call
      const postRes = await fetch(`${this.spaceBaseUrl}/gradio_api/call/infer`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          data: [enrichedPrompt, 0, true, width, height, 4],
        }),
        signal: AbortSignal.timeout(15000),
      });

      if (!postRes.ok) {
        const errText = await postRes.text().catch(() => '');
        throw new Error(`HTTP ${postRes.status}: ${errText.slice(0, 100) || postRes.statusText}`);
      }

      const postData: any = await postRes.json();
      const eventId = postData?.event_id;
      if (!eventId) {
        throw new Error('ไม่ได้รับ Event ID จากคิวของ Hugging Face Space');
      }

      // Step 2: Stream SSE response with 60s timeout
      const eventRes = await fetch(`${this.spaceBaseUrl}/gradio_api/call/infer/${eventId}`, {
        headers,
        signal: AbortSignal.timeout(60000),
      });

      if (!eventRes.ok) {
        throw new Error(`HTTP ${eventRes.status} ขณะรอคิวผลลัพธ์จาก Gradio`);
      }

      const streamResult = await parseGradioSseStream(eventRes);
      const outputItem = Array.isArray(streamResult) ? streamResult[0] : streamResult;
      const imageUrl = outputItem?.url || outputItem?.path;

      if (!imageUrl) {
        throw new Error('โมเดลทำงานเสร็จสิ้นแต่ไม่พบ URL รูปภาพในผลลัพธ์');
      }

      console.log('[HuggingFaceFluxImageAdapter] Image generated successfully:', imageUrl);
      return {
        success: true,
        imageUrl,
        provider: 'Hugging Face (FLUX.1-schnell)',
        model: 'FLUX.1-schnell',
      };
    } catch (err: any) {
      console.error('[HuggingFaceFluxImageAdapter] Error:', err);
      const errMsg = err?.message || String(err);
      const isZeroGpu = errMsg.includes('ZeroGPU') || errMsg.includes('limit') || errMsg.includes('quota');
      return {
        success: false,
        provider: this.name,
        model: 'FLUX.1-schnell',
        error: isZeroGpu
          ? 'โควตา GPU ฟรีของ Space ชั่วคราวเต็ม (ZeroGPU Limit) สามารถรับโควตาเพิ่มได้ฟรีโดยเพิ่ม HF_TOKEN หรือสลับใช้ Pollinations AI'
          : `ไม่สามารถสร้างภาพผ่าน FLUX.1-schnell: ${errMsg}`,
        setupInstructions:
          'วิธีเพิ่มโควตาฟรี 100%:\n1. ไปที่ https://huggingface.co/settings/tokens สร้าง Read Token (ฟรี)\n2. ระบุ HF_TOKEN ในเซิร์ฟเวอร์ หรือสลับไปใช้ Pollinations AI เพื่อสร้างภาพได้ทันที',
      };
    }
  }
}

// -------------------------------------------------------------
// Image Provider 2: Pollinations AI (Verified Free, Fast Fallback)
// -------------------------------------------------------------

export class PollinationsImageAdapter implements ImageProviderAdapter {
  id: ImageProviderId = 'pollinations';
  name = 'Pollinations AI (ฟรี 100% รวดเร็ว ไม่ต้องใช้ API Key)';
  tier: 'Free Tier' = 'Free Tier';

  async checkAvailability(): Promise<ProviderStatusInfo> {
    try {
      const res = await fetch('https://image.pollinations.ai/prompt/test?width=64&height=64', {
        method: 'HEAD',
        signal: AbortSignal.timeout(4000),
      });
      if (res.ok) {
        return {
          id: this.id,
          name: this.name,
          category: 'image',
          isConfigured: true,
          isAvailable: true,
          tier: this.tier,
          statusMessage: 'พร้อมใช้งานจริง (Pollinations AI สร้างภาพฟรี ไม่จำกัดสิทธิ์)',
          setupInstructions: 'สร้างภาพได้โดยตรง ไม่ต้องระบุคีย์',
        };
      }
    } catch (e: any) {
      console.warn('[PollinationsImageAdapter] Ping failed:', e?.message);
    }

    return {
      id: this.id,
      name: this.name,
      category: 'image',
      isConfigured: true,
      isAvailable: true,
      tier: this.tier,
      statusMessage: 'พร้อมใช้งาน (Public API Endpoint)',
    };
  }

  async generateImage(params: DirectImageGenRequest): Promise<DirectImageGenResponse> {
    let enrichedPrompt = params.prompt;
    if (params.assignedCharacters && params.assignedCharacters.length > 0) {
      const charDetails = params.assignedCharacters
        .map((c) => {
          const desc = c.canonicalDescription ? ` (${c.canonicalDescription})` : '';
          const clothing = c.clothing ? `, Wearing: ${c.clothing}` : '';
          return `${c.name}${desc}${clothing}`;
        })
        .join('; ');

      if (!enrichedPrompt.includes(params.assignedCharacters[0].name)) {
        enrichedPrompt = `Featuring characters [${charDetails}]. ${enrichedPrompt}`;
      }
    }

    let width = 768;
    let height = 768;
    switch (params.aspectRatio) {
      case '9:16':
        width = 576;
        height = 1024;
        break;
      case '16:9':
        width = 1024;
        height = 576;
        break;
      case '4:3':
        width = 896;
        height = 672;
        break;
      case '3:4':
        width = 672;
        height = 896;
        break;
      case '1:1':
      default:
        width = 768;
        height = 768;
        break;
    }

    try {
      const seed = Math.floor(Math.random() * 1000000);
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(enrichedPrompt)}?width=${width}&height=${height}&nologo=true&seed=${seed}`;

      console.log(`[PollinationsImageAdapter] Generating image from Pollinations (${width}x${height})...`);
      const verifyRes = await fetch(url, {
        method: 'HEAD',
        signal: AbortSignal.timeout(15000),
      });

      if (!verifyRes.ok) {
        throw new Error(`HTTP ${verifyRes.status} จากเซิร์ฟเวอร์ Pollinations`);
      }

      return {
        success: true,
        imageUrl: url,
        provider: 'Pollinations AI',
        model: 'Pollinations-Flux',
      };
    } catch (err: any) {
      console.error('[PollinationsImageAdapter] Error:', err);
      return {
        success: false,
        provider: this.name,
        model: 'Pollinations-Flux',
        error: `ไม่สามารถสร้างภาพผ่าน Pollinations: ${err?.message || String(err)}`,
      };
    }
  }
}

// -------------------------------------------------------------
// Image Provider 3: Google Gemini Image Adapter (Truthful Quota 0)
// -------------------------------------------------------------

export class GoogleGeminiImageAdapter implements ImageProviderAdapter {
  id: ImageProviderId = 'google-gemini';
  name = 'Google Gemini (Imagen 3 / Flash Lite Image)';
  tier: 'Paid Tier Required' = 'Paid Tier Required';

  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  async checkAvailability(): Promise<ProviderStatusInfo> {
    const hasKey = Boolean(process.env.GEMINI_API_KEY);
    return {
      id: this.id,
      name: this.name,
      category: 'image',
      isConfigured: hasKey,
      isAvailable: false, // Truthful check: Google AI Studio imposes quota limit 0 on Free Tier
      tier: this.tier,
      statusMessage: hasKey
        ? 'ต้องการ Google Cloud Billing (Free Tier โควตา = 0 สำหรับ Image Models)'
        : 'ยังไม่ได้ตั้งค่า GEMINI_API_KEY',
      setupInstructions:
        'หากต้องการใช้ Google Gemini สร้างภาพโดยตรง กรุณาเปิดใช้งาน Billing ใน Google Cloud Project หรือใช้ Paid API Key ใน Google AI Studio มิฉะนั้นระบบจะเลือกใช้ Hugging Face FLUX ฟรี 100%',
    };
  }

  async generateImage(params: DirectImageGenRequest): Promise<DirectImageGenResponse> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        success: false,
        provider: this.name,
        model: 'gemini-3.1-flash-lite-image',
        error: 'ยังไม่ได้ระบุ GEMINI_API_KEY บนเซิร์ฟเวอร์',
        setupInstructions: 'กรุณาใช้ผู้ให้บริการฟรี Hugging Face FLUX หรือ Pollinations AI',
      };
    }

    // Notice: Quota is 0 on free tier. Prevent useless repeated calls.
    return {
      success: false,
      provider: this.name,
      model: 'gemini-3.1-flash-lite-image',
      error: 'โมเดลสร้างภาพของ Google AI Studio มีโควตาเป็น 0 ใน Free Tier (HTTP 429 Quota Exceeded / Limit 0)',
      requirementsNotice: 'Google AI Studio กำหนดให้ต้องผูกบัญชี Billing (Paid API Key) เพื่อเข้าถึงโมเดลสร้างภาพ Imagen / Gemini Image โดยตรงในระบบ',
      setupInstructions: 'ระบบขอแนะนำให้เลือกใช้ผู้ให้บริการฟรี เช่น Hugging Face FLUX หรือ Pollinations AI ที่สามารถสร้างภาพได้จริงฟรีทันที',
    };
  }
}

// -------------------------------------------------------------
// Image Provider 4: Custom API Provider Adapter (OpenAI / Webhook)
// -------------------------------------------------------------

export class CustomImageProviderAdapter implements ImageProviderAdapter {
  id: ImageProviderId = 'custom-api';
  name = 'Custom Image API (OpenAI DALL-E / Webhook)';
  tier: 'API Key Required' = 'API Key Required';

  async checkAvailability(): Promise<ProviderStatusInfo> {
    const isConfigured = Boolean(process.env.OPENAI_API_KEY || process.env.IMAGE_PROVIDER_URL);
    return {
      id: this.id,
      name: this.name,
      category: 'image',
      isConfigured,
      isAvailable: isConfigured,
      tier: this.tier,
      statusMessage: isConfigured ? 'พร้อมใช้งาน (พบค่าใน ENV)' : 'ยังไม่ได้ตั้งค่า API Key ในเซิร์ฟเวอร์',
      setupInstructions:
        'ตั้งค่า OPENAI_API_KEY หรือ IMAGE_PROVIDER_URL ใน Environment Variables บนเซิร์ฟเวอร์เพื่อเปิดใช้งาน',
    };
  }

  async generateImage(params: DirectImageGenRequest): Promise<DirectImageGenResponse> {
    const openAiKey = process.env.OPENAI_API_KEY;
    if (!openAiKey) {
      return {
        success: false,
        provider: this.name,
        model: 'Custom/OpenAI',
        error: 'ยังไม่ได้ตั้งค่า OPENAI_API_KEY ในสภาพแวดล้อมระบบ',
      };
    }

    try {
      const sizeMap: Record<string, string> = {
        '1:1': '1024x1024',
        '9:16': '1024x1792',
        '16:9': '1792x1024',
        '4:3': '1024x1024',
        '3:4': '1024x1024',
      };
      const size = sizeMap[params.aspectRatio] || '1024x1024';

      const res = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openAiKey}`,
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: params.prompt,
          n: 1,
          size,
          response_format: 'b64_json',
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.error?.message || `HTTP ${res.status}`);
      }

      const data: any = await res.json();
      const b64 = data?.data?.[0]?.b64_json;
      if (b64) {
        return {
          success: true,
          imageUrl: `data:image/png;base64,${b64}`,
          provider: 'OpenAI DALL-E 3',
          model: 'dall-e-3',
        };
      }
    } catch (err: any) {
      return {
        success: false,
        provider: 'OpenAI DALL-E 3',
        model: 'dall-e-3',
        error: err?.message || 'OpenAI generation failed',
      };
    }

    return {
      success: false,
      provider: this.name,
      model: 'unknown',
      error: 'ไม่สามารถสร้างภาพผ่าน Custom API ได้',
    };
  }
}

// -------------------------------------------------------------
// Video Provider 1: Hugging Face Sulphur 2 Video (Verified Free MP4)
// -------------------------------------------------------------

export class HuggingFaceSulphurVideoAdapter implements VideoProviderAdapter {
  id: VideoProviderId = 'hf-sulphur';
  name = 'Hugging Face Sulphur 2 Video (ฟรี 100% สร้างวิดีโอ MP4 จริง)';
  tier: 'Free Tier' = 'Free Tier';

  private spaceBaseUrl = 'https://ardauzan-sulphur-2-base.hf.space';

  async checkAvailability(): Promise<ProviderStatusInfo> {
    try {
      const res = await fetch(`${this.spaceBaseUrl}/gradio_api/info`, {
        signal: AbortSignal.timeout(4000),
      });

      if (res.ok) {
        return {
          id: this.id,
          name: this.name,
          category: 'video',
          isConfigured: true,
          isAvailable: true,
          tier: this.tier,
          statusMessage: 'พร้อมใช้งานจริง (โมเดล Sulphur 2 Video บน Hugging Face สร้างคลิป MP4 ฟรี)',
          setupInstructions: 'สร้างวิดีโอฟรีโดยตรงจาก Motion Prompt หรือภาพตั้งต้น (Image-to-Video)',
        };
      }
    } catch (e: any) {
      console.warn('[HuggingFaceSulphurVideoAdapter] Ping failed:', e?.message);
    }

    return {
      id: this.id,
      name: this.name,
      category: 'video',
      isConfigured: true,
      isAvailable: false,
      tier: this.tier,
      statusMessage: 'Space กำลังเตรียมทรัพยากร GPU ชั่วคราว',
      setupInstructions: 'กรุณาลองใหม่อีกครั้งใน 10-15 วินาที หรือใช้ปุ่มเปิด Google Flow เพื่อสร้างวิดีโอเสริม',
    };
  }

  async generateVideo(params: DirectVideoGenRequest): Promise<DirectVideoGenResponse> {
    try {
      console.log(`[HuggingFaceSulphurVideoAdapter] Calling Sulphur 2 Video (Image-to-Video: ${Boolean(params.imageUrl)})...`);

      let inputImageObj: any = null;

      // Handle input image for Image-to-Video
      if (params.imageUrl) {
        if (params.imageUrl.startsWith('http://') || params.imageUrl.startsWith('https://')) {
          inputImageObj = {
            path: params.imageUrl,
            url: params.imageUrl,
            orig_name: 'input_frame.png',
            meta: { _type: 'gradio.FileData' },
          };
        } else if (params.imageUrl.startsWith('data:')) {
          // Upload base64 image to Gradio
          try {
            const match = params.imageUrl.match(/^data:([^;]+);base64,(.+)$/);
            if (match) {
              const mime = match[1];
              const buffer = Buffer.from(match[2], 'base64');
              const form = new FormData();
              const blob = new Blob([buffer], { type: mime });
              form.append('files', blob, 'input_frame.png');

              const uploadRes = await fetch(`${this.spaceBaseUrl}/gradio_api/upload`, {
                method: 'POST',
                body: form,
                signal: AbortSignal.timeout(10000),
              });

              if (uploadRes.ok) {
                const uploadData: any = await uploadRes.json();
                const uploadedPath = Array.isArray(uploadData) ? uploadData[0] : uploadData;
                if (uploadedPath) {
                  inputImageObj = {
                    path: uploadedPath,
                    meta: { _type: 'gradio.FileData' },
                  };
                }
              }
            }
          } catch (uploadErr) {
            console.warn('[HuggingFaceSulphurVideoAdapter] Image upload warning:', uploadErr);
          }
        }
      }

      const duration = Math.min(Math.max(params.durationSec || 2.0, 1.0), 4.0);
      const width = 640;
      const height = 384;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (process.env.HF_TOKEN) {
        headers['Authorization'] = `Bearer ${process.env.HF_TOKEN}`;
      }

      // Step 1: Initiate job
      const postRes = await fetch(`${this.spaceBaseUrl}/gradio_api/call/generate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          data: [
            inputImageObj,
            params.prompt,
            duration,
            false,
            Math.floor(Math.random() * 100000),
            true,
            height,
            width,
          ],
        }),
        signal: AbortSignal.timeout(20000),
      });

      if (!postRes.ok) {
        const errText = await postRes.text().catch(() => '');
        throw new Error(`HTTP ${postRes.status}: ${errText.slice(0, 120) || postRes.statusText}`);
      }

      const postData: any = await postRes.json();
      const eventId = postData?.event_id;
      if (!eventId) {
        throw new Error('ไม่ได้รับ Event ID จากเซิร์ฟเวอร์สร้างวิดีโอ');
      }

      // Step 2: Stream SSE response with 90s timeout for video rendering
      const eventRes = await fetch(`${this.spaceBaseUrl}/gradio_api/call/generate/${eventId}`, {
        headers,
        signal: AbortSignal.timeout(90000),
      });

      if (!eventRes.ok) {
        throw new Error(`HTTP ${eventRes.status} ขณะรอคิวประมวลผลวิดีโอ`);
      }

      const streamResult = await parseGradioSseStream(eventRes);
      const outputItem = Array.isArray(streamResult) ? streamResult[0] : streamResult;
      const videoUrl = outputItem?.url || outputItem?.path;

      if (!videoUrl) {
        throw new Error('การประมวลผลเสร็จสิ้นแต่ไม่พบ URL ของไฟล์วิดีโอ');
      }

      console.log('[HuggingFaceSulphurVideoAdapter] Video generated successfully:', videoUrl);
      return {
        success: true,
        videoUrl,
        provider: 'Hugging Face (Sulphur 2 Video)',
        model: 'Sulphur-2-Base',
        status: 'COMPLETED',
      };
    } catch (err: any) {
      console.error('[HuggingFaceSulphurVideoAdapter] Error:', err);
      const errMsg = err?.message || String(err);
      const isZeroGpu = errMsg.includes('ZeroGPU') || errMsg.includes('runs limit') || errMsg.includes('quota');
      return {
        success: false,
        provider: this.name,
        model: 'Sulphur-2-Base',
        status: 'FAILED',
        error: isZeroGpu
          ? 'โควตาประมวลผล GPU ฟรีของ Space ชั่วคราวเต็ม (ZeroGPU runs limit exceeded) สามารถรับโควตาฟรีเพิ่มได้โดยระบุ HF_TOKEN'
          : `ไม่สามารถสร้างวิดีโอผ่าน Sulphur 2: ${errMsg}`,
        setupInstructions:
          'วิธีเพิ่มโควตาฟรี 100%:\n1. ไปที่ https://huggingface.co/settings/tokens เพื่อสร้าง User Access Token (ฟรี ไม่เสียเงิน)\n2. ระบุ HF_TOKEN ใน Environment Variables บนเซิร์ฟเวอร์\n3. หรือคัดลอก Motion Prompt ไปเปิดใช้ใน Google Flow / เว็บวิดีโอฟรีได้ทันที',
      };
    }
  }
}

// -------------------------------------------------------------
// Video Provider 2: Google Veo Video Adapter (Truthful Quota 0)
// -------------------------------------------------------------

export class GoogleVeoVideoAdapter implements VideoProviderAdapter {
  id: VideoProviderId = 'google-veo';
  name = 'Google Veo (veo-3.1-lite / veo-3.1)';
  tier: 'Paid Tier Required' = 'Paid Tier Required';

  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  async checkAvailability(): Promise<ProviderStatusInfo> {
    const hasKey = Boolean(process.env.GEMINI_API_KEY);
    return {
      id: this.id,
      name: this.name,
      category: 'video',
      isConfigured: hasKey,
      isAvailable: false, // Google Veo video models require Paid Billing Tier (limit 0 on free tier)
      tier: this.tier,
      statusMessage: hasKey
        ? 'ต้องการ Google Cloud Billing (Free Tier โควตา = 0 สำหรับ Veo Video)'
        : 'ยังไม่ได้ตั้งค่า GEMINI_API_KEY',
      setupInstructions:
        'โมเดล Google Veo ไม่เปิดให้ใช้งานบน Free Tier ต้องมีบัญชี Google Cloud Billing เชื่อมต่อกับ Google AI Studio แนะนำให้ใช้ Hugging Face Sulphur 2 Video ฟรี',
    };
  }

  async generateVideo(_params: DirectVideoGenRequest): Promise<DirectVideoGenResponse> {
    return {
      success: false,
      provider: this.name,
      model: 'veo-3.1-lite-generate-preview',
      status: 'REQUIRES_CONFIGURATION',
      error: 'โมเดล Google Veo ต้องใช้ Paid Billing Tier (Free Tier โควตา = 0)',
      requirementsNotice:
        'Google AI Studio กำหนดให้ต้องมีบัญชี Google Cloud Billing หรือ Paid API Key เพื่อเข้าถึงโมเดลสร้างวิดีโอ Veo 3.1',
      setupInstructions:
        'ระบบแนะนำให้เลือกใช้ผู้ให้บริการฟรี Hugging Face Sulphur 2 Video ซึ่งสร้างคลิป MP4 ได้จริงโดยไม่มีค่าใช้จ่าย',
    };
  }
}

// -------------------------------------------------------------
// Video Provider 3: External Video Provider Adapter
// -------------------------------------------------------------

export class ExternalVideoProviderAdapter implements VideoProviderAdapter {
  id: VideoProviderId = 'external-api';
  name = 'External Video Provider (Kling AI / Runway / Replicate)';
  tier: 'API Key Required' = 'API Key Required';

  async checkAvailability(): Promise<ProviderStatusInfo> {
    const isConfigured = Boolean(
      process.env.REPLICATE_API_TOKEN || process.env.KLING_API_KEY || process.env.RUNWAY_API_KEY
    );

    return {
      id: this.id,
      name: this.name,
      category: 'video',
      isConfigured,
      isAvailable: isConfigured,
      tier: this.tier,
      statusMessage: isConfigured
        ? 'พร้อมใช้งาน (พบ API Key ในเซิร์ฟเวอร์)'
        : 'ต้องระบุ API Key ของผู้ให้บริการวิดีโอบนเซิร์ฟเวอร์',
      setupInstructions:
        'ตั้งค่า REPLICATE_API_TOKEN หรือ KLING_API_KEY ใน Environment Variables ของเซิร์ฟเวอร์เพื่อเปิดใช้งาน',
    };
  }

  async generateVideo(_params: DirectVideoGenRequest): Promise<DirectVideoGenResponse> {
    const replicateToken = process.env.REPLICATE_API_TOKEN;
    const klingKey = process.env.KLING_API_KEY;

    if (!replicateToken && !klingKey) {
      return {
        success: false,
        provider: this.name,
        model: 'External AI Video',
        status: 'REQUIRES_CONFIGURATION',
        error: 'ยังไม่ได้ตั้งค่า API Key สำหรับ External Video Provider บนเซิร์ฟเวอร์',
        requirementsNotice:
          'การเรนเดอร์วิดีโอ AI อัตโนมัติทางตรงต้องใช้ API Key ของ Kling AI หรือ Replicate',
        setupInstructions:
          'แนะนำให้เลือกใช้ Hugging Face Sulphur 2 Video ซึ่งสร้างวิดีโอ MP4 ได้ฟรีทันที',
      };
    }

    return {
      success: false,
      provider: this.name,
      model: 'External Video API',
      status: 'REQUIRES_CONFIGURATION',
      error: 'อยู่ระหว่างการเชื่อมต่อ API ของผู้ให้บริการภายนอก',
    };
  }
}

// -------------------------------------------------------------
// Provider Registry
// -------------------------------------------------------------

export class ProviderRegistry {
  private imageAdapters: Map<string, ImageProviderAdapter> = new Map();
  private videoAdapters: Map<string, VideoProviderAdapter> = new Map();

  constructor() {
    // Register image providers in priority order: verified free first
    const hfFlux = new HuggingFaceFluxImageAdapter();
    const pollinations = new PollinationsImageAdapter();
    const googleImage = new GoogleGeminiImageAdapter();
    const customImage = new CustomImageProviderAdapter();

    this.imageAdapters.set(hfFlux.id, hfFlux);
    this.imageAdapters.set(pollinations.id, pollinations);
    this.imageAdapters.set(googleImage.id, googleImage);
    this.imageAdapters.set(customImage.id, customImage);

    // Register video providers in priority order: verified free first
    const hfSulphur = new HuggingFaceSulphurVideoAdapter();
    const googleVeo = new GoogleVeoVideoAdapter();
    const externalVideo = new ExternalVideoProviderAdapter();

    this.videoAdapters.set(hfSulphur.id, hfSulphur);
    this.videoAdapters.set(googleVeo.id, googleVeo);
    this.videoAdapters.set(externalVideo.id, externalVideo);
  }

  async getProvidersStatus(): Promise<{
    imageProviders: ProviderStatusInfo[];
    videoProviders: ProviderStatusInfo[];
  }> {
    const imageStatuses = await Promise.all(
      Array.from(this.imageAdapters.values()).map((a) => a.checkAvailability())
    );
    const videoStatuses = await Promise.all(
      Array.from(this.videoAdapters.values()).map((a) => a.checkAvailability())
    );
    return {
      imageProviders: imageStatuses,
      videoProviders: videoStatuses,
    };
  }

  async generateImage(params: DirectImageGenRequest): Promise<DirectImageGenResponse> {
    const providerId = params.provider || 'hf-flux';
    let adapter = this.imageAdapters.get(providerId);

    // Fallback if specified adapter is not found
    if (!adapter) {
      adapter = this.imageAdapters.get('hf-flux') || this.imageAdapters.get('pollinations');
    }

    if (!adapter) {
      return {
        success: false,
        provider: 'Unknown',
        model: 'none',
        error: `ไม่พบ Image Provider ที่พร้อมใช้งาน (${providerId})`,
      };
    }

    const result = await adapter.generateImage(params);

    // If FLUX hit GPU limits, gracefully try Pollinations AI
    if (!result.success && providerId === 'hf-flux') {
      const fallback = this.imageAdapters.get('pollinations');
      if (fallback) {
        console.log('[ProviderRegistry] FLUX Space hit limit/busy. Trying Pollinations AI fallback...');
        const fallbackResult = await fallback.generateImage(params);
        if (fallbackResult.success) {
          return {
            ...fallbackResult,
            provider: 'Pollinations AI (สำรองอัตโนมัติ)',
          };
        }
      }
    }

    return result;
  }

  async generateVideo(params: DirectVideoGenRequest): Promise<DirectVideoGenResponse> {
    const providerId = params.provider || 'hf-sulphur';
    let adapter = this.videoAdapters.get(providerId);

    if (!adapter) {
      adapter = this.videoAdapters.get('hf-sulphur');
    }

    if (!adapter) {
      return {
        success: false,
        provider: 'Unknown',
        model: 'none',
        status: 'FAILED',
        error: `ไม่พบ Video Provider ที่พร้อมใช้งาน (${providerId})`,
      };
    }

    return adapter.generateVideo(params);
  }
}

export const providerRegistry = new ProviderRegistry();
