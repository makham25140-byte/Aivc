import React, { useState } from 'react';
import { X, CheckCircle, ExternalLink, Sparkles, Video, Mic, Scissors, Image as ImageIcon, Gift, ArrowRight } from 'lucide-react';

interface FreePipelineGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FreePipelineGuideModal: React.FC<FreePipelineGuideModalProps> = ({ isOpen, onClose }) => {
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  if (!isOpen) return null;

  const toggleStep = (step: number) => {
    if (completedSteps.includes(step)) {
      setCompletedSteps(completedSteps.filter((s) => s !== step));
    } else {
      setCompletedSteps([...completedSteps, step]);
    }
  };

  const FREE_TOOLS = [
    {
      category: '1. สร้างภาพนิ่งต้นฉบับ (Free Text-to-Image)',
      icon: ImageIcon,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
      description: 'ใช้ Image Prompt ภาษาอังกฤษจากตาราง Storyboard เพื่อเจนภาพนิ่งความละเอียดสูง',
      tools: [
        {
          name: 'Bing Image Creator (Copilot)',
          url: 'https://copilot.microsoft.com/images/create',
          freeTier: 'ฟรี 100% ด้วยบัญชี Microsoft (DALL-E 3 คุณภาพสูง)',
          tips: 'คัดลอก Positive Prompt จากแถบ Image Prompt ไปวางได้ทันที'
        },
        {
          name: 'SeaArt.ai',
          url: 'https://www.seaart.ai',
          freeTier: 'ให้ 150 เหรียญฟรีทุกวัน (รองรับ Flux.1 และ SDXL)',
          tips: 'มีฟังก์ชัน Face Swapping / Reference Image สำหรับล็อคหน้าตัวละคร'
        },
        {
          name: 'Tensor.art',
          url: 'https://tensor.art',
          freeTier: 'ฟรี 100 เครดิตต่อวัน รีเซ็ตทุกวัน',
          tips: 'มีโมเดลสมจริงและภาพแนวภาพยนตร์ให้เลือกหลากหลาย'
        },
        {
          name: 'Recraft.ai',
          url: 'https://www.recraft.ai',
          freeTier: 'เครดิตฟรีต่อวันสำหรับ Vector, 3D และภาพสมจริง',
          tips: 'เหมาะมากสำหรับงานสไตล์มินิมอลและโมเดิร์น'
        }
      ]
    },
    {
      category: '2. ขยับภาพนิ่งเป็นวิดีโอ (Free Image-to-Video Motion)',
      icon: Video,
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
      description: 'นำภาพจากข้อ 1 มาอัปโหลดในโหมด Image-to-Video แล้วใส่ Motion Prompt',
      tools: [
        {
          name: 'Kling AI (klingai.com)',
          url: 'https://klingai.com',
          freeTier: 'แจกฟรี 66 เครดิตทุกวัน (เจนได้ประมาณ 6 คลิป 5 วินาทีต่อวัน)',
          tips: 'ความลื่นไหลสูงมาก รองรับภาษาอังกฤษ แนะนำตั้งค่า Motion Strength ระดับ 4-6'
        },
        {
          name: 'Haiper 2.0 (haiper.ai)',
          url: 'https://haiper.ai',
          freeTier: 'มีเครดิตฟรีต่อวัน คมชัดระดับ HD',
          tips: 'เหมาะสำหรับช็อตซูมเข้าและแพนกล้องช้าๆ'
        },
        {
          name: 'Luma Dream Machine',
          url: 'https://lumalabs.ai/dream-machine',
          freeTier: 'ฟรีประมาณ 30 เจนเนอเรชันต่อเดือน',
          tips: 'มุมกล้อง 3D Cinematic หมุนวน (Orbit) ทำได้สวยงามมาก'
        },
        {
          name: 'Pika Labs (pika.art)',
          url: 'https://pika.art',
          freeTier: 'มีเครดิตเริ่มต้นฟรี',
          tips: 'ขยับริมฝีปากและโมชันตัวละครได้ดี'
        }
      ]
    },
    {
      category: '3. เจนเสียงพากย์ภาษาไทย (Free Thai Voiceover)',
      icon: Mic,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      description: 'แปลงบทพากย์ภาษาไทยในแต่ละช็อตให้เป็นเสียงคนพูดแบบธรรมชาติ',
      tools: [
        {
          name: 'CapCut Text-to-Speech ภาษาไทย',
          url: 'https://www.capcut.com',
          freeTier: 'ฟรี 100% ไม่จำกัดคำ (มีทั้งในมือถือและ Desktop PC)',
          tips: 'มีเสียงผู้หญิงน่ารัก, เสียงผู้ชายทางการ, และเสียงนักเล่าเรื่องภาษาไทยที่นิยมบน TikTok'
        },
        {
          name: 'Edge-TTS (Microsoft Natural Voice)',
          url: 'https://github.com/rany2/edge-tts',
          freeTier: 'ฟรี 100% โอเพนซอร์ส เสียงไทยธรรมชาติสูง (Premwadee / Niwat)',
          tips: 'ใช้อ่านบทสคริปต์ยาวๆ ได้ฟรีไม่มีค่าใช้จ่าย'
        },
        {
          name: 'ElevenLabs (Free Plan)',
          url: 'https://elevenlabs.io',
          freeTier: '10,000 ตัวอักษรต่อเดือนฟรี',
          tips: 'เสียงพากย์ภาษาไทยที่เปี่ยมด้วยอารมณ์และจังหวะหายใจ'
        }
      ]
    },
    {
      category: '4. ตัดต่อและใส่ซับไตเติล (Free Video Assembly)',
      icon: Scissors,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      description: 'นำคลิปและเสียงทั้งหมดมารวมกันบนไทม์ไลน์เดียว',
      tools: [
        {
          name: 'CapCut (Desktop & Mobile)',
          url: 'https://www.capcut.com',
          freeTier: 'ฟรี 100% ส่งออกได้ถึง 4K (ลบลายน้ำท้ายคลิปได้ฟรี)',
          tips: 'กด Auto Captions ภาษาไทย เจนซับพร้อมใส่แอนิเมชันคำเด้งได้ในคลิกเดียว'
        },
        {
          name: 'DaVinci Resolve (เวอร์ชันฟรี)',
          url: 'https://www.blackmagicdesign.com/products/davinciresolve',
          freeTier: 'โปรแกรมตัดต่อระดับภาพยนตร์ฟรี 100% ไม่มีลายน้ำ',
          tips: 'ปรับสี (Color Grading) และมิกซ์เสียง Fairlight ได้อย่างมืออาชีพ'
        }
      ]
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-850 rounded-2xl max-w-4xl w-full my-8 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>แผนภาพระบบการผลิตวิดีโอ AI รุ่นแรก (ฟรี 100% โดยไม่ต้องเสียเงิน)</span>
              </h3>
              <p className="text-xs text-slate-400">
                คู่มือการเชื่อมต่อเครื่องมือฟรีทีละขั้นตอน เพื่อนำ Blueprint ไปสร้างเป็นไฟล์วิดีโอจริง
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
          {/* Workflow Checklist Overview */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="font-bold text-white text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>ขั้นตอนปฏิบัติจริง 4 ขั้นตอน (Interactive Checklist)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { step: 1, title: '1. เจนภาพนิ่งทั้งหมด', desc: 'คัดลอก Image Prompt ไป Bing / SeaArt' },
                { step: 2, title: '2. ขยับเป็นคลิปวิดีโอ', desc: 'นำรูปไปใส่ Kling / Haiper + Motion Prompt' },
                { step: 3, title: '3. เจนเสียงพากย์ไทย', desc: 'ใช้ CapCut AI Voice หรือ Edge-TTS' },
                { step: 4, title: '4. ตัดต่อใน CapCut', desc: 'จัดเรียงตามลำดับ Shot 1..N + ซับ Auto' },
              ].map((item) => (
                <button
                  key={item.step}
                  onClick={() => toggleStep(item.step)}
                  className={`text-left p-3 rounded-xl border transition flex flex-col justify-between ${
                    completedSteps.includes(item.step)
                      ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-white">{item.title}</span>
                    <CheckCircle
                      className={`w-4 h-4 ${
                        completedSteps.includes(item.step)
                          ? 'text-emerald-400 fill-emerald-400/20'
                          : 'text-slate-600'
                      }`}
                    />
                  </div>
                  <div className="text-[11px] text-slate-400 leading-tight">
                    {item.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Detailed Free Tools Matrix */}
          <div className="space-y-6">
            {FREE_TOOLS.map((cat, idx) => {
              const Icon = cat.icon;
              return (
                <div key={idx} className="bg-slate-950/80 rounded-xl border border-slate-800 p-5 space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center border ${cat.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">{cat.category}</h4>
                      <p className="text-[11px] text-slate-400">{cat.description}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    {cat.tools.map((tool, tIdx) => (
                      <div
                        key={tIdx}
                        className="bg-slate-900/90 p-3 rounded-xl border border-slate-800/80 hover:border-slate-700 transition space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-xs">{tool.name}</span>
                          <a
                            href={tool.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 text-[10px]"
                          >
                            <span>เปิดเว็บ</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>
                        <div className="text-[11px] text-emerald-400 font-medium">
                          🎁 {tool.freeTier}
                        </div>
                        <div className="text-[11px] text-slate-400 italic">
                          💡 เทคนิค: {tool.tips}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Long-term Roadmap to Full AI Video Automation */}
          <div className="bg-gradient-to-r from-indigo-950/40 via-slate-950 to-slate-950 p-5 rounded-xl border border-indigo-500/30 space-y-2">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>เป้าหมายระยะยาว: พัฒนาเป็นระบบ AI Video Creator อัตโนมัติ</span>
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              ในเวอร์ชันนี้ ระบบทำหน้าที่เป็น <strong>AI Director</strong> ที่สร้าง Blueprint, Prompts, ล็อคตัวละคร
              และวางไทม์ไลน์ได้อย่างสมบูรณ์แบบ 100% สำหรับการผลิตผ่านเครื่องมือฟรี
              ในอนาคต ระบบนี้สามารถต่อยอดโดยเชื่อมต่อ API ของเครื่องมือสร้างภาพ (Flux/Stable Diffusion WebUI),
              API ขยับภาพ (Kling API / ComfyUI Video), และระบบตัดต่ออัตโนมัติ (FFmpeg / MoviePy)
              เพื่อเรนเดอร์เป็นไฟล์ mp4 ได้ในคลิกเดียวโดยผู้ใช้ไม่ต้องทำเอง!
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            เสร็จสิ้นแล้ว {completedSteps.length}/4 ขั้นตอน
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium text-xs transition"
          >
            เข้าใจแล้ว & ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
