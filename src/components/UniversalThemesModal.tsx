import React, { useState } from 'react';
import {
  Palette,
  Plus,
  Trash2,
  Copy,
  RotateCcw,
  Download,
  Upload,
  Check,
  Pencil,
  X,
  Pipette,
} from 'lucide-react';
import { UniversalThemeToken } from '../types';
import { UNIVERSAL_THEME_PRESETS } from '../constants/presets';

interface UniversalThemesModalProps {
  isOpen: boolean;
  onClose: () => void;
  themes: UniversalThemeToken[];
  activeThemeId: string;
  onSelectTheme: (theme: UniversalThemeToken) => void;
  onUpdateTheme: (theme: UniversalThemeToken) => void;
  onCreateTheme: (theme: UniversalThemeToken) => void;
  onDuplicateTheme: (theme: UniversalThemeToken) => void;
  onDeleteTheme: (id: string) => void;
  onRestoreDefaults: () => void;
  onExportThemesJson: () => void;
  onImportThemesJson: (file: File) => void;
}

export const UniversalThemesModal: React.FC<UniversalThemesModalProps> = ({
  isOpen,
  onClose,
  themes,
  activeThemeId,
  onSelectTheme,
  onUpdateTheme,
  onCreateTheme,
  onDuplicateTheme,
  onDeleteTheme,
  onRestoreDefaults,
  onExportThemesJson,
  onImportThemesJson,
}) => {
  const [editingTheme, setEditingTheme] = useState<UniversalThemeToken | null>(null);

  if (!isOpen) return null;

  const handleEyedropper = async (
    tokenKey: keyof UniversalThemeToken,
    currentTheme: UniversalThemeToken
  ) => {
    if ('EyeDropper' in window) {
      try {
        // @ts-ignore
        const eyeDropper = new window.EyeDropper();
        const result = await eyeDropper.open();
        if (result?.sRGBHex) {
          setEditingTheme({
            ...currentTheme,
            [tokenKey]: result.sRGBHex,
          });
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const startCreateNew = () => {
    const newTheme: UniversalThemeToken = {
      id: `theme-custom-${Date.now()}`,
      name: `Tema Baru ${themes.length + 1}`,
      isCustom: true,
      mainColor: '#5558A0',
      mainColorDark: '#3E4078',
      accentColor: '#F7E6CC',
      subBoxBg: '#F7E6CC',
      descriptionBoxBg: '#FFFFFF',
      borderColor: '#3A3A3A',
      lightTextColor: '#FFFFFF',
      darkTextColor: '#2E2E2E',
      numberColor: '#5558A0',
      connectorColor: '#3A3A3A',
      canvasBg: 'transparent',
    };
    setEditingTheme(newTheme);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportThemesJson(file);
      e.target.value = '';
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="nb-skin nb-modal w-full max-w-3xl max-h-[88vh] flex flex-col overflow-hidden text-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 leading-tight">
                Sistem Tema Warna Universal
              </h2>
              <p className="text-[11px] text-slate-500">
                Berlaku untuk semua gaya bagan dengan token warna yang konsisten
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Toolbar */}
        <div className="px-6 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 bg-white text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={startCreateNew}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-xs cursor-pointer transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Tema Baru</span>
            </button>
            <button
              type="button"
              onClick={onRestoreDefaults}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold cursor-pointer transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Kembalikan Tema Bawaan</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer shadow-2xs transition-all">
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span>Impor Tema JSON</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
            <button
              type="button"
              onClick={onExportThemesJson}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer shadow-2xs transition-all"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Ekspor JSON</span>
            </button>
          </div>
        </div>

        {/* Body: List of Themes OR Edit Theme form */}
        <div className="flex-1 overflow-y-auto p-6">
          {editingTheme ? (
            /* ================= EDITING THEME TOKEN FORM ================= */
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 flex-1 max-w-sm">
                  <label className="text-xs font-bold text-slate-600">Nama Tema:</label>
                  <input
                    type="text"
                    value={editingTheme.name}
                    onChange={(e) =>
                      setEditingTheme({ ...editingTheme, name: e.target.value })
                    }
                    className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 font-bold text-xs"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingTheme(null)}
                    className="px-3 py-1 text-slate-500 hover:text-slate-700 text-xs"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (themes.some((t) => t.id === editingTheme.id)) {
                        onUpdateTheme(editingTheme);
                      } else {
                        onCreateTheme(editingTheme);
                      }
                      onSelectTheme(editingTheme);
                      setEditingTheme(null);
                    }}
                    className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-xl shadow-xs"
                  >
                    Simpan & Terapkan
                  </button>
                </div>
              </div>

              {/* Grid of Color Tokens */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                {[
                  {
                    key: 'mainColor' as const,
                    label: 'Warna Utama',
                    desc: 'Sidebar / Kotak Utama / Header',
                  },
                  {
                    key: 'accentColor' as const,
                    label: 'Warna Aksen',
                    desc: 'Pill / Label / Highlight',
                  },
                  {
                    key: 'subBoxBg' as const,
                    label: 'Warna Krem / Sub Box',
                    desc: 'Latar Sub Box / Pill Poin',
                  },
                  {
                    key: 'descriptionBoxBg' as const,
                    label: 'Latar Box Deskripsi',
                    desc: 'Box penjelasan / Kotak nomor',
                  },
                  {
                    key: 'borderColor' as const,
                    label: 'Warna Garis Tepi',
                    desc: 'Border semua box & konektor',
                  },
                  {
                    key: 'lightTextColor' as const,
                    label: 'Teks Terang',
                    desc: 'Teks di header & kotak utama',
                  },
                  {
                    key: 'darkTextColor' as const,
                    label: 'Teks Gelap',
                    desc: 'Teks di pill & deskripsi',
                  },
                  {
                    key: 'numberColor' as const,
                    label: 'Warna Nomor',
                    desc: 'Angka di kotak nomor & busur',
                  },
                  {
                    key: 'connectorColor' as const,
                    label: 'Konektor / Dot',
                    desc: 'Garis cabang & titik busur',
                  },
                  {
                    key: 'canvasBg' as const,
                    label: 'Latar Kanvas',
                    desc: 'Warna background slide / diagram',
                  },
                ].map(({ key, label, desc }) => (
                  <div
                    key={key}
                    className="p-3 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-2 text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-800">{label}</div>
                      <div className="text-[10px] text-slate-400">{desc}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <input
                          type="color"
                          value={editingTheme[key] || '#ffffff'}
                          onChange={(e) =>
                            setEditingTheme({
                              ...editingTheme,
                              [key]: e.target.value,
                            })
                          }
                          className="w-8 h-8 rounded-lg cursor-pointer border border-black/10 overflow-hidden"
                        />
                      </div>
                      <input
                        type="text"
                        value={editingTheme[key] || ''}
                        onChange={(e) =>
                          setEditingTheme({
                            ...editingTheme,
                            [key]: e.target.value,
                          })
                        }
                        className="flex-1 px-2 py-1 rounded-lg border border-slate-300 font-mono text-[11px] uppercase bg-white"
                      />
                      {'EyeDropper' in window && (
                        <button
                          type="button"
                          onClick={() => handleEyedropper(key, editingTheme)}
                          className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600"
                          title="Ambil warna dari layar (Eyedropper)"
                        >
                          <Pipette className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* ================= GRID OF THEME CARDS ================= */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              {themes.map((th) => {
                const isActive = th.id === activeThemeId;
                return (
                  <div
                    key={th.id}
                    className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between cursor-pointer ${
                      isActive
                        ? 'border-purple-600 ring-2 ring-purple-500/20 bg-purple-50/20 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white hover:shadow-xs'
                    }`}
                    onClick={() => onSelectTheme(th)}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className="text-xs font-bold text-slate-800 truncate"
                            title={th.name}
                          >
                            {th.name}
                          </span>
                          {th.isCustom && (
                            <span className="text-[9px] px-1 py-0.2 bg-purple-100 text-purple-700 font-semibold rounded shrink-0">
                              Kustom
                            </span>
                          )}
                        </div>
                        {isActive && (
                          <span className="w-4 h-4 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0">
                            <Check className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>

                      {/* Swatches Preview */}
                      <div className="flex items-center gap-1.5 my-2.5 py-1">
                        <div
                          className="w-6 h-6 rounded-lg border border-black/10 shadow-2xs shrink-0"
                          style={{ backgroundColor: th.mainColor }}
                          title="Warna Utama"
                        />
                        <div
                          className="w-6 h-6 rounded-lg border border-black/10 shadow-2xs shrink-0"
                          style={{ backgroundColor: th.accentColor }}
                          title="Warna Aksen"
                        />
                        <div
                          className="w-6 h-6 rounded-lg border border-black/10 shadow-2xs shrink-0"
                          style={{ backgroundColor: th.subBoxBg }}
                          title="Latar Sub Box / Krem"
                        />
                        <div
                          className="w-6 h-6 rounded-lg border border-black/10 shadow-2xs shrink-0"
                          style={{ backgroundColor: th.borderColor }}
                          title="Garis Tepi"
                        />
                        <div
                          className="w-6 h-6 rounded-lg border border-black/10 shadow-2xs shrink-0"
                          style={{ backgroundColor: th.canvasBg }}
                          title="Latar Kanvas"
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div
                      className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs mt-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => onSelectTheme(th)}
                        className={`font-semibold text-[11px] ${
                          isActive
                            ? 'text-purple-700'
                            : 'text-indigo-600 hover:text-indigo-800'
                        }`}
                      >
                        {isActive ? 'Sedang Aktif' : 'Terapkan'}
                      </button>

                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => setEditingTheme({ ...th })}
                          className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Edit Tema"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDuplicateTheme(th)}
                          className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Duplikasi Tema"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteTheme(th.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Hapus Tema"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between text-[11px] text-slate-500">
          <span>Mengganti tema otomatis memperbarui warna di seluruh gaya bagan.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg cursor-pointer shadow-2xs"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
