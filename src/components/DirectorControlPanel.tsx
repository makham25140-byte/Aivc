import React, { useState } from 'react';
import { Sparkles, Sliders, Wand2, Compass, Layers, Clock, MonitorPlay, AlertCircle, ArrowRight } from 'lucide-react';
import { GenerateRequest } from '../types/director';

interface DirectorControlPanelProps {
  onGenerate: (data: GenerateRequest) => Promise<void>;
  isLoading: boolean;
  onSelectSampleScience: () => void;
}

const PRESET_IDEAS = [
  {
    title: 'สาระดาราศาสตร์ 60s',
    idea: 'ทำไมแสงที่มีความเร็วสูงสุดในจักรวาล ถึงหนีออกจากหลุมดำไม่ได้? สำหรับ TikTok/Shorts ให้เห็นภาพกาลอวกาศบิดเบี้ยวแบบ Interstellar',
    duration: 60,
    ratio: '9:16' as const,
    style: 'Cinematic Hyper-realistic 8k',
    genre: 'สารคดีวิชาการย่อยง่าย (Edutainment)',
  },
  {
    title: 'รีวิวสกินแคร์ TikTok 30s',
    idea: 'ป้ายยาเซรั่มกู้ผิวโทรมเร่งด่วนใน 7 วัน โชว์ปัญหาหน้าหมองคล้ำจากแสงสีฟ้า สลับภาพผิวฉ่ำวาวอิ่มน้ำแบบ Glass Skin',
    duration: 30,
    ratio: '9:16' as const,
    style: 'Commercial Beauty Clean Aesthetic',
    genre: 'รีวิวสินค้าและไลฟ์สไตล์ (Beauty Commercial)',
  },
  {
    title: 'ตำนานสยองขวัญ 90s',
    idea: 'เรื่องเล่าชวนขนลุกเกี่ยวกับประภาคารโบราณบนเกาะร้าง ที่ไฟส่องสว่างหมุนวนเองทุกคืนวันเพ็ญ แม้ไม่มีคนดูแลมากว่า 50 ปี',
    duration: 90,
    ratio: '9:16' as const,
    style: 'Dark Gothic Mystery Film Still',
    genre: 'เรื่องเล่าลี้ลับ / ระทึกขวัญ (Horror & Mystery)',
  },
  {
    title: 'สรุปการเงิน & ลงทุน 45s',
    idea: 'วิธีหยุดเงินเฟ้อไม่ให้กลืนเงินเก็บ อธิบายความแตกต่างระหว่างฝากธนาคารกับการกระจายความเสี่ยงในกองทุนดัชนีแบบเข้าใจทันที',
    duration: 45,
    ratio: '9:16' as const,
    style: 'Modern Minimalist Motion Graphics & Clean Live-Action',
    genre: 'การเงินส่วนบุคคล (Financial Literacy)',
  },
  {
    title: 'ไซไฟอนาคต 60s',
    idea: 'โลกปี 2085 เมื่อมนุษย์ดาวน์โหลดความทรงจำลงคลาวด์ได้ แต่ตัวเอกพบว่าความทรงจำวัยเด็กของตนเองถูกดัดแปลงโดยระบบ AI',
    duration: 60,
    ratio: '16:9' as const,
    style: 'Cyberpunk Neon Cinematic 35mm',
    genre: 'นิยายวิทยาศาสตร์ (Sci-Fi Cyberpunk)',
  },
];

