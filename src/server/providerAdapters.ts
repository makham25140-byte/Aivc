import { GoogleGenAI } from '@google/genai';
import {
  DirectImageGenRequest,
  DirectImageGenResponse,
  DirectVideoGenRequest,
  DirectVideoGenResponse,
  ProviderStatusInfo,
} from '../types/director.js';

// -------------------------------------------------------------
// Provider Adapter Interfaces (Feature 4: Provider Adapters)
// -------------------------------------------------------------

export interface ImageProviderAdapter {
  id: string;
  name: string;
  tier: 'Free Tier' | 'Paid Tier Required' | 'API Key Required';
  checkAvailability(): Promise<ProviderStatusInfo>;
  generateImage(params: DirectImageGenRequest): Promise<DirectImageGenResponse>;
}

export interface VideoProviderAdapter {
  id: string;
  name: string;
  tier: 'Free Tier' | 'Paid Tier Required' | 'API Key Required';
  checkAvailability(): Promise<ProviderStatusInfo>;
  generateVideo(params: DirectVideoGenRequest): Promise<DirectVideoGenResponse>;
}

// -------------------------------------------------------------
// Image Provider 1: Google Gemini Image Adapter
// -------------------------------------------------------------

export class GoogleGeminiImageAdapter implements ImageProviderAdapter {
  id = 'google-gemini';
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
      isAvailable: false, // Verified: Google AI Studio imposes limit 0 for image gen on Free Tier
      tier: this.tier,
      statusMessage: hasKey
        ? 'ต้องการ Google Cloud Billing (Free Tier โควตา = 0 สำหรับ Image Models)'
        : 'ยังไม่ได้ตั้งค่า GEMINI_API_KEY',
      setupInstructions:
        'หากต้องการใช้ Google Gemini สร้างภาพโดยตรง กรุณาเปิดใช้งาน Billing ใน Google Cloud Project หรือใช้ Paid API Key ใน Google AI Studio',
    };
  }

  async generateImage(params: DirectImageGenRequest): Promise<DirectImageGenResponse> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        success: false,
        provider: this.name,
        model: 'gemini-3.1-flash-lite-image',
        error: 'ยังไม่ได้ระบุ GEMINI_API_KEY บนเซิร์ฟเวอร์ (Missing Credentials)',
        setupInstructions: 'กรุณาระบุ GEMINI_API_KEY ในสภาพแวดล้อมระบบ หรือใช้ทางเลือกสร้างภาพฟรีภายนอก เช่น Bing Image Creator',
      };
    }

    // Include relevant character descriptions into the prompt if provided
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

    const candidateModels = [
      'gemini-3.1-flash-lite-image',
      'gemini-3.1-flash-image',
      'gemini-2.5-flash-image',
      'gemini-nano-banana-2.1',
    ];

    let lastError: any = null;

    for (const model of candidateModels) {
      try {
        console.log(`[GoogleGeminiImageAdapter] Attempting generation with model: ${model}...`);
        const response = await this.ai.models.generateContent({
          model,
          contents: {
            parts: [{ text: enrichedPrompt }],
          },
          config: {
            imageConfig: {
              aspectRatio: params.aspectRatio || '9:16',
            },
          },
        });

        // Check if response contains candidates
        if (!response || !response.candidates || response.candidates.length === 0) {
          return {
            success: false,
            provider: this.name,
            model,
            error: 'โมเดลไม่สามารถสร้างภาพตามคำสั่งนี้ได้ หรือถูกบล็อกโดยตัวกรองความปลอดภัย (Invalid Response / Safety Filter)',
          };
        }

        // Search for image in parts
        for (const part of response.candidates[0]?.content?.parts || []) {
          if (part.inlineData?.data) {
            const mime = part.inlineData.mimeType || 'image/png';
            const imageUrl = `data:${mime};base64,${part.inlineData.data}`;
            console.log(`[GoogleGeminiImageAdapter] Model ${model} generated image successfully!`);
            return {
              success: true,
              imageUrl,
              provider: this.name,
              model,
            };
          }
        }
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || String(err);

        // 1. Handle HTTP 429 / Quota limit 0
        if (errMsg.includes('Quota exceeded') || errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED')) {
          console.log(`[GoogleGeminiImageAdapter] Model ${model} requires paid billing key (Free tier quota limit: 0)`);
          return {
            success: false,
            provider: this.name,
            model,
            error:
              'โมเดลสร้างภาพของ Google AI Studio มีโควตาเป็น 0 ใน Free Tier (HTTP 429 Quota Exceeded / Limit 0)',
            requirementsNotice:
              'Google AI Studio กำหนดให้ต้องผูกบัญชี Billing (Paid API Key) เพื่อเข้าถึงโมเดลสร้างภาพ Imagen / Gemini Image โดยตรงในระบบ',
            setupInstructions:
              'ทางเลือกใช้งานฟรี 100% (No-Cost Alternatives):\n1. คัดลอก Prompt จากฉากนี้ไปเปิดใช้ใน Bing Image Creator (DALL-E 3 ฟรี) หรือ SeaArt.ai\n2. บันทึกรูปภาพแล้วใช้ปุ่ม "Upload / Attach" นำภาพกลับเข้ามาผูกกับฉากนี้ได้ทันที\n3. ระบบไม่บังคับให้ผูกบัตรเครดิตหรือเปิดใช้บริการเสียเงินใดๆ',
          };
        }

        // 2. Handle HTTP 503 / Service Unavailable
        if (errMsg.includes('503') || errMsg.includes('UNAVAILABLE') || errMsg.includes('Service Unavailable')) {
          return {
            success: false,
            provider: this.name,
            model,
            error: 'บริการสร้างภาพของเซิร์ฟเวอร์ AI กำลังมีผู้ใช้งานหนาแน่นชั่วคราว (HTTP 503 Service Unavailable) กรุณากดลองใหม่อีกครั้ง',
          };
        }

        // 3. Handle Network Errors
        if (errMsg.includes('ENOTFOUND') || errMsg.includes('ECONNREFUSED') || errMsg.includes('fetch failed') || errMsg.includes('NetworkError')) {
          return {
            success: false,
            provider: this.name,
            model,
            error: 'เกิดข้อผิดพลาดในการเชื่อมต่อเครือข่ายไปยังเซิร์ฟเวอร์สร้างภาพ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต (Network Error)',
          };
        }

        // 4. Handle Generation Timeout
        if (errMsg.includes('timeout') || errMsg.includes('ETIMEDOUT') || errMsg.includes('DEADLINE_EXCEEDED')) {
          return {
            success: false,
            provider: this.name,
            model,
            error: 'การสร้างภาพใช้เวลานานเกินกำหนดและหมดเวลาเชื่อมต่อ (Generation Timeout) กรุณากดลองใหม่อีกครั้ง',
          };
        }

        // 5. Handle Unsupported Model
        if (errMsg.includes('not found') || errMsg.includes('is not supported') || errMsg.includes('404')) {
          console.warn(`[GoogleGeminiImageAdapter] Model ${model} unsupported:`, errMsg.slice(0, 80));
          continue; // Try next candidate
        }

        console.log(`[GoogleGeminiImageAdapter] Model ${model} note:`, errMsg.slice(0, 100));
      }
    }

    const lastErrMsg = lastError?.message || String(lastError || 'ไม่สามารถสร้างภาพได้');
    return {
      success: false,
      provider: this.name,
      model: 'gemini-3.1-flash-lite-image',
      error: `ไม่สามารถสร้างภาพผ่าน Google Gemini ได้: ${lastErrMsg}`,
      requirementsNotice: 'ต้องเปิดใช้ Google Cloud Billing บน Google AI Studio',
    };
  }
}

