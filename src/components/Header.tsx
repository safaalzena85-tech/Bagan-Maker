import React, { useEffect, useState } from 'react';
import {
  Download,
  Copy,
  Check,
  FileCode,
  Stethoscope,
  Layers,
  ChevronDown,
  Loader2,
  Palette,
  Folder,
  Undo2,
  Redo2,
  Maximize,
  Ratio,
  Crosshair,
} from 'lucide-react';
import { CanvasDimension, DiagramStyleType, Style3ExportScope, UiTheme } from '../types';
import { CANVAS_PRESETS } from '../constants/presets';

interface HeaderProps {
  previewBg: 'transparent' | 'white' | 'dark';
  onPreviewBgChange: (bg: 'transparent' | 'white' | 'dark') => void;
  onDownloadPng: (
    scale: number,
    transparent: boolean,
    area?: 'artboard' | 'content',
    saveAs?: boolean
  ) => Promise<void>;
  onCopyPng: (transparent: boolean) => Promise<void>;
  onDownloadSvg: (saveAs?: boolean) => void;
  diagramStyle?: DiagramStyleType;
  style3ExportScope?: Style3ExportScope;
  onStyle3ExportScopeChange?: (scope: Style3ExportScope) => void;
  onOpenThemes?: () => void;
  onOpenProjects?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  canvasDimension?: CanvasDimension;
  onCanvasDimensionChange?: (dim: CanvasDimension) => void;
  selectedElementId?: string | null;
  onExportSelectedElement?: () => void;
  showGuides?: boolean;
  onShowGuidesChange?: (v: boolean) => void;
  uiTheme?: UiTheme;
  onUiThemeChange?: (t: UiTheme) => void;
}

