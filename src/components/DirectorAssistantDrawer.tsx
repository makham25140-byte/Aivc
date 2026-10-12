import React, { useState } from 'react';
import { Sparkles, Send, X, Bot, User, CornerDownLeft, Wand2 } from 'lucide-react';
import { ProductionBlueprint } from '../types/director';

interface DirectorAssistantDrawerProps {
  blueprint: ProductionBlueprint;
  isOpen: boolean;
  onClose: () => void;
  onRefineBlueprint: (instruction: string) => Promise<void>;
  isRefining: boolean;
}

export const DirectorAssistantDrawer: React.FC<DirectorAssistantDrawerProps> = ({
  blueprint,
  isOpen,
  onClose,
  onRefineBlueprint,
  isRefining,
}) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{ sender: 'director' | 'user'; text: string }>>([
    {
      sender: 'director',
      text: `สวัสดีครับผู้สร้าง! ผมคือ AI Director ของคุณ โปรเจกต์ "${blueprint.projectTitle}" ตอนนี้มีผังช็อต 9 ขั้นตอนครบถ้วน คุณต้องการให้ผมปรับแต่งช็อตไหนเป็นพิเศษ หรือต้องการเทคนิคการใช้เครื่องมือสร้างภาพ/วิดีโอฟรีเพิ่มเติมมั้ยครับ?`,
    },
  ]);

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isRefining) return;

    const userText = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { sender: 'user', text: userText }]);

    // Check if user is giving an instruction to update the blueprint
    const isDirectUpdateInstruction =
      userText.includes('ปรับ') ||
      userText.includes('แก้') ||
      userText.includes('เปลี่ยน') ||
      userText.includes('เพิ่ม') ||
      userText.includes('ลด') ||
      userText.includes('ขยาย');

    if (isDirectUpdateInstruction) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'director',
          text: `กำลังประมวลผลคำสั่ง "${userText}" และอัปเดต Blueprint การผลิตให้คุณสักครู่ครับ...`,
        },
      ]);
      await onRefineBlueprint(userText);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'director',
          text: `อัปเดต Blueprint เรียบร้อยแล้วครับ! คุณสามารถตรวจสอบตารางช็อตและ Prompts ที่ถูกปรับแต่งในหน้าต่างหลักได้เลย`,
        },
      ]);
    } else {
      // General question to director
      try {
        const res = await fetch('/api/director/assist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: userText, currentContext: blueprint }),
        });
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          {
            sender: 'director',
            text: data.answer || 'ขออภัยครับ ไม่สามารถให้คำแนะนำได้ในขณะนี้',
          },
        ]);
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'director',
            text: 'เกิดข้อผิดพลาดในการเชื่อมต่อกับผู้กำกับ กรุณาลองอีกครั้งครับ',
          },
        ]);
      }
    }
  };

  const QUICK_PROMPTS = [
    'ปรับช็อตเปิดเรื่องให้มีเสียงหัวใจเต้นและซูมเร็วกว่านี้',
    'เพิ่มช็อตสรุปให้กระชับลงเหลือ 45 วินาที',
    'แนะนำการตั้งค่า Motion ใน Kling 1.5 ให้ไม่เบลอ',
    'ช่วยตรวจเช็คความถูกต้องของข้อมูลวิชาการอีกรอบ',
  ];

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col">
      {/* Header */}
      <div className="bg-slate-950 px-5 py-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">ผู้กำกับ AI ประจำโปรเจกต์</h3>
            <p className="text-[11px] text-slate-400">สั่งปรับแต่งช็อต & สอบถามเทคนิคการผลิต</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.sender === 'director' && (
              <div className="w-6 h-6 rounded-full bg-indigo-600/30 text-indigo-300 flex items-center justify-center shrink-0 text-[10px] font-bold">
                AI
              </div>
            )}
            <div
              className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-none'
                  : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-bl-none'
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Prompts */}
      <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-950/40">
        <div className="text-[10px] text-slate-400 font-semibold mb-1.5">คำสั่งด่วน:</div>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_PROMPTS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => setInput(p)}
              className="text-[10px] px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition text-left"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-4 bg-slate-950 border-t border-slate-800 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="พิมพ์คำสั่งปรับปรุง หรือถามเทคนิคผู้กำกับ..."
          disabled={isRefining}
          className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <button
          type="submit"
          disabled={!input.trim() || isRefining}
          className={`p-2 rounded-xl text-white transition ${
            !input.trim() || isRefining
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-500'
          }`}
        >
          {isRefining ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </form>
    </div>
  );
};