// -------------------------------------------------------------
// Image Provider 2: Custom API Provider Adapter (OpenAI / Stability / Custom)
// -------------------------------------------------------------

export class CustomImageProviderAdapter implements ImageProviderAdapter {
  id = 'custom-api';
  name = 'Custom Image API (DALL-E / Stability / Webhook)';
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
        'ตั้งค่า OPENAI_API_KEY หรือ IMAGE_PROVIDER_URL ในไฟล์ .env บนเซิร์ฟเวอร์เพื่อเปิดใช้งานการสร้างภาพอัตโนมัติ',
    };
  }

  async generateImage(params: DirectImageGenRequest): Promise<DirectImageGenResponse> {
    const openAiKey = process.env.OPENAI_API_KEY;
    const providerUrl = process.env.IMAGE_PROVIDER_URL;

    if (!openAiKey && !providerUrl) {
      return {
        success: false,
        provider: this.name,
        model: 'Custom/OpenAI',
        error: 'ยังไม่ได้ตั้งค่า API Key สำหรับ Custom Image Provider',
        setupInstructions:
          'ตั้งค่า OPENAI_API_KEY หรือ IMAGE_PROVIDER_URL ใน Environment Variables บนเซิร์ฟเวอร์เพื่อเปิดใช้งาน',
      };
    }

    if (openAiKey) {
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
    }

    return {
      success: false,
      provider: this.name,
      model: 'unknown',
      error: 'ยังไม่ได้ระบุ endpoint ที่รองรับ',
    };
  }
}