export const Header: React.FC<HeaderProps> = ({
  previewBg,
  onPreviewBgChange,
  onDownloadPng,
  onCopyPng,
  onDownloadSvg,
  diagramStyle,
  style3ExportScope = 'all',
  onStyle3ExportScopeChange,
  onOpenThemes,
  onOpenProjects,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  canvasDimension,
  onCanvasDimensionChange,
  selectedElementId,
  onExportSelectedElement,
  showGuides = true,
  onShowGuidesChange,
  uiTheme = 'putih',
  onUiThemeChange,
}) => {
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isTransparentExport, setIsTransparentExport] = useState(true);
  const [exportArea, setExportArea] = useState<'artboard' | 'content'>(
    'artboard'
  );
  // Pilihan lokasi simpan diingat antar sesi — dulu selalu kembali ke
  // "Otomatis" setiap halaman dimuat ulang, sehingga dialog "pilih lokasi"
  // tampak tidak pernah muncul.
  const [saveAsLocation, setSaveAsLocation] = useState<boolean>(() => {
    try {
      return localStorage.getItem('bagan_maker_save_as_location') === 'true';
    } catch {
      return false;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(
        'bagan_maker_save_as_location',
        String(saveAsLocation)
      );
    } catch {
      /* penyimpanan tidak tersedia — abaikan */
    }
  }, [saveAsLocation]);
  const [isExporting, setIsExporting] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copying' | 'copied'>(
    'idle'
  );

  const isStyle3 = diagramStyle === 'style3';
  const isStyle5 = diagramStyle === 'style5';

  const handleDownload = async (scale: number) => {
    setIsExporting(true);
    setIsExportMenuOpen(false);
    try {
      await onDownloadPng(scale, isTransparentExport, exportArea, saveAsLocation);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopy = async () => {
    setCopyStatus('copying');
    try {
      await onCopyPng(isTransparentExport);
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2200);
    } catch {
      setCopyStatus('idle');
    }
  };

  return (
    <header className="nb-skin nb-header h-16 px-3 md:px-6 flex items-center justify-between z-30 shrink-0 select-none gap-2">
      {/* Brand */}
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-700 via-purple-600 to-pink-500 text-white flex items-center justify-center shadow-sm shrink-0">
          <Layers className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-slate-900 leading-none">
              Bagan Maker
            </h1>
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
              PNG Transparan
            </span>
          </div>
          <p className="text-[11px] text-slate-500 hidden sm:block">
            Generator bagan, slide & kartu soal profesional
          </p>
        </div>
      </div>

      {/* Center Tools: Undo/Redo + Preview BG + Themes + Projects */}
      <div className="flex items-center gap-2">
        {/* Undo / Redo */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/80">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:hover:text-slate-600 transition-all cursor-pointer"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:hover:text-slate-600 transition-all cursor-pointer"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tema Tampilan (putih / abu / hitam) */}
        {onUiThemeChange && (
          <div
            className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80"
            role="group"
            aria-label="Tema tampilan"
          >
            {(
              [
                ['putih', 'Tema Putih (terang) — default'],
                ['abu', 'Tema Abu (netral)'],
                ['hitam', 'Tema Hitam (gelap)'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => onUiThemeChange(value)}
                aria-pressed={uiTheme === value}
                aria-label={label}
                title={label}
                className="nb-swatch"
              >
                <span className={`nb-swatch-dot nb-swatch-dot--${value}`} />
              </button>
            ))}
          </div>
        )}

        {/* Center: Preview Background Mode */}
        <div className="hidden lg:flex items-center bg-slate-100 p-1 rounded-xl text-xs">
          <span className="text-slate-400 text-[11px] px-2 font-medium">
            Preview:
          </span>
          <button
            type="button"
            onClick={() => onPreviewBgChange('transparent')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              previewBg === 'transparent'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Transparan
          </button>
          <button
            type="button"
            onClick={() => onPreviewBgChange('white')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              previewBg === 'white'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Putih
          </button>
          <button
            type="button"
            onClick={() => onPreviewBgChange('dark')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              previewBg === 'dark'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Gelap
          </button>
        </div>

        {/* Canvas Dimension Presets (semua gaya) */}
        {canvasDimension && onCanvasDimensionChange && (
          <div className="hidden xl:flex items-center bg-slate-100 p-0.5 rounded-xl text-xs border border-slate-200/80">
            {(['16:9', '1:1', '9:16'] as const).map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => onCanvasDimensionChange(CANVAS_PRESETS[preset])}
                className={`px-2 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  canvasDimension.preset === preset
                    ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        )}

        {/* Toggle Panduan Kanvas (Crosshair + Area Aman Video) */}
        {onShowGuidesChange && (
          <button
            type="button"
            onClick={() => onShowGuidesChange(!showGuides)}
            className={`inline-flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all shadow-2xs cursor-pointer ${
              showGuides
                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                : 'bg-white hover:bg-slate-50 text-slate-500 border-slate-200'
            }`}
            title="Tampilkan / sembunyikan panduan kanvas (crosshair & area aman video)"
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Panduan</span>
          </button>
        )}

        {/* Tema Warna Universal Button */}
        {onOpenThemes && (
          <button
            type="button"
            onClick={onOpenThemes}
            className="inline-flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold border border-purple-200 transition-all shadow-2xs cursor-pointer"
            title="Sistem Tema Warna Universal (Berlaku untuk semua gaya)"
          >
            <Palette className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tema Warna</span>
          </button>
        )}

        {/* Proyek Saya Button */}
        {onOpenProjects && (
          <button
            type="button"
            onClick={onOpenProjects}
            className="inline-flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-all shadow-2xs cursor-pointer"
            title="Kelola & Simpan Dokumen Proyek"
          >
            <Folder className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Proyek Saya</span>
          </button>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {/* Copy to Clipboard */}
        <button
          type="button"
          onClick={handleCopy}
          disabled={copyStatus === 'copying'}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-all shadow-2xs cursor-pointer"
          title="Salin gambar langsung ke clipboard"
        >
          {copyStatus === 'copying' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : copyStatus === 'copied' ? (
            <Check className="w-3.5 h-3.5 text-emerald-600" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
          <span className="hidden sm:inline">
            {copyStatus === 'copied' ? 'Tersalin!' : 'Salin Gambar'}
          </span>
        </button>

        {/* Download SVG */}
        <button
          type="button"
          onClick={() => onDownloadSvg(saveAsLocation)}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-all shadow-2xs cursor-pointer"
          title={
            saveAsLocation
              ? 'Unduh format vektor SVG — Anda akan diminta memilih folder & nama file'
              : 'Unduh format vektor SVG'
          }
        >
          <FileCode className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">SVG</span>
        </button>

        {/* Diagnosa ekspor — membuka alat pemeriksa di tab baru */}
        <button
          type="button"
          onClick={() => window.open('./diagnosa.html', '_blank')}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-all shadow-2xs cursor-pointer"
          title="Diagnosa ekspor — periksa kenapa gambar gagal disimpan"
        >
          <Stethoscope className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Diagnosa</span>
        </button>

        {/* Download PNG with resolution dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
            disabled={isExporting}
            title={
              saveAsLocation
                ? 'Download PNG — Anda akan diminta memilih folder & nama file'
                : 'Download PNG — ekspor gambar beresolusi tinggi'
            }
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-sm active:scale-98 cursor-pointer"
          >
            {isExporting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>Download PNG</span>
            <ChevronDown className="w-3 h-3 opacity-80" />
          </button>

          {/* Export Menu Dropdown */}
          {isExportMenuOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-2.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
              {/* Style 3 Scope Selector */}
              {isStyle3 && onStyle3ExportScopeChange && (
                <div className="p-2 border-b border-slate-100 mb-2">
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                    Cakupan Ekspor (Gaya 3):
                  </span>
                  <div className="grid grid-cols-3 gap-1 bg-slate-100 p-0.5 rounded-lg text-[10px]">
                    <button
                      type="button"
                      onClick={() => onStyle3ExportScopeChange('all')}
                      className={`py-1 px-1 rounded-md font-medium text-center transition-all ${
                        style3ExportScope === 'all'
                          ? 'bg-white text-indigo-700 shadow-2xs font-semibold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Keduanya
                    </button>
                    <button
                      type="button"
                      onClick={() => onStyle3ExportScopeChange('question-only')}
                      className={`py-1 px-1 rounded-md font-medium text-center transition-all ${
                        style3ExportScope === 'question-only'
                          ? 'bg-white text-indigo-700 shadow-2xs font-semibold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Soal saja
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onStyle3ExportScopeChange('explanation-only')
                      }
                      className={`py-1 px-1 rounded-md font-medium text-center transition-all ${
                        style3ExportScope === 'explanation-only'
                          ? 'bg-white text-indigo-700 shadow-2xs font-semibold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Jawaban
                    </button>
                  </div>
                </div>
              )}

              {/* Option: Export Selected Element ONLY */}
              {selectedElementId && onExportSelectedElement && (
                <div className="p-1 border-b border-slate-100 mb-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsExportMenuOpen(false);
                      onExportSelectedElement();
                    }}
                    className="w-full flex items-center gap-2 p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-950 font-medium transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <div className="text-left">
                      <div className="font-bold text-[11px] text-amber-900">
                        Ekspor Elemen Terpilih
                      </div>
                      <div className="text-[10px] text-amber-700/80">
                        Hanya elemen yang dipilih (PNG Transparan)
                      </div>
                    </div>
                  </button>
                </div>
              )}

              {/* Option: Export Area (Artboard vs Content only) */}
              <div className="p-2 border-b border-slate-100 mb-1">
                <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                  Area Ekspor:
                </span>
                <div className="grid grid-cols-2 gap-1 bg-slate-100 p-0.5 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setExportArea('artboard')}
                    className={`py-1 rounded-md font-medium text-[11px] transition-all cursor-pointer ${
                      exportArea === 'artboard'
                        ? 'bg-white text-indigo-700 shadow-2xs'
                        : 'text-slate-600'
                    }`}
                  >
                    Artboard penuh
                  </button>
                  <button
                    type="button"
                    onClick={() => setExportArea('content')}
                    className={`py-1 rounded-md font-medium text-[11px] transition-all cursor-pointer ${
                      exportArea === 'content'
                        ? 'bg-white text-indigo-700 shadow-2xs'
                        : 'text-slate-600'
                    }`}
                  >
                    Konten saja
                  </button>
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">
                  {exportArea === 'artboard'
                    ? 'Seluruh area kanvas (termasuk ruang kosong).'
                    : 'Dipangkas rapat ke ukuran isi bagan.'}
                </span>
              </div>

              {/* Option: Transparent vs Solid */}
              <div className="p-2 border-b border-slate-100 mb-1">
                <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                  Latar Belakang Ekspor:
                </span>
                <div className="grid grid-cols-2 gap-1 bg-slate-100 p-0.5 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setIsTransparentExport(true)}
                    className={`py-1 rounded-md font-medium text-[11px] transition-all ${
                      isTransparentExport
                        ? 'bg-white text-indigo-700 shadow-2xs'
                        : 'text-slate-600'
                    }`}
                  >
                    Transparan
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsTransparentExport(false)}
                    className={`py-1 rounded-md font-medium text-[11px] transition-all ${
                      !isTransparentExport
                        ? 'bg-white text-indigo-700 shadow-2xs'
                        : 'text-slate-600'
                    }`}
                  >
                    Putih Solid
                  </button>
                </div>
              </div>

              {/* Option: Save Location (auto vs Save As) */}
              <div className="p-2 border-b border-slate-100 mb-1">
                <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                  Lokasi Simpan:
                </span>
                <div className="grid grid-cols-2 gap-1 bg-slate-100 p-0.5 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setSaveAsLocation(false)}
                    className={`py-1 rounded-md font-medium text-[11px] transition-all cursor-pointer ${
                      !saveAsLocation
                        ? 'bg-white text-indigo-700 shadow-2xs'
                        : 'text-slate-600'
                    }`}
                  >
                    Otomatis
                  </button>
                  <button
                    type="button"
                    onClick={() => setSaveAsLocation(true)}
                    className={`py-1 rounded-md font-medium text-[11px] transition-all cursor-pointer ${
                      saveAsLocation
                        ? 'bg-white text-indigo-700 shadow-2xs'
                        : 'text-slate-600'
                    }`}
                  >
                    Pilih lokasi…
                  </button>
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">
                  {saveAsLocation
                    ? 'Berlaku untuk PNG & SVG — muncul dialog memilih folder & nama file.'
                    : 'Berlaku untuk PNG & SVG — langsung ke folder Unduhan.'}
                </span>
              </div>

              {/* Resolution Scale Options */}
              <div className="p-1 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 px-2 block">
                  Pilih Resolusi:
                </span>
                <button
                  type="button"
                  onClick={() => handleDownload(1)}
                  className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl hover:bg-slate-100 text-slate-700 text-left transition-colors cursor-pointer"
                >
                  <div>
                    <div className="font-semibold">Skala 1x</div>
                    <div className="text-[11px] text-slate-400">
                      Ukuran standar (layar web)
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownload(2)}
                  className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl bg-indigo-50/70 hover:bg-indigo-100/70 text-indigo-950 text-left transition-colors cursor-pointer"
                >
                  <div>
                    <div className="font-bold flex items-center gap-1.5">
                      <span>Skala 2x</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-600 text-white font-medium">
                        Rekomendasi
                      </span>
                    </div>
                    <div className="text-[11px] text-indigo-600/80">
                      Resolusi tinggi (tajam Retina)
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownload(3)}
                  className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl hover:bg-slate-100 text-slate-700 text-left transition-colors cursor-pointer"
                >
                  <div>
                    <div className="font-semibold">Skala 3x</div>
                    <div className="text-[11px] text-slate-400">
                      Ultra HD (cetak & presentasi)
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
