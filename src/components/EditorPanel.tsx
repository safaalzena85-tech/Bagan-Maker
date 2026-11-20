import React, { useState } from 'react';
import {
  FileText,
  Palette,
  Sliders,
  Plus,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Sparkles,
  BookmarkPlus,
  CaseSensitive,
  Check,
  Type,
  LayoutGrid,
  ListOrdered,
  Layers,
  HelpCircle,
  ImageIcon,
  Upload,
  Pencil,
  Camera,
  Eye,
  EyeOff,
  Move,
  Pipette,
  Ratio,
  Maximize,
  ZoomIn,
  ZoomOut,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react';
import {
  CanvasDimension,
  CaseTransformSettings,
  ChoiceNumberingType,
  ChoiceSeparator,
  ColorSettings,
  DiagramStyleType,
  FontWeightOption,
  ImageFitOption,
  LayoutSettings,
  NumberingSeparator,
  NumberingType,
  Style3ColorSettings,
  Style3LayoutSettings,
  Style3QuestionData,
  Style3ThemePreset,
  Style5ColorSettings,
  Style5Data,
  Style5FontWeight,
  Style5FreeElement,
  Style5LayoutSettings,
  Style5NumberingType,
  Style5PointItem,
  Style5PointMode,
  SubBoxItem,
  TextCaseType,
  ThemePreset,
} from '../types';
import {
  THEME_PRESETS,
  STYLE3_THEME_PRESETS,
  CANVAS_PRESETS,
  DEFAULT_STYLE5_DATA,
  DEFAULT_STYLE5_COLORS,
  DEFAULT_STYLE5_LAYOUT,
  STYLE5_FONT_WEIGHT_OPTIONS,
} from '../constants/presets';
import { ColorField } from './ColorField';
import { StrokeProfileDropdown } from './StrokeProfileDropdown';
import { toSentenceCase } from '../utils/textCase';
import {
  serializeSubBoxesToSingleString,
  parseSingleStringToSubBoxes,
  SAMPLE_8_INSTRUMEN,
  SAMPLE_16_INSTRUMEN,
  serializeStyle1ToQuickText,
  parseStyle1QuickText,
  serializeStyle2ToQuickText,
  parseStyle2QuickText,
  serializeStyle3ToQuickPipeText,
  parseStyle3QuickPipeText,
  serializeStyle5ToQuickText,
  parseStyle5QuickText,
} from '../utils/singleBoxParser';

interface EditorPanelProps {
  diagramStyle: DiagramStyleType;
  onDiagramStyleChange: (style: DiagramStyleType) => void;
  mainTitle: string;
  onMainTitleChange: (val: string) => void;
  subBoxes: SubBoxItem[];
  onSubBoxesChange: (items: SubBoxItem[]) => void;
  colors: ColorSettings;
  onColorsChange: (colors: ColorSettings) => void;
  layout: LayoutSettings;
  onLayoutChange: (layout: LayoutSettings) => void;
  caseSettings: CaseTransformSettings;
  onCaseSettingsChange: (settings: CaseTransformSettings) => void;
  onApplyCasePermanently: () => void;
  onOpenBulkPaste: () => void;
  onResetToDefault: () => void;
  onLoadStyle2Default: () => void;
  themes: ThemePreset[];
  onSaveCustomTheme: (name: string) => void;
  onEditTheme: (id: string, name: string, updateColors: boolean) => void;
  onDuplicateTheme: (theme: ThemePreset) => void;
  onDeleteTheme: (id: string) => void;
  onRestoreDefaultThemes: () => void;
  // Style 3 props
  style3Data: Style3QuestionData;
  onStyle3DataChange: (data: Style3QuestionData) => void;
  style3Colors: Style3ColorSettings;
  onStyle3ColorsChange: (colors: Style3ColorSettings) => void;
  style3Layout: Style3LayoutSettings;
  onStyle3LayoutChange: (layout: Style3LayoutSettings) => void;
  onLoadStyle3Default: () => void;
  style3Themes: Style3ThemePreset[];
  onSaveStyle3Theme: (name: string) => void;
  onEditStyle3Theme: (id: string, name: string, updateColors: boolean) => void;
  onDuplicateStyle3Theme: (theme: Style3ThemePreset) => void;
  onDeleteStyle3Theme: (id: string) => void;
  onRestoreDefaultStyle3Themes: () => void;
  onLoadStyle4Default?: () => void;
  // Style 5 props
  style5Data?: Style5Data;
  onStyle5DataChange?: (data: Style5Data) => void;
  style5Colors?: Style5ColorSettings;
  onStyle5ColorsChange?: (colors: Style5ColorSettings) => void;
  style5Layout?: Style5LayoutSettings;
  onStyle5LayoutChange?: (layout: Style5LayoutSettings) => void;
  onLoadStyle5Default?: () => void;
  selectedStyle5ElementId?: string | null;
  onSelectStyle5Element?: (id: string | null) => void;
  selectedStyle5Ids?: string[];
  onSelectStyle5Ids?: (ids: string[]) => void;
  canvasDimension?: CanvasDimension;
  onCanvasDimensionChange?: (dim: CanvasDimension) => void;
  onOpenThemes?: () => void;
  onResetStyle5Colors?: () => void;
  /** Profil stroke global untuk semua bingkai/shape. */
  shapeProfile?: string;
  onShapeProfileChange?: (profile: string) => void;
  /** Artboard Gaya 5 (untuk duplikat elemen terpilih). */
  style5Artboards?: { id: string; name: string }[];
  activeStyle5ArtboardId?: string;
  onSelectStyle5Artboard?: (id: string) => void;
  onAddStyle5Artboard?: () => void;
  onDeleteStyle5Artboard?: (id: string) => void;
  onRenameStyle5Artboard?: (id: string, name: string) => void;
  onDuplicateSelectionToArtboard?: (targetId: string) => void;
}

const CASE_OPTIONS: { value: TextCaseType; label: string }[] = [
  { value: 'none', label: '1. Sesuai input (tanpa perubahan)' },
  { value: 'upper', label: '2. HURUF KAPITAL SEMUA (UPPERCASE)' },
  { value: 'lower', label: '3. huruf kecil semua (lowercase)' },
  { value: 'title', label: '4. Huruf Awal Kapital Tiap Kata (Title Case)' },
  { value: 'sentence', label: '5. Huruf kapital di awal kalimat (Sentence case)' },
  { value: 'toggle', label: '6. tOGGLE cASE (kebalikan huruf)' },
];

export const EditorPanel: React.FC<EditorPanelProps> = ({
  diagramStyle,
  onDiagramStyleChange,
  mainTitle,
  onMainTitleChange,
  subBoxes,
  onSubBoxesChange,
  colors,
  onColorsChange,
  layout,
  onLayoutChange,
  caseSettings,
  onCaseSettingsChange,
  onApplyCasePermanently,
  onOpenBulkPaste,
  onResetToDefault,
  onLoadStyle2Default,
  themes,
  onSaveCustomTheme,
  onEditTheme,
  onDuplicateTheme,
  onDeleteTheme,
  onRestoreDefaultThemes,
  style3Data,
  onStyle3DataChange,
  style3Colors,
  onStyle3ColorsChange,
  style3Layout,
  onStyle3LayoutChange,
  onLoadStyle3Default,
  style3Themes,
  onSaveStyle3Theme,
  onEditStyle3Theme,
  onDuplicateStyle3Theme,
  onDeleteStyle3Theme,
  onRestoreDefaultStyle3Themes,
  onLoadStyle4Default,
  style5Data,
  onStyle5DataChange,
  style5Colors,
  onStyle5ColorsChange,
  style5Layout,
  onStyle5LayoutChange,
  onLoadStyle5Default,
  selectedStyle5ElementId,
  onSelectStyle5Element,
  selectedStyle5Ids,
  onSelectStyle5Ids,
  style5Data: style5DataProp,
  onStyle5DataChange: onStyle5DataChangeProp,
  canvasDimension,
  onCanvasDimensionChange,
  onOpenThemes,
  onResetStyle5Colors,
  shapeProfile,
  onShapeProfileChange,
  style5Artboards,
  activeStyle5ArtboardId,
  onSelectStyle5Artboard,
  onAddStyle5Artboard,
  onDeleteStyle5Artboard,
  onRenameStyle5Artboard,
  onDuplicateSelectionToArtboard,
}) => {
  const [activeTab, setActiveTab] = useState<'content' | 'colors' | 'layout'>('content');

  // Panel bisa di-minimize menjadi rail ikon saja (pilihan disimpan).
  const PANEL_COLLAPSED_KEY = 'bagan_maker_panel_collapsed';
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('bagan_maker_panel_collapsed') === '1';
    } catch {
      return false;
    }
  });
  const handleCollapsedChange = (value: boolean) => {
    setIsCollapsed(value);
    try {
      localStorage.setItem(PANEL_COLLAPSED_KEY, value ? '1' : '0');
    } catch {
      /* abaikan */
    }
  };

  // Custom theme save & edit state for Gaya 1 & 2
  const [isSavingTheme, setIsSavingTheme] = useState(false);
  const [newThemeName, setNewThemeName] = useState('');
  const [themeSaveError, setThemeSaveError] = useState('');
  const [editingThemeId, setEditingThemeId] = useState<string | null>(null);
  const [editingThemeName, setEditingThemeName] = useState('');
  const [editingThemeUpdateColors, setEditingThemeUpdateColors] = useState(false);

  // Custom theme save & edit state for Gaya 3
  const [isSavingStyle3Theme, setIsSavingStyle3Theme] = useState(false);
  const [newStyle3ThemeName, setNewStyle3ThemeName] = useState('');
  const [style3ThemeSaveError, setStyle3ThemeSaveError] = useState('');
  const [editingStyle3ThemeId, setEditingStyle3ThemeId] = useState<string | null>(null);
  const [editingStyle3ThemeName, setEditingStyle3ThemeName] = useState('');
  const [editingStyle3ThemeUpdateColors, setEditingStyle3ThemeUpdateColors] = useState(false);

  const isStyle3 = diagramStyle === 'style3';
  const isStyle2 = diagramStyle === 'style2';
  const isStyle4 = diagramStyle === 'style4';
  const isStyle5 = diagramStyle === 'style5';

  // Fallback aman agar panel Gaya 5 selalu punya nilai (props bersifat optional)
  const s5Data = style5DataProp ?? style5Data ?? DEFAULT_STYLE5_DATA;
  const s5Colors = style5Colors ?? DEFAULT_STYLE5_COLORS;
  const s5Layout = style5Layout ?? DEFAULT_STYLE5_LAYOUT;
  const setS5Data = onStyle5DataChangeProp ?? onStyle5DataChange ?? ((_: any) => {});

  // Practical Single-box Input State for Pill Sub Boxes & Circle Numbers
  const [singleBoxText, setSingleBoxText] = useState(() =>
    serializeSubBoxesToSingleString(subBoxes)
  );
  const [isSingleBoxFocused, setIsSingleBoxFocused] = useState(false);

  // Synchronize singleBoxText whenever subBoxes changes externally
  React.useEffect(() => {
    if (!isSingleBoxFocused) {
      setSingleBoxText(serializeSubBoxesToSingleString(subBoxes));
    }
  }, [subBoxes, isSingleBoxFocused]);

  const handleSingleBoxChange = (val: string) => {
    setSingleBoxText(val);
    const parsed = parseSingleStringToSubBoxes(val, subBoxes, isStyle4 ? 16 : 8);
    if (parsed.length > 0) {
      onSubBoxesChange(parsed);
    }
  };

  const handleLoadSample = (sample: string) => {
    setSingleBoxText(sample);
    const parsed = parseSingleStringToSubBoxes(sample, subBoxes, isStyle4 ? 16 : 8);
    if (parsed.length > 0) {
      onSubBoxesChange(parsed);
    }
  };

  // Add new sub box (max 16 for Style 4, max 8 for Style 1 & 2)
  const handleAddSubBox = () => {
    const maxSubs = isStyle4 ? 16 : 8;
    if (subBoxes.length >= maxSubs) return;
    const nextNum = subBoxes.length + 1;
    const newItem: SubBoxItem = {
      id: `sub-${Date.now()}-${nextNum}`,
      title: isStyle4 ? `Instrumen ${nextNum}` : `Sub Box ${nextNum}`,
      content: isStyle4
        ? `Sub Box ${nextNum}`
        : isStyle2
        ? `Poin penting ${nextNum} yang jelas dan informatif`
        : 'Tulis penjelasan atau poin penting di sini...',
      side: isStyle4 ? (nextNum % 2 === 1 ? 'left' : 'right') : undefined,
    };
    onSubBoxesChange([...subBoxes, newItem]);
  };

  // Balance items evenly between left and right for Style 4
  const handleBalanceSides = () => {
    const half = Math.ceil(subBoxes.length / 2);
    const updated = subBoxes.map((s, idx) => ({
      ...s,
      side: (idx < half ? 'left' : 'right') as 'left' | 'right',
    }));
    onSubBoxesChange(updated);
  };

  // Remove sub box (min 2 for Style 1 & 2)
  const handleRemoveSubBox = (id: string) => {
    if (subBoxes.length <= 2) return;
    onSubBoxesChange(subBoxes.filter((s) => s.id !== id));
  };

  // Update item field or multiple fields for Sub Boxes
  const handleUpdateSubBox = (
    id: string,
    fieldOrUpdates: keyof SubBoxItem | Partial<SubBoxItem>,
    value?: string | boolean | undefined
  ) => {
    if (typeof fieldOrUpdates === 'object' && fieldOrUpdates !== null) {
      onSubBoxesChange(
        subBoxes.map((s) => (s.id === id ? { ...s, ...fieldOrUpdates } : s))
      );
    } else {
      onSubBoxesChange(
        subBoxes.map((s) =>
          s.id === id ? { ...s, [fieldOrUpdates as keyof SubBoxItem]: value } : s
        )
      );
    }
  };

  // Reorder items
  const handleMove = (index: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= subBoxes.length) return;
    const copy = [...subBoxes];
    const temp = copy[index];
    copy[index] = copy[newIdx];
    copy[newIdx] = temp;
    onSubBoxesChange(copy);
  };

  // =====================================================
  // OPERASI GAYA 5: SLIDE MATERI (SIDEBAR + FOTO)
  // =====================================================
  const updateStyle5 = (updater: (d: Style5Data) => Style5Data) => {
    setS5Data(updater(s5Data));
  };

  const handleS5AddPoint = () => {
    if (!style5Data || style5Data.points.length >= 8) return;
    const nextNum = style5Data.points.length + 1;
    updateStyle5((d) => ({
      ...d,
      points: [
        ...d.points,
        {
          id: `s5-p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          number: nextNum < 10 ? `0${nextNum}` : `${String(nextNum)}`,
          pillText: `Poin baru ${nextNum}`,
          descriptionText: 'Tulis deskripsi atau penjelasan poin di sini...',
          mode: 'both',
          hideNumberBox: false,
        },
      ],
    }));
  };

  const handleS5UpdatePoint = (id: string, updates: Partial<Style5PointItem>) => {
    updateStyle5((d) => ({
      ...d,
      points: d.points.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }));
  };

  const handleS5DuplicatePoint = (id: string) => {
    if (!style5Data || style5Data.points.length >= 8) return;
    const src = style5Data.points.find((p) => p.id === id);
    if (!src) return;
    const nextNum = style5Data.points.length + 1;
    updateStyle5((d) => ({
      ...d,
      points: [
        ...d.points,
        {
          ...src,
          id: `s5-p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          number: nextNum < 10 ? `0${nextNum}` : `${String(nextNum)}`,
        },
      ],
    }));
  };

  const handleS5DeletePoint = (id: string) => {
    if (!style5Data || style5Data.points.length <= 1) return;
    if (!window.confirm('Hapus poin ini beserta isinya?')) return;
    updateStyle5((d) => ({
      ...d,
      points: d.points.filter((p) => p.id !== id),
    }));
    if (selectedStyle5ElementId === `point-${id}`) onSelectStyle5Element?.(null);
  };

  const handleS5MovePoint = (index: number, direction: 'up' | 'down') => {
    if (!style5Data) return;
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= style5Data.points.length) return;
    updateStyle5((d) => {
      const pts = [...d.points];
      const tmp = pts[index];
      pts[index] = pts[targetIdx];
      pts[targetIdx] = tmp;
      return { ...d, points: pts };
    });
  };

  // Elemen bebas (teks & gambar)
  const handleS5AddTextElement = () => {
    updateStyle5((d) => ({
      ...d,
      freeElements: [
        ...d.freeElements,
        {
          id: `free-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          type: 'text',
          x: Math.round((canvasDimension?.width || 1920) * 0.4),
          y: Math.round((canvasDimension?.height || 1080) * 0.7),
          width: 320,
          height: 90,
          content: 'Teks bebas... (klik 2x di kanvas untuk edit)',
          fontSize: 20,
          fontWeight: 'medium',
          color: '#2E2E2E',
          bgColor: 'rgba(255,255,255,0.9)',
          borderColor: '#3A3A3A',
          borderRadius: 14,
          zIndex: 25,
        },
      ],
    }));
  };

  const handleS5AddImageElement = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      if (!url) return;
      updateStyle5((d) => ({
        ...d,
        freeElements: [
          ...d.freeElements,
          {
            id: `free-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            type: 'image',
            x: Math.round((canvasDimension?.width || 1920) * 0.45),
            y: Math.round((canvasDimension?.height || 1080) * 0.35),
            width: 360,
            height: 240,
            content: url,
            zIndex: 25,
          },
        ],
      }));
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleS5UpdateFreeElement = (id: string, updates: Partial<Style5FreeElement>) => {
    updateStyle5((d) => ({
      ...d,
      freeElements: d.freeElements.map((f) => (f.id === id ? { ...f, ...updates } : f)),
    }));
  };

  const handleS5DeleteFreeElement = (id: string) => {
    if (!window.confirm('Hapus elemen ini dari slide?')) return;
    updateStyle5((d) => ({
      ...d,
      freeElements: d.freeElements.filter((f) => f.id !== id),
    }));
    if (selectedStyle5ElementId === `free-${id}`) onSelectStyle5Element?.(null);
  };

  const handleS5DuplicateFreeElement = (id: string) => {
    if (!style5Data) return;
    const src = style5Data.freeElements.find((f) => f.id === id);
    if (!src) return;
    updateStyle5((d) => ({
      ...d,
      freeElements: [
        ...d.freeElements,
        {
          ...src,
          id: `free-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          x: src.x + 30,
          y: src.y + 30,
        },
      ],
    }));
  };

  const handleS5MoveFreeElement = (id: string, direction: 'up' | 'down') => {
    if (!style5Data) return;
    const el = style5Data.freeElements.find((f) => f.id === id);
    if (!el) return;
    const step = direction === 'up' ? 1 : -1;
    handleS5UpdateFreeElement(id, { zIndex: (el.zIndex || 25) + step });
  };

  // Upload foto tokoh sidebar
  const handleS5PhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      if (!url) return;
      updateStyle5((d) => ({
        ...d,
        sidebar: { ...d.sidebar, photoUrl: url, photoPanX: 0, photoPanY: 0, photoZoom: 1 },
      }));
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleS5RemovePhoto = () => {
    updateStyle5((d) => ({
      ...d,
      sidebar: { ...d.sidebar, photoUrl: '' },
    }));
  };

  // Apply theme preset
  const applyPreset = (presetColors: ColorSettings) => {
    onColorsChange({ ...presetColors });
  };

  // Apply Style 3 theme preset
  const applyStyle3Preset = (presetColors: Style3ColorSettings) => {
    onStyle3ColorsChange({ ...presetColors });
  };

  // Handle saving new custom theme
  const handleSaveThemeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newThemeName.trim();
    if (!trimmed) {
      setThemeSaveError('Nama tema tidak boleh kosong');
      return;
    }
    onSaveCustomTheme(trimmed);
    setNewThemeName('');
    setIsSavingTheme(false);
    setThemeSaveError('');
  };

  // Handle saving new custom Style 3 theme
  const handleSaveStyle3ThemeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newStyle3ThemeName.trim();
    if (!trimmed) {
      setStyle3ThemeSaveError('Nama tema tidak boleh kosong');
      return;
    }
    onSaveStyle3Theme(trimmed);
    setNewStyle3ThemeName('');
    setIsSavingStyle3Theme(false);
    setStyle3ThemeSaveError('');
  };

  // Auto sentence case on paste
  const handleInputPaste = (
    e: React.ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>,
    onApplyFormatted: (val: string) => void
  ) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text/plain');
    if (!pasted) return;
    const formatted = toSentenceCase(pasted);

    const target = e.currentTarget;
    const start = target.selectionStart || 0;
    const end = target.selectionEnd || 0;
    const oldVal = target.value;
    const newVal = oldVal.substring(0, start) + formatted + oldVal.substring(end);
    onApplyFormatted(newVal);
  };

  // Style 3 Choices operations
  const handleAddChoice = () => {
    if (style3Data.choices.length >= 6) return;
    onStyle3DataChange({
      ...style3Data,
      choices: [...style3Data.choices, 'Pilihan jawaban baru'],
    });
  };

  const handleRemoveChoice = (index: number) => {
    if (style3Data.choices.length <= 2) return;
    const newChoices = style3Data.choices.filter((_, i) => i !== index);
    let newCorrect = style3Data.correctAnswerIndex;
    if (newCorrect === index) {
      newCorrect = 0;
    } else if (newCorrect > index) {
      newCorrect = newCorrect - 1;
    }
    onStyle3DataChange({
      ...style3Data,
      choices: newChoices,
      correctAnswerIndex: newCorrect,
    });
  };

  const handleUpdateChoice = (index: number, val: string) => {
    const newChoices = [...style3Data.choices];
    newChoices[index] = val;
    onStyle3DataChange({
      ...style3Data,
      choices: newChoices,
    });
  };

  // Handle Image Upload for Style 3
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      if (result) {
        onStyle3DataChange({
          ...style3Data,
          imageUrl: result,
          showImageBox: true,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    onStyle3DataChange({
      ...style3Data,
      imageUrl: '',
    });
  };

  // Blok Ukuran Kanvas (berlaku untuk semua gaya)
  const canvasSizeBlock =
    canvasDimension && onCanvasDimensionChange ? (
      <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3.5">
        <div className="flex items-center gap-1.5">
          <Maximize className="w-4 h-4 text-emerald-700" />
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-950">
            Ukuran Kanvas
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {(['16:9', '1:1', '9:16'] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => onCanvasDimensionChange(CANVAS_PRESETS[key])}
              className={`py-2 px-2 rounded-xl text-[11px] font-semibold border transition-all cursor-pointer ${
                canvasDimension.preset === key
                  ? 'bg-emerald-600 border-emerald-600 text-white'
                  : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span className="block">{key}</span>
              <span className="block text-[9px] font-normal opacity-80">
                {CANVAS_PRESETS[key].width} × {CANVAS_PRESETS[key].height}
              </span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-slate-600 block">
              Lebar (px):
            </label>
            <input
              type="number"
              min={200}
              max={5000}
              value={canvasDimension.width}
              onChange={(e) =>
                onCanvasDimensionChange({
                  ...canvasDimension,
                  preset: 'custom',
                  width: Number(e.target.value),
                })
              }
              className="w-full px-2.5 py-1.5 text-xs font-medium border border-slate-300 rounded-lg bg-white text-slate-800"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-slate-600 block">
              Tinggi (px):
            </label>
            <input
              type="number"
              min={200}
              max={5000}
              value={canvasDimension.height}
              onChange={(e) =>
                onCanvasDimensionChange({
                  ...canvasDimension,
                  preset: 'custom',
                  height: Number(e.target.value),
                })
              }
              className="w-full px-2.5 py-1.5 text-xs font-medium border border-slate-300 rounded-lg bg-white text-slate-800"
            />
          </div>
        </div>
      </div>
    ) : null;

  // ===== Mode minimize: panel menyusut jadi rail ikon saja =====
  if (isCollapsed) {
    return (
      <div className="nb-skin nb-panel w-[64px] shrink-0 h-full flex flex-col items-center py-3 gap-1 select-none overflow-y-auto overflow-x-hidden">
        <button
          type="button"
          onClick={() => handleCollapsedChange(false)}
          title="Tampilkan panel editor"
          aria-label="Tampilkan panel editor"
          className="nb-rail-item text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 cursor-pointer"
        >
          <PanelRightOpen className="w-4 h-4" />
        </button>

        <div className="nb-rail-divider" />

        {(
          [
            ['content', 'Konten — teks bagan', FileText],
            ['colors', 'Warna — palet & tema', Palette],
            ['layout', 'Pengaturan — tata letak & tipografi', Sliders],
          ] as const
        ).map(([tab, label, Icon]) => (
          <button
            key={tab}
            type="button"
            onClick={() => {
              setActiveTab(tab);
              handleCollapsedChange(false);
            }}
            title={label}
            aria-label={label}
            className={`nb-rail-item cursor-pointer ${
              activeTab === tab
                ? 'nb-rail-item--active'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            <Icon className="w-4 h-4" />
          </button>
        ))}

        <div className="nb-rail-divider" />

        {(
          [
            ['style1', 'Gaya 1', LayoutGrid],
            ['style2', 'Gaya 2', ListOrdered],
            ['style3', 'Gaya 3', HelpCircle],
            ['style4', 'Gaya 4: Radial', Layers],
            ['style5', 'Gaya 5: Slide Materi', ImageIcon],
          ] as const
        ).map(([value, label, Icon]) => (
          <button
            key={value}
            type="button"
            onClick={() => onDiagramStyleChange(value)}
            title={label}
            aria-label={label}
            className={`nb-rail-item cursor-pointer ${
              diagramStyle === value
                ? 'nb-rail-item--active'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            <Icon className="w-4 h-4" />
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="nb-skin nb-panel w-full lg:w-[420px] xl:w-[460px] h-full flex flex-col select-none">
      {/* 
        =======================================================
        TOP: PEMILIH GAYA BAGAN (5 OPTIONS)
        [Gaya 1] [Gaya 2] [Gaya 3] [Gaya 4: Radial]
        [Gaya 5: Slide Materi (Sidebar + Foto)]
        =======================================================
      */}
      <div className="p-3 bg-slate-100 border-b border-slate-200 shrink-0">
        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center justify-between gap-2">
          <span>Pilih Gaya Bagan</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-normal text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
            {isStyle5
              ? 'Gaya 5 Slide Materi Aktif'
              : isStyle4
              ? 'Gaya 4 Radial Aktif'
              : isStyle3
              ? 'Gaya 3 Aktif'
              : isStyle2
              ? 'Gaya 2 Aktif'
              : 'Gaya 1 Aktif'}
            </span>
            <button
              type="button"
              onClick={() => handleCollapsedChange(true)}
              title="Sembunyikan panel — tampilkan ikon saja"
              aria-label="Sembunyikan panel editor"
              className="p-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 transition-colors cursor-pointer"
            >
              <PanelRightClose className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-4 p-1 bg-slate-200/90 rounded-xl gap-1">
          <button
            type="button"
            onClick={() => onDiagramStyleChange('style1')}
            className={`py-1.5 px-1.5 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
              diagramStyle === 'style1'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Gaya 1</span>
          </button>

          <button
            type="button"
            onClick={() => onDiagramStyleChange('style2')}
            className={`py-1.5 px-1.5 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
              diagramStyle === 'style2'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Gaya 2</span>
          </button>

          <button
            type="button"
            onClick={() => onDiagramStyleChange('style3')}
            className={`py-1.5 px-1.5 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
              diagramStyle === 'style3'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Gaya 3</span>
          </button>

          <button
            type="button"
            onClick={() => onDiagramStyleChange('style4')}
            className={`py-1.5 px-1.5 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
              diagramStyle === 'style4'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Gaya 4: Radial</span>
          </button>
        </div>

        {/* GAYA 5: PILIHAN KELIMA */}
        <button
          type="button"
          onClick={() => onDiagramStyleChange('style5')}
          className={`mt-1.5 w-full py-2 px-2.5 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            diagramStyle === 'style5'
              ? 'bg-white text-indigo-700 shadow-xs border border-indigo-200'
              : 'bg-slate-200/90 text-slate-600 hover:text-slate-900 hover:bg-slate-300/70 border border-transparent'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5 shrink-0" />
          <span>Gaya 5: Slide Materi (Sidebar + Foto)</span>
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="grid grid-cols-3 border-b border-slate-200 bg-slate-50/70 p-1.5 gap-1 shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab('content')}
          title="Konten — teks bagan"
          className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'content'
              ? 'bg-white text-indigo-700 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Konten</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('colors')}
          title="Warna — palet & tema"
          className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'colors'
              ? 'bg-white text-indigo-700 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Warna</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('layout')}
          title="Pengaturan — tata letak & tipografi"
          className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'layout'
              ? 'bg-white text-indigo-700 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Pengaturan</span>
        </button>
      </div>

      {/* Tab Content (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* ===================== TAB 1: KONTEN ===================== */}
        {activeTab === 'content' && (
          <div className="space-y-6">
            {/* Quick Bulk Paste Trigger Banner */}
            <div className="flex items-center justify-between p-3.5 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-800">
                    Tempel Teks Cepat
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {isStyle5
                      ? 'Format Gaya 5 (Nomor | Judul | Nama Tokoh, lalu Nomor | Pill | Deskripsi)'
                      : isStyle4
                      ? 'Format Gaya 4 (Lingkaran Tengah + Sub Box Kiri/Kanan)'
                      : isStyle3
                      ? 'Format Gaya 3 (Soal, Pilihan A-D, Penjelasan)'
                      : isStyle2
                      ? 'Format Gaya 2 (Judul + Sub box per baris)'
                      : 'Format Gaya 1 (Judul | Deskripsi)'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onOpenBulkPaste}
                className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-white border border-indigo-200 rounded-xl hover:bg-indigo-50 transition-colors shadow-2xs cursor-pointer"
              >
                Buka
              </button>
            </div>

            {/* Quick Load Default Buttons */}
            {isStyle5 && (
              <div className="flex items-center justify-between p-2.5 bg-indigo-50/70 border border-indigo-200/70 rounded-xl text-xs">
                <span className="text-indigo-950 font-medium">
                  Contoh Default: "Hubungan antara Ilmu Sejarah dan Ilmu Sosial"
                </span>
                {onLoadStyle5Default && (
                  <button
                    type="button"
                    onClick={onLoadStyle5Default}
                    className="px-2.5 py-1 text-[11px] font-semibold text-indigo-900 bg-white border border-indigo-300 rounded-lg hover:bg-indigo-100 cursor-pointer"
                  >
                    Muat Contoh
                  </button>
                )}
              </div>
            )}

            {/* Batch UI for multi-select Style 5 */}
            {isStyle5 && selectedStyle5Ids && selectedStyle5Ids.length >= 2 && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-amber-700" />
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                      Terpilih {selectedStyle5Ids.length} elemen
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectStyle5Ids?.([]);
                      onSelectStyle5Element?.(null);
                    }}
                    className="text-[11px] font-semibold text-amber-900 bg-white border border-amber-300 rounded-lg px-2 py-1 hover:bg-amber-100"
                  >
                    Bersihkan
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={() => {
                      const ids = new Set(selectedStyle5Ids);
                      let nextData: any = { ...s5Data };
                      // Delete removable elements
                      nextData.points = nextData.points.filter((p: any) => !ids.has(`point-${p.id}`));
                      nextData.freeElements = nextData.freeElements.filter((f: any) => !ids.has(`free-${f.id}`));
                      // For structural elements, hide them
                      if (ids.has('header')) nextData.header = { ...nextData.header, show: false };
                      if (ids.has('photo') || ids.has('sidebar')) {
                        nextData.sidebar = { ...nextData.sidebar, showPhoto: false };
                      }
                      if (ids.has('name')) {
                        nextData.sidebar = { ...nextData.sidebar, showName: false };
                      }
                      setS5Data(nextData);
                      onSelectStyle5Ids?.([]);
                      onSelectStyle5Element?.(null);
                    }}
                    className="flex items-center justify-center gap-1 px-2 py-1.5 bg-white border border-rose-300 text-rose-700 rounded-lg hover:bg-rose-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Hapus Terpilih
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const offset = 20;
                      let nextData: any = { ...s5Data };
                      const newPointIds: string[] = [];
                      const newFreeIds: string[] = [];
                      const ids = new Set(selectedStyle5Ids);
                      // Duplicate points
                      s5Data.points.forEach((p: any) => {
                        if (ids.has(`point-${p.id}`)) {
                          const newId = `s5-p-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
                          newPointIds.push(newId);
                          nextData.points = [
                            ...nextData.points,
                            {
                              ...p,
                              id: newId,
                              x: (p.x || 0) + offset,
                              y: (p.y || 0) + offset,
                            },
                          ];
                        }
                      });
                      // Duplicate free elements
                      s5Data.freeElements.forEach((f: any) => {
                        if (ids.has(`free-${f.id}`)) {
                          const newId = `free-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
                          newFreeIds.push(newId);
                          nextData.freeElements = [
                            ...nextData.freeElements,
                            {
                              ...f,
                              id: newId,
                              x: f.x + offset,
                              y: f.y + offset,
                            },
                          ];
                        }
                      });
                      // For header/photo/name, skip duplication (structural) as per typical behavior
                      setS5Data(nextData);
                      if (newPointIds.length || newFreeIds.length) {
                        const newSel = [
                          ...newPointIds.map((id) => `point-${id}`),
                          ...newFreeIds.map((id) => `free-${id}`),
                        ];
                        onSelectStyle5Ids?.(newSel);
                        onSelectStyle5Element?.(newSel[0] || null);
                      }
                    }}
                    className="flex items-center justify-center gap-1 px-2 py-1.5 bg-white border border-indigo-300 text-indigo-700 rounded-lg hover:bg-indigo-50"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Duplikasi ke Kanvas Ini
                  </button>
                  {style5Artboards && style5Artboards.length > 1 && onDuplicateSelectionToArtboard && (
                    <div className="col-span-2 space-y-1.5 pt-1 border-t border-amber-200/70">
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-900">
                        <Copy className="w-3.5 h-3.5" />
                        Salin elemen terpilih ke artboard lain:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {style5Artboards
                          .filter((a) => a.id !== activeStyle5ArtboardId)
                          .map((a) => (
                            <button
                              key={a.id}
                              type="button"
                              onClick={() => onDuplicateSelectionToArtboard(a.id)}
                              className="px-2 py-1 text-[11px] font-semibold bg-white border border-emerald-300 text-emerald-700 rounded-lg hover:bg-emerald-50"
                              title={`Duplikat elemen terpilih ke "${a.name}"`}
                            >
                              → {a.name}
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {isStyle4 && (
              <div className="flex items-center justify-between p-2.5 bg-purple-50/80 border border-purple-200/70 rounded-xl text-xs">
                <span className="text-purple-950 font-medium">
                  Contoh Default: "Jenis instrumen pasar modal"
                </span>
                {onLoadStyle4Default && (
                  <button
                    type="button"
                    onClick={onLoadStyle4Default}
                    className="px-2.5 py-1 text-[11px] font-semibold text-purple-900 bg-white border border-purple-300 rounded-lg hover:bg-purple-100 cursor-pointer"
                  >
                    Muat Contoh
                  </button>
                )}
              </div>
            )}

            {isStyle3 && (
              <div className="flex items-center justify-between p-2.5 bg-amber-50/70 border border-amber-200/70 rounded-xl text-xs">
                <span className="text-amber-900 font-medium">
                  Contoh Default: "Question No. 2 (Subjunctive)"
                </span>
                <button
                  type="button"
                  onClick={onLoadStyle3Default}
                  className="px-2.5 py-1 text-[11px] font-semibold text-amber-800 bg-white border border-amber-300 rounded-lg hover:bg-amber-100 cursor-pointer"
                >
                  Muat Contoh
                </button>
              </div>
            )}

            {isStyle2 && (
              <div className="flex items-center justify-between p-2.5 bg-amber-50/70 border border-amber-200/70 rounded-xl text-xs">
                <span className="text-amber-900 font-medium">
                  Contoh Default: "Jenis-jenis reksa dana"
                </span>
                <button
                  type="button"
                  onClick={onLoadStyle2Default}
                  className="px-2.5 py-1 text-[11px] font-semibold text-amber-800 bg-white border border-amber-300 rounded-lg hover:bg-amber-100 cursor-pointer"
                >
                  Muat Contoh
                </button>
              </div>
            )}

            {/* 
              =======================================================
              FITUR CHANGE CASE (UNTUK TEKS)
              =======================================================
            */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <CaseSensitive className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Ubah Huruf (Change Case)
                  </span>
                </div>
                <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Non-destruktif
                </span>
              </div>

              {isStyle5 ? (
                <>
                  {/* (a) Judul Header */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-600 block">
                      (a) Judul Header:
                    </label>
                    <select
                      value={caseSettings.style5HeaderCase || 'none'}
                      onChange={(e) =>
                        onCaseSettingsChange({
                          ...caseSettings,
                          style5HeaderCase: e.target.value as TextCaseType,
                        })
                      }
                      className="w-full px-2.5 py-1.5 text-xs font-medium border border-slate-300 rounded-lg bg-white text-slate-800"
                    >
                      {CASE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* (b) Nama Tokoh */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-600 block">
                      (b) Nama Tokoh:
                    </label>
                    <select
                      value={caseSettings.style5NameCase || 'none'}
                      onChange={(e) =>
                        onCaseSettingsChange({
                          ...caseSettings,
                          style5NameCase: e.target.value as TextCaseType,
                        })
                      }
                      className="w-full px-2.5 py-1.5 text-xs font-medium border border-slate-300 rounded-lg bg-white text-slate-800"
                    >
                      {CASE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* (c) Pill Poin */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-600 block">
                      (c) Teks Pill Poin:
                    </label>
                    <select
                      value={caseSettings.style5PillCase || 'none'}
                      onChange={(e) =>
                        onCaseSettingsChange({
                          ...caseSettings,
                          style5PillCase: e.target.value as TextCaseType,
                        })
                      }
                      className="w-full px-2.5 py-1.5 text-xs font-medium border border-slate-300 rounded-lg bg-white text-slate-800"
                    >
                      {CASE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* (d) Teks Deskripsi */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-600 block">
                      (d) Teks Deskripsi:
                    </label>
                    <select
                      value={caseSettings.style5DescCase || 'none'}
                      onChange={(e) =>
                        onCaseSettingsChange({
                          ...caseSettings,
                          style5DescCase: e.target.value as TextCaseType,
                        })
                      }
                      className="w-full px-2.5 py-1.5 text-xs font-medium border border-slate-300 rounded-lg bg-white text-slate-800"
                    >
                      {CASE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              ) : isStyle3 ? (
                <>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-600 block">
                      (a) Label Pill Soal & Penjelasan:
                    </label>
                    <select
                      value={caseSettings.style3PillCase || 'none'}
                      onChange={(e) =>
                        onCaseSettingsChange({
                          ...caseSettings,
                          style3PillCase: e.target.value as TextCaseType,
                        })
                      }
                      className="w-full px-2.5 py-1.5 text-xs font-medium border border-slate-300 rounded-lg bg-white text-slate-800"
                    >
                      {CASE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* (b) Teks Soal */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-600 block">
                      (b) Teks Soal:
                    </label>
                    <select
                      value={caseSettings.style3QuestionCase || 'none'}
                      onChange={(e) =>
                        onCaseSettingsChange({
                          ...caseSettings,
                          style3QuestionCase: e.target.value as TextCaseType,
                        })
                      }
                      className="w-full px-2.5 py-1.5 text-xs font-medium border border-slate-300 rounded-lg bg-white text-slate-800"
                    >
                      {CASE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* (c) Pilihan Jawaban */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-600 block">
                      (c) Pilihan Jawaban:
                    </label>
                    <select
                      value={caseSettings.style3ChoiceCase || 'none'}
                      onChange={(e) =>
                        onCaseSettingsChange({
                          ...caseSettings,
                          style3ChoiceCase: e.target.value as TextCaseType,
                        })
                      }
                      className="w-full px-2.5 py-1.5 text-xs font-medium border border-slate-300 rounded-lg bg-white text-slate-800"
                    >
                      {CASE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* (d) Teks Penjelasan */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-600 block">
                      (d) Teks Penjelasan:
                    </label>
                    <select
                      value={caseSettings.style3ExplanationCase || 'none'}
                      onChange={(e) =>
                        onCaseSettingsChange({
                          ...caseSettings,
                          style3ExplanationCase: e.target.value as TextCaseType,
                        })
                      }
                      className="w-full px-2.5 py-1.5 text-xs font-medium border border-slate-300 rounded-lg bg-white text-slate-800"
                    >
                      {CASE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                <>
                  {/* (a) Judul Utama */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-600 block">
                      (a) Judul Utama:
                    </label>
                    <select
                      value={caseSettings.mainTitleCase}
                      onChange={(e) =>
                        onCaseSettingsChange({
                          ...caseSettings,
                          mainTitleCase: e.target.value as TextCaseType,
                        })
                      }
                      className="w-full px-2.5 py-1.5 text-xs font-medium border border-slate-300 rounded-lg bg-white text-slate-800"
                    >
                      {CASE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* (b) Teks Pill / Judul Sub Box */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-600 block">
                      (b) Teks Pill / Judul Sub Box:
                    </label>
                    <select
                      value={caseSettings.pillTitleCase}
                      onChange={(e) =>
                        onCaseSettingsChange({
                          ...caseSettings,
                          pillTitleCase: e.target.value as TextCaseType,
                        })
                      }
                      className="w-full px-2.5 py-1.5 text-xs font-medium border border-slate-300 rounded-lg bg-white text-slate-800"
                    >
                      {CASE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* (c) Teks Isi / Deskripsi */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-600 block">
                      (c) Teks Isi / Deskripsi:
                    </label>
                    <select
                      value={caseSettings.bodyCase}
                      onChange={(e) =>
                        onCaseSettingsChange({
                          ...caseSettings,
                          bodyCase: e.target.value as TextCaseType,
                        })
                      }
                      className="w-full px-2.5 py-1.5 text-xs font-medium border border-slate-300 rounded-lg bg-white text-slate-800"
                    >
                      {CASE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* Button to apply permanently to input fields */}
              <button
                type="button"
                onClick={onApplyCasePermanently}
                className="w-full py-2 px-3 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                title="Terapkan hasil perubahan huruf secara permanen ke teks input"
              >
                <Check className="w-3.5 h-3.5 text-indigo-600" />
                <span>Terapkan permanen ke teks input</span>
              </button>
            </div>

            {/* 
              =======================================================
              INPUTS UNTUK GAYA 3 (QUESTION & EXPLANATION)
              =======================================================
            */}
            {isStyle5 ? (
              <div className="space-y-5">
                {/* ==================================================
                    BOX 1: SIDEBAR, FOTO & NAMA TOKOH (GAYA 5)
                   ================================================== */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3.5">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Box 1: Sidebar, Foto & Nama</span>
                    </h3>
                  </div>

                  {/* Tombol tampil / sembunyi */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        updateStyle5((d) => ({
                          ...d,
                          sidebar: { ...d.sidebar, show: !d.sidebar.show },
                        }))
                      }
                      className={`py-2 px-2 rounded-xl text-[11px] font-semibold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        s5Data.sidebar.show
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'bg-white border-slate-300 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5 shrink-0" />
                      <span>Sidebar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        updateStyle5((d) => ({
                          ...d,
                          sidebar: { ...d.sidebar, showPhoto: !d.sidebar.showPhoto },
                        }))
                      }
                      className={`py-2 px-2 rounded-xl text-[11px] font-semibold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        s5Data.sidebar.showPhoto
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'bg-white border-slate-300 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      <Camera className="w-3.5 h-3.5 shrink-0" />
                      <span>Foto</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        updateStyle5((d) => ({
                          ...d,
                          sidebar: { ...d.sidebar, showName: !d.sidebar.showName },
                        }))
                      }
                      className={`py-2 px-2 rounded-xl text-[11px] font-semibold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        s5Data.sidebar.showName
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'bg-white border-slate-300 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      <Type className="w-3.5 h-3.5 shrink-0" />
                      <span>Nama Tokoh</span>
                    </button>
                  </div>

                  {/* Upload & atur foto */}
                  {s5Data.sidebar.show && (
                    <div className="space-y-3 pt-1 border-t border-slate-200">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-16 rounded-xl border border-slate-300 bg-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                          {s5Data.sidebar.photoUrl ? (
                            <img
                              src={s5Data.sidebar.photoUrl}
                              alt="Pratinjau foto"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Camera className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-indigo-700 bg-white border border-indigo-300 rounded-lg hover:bg-indigo-50 transition-colors cursor-pointer">
                            <Upload className="w-3.5 h-3.5" />
                            <span>
                              {s5Data.sidebar.photoUrl ? 'Ganti Foto' : 'Upload Foto'}
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleS5PhotoUpload}
                            />
                          </label>
                          {s5Data.sidebar.photoUrl && (
                            <button
                              type="button"
                              onClick={handleS5RemovePhoto}
                              className="ml-2 inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-semibold text-rose-600 bg-white border border-rose-200 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Hapus Foto</span>
                            </button>
                          )}
                          <p className="text-[10px] text-slate-400">
                            Foto di-crop menyesuaikan bingkai (cover). Seret foto di kanvas
                            untuk menggeser.
                          </p>
                        </div>
                      </div>

                      {s5Data.sidebar.photoUrl && (
                        <div className="space-y-2">
                          <div className="space-y-1">
                            <div className="flex justify-between text-[11px] font-medium text-slate-700">
                              <span>Zoom Foto</span>
                              <span className="font-mono text-slate-500">
                                {s5Data.sidebar.photoZoom.toFixed(2)}x
                              </span>
                            </div>
                            <input
                              type="range"
                              min={1}
                              max={3}
                              step={0.05}
                              value={s5Data.sidebar.photoZoom}
                              onChange={(e) =>
                                updateStyle5((d) => ({
                                  ...d,
                                  sidebar: {
                                    ...d.sidebar,
                                    photoZoom: Number(e.target.value),
                                  },
                                }))
                              }
                              className="w-full accent-indigo-600 cursor-pointer"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <div className="flex justify-between text-[11px] font-medium text-slate-700">
                                <span>Geser X</span>
                                <span className="font-mono text-slate-500">
                                  {s5Data.sidebar.photoPanX}
                                </span>
                              </div>
                              <input
                                type="range"
                                min={-100}
                                max={100}
                                step={1}
                                value={s5Data.sidebar.photoPanX}
                                onChange={(e) =>
                                  updateStyle5((d) => ({
                                    ...d,
                                    sidebar: {
                                      ...d.sidebar,
                                      photoPanX: Number(e.target.value),
                                    },
                                  }))
                                }
                                className="w-full accent-indigo-600 cursor-pointer"
                              />
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between text-[11px] font-medium text-slate-700">
                                <span>Geser Y</span>
                                <span className="font-mono text-slate-500">
                                  {s5Data.sidebar.photoPanY}
                                </span>
                              </div>
                              <input
                                type="range"
                                min={-100}
                                max={100}
                                step={1}
                                value={s5Data.sidebar.photoPanY}
                                onChange={(e) =>
                                  updateStyle5((d) => ({
                                    ...d,
                                    sidebar: {
                                      ...d.sidebar,
                                      photoPanY: Number(e.target.value),
                                    },
                                  }))
                                }
                                className="w-full accent-indigo-600 cursor-pointer"
                              />
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              updateStyle5((d) => ({
                                ...d,
                                sidebar: {
                                  ...d.sidebar,
                                  photoPanX: 0,
                                  photoPanY: 0,
                                  photoZoom: 1,
                                },
                              }))
                            }
                            className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-indigo-700 cursor-pointer"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Reset posisi foto</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Nama tokoh */}
                  {s5Data.sidebar.show && s5Data.sidebar.showName && (
                    <div className="space-y-1 pt-1 border-t border-slate-200">
                      <label className="text-[11px] font-medium text-slate-600 block">
                        Nama Tokoh:
                      </label>
                      <input
                        type="text"
                        value={s5Data.sidebar.name}
                        onChange={(e) =>
                          updateStyle5((d) => ({
                            ...d,
                            sidebar: { ...d.sidebar, name: e.target.value },
                          }))
                        }
                        placeholder="Contoh: Peter Burke"
                        className="w-full px-3 py-2 text-xs font-medium border border-slate-300 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  )}
                </div>

                {/* ==================================================
                    BOX 2: HEADER (NOMOR + JUDUL)
                   ================================================== */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3.5">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                      <ListOrdered className="w-3.5 h-3.5" />
                      <span>Box 2: Header (Nomor & Judul)</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() =>
                        updateStyle5((d) => ({
                          ...d,
                          header: { ...d.header, show: !d.header.show },
                        }))
                      }
                      className={`inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold rounded-lg border transition-all cursor-pointer ${
                        s5Data.header.show
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'bg-white border-slate-300 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      {s5Data.header.show ? (
                        <Eye className="w-3 h-3" />
                      ) : (
                        <EyeOff className="w-3 h-3" />
                      )}
                      <span>{s5Data.header.show ? 'Tampil' : 'Sembunyi'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-[80px_1fr] gap-2">
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-slate-600 block">
                        Nomor:
                      </label>
                      <input
                        type="text"
                        value={s5Data.header.number}
                        onChange={(e) =>
                          updateStyle5((d) => ({
                            ...d,
                            header: { ...d.header, number: e.target.value },
                          }))
                        }
                        placeholder="03"
                        className="w-full px-3 py-2 text-xs font-semibold text-center border border-slate-300 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-slate-600 block">
                        Judul Header:
                      </label>
                      <input
                        type="text"
                        value={s5Data.header.title}
                        onChange={(e) =>
                          updateStyle5((d) => ({
                            ...d,
                            header: { ...d.header, title: e.target.value },
                          }))
                        }
                        placeholder="Contoh: Hubungan antara Ilmu Sejarah dan Ilmu Sosial"
                        className="w-full px-3 py-2 text-xs font-medium border border-slate-300 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-[11px] font-medium text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={s5Data.header.showNumberBox}
                      onChange={(e) =>
                        updateStyle5((d) => ({
                          ...d,
                          header: { ...d.header, showNumberBox: e.target.checked },
                        }))
                      }
                      className="w-3.5 h-3.5 accent-indigo-600 cursor-pointer"
                    />
                    <span>Tampilkan kotak nomor yang menumpuk di header</span>
                  </label>
                </div>

                {/* ==================================================
                    BOX 3: POIN (MAKS 8)
                   ================================================== */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3.5">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5" />
                      <span>Box 3: Daftar Poin</span>
                    </h3>
                    <span className="text-[10px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                      {s5Data.points.length} / 8
                    </span>
                  </div>

                  <div className="space-y-3">
                    {s5Data.points.map((pt, idx) => (
                      <div
                        key={pt.id}
                        onClick={() => onSelectStyle5Element?.(`point-${pt.id}`)}
                        className={`p-3 bg-white border rounded-xl space-y-2.5 cursor-pointer transition-all ${
                          selectedStyle5ElementId === `point-${pt.id}`
                            ? 'border-indigo-400 ring-2 ring-indigo-100'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-700">
                            Poin {idx + 1}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              title="Naikkan urutan"
                              disabled={idx === 0}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleS5MovePoint(idx, 'up');
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              title="Turunkan urutan"
                              disabled={idx === s5Data.points.length - 1}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleS5MovePoint(idx, 'down');
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              title="Duplikat poin"
                              disabled={s5Data.points.length >= 8}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleS5DuplicatePoint(pt.id);
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              title="Hapus poin"
                              disabled={s5Data.points.length <= 1}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleS5DeletePoint(pt.id);
                              }}
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[10px] font-medium text-slate-500 block">
                              Nomor (manual):
                            </label>
                            <input
                              type="text"
                              value={pt.number ?? ''}
                              onChange={(e) =>
                                handleS5UpdatePoint(pt.id, { number: e.target.value })
                              }
                              placeholder="otomatis"
                              onClick={(e) => e.stopPropagation()}
                              className="w-full px-2.5 py-1.5 text-xs font-semibold text-center border border-slate-300 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-medium text-slate-500 block">
                              Tampilan Poin:
                            </label>
                            <select
                              value={pt.mode}
                              onChange={(e) =>
                                handleS5UpdatePoint(pt.id, {
                                  mode: e.target.value as Style5PointMode,
                                })
                              }
                              onClick={(e) => e.stopPropagation()}
                              className="w-full px-2.5 py-1.5 text-xs font-medium border border-slate-300 rounded-lg bg-white text-slate-800 cursor-pointer"
                            >
                              <option value="both">Pill + Deskripsi</option>
                              <option value="pill-only">Hanya Pill</option>
                              <option value="desc-only">Hanya Deskripsi</option>
                            </select>
                          </div>
                        </div>

                        {pt.mode !== 'desc-only' && (
                          <div className="space-y-1">
                            <label className="text-[10px] font-medium text-slate-500 block">
                              Teks Pill:
                            </label>
                            <input
                              type="text"
                              value={pt.pillText}
                              onChange={(e) =>
                                handleS5UpdatePoint(pt.id, { pillText: e.target.value })
                              }
                              placeholder="Contoh: Periode pertama : Sebelum abad ke-19"
                              onClick={(e) => e.stopPropagation()}
                              className="w-full px-2.5 py-1.5 text-xs font-medium border border-slate-300 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                        )}

                        {pt.mode !== 'pill-only' && (
                          <div className="space-y-1">
                            <label className="text-[10px] font-medium text-slate-500 block">
                              Teks Deskripsi:
                            </label>
                            <textarea
                              value={pt.descriptionText}
                              onChange={(e) =>
                                handleS5UpdatePoint(pt.id, {
                                  descriptionText: e.target.value,
                                })
                              }
                              rows={2}
                              placeholder="Tulis penjelasan poin..."
                              onClick={(e) => e.stopPropagation()}
                              className="w-full px-2.5 py-1.5 text-xs font-medium border border-slate-300 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 resize-y leading-relaxed"
                            />
                          </div>
                        )}

                        <label className="flex items-center gap-2 text-[10px] font-medium text-slate-500 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!pt.hideNumberBox}
                            onChange={(e) =>
                              handleS5UpdatePoint(pt.id, {
                                hideNumberBox: e.target.checked,
                              })
                            }
                            onClick={(e) => e.stopPropagation()}
                            className="w-3.5 h-3.5 accent-indigo-600 cursor-pointer"
                          />
                          <span>Sembunyikan kotak nomor poin ini</span>
                        </label>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleS5AddPoint}
                    disabled={s5Data.points.length >= 8}
                    className="w-full py-2.5 px-3 text-xs font-semibold text-indigo-700 bg-white border border-dashed border-indigo-300 rounded-xl hover:bg-indigo-50 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" />
                    <span>
                      {s5Data.points.length >= 8
                        ? 'Maksimal 8 poin'
                        : 'Tambah Poin Baru'}
                    </span>
                  </button>
                </div>

                {/* ==================================================
                    BOX 4: PENOMORAN
                   ================================================== */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                      <ListOrdered className="w-3.5 h-3.5" />
                      <span>Box 4: Penomoran</span>
                    </h3>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-600 block">
                      Jenis Penomoran:
                    </label>
                    <select
                      value={s5Data.numberingType}
                      onChange={(e) =>
                        updateStyle5((d) => ({
                          ...d,
                          numberingType: e.target.value as Style5NumberingType,
                        }))
                      }
                      className="w-full px-2.5 py-1.5 text-xs font-medium border border-slate-300 rounded-lg bg-white text-slate-800 cursor-pointer"
                    >
                      <option value="01">01. Dua digit (01 02 03)</option>
                      <option value="1">1. Angka (1 2 3)</option>
                      <option value="1.">1. Angka + titik (1. 2. 3.)</option>
                      <option value="letters-upper">A. Huruf kapital (A B C)</option>
                      <option value="letters-lower">a. Huruf kecil (a b c)</option>
                      <option value="roman">I. Romawi (I II III)</option>
                      <option value="none">Tanpa nomor</option>
                    </select>
                  </div>

                  {s5Data.numberingType !== 'none' && (
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-slate-600 block">
                        Mulai dari:
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={s5Data.startFrom}
                        onChange={(e) =>
                          updateStyle5((d) => ({ ...d, startFrom: e.target.value }))
                        }
                        className="w-full px-2.5 py-1.5 text-xs font-medium border border-slate-300 rounded-lg bg-white text-slate-800"
                      />
                      <p className="text-[10px] text-slate-400">
                        Kosongkan nomor pada poin jika ingin memakai nomor otomatis.
                      </p>
                    </div>
                  )}
                </div>

                {/* ==================================================
                    BOX 5: ELEMEN BEBAS (TEKS & GAMBAR)
                   ================================================== */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                      <Move className="w-3.5 h-3.5" />
                      <span>Box 5: Elemen Bebas</span>
                    </h3>
                    <span className="text-[10px] font-normal text-slate-400">
                      Seret di kanvas untuk memindah
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleS5AddTextElement}
                      className="py-2 px-3 text-xs font-semibold text-indigo-700 bg-white border border-indigo-300 rounded-xl hover:bg-indigo-50 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Type className="w-3.5 h-3.5" />
                      <span>Tambah Teks</span>
                    </button>
                    <label className="py-2 px-3 text-xs font-semibold text-purple-700 bg-white border border-purple-300 rounded-xl hover:bg-purple-50 transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Tambah Gambar</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleS5AddImageElement}
                      />
                    </label>
                  </div>

                  {s5Data.freeElements.length === 0 && (
                    <p className="text-[11px] text-slate-400 text-center py-2">
                      Belum ada elemen bebas. Tambahkan teks atau gambar bebas di atas.
                    </p>
                  )}

                  <div className="space-y-3">
                    {s5Data.freeElements.map((el) => (
                      <div
                        key={el.id}
                        onClick={() => onSelectStyle5Element?.(`free-${el.id}`)}
                        className={`p-3 bg-white border rounded-xl space-y-2 cursor-pointer transition-all ${
                          selectedStyle5ElementId === `free-${el.id}`
                            ? 'border-indigo-400 ring-2 ring-indigo-100'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                            {el.type === 'text' ? (
                              <Type className="w-3.5 h-3.5 text-indigo-600" />
                            ) : (
                              <ImageIcon className="w-3.5 h-3.5 text-purple-600" />
                            )}
                            <span>
                              {el.type === 'text' ? 'Teks Bebas' : 'Gambar Bebas'}
                            </span>
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              title="Naikkan lapisan"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleS5MoveFreeElement(el.id, 'up');
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              title="Turunkan lapisan"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleS5MoveFreeElement(el.id, 'down');
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              title="Duplikat elemen"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleS5DuplicateFreeElement(el.id);
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              title="Hapus elemen"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleS5DeleteFreeElement(el.id);
                              }}
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {el.type === 'text' && (
                          <>
                            <textarea
                              value={el.content}
                              onChange={(e) =>
                                handleS5UpdateFreeElement(el.id, {
                                  content: e.target.value,
                                })
                              }
                              rows={2}
                              placeholder="Isi teks bebas..."
                              onClick={(e) => e.stopPropagation()}
                              className="w-full px-2.5 py-1.5 text-xs font-medium border border-slate-300 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 resize-y leading-relaxed"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <label className="text-[10px] font-medium text-slate-500 block">
                                  Ukuran Font:
                                </label>
                                <input
                                  type="number"
                                  min={8}
                                  max={120}
                                  value={el.fontSize ?? 20}
                                  onChange={(e) =>
                                    handleS5UpdateFreeElement(el.id, {
                                      fontSize: Number(e.target.value),
                                    })
                                  }
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-full px-2.5 py-1.5 text-xs font-medium border border-slate-300 rounded-lg bg-white text-slate-800"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-medium text-slate-500 block">
                                  Tebal Font:
                                </label>
                                <select
                                  value={el.fontWeight || 'medium'}
                                  onChange={(e) =>
                                    handleS5UpdateFreeElement(el.id, {
                                      fontWeight: e.target
                                        .value as FontWeightOption,
                                    })
                                  }
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-full px-2.5 py-1.5 text-xs font-medium border border-slate-300 rounded-lg bg-white text-slate-800 cursor-pointer"
                                >
                                  <option value="regular">Regular</option>
                                  <option value="medium">Medium</option>
                                  <option value="bold">Bold</option>
                                </select>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <ColorField
                                label="Teks"
                                value={el.color || '#2E2E2E'}
                                onChange={(val) =>
                                  handleS5UpdateFreeElement(el.id, { color: val })
                                }
                              />
                              <ColorField
                                label="Latar"
                                value={el.bgColor || '#FFFFFF'}
                                onChange={(val) =>
                                  handleS5UpdateFreeElement(el.id, { bgColor: val })
                                }
                              />
                            </div>
                          </>
                        )}

                        {el.type === 'image' && (
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="text-[10px] font-medium text-slate-500 block">
                                Lebar (px):
                              </label>
                              <input
                                type="number"
                                min={40}
                                max={2000}
                                value={el.width}
                                onChange={(e) =>
                                  handleS5UpdateFreeElement(el.id, {
                                    width: Number(e.target.value),
                                  })
                                }
                                onClick={(e) => e.stopPropagation()}
                                className="w-full px-2.5 py-1.5 text-xs font-medium border border-slate-300 rounded-lg bg-white text-slate-800"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-medium text-slate-500 block">
                                Tinggi (px):
                              </label>
                              <input
                                type="number"
                                min={40}
                                max={2000}
                                value={el.height}
                                onChange={(e) =>
                                  handleS5UpdateFreeElement(el.id, {
                                    height: Number(e.target.value),
                                  })
                                }
                                onClick={(e) => e.stopPropagation()}
                                className="w-full px-2.5 py-1.5 text-xs font-medium border border-slate-300 rounded-lg bg-white text-slate-800"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : isStyle3 ? (
              <div className="space-y-5">
                {/* BOX 1: SOAL */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3.5">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                      <span>Box 1: Soal (Question)</span>
                    </h3>
                  </div>

                  {/* 1. Label Pill Soal */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-600 block">
                      Label Pill Soal:
                    </label>
                    <input
                      type="text"
                      value={style3Data.questionPillLabel}
                      onChange={(e) =>
                        onStyle3DataChange({
                          ...style3Data,
                          questionPillLabel: e.target.value,
                        })
                      }
                      placeholder="Question No. 2"
                      className="w-full px-3 py-1.5 text-xs font-semibold border border-slate-300 rounded-lg bg-white"
                    />
                  </div>

                  {/* 2. Teks Soal */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <label className="font-medium text-slate-600">
                        Teks Soal:
                      </label>
                      <span className="text-indigo-600 font-medium">
                        Tulis "___" untuk garis kosong
                      </span>
                    </div>
                    <textarea
                      rows={3}
                      value={style3Data.questionText}
                      onChange={(e) =>
                        onStyle3DataChange({
                          ...style3Data,
                          questionText: e.target.value,
                        })
                      }
                      placeholder="She speaks as if she ___ the queen."
                      className="w-full px-3 py-2 text-xs font-medium border border-slate-300 rounded-lg bg-white leading-relaxed"
                    />
                  </div>

                  {/* 3. Pilihan Jawaban Dinamis */}
                  <div className="space-y-2.5 pt-2 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-700">
                        Daftar Pilihan Jawaban ({style3Data.choices.length} pilihan)
                      </label>
                      <button
                        type="button"
                        onClick={handleAddChoice}
                        disabled={style3Data.choices.length >= 6}
                        className="px-2 py-1 text-[11px] font-semibold text-indigo-700 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50 disabled:opacity-40 cursor-pointer flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Tambah Pilihan</span>
                      </button>
                    </div>

                    {/* Penomoran & Format Pilihan */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 block mb-0.5">
                          Jenis Penomoran:
                        </span>
                        <select
                          value={style3Data.choiceNumberingType}
                          onChange={(e) =>
                            onStyle3DataChange({
                              ...style3Data,
                              choiceNumberingType: e.target
                                .value as ChoiceNumberingType,
                            })
                          }
                          className="w-full p-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                        >
                          <option value="letters-upper">A. B. C. D.</option>
                          <option value="letters-lower">a. b. c. d.</option>
                          <option value="numbers">1. 2. 3. 4.</option>
                          <option value="roman">I. II. III. IV.</option>
                          <option value="none">Tanpa awalan</option>
                        </select>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-500 block mb-0.5">
                          Format Pemisah:
                        </span>
                        <select
                          value={style3Data.choiceSeparator}
                          onChange={(e) =>
                            onStyle3DataChange({
                              ...style3Data,
                              choiceSeparator: e.target.value as ChoiceSeparator,
                            })
                          }
                          className="w-full p-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                        >
                          <option value=".">Titik "A."</option>
                          <option value=")">Kurung "A)"</option>
                          <option value="none">Tanpa tanda "A"</option>
                        </select>
                      </div>
                    </div>

                    {/* Toggle Highlight Jawaban Benar */}
                    <div className="flex items-center justify-between p-2 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-xs">
                      <div>
                        <span className="font-semibold text-emerald-950 block">
                          Tandai Jawaban Benar
                        </span>
                        <span className="text-[10px] text-emerald-700">
                          Pilih jawaban benar lewat radio button
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={style3Data.showCorrectAnswer}
                        onChange={(e) =>
                          onStyle3DataChange({
                            ...style3Data,
                            showCorrectAnswer: e.target.checked,
                          })
                        }
                        className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                      />
                    </div>

                    {/* Choices Inputs */}
                    <div className="space-y-2">
                      {style3Data.choices.map((choice, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          {style3Data.showCorrectAnswer && (
                            <input
                              type="radio"
                              name="correctAnswerRadio"
                              checked={style3Data.correctAnswerIndex === idx}
                              onChange={() =>
                                onStyle3DataChange({
                                  ...style3Data,
                                  correctAnswerIndex: idx,
                                })
                              }
                              title={`Tandai pilihan ${String.fromCharCode(65 + idx)} sebagai jawaban benar`}
                              className="w-4 h-4 text-emerald-600 cursor-pointer shrink-0"
                            />
                          )}
                          <span className="w-5 text-center text-xs font-bold text-slate-500 shrink-0">
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <input
                            type="text"
                            value={choice}
                            onChange={(e) => handleUpdateChoice(idx, e.target.value)}
                            className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveChoice(idx)}
                            disabled={style3Data.choices.length <= 2}
                            title="Hapus pilihan"
                            className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 4. Kotak Gambar */}
                  <div className="pt-2 border-t border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-700 block">
                          Kotak Gambar (Ilustrasi Soal)
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Placeholder gambar di sebelah kanan box soal
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={style3Data.showImageBox}
                        onChange={(e) =>
                          onStyle3DataChange({
                            ...style3Data,
                            showImageBox: e.target.checked,
                          })
                        }
                        className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                      />
                    </div>

                    {style3Data.showImageBox && (
                      <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-medium text-slate-600">
                            Upload File Gambar:
                          </span>
                          {style3Data.imageUrl && (
                            <button
                              type="button"
                              onClick={handleRemoveImage}
                              className="text-[10px] text-rose-600 hover:text-rose-800 cursor-pointer"
                            >
                              Hapus Gambar
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <label className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 border border-dashed border-indigo-300 rounded-lg bg-indigo-50/50 hover:bg-indigo-50 text-indigo-700 font-medium cursor-pointer text-xs transition-colors">
                            <Upload className="w-3.5 h-3.5" />
                            <span>
                              {style3Data.imageUrl ? 'Ganti Gambar' : 'Pilih Gambar (PNG/JPG)'}
                            </span>
                            <input
                              type="file"
                              accept="image/png, image/jpeg, image/webp"
                              onChange={handleImageUpload}
                              className="hidden"
                            />
                          </label>

                          <select
                            value={style3Data.imageFit}
                            onChange={(e) =>
                              onStyle3DataChange({
                                ...style3Data,
                                imageFit: e.target.value as ImageFitOption,
                              })
                            }
                            className="p-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-700"
                            title="Posisi dan rasio gambar"
                          >
                            <option value="contain">Fit (Contain)</option>
                            <option value="cover">Penuh (Cover)</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* BOX 2: EXPLANATION */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                        Box 2: Penjelasan (Explanation)
                      </h3>
                      <span className="text-[10px] text-slate-500">
                        Opsional - dapat disembunyikan
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={style3Data.showExplanation}
                      onChange={(e) =>
                        onStyle3DataChange({
                          ...style3Data,
                          showExplanation: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                    />
                  </div>

                  {style3Data.showExplanation && (
                    <>
                      {/* Label Pill Explanation */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-slate-600 block">
                          Label Pill Penjelasan:
                        </label>
                        <input
                          type="text"
                          value={style3Data.explanationPillLabel}
                          onChange={(e) =>
                            onStyle3DataChange({
                              ...style3Data,
                              explanationPillLabel: e.target.value,
                            })
                          }
                          placeholder="Explanation :"
                          className="w-full px-3 py-1.5 text-xs font-semibold border border-slate-300 rounded-lg bg-white"
                        />
                      </div>

                      {/* Teks Penjelasan */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-slate-600 block">
                          Teks Penjelasan / Pembahasan:
                        </label>
                        <textarea
                          rows={4}
                          value={style3Data.explanationText}
                          onChange={(e) =>
                            onStyle3DataChange({
                              ...style3Data,
                              explanationText: e.target.value,
                            })
                          }
                          placeholder="Tuliskan pembahasan lengkap soal..."
                          className="w-full px-3 py-2 text-xs font-medium border border-slate-300 rounded-lg bg-white leading-relaxed"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              /* 
                =======================================================
                INPUTS UNTUK GAYA 1 & GAYA 2
                =======================================================
              */
              <>
                {/* Kotak Judul Utama Input */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                    {isStyle4 ? 'Judul Lingkaran Tengah' : 'Judul Utama'}
                  </label>
                  <input
                    type="text"
                    value={mainTitle}
                    onPaste={(e) => handleInputPaste(e, onMainTitleChange)}
                    onChange={(e) => onMainTitleChange(e.target.value)}
                    placeholder={
                      isStyle4
                        ? 'Contoh: Jenis instrumen pasar modal'
                        : isStyle2
                        ? 'Contoh: Jenis-jenis reksa dana'
                        : 'Contoh: Keuntungan saham'
                    }
                    className="w-full px-3.5 py-2.5 text-sm font-medium border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900 placeholder-slate-400"
                  />
                </div>

                {/* PENGINPUTAN PRAKTIS SEMUA PILL & LINGKARAN PUTIH DALAM SATU KOTAK */}
                <div className={`p-4 rounded-2xl border transition-all ${
                  isStyle4
                    ? 'bg-gradient-to-br from-purple-50/80 via-white to-purple-50/40 border-purple-200 shadow-xs'
                    : 'bg-gradient-to-br from-indigo-50/80 via-white to-indigo-50/40 border-indigo-200 shadow-xs'
                } space-y-3`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                        isStyle4 ? 'bg-purple-600 text-white' : 'bg-indigo-600 text-white'
                      }`}>
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h3 className={`text-xs font-bold uppercase tracking-wider ${
                          isStyle4 ? 'text-purple-950' : 'text-indigo-950'
                        }`}>
                          Input Praktis Semua Box Sekaligus
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Ketik teks pill & nomor lingkaran dalam 1 kotak (hingga {isStyle4 ? 16 : 8} box)
                        </p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isStyle4 ? 'bg-purple-100 text-purple-700' : 'bg-indigo-100 text-indigo-700'
                    }`}>
                      {subBoxes.length} Box Aktif
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <textarea
                      rows={3}
                      value={singleBoxText}
                      onChange={(e) => handleSingleBoxChange(e.target.value)}
                      onFocus={() => setIsSingleBoxFocused(true)}
                      onBlur={() => setIsSingleBoxFocused(false)}
                      placeholder="Contoh: 1. Saham | 2. Obligasi | 3. Reksadana | 4. Saham | 5. Warrant | 6. Right | 7. Opsi/Option | 8. Warrant"
                      className={`w-full px-3 py-2 text-xs font-mono font-medium border rounded-xl bg-white shadow-2xs leading-relaxed focus:ring-2 transition-all ${
                        isStyle4
                          ? 'border-purple-300 focus:border-purple-600 focus:ring-purple-500/20 text-purple-950 placeholder-purple-300'
                          : 'border-indigo-300 focus:border-indigo-600 focus:ring-indigo-500/20 text-indigo-950 placeholder-indigo-300'
                      }`}
                    />
                    <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 px-1 gap-1">
                      <span>
                        Pemisah: tanda pipa (<code className="font-bold text-slate-700">|</code>) atau Enter
                      </span>
                      <span>Format: <code className="font-bold text-slate-700">[Nomor]. [Teks]</code></span>
                    </div>
                  </div>

                  {/* Tombol Praktis / Presets Cepat */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => handleLoadSample(SAMPLE_8_INSTRUMEN)}
                      className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer shadow-2xs"
                    >
                      Contoh 8 Instrumen
                    </button>
                    {isStyle4 && (
                      <button
                        type="button"
                        onClick={() => handleLoadSample(SAMPLE_16_INSTRUMEN)}
                        className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer shadow-2xs"
                      >
                        Contoh 16 Item Lengkap
                      </button>
                    )}
                    {isStyle4 && (
                      <button
                        type="button"
                        onClick={handleBalanceSides}
                        className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-purple-50 border border-purple-200 text-purple-700 hover:bg-purple-100 transition-all cursor-pointer"
                        title="Bagi rata sub box ke sisi kiri dan kanan secara seimbang"
                      >
                        Bagi Rata (Kiri & Kanan)
                      </button>
                    )}
                  </div>
                </div>

                {/* Sub Boxes List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Daftar Sub Box
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Tersedia {subBoxes.length} dari maks {isStyle4 ? 16 : 8} (min 2)
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isStyle4 && (
                        <button
                          type="button"
                          onClick={handleBalanceSides}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-all cursor-pointer"
                          title="Bagi rata sub box ke sisi kiri dan kanan secara seimbang"
                        >
                          Bagi Rata Sisi
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={handleAddSubBox}
                        disabled={subBoxes.length >= (isStyle4 ? 16 : 8)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                          subBoxes.length >= (isStyle4 ? 16 : 8)
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-2xs cursor-pointer'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Tambah Sub Box
                      </button>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="space-y-3.5">
                    {subBoxes.map((sub, idx) => (
                      <div
                        key={sub.id}
                        className="p-3.5 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-3 hover:border-slate-300 transition-colors"
                      >
                        {/* Item Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span className="text-xs font-semibold text-slate-700">
                              {isStyle4
                                ? `Sub Box Radial #${idx + 1} (${
                                    (sub.side === 'left' || (!sub.side && idx < Math.ceil(subBoxes.length / 2)))
                                      ? 'Kiri'
                                      : 'Kanan'
                                  })`
                                : isStyle2
                                ? `Pill Bernomor #${idx + 1}`
                                : `Sub Box #${idx + 1}`}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleMove(idx, 'up')}
                              disabled={idx === 0}
                              title="Geser ke atas"
                              className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMove(idx, 'down')}
                              disabled={idx === subBoxes.length - 1}
                              title="Geser ke bawah"
                              className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveSubBox(sub.id)}
                              disabled={subBoxes.length <= 2}
                              title={
                                subBoxes.length <= 2
                                  ? 'Minimal 2 sub box'
                                  : 'Hapus sub box'
                              }
                              className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md disabled:opacity-30 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {isStyle4 ? (
                          <>
                            {/* Posisi Sisi (Kiri / Kanan) */}
                            <div>
                              <label className="text-[11px] font-medium text-slate-500 block mb-1">
                                Posisi Sisi
                              </label>
                              <div className="grid grid-cols-2 gap-1.5 text-xs">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateSubBox(sub.id, 'side', 'left')}
                                  className={`py-1.5 px-2 rounded-lg font-medium border text-center transition-all cursor-pointer ${
                                    (sub.side === 'left' || (!sub.side && idx < Math.ceil(subBoxes.length / 2)))
                                      ? 'bg-purple-600 text-white border-purple-600 shadow-2xs font-semibold'
                                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                                  }`}
                                >
                                  Sisi Kiri (⟵)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateSubBox(sub.id, 'side', 'right')}
                                  className={`py-1.5 px-2 rounded-lg font-medium border text-center transition-all cursor-pointer ${
                                    (sub.side === 'right' || (!sub.side && idx >= Math.ceil(subBoxes.length / 2)))
                                      ? 'bg-purple-600 text-white border-purple-600 shadow-2xs font-semibold'
                                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                                  }`}
                                >
                                  Sisi Kanan (⟶)
                                </button>
                              </div>
                            </div>

                            {/* Teks Pill Utama */}
                            <div>
                              <label className="text-[11px] font-medium text-slate-500 block mb-1">
                                Teks Pill Sub Box
                              </label>
                              <textarea
                                rows={2}
                                value={sub.content !== undefined && sub.content !== null ? sub.content : (sub.title || '')}
                                onPaste={(e) =>
                                  handleInputPaste(e, (val) => {
                                    handleUpdateSubBox(sub.id, {
                                      content: val,
                                      title: val,
                                    });
                                  })
                                }
                                onChange={(e) => {
                                  const val = e.target.value;
                                  handleUpdateSubBox(sub.id, {
                                    content: val,
                                    title: val,
                                  });
                                }}
                                placeholder="Contoh: Saham / Obligasi / Sukuk"
                                className="w-full px-3 py-2 text-xs font-medium border border-slate-300 rounded-lg bg-white"
                              />
                            </div>

                            {/* Override Nomor Manual */}
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="text-[11px] font-medium text-slate-500">
                                  Isi Lingkaran Putih (Opsional)
                                </label>
                                {sub.customNumber && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleUpdateSubBox(sub.id, 'customNumber', '')
                                    }
                                    className="text-[10px] text-indigo-600 hover:text-indigo-800 cursor-pointer"
                                  >
                                    Pakai Default
                                  </button>
                                )}
                              </div>
                              <input
                                type="text"
                                value={sub.customNumber || ''}
                                onChange={(e) =>
                                  handleUpdateSubBox(
                                    sub.id,
                                    'customNumber',
                                    e.target.value
                                  )
                                }
                                placeholder="Kosongkan jika polos, atau isi nomor: 1, A, ★"
                                className="w-full px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-lg bg-white"
                              />
                            </div>
                          </>
                        ) : isStyle2 ? (
                          <>
                            {/* Teks Pill Utama */}
                            <div>
                              <label className="text-[11px] font-medium text-slate-500 block mb-1">
                                Teks Pill Sub Box
                              </label>
                              <textarea
                                rows={2}
                                value={sub.content !== undefined && sub.content !== null ? sub.content : (sub.title || '')}
                                onPaste={(e) =>
                                  handleInputPaste(e, (val) => {
                                    handleUpdateSubBox(sub.id, {
                                      content: val,
                                      title: val,
                                    });
                                  })
                                }
                                onChange={(e) => {
                                  const val = e.target.value;
                                  handleUpdateSubBox(sub.id, {
                                    content: val,
                                    title: val,
                                  });
                                }}
                                placeholder="Contoh: Reksa dana pasar uang (Money market funds)"
                                className="w-full px-3 py-2 text-xs font-medium border border-slate-300 rounded-lg bg-white"
                              />
                            </div>

                            {/* Override Nomor Manual */}
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="text-[11px] font-medium text-slate-500">
                                  Nomor Manual (Override Opsional)
                                </label>
                                {sub.customNumber && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleUpdateSubBox(sub.id, 'customNumber', '')
                                    }
                                    className="text-[10px] text-indigo-600 hover:text-indigo-800 cursor-pointer"
                                  >
                                    Pakai Urutan Otomatis
                                  </button>
                                )}
                              </div>
                              <input
                                type="text"
                                value={sub.customNumber || ''}
                                onChange={(e) =>
                                  handleUpdateSubBox(
                                    sub.id,
                                    'customNumber',
                                    e.target.value
                                  )
                                }
                                placeholder="Kosongkan untuk otomatis, atau isi ★, ✓, 01"
                                className="w-full px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-lg bg-white"
                              />
                            </div>
                          </>
                        ) : (
                          <>
                            {/* Judul Pill */}
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="text-[11px] font-medium text-slate-500">
                                  Judul Label Pill
                                </label>
                                {sub.hidePill ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleUpdateSubBox(sub.id, 'hidePill', false)
                                    }
                                    className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
                                  >
                                    <Plus className="w-3 h-3" />
                                    + Tampilkan Kembali
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleUpdateSubBox(sub.id, 'hidePill', true)
                                    }
                                    className="text-[10px] text-rose-500 hover:text-rose-700 cursor-pointer"
                                    title="Hapus box label pill (box teks deskripsi tetap ada)"
                                  >
                                    Hapus Pill
                                  </button>
                                )}
                              </div>
                              {sub.hidePill ? (
                                <div className="flex items-center justify-between px-3 py-1.5 text-xs rounded-lg bg-slate-100 border border-dashed border-slate-300 text-slate-500">
                                  <span className="italic text-[11px]">
                                    Box label pill dihapus (deskripsi tetap tampil)
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleUpdateSubBox(sub.id, 'hidePill', false)
                                    }
                                    className="text-indigo-600 font-medium hover:underline text-[11px] cursor-pointer"
                                  >
                                    Pasang Pill
                                  </button>
                                </div>
                              ) : (
                                <input
                                  type="text"
                                  value={sub.title}
                                  onPaste={(e) =>
                                    handleInputPaste(e, (val) =>
                                      handleUpdateSubBox(sub.id, 'title', val)
                                    )
                                  }
                                  onChange={(e) =>
                                    handleUpdateSubBox(sub.id, 'title', e.target.value)
                                  }
                                  placeholder="Contoh: Risiko likuidasi"
                                  className="w-full px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-lg bg-white"
                                />
                              )}
                            </div>

                            {/* Isi Teks Deskripsi */}
                            <div>
                              <label className="text-[11px] font-medium text-slate-500 block mb-1">
                                Isi Teks Deskripsi
                              </label>
                              <textarea
                                rows={3}
                                value={sub.content}
                                onPaste={(e) =>
                                  handleInputPaste(e, (val) =>
                                    handleUpdateSubBox(sub.id, 'content', val)
                                  )
                                }
                                onChange={(e) =>
                                  handleUpdateSubBox(sub.id, 'content', e.target.value)
                                }
                                placeholder="Tulis rincian penjelasan sub box..."
                                className="w-full px-3 py-2 text-xs font-medium border border-slate-300 rounded-lg bg-white leading-relaxed"
                              />
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ===================== TAB 2: WARNA ===================== */}
        {activeTab === 'colors' && (
          <div className="space-y-6">
            {isStyle5 ? (
              /* Preset & Pickers untuk Gaya 5 */
              <>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Warna Khusus Gaya 5 (Slide Materi)
                    </h3>
                    <div className="flex items-center gap-2">
                      {onResetStyle5Colors && (
                        <button
                          type="button"
                          onClick={onResetStyle5Colors}
                          title="Kembalikan warna Gaya 5 mengikuti tema universal aktif"
                          className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-indigo-700 cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reset ke Warna Tema</span>
                        </button>
                      )}
                      {onOpenThemes && (
                        <button
                          type="button"
                          onClick={onOpenThemes}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                        >
                          <Palette className="w-3 h-3" />
                          <span>Tema Universal</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Warna di bawah mengikuti tema universal aktif. Perubahan di sini hanya
                    berlaku untuk Gaya 5.
                  </p>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl divide-y divide-slate-100">
                    <ColorField
                      label="Sidebar & Header"
                      value={s5Colors.mainColor}
                      onChange={(val) =>
                        onStyle5ColorsChange?.({ ...s5Colors, mainColor: val })
                      }
                    />
                    <ColorField
                      label="Tepi Bingkai Foto"
                      value={s5Colors.mainColorDark}
                      onChange={(val) =>
                        onStyle5ColorsChange?.({ ...s5Colors, mainColorDark: val })
                      }
                    />
                    <ColorField
                      label="Latar Pill & Nama Tokoh"
                      value={s5Colors.accentPillBg}
                      onChange={(val) =>
                        onStyle5ColorsChange?.({ ...s5Colors, accentPillBg: val })
                      }
                    />
                    <ColorField
                      label="Teks Pill"
                      value={s5Colors.accentPillText}
                      onChange={(val) =>
                        onStyle5ColorsChange?.({ ...s5Colors, accentPillText: val })
                      }
                    />
                    <ColorField
                      label="Latar Box Deskripsi"
                      value={s5Colors.descriptionBoxBg}
                      onChange={(val) =>
                        onStyle5ColorsChange?.({
                          ...s5Colors,
                          descriptionBoxBg: val,
                        })
                      }
                    />
                    <ColorField
                      label="Teks Deskripsi"
                      value={s5Colors.descriptionBoxText}
                      onChange={(val) =>
                        onStyle5ColorsChange?.({
                          ...s5Colors,
                          descriptionBoxText: val,
                        })
                      }
                    />
                    <ColorField
                      label="Garis Tepi"
                      value={s5Colors.borderColor}
                      onChange={(val) =>
                        onStyle5ColorsChange?.({ ...s5Colors, borderColor: val })
                      }
                    />
                    <ColorField
                      label="Latar Kotak Nomor"
                      value={s5Colors.numberBoxBg}
                      onChange={(val) =>
                        onStyle5ColorsChange?.({ ...s5Colors, numberBoxBg: val })
                      }
                    />
                    <ColorField
                      label="Angka Header"
                      value={s5Colors.headerNumberText}
                      onChange={(val) =>
                        onStyle5ColorsChange?.({ ...s5Colors, headerNumberText: val })
                      }
                    />
                    <ColorField
                      label="Angka Poin"
                      value={s5Colors.pointNumberText}
                      onChange={(val) =>
                        onStyle5ColorsChange?.({ ...s5Colors, pointNumberText: val })
                      }
                    />
                    <ColorField
                      label="Latar Kanvas"
                      value={s5Colors.canvasBg}
                      onChange={(val) =>
                        onStyle5ColorsChange?.({ ...s5Colors, canvasBg: val })
                      }
                    />
                  </div>
                </div>
              </>
            ) : isStyle3 ? (
              /* Preset & Pickers untuk Gaya 3 */
              <>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Preset Tema Gaya 3 (Soal & Penjelasan)
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={onRestoreDefaultStyle3Themes}
                        title="Pulihkan tema bawaan Gaya 3"
                        className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span className="hidden sm:inline">Pulihkan Bawaan</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsSavingStyle3Theme(true)}
                        className="inline-flex items-center gap-1 text-xs text-indigo-600 font-semibold hover:text-indigo-800 cursor-pointer"
                      >
                        <BookmarkPlus className="w-3.5 h-3.5" />
                        <span>Simpan Tema</span>
                      </button>
                    </div>
                  </div>

                  {/* Form Simpan Tema Baru Gaya 3 */}
                  {isSavingStyle3Theme && (
                    <form
                      onSubmit={handleSaveStyle3ThemeSubmit}
                      className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2 text-xs"
                    >
                      <div className="font-semibold text-indigo-900">
                        Simpan Palet Saat Ini sebagai Tema Baru (Gaya 3)
                      </div>
                      <input
                        type="text"
                        value={newStyle3ThemeName}
                        onChange={(e) => setNewStyle3ThemeName(e.target.value)}
                        placeholder="Contoh: Soal Ujian Sains"
                        className="w-full px-3 py-1.5 text-xs border border-indigo-300 rounded-lg bg-white"
                        autoFocus
                      />
                      {style3ThemeSaveError && (
                        <p className="text-rose-600 text-[11px]">
                          {style3ThemeSaveError}
                        </p>
                      )}
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setIsSavingStyle3Theme(false);
                            setStyle3ThemeSaveError('');
                          }}
                          className="px-3 py-1 text-slate-500 hover:text-slate-700 cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-1 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 cursor-pointer"
                        >
                          Simpan
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Grid Card Tema Gaya 3 */}
                  <div className="grid grid-cols-2 gap-2.5">
                    {style3Themes.map((preset) => {
                      const isCurrent =
                        style3Colors.questionBoxBg === preset.colors.questionBoxBg &&
                        style3Colors.questionPillBg === preset.colors.questionPillBg &&
                        style3Colors.explanationBoxBg === preset.colors.explanationBoxBg;

                      return (
                        <div
                          key={preset.id}
                          className={`p-2.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                            isCurrent
                              ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/30 shadow-xs'
                              : 'border-slate-200 hover:border-slate-300 bg-white hover:shadow-xs'
                          }`}
                        >
                          {editingStyle3ThemeId === preset.id ? (
                            /* Inline Edit Form */
                            <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                              <div className="text-[11px] font-bold text-indigo-900 flex items-center gap-1">
                                <Pencil className="w-3 h-3 text-indigo-600" />
                                <span>Edit Tema Gaya 3</span>
                              </div>
                              <input
                                type="text"
                                value={editingStyle3ThemeName}
                                onChange={(e) => setEditingStyle3ThemeName(e.target.value)}
                                placeholder="Nama tema..."
                                className="w-full px-2 py-1 text-xs border border-indigo-300 rounded-lg bg-white font-medium"
                                autoFocus
                              />
                              <label className="flex items-start gap-1.5 text-[10px] text-slate-700 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={editingStyle3ThemeUpdateColors}
                                  onChange={(e) => setEditingStyle3ThemeUpdateColors(e.target.checked)}
                                  className="rounded border-slate-300 text-indigo-600 mt-0.5"
                                />
                                <span>Perbarui warna dengan palet aktif</span>
                              </label>
                              <div className="flex justify-end gap-1.5 pt-1">
                                <button
                                  type="button"
                                  onClick={() => setEditingStyle3ThemeId(null)}
                                  className="px-2 py-0.5 text-[11px] text-slate-600 hover:bg-slate-100 rounded-md font-medium cursor-pointer"
                                >
                                  Batal
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const trimmed = editingStyle3ThemeName.trim();
                                    if (!trimmed) return;
                                    onEditStyle3Theme(preset.id, trimmed, editingStyle3ThemeUpdateColors);
                                    setEditingStyle3ThemeId(null);
                                  }}
                                  className="px-2 py-0.5 text-[11px] bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-semibold cursor-pointer shadow-xs"
                                >
                                  Simpan
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center justify-between mb-1.5 gap-1">
                                <div className="flex items-center gap-1 min-w-0">
                                  <span
                                    className="text-xs font-semibold text-slate-800 truncate"
                                    title={preset.name}
                                  >
                                    {preset.name}
                                  </span>
                                  {preset.isCustom && (
                                    <span className="text-[9px] bg-amber-100 text-amber-800 px-1 py-0.2 rounded font-medium shrink-0">
                                      Kustom
                                    </span>
                                  )}
                                </div>
                                {isCurrent && (
                                  <span className="bg-indigo-600 text-white rounded-full p-0.5 shrink-0" title="Sedang Aktif">
                                    <Check className="w-2.5 h-2.5" />
                                  </span>
                                )}
                              </div>

                              {/* Swatches preview - click to apply */}
                              <div
                                onClick={() => applyStyle3Preset(preset.colors)}
                                className="cursor-pointer py-1"
                                title="Klik untuk terapkan tema ini"
                              >
                                <div className="flex items-center gap-1.5">
                                  <div
                                    className="w-5 h-5 rounded-md shadow-2xs border border-black/10 shrink-0"
                                    style={{ backgroundColor: preset.colors.questionBoxBg }}
                                    title="Box Soal"
                                  />
                                  <div
                                    className="w-5 h-5 rounded-md shadow-2xs border border-black/10 shrink-0"
                                    style={{ backgroundColor: preset.colors.questionPillBg }}
                                    title="Pill Soal"
                                  />
                                  <div
                                    className="w-5 h-5 rounded-md shadow-2xs border border-black/10 shrink-0"
                                    style={{ backgroundColor: preset.colors.explanationPillBg }}
                                    title="Pill Penjelasan"
                                  />
                                  <div
                                    className="w-5 h-5 rounded-md shadow-2xs border border-black/10 shrink-0"
                                    style={{ backgroundColor: preset.colors.questionBoxBorder }}
                                    title="Garis Tepi"
                                  />
                                </div>
                              </div>

                              {/* Action buttons: Terapkan, Edit, Duplicate, Delete */}
                              <div className="flex items-center justify-between pt-1.5 mt-1 border-t border-slate-100 text-[11px]">
                                <button
                                  type="button"
                                  onClick={() => applyStyle3Preset(preset.colors)}
                                  className="text-indigo-600 font-semibold hover:text-indigo-800 cursor-pointer text-[10px]"
                                >
                                  {isCurrent ? 'Aktif' : 'Terapkan'}
                                </button>

                                <div className="flex items-center gap-0.5">
                                  {/* Edit Button */}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingStyle3ThemeId(preset.id);
                                      setEditingStyle3ThemeName(preset.name);
                                      setEditingStyle3ThemeUpdateColors(false);
                                    }}
                                    title="Edit nama tema atau perbarui warnanya"
                                    className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors cursor-pointer"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Duplicate Button */}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDuplicateStyle3Theme(preset);
                                    }}
                                    title="Duplikasi tema ini"
                                    className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors cursor-pointer"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Delete Button */}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDeleteStyle3Theme(preset.id);
                                    }}
                                    title="Hapus tema ini"
                                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-200">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Kustomisasi Warna Gaya 3
                  </h3>

                  <div className="space-y-3">
                    <div className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">
                      Warna Box Soal (Box 1)
                    </div>
                    <ColorField
                      label="Latar Belakang Box Soal"
                      value={style3Colors.questionBoxBg}
                      onChange={(val) =>
                        onStyle3ColorsChange({
                          ...style3Colors,
                          questionBoxBg: val,
                        })
                      }
                    />
                    <ColorField
                      label="Garis Tepi Box Soal"
                      value={style3Colors.questionBoxBorder}
                      onChange={(val) =>
                        onStyle3ColorsChange({
                          ...style3Colors,
                          questionBoxBorder: val,
                        })
                      }
                    />
                    <ColorField
                      label="Pill Label Soal (Background)"
                      value={style3Colors.questionPillBg}
                      onChange={(val) =>
                        onStyle3ColorsChange({
                          ...style3Colors,
                          questionPillBg: val,
                        })
                      }
                    />
                    <ColorField
                      label="Teks Pill Label Soal"
                      value={style3Colors.questionPillText}
                      onChange={(val) =>
                        onStyle3ColorsChange({
                          ...style3Colors,
                          questionPillText: val,
                        })
                      }
                    />
                    <ColorField
                      label="Teks Soal"
                      value={style3Colors.questionTextColor}
                      onChange={(val) =>
                        onStyle3ColorsChange({
                          ...style3Colors,
                          questionTextColor: val,
                        })
                      }
                    />
                    <ColorField
                      label="Garis Garis Kosong (Blank Underline)"
                      value={style3Colors.blankLineColor}
                      onChange={(val) =>
                        onStyle3ColorsChange({
                          ...style3Colors,
                          blankLineColor: val,
                        })
                      }
                    />
                    <ColorField
                      label="Teks Pilihan Jawaban"
                      value={style3Colors.choiceTextColor}
                      onChange={(val) =>
                        onStyle3ColorsChange({
                          ...style3Colors,
                          choiceTextColor: val,
                        })
                      }
                    />
                    <ColorField
                      label="Latar Highlight Jawaban Benar"
                      value={style3Colors.correctAnswerHighlightBg}
                      onChange={(val) =>
                        onStyle3ColorsChange({
                          ...style3Colors,
                          correctAnswerHighlightBg: val,
                        })
                      }
                    />

                    <div className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider pt-2 border-t border-slate-100">
                      Warna Box Penjelasan (Box 2)
                    </div>
                    <ColorField
                      label="Latar Belakang Box Penjelasan"
                      value={style3Colors.explanationBoxBg}
                      onChange={(val) =>
                        onStyle3ColorsChange({
                          ...style3Colors,
                          explanationBoxBg: val,
                        })
                      }
                    />
                    <ColorField
                      label="Garis Tepi Box Penjelasan"
                      value={style3Colors.explanationBoxBorder}
                      onChange={(val) =>
                        onStyle3ColorsChange({
                          ...style3Colors,
                          explanationBoxBorder: val,
                        })
                      }
                    />
                    <ColorField
                      label="Pill Penjelasan (Background)"
                      value={style3Colors.explanationPillBg}
                      onChange={(val) =>
                        onStyle3ColorsChange({
                          ...style3Colors,
                          explanationPillBg: val,
                        })
                      }
                    />
                    <ColorField
                      label="Teks Pill Penjelasan"
                      value={style3Colors.explanationPillText}
                      onChange={(val) =>
                        onStyle3ColorsChange({
                          ...style3Colors,
                          explanationPillText: val,
                        })
                      }
                    />
                    <ColorField
                      label="Teks Isi Penjelasan"
                      value={style3Colors.explanationTextColor}
                      onChange={(val) =>
                        onStyle3ColorsChange({
                          ...style3Colors,
                          explanationTextColor: val,
                        })
                      }
                    />
                  </div>
                </div>
              </>
            ) : (
              /* Preset & Pickers untuk Gaya 1 & 2 */
              <>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Preset Tema Warna
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsSavingTheme(true)}
                      className="inline-flex items-center gap-1 text-xs text-indigo-600 font-semibold hover:text-indigo-800 cursor-pointer"
                    >
                      <BookmarkPlus className="w-3.5 h-3.5" />
                      <span>Simpan Tema</span>
                    </button>
                  </div>

                  {isSavingTheme && (
                    <form
                      onSubmit={handleSaveThemeSubmit}
                      className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2 text-xs"
                    >
                      <div className="font-semibold text-indigo-900">
                        Simpan Palet Saat Ini sebagai Tema Baru
                      </div>
                      <input
                        type="text"
                        value={newThemeName}
                        onChange={(e) => setNewThemeName(e.target.value)}
                        placeholder="Contoh: Tema Brand Perusahaan"
                        className="w-full px-3 py-1.5 text-xs border border-indigo-300 rounded-lg bg-white"
                      />
                      {themeSaveError && (
                        <p className="text-rose-600 text-[11px]">
                          {themeSaveError}
                        </p>
                      )}
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setIsSavingTheme(false)}
                          className="px-3 py-1 text-slate-500 hover:text-slate-700 cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-1 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 cursor-pointer"
                        >
                          Simpan
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="grid grid-cols-2 gap-2.5">
                    {themes.map((theme) => {
                      const isCurrent =
                        colors.mainBoxBg === theme.colors.mainBoxBg &&
                        colors.subBoxBg === theme.colors.subBoxBg;

                      return (
                        <div
                          key={theme.id}
                          className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between relative ${
                            isCurrent
                              ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/30 shadow-xs'
                              : 'border-slate-200 hover:border-slate-300 bg-white hover:shadow-xs'
                          }`}
                        >
                          {editingThemeId === theme.id ? (
                            /* Inline Edit Form */
                            <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                              <div className="text-[11px] font-bold text-indigo-900 flex items-center gap-1">
                                <Pencil className="w-3 h-3 text-indigo-600" />
                                <span>Edit Tema</span>
                              </div>
                              <input
                                type="text"
                                value={editingThemeName}
                                onChange={(e) => setEditingThemeName(e.target.value)}
                                placeholder="Nama tema..."
                                className="w-full px-2 py-1 text-xs border border-indigo-300 rounded-lg bg-white font-medium"
                                autoFocus
                              />
                              <label className="flex items-start gap-1.5 text-[10px] text-slate-700 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={editingThemeUpdateColors}
                                  onChange={(e) => setEditingThemeUpdateColors(e.target.checked)}
                                  className="rounded border-slate-300 text-indigo-600 mt-0.5"
                                />
                                <span>Perbarui warna dengan palet aktif</span>
                              </label>
                              <div className="flex justify-end gap-1.5 pt-1">
                                <button
                                  type="button"
                                  onClick={() => setEditingThemeId(null)}
                                  className="px-2 py-0.5 text-[11px] text-slate-600 hover:bg-slate-100 rounded-md font-medium cursor-pointer"
                                >
                                  Batal
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const trimmed = editingThemeName.trim();
                                    if (!trimmed) return;
                                    onEditTheme(theme.id, trimmed, editingThemeUpdateColors);
                                    setEditingThemeId(null);
                                  }}
                                  className="px-2 py-0.5 text-[11px] bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-semibold cursor-pointer shadow-xs"
                                >
                                  Simpan
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center justify-between mb-1.5 gap-1">
                                <div className="flex items-center gap-1 min-w-0">
                                  <span
                                    className="text-xs font-semibold text-slate-800 truncate"
                                    title={theme.name}
                                  >
                                    {theme.name}
                                  </span>
                                  {theme.isCustom && (
                                    <span className="text-[9px] bg-amber-100 text-amber-800 px-1 py-0.2 rounded font-medium shrink-0">
                                      Kustom
                                    </span>
                                  )}
                                </div>
                                {isCurrent && (
                                  <span className="bg-indigo-600 text-white rounded-full p-0.5 shrink-0" title="Sedang Aktif">
                                    <Check className="w-2.5 h-2.5" />
                                  </span>
                                )}
                              </div>

                              {/* Swatches preview - click to apply */}
                              <div
                                onClick={() => applyPreset(theme.colors)}
                                className="cursor-pointer py-1"
                                title="Klik untuk terapkan tema ini"
                              >
                                <div className="flex items-center gap-1.5">
                                  <div
                                    className="w-5 h-5 rounded-md shadow-2xs border border-black/10 shrink-0"
                                    style={{ backgroundColor: theme.colors.mainBoxBg }}
                                    title="Kotak Utama / Lingkaran Tengah"
                                  />
                                  <div
                                    className="w-5 h-5 rounded-md shadow-2xs border border-black/10 shrink-0"
                                    style={{ backgroundColor: theme.colors.subBoxBg }}
                                    title="Sub Box"
                                  />
                                  <div
                                    className="w-5 h-5 rounded-md shadow-2xs border border-black/10 shrink-0"
                                    style={{ backgroundColor: theme.colors.pillBg }}
                                    title="Pill"
                                  />
                                  <div
                                    className="w-5 h-5 rounded-md shadow-2xs border border-black/10 shrink-0"
                                    style={{
                                      backgroundColor:
                                        theme.colors.numberCircleBg || '#ffffff',
                                    }}
                                    title="Lingkaran Putih / Nomor"
                                  />
                                </div>
                              </div>

                              {/* Action buttons: Terapkan, Edit, Duplicate, Delete */}
                              <div className="flex items-center justify-between pt-1.5 mt-1 border-t border-slate-100 text-[11px]">
                                <button
                                  type="button"
                                  onClick={() => applyPreset(theme.colors)}
                                  className="text-indigo-600 font-semibold hover:text-indigo-800 cursor-pointer text-[10px]"
                                >
                                  {isCurrent ? 'Aktif' : 'Terapkan'}
                                </button>

                                <div className="flex items-center gap-0.5">
                                  {/* Edit Button */}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingThemeId(theme.id);
                                      setEditingThemeName(theme.name);
                                      setEditingThemeUpdateColors(false);
                                    }}
                                    title="Edit nama tema atau perbarui warnanya"
                                    className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors cursor-pointer"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Duplicate Button */}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDuplicateTheme(theme);
                                    }}
                                    title="Duplikasi tema ini"
                                    className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors cursor-pointer"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Delete Button */}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDeleteTheme(theme.id);
                                    }}
                                    title="Hapus tema ini"
                                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Restore Built-in Themes Button */}
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={onRestoreDefaultThemes}
                      className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-indigo-600 cursor-pointer transition-colors"
                      title="Kembalikan daftar tema ke tema bawaan sistem"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Pulihkan Tema Bawaan</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-200">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Kustomisasi Warna ({isStyle4 ? 'Gaya 4: Radial' : isStyle2 ? 'Gaya 2: Pill Bernomor' : 'Gaya 1'})
                  </h3>

                  <div className="space-y-3">
                    {isStyle4 ? (
                      <>
                        <div className="p-3 bg-purple-50/60 border border-purple-200/70 rounded-xl space-y-3">
                          <div className="text-[11px] font-bold text-purple-900 uppercase tracking-wider">
                            Lingkaran Tengah & Konektor
                          </div>
                          <ColorField
                            label="Lingkaran Tengah (Background)"
                            value={colors.mainBoxBg}
                            onChange={(val) => onColorsChange({ ...colors, mainBoxBg: val })}
                          />
                          <ColorField
                            label="Teks Lingkaran Tengah"
                            value={colors.mainBoxText}
                            onChange={(val) => onColorsChange({ ...colors, mainBoxText: val })}
                          />
                          <ColorField
                            label="Busur Kurung & Konektor (Garis & Dot)"
                            value={colors.connectorColor}
                            onChange={(val) =>
                              onColorsChange({ ...colors, connectorColor: val })
                            }
                          />
                        </div>

                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                          <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                            Sub Box (Pill Panjang)
                          </div>
                          <ColorField
                            label="Pill Sub Box (Background)"
                            value={colors.pillBg}
                            onChange={(val) => onColorsChange({ ...colors, pillBg: val })}
                          />
                          <ColorField
                            label="Teks di Dalam Pill"
                            value={colors.pillText}
                            onChange={(val) => onColorsChange({ ...colors, pillText: val })}
                          />
                          <ColorField
                            label="Garis Tepi Pill"
                            value={colors.pillBorder || '#5a3e78'}
                            onChange={(val) =>
                              onColorsChange({ ...colors, pillBorder: val })
                            }
                          />
                        </div>

                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                          <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                            Lingkaran Putih (Circle Box)
                          </div>
                          <ColorField
                            label="Lingkaran Putih (Background)"
                            value={colors.numberCircleBg || '#ffffff'}
                            onChange={(val) =>
                              onColorsChange({ ...colors, numberCircleBg: val })
                            }
                          />
                          <ColorField
                            label="Garis Tepi Lingkaran Putih"
                            value={colors.numberCircleBorder || '#3a3a3a'}
                            onChange={(val) =>
                              onColorsChange({
                                ...colors,
                                numberCircleBorder: val,
                              })
                            }
                          />
                          <ColorField
                            label="Teks Angka Nomor"
                            value={colors.numberCircleText || '#2e2e2e'}
                            onChange={(val) =>
                              onColorsChange({
                                ...colors,
                                numberCircleText: val,
                              })
                            }
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <ColorField
                          label="Kotak Utama (Background)"
                          value={colors.mainBoxBg}
                          onChange={(val) => onColorsChange({ ...colors, mainBoxBg: val })}
                        />
                        <ColorField
                          label="Teks Kotak Utama"
                          value={colors.mainBoxText}
                          onChange={(val) => onColorsChange({ ...colors, mainBoxText: val })}
                        />
                        <ColorField
                          label="Garis Bingkai Luar Kotak Utama"
                          value={colors.mainBoxOuterBorder}
                          onChange={(val) =>
                            onColorsChange({ ...colors, mainBoxOuterBorder: val })
                          }
                        />

                        {isStyle2 ? (
                          <>
                            <div className="pt-2 border-t border-slate-100">
                              <div className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider mb-2">
                                Warna Lingkaran Nomor & Pill (Gaya 2)
                              </div>
                              <div className="space-y-3">
                                <ColorField
                                  label="Lingkaran Nomor (Background)"
                                  value={colors.numberCircleBg || '#ffffff'}
                                  onChange={(val) =>
                                    onColorsChange({ ...colors, numberCircleBg: val })
                                  }
                                />
                                <ColorField
                                  label="Garis Tepi Lingkaran Nomor"
                                  value={colors.numberCircleBorder || '#3a3a3a'}
                                  onChange={(val) =>
                                    onColorsChange({
                                      ...colors,
                                      numberCircleBorder: val,
                                    })
                                  }
                                />
                                <ColorField
                                  label="Teks Angka / Huruf Nomor"
                                  value={colors.numberCircleText || '#2e2e2e'}
                                  onChange={(val) =>
                                    onColorsChange({
                                      ...colors,
                                      numberCircleText: val,
                                    })
                                  }
                                />
                                <ColorField
                                  label="Badan Pill Panjang (Background)"
                                  value={colors.pillBg}
                                  onChange={(val) =>
                                    onColorsChange({ ...colors, pillBg: val })
                                  }
                                />
                                <ColorField
                                  label="Teks di Dalam Pill"
                                  value={colors.pillText}
                                  onChange={(val) =>
                                    onColorsChange({ ...colors, pillText: val })
                                  }
                                />
                                <ColorField
                                  label="Garis Tepi Pill"
                                  value={colors.pillBorder || '#3a3a3a'}
                                  onChange={(val) =>
                                    onColorsChange({ ...colors, pillBorder: val })
                                  }
                                />
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <ColorField
                              label="Sub Box (Background)"
                              value={colors.subBoxBg}
                              onChange={(val) =>
                                onColorsChange({ ...colors, subBoxBg: val })
                              }
                            />
                            <ColorField
                              label="Teks Isi Sub Box"
                              value={colors.subBoxText}
                              onChange={(val) =>
                                onColorsChange({ ...colors, subBoxText: val })
                              }
                            />
                            <ColorField
                              label="Label Pill (Background)"
                              value={colors.pillBg}
                              onChange={(val) =>
                                onColorsChange({ ...colors, pillBg: val })
                              }
                            />
                            <ColorField
                              label="Teks Label Pill"
                              value={colors.pillText}
                              onChange={(val) =>
                                onColorsChange({ ...colors, pillText: val })
                              }
                            />
                          </>
                        )}

                        <ColorField
                          label={
                            isStyle2
                              ? 'Garis Konektor Miring & Dot'
                              : 'Garis Konektor & Dot'
                          }
                          value={colors.connectorColor}
                          onChange={(val) =>
                            onColorsChange({ ...colors, connectorColor: val })
                          }
                        />
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ===================== TAB 3: PENGATURAN ===================== */}
        {activeTab === 'layout' && (
          <div className="space-y-6">
            {/* Profil Bingkai / Shape — berlaku untuk SEMUA gaya */}
            {onShapeProfileChange && (
              <div className="p-3.5 bg-fuchsia-50/60 border border-fuchsia-200 rounded-2xl space-y-2">
                <div className="flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-fuchsia-700" />
                  <span className="text-xs font-bold uppercase tracking-wider text-fuchsia-950">
                    Profil Bingkai / Shape (Semua Gaya)
                  </span>
                </div>
                <StrokeProfileDropdown
                  accent="purple"
                  value={shapeProfile || 'uniform'}
                  onChange={onShapeProfileChange}
                />
                <p className="text-[10px] text-fuchsia-800/80 leading-relaxed">
                  Membuat ketebalan bingkai bervariasi (kotak utama, bingkai ganda
                  luar, sub box, pill, lingkaran nomor, bingkai foto, dll). Pilih
                  "Seragam" untuk tampilan normal.
                </p>
              </div>
            )}
            {isStyle5 ? (
              /* PENGATURAN KHUSUS GAYA 5 (SLIDE MATERI) */
              <div className="space-y-4">
                {/* 1. Ukuran Font */}
                <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-3.5">
                  <div className="flex items-center gap-1.5">
                    <Type className="w-4 h-4 text-indigo-700" />
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-950">
                      Ukuran Font (Gaya 5)
                    </span>
                  </div>

                  {/* Judul Header */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-slate-700">
                      <span>Judul Header</span>
                      <span className="font-mono text-slate-500">
                        {s5Layout.fontSizeHeader} px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={14}
                      max={60}
                      step={1}
                      value={s5Layout.fontSizeHeader}
                      onChange={(e) =>
                        onStyle5LayoutChange?.({
                          ...s5Layout,
                          fontSizeHeader: Number(e.target.value),
                        })
                      }
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>

                  {/* Nama Tokoh */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-slate-700">
                      <span>Nama Tokoh</span>
                      <span className="font-mono text-slate-500">
                        {s5Layout.fontSizeName} px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={60}
                      step={1}
                      value={s5Layout.fontSizeName}
                      onChange={(e) =>
                        onStyle5LayoutChange?.({
                          ...s5Layout,
                          fontSizeName: Number(e.target.value),
                        })
                      }
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>

                  {/* Teks Pill */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-slate-700">
                      <span>Teks Pill Poin</span>
                      <span className="font-mono text-slate-500">
                        {s5Layout.fontSizePill} px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={60}
                      step={1}
                      value={s5Layout.fontSizePill}
                      onChange={(e) =>
                        onStyle5LayoutChange?.({
                          ...s5Layout,
                          fontSizePill: Number(e.target.value),
                        })
                      }
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>

                  {/* Teks Deskripsi */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-slate-700">
                      <span>Teks Deskripsi</span>
                      <span className="font-mono text-slate-500">
                        {s5Layout.fontSizeDesc} px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={60}
                      step={1}
                      value={s5Layout.fontSizeDesc}
                      onChange={(e) =>
                        onStyle5LayoutChange?.({
                          ...s5Layout,
                          fontSizeDesc: Number(e.target.value),
                        })
                      }
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>
                </div>

                {/* 2. Tebal Font */}
                <div className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-3.5">
                  <div className="flex items-center gap-1.5">
                    <CaseSensitive className="w-4 h-4 text-purple-700" />
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-950">
                      Tebal Font (Gaya 5)
                    </span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-600 block">
                      Judul Header:
                    </label>
                    <select
                      value={s5Layout.fontWeightHeader || 'bold'}
                      onChange={(e) =>
                        onStyle5LayoutChange?.({
                          ...s5Layout,
                          fontWeightHeader: e.target.value as Style5FontWeight,
                        })
                      }
                      className="w-full px-2.5 py-1.5 text-xs font-medium border border-slate-300 rounded-lg bg-white text-slate-800 cursor-pointer"
                    >
                      {STYLE5_FONT_WEIGHT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-600 block">
                      Nama Tokoh:
                    </label>
                    <select
                      value={s5Layout.fontWeightName || 'semibold'}
                      onChange={(e) =>
                        onStyle5LayoutChange?.({
                          ...s5Layout,
                          fontWeightName: e.target.value as Style5FontWeight,
                        })
                      }
                      className="w-full px-2.5 py-1.5 text-xs font-medium border border-slate-300 rounded-lg bg-white text-slate-800 cursor-pointer"
                    >
                      {STYLE5_FONT_WEIGHT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-600 block">
                      Teks Pill:
                    </label>
                    <select
                      value={s5Layout.fontWeightPill || 'regular'}
                      onChange={(e) =>
                        onStyle5LayoutChange?.({
                          ...s5Layout,
                          fontWeightPill: e.target.value as Style5FontWeight,
                        })
                      }
                      className="w-full px-2.5 py-1.5 text-xs font-medium border border-slate-300 rounded-lg bg-white text-slate-800 cursor-pointer"
                    >
                      {STYLE5_FONT_WEIGHT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-600 block">
                      Teks Deskripsi:
                    </label>
                    <select
                      value={s5Layout.fontWeightDesc || 'regular'}
                      onChange={(e) =>
                        onStyle5LayoutChange?.({
                          ...s5Layout,
                          fontWeightDesc: e.target.value as Style5FontWeight,
                        })
                      }
                      className="w-full px-2.5 py-1.5 text-xs font-medium border border-slate-300 rounded-lg bg-white text-slate-800 cursor-pointer"
                    >
                      {STYLE5_FONT_WEIGHT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 3. Bentuk, Jarak & Sidebar */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3.5">
                  <div className="flex items-center gap-1.5">
                    <Ratio className="w-4 h-4 text-slate-600" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Bentuk, Jarak & Sidebar
                    </span>
                  </div>

                  {/* Sudut Membulat */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-slate-700">
                      <span>Sudut Membulat (Radius)</span>
                      <span className="font-mono text-slate-500">
                        {s5Layout.borderRadius} px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={40}
                      step={1}
                      value={s5Layout.borderRadius}
                      onChange={(e) =>
                        onStyle5LayoutChange?.({
                          ...s5Layout,
                          borderRadius: Number(e.target.value),
                        })
                      }
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>

                  {/* Jarak Antar Poin */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-slate-700">
                      <span>Jarak Antar Poin</span>
                      <span className="font-mono text-slate-500">
                        {s5Layout.pointsGap} px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={4}
                      max={60}
                      step={2}
                      value={s5Layout.pointsGap}
                      onChange={(e) =>
                        onStyle5LayoutChange?.({
                          ...s5Layout,
                          pointsGap: Number(e.target.value),
                        })
                      }
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>

                  {/* Ukuran Foto */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-slate-700">
                      <span>Ukuran Foto</span>
                      <span className="font-mono text-slate-500">
                        {s5Layout.photoSize} px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={80}
                      max={320}
                      step={5}
                      value={s5Layout.photoSize}
                      onChange={(e) =>
                        onStyle5LayoutChange?.({
                          ...s5Layout,
                          photoSize: Number(e.target.value),
                        })
                      }
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>

                  {/* Lebar Sidebar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-slate-700">
                      <span>Lebar Sidebar</span>
                      <span className="font-mono text-slate-500">
                        {s5Layout.sidebarWidthPercent}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={30}
                      step={1}
                      value={s5Layout.sidebarWidthPercent}
                      onChange={(e) =>
                        onStyle5LayoutChange?.({
                          ...s5Layout,
                          sidebarWidthPercent: Number(e.target.value),
                        })
                      }
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                    <p className="text-[10px] text-slate-400">
                      Saat sidebar disembunyikan, konten akan melebar mengisi kanvas.
                    </p>
                  </div>
                </div>

                {/* 4. Ukuran Kanvas */}
                {canvasDimension && onCanvasDimensionChange && (
                  <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3.5">
                    <div className="flex items-center gap-1.5">
                      <Maximize className="w-4 h-4 text-emerald-700" />
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-950">
                        Ukuran Kanvas
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {(['16:9', '1:1', '9:16'] as const).map((key) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => onCanvasDimensionChange(CANVAS_PRESETS[key])}
                          className={`py-2 px-2 rounded-xl text-[11px] font-semibold border transition-all cursor-pointer ${
                            canvasDimension.preset === key
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <span className="block">{key}</span>
                          <span className="block text-[9px] font-normal opacity-80">
                            {CANVAS_PRESETS[key].width} × {CANVAS_PRESETS[key].height}
                          </span>
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-slate-600 block">
                          Lebar (px):
                        </label>
                        <input
                          type="number"
                          min={200}
                          max={5000}
                          value={canvasDimension.width}
                          onChange={(e) =>
                            onCanvasDimensionChange({
                              ...canvasDimension,
                              preset: 'custom',
                              width: Number(e.target.value),
                            })
                          }
                          className="w-full px-2.5 py-1.5 text-xs font-medium border border-slate-300 rounded-lg bg-white text-slate-800"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-slate-600 block">
                          Tinggi (px):
                        </label>
                        <input
                          type="number"
                          min={200}
                          max={5000}
                          value={canvasDimension.height}
                          onChange={(e) =>
                            onCanvasDimensionChange({
                              ...canvasDimension,
                              preset: 'custom',
                              height: Number(e.target.value),
                            })
                          }
                          className="w-full px-2.5 py-1.5 text-xs font-medium border border-slate-300 rounded-lg bg-white text-slate-800"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Tombol reset Gaya 5 */}
                {onLoadStyle5Default && (
                  <button
                    type="button"
                    onClick={onLoadStyle5Default}
                    className="w-full py-2.5 px-3 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Muat Ulang Contoh Gaya 5</span>
                  </button>
                )}
              </div>
            ) : isStyle3 ? (
              /* PENGATURAN KHUSUS GAYA 3 (SOAL & PENJELASAN) */
              <div className="space-y-4">
                {canvasSizeBlock}

                <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-3.5">
                  <div className="flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-indigo-700" />
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-950">
                      Pengaturan Tata Letak Soal (Gaya 3)
                    </span>
                  </div>

                  {/* Lebar Total Bagan */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-slate-700">
                      <span>Lebar Total Bagan Soal</span>
                      <span className="text-slate-500 font-mono">
                        {style3Layout.totalWidth} px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={600}
                      max={1300}
                      step={20}
                      value={style3Layout.totalWidth}
                      onChange={(e) =>
                        onStyle3LayoutChange({
                          ...style3Layout,
                          totalWidth: Number(e.target.value),
                        })
                      }
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>

                  {/* Jarak Antar Box (Soal dan Penjelasan) */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-slate-700">
                      <span>Jarak Antar Box Soal & Penjelasan</span>
                      <span className="text-slate-500 font-mono">
                        {style3Layout.boxesGap} px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={16}
                      max={60}
                      step={2}
                      value={style3Layout.boxesGap}
                      onChange={(e) =>
                        onStyle3LayoutChange({
                          ...style3Layout,
                          boxesGap: Number(e.target.value),
                        })
                      }
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>

                  {/* Kebulatan Sudut Box */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-slate-700">
                      <span>Kebulatan Sudut Box (Radius)</span>
                      <span className="text-slate-500 font-mono">
                        {style3Layout.borderRadius} px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={8}
                      max={32}
                      step={1}
                      value={style3Layout.borderRadius}
                      onChange={(e) =>
                        onStyle3LayoutChange({
                          ...style3Layout,
                          borderRadius: Number(e.target.value),
                        })
                      }
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>

                  {/* Lebar Sama Box Explanation Toggle */}
                  <div className="flex items-center justify-between p-2.5 bg-white border border-indigo-100 rounded-xl text-xs">
                    <div>
                      <span className="font-semibold text-slate-800 block">
                        Lebar Box Penjelasan Sama Penuh
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Box explanation mengikuti lebar box soal
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={style3Layout.matchExplanationWidth}
                      onChange={(e) =>
                        onStyle3LayoutChange({
                          ...style3Layout,
                          matchExplanationWidth: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                    />
                  </div>
                </div>

                {/* Pengaturan Tipografi & Ukuran Semua Teks */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3.5">
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 block">
                      Pengaturan Ukuran Semua Teks
                    </span>
                    <span className="text-[10px] text-indigo-600 bg-indigo-50 font-medium px-2 py-0.5 rounded-full border border-indigo-100">
                      Gaya 3
                    </span>
                  </div>

                  {/* 1. Ukuran Font Pill Soal */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-slate-700">
                      <span>Ukuran Font Pill Soal (Question)</span>
                      <span className="text-slate-600 font-mono font-semibold">
                        {style3Layout.fontSizeQuestionPill || style3Layout.fontSizePill || 15} px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={11}
                      max={60}
                      step={1}
                      value={style3Layout.fontSizeQuestionPill || style3Layout.fontSizePill || 15}
                      onChange={(e) =>
                        onStyle3LayoutChange({
                          ...style3Layout,
                          fontSizeQuestionPill: Number(e.target.value),
                          fontSizePill: Number(e.target.value),
                        })
                      }
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>

                  {/* 2. Ukuran Font Pill Explanation */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-slate-700">
                      <span>Ukuran Font Pill Explanation</span>
                      <span className="text-slate-600 font-mono font-semibold">
                        {style3Layout.fontSizeExplanationPill || style3Layout.fontSizePill || 15} px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={11}
                      max={60}
                      step={1}
                      value={style3Layout.fontSizeExplanationPill || style3Layout.fontSizePill || 15}
                      onChange={(e) =>
                        onStyle3LayoutChange({
                          ...style3Layout,
                          fontSizeExplanationPill: Number(e.target.value),
                        })
                      }
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>

                  {/* 3. Ukuran Font Soal */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-slate-700">
                      <span>Ukuran Font Teks Soal</span>
                      <span className="text-slate-600 font-mono font-semibold">
                        {style3Layout.fontSizeQuestion} px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={14}
                      max={60}
                      step={1}
                      value={style3Layout.fontSizeQuestion}
                      onChange={(e) =>
                        onStyle3LayoutChange({
                          ...style3Layout,
                          fontSizeQuestion: Number(e.target.value),
                        })
                      }
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>

                  {/* Font Weight Teks Soal */}
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-600 font-medium block">
                      Ketebalan Font Teks Soal:
                    </span>
                    <div className="grid grid-cols-3 gap-1 text-xs">
                      {(['regular', 'medium', 'bold'] as FontWeightOption[]).map(
                        (weight) => (
                          <button
                            key={weight}
                            type="button"
                            onClick={() =>
                              onStyle3LayoutChange({
                                ...style3Layout,
                                questionFontWeight: weight,
                              })
                            }
                            className={`py-1.5 rounded-lg font-medium capitalize text-center transition-all cursor-pointer ${
                              style3Layout.questionFontWeight === weight
                                ? 'bg-indigo-600 text-white font-semibold shadow-2xs'
                                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {weight}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {/* 4. Ukuran Font Pilihan */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-slate-700">
                      <span>Ukuran Font Pilihan Jawaban</span>
                      <span className="text-slate-600 font-mono font-semibold">
                        {style3Layout.fontSizeChoice} px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={12}
                      max={60}
                      step={1}
                      value={style3Layout.fontSizeChoice}
                      onChange={(e) =>
                        onStyle3LayoutChange({
                          ...style3Layout,
                          fontSizeChoice: Number(e.target.value),
                        })
                      }
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>

                  {/* 5. Jarak Antar Pilihan Jawaban */}
                  <div className="space-y-1 p-2.5 bg-indigo-50/70 border border-indigo-200/80 rounded-xl">
                    <div className="flex justify-between text-xs font-medium text-indigo-950">
                      <span className="font-semibold">Jarak Antar Pilihan Jawaban</span>
                      <span className="text-indigo-700 font-mono font-bold">
                        {style3Layout.choiceSpacing} px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={2}
                      max={36}
                      step={1}
                      value={style3Layout.choiceSpacing}
                      onChange={(e) =>
                        onStyle3LayoutChange({
                          ...style3Layout,
                          choiceSpacing: Number(e.target.value),
                        })
                      }
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                    <span className="text-[10px] text-slate-500 block">
                      Mengatur jarak vertikal antar baris pilihan jawaban (A, B, C, D)
                    </span>
                  </div>

                  {/* 6. Ukuran Font Penjelasan */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-slate-700">
                      <span>Ukuran Font Teks Penjelasan</span>
                      <span className="text-slate-600 font-mono font-semibold">
                        {style3Layout.fontSizeExplanation} px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={12}
                      max={60}
                      step={1}
                      value={style3Layout.fontSizeExplanation}
                      onChange={(e) =>
                        onStyle3LayoutChange({
                          ...style3Layout,
                          fontSizeExplanation: Number(e.target.value),
                        })
                      }
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Pengaturan Dimensi Kotak Gambar */}
                {style3Data.showImageBox && (
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                      Dimensi Kotak Gambar
                    </span>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-medium text-slate-700">
                        <span>Lebar Kotak Gambar</span>
                        <span className="text-slate-500">
                          {style3Layout.imageBoxWidth} px
                        </span>
                      </div>
                      <input
                        type="range"
                        min={160}
                        max={360}
                        step={10}
                        value={style3Layout.imageBoxWidth}
                        onChange={(e) =>
                          onStyle3LayoutChange({
                            ...style3Layout,
                            imageBoxWidth: Number(e.target.value),
                          })
                        }
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-medium text-slate-700">
                        <span>Tinggi Kotak Gambar</span>
                        <span className="text-slate-500">
                          {style3Layout.imageBoxHeight} px
                        </span>
                      </div>
                      <input
                        type="range"
                        min={120}
                        max={280}
                        step={10}
                        value={style3Layout.imageBoxHeight}
                        onChange={(e) =>
                          onStyle3LayoutChange({
                            ...style3Layout,
                            imageBoxHeight: Number(e.target.value),
                          })
                        }
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : isStyle4 ? (
              /* PENGATURAN UNTUK GAYA 4: RADIAL (LINGKARAN TENGAH) */
              <div className="space-y-4">
                {canvasSizeBlock}

                {/* 1. Pengaturan Lingkaran Utama & Busur Kurung */}
                <div className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-3.5">
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-purple-700" />
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-950">
                      Lingkaran Utama & Busur (Gaya 4)
                    </span>
                  </div>

                  {/* Diameter Lingkaran Tengah */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-slate-700">
                      <span>Diameter Lingkaran Tengah:</span>
                      <span className="font-semibold text-purple-700 font-mono">
                        {layout.style4CircleDiameter || 220} px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={160}
                      max={320}
                      step={5}
                      value={layout.style4CircleDiameter || 220}
                      onChange={(e) =>
                        onLayoutChange({
                          ...layout,
                          style4CircleDiameter: Number(e.target.value),
                        })
                      }
                      className="w-full accent-purple-600 cursor-pointer"
                    />
                  </div>

                  {/* Jarak Busur dari Lingkaran */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-slate-700">
                      <span>Jarak Busur Kurung "(" / ")" dari Lingkaran:</span>
                      <span className="font-semibold text-purple-700 font-mono">
                        {layout.style4ArcDistance !== undefined ? layout.style4ArcDistance : 20} px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={40}
                      step={2}
                      value={layout.style4ArcDistance !== undefined ? layout.style4ArcDistance : 20}
                      onChange={(e) =>
                        onLayoutChange({
                          ...layout,
                          style4ArcDistance: Number(e.target.value),
                        })
                      }
                      className="w-full accent-purple-600 cursor-pointer"
                    />
                  </div>

                  {/* Ukuran Dot Konektor di Busur */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-slate-700">
                      <span>Ukuran Titik Sambung (Dot) di Busur:</span>
                      <span className="font-semibold text-purple-700 font-mono">
                        {layout.style4DotSize || 14} px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={8}
                      max={22}
                      step={1}
                      value={layout.style4DotSize || 14}
                      onChange={(e) =>
                        onLayoutChange({
                          ...layout,
                          style4DotSize: Number(e.target.value),
                        })
                      }
                      className="w-full accent-purple-600 cursor-pointer"
                    />
                  </div>

                  {/* Panjang Garis Konektor Horizontal */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-slate-700">
                      <span>Panjang Garis Konektor:</span>
                      <span className="font-semibold text-purple-700 font-mono">
                        {layout.style4ConnectorLength || 46} px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={25}
                      max={75}
                      step={2}
                      value={layout.style4ConnectorLength || 46}
                      onChange={(e) =>
                        onLayoutChange({
                          ...layout,
                          style4ConnectorLength: Number(e.target.value),
                        })
                      }
                      className="w-full accent-purple-600 cursor-pointer"
                    />
                  </div>

                  {/* Tebal Garis Konektor & Busur */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-slate-700">
                      <span>Ketebalan Garis Busur & Konektor:</span>
                      <span className="font-semibold text-purple-700 font-mono">
                        {layout.connectorThickness || 2} px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      step={0.5}
                      value={layout.connectorThickness || 2}
                      onChange={(e) =>
                        onLayoutChange({
                          ...layout,
                          connectorThickness: Number(e.target.value),
                        })
                      }
                      className="w-full accent-purple-600 cursor-pointer"
                    />
                  </div>

                  {/* Profil Stroke (lebar variabel, seperti AI) */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-medium text-slate-700 block">
                      Profil Stroke:
                    </span>
                    <StrokeProfileDropdown
                      accent="purple"
                      value={layout.connectorProfile}
                      onChange={(id) =>
                        onLayoutChange({ ...layout, connectorProfile: id })
                      }
                    />
                  </div>
                </div>

                {/* 2. Pengaturan Sub Box Pill & Lingkaran Nomor */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                    Sub Box Pill & Lingkaran Putih
                  </span>

                  {/* Ukuran Lingkaran Putih */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-slate-700">
                      <span>Ukuran Lingkaran Putih (Circle Box):</span>
                      <span className="font-semibold text-indigo-600 font-mono">
                        {layout.style4CircleBoxSize || 42} px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={32}
                      max={56}
                      step={2}
                      value={layout.style4CircleBoxSize || 42}
                      onChange={(e) =>
                        onLayoutChange({
                          ...layout,
                          style4CircleBoxSize: Number(e.target.value),
                        })
                      }
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>

                  {/* Jarak Antar Sub Box Vertikal */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-slate-700">
                      <span>Jarak Antar Sub Box Vertikal:</span>
                      <span className="font-semibold text-indigo-600 font-mono">
                        {layout.style4SubBoxGap !== undefined
                          ? layout.style4SubBoxGap
                          : (layout.subBoxGap || 22)} px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={45}
                      step={2}
                      value={
                        layout.style4SubBoxGap !== undefined
                          ? layout.style4SubBoxGap
                          : (layout.subBoxGap || 22)
                      }
                      onChange={(e) =>
                        onLayoutChange({
                          ...layout,
                          style4SubBoxGap: Number(e.target.value),
                          subBoxGap: Number(e.target.value),
                        })
                      }
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>

                  {/* Penomoran Lingkaran Putih */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700 block">
                      Penomoran Circle Box:
                    </label>
                    <select
                      value={layout.style4NumberingType || 'none'}
                      onChange={(e) =>
                        onLayoutChange({
                          ...layout,
                          style4NumberingType: e.target.value as NumberingType,
                        })
                      }
                      className="w-full px-2.5 py-1.5 text-xs font-medium border border-slate-300 rounded-lg bg-white text-slate-800"
                    >
                      <option value="none">Tanpa Nomor (Kosong / Polos - Default)</option>
                      <option value="numbers">1. Angka (1, 2, 3, 4, ...)</option>
                      <option value="letters-upper">2. Huruf Kapital (A, B, C, D, ...)</option>
                      <option value="letters-lower">3. Huruf Kecil (a, b, c, d, ...)</option>
                      <option value="roman">4. Angka Romawi (I, II, III, IV, ...)</option>
                    </select>
                  </div>

                  {/* Lebar Maksimum Sub Box */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-slate-700">
                      <span>Batas Lebar Maksimum Pill:</span>
                      <span className="font-semibold text-indigo-600 font-mono">
                        {layout.subBoxMaxWidth || 380} px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={240}
                      max={550}
                      step={10}
                      value={layout.subBoxMaxWidth || 380}
                      onChange={(e) =>
                        onLayoutChange({
                          ...layout,
                          subBoxMaxWidth: Number(e.target.value),
                        })
                      }
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>
                </div>

                {/* 3. Tipografi & Ukuran Teks */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                    Ukuran Font Teks (Gaya 4)
                  </span>

                  {/* Ukuran Font Judul Utama */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-slate-700">
                      <span>Ukuran Font Judul Tengah:</span>
                      <span className="font-semibold text-indigo-600 font-mono">
                        {layout.fontSizeMain || 22} px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={16}
                      max={60}
                      step={1}
                      value={layout.fontSizeMain || 22}
                      onChange={(e) =>
                        onLayoutChange({
                          ...layout,
                          fontSizeMain: Number(e.target.value),
                        })
                      }
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>

                  {/* Ukuran Font Teks Sub Box */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-slate-700">
                      <span>Ukuran Font Teks Pill:</span>
                      <span className="font-semibold text-indigo-600 font-mono">
                        {layout.fontSizeBody || 15} px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={12}
                      max={60}
                      step={1}
                      value={layout.fontSizeBody || 15}
                      onChange={(e) =>
                        onLayoutChange({
                          ...layout,
                          fontSizeBody: Number(e.target.value),
                        })
                      }
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>
                </div>

                {/* 4. Kanvas & Skala */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                    Kanvas & Skala Bagan
                  </span>

                  {/* Padding Kanvas */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-slate-700">
                      <span>Bantalan Tepi Kanvas (Padding):</span>
                      <span className="font-semibold text-indigo-600 font-mono">
                        {layout.diagramPadding || 36} px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={16}
                      max={80}
                      step={4}
                      value={layout.diagramPadding || 36}
                      onChange={(e) =>
                        onLayoutChange({
                          ...layout,
                          diagramPadding: Number(e.target.value),
                        })
                      }
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>

                  {/* Skala Bagan */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-slate-700">
                      <span>Skala Keseluruhan Bagan:</span>
                      <span className="font-semibold text-indigo-600 font-mono">
                        {Math.round((layout.diagramScale || 1) * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0.6}
                      max={1.6}
                      step={0.05}
                      value={layout.diagramScale || 1}
                      onChange={(e) =>
                        onLayoutChange({
                          ...layout,
                          diagramScale: Number(e.target.value),
                        })
                      }
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* PENGATURAN UNTUK GAYA 1 & GAYA 2 */
              <>
                {canvasSizeBlock}

                {isStyle2 ? (
                  <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-3.5">
                    <div className="flex items-center gap-1.5">
                      <ListOrdered className="w-4 h-4 text-indigo-700" />
                      <span className="text-xs font-bold uppercase tracking-wider text-indigo-950">
                        Pengaturan Penomoran (Gaya 2)
                      </span>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700 block">
                        Jenis Penomoran:
                      </label>
                      <select
                        value={layout.style2NumberingType || 'numbers'}
                        onChange={(e) =>
                          onLayoutChange({
                            ...layout,
                            style2NumberingType: e.target.value as NumberingType,
                          })
                        }
                        className="w-full px-2.5 py-1.5 text-xs font-medium border border-slate-300 rounded-lg bg-white text-slate-800"
                      >
                        <option value="numbers">1. Angka (1. 2. 3. 4. 5.)</option>
                        <option value="letters-upper">
                          2. Huruf kapital (A. B. C. D. E.)
                        </option>
                        <option value="letters-lower">
                          3. Huruf kecil (a. b. c. d. e.)
                        </option>
                        <option value="roman">
                          4. Angka Romawi (I. II. III. IV. V.)
                        </option>
                        <option value="none">
                          5. Tanpa nomor (tanpa lingkaran, hanya box deskripsi)
                        </option>
                      </select>
                    </div>

                    {(layout.style2NumberingType || 'numbers') !== 'none' && (
                      <>
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-slate-700 block">
                            Format Pemisah:
                          </label>
                          <div className="grid grid-cols-3 gap-1.5 text-xs">
                            <button
                              type="button"
                              onClick={() =>
                                onLayoutChange({
                                  ...layout,
                                  style2Separator: '.',
                                })
                              }
                              className={`py-1 px-2 rounded-lg font-medium border text-center transition-all cursor-pointer ${
                                (layout.style2Separator || '.') === '.'
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs font-semibold'
                                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              Titik "1."
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                onLayoutChange({
                                  ...layout,
                                  style2Separator: ')',
                                })
                              }
                              className={`py-1 px-2 rounded-lg font-medium border text-center transition-all cursor-pointer ${
                                layout.style2Separator === ')'
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs font-semibold'
                                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              Kurung "1)"
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                onLayoutChange({
                                  ...layout,
                                  style2Separator: 'none',
                                })
                              }
                              className={`py-1 px-2 rounded-lg font-medium border text-center transition-all cursor-pointer ${
                                layout.style2Separator === 'none'
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs font-semibold'
                                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              Tanpa tanda "1"
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[11px]">
                            <label className="font-semibold text-slate-700">
                              Mulai Dari:
                            </label>
                            <span className="text-slate-400">
                              (Misal: 1, 3, atau huruf C)
                            </span>
                          </div>
                          <input
                            type="text"
                            value={layout.style2StartFrom || '1'}
                            onChange={(e) =>
                              onLayoutChange({
                                ...layout,
                                style2StartFrom: e.target.value,
                              })
                            }
                            placeholder="1"
                            className="w-full px-2.5 py-1.5 text-xs font-medium border border-slate-300 rounded-lg bg-white"
                          />
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-medium text-slate-700">
                            <span>Ukuran Lingkaran Nomor</span>
                            <span className="text-slate-500">
                              {layout.style2CircleSize || 42} px
                            </span>
                          </div>
                          <input
                            type="range"
                            min={32}
                            max={56}
                            step={2}
                            value={layout.style2CircleSize || 42}
                            onChange={(e) =>
                              onLayoutChange({
                                ...layout,
                                style2CircleSize: Number(e.target.value),
                              })
                            }
                            className="w-full accent-indigo-600 cursor-pointer"
                          />
                        </div>
                      </>
                    )}

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-medium text-slate-700">
                        <span>Tinggi / Padding Vertikal Pill</span>
                        <span className="text-slate-500">
                          {layout.style2PillPaddingY || 10} px
                        </span>
                      </div>
                      <input
                        type="range"
                        min={6}
                        max={20}
                        step={1}
                        value={layout.style2PillPaddingY || 10}
                        onChange={(e) =>
                          onLayoutChange({
                            ...layout,
                            style2PillPaddingY: Number(e.target.value),
                          })
                        }
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-medium text-slate-700">
                        <span>Kerapatan Dot di Kotak Utama</span>
                        <span className="text-slate-500">
                          {layout.style2DotSpacing || 14} px
                        </span>
                      </div>
                      <input
                        type="range"
                        min={10}
                        max={22}
                        step={1}
                        value={layout.style2DotSpacing || 14}
                        onChange={(e) =>
                          onLayoutChange({
                            ...layout,
                            style2DotSpacing: Number(e.target.value),
                          })
                        }
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-medium text-slate-700">
                        <span>Radius Sisi Kiri Pill (Kiri Atas & Bawah)</span>
                        <span className="text-slate-500 font-mono">
                          {layout.style2PillRadiusLeft !== undefined
                            ? layout.style2PillRadiusLeft
                            : 15}{' '}
                          px
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={30}
                        step={1}
                        value={
                          layout.style2PillRadiusLeft !== undefined
                            ? layout.style2PillRadiusLeft
                            : 15
                        }
                        onChange={(e) =>
                          onLayoutChange({
                            ...layout,
                            style2PillRadiusLeft: Number(e.target.value),
                          })
                        }
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                      <span className="text-[10px] text-slate-400 block">
                        Sudut sisi kiri atas dan bawah pill (default 15px), sisi kanan tetap membulat penuh.
                      </span>
                    </div>
                  </div>
                ) : null}

                {/* Bentuk & Spasi Bagan Umum */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Bentuk & Spasi Bagan
                  </h3>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-slate-700">
                      <span>Ukuran Font Judul Utama</span>
                      <span className="text-slate-500">{layout.fontSizeMain} px</span>
                    </div>
                    <input
                      type="range"
                      min={18}
                      max={60}
                      value={layout.fontSizeMain}
                      onChange={(e) =>
                        onLayoutChange({
                          ...layout,
                          fontSizeMain: Number(e.target.value),
                        })
                      }
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-slate-700">
                      <span>Ukuran Font Label Pill</span>
                      <span className="text-slate-500 font-mono font-medium">
                        {layout.fontSizePill} px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={11}
                      max={60}
                      value={layout.fontSizePill}
                      onChange={(e) =>
                        onLayoutChange({
                          ...layout,
                          fontSizePill: Number(e.target.value),
                        })
                      }
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-slate-700">
                      <span>Ukuran Font Isi Sub Box</span>
                      <span className="text-slate-500">{layout.fontSizeBody} px</span>
                    </div>
                    <input
                      type="range"
                      min={12}
                      max={60}
                      value={layout.fontSizeBody}
                      onChange={(e) =>
                        onLayoutChange({
                          ...layout,
                          fontSizeBody: Number(e.target.value),
                        })
                      }
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-slate-700">
                      <span>Jarak Antar Sub Box</span>
                      <span className="text-slate-500">{layout.subBoxGap} px</span>
                    </div>
                    <input
                      type="range"
                      min={14}
                      max={44}
                      value={layout.subBoxGap}
                      onChange={(e) =>
                        onLayoutChange({
                          ...layout,
                          subBoxGap: Number(e.target.value),
                        })
                      }
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-slate-700">
                      <span>Lebar Maksimal Sub Box</span>
                      <span className="text-slate-500">{layout.subBoxMaxWidth} px</span>
                    </div>
                    <input
                      type="range"
                      min={320}
                      max={600}
                      step={10}
                      value={layout.subBoxMaxWidth}
                      onChange={(e) =>
                        onLayoutChange({
                          ...layout,
                          subBoxMaxWidth: Number(e.target.value),
                        })
                      }
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-slate-700">
                      <span>Ketebalan Garis Konektor</span>
                      <span className="text-slate-500">
                        {layout.connectorThickness} px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={4}
                      step={0.5}
                      value={layout.connectorThickness}
                      onChange={(e) =>
                        onLayoutChange({
                          ...layout,
                          connectorThickness: Number(e.target.value),
                        })
                      }
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>

                  {/* Profil Stroke (lebar variabel, seperti AI) */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-medium text-slate-700 block">
                      Profil Stroke:
                    </span>
                    <StrokeProfileDropdown
                      value={layout.connectorProfile}
                      onChange={(id) =>
                        onLayoutChange({ ...layout, connectorProfile: id })
                      }
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-slate-700">
                      <span>Ukuran Titik Dot</span>
                      <span className="text-slate-500">{layout.connectorDotSize} px</span>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={12}
                      step={1}
                      value={layout.connectorDotSize}
                      onChange={(e) =>
                        onLayoutChange({
                          ...layout,
                          connectorDotSize: Number(e.target.value),
                        })
                      }
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>

                  {!isStyle2 && (
                    <div className="space-y-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                      <div className="flex justify-between text-xs font-medium text-slate-700 items-center">
                        <span>Posisi Geser Label Pill (Gaya 1)</span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 font-mono">
                            {layout.pillOffsetX !== undefined ? layout.pillOffsetX : 24} px
                          </span>
                          {layout.pillOffsetX !== undefined && layout.pillOffsetX !== 24 && (
                            <button
                              type="button"
                              onClick={() =>
                                onLayoutChange({ ...layout, pillOffsetX: 24 })
                              }
                              className="text-[10px] text-indigo-600 hover:text-indigo-800 cursor-pointer"
                            >
                              Reset (24px)
                            </button>
                          )}
                        </div>
                      </div>
                      <input
                        type="range"
                        min={8}
                        max={Math.max(120, (layout.subBoxMaxWidth || 440) - 140)}
                        step={2}
                        value={layout.pillOffsetX !== undefined ? layout.pillOffsetX : 24}
                        onChange={(e) =>
                          onLayoutChange({
                            ...layout,
                            pillOffsetX: Number(e.target.value),
                          })
                        }
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                      <span className="text-[10px] text-slate-400 block">
                        Semua label pill otomatis mengikuti posisi ini secara serentak.
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <div>
                      <div className="text-xs font-medium text-slate-800">
                        Bingkai Ganda Luar
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Garis tepi tipis di luar kotak utama
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={layout.showDoubleFrame}
                      onChange={(e) =>
                        onLayoutChange({
                          ...layout,
                          showDoubleFrame: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={onResetToDefault}
                      className="w-full py-2.5 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset Seluruh Pengaturan Bagan</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