// -------------------------------------------------------------
// Video Provider 1: Google Veo Video Adapter
// -------------------------------------------------------------

export class GoogleVeoVideoAdapter implements VideoProviderAdapter {
  id = 'google-veo';
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
      isAvailable: false, // Verified: Google Veo video models require Paid Billing Tier (limit 0 on free tier)
      tier: this.tier,
      statusMessage: hasKey
        ? 'ต้องการ Google Cloud Billing (Free Tier โควตา = 0 สำหรับ Veo Video)'
        : 'ยังไม่ได้ตั้งค่า GEMINI_API_KEY',
      setupInstructions:
        'โมเดล Google Veo ไม่เปิดให้ใช้งานบน Free Tier ต้องมีบัญชี Google Cloud Billing เชื่อมต่อกับ Google AI Studio',
    };
  }

  async generateVideo(params: DirectVideoGenRequest): Promise<DirectVideoGenResponse> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        success: false,
        provider: this.name,
        model: 'veo-3.1-lite-generate-preview',
        status: 'REQUIRES_CONFIGURATION',
        error: 'ยังไม่ได้ตั้งค่า GEMINI_API_KEY บนเซิร์ฟเวอร์',
        requirementsNotice: 'ต้องระบุ GEMINI_API_KEY ที่มีสิทธิ์ใช้งานโมเดล Veo',
        setupInstructions: 'กรุณาระบุ GEMINI_API_KEY ใน Environment Variables ของเซิร์ฟเวอร์',
      };
    }

    try {
      console.log(`[GoogleVeoVideoAdapter] Calling generateVideos (Image-to-Video: ${Boolean(params.imageUrl)})...`);
      
      const payload: any = {
        model: 'veo-3.1-lite-generate-preview',
        prompt: params.prompt,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '16:9',
        },
      };

      // Support Image-to-Video (Animate Reference Image)
      if (params.imageUrl) {
        if (params.imageUrl.startsWith('data:')) {
          const match = params.imageUrl.match(/^data:([^;]+);base64,(.+)$/);
          if (match) {
            payload.image = {
              mimeType: match[1],
              imageBytes: match[2],
            };
          }
        }
      }

      const response: any = await this.ai.models.generateVideos(payload);

      if (response?.videoUri || response?.videoUrl) {
        return {
          success: true,
          videoUrl: response.videoUri || response.videoUrl,
          provider: this.name,
          model: 'veo-3.1-lite-generate-preview',
          status: 'COMPLETED',
        };
      }

      if (response?.name) {
        return {
          success: true,
          taskId: response.name,
          provider: this.name,
          model: 'veo-3.1-lite-generate-preview',
          status: 'PENDING',
        };
      }

      return {
        success: false,
        provider: this.name,
        model: 'veo-3.1-lite-generate-preview',
        status: 'FAILED',
        error: 'โมเดล Veo ไม่ได้ส่งคืนผลลัพธ์วิดีโอ',
      };
    } catch (err: any) {
      const errMsg = err?.message || String(err);

      if (errMsg.includes('Quota exceeded') || errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED')) {
        console.log('[GoogleVeoVideoAdapter] Veo generation requires paid billing key (Free tier quota limit: 0)');
        return {
          success: false,
          provider: this.name,
          model: 'veo-3.1-lite-generate-preview',
          status: 'REQUIRES_CONFIGURATION',
          error: 'โมเดล Google Veo ต้องใช้ Paid Billing Tier (Free Tier โควตา = 0)',
          requirementsNotice:
            'Google AI Studio กำหนดให้ต้องมีบัญชี Google Cloud Billing หรือ Paid API Key เพื่อเข้าถึงโมเดลสร้างวิดีโอ Veo 3.1',
          setupInstructions:
            'ข้อกำหนดเพื่อเปิดใช้งาน:\n1. เลือก Paid API Key ผ่านระบบ AI Studio\n2. ไปที่ Google AI Studio (ai.google.dev) -> Settings -> Billing\n3. ผูกบัญชี Google Cloud Billing กับโปรเจกต์',
        };
      }

      if (errMsg.includes('503') || errMsg.includes('UNAVAILABLE')) {
        return {
          success: false,
          provider: this.name,
          model: 'veo-3.1-lite-generate-preview',
          status: 'FAILED',
          error: 'บริการ Veo กำลังมีผู้ใช้งานหนาแน่นชั่วคราว (HTTP 503 Service Unavailable) กรุณาลองใหม่อีกครั้งในภายหลัง',
        };
      }

      if (errMsg.includes('timeout') || errMsg.includes('ETIMEDOUT')) {
        return {
          success: false,
          provider: this.name,
          model: 'veo-3.1-lite-generate-preview',
          status: 'FAILED',
          error: 'การเชื่อมต่อไปยังโมเดล Veo หมดเวลา (Request Timeout)',
        };
      }

      return {
        success: false,
        provider: this.name,
        model: 'veo-3.1-lite-generate-preview',
        status: 'FAILED',
        error: errMsg,
      };
    }
  }
}

