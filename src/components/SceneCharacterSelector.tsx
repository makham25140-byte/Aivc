import React, { useState } from 'react';
import { UserCheck, Plus, X, Search, Lock, Unlock, Users, ShieldAlert, Sparkles, Check } from 'lucide-react';
import { CharacterProfile } from '../types/director';

interface SceneCharacterSelectorProps {
  characters: CharacterProfile[];
  selectedCharacterIds?: string[];
  onChange: (updatedIds: string[]) => void;
  sceneId?: string;
  shotNumber: number;
}

export const SceneCharacterSelector: React.FC<SceneCharacterSelectorProps> = ({
  characters = [],
  selectedCharacterIds = [],
  onChange,
  sceneId,
  shotNumber,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Normalize IDs to prevent crashes
  const currentIds = Array.isArray(selectedCharacterIds) ? selectedCharacterIds : [];

  const selectedCharacters = characters.filter((c) => currentIds.includes(c.id));
  const unselectedCharacters = characters.filter((c) => !currentIds.includes(c.id));

  const filteredUnselected = unselectedCharacters.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleCharacter = (charId: string) => {
    if (currentIds.includes(charId)) {
      onChange(currentIds.filter((id) => id !== charId));
    } else {
      onChange([...currentIds, charId]);
    }
  };

  const handleRemoveCharacter = (charId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(currentIds.filter((id) => id !== charId));
  };

  const handleClearAll = () => {
    onChange([]);
  };

  return (
    <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 sm:p-3.5 space-y-2.5">
      {/* Top Header: Title & Count */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <UserCheck className="w-4 h-4 text-indigo-400 shrink-0" />
          <span className="text-xs font-bold text-slate-200 truncate">
            ตัวละครในฉาก (Scene Characters)
          </span>
          <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
            {currentIds.length} คน
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {currentIds.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-[11px] text-slate-400 hover:text-rose-400 px-2 py-1 rounded transition touch-manipulation min-h-[32px]"
              title="ล้างตัวละครทั้งหมดในฉากนี้"
            >
              ล้างทั้งหมด
            </button>
          )}

          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition touch-manipulation min-h-[36px] ${
              isOpen
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isOpen ? 'ปิดตัวเลือก' : 'เพิ่ม/เปลี่ยนตัวละคร'}</span>
          </button>
        </div>
      </div>

      {/* Selected Characters Badges (Easy to Tap on Android) */}
      <div className="flex flex-wrap items-center gap-2">
        {selectedCharacters.length === 0 ? (
          <div className="text-xs text-slate-400 bg-slate-900/60 border border-dashed border-slate-800 rounded-lg px-3 py-2 w-full flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
              <span>ไม่มีตัวละครในฉากนี้ (Scenery / Cutaway / B-Roll / Graphics)</span>
            </span>
            <button
              onClick={() => setIsOpen(true)}
              className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium underline"
            >
              + เลือกตัวละคร
            </button>
          </div>
        ) : (
          selectedCharacters.map((char) => (
            <div
              key={char.id}
              className="group inline-flex items-center gap-2 bg-gradient-to-r from-indigo-950/80 to-slate-900 border border-indigo-500/40 rounded-lg px-2.5 py-1.5 text-xs text-white shadow-sm shadow-indigo-950/50"
            >
              <div className="w-5 h-5 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-[10px] font-bold text-indigo-300 shrink-0">
                {char.name.charAt(0)}
              </div>

              <div className="min-w-0">
                <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                  <span className="truncate">{char.name}</span>
                  {char.isLocked !== false ? (
                    <span
                      title="ล็อคเอกลักษณ์ (Consistency Locked)"
                      className="inline-flex items-center text-[9px] px-1 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 shrink-0 font-normal"
                    >
                      <Lock className="w-2.5 h-2.5 mr-0.5 text-amber-400" />
                      ล็อค
                    </span>
                  ) : (
                    <span
                      title="ยังไม่ได้ล็อคเอกลักษณ์"
                      className="inline-flex items-center text-[9px] px-1 py-0.2 rounded bg-slate-700/50 text-slate-400 shrink-0 font-normal"
                    >
                      <Unlock className="w-2.5 h-2.5 mr-0.5" />
                      เปิด
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-indigo-300/80 truncate">
                  {char.role}
                </div>
              </div>

              <button
                onClick={(e) => handleRemoveCharacter(char.id, e)}
                className="w-5 h-5 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 flex items-center justify-center transition shrink-0 ml-1 touch-manipulation"
                title={`ลบ ${char.name} ออกจากช็อตนี้`}
                aria-label={`Remove ${char.name}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Dropdown / Drawer for Selecting Characters */}
      {isOpen && (
        <div className="bg-slate-900 border border-indigo-500/30 rounded-xl p-3 space-y-3 mt-2 shadow-2xl animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span>เลือกตัวละครจาก Character Roster</span>
            </span>
            <span className="text-[11px] text-slate-400">
              แตะเพื่อเลือก/ยกเลิก
            </span>
          </div>

          {/* Search Box if roster is larger */}
          {characters.length > 3 && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ค้นหาชื่อหรือบทบาทตัวละคร..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}

          {/* Character Options List (Minimum 44px Touch Targets for Android) */}
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {characters.length === 0 ? (
              <div className="text-xs text-slate-400 p-3 text-center bg-slate-950 rounded-lg">
                ยังไม่มีตัวละครในโปรเจกต์นี้ คุณสามารถเพิ่มได้ในแท็บ "คัมภีร์ตัวละคร & ฉาก"
              </div>
            ) : (
              characters
                .filter((c) =>
                  !searchQuery ||
                  c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  c.role.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((char) => {
                  const isSelected = currentIds.includes(char.id);
                  return (
                    <button
                      key={char.id}
                      type="button"
                      onClick={() => handleToggleCharacter(char.id)}
                      className={`w-full text-left p-2.5 rounded-lg border flex items-center justify-between gap-3 transition min-h-[44px] touch-manipulation ${
                        isSelected
                          ? 'bg-indigo-950/60 border-indigo-500/60 text-white'
                          : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                            isSelected
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {char.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-xs text-white flex items-center gap-1.5">
                            <span className="truncate">{char.name}</span>
                            {char.isLocked !== false && (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                                🔒 Locked
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {char.role} • {char.visualIdentity?.clothing || 'เสื้อผ้าหลัก'}
                          </div>
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center border shrink-0 ${
                          isSelected
                            ? 'bg-indigo-600 border-indigo-500 text-white'
                            : 'border-slate-700 bg-slate-900'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                    </button>
                  );
                })
            )}
          </div>

          <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80">
            <span>
              💡 แนะนำ: เลือกเฉพาะตัวละครที่ปรากฏในช็อตที่ {shotNumber} เพื่อป้องกัน Prompt สับสน
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-indigo-400 hover:text-indigo-300 font-semibold px-2 py-1"
            >
              เสร็จสิ้น
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
