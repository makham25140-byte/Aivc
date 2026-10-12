import React, { useState } from 'react';
import { X, Copy, Check, Download, FileSpreadsheet, FileCode, FileText, Camera, Video, Mic } from 'lucide-react';
import { ProductionBlueprint } from '../types/director';
import {
  exportToCSV,
  downloadFile,
  getAllImagePrompts,
  getAllMotionPrompts,
  getFullThaiScript,
  getCapCutGuideText,
  cleanProjectForExport,
} from '../utils/exportUtils';

interface ExportModalProps {
  blueprint: ProductionBlueprint;
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ blueprint, isOpen, onClose }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownloadCSV = () => {
    const csv = exportToCSV(blueprint);
    downloadFile(`Storyboard-${blueprint.id}.csv`, csv, 'text/csv;charset=utf-8');
  };

  const handleDownloadJSON = () => {
    const json = cleanProjectForExport(blueprint);
    downloadFile(`Blueprint-${blueprint.id}.json`, json, 'application/json');
  };

  const handleDownloadScript = () => {
    const script = getFullThaiScript(blueprint);
    downloadFile(`Thai-Script-${blueprint.id}.txt`, script, 'text/plain;charset=utf-8');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full my-8 overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">
              ส่งออกและคัดลอก Prompts ทั้งหมด (Export Center)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 text-xs text-slate-300">
          {/* Quick Copy Packs */}
          <div>
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">
              คัดลอกชุด Prompt ในคลิกเดียว (One-Click Copy Packs)
            </h4>

            <div className="space-y-3">
              {/* Copy all Image Prompts */}
              <div className="bg-slate-950 p-4 rounded-xl border border-indigo-900/40 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-xs">
                      คัดลอก Image Prompts ทั้งหมด ({blueprint.shots.length} ช็อต)
                    </div>
                    <div className="text-[11px] text-slate-400">
                      สำหรับนำไปวางใน Midjourney v6, Flux.1, SeaArt หรือ Bing Image Creator
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleCopy(getAllImagePrompts(blueprint), 'all-images')}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium flex items-center gap-1.5 shrink-0 transition"
                >
                  {copiedKey === 'all-images' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      <span>คัดลอกแล้ว</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>คัดลอกทั้งหมด</span>
                    </>
                  )}
                </button>
              </div>

              {/* Copy all Motion Prompts */}
              <div className="bg-slate-950 p-4 rounded-xl border border-rose-900/40 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                    <Video className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-xs">
                      คัดลอก Motion Prompts ทั้งหมด ({blueprint.shots.length} ช็อต)
                    </div>
                    <div className="text-[11px] text-slate-400">
                      สำหรับนำไปวางใน Kling AI, Runway Gen-3, Luma Dream Machine หรือ Haiper
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleCopy(getAllMotionPrompts(blueprint), 'all-motions')}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium flex items-center gap-1.5 shrink-0 transition"
                >
                  {copiedKey === 'all-motions' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      <span>คัดลอกแล้ว</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>คัดลอกทั้งหมด</span>
                    </>
                  )}
                </button>
              </div>

              {/* Copy Project JSON */}
              <div className="bg-slate-950 p-4 rounded-xl border border-purple-900/40 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                    <FileCode className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-xs">
                      คัดลอกข้อมูลโปรเจกต์ทั้งหมด (Project JSON V3.1)
                    </div>
                    <div className="text-[11px] text-slate-400">
                      รวมตัวละครที่ล็อค, การเลือกตัวละครในแต่ละฉาก, Google Flow metadata, และ Prompts ทั้งหมด
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(cleanProjectForExport(blueprint), 'project-json')}
                    className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium flex items-center gap-1.5 shrink-0 transition"
                  >
                    {copiedKey === 'project-json' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-300" />
                        <span>คัดลอกแล้ว</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy JSON</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleDownloadJSON}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium flex items-center gap-1.5 shrink-0 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              </div>

              {/* Copy full Thai script */}
              <div className="bg-slate-950 p-4 rounded-xl border border-amber-900/40 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                    <Mic className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-xs">
                      คัดลอกบทพากย์ภาษาไทยทั้งหมดพร้อมเวลา
                    </div>
                    <div className="text-[11px] text-slate-400">
                      สำหรับใส่ใน CapCut Text-to-Speech หรือส่งให้นักพากย์เสียงจริง
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleCopy(getFullThaiScript(blueprint), 'all-script')}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium flex items-center gap-1.5 shrink-0 transition"
                >
                  {copiedKey === 'all-script' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      <span>คัดลอกแล้ว</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>คัดลอกบท</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Download File Formats */}
          <div>
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">
              ดาวน์โหลดเป็นไฟล์เอกสาร (Download Files)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={handleDownloadCSV}
                className="p-3 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-xl transition flex flex-col items-center text-center gap-2"
              >
                <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
                <div>
                  <div className="font-bold text-white text-xs">ตาราง Storyboard (.csv)</div>
                  <div className="text-[10px] text-slate-400">เปิดใน Excel / Google Sheets</div>
                </div>
              </button>

              <button
                onClick={handleDownloadJSON}
                className="p-3 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-xl transition flex flex-col items-center text-center gap-2"
              >
                <FileCode className="w-6 h-6 text-indigo-400" />
                <div>
                  <div className="font-bold text-white text-xs">Blueprint ดิบ (.json)</div>
                  <div className="text-[10px] text-slate-400">โครงสร้างข้อมูลครบถ้วนสำหรับ API</div>
                </div>
              </button>

              <button
                onClick={handleDownloadScript}
                className="p-3 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-xl transition flex flex-col items-center text-center gap-2"
              >
                <FileText className="w-6 h-6 text-amber-400" />
                <div>
                  <div className="font-bold text-white text-xs">บทพากย์ & ซับ (.txt)</div>
                  <div className="text-[10px] text-slate-400">สำหรับนำเข้าตัดต่อเสียง</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium transition"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