// -------------------------------------------------------------
// Video Provider 2: External Video Provider Adapter (Kling / Runway / Replicate)
// -------------------------------------------------------------

export class ExternalVideoProviderAdapter implements VideoProviderAdapter {
  id = 'external-api';
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
        'ตั้งค่า REPLICATE_API_TOKEN หรือ KLING_API_KEY ในไฟล์ .env บนเซิร์ฟเวอร์เพื่อเปิดใช้งานการสร้างวิดีโออัตโนมัติ',
    };
  }

  async generateVideo(params: DirectVideoGenRequest): Promise<DirectVideoGenResponse> {
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
          'ตั้งค่า REPLICATE_API_TOKEN หรือ KLING_API_KEY ในสภาพแวดล้อมระบบเพื่อเปิดใช้งานการเจนคลิปอัตโนมัติ',
      };
    }

    return {
      success: false,
      provider: this.name,
      model: 'External Video API',
      status: 'REQUIRES_CONFIGURATION',
      error: 'อยู่ระหว่างการเชื่อมต่อ API ของผู้ให้บริการ',
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
    const googleImage = new GoogleGeminiImageAdapter();
    const customImage = new CustomImageProviderAdapter();
    this.imageAdapters.set(googleImage.id, googleImage);
    this.imageAdapters.set(customImage.id, customImage);

    const googleVeo = new GoogleVeoVideoAdapter();
    const externalVideo = new ExternalVideoProviderAdapter();
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
    const providerId = params.provider || 'google-gemini';
    const adapter = this.imageAdapters.get(providerId) || this.imageAdapters.get('google-gemini');

    if (!adapter) {
      return {
        success: false,
        provider: 'Unknown',
        model: 'none',
        error: `ไม่พบ Image Provider: ${providerId}`,
      };
    }

    return adapter.generateImage(params);
  }

  async generateVideo(params: DirectVideoGenRequest): Promise<DirectVideoGenResponse> {
    const providerId = params.provider || 'google-veo';
    const adapter = this.videoAdapters.get(providerId) || this.videoAdapters.get('google-veo');

    if (!adapter) {
      return {
        success: false,
        provider: 'Unknown',
        model: 'none',
        status: 'FAILED',
        error: `ไม่พบ Video Provider: ${providerId}`,
      };
    }

    return adapter.generateVideo(params);
  }
}

export const providerRegistry = new ProviderRegistry();
