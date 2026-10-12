import React, { useState } from 'react';
import {
  Smartphone,
  Cpu,
  Layers,
  ArrowRight,
  CheckCircle2,
  Copy,
  Check,
  Download,
  Terminal,
  Play,
  Film,
  Zap,
  ShieldCheck,
  AlertTriangle,
  FolderTree,
  ExternalLink,
  Code2,
  FileVideo,
  Sparkles,
  Scissors
} from 'lucide-react';
import { ProductionBlueprint } from '../types/director';

interface AndroidArchitectureHubProps {
  blueprint: ProductionBlueprint;
}

export const AndroidArchitectureHub: React.FC<AndroidArchitectureHubProps> = ({ blueprint }) => {
  const [activeApproach, setActiveApproach] = useState<'nocode' | 'colab'>('nocode');
  const [copiedScript, setCopiedScript] = useState(false);
  const [checkedSteps, setCheckedSteps] = useState<number[]>([1]);

  const toggleCheck = (step: number) => {
    if (checkedSteps.includes(step)) {
      setCheckedSteps(checkedSteps.filter((s) => s !== step));
    } else {
      setCheckedSteps([...checkedSteps, step]);
    }
  };

  // Ready-to-run Python Automation script for Google Colab (Run from Android browser for free!)
  const pythonColabScript = `# ==============================================================
# AI Video Creator - Python Auto-Assembly (Google Colab Free)
# รันบนมือถือ Android ผ่าน Google Colab ฟรี 100% (ไม่ใช้ n8n)
# ความสามารถ: เจนเสียงพากย์ไทยด้วย Edge-TTS + ประกอบคลิปด้วย MoviePy
# ==============================================================

# 1. ติดตั้งไลบรารีฟรีที่จำเป็น
!pip install -q edge-tts moviepy requests pillow

import os
import asyncio
import edge_tts
from moviepy.editor import ImageClip, AudioFileClip, concatenate_videoclips

# ข้อมูลจาก Blueprint: ${blueprint.projectTitle}
shots_data = [
${blueprint.shots
  .map(
    (s) =>
      `    {"shot": ${s.shotNumber}, "duration": ${s.durationSec}, "text": "${s.audioDesign.thaiVoiceover.replace(/"/g, '\\"')}", "image_url": "https://image.pollinations.ai/prompt/${encodeURIComponent(s.imagePrompt.positivePromptEn.slice(0, 150))}?width=720&height=1280&nologo=true"}`
  )
  .join(',\n')}
]

os.makedirs("assets/audio", exist_ok=True)
os.makedirs("assets/images", exist_ok=True)
os.makedirs("output", exist_ok=True)

# 2. ฟังก์ชันดาวน์โหลดภาพจาก Pollinations.ai (ฟรี 100% ไม่ต้องใช้ API Key)
import requests
print("กำลังดาวน์โหลดภาพประกอบอัตโนมัติ...")
for item in shots_data:
    img_path = f"assets/images/shot_{item['shot']}.jpg"
    if not os.path.exists(img_path):
        res = requests.get(item["image_url"])
        with open(img_path, "wb") as f:
            f.write(res.content)
print("ดาวน์โหลดภาพครบถ้วน!")

# 3. เจนเสียงพากย์ภาษาไทยด้วย Edge-TTS (ฟรี ไม่จำกัดคำ)
async def generate_voice(text, filename):
    communicate = edge_tts.Communicate(text, voice="th-TH-PremwadeeNeural") # เสียงหญิงธรรมชาติ
    # หรือ voice="th-TH-NiwatNeural" สำหรับเสียงผู้ชาย
    await communicate.save(filename)

async def build_all_voices():
    print("กำลังเจนเสียงพากย์ภาษาไทย...")
    for item in shots_data:
        audio_path = f"assets/audio/shot_{item['shot']}.mp3"
        await generate_voice(item["text"], audio_path)
    print("เจนเสียงพากย์เสร็จสมบูรณ์!")

# รันสร้างเสียง
import nest_asyncio
nest_asyncio.apply()
asyncio.run(build_all_voices())

# 4. ประกอบร่างวิดีโอ (Assembly) เป็น MP4 แนวตั้ง 9:16
print("กำลังตัดต่อรวมคลิปวิดีโอ (Render Engine)...")
clips = []
for item in shots_data:
    img_path = f"assets/images/shot_{item['shot']}.jpg"
    audio_path = f"assets/audio/shot_{item['shot']}.mp3"
    
    audio_clip = AudioFileClip(audio_path)
    # ตั้งความยาวภาพให้ตรงกับความยาวเสียงพากย์จริง
    clip_duration = max(audio_clip.duration, item["duration"])
    
    img_clip = ImageClip(img_path).set_duration(clip_duration).set_audio(audio_clip)
    clips.append(img_clip)