export const DirectorControlPanel: React.FC<DirectorControlPanelProps> = ({
  onGenerate,
  isLoading,
  onSelectSampleScience,
}) => {
  const [idea, setIdea] = useState('');
  const [durationSec, setDurationSec] = useState<number>(60);
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9' | '1:1'>('9:16');
  const [visualStyle, setVisualStyle] = useState('Cinematic Photorealistic');
  const [genre, setGenre] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!idea.trim()) return;
    onGenerate({
      idea: idea.trim(),
      durationSec,
      aspectRatio,
      visualStyle,
      genre: genre.trim() || undefined,
      targetAudience: targetAudience.trim() || undefined,
    });
  };

  const applyPreset = (preset: typeof PRESET_IDEAS[0]) => {
    setIdea(preset.idea);
    setDurationSec(preset.duration);
    setAspectRatio(preset.ratio);
    setVisualStyle(preset.style);
    setGenre(preset.genre);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden mb-8">
      {/* Top Banner: Director Identity & Principles */}
      <div className="bg-gradient-to-r from-indigo-950/70 via-slate-900 to-slate-900 px-6 py-4 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Wand2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">
              AI Director Studio • สั่งการผู้กำกับอัจฉริยะ
            </h2>
            <p className="text-xs text-slate-400">
              วิเคราะห์ไอเดีย &rarr; เขียนบท &rarr; แบ่งช็อต &rarr; ล็อคตัวละคร &rarr; เขียน Image & Motion Prompts &rarr; แผนตัดต่อ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>ระบบแยก Prompt ภาพและวิดีโอชัดเจน + คุมความต่อเนื่องตัวละคร</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Main Idea Input */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="idea-input" className="block text-sm font-medium text-slate-200">
              ไอเดียหรือคอนเซปต์วิดีโอที่คุณต้องการสร้าง <span className="text-rose-400">*</span>
            </label>
            <span className="text-xs text-slate-400">
              (เช่น เล่าเรื่องสาระ, รีวิวสินค้า, นิทานภาพ, ไซไฟ หรือเรื่องเล่าสั้น)
            </span>
          </div>

          <div className="relative">
            <textarea
              id="idea-input"
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="พิมพ์ไอเดียของคุณที่นี่... เช่น 'อยากทำคลิปสั้น 60 วินาที เล่าว่าทำไมวาฬถึงไม่จมน้ำเวลานอนหลับ ให้มีแอนิเมชันน่ารักๆ ตัวละครผู้ดำเนินรายการใส่ชุดนักดำน้ำ ล็อคหน้าตาและชุดตลอดเรื่อง'"
              rows={3}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none"
            />
          </div>
        </div>

        {/* Quick Presets Carousel */}
        <div>
          <div className="flex items-center gap-2 mb-2.5">
            <Compass className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              ไอเดียยอดนิยม (คลิกเพื่อลองทันที):
            </span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-800">
            {PRESET_IDEAS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => applyPreset(preset)}
                className="shrink-0 text-left px-3 py-2 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-indigo-500/50 rounded-xl transition text-xs group"
              >
                <div className="font-semibold text-slate-200 group-hover:text-indigo-300 flex items-center gap-1">
                  <span>{preset.title}</span>
                  <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-400" />
                </div>
                <div className="text-[11px] text-slate-400 line-clamp-1 max-w-[200px]">
                  {preset.idea}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Settings Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-800">
          {/* Duration Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              ระยะเวลาเป้าหมาย (Duration)
            </label>
            <div className="grid grid-cols-5 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              {[15, 30, 60, 90, 120].map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => setDurationSec(sec)}
                  className={`py-1.5 text-xs font-medium rounded-lg transition text-center ${
                    durationSec === sec
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>
          </div>

          {/* Aspect Ratio Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <MonitorPlay className="w-3.5 h-3.5 text-slate-400" />
              สัดส่วนภาพ (Aspect Ratio)
            </label>
            <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              {[
                { val: '9:16', label: '9:16 แนวตั้ง', desc: 'TikTok/Reels' },
                { val: '16:9', label: '16:9 แนวนอน', desc: 'YouTube' },
                { val: '1:1', label: '1:1 จัตุรัส', desc: 'Feed' },
              ].map((item) => (
                <button
                  key={item.val}
                  type="button"
                  onClick={() => setAspectRatio(item.val as any)}
                  className={`py-1 text-xs font-medium rounded-lg transition text-center ${
                    aspectRatio === item.val
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                  }`}
                >
                  <div>{item.val}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Visual Style Preset */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              สไตล์ภาพ (Visual Style)
            </label>
            <select
              value={visualStyle}
              onChange={(e) => setVisualStyle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="Cinematic Photorealistic">ภาพยนตร์สมจริง (Cinematic Photorealistic)</option>
              <option value="Anime Makoto Shinkai Style">อนิเมะญี่ปุ่น (Makoto Shinkai / Ghibli Style)</option>
              <option value="3D Pixar / Disney Animation">แอนิเมชัน 3D (Pixar / DreamWorks Style)</option>
              <option value="Sci-Fi Cyberpunk Neon">ไซไฟนีออน (Cyberpunk Neon Blade Runner)</option>
              <option value="Dark Gothic Mystery">ลึกลับดาร์กโกธิค (Dark Gothic Mystery Film)</option>
              <option value="Vintage 90s Film Grain">ฟิล์มย้อนยุค 90s (Vintage 35mm Film Grain)</option>
              <option value="Minimalist Motion Graphic">โมเดิร์นมินิมอล (Clean Graphic & Vector)</option>
            </select>
          </div>
        </div>

        {/* Toggle Advanced Options */}
        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs text-slate-400 hover:text-indigo-400 flex items-center gap-1 transition"
          >
            <Sliders className="w-3 h-3" />
            <span>{showAdvanced ? 'ซ่อนตัวเลือกขั้นสูง' : 'แสดงตัวเลือกเพิ่มเติม (กลุ่มเป้าหมาย, แนววิดีโอ)'}</span>
          </button>

          {showAdvanced && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 pt-3 border-t border-slate-800/60">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  แนววิดีโอที่เจาะจง (Genre)
                </label>
                <input
                  type="text"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  placeholder="เช่น สารคดีความรู้, ตลกขำขัน, รีวิวป้ายยา, ดราม่าสะเทือนอารมณ์"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  กลุ่มผู้ชมเป้าหมาย (Target Audience)
                </label>
                <input
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="เช่น คนทำงาน Gen Z, วัยรุ่นชอบดู TikTok, นักลงทุนมือใหม่"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Action Button Area */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>AI Director พร้อมออกแบบทั้ง 9 ขั้นตอน พร้อมนำไปใช้จริงโดยไม่ต้องเสียเงิน</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="submit"
              disabled={isLoading || !idea.trim()}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all shadow-lg ${
                isLoading || !idea.trim()
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-rose-600 hover:from-indigo-500 hover:to-rose-500 text-white shadow-indigo-500/25 cursor-pointer hover:scale-[1.01]'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>ผู้กำกับกำลังวางแผนการผลิต (9 ขั้นตอน)...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>เริ่มกำกับ & วางแผนผลิต Blueprint</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
