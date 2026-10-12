import React, { useState, useRef } from 'react';
import {
  UserCheck,
  ShieldCheck,
  Copy,
  Check,
  MapPin,
  Sparkles,
  Shirt,
  Eye,
  AlertCircle,
  Lock,
  Unlock,
  Upload,
  Image as ImageIcon,
  Edit2,
  Save,
  X,
  Info
} from 'lucide-react';
import { CharacterProfile, EnvironmentAnchor } from '../types/director';

interface CharacterAndLocationBibleProps {
  characters: CharacterProfile[];
  environments: EnvironmentAnchor[];
  onUpdateCharacters?: (updated: CharacterProfile[]) => void;
}

export const CharacterAndLocationBible: React.FC<CharacterAndLocationBibleProps> = ({
  characters = [],
  environments = [],
  onUpdateCharacters,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [editingCharId, setEditingCharId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<CharacterProfile>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeUploadCharId, setActiveUploadCharId] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleToggleLock = (charId: string) => {
    if (!onUpdateCharacters) return;
    const updated = characters.map((c) => {
      if (c.id === charId) {
        return {
          ...c,
          isLocked: c.isLocked === false ? true : false,
        };
      }
      return c;
    });
    onUpdateCharacters(updated);
  };

  const handleStartEdit = (char: CharacterProfile) => {
    setEditingCharId(char.id);
    setEditFormData({
      canonicalDescription: char.canonicalDescription || char.consistencyLockPrompt,
      canonicalClothing: char.canonicalClothing || char.visualIdentity.clothing,
      referenceImageNotes: char.referenceImageNotes || '',
      consistencyLockPrompt: char.consistencyLockPrompt,
    });
  };

  const handleSaveEdit = (charId: string) => {
    if (!onUpdateCharacters) return;
    const updated = characters.map((c) => {
      if (c.id === charId) {
        return {
          ...c,
          canonicalDescription: editFormData.canonicalDescription || c.canonicalDescription,
          canonicalClothing: editFormData.canonicalClothing || c.canonicalClothing,
          referenceImageNotes: editFormData.referenceImageNotes || c.referenceImageNotes,
          consistencyLockPrompt: editFormData.consistencyLockPrompt || c.consistencyLockPrompt,
        };
      }
      return c;
    });
    onUpdateCharacters(updated);
    setEditingCharId(null);
  };

  const handleImageUpload = (charId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUpdateCharacters) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const updated = characters.map((c) => {
        if (c.id === charId) {
          return {
            ...c,
            referenceImageUrl: dataUrl,
          };
        }
        return c;
      });
      onUpdateCharacters(updated);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = (charId: string) => {
    if (!onUpdateCharacters) return;
    const updated = characters.map((c) => {
      if (c.id === charId) {
        return {
          ...c,
          referenceImageUrl: undefined,
        };
      }
      return c;
    });
    onUpdateCharacters(updated);
  };

  return (
    <div className="space-y-8">
      {/* Principle Banner */}
      <div className="bg-indigo-950/20 border border-indigo-500/30 rounded-2xl p-5 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div className="text-xs text-indigo-200 leading-relaxed space-y-1">
          <div className="font-bold text-white text-sm">
            ขั้นตอนที่ 4: คัมภีร์ควบคุมความต่อเนื่องของตัวละครและสถานที่ (Character & Location Consistency Bible V3.1)
          </div>
          <p>
            หัวใจสำคัญของการสร้างวิดีโอด้วย AI คือ "หน้าตา เสื้อผ้า และสิ่งแวดล้อมต้องไม่หลุดลอยระหว่างช็อต"
            ใน V3.1 เรามีระบบ <strong>Character Consistency Lock</strong> ที่คุมทั้งชุดเสื้อผ้า canonical,
            คำอธิบายภาพหลัก, รูปอ้างอิง (Reference Image), และส่งต่อเฉพาะตัวละครที่ถูกเลือกในแต่ละฉากอย่างแม่นยำ
          </p>
        </div>
      </div>

      {/* Characters List */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              โปรไฟล์ตัวละครหลัก & การล็อคเอกลักษณ์ (Character Roster & Consistency Lock)
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            {characters.length} ตัวละครในโปรเจกต์
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {characters && characters.length > 0 ? (
            characters.map((char) => {
              const isLocked = char.isLocked !== false;
              const isEditing = editingCharId === char.id;

              return (
                <div
                  key={char.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5 flex flex-col justify-between"
                >
                  <div className="space-y-5">
                    {/* Header: Name, Role, Lock Toggle */}
                    <div className="flex items-start justify-between pb-4 border-b border-slate-800 gap-3">
                      <div>
                        <h4 className="text-base font-bold text-white flex items-center gap-2">
                          <span>{char.name}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
                            {char.role}
                          </span>
                        </h4>
                        <p className="text-xs text-slate-400 mt-1">{char.ageAndGender}</p>
                      </div>

                      {/* Consistency Lock Toggle */}
                      <button
                        onClick={() => handleToggleLock(char.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition touch-manipulation min-h-[36px] ${
                          isLocked
                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/25'
                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                        }`}
                        title={isLocked ? 'คลิกเพื่อปลดล็อค' : 'คลิกเพื่อล็อคความต่อเนื่อง'}
                      >
                        {isLocked ? (
                          <>
                            <Lock className="w-3.5 h-3.5 text-amber-400" />
                            <span>ล็อคเอกลักษณ์แล้ว</span>
                          </>
                        ) : (
                          <>
                            <Unlock className="w-3.5 h-3.5" />
                            <span>ไม่ได้ล็อค</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Reference Image Section */}
                    <div className="bg-slate-950/90 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                          <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                          <span>ภาพอ้างอิงตัวละคร (Character Reference Image)</span>
                        </span>
                        {char.referenceImageUrl && (
                          <button
                            onClick={() => handleRemoveImage(char.id)}
                            className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1"
                          >
                            <X className="w-3 h-3" />
                            ลบรูป
                          </button>
                        )}
                      </div>

                      {char.referenceImageUrl ? (
                        <div className="flex items-center gap-3">
                          <img
                            src={char.referenceImageUrl}
                            alt={char.name}
                            className="w-16 h-16 rounded-lg object-cover border border-indigo-500/40"
                          />
                          <div className="text-xs text-slate-300 space-y-1 min-w-0">
                            <div className="font-semibold text-emerald-400 text-[11px]">
                              ✓ มีรูปอ้างอิงพร้อมนำไปใส่ใน Image/Video AI
                            </div>
                            <div className="text-[10px] text-slate-400 line-clamp-2">
                              {char.referenceImageNotes || 'ภาพใบหน้าตรง แสงมาตรฐาน'}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[11px] text-slate-400">
                            ยังไม่มีภาพต้นแบบ (สามารถอัปโหลดภาพใบหน้าหรือภาพที่สร้างช็อตแรกเพื่อใช้อ้างอิง)
                          </span>
                          <div>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImageUpload(char.id, e)}
                              className="hidden"
                              id={`ref-upload-${char.id}`}
                            />
                            <label
                              htmlFor={`ref-upload-${char.id}`}
                              className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white border border-indigo-500/40 text-xs font-medium transition touch-manipulation min-h-[34px]"
                            >
                              <Upload className="w-3 h-3" />
                              <span>อัปโหลดภาพ</span>
                            </label>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Canonical Clothing & Description */}
                    <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                          <Shirt className="w-3.5 h-3.5 text-amber-400" />
                          <span>ชุดเสื้อผ้ามาตรฐาน (Canonical Clothing Lock)</span>
                        </span>
                        {!isEditing && onUpdateCharacters && (
                          <button
                            onClick={() => handleStartEdit(char)}
                            className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                          >
                            <Edit2 className="w-3 h-3" />
                            แก้ไข
                          </button>
                        )}
                      </div>

                      {isEditing ? (
                        <div className="space-y-2 pt-1">
                          <input
                            type="text"
                            value={editFormData.canonicalClothing || ''}
                            onChange={(e) =>
                              setEditFormData({ ...editFormData, canonicalClothing: e.target.value })
                            }
                            placeholder="ระบุชุดเสื้อผ้าที่ใส่ตลอดเรื่อง..."
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                          />
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setEditingCharId(null)}
                              className="px-2.5 py-1 text-slate-400 hover:text-white text-xs"
                            >
                              ยกเลิก
                            </button>
                            <button
                              onClick={() => handleSaveEdit(char.id)}
                              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold"
                            >
                              บันทึก
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-200 leading-relaxed font-mono bg-slate-900/60 p-2 rounded border border-slate-800/80">
                          {char.canonicalClothing || char.visualIdentity.clothing}
                        </p>
                      )}
                    </div>

                    {/* Visual Identity breakdown */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 space-y-1">
                        <span className="text-slate-400 font-semibold flex items-center gap-1.5 text-[11px]">
                          <Eye className="w-3.5 h-3.5 text-indigo-400" />
                          ใบหน้า & ทรงผม
                        </span>
                        <p className="text-slate-200">{char.visualIdentity.faceAndHair}</p>
                      </div>

                      <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 space-y-1">
                        <span className="text-slate-400 font-semibold text-[11px]">
                          เครื่องประดับ & จุดเด่นเฉพาะ
                        </span>
                        <p className="text-slate-300">{char.visualIdentity.accessoriesAndTraits}</p>
                      </div>
                    </div>

                    {/* Consistency Lock Prompt (English) */}
                    <div className="bg-indigo-950/30 border border-indigo-500/30 rounded-xl p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                          Consistency Lock Prompt (English)
                        </span>
                        <button
                          onClick={() => handleCopy(char.consistencyLockPrompt, `lock-${char.id}`)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-medium transition min-h-[30px]"
                        >
                          {copiedKey === `lock-${char.id}` ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-300" />
                              <span>คัดลอกแล้ว</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>คัดลอก Lock Prompt</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="bg-slate-950 p-2.5 rounded-lg border border-indigo-900/40 text-xs font-mono text-slate-200 leading-relaxed select-all">
                        {char.consistencyLockPrompt}
                      </div>
                    </div>

                    {/* Negative Prompt */}
                    {char.negativePrompt && (
                      <div className="bg-rose-950/20 border border-rose-500/20 rounded-xl p-3 space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-rose-300 text-[11px]">
                            Negative Prompt ป้องกันตัวละครเพี้ยน
                          </span>
                          <button
                            onClick={() => handleCopy(char.negativePrompt, `neg-${char.id}`)}
                            className="text-[10px] text-rose-300 hover:text-white flex items-center gap-1"
                          >
                            <Copy className="w-2.5 h-2.5" />
                            <span>คัดลอก</span>
                          </button>
                        </div>
                        <div className="bg-slate-950 p-2 rounded border border-rose-900/30 font-mono text-[11px] text-rose-200">
                          {char.negativePrompt}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Technical Discipline Disclaimer */}
                  <div className="text-[10px] text-slate-400 flex items-start gap-1.5 bg-slate-950/60 p-2 rounded border border-slate-800/80 mt-2">
                    <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                    <span>
                      การล็อคเอกลักษณ์ (Lock) ควบคุมความต่อเนื่องของคำสั่งเชิงความหมาย (Prompt-level semantic continuity) ในฉากที่ตัวละครนี้ถูกเลือก
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-2 text-center py-8 text-slate-400 text-xs bg-slate-900 rounded-xl border border-slate-800">
              ไม่มีตัวละครหลักที่ต้องล็อคเป็นพิเศษ (เช่น วิดีโอเน้นธรรมชาติหรือภาพกราฟิก)
            </div>
          )}
        </div>
      </div>

      {/* Environments & Locations */}
      {environments && environments.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              สถานที่หลัก & การควบคุมสภาพแวดล้อม (Environment Anchors)
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {environments.map((env, idx) => (
              <div
                key={idx}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>{env.locationName}</span>
                  </h4>
                  <button
                    onClick={() => handleCopy(env.consistencyPromptLock, `env-${idx}`)}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition text-xs flex items-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span className="text-[11px]">คัดลอกฉาก</span>
                  </button>
                </div>

                <div className="text-xs text-slate-300 space-y-1">
                  <div>
                    <span className="text-slate-500">บรรยากาศ & โทนสี:</span> {env.visualStyle}
                  </div>
                  <div>
                    <span className="text-slate-500">การจัดแสง:</span> {env.lightingSetup}
                  </div>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs font-mono text-emerald-300/90 leading-relaxed select-all">
                  {env.consistencyPromptLock}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