final_video = concatenate_videoclips(clips, method="compose")
final_output_path = "output/final_ai_video.mp4"
final_video.write_videofile(final_output_path, fps=24, codec="libx264", audio_codec="aac")

print(f"🎉 สร้างวิดีโอสำเร็จแล้ว! ดาวน์โหลดไฟล์ได้ที่: {final_output_path}")

# ดาวน์โหลดไฟล์ลงเครื่อง Android อัตโนมัติ
from google.colab import files
files.download(final_output_path)
`;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(pythonColabScript);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Top Banner: Core Architecture Promise */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-indigo-950/40 border border-emerald-500/30 rounded-2xl p-6 shadow-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>สถาปัตยกรรม AI Video Creator บน Android + เว็บฟรี (ไม่ใช้ n8n)</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Zero-Cost V1
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                ออกแบบระบบให้ทำงานได้จริงบนโทรศัพท์เครื่องเดียว โดยไม่ต้องเช่า VPS, ไม่ต้องเปิดคอมพิวเตอร์ และไม่ต้องจ่ายค่าบริการซอฟต์แวร์
              </p>
            </div>
          </div>

          {/* Approach Switcher */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveApproach('nocode')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                activeApproach === 'nocode'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              แนวทางที่ 1: แอปมือถือ No-Code (ง่ายสุด)
            </button>
            <button
              onClick={() => setActiveApproach('colab')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                activeApproach === 'colab'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              แนวทางที่ 2: สคริปต์อัตโนมัติบน Google Colab ฟรี
            </button>
          </div>
        </div>

        {/* Why Not n8n Comparison Alert */}
        <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/80 text-xs text-slate-300 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="text-white">ทำไมระบบนี้ถึงไม่ใช้ n8n?</strong>{' '}
            n8n ต้องติดตั้งบน Docker หรือ Server VPS ซึ่งมีค่าใช้จ่ายรายเดือน และรันบนมือถือ Android โดยตรงไม่ได้{' '}
            ระบบที่เราออกแบบนี้จึงใช้ <strong className="text-emerald-400">Google Gemini (สมองบนเว็บ)</strong> +{' '}
            <strong className="text-amber-400">Kling / Copilot (เจนวัตถุดิบฟรี)</strong> +{' '}
            <strong className="text-rose-400">CapCut Mobile หรือ Google Colab Free (ตัดต่อ)</strong>{' '}
            ซึ่งทำงานได้บน Android 100% ฟรีตลอดชีพ
          </div>
        </div>
      </div>

      {/* 5-Layer System Architecture Diagram */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            แผนภาพโครงสร้างระบบ 5 ส่วนประกอบ (System Layer Breakdown)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {/* Layer 1 */}
          <div className="bg-slate-950 p-4 rounded-xl border border-indigo-900/40 space-y-2 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-indigo-400 font-mono">LAYER 1</span>
              <h4 className="text-xs font-bold text-white mt-1">Brain & Director</h4>
              <p className="text-[11px] text-slate-400 mt-1">
                วิเคราะห์ไอเดีย, เขียนบท, ล็อคตัวละคร, และแจกแจง Prompts
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-850">
              <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 block text-center font-semibold">
                Google AI Studio / Gemini Web
              </span>
            </div>
          </div>

          {/* Layer 2 */}
          <div className="bg-slate-950 p-4 rounded-xl border border-amber-900/40 space-y-2 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-amber-400 font-mono">LAYER 2</span>
              <h4 className="text-xs font-bold text-white mt-1">Image Generation</h4>
              <p className="text-[11px] text-slate-400 mt-1">
                เจนภาพนิ่งความละเอียดสูงด้วย Prompt ล็อคหน้าตาและชุด
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-850">
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 block text-center font-semibold">
                Bing Copilot / SeaArt App
              </span>
            </div>
          </div>

          {/* Layer 3 */}
          <div className="bg-slate-950 p-4 rounded-xl border border-rose-900/40 space-y-2 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-rose-400 font-mono">LAYER 3</span>
              <h4 className="text-xs font-bold text-white mt-1">Video Motion</h4>
              <p className="text-[11px] text-slate-400 mt-1">
                เปลี่ยนภาพนิ่งเป็นคลิปวิดีโอ 5 วินาที ด้วยการขยับมุมกล้อง
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-850">
              <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20 block text-center font-semibold">
                Kling AI / Haiper Mobile
              </span>
            </div>
          </div>

          {/* Layer 4 */}
          <div className="bg-slate-950 p-4 rounded-xl border border-emerald-900/40 space-y-2 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-emerald-400 font-mono">LAYER 4</span>
              <h4 className="text-xs font-bold text-white mt-1">Voice & Sound</h4>
              <p className="text-[11px] text-slate-400 mt-1">
                แปลงบทพากย์เป็นเสียงพูดภาษาไทย + ดนตรี BGM / SFX
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-850">
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 block text-center font-semibold">
                CapCut TTS / Edge-TTS
              </span>
            </div>
          </div>

          {/* Layer 5 */}
          <div className="bg-slate-950 p-4 rounded-xl border border-purple-900/40 space-y-2 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-purple-400 font-mono">LAYER 5</span>
              <h4 className="text-xs font-bold text-white mt-1">Assembly & Export</h4>
              <p className="text-[11px] text-slate-400 mt-1">
                เรียงช็อต, ซิงค์เสียง, ใส่ Auto Captions, เรนเดอร์เป็น MP4
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-850">
              <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 block text-center font-semibold">
                CapCut Mobile / Colab MoviePy
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* APPROACH 1: No-Code Mobile Pipeline (CapCut + Kling + Copilot) */}
      {activeApproach === 'nocode' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>ขั้นตอนการผลิตวิดีโอบน Android ทีละขั้น (No-Code Workflow)</span>
              </h3>
              <p className="text-xs text-slate-400">
                ทำตามทีละข้อบนโทรศัพท์มือถือของคุณ ได้ไฟล์วิดีโอ 1080p พร้อมโพสต์ทันที
              </p>
            </div>

            <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold">
              เวลาเฉลี่ย: 10-15 นาที / คลิป
            </span>
          </div>

          {/* Step by step checklist */}
          <div className="space-y-4">
            {[
              {
                step: 1,
                title: 'ขั้นที่ 1: ติดตั้งแอปพลิเคชันฟรีลงในมือถือ Android',
                desc: 'ดาวน์โหลด 2 แอปฟรีจาก Google Play Store ได้แก่: 1) CapCut (สำหรับตัดต่อเสียงและซับไตเติล) และ 2) Microsoft Copilot หรือ SeaArt (สำหรับเจนภาพฟรี) หรือเปิดผ่าน Google Chrome',
                actionHint: 'เปิด Google Play Store แล้วพิมพ์ค้นหา "CapCut" และ "Copilot"',
              },
              {
                step: 2,
                title: 'ขั้นที่ 2: ดึง Prompts จากสตูดิโอนี้ (AI Director)',
                desc: 'กดปุ่ม "Export Prompts" ที่มุมขวาบนของหน้านี้ แล้วกด "คัดลอกทั้งหมด" ของ Image Prompts และ Motion Prompts เก็บไว้ในสมุดโน้ตบนมือถือ (เช่น Google Keep หรือ Samsung Notes)',
                actionHint: 'Prompts ทั้งหมดถูกแยกส่วน และมีคำสั่งล็อคตัวละคร (Consistency Lock) พร้อมแล้ว',
              },
              {
                step: 3,
                title: 'ขั้นที่ 3: เจนภาพนิ่งฟรีด้วย Bing Copilot หรือ SeaArt บนมือถือ',
                desc: 'เปิดแอป Copilot หรือเว็บ copilot.microsoft.com แล้ววาง Image Prompt ของ Shot 1 นำภาพที่ได้มาเซฟลง Gallery ในเครื่อง หากมีตัวละคร ให้จำหน้าตาไว้ หรือใช้ SeaArt โหมด Face Swap ล็อคหน้าสำหรับช็อตถัดไป',
                actionHint: 'อย่าลืมเลือกสัดส่วนภาพเป็น 9:16 สำหรับคลิปแนวตั้ง',
              },
              {
                step: 4,
                title: 'ขั้นที่ 4: ขยับภาพเป็นวิดีโอด้วย Kling AI (เว็บเบราว์เซอร์มือถือ)',
                desc: 'เข้าเว็บ klingai.com ผ่าน Chrome บนมือถือ ล็อกอินด้วยบัญชี Google ฟรี (ได้ 66 เครดิตทุกวัน) &rarr; ไปที่เมนู AI Video &rarr; อัปโหลดรูปภาพที่เจนไว้ &rarr; วาง Motion Prompt แล้วกด Generate คลิป 5 วินาที &rarr; ดาวน์โหลดลงเครื่อง',
                actionHint: 'ทำครบทุกช็อตตามตาราง Storyboard จะได้ไฟล์คลิป .mp4 ประมาณ 6-8 ไฟล์',
              },
              {
                step: 5,
                title: 'ขั้นที่ 5: ประกอบร่างและพากย์เสียงใน CapCut Mobile',
                desc: 'เปิดแอป CapCut &rarr; กด "โปรเจกต์ใหม่" &rarr; เลือกคลิปวิดีโอทั้งหมดเรียงตามลำดับ Shot 1 ถึง N &rarr; กดเมนู "ข้อความ" (Text) &rarr; วางบทพากย์ภาษาไทย &rarr; กด "แปลงข้อความเป็นเสียงพูด" (Text-to-Speech) เลือกเสียงภาษาไทย &rarr; ปรับความยาวคลิปให้ตรงกับเสียง &rarr; กด "คำบรรยายอัตโนมัติ" (Auto Captions) สร้างซับไตเติลภาษาไทยสวยงาม &rarr; Export เป็น 1080p!',
                actionHint: 'CapCut ลบลายน้ำท้ายคลิปได้ฟรี 100% โดยกดเลือกคลิปโลโก้ท้ายสุดแล้วกด "ลบ"',
              },
            ].map((s) => (
              <div
                key={s.step}
                onClick={() => toggleCheck(s.step)}
                className={`p-4 rounded-xl border transition cursor-pointer ${
                  checkedSteps.includes(s.step)
                    ? 'bg-emerald-950/20 border-emerald-500/40'
                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                      checkedSteps.includes(s.step)
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {checkedSteps.includes(s.step) ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : s.step}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="font-bold text-white text-xs sm:text-sm flex items-center justify-between">
                      <span>{s.title}</span>
                      {checkedSteps.includes(s.step) && (
                        <span className="text-[10px] text-emerald-400 font-medium">เสร็จแล้ว</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{s.desc}</p>
                    <div className="text-[11px] text-indigo-400 font-medium pt-1">
                      💡 {s.actionHint}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* APPROACH 2: Semi-Automated Colab / Python Pipeline */}
      {activeApproach === 'colab' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Terminal className="w-5 h-5 text-indigo-400" />
                <span>สคริปต์ประกอบคลิปอัตโนมัติบน Google Colab (รันผ่าน Android Chrome ฟรี)</span>
              </h3>
              <p className="text-xs text-slate-400">
                ไม่ต้องเขียนโค้ดเอง เพียงกดคัดลอกสคริปต์ด้านล่างนี้ไปวางใน Google Colab บนมือถือ แล้วกด Run!
              </p>
            </div>

            <button
              onClick={handleCopyScript}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/25 transition"
            >
              {copiedScript ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>คัดลอกสคริปต์แล้ว!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>คัดลอก Python Automation Script</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Steps for Colab on Android */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs space-y-2">
            <h4 className="font-bold text-white flex items-center gap-1.5 text-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>วิธีรันบนโทรศัพท์ Android ใน 3 ขั้นตอน:</span>
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-slate-300 pl-1">
              <li>
                เปิดเบราว์เซอร์ Chrome บน Android แล้วเข้าเว็บ{' '}
                <a
                  href="https://colab.research.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-400 underline font-mono"
                >
                  colab.research.google.com
                </a>{' '}
                (ล็อกอินด้วย Gmail ฟรี)
              </li>
              <li>กด "New Notebook" (สมุดบันทึกใหม่)</li>
              <li>วางสคริปต์ด้านล่างนี้ลงในช่องโค้ด แล้วกดปุ่ม <strong>Play (▶)</strong> สคริปต์จะดาวน์โหลดภาพ เจนเสียงไทย และเรนเดอร์คลิป .mp4 ส่งลงเครื่องมือถืออัตโนมัติ!</li>
            </ol>
          </div>

          {/* Script Code Block */}
          <div className="relative">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 overflow-x-auto max-h-96 font-mono text-[11px] text-slate-300 leading-relaxed">
              <pre>{pythonColabScript}</pre>
            </div>
          </div>
        </div>
      )}

      {/* Recommended Android Folder Structure */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <FolderTree className="w-5 h-5 text-amber-400" />
          <h4 className="text-sm font-bold text-white uppercase tracking-wider">
            โครงสร้างโฟลเดอร์ที่แนะนำบน Android / Google Drive (เพื่อความเป็นระเบียบ)
          </h4>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 space-y-1">
          <div className="text-indigo-400 font-bold">📁 My_AI_Video_Projects/</div>
          <div className="pl-4 text-slate-300">└── 📁 {blueprint.id}/</div>
          <div className="pl-8 text-slate-400">├── 📄 01_Story_Blueprint.txt &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(บันทึกบทและตารางช็อต)</div>
          <div className="pl-8 text-slate-400">├── 📁 02_Raw_Images/ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(ภาพนิ่งจาก Bing / SeaArt: shot_1.jpg..shot_6.jpg)</div>
          <div className="pl-8 text-slate-400">├── 📁 03_Video_Clips/ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(คลิปเคลื่อนไหวจาก Kling AI: shot_1.mp4..shot_6.mp4)</div>
          <div className="pl-8 text-slate-400">├── 📁 04_Voice_Audio/ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(ไฟล์เสียงพากย์ไทย)</div>
          <div className="pl-8 text-emerald-400 font-semibold">└── 🎬 05_Final_Video.mp4 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(ผลงานที่ตัดต่อเสร็จพร้อมโพสต์ลง TikTok/Reels)</div>
        </div>
      </div>
    </div>
  );
};
