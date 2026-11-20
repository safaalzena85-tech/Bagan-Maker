/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import {
  DEFAULT_COLORS,
  DEFAULT_LAYOUT,
  DEFAULT_SUB_BOXES,
  DEFAULT_STYLE2_MAIN_TITLE,
  DEFAULT_STYLE2_SUB_BOXES,
  DEFAULT_STYLE3_DATA,
  DEFAULT_STYLE3_COLORS,
  DEFAULT_STYLE3_LAYOUT,
  DEFAULT_STYLE4_MAIN_TITLE,
  DEFAULT_STYLE4_SUB_BOXES,
  STYLE3_THEME_PRESETS,
  THEME_PRESETS,
  DEFAULT_STYLE5_DATA,
  DEFAULT_STYLE5_COLORS,
  DEFAULT_STYLE5_LAYOUT,
  DEFAULT_CANVAS_DIMENSION,
  UNIVERSAL_THEME_PRESETS,
  createStyle5Artboard,
  mapUniversalThemeToColors,
  mapUniversalThemeToStyle3,
  mapUniversalThemeToStyle5,
} from './constants/presets';
import {
  CanvasDimension,
  CaseTransformSettings,
  ColorSettings,
  DiagramStyleType,
  LayoutSettings,
  SavedProject,
  Style3ColorSettings,
  Style3ExportScope,
  Style3LayoutSettings,
  Style3QuestionData,
  Style3ThemePreset,
  Style5Artboard,
  Style5ColorSettings,
  Style5Data,
  Style5LayoutSettings,
  Style5PointItem,
  Style5FreeElement,
  SubBoxItem,
  ThemePreset,
  UiTheme,
  UniversalThemeToken,
} from './types';
import { Header } from './components/Header';
import { EditorPanel } from './components/EditorPanel';
import { DiagramCanvas } from './components/DiagramCanvas';
import { BulkPasteModal } from './components/BulkPasteModal';
import { UniversalThemesModal } from './components/UniversalThemesModal';
import { ProjectModal } from './components/ProjectModal';
import {
  exportAsPng,
  exportPngToFileHandle,
  copyToClipboardAsPng,
  exportAsSvg,
  downloadSvgString,
  saveSvgToFileHandle,
  SVG_FILE_TYPE,
  type SaveFileHandle,
} from './utils/exportHelpers';
import { applyTextCaseTransform } from './utils/textCase';
import { createExportRecorder } from './utils/exportRecorder';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Check,
  AlertCircle,
  Hand,
  RotateCcw,
  Plus,
} from 'lucide-react';

const STORAGE_KEY = 'bagan_maker_state_v2';
const THEMES_STORAGE_KEY = 'bagan_maker_themes_list_v2';
const STYLE3_THEMES_STORAGE_KEY = 'bagan_maker_style3_themes_list_v1';
const UNIVERSAL_THEMES_STORAGE_KEY = 'bagan_maker_universal_themes_v1';
const ACTIVE_THEME_STORAGE_KEY = 'bagan_maker_active_universal_theme_v1';
const PROJECTS_STORAGE_KEY = 'bagan_maker_projects_v1';
const CURRENT_PROJECT_ID_KEY = 'bagan_maker_current_project_id_v1';
const UI_THEME_KEY = 'bagan_maker_ui_theme';

/** Gabungkan Style5Data tersimpan dengan default agar aman terhadap versi lama. */
function normalizeStyle5Data(raw: Partial<Style5Data> | undefined | null): Style5Data {
  const src = raw || {};
  return {
    ...DEFAULT_STYLE5_DATA,
    ...src,
    sidebar: { ...DEFAULT_STYLE5_DATA.sidebar, ...(src.sidebar || {}) },
    header: { ...DEFAULT_STYLE5_DATA.header, ...(src.header || {}) },
    points: Array.isArray(src.points) ? src.points : DEFAULT_STYLE5_DATA.points,
    freeElements: Array.isArray(src.freeElements) ? src.freeElements : [],
  };
}

/** Pastikan selalu ada minimal satu artboard; migrasi dari style5Data lama. */
function normalizeArtboards(
  artboards: Style5Artboard[] | undefined,
  legacyData: Partial<Style5Data> | undefined,
  activeId: string | undefined
): { artboards: Style5Artboard[]; activeId: string } {
  if (Array.isArray(artboards) && artboards.length > 0) {
    const list = artboards.map((a, i) => ({
      id: a.id || `artboard-${i + 1}`,
      name: a.name || `Artboard ${i + 1}`,
      data: normalizeStyle5Data(a.data),
    }));
    const found = list.find((a) => a.id === activeId);
    return { artboards: list, activeId: found ? found.id : list[0].id };
  }
  return {
    artboards: [
      { id: 'artboard-default', name: 'Artboard 1', data: normalizeStyle5Data(legacyData) },
    ],
    activeId: 'artboard-default',
  };
}


export default function App() {
  const [diagramStyle, setDiagramStyle] = useState<DiagramStyleType>('style1');
  const [mainTitle, setMainTitle] = useState<string>('Keuntungan saham');
  const [subBoxes, setSubBoxes] = useState<SubBoxItem[]>(DEFAULT_SUB_BOXES);
  const [colors, setColors] = useState<ColorSettings>(DEFAULT_COLORS);
  const [layout, setLayout] = useState<LayoutSettings>(DEFAULT_LAYOUT);
  const [caseSettings, setCaseSettings] = useState<CaseTransformSettings>({
    mainTitleCase: 'none',
    pillTitleCase: 'none',
    bodyCase: 'none',
    style3PillCase: 'none',
    style3QuestionCase: 'none',
    style3ChoiceCase: 'none',
    style3ExplanationCase: 'none',
    style5HeaderCase: 'none',
    style5NameCase: 'none',
    style5PillCase: 'none',
    style5DescCase: 'none',
  });
  const [style3Data, setStyle3Data] = useState<Style3QuestionData>(DEFAULT_STYLE3_DATA);
  const [style3Colors, setStyle3Colors] = useState<Style3ColorSettings>(DEFAULT_STYLE3_COLORS);
  const [style3Layout, setStyle3Layout] = useState<Style3LayoutSettings>(DEFAULT_STYLE3_LAYOUT);
  const [previewBg, setPreviewBg] = useState<'transparent' | 'white' | 'dark'>('transparent');
  const [showGuides, setShowGuides] = useState<boolean>(true);

  // Tema tampilan (chrome aplikasi): putih (default) / abu / hitam.
  // Hanya memengaruhi UI, tidak memengaruhi kanvas maupun hasil ekspor.
  const [uiTheme, setUiTheme] = useState<UiTheme>(() => {
    try {
      const saved = localStorage.getItem(UI_THEME_KEY);
      if (saved === 'abu' || saved === 'hitam' || saved === 'putih') return saved;
    } catch {
      /* abaikan */
    }
    return 'putih';
  });

  // Terapkan ke <html data-nb-theme> + simpan pilihan.
  useEffect(() => {
    document.documentElement.setAttribute('data-nb-theme', uiTheme);
    try {
      localStorage.setItem(UI_THEME_KEY, uiTheme);
    } catch {
      /* abaikan */
    }
  }, [uiTheme]);
  const [themes, setThemes] = useState<ThemePreset[]>(() => {
    try {
      const stored = localStorage.getItem(THEMES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return THEME_PRESETS;
  });
  const [style3Themes, setStyle3Themes] = useState<Style3ThemePreset[]>(() => {
    try {
      const stored = localStorage.getItem(STYLE3_THEMES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return STYLE3_THEME_PRESETS;
  });
  const [isBulkPasteOpen, setIsBulkPasteOpen] = useState(false);

  // ============ GAYA 5: SLIDE MATERI (ARTBOARDS) ============
  const [style5Artboards, setStyle5Artboards] = useState<Style5Artboard[]>(
    () => [
      { id: 'artboard-default', name: 'Artboard 1', data: DEFAULT_STYLE5_DATA },
    ]
  );
  const [activeStyle5ArtboardId, setActiveStyle5ArtboardId] = useState<string>(
    'artboard-default'
  );
  const style5Data = useMemo<Style5Data>(() => {
    const ab = style5Artboards.find((a) => a.id === activeStyle5ArtboardId);
    return ab?.data ?? style5Artboards[0]?.data ?? DEFAULT_STYLE5_DATA;
  }, [style5Artboards, activeStyle5ArtboardId]);
  const setStyle5Data = useCallback(
    (updater: Style5Data | ((prev: Style5Data) => Style5Data)) => {
      setStyle5Artboards((prev) =>
        prev.map((a) => {
          if (a.id !== activeStyle5ArtboardId) return a;
          const next =
            typeof updater === 'function'
              ? (updater as (p: Style5Data) => Style5Data)(a.data)
              : updater;
          return { ...a, data: next };
        })
      );
    },
    [activeStyle5ArtboardId]
  );
  const [shapeProfile, setShapeProfile] = useState<string>('uniform');
  const [style5Colors, setStyle5Colors] = useState<Style5ColorSettings>(
    DEFAULT_STYLE5_COLORS
  );
  const [style5Layout, setStyle5Layout] = useState<Style5LayoutSettings>(
    DEFAULT_STYLE5_LAYOUT
  );
  const [canvasDimension, setCanvasDimension] = useState<CanvasDimension>(
    DEFAULT_CANVAS_DIMENSION
  );
  const [selectedStyle5ElementId, setSelectedStyle5ElementId] = useState<
    string | null
  >(null);
  const [selectedStyle5Ids, setSelectedStyle5Ids] = useState<string[]>([]);
  const [style3ExportScope, setStyle3ExportScope] =
    useState<Style3ExportScope>('all');

  // ============ SISTEM TEMA WARNA UNIVERSAL ============
  const [universalThemes, setUniversalThemes] = useState<
    UniversalThemeToken[]
  >(() => {
    try {
      const stored = localStorage.getItem(UNIVERSAL_THEMES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return UNIVERSAL_THEME_PRESETS;
  });
  const [activeThemeId, setActiveThemeId] = useState<string>(() => {
    try {
      const stored = localStorage.getItem(ACTIVE_THEME_STORAGE_KEY);
      if (stored) return stored;
    } catch (e) {
      console.error(e);
    }
    return UNIVERSAL_THEME_PRESETS[0].id;
  });

  // ============ PROYEK ============
  const [projects, setProjects] = useState<SavedProject[]>(() => {
    try {
      const stored = localStorage.getItem(PROJECTS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(CURRENT_PROJECT_ID_KEY);
    } catch (e) {
      console.error(e);
      return null;
    }
  });

  const [isThemesOpen, setIsThemesOpen] = useState(false);
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);

  // ============ UNDO / REDO (SNAPSHOT-BASED) ============
  const undoStackRef = useRef<string[]>([]);
  const redoStackRef = useRef<string[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const lastSnapshotRef = useRef<string>(
    JSON.stringify({
      diagramStyle,
      mainTitle,
      subBoxes,
      colors,
      layout,
      caseSettings,
      style3Data,
      style3Colors,
      style3Layout,
      style5Data,
      style5Colors,
      style5Layout,
      canvasDimension,
    })
  );

  // Scalable & Draggable Canvas Viewport State
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ startX: number; startY: number; initialPanX: number; initialPanY: number }>({
    startX: 0,
    startY: 0,
    initialPanX: 0,
    initialPanY: 0,
  });

  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: 'success' | 'error';
  } | null>(null);

  const diagramRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  // Perekam diagnostik ekspor: menangkap semua pesan [PNG]/[SVG] agar
  // penyebab kegagalan bisa dikirim tanpa menyalin Console manual.
  const exportRecorder = useMemo(() => createExportRecorder(), []);
  useEffect(() => {
    exportRecorder.start();
    return () => exportRecorder.stop();
  }, [exportRecorder]);

  // Load from localStorage on initial render
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.diagramStyle) setDiagramStyle(parsed.diagramStyle);
        if (parsed.mainTitle) setMainTitle(parsed.mainTitle);
        if (Array.isArray(parsed.subBoxes) && parsed.subBoxes.length >= 2) {
          setSubBoxes(parsed.subBoxes);
        }
        if (parsed.colors) setColors({ ...DEFAULT_COLORS, ...parsed.colors });
        if (parsed.layout) setLayout({ ...DEFAULT_LAYOUT, ...parsed.layout });
        if (parsed.caseSettings) setCaseSettings(parsed.caseSettings);
        if (parsed.style3Data) setStyle3Data(parsed.style3Data);
        if (parsed.style3Colors) setStyle3Colors({ ...DEFAULT_STYLE3_COLORS, ...parsed.style3Colors });
        if (parsed.style3Layout) setStyle3Layout({ ...DEFAULT_STYLE3_LAYOUT, ...parsed.style3Layout });
        if (parsed.style5Artboards || parsed.style5Data) {
          const migrated = normalizeArtboards(
            parsed.style5Artboards,
            parsed.style5Data,
            parsed.activeStyle5ArtboardId
          );
          setStyle5Artboards(migrated.artboards);
          setActiveStyle5ArtboardId(migrated.activeId);
        }
        if (parsed.shapeProfile) setShapeProfile(parsed.shapeProfile);
        if (parsed.style5Colors)
          setStyle5Colors({ ...DEFAULT_STYLE5_COLORS, ...parsed.style5Colors });
        if (parsed.style5Layout)
          setStyle5Layout({ ...DEFAULT_STYLE5_LAYOUT, ...parsed.style5Layout });
        if (parsed.canvasDimension)
          setCanvasDimension({
            ...DEFAULT_CANVAS_DIMENSION,
            ...parsed.canvasDimension,
          });
      }
    } catch (e) {
      console.error('Gagal memuat state dari localStorage', e);
    }
  }, []);

  // Save state to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          diagramStyle,
          mainTitle,
          subBoxes,
          colors,
          layout,
          caseSettings,
          style3Data,
          style3Colors,
          style3Layout,
          style5Data,
          style5Artboards,
          activeStyle5ArtboardId,
          shapeProfile,
          style5Colors,
          style5Layout,
          canvasDimension,
        })
      );
    } catch (e) {
      console.error('Gagal menyimpan state ke localStorage', e);
    }
  }, [diagramStyle, mainTitle, subBoxes, colors, layout, caseSettings, style3Data, style3Colors, style3Layout, style5Data, style5Artboards, activeStyle5ArtboardId, shapeProfile, style5Colors, style5Layout, canvasDimension]);

  // Save themes to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(THEMES_STORAGE_KEY, JSON.stringify(themes));
    } catch (e) {
      console.error('Gagal menyimpan tema ke localStorage', e);
    }
  }, [themes]);

  // Save Style 3 themes to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STYLE3_THEMES_STORAGE_KEY, JSON.stringify(style3Themes));
    } catch (e) {
      console.error('Gagal menyimpan tema Gaya 3 ke localStorage', e);
    }
  }, [style3Themes]);

  // Save universal themes to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(
        UNIVERSAL_THEMES_STORAGE_KEY,
        JSON.stringify(universalThemes)
      );
    } catch (e) {
      console.error('Gagal menyimpan tema universal ke localStorage', e);
    }
  }, [universalThemes]);

  // Clear style5 multi-selection when not in style5
  useEffect(() => {
    if (diagramStyle !== 'style5') {
      setSelectedStyle5Ids([]);
      setSelectedStyle5ElementId(null);
    }
  }, [diagramStyle]);

  // Save active universal theme id
  useEffect(() => {
    try {
      localStorage.setItem(ACTIVE_THEME_STORAGE_KEY, activeThemeId);
    } catch (e) {
      console.error('Gagal menyimpan tema universal aktif', e);
    }
  }, [activeThemeId]);

  // Save projects & current project id
  useEffect(() => {
    try {
      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
    } catch (e) {
      console.error('Gagal menyimpan daftar proyek ke localStorage', e);
    }
  }, [projects]);

  useEffect(() => {
    try {
      if (currentProjectId) {
        localStorage.setItem(CURRENT_PROJECT_ID_KEY, currentProjectId);
      } else {
        localStorage.removeItem(CURRENT_PROJECT_ID_KEY);
      }
    } catch (e) {
      console.error('Gagal menyimpan ID proyek aktif', e);
    }
  }, [currentProjectId]);

  // Terapkan tema universal aktif ke semua gaya saat aplikasi dimuat
  const applyThemeToAll = useCallback((theme: UniversalThemeToken) => {
    if (!theme) return;
    setColors(mapUniversalThemeToColors(theme));
    setStyle3Colors(mapUniversalThemeToStyle3(theme));
    setStyle5Colors(mapUniversalThemeToStyle5(theme));
    setActiveThemeId(theme.id);
  }, []);

  useEffect(() => {
    const theme =
      universalThemes.find((t) => t.id === activeThemeId) ||
      universalThemes[0];
    if (theme) applyThemeToAll(theme);
    // Hanya saat pertama kali aplikasi dimuat
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============ UNDO / REDO HISTORY ============
  const captureSnapshot = () =>
    JSON.stringify({
      diagramStyle,
      mainTitle,
      subBoxes,
      colors,
      layout,
      caseSettings,
      style3Data,
      style3Colors,
      style3Layout,
      style5Data,
      style5Artboards,
      activeStyle5ArtboardId,
      shapeProfile,
      style5Colors,
      style5Layout,
      canvasDimension,
    });

  // Catat setiap perubahan ke undo stack
  useEffect(() => {
    const snap = captureSnapshot();
    if (snap === lastSnapshotRef.current) return;
    undoStackRef.current.push(lastSnapshotRef.current);
    if (undoStackRef.current.length > 100) undoStackRef.current.shift();
    lastSnapshotRef.current = snap;
    redoStackRef.current = [];
    setCanUndo(undoStackRef.current.length > 0);
    setCanRedo(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diagramStyle, mainTitle, subBoxes, colors, layout, caseSettings, style3Data, style3Colors, style3Layout, style5Data, style5Artboards, activeStyle5ArtboardId, shapeProfile, style5Colors, style5Layout, canvasDimension]);

  const applySnapshot = (snap: string) => {
    try {
      const s = JSON.parse(snap);
      if (s.diagramStyle) setDiagramStyle(s.diagramStyle);
      if (s.mainTitle !== undefined) setMainTitle(s.mainTitle);
      if (s.subBoxes) setSubBoxes(s.subBoxes);
      if (s.colors) setColors(s.colors);
      if (s.layout) setLayout(s.layout);
      if (s.caseSettings) setCaseSettings(s.caseSettings);
      if (s.style3Data) setStyle3Data(s.style3Data);
      if (s.style3Colors) setStyle3Colors(s.style3Colors);
      if (s.style3Layout) setStyle3Layout(s.style3Layout);
      if (Array.isArray(s.style5Artboards) && s.style5Artboards.length > 0) {
        setStyle5Artboards(s.style5Artboards);
        setActiveStyle5ArtboardId(
          s.activeStyle5ArtboardId || s.style5Artboards[0].id
        );
      } else if (s.style5Data) {
        setStyle5Artboards((prev) =>
          prev.map((a) =>
            a.id === activeStyle5ArtboardId ? { ...a, data: s.style5Data } : a
          )
        );
      }
      if (s.shapeProfile) setShapeProfile(s.shapeProfile);
      if (s.style5Colors) setStyle5Colors(s.style5Colors);
      if (s.style5Layout) setStyle5Layout(s.style5Layout);
      if (s.canvasDimension) setCanvasDimension(s.canvasDimension);
    } catch (e) {
      console.error('Gagal menerapkan snapshot undo/redo', e);
    }
  };

  const handleUndo = () => {
    if (undoStackRef.current.length === 0) return;
    redoStackRef.current.push(lastSnapshotRef.current);
    const prev = undoStackRef.current.pop();
    if (!prev) return;
    lastSnapshotRef.current = prev;
    applySnapshot(prev);
    setCanRedo(true);
    setCanUndo(undoStackRef.current.length > 0);
  };

  const handleRedo = () => {
    if (redoStackRef.current.length === 0) return;
    undoStackRef.current.push(lastSnapshotRef.current);
    const next = redoStackRef.current.pop();
    if (!next) return;
    lastSnapshotRef.current = next;
    applySnapshot(next);
    setCanUndo(true);
    setCanRedo(redoStackRef.current.length > 0);
  };

  // Pintasan keyboard Undo/Redo (Ctrl/Cmd + Z / Y)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.closest('input') ||
        target.closest('textarea') ||
        target.closest('select') ||
        target.isContentEditable
      ) {
        return;
      }
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      const key = e.key.toLowerCase();
      if (key === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if (key === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Change diagram style (perserves user text)
  const handleDiagramStyleChange = (style: DiagramStyleType) => {
    setDiagramStyle(style);
    if (style !== 'style5') {
      setSelectedStyle5Ids([]);
    }
    if (style === 'style4') {
      if (mainTitle === 'Keuntungan saham' || mainTitle === DEFAULT_STYLE2_MAIN_TITLE) {
        setMainTitle(DEFAULT_STYLE4_MAIN_TITLE);
        setSubBoxes(DEFAULT_STYLE4_SUB_BOXES);
        setColors((prev) => ({
          ...prev,
          mainBoxBg: '#7B5B9A',
          pillBg: '#7B5B9A',
        }));
      } else {
        const half = Math.ceil(subBoxes.length / 2);
        setSubBoxes((prev) =>
          prev.map((s, idx) => ({
            ...s,
            side: s.side || (idx < half ? 'left' : 'right'),
          }))
        );
      }
    }
    if (style !== 'style5') {
      setSelectedStyle5Ids([]);
      setSelectedStyle5ElementId(null);
    }
    showToast(
      style === 'style5'
        ? 'Beralih ke Gaya 5: Slide Materi (Sidebar + Foto)'
        : style === 'style4'
        ? 'Beralih ke Gaya 4: Radial (Lingkaran Tengah)'
        : style === 'style3'
        ? 'Beralih ke Gaya 3: Soal & Penjelasan'
        : style === 'style2'
        ? 'Beralih ke Gaya 2: Pill Bernomor'
        : 'Beralih ke Gaya 1: Kotak Judul Pill'
    );
  };

  // Load Style 2 default example
  const handleLoadStyle2Default = () => {
    setMainTitle(DEFAULT_STYLE2_MAIN_TITLE);
    setSubBoxes(DEFAULT_STYLE2_SUB_BOXES);
    showToast('Contoh default Gaya 2 ("Jenis-jenis reksa dana") berhasil dimuat!');
  };

  // Load Style 4 default example
  const handleLoadStyle4Default = () => {
    setMainTitle(DEFAULT_STYLE4_MAIN_TITLE);
    setSubBoxes(DEFAULT_STYLE4_SUB_BOXES);
    setColors({
      ...DEFAULT_COLORS,
      mainBoxBg: '#7B5B9A',
      pillBg: '#7B5B9A',
    });
    showToast('Contoh default Gaya 4 ("Jenis instrumen pasar modal") berhasil dimuat!');
  };

  // Load Style 3 default example
  const handleLoadStyle3Default = () => {
    setStyle3Data(DEFAULT_STYLE3_DATA);
    setStyle3Colors(DEFAULT_STYLE3_COLORS);
    setStyle3Layout(DEFAULT_STYLE3_LAYOUT);
    showToast('Contoh default Gaya 3 ("Question & Explanation") berhasil dimuat!');
  };

  // Load Style 5 default example
  const handleLoadStyle5Default = () => {
    setStyle5Data(DEFAULT_STYLE5_DATA);
    setStyle5Colors(DEFAULT_STYLE5_COLORS);
    setStyle5Layout(DEFAULT_STYLE5_LAYOUT);
    setCanvasDimension(DEFAULT_CANVAS_DIMENSION);
    showToast('Contoh default Gaya 5 ("Slide Materi") berhasil dimuat!');
  };

  // ============ ARTBOARD GAYA 5 (SLIDE) ============
  const handleSelectStyle5Artboard = (id: string) => {
    setActiveStyle5ArtboardId(id);
    setSelectedStyle5Ids([]);
    setSelectedStyle5ElementId(null);
  };

  const handleAddStyle5Artboard = () => {
    const ab = createStyle5Artboard(`Artboard ${style5Artboards.length + 1}`);
    setStyle5Artboards((prev) => [...prev, ab]);
    setActiveStyle5ArtboardId(ab.id);
    setSelectedStyle5Ids([]);
    setSelectedStyle5ElementId(null);
    showToast(`Artboard "${ab.name}" ditambahkan`);
  };

  const handleDeleteStyle5Artboard = (id: string) => {
    if (style5Artboards.length <= 1) {
      showToast('Minimal satu artboard harus ada.', 'error');
      return;
    }
    const idx = style5Artboards.findIndex((a) => a.id === id);
    const next = style5Artboards.filter((a) => a.id !== id);
    setStyle5Artboards(next);
    if (id === activeStyle5ArtboardId) {
      const fallback = next[Math.max(0, idx - 1)] || next[0];
      setActiveStyle5ArtboardId(fallback.id);
    }
    setSelectedStyle5Ids([]);
    setSelectedStyle5ElementId(null);
    showToast('Artboard dihapus');
  };

  const handleRenameStyle5Artboard = (id: string, name: string) => {
    setStyle5Artboards((prev) =>
      prev.map((a) => (a.id === id ? { ...a, name: name.trim() || a.name } : a))
    );
  };

  /** Duplikat elemen terpilih (poin + elemen bebas) ke artboard lain. */
  const handleDuplicateSelectionToArtboard = (targetId: string) => {
    if (selectedStyle5Ids.length === 0) return;
    if (targetId === activeStyle5ArtboardId) return;
    const ids = new Set(selectedStyle5Ids);
    const stamp = Date.now();
    const newIds: string[] = [];
    const clonedPoints: Style5PointItem[] = [];
    const clonedFree: Style5FreeElement[] = [];
    style5Data.points.forEach((p) => {
      if (ids.has(`point-${p.id}`)) {
        const nid = `s5-p-${stamp}-${Math.random().toString(36).slice(2, 6)}`;
        newIds.push(`point-${nid}`);
        clonedPoints.push({ ...p, id: nid });
      }
    });
    style5Data.freeElements.forEach((f) => {
      if (ids.has(`free-${f.id}`)) {
        const nid = `free-${stamp}-${Math.random().toString(36).slice(2, 6)}`;
        newIds.push(`free-${nid}`);
        clonedFree.push({ ...f, id: nid });
      }
    });
    if (newIds.length === 0) {
      showToast('Hanya poin & elemen bebas yang bisa diduplikasi antar-artboard.', 'error');
      return;
    }
    setStyle5Artboards((prev) =>
      prev.map((a) =>
        a.id === targetId
          ? {
              ...a,
              data: {
                ...a.data,
                points: [...a.data.points, ...clonedPoints],
                freeElements: [...a.data.freeElements, ...clonedFree],
              },
            }
          : a
      )
    );
    setActiveStyle5ArtboardId(targetId);
    setSelectedStyle5Ids(newIds);
    setSelectedStyle5ElementId(null);
    const name = style5Artboards.find((a) => a.id === targetId)?.name || 'artboard';
    showToast(`${newIds.length} elemen diduplikat ke "${name}"`);
  };

  // Apply change case permanently to raw text inputs
  const handleApplyCasePermanently = () => {
    if (diagramStyle === 'style5') {
      const hCase = caseSettings.style5HeaderCase || 'none';
      const nCase = caseSettings.style5NameCase || 'none';
      const pCase = caseSettings.style5PillCase || 'none';
      const dCase = caseSettings.style5DescCase || 'none';

      setStyle5Data((prev) => ({
        ...prev,
        sidebar: {
          ...prev.sidebar,
          name:
            nCase !== 'none'
              ? applyTextCaseTransform(prev.sidebar.name, nCase)
              : prev.sidebar.name,
        },
        header: {
          ...prev.header,
          title:
            hCase !== 'none'
              ? applyTextCaseTransform(prev.header.title, hCase)
              : prev.header.title,
        },
        points:
          pCase !== 'none' || dCase !== 'none'
            ? prev.points.map((pt) => ({
                ...pt,
                pillText:
                  pCase !== 'none'
                    ? applyTextCaseTransform(pt.pillText, pCase)
                    : pt.pillText,
                descriptionText:
                  dCase !== 'none'
                    ? applyTextCaseTransform(pt.descriptionText, dCase)
                    : pt.descriptionText,
              }))
            : prev.points,
      }));

      setCaseSettings((prev) => ({
        ...prev,
        style5HeaderCase: 'none',
        style5NameCase: 'none',
        style5PillCase: 'none',
        style5DescCase: 'none',
      }));
      showToast('Perubahan huruf Gaya 5 berhasil diterapkan permanen!');
      return;
    }

    if (diagramStyle === 'style3') {
      const pCase = caseSettings.style3PillCase || 'none';
      const qCase = caseSettings.style3QuestionCase || 'none';
      const cCase = caseSettings.style3ChoiceCase || 'none';
      const eCase = caseSettings.style3ExplanationCase || 'none';

      setStyle3Data((prev) => ({
        ...prev,
        questionPillLabel:
          pCase !== 'none'
            ? applyTextCaseTransform(prev.questionPillLabel, pCase)
            : prev.questionPillLabel,
        questionText:
          qCase !== 'none'
            ? applyTextCaseTransform(prev.questionText, qCase)
            : prev.questionText,
        choices:
          cCase !== 'none'
            ? prev.choices.map((c) => applyTextCaseTransform(c, cCase))
            : prev.choices,
        explanationPillLabel:
          pCase !== 'none'
            ? applyTextCaseTransform(prev.explanationPillLabel, pCase)
            : prev.explanationPillLabel,
        explanationText:
          eCase !== 'none'
            ? applyTextCaseTransform(prev.explanationText, eCase)
            : prev.explanationText,
      }));

      setCaseSettings((prev) => ({
        ...prev,
        style3PillCase: 'none',
        style3QuestionCase: 'none',
        style3ChoiceCase: 'none',
        style3ExplanationCase: 'none',
      }));
      showToast('Perubahan huruf Gaya 3 berhasil diterapkan permanen!');
      return;
    }

    const newMain = applyTextCaseTransform(mainTitle, caseSettings.mainTitleCase);
    const newSubs = subBoxes.map((s) => ({
      ...s,
      title: applyTextCaseTransform(s.title, caseSettings.pillTitleCase),
      content: applyTextCaseTransform(s.content, caseSettings.bodyCase),
    }));
    setMainTitle(newMain);
    setSubBoxes(newSubs);
    setCaseSettings((prev) => ({
      ...prev,
      mainTitleCase: 'none',
      pillTitleCase: 'none',
      bodyCase: 'none',
    }));
    showToast('Perubahan huruf berhasil diterapkan secara permanen!');
  };

  // Reset to default sample
  const handleResetToDefault = () => {
    if (diagramStyle === 'style5') {
      setStyle5Data(DEFAULT_STYLE5_DATA);
      setStyle5Colors(DEFAULT_STYLE5_COLORS);
      setStyle5Layout(DEFAULT_STYLE5_LAYOUT);
      setCanvasDimension(DEFAULT_CANVAS_DIMENSION);
      setLayout(DEFAULT_LAYOUT);
    } else if (diagramStyle === 'style3') {
      setStyle3Data(DEFAULT_STYLE3_DATA);
      setStyle3Colors(DEFAULT_STYLE3_COLORS);
      setStyle3Layout(DEFAULT_STYLE3_LAYOUT);
    } else if (diagramStyle === 'style4') {
      setMainTitle(DEFAULT_STYLE4_MAIN_TITLE);
      setSubBoxes(DEFAULT_STYLE4_SUB_BOXES);
      setColors({
        ...DEFAULT_COLORS,
        mainBoxBg: '#7B5B9A',
        pillBg: '#7B5B9A',
      });
      setLayout(DEFAULT_LAYOUT);
    } else if (diagramStyle === 'style2') {
      setMainTitle(DEFAULT_STYLE2_MAIN_TITLE);
      setSubBoxes(DEFAULT_STYLE2_SUB_BOXES);
      setColors(DEFAULT_COLORS);
      setLayout(DEFAULT_LAYOUT);
    } else {
      setMainTitle('Keuntungan saham');
      setSubBoxes(DEFAULT_SUB_BOXES);
      setColors(DEFAULT_COLORS);
      setLayout(DEFAULT_LAYOUT);
    }
    setCaseSettings({
      mainTitleCase: 'none',
      pillTitleCase: 'none',
      bodyCase: 'none',
      style3PillCase: 'none',
      style3QuestionCase: 'none',
      style3ChoiceCase: 'none',
      style3ExplanationCase: 'none',
      style5HeaderCase: 'none',
      style5NameCase: 'none',
      style5PillCase: 'none',
      style5DescCase: 'none',
    });
    setPan({ x: 0, y: 0 });
    setZoom(1);
    showToast('Bagan berhasil direset ke pengaturan awal');
  };

  // Reset canvas pan & zoom to center
  const handleResetCanvasPosition = () => {
    setPan({ x: 0, y: 0 });
    setZoom(1);
    showToast('Posisi kanvas telah ditengah');
  };

  // Canvas Pan & Drag Handlers
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.closest('input') ||
      target.closest('button') ||
      target.closest('textarea') ||
      target.closest('[draggable="true"]') ||
      target.closest('.cursor-ew-resize') ||
      target.closest('.cursor-ns-resize')
    ) {
      return;
    }

    setIsPanning(true);
    panStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialPanX: pan.x,
      initialPanY: pan.y,
    };
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    const deltaX = e.clientX - panStartRef.current.startX;
    const deltaY = e.clientY - panStartRef.current.startY;
    setPan({
      x: panStartRef.current.initialPanX + deltaX,
      y: panStartRef.current.initialPanY + deltaY,
    });
  };

  const handleCanvasMouseUp = () => {
    setIsPanning(false);
  };

  // Smooth wheel zoom and pan
  const handleCanvasWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomFactor = -e.deltaY * 0.002;
      setZoom((z) => Math.max(0.4, Math.min(2.5, Number((z + zoomFactor).toFixed(2)))));
    } else {
      setPan((p) => ({
        x: p.x - e.deltaX * 0.8,
        y: p.y - e.deltaY * 0.8,
      }));
    }
  };

  // Handle bulk paste apply
  const handleApplyBulkPaste = (newTitle: string, newSubs: SubBoxItem[]) => {
    setMainTitle(newTitle);
    setSubBoxes(newSubs);
    showToast('Teks berhasil diterapkan ke bagan!');
  };

  // Save new custom theme
  const handleSaveCustomTheme = (name: string) => {
    const newTheme: ThemePreset = {
      id: `theme-custom-${Date.now()}`,
      name,
      colors: { ...colors },
      isCustom: true,
    };
    setThemes((prev) => [newTheme, ...prev]);
    showToast(`Tema "${name}" berhasil disimpan!`);
  };

  // Edit theme (name or colors)
  const handleEditTheme = (id: string, newName: string, updateColors: boolean) => {
    setThemes((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          return {
            ...t,
            name: newName,
            ...(updateColors ? { colors: { ...colors } } : {}),
            isCustom: true,
          };
        }
        return t;
      })
    );
    showToast(`Tema "${newName}" berhasil diperbarui!`);
  };

  // Duplicate any theme (built-in or custom)
  const handleDuplicateTheme = (targetTheme: ThemePreset) => {
    const copyTheme: ThemePreset = {
      id: `theme-copy-${Date.now()}`,
      name: `${targetTheme.name} (Salinan)`,
      colors: { ...targetTheme.colors },
      isCustom: true,
    };
    setThemes((prev) => [copyTheme, ...prev]);
    showToast(`Tema "${copyTheme.name}" berhasil diduplikasi!`);
  };

  // Delete theme
  const handleDeleteTheme = (id: string) => {
    setThemes((prev) => prev.filter((t) => t.id !== id));
    showToast('Tema berhasil dihapus');
  };

  // Restore built-in themes (Gaya 1, 2, 4)
  const handleRestoreDefaultThemes = () => {
    setThemes(THEME_PRESETS);
    localStorage.removeItem(THEMES_STORAGE_KEY);
    showToast('Tema bawaan berhasil dipulihkan');
  };

  // Style 3 Themes Handlers
  const handleSaveCustomStyle3Theme = (name: string) => {
    const newTheme: Style3ThemePreset = {
      id: `theme-s3-custom-${Date.now()}`,
      name,
      colors: { ...style3Colors },
      isCustom: true,
    };
    setStyle3Themes((prev) => [newTheme, ...prev]);
    showToast(`Tema Gaya 3 "${name}" berhasil disimpan!`);
  };

  const handleEditStyle3Theme = (id: string, newName: string, updateColors: boolean) => {
    setStyle3Themes((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          return {
            ...t,
            name: newName,
            ...(updateColors ? { colors: { ...style3Colors } } : {}),
            isCustom: true,
          };
        }
        return t;
      })
    );
    showToast(`Tema Gaya 3 "${newName}" berhasil diperbarui!`);
  };

  const handleDuplicateStyle3Theme = (targetTheme: Style3ThemePreset) => {
    const copyTheme: Style3ThemePreset = {
      id: `theme-s3-copy-${Date.now()}`,
      name: `${targetTheme.name} (Salinan)`,
      colors: { ...targetTheme.colors },
      isCustom: true,
    };
    setStyle3Themes((prev) => [copyTheme, ...prev]);
    showToast(`Tema Gaya 3 "${copyTheme.name}" berhasil diduplikasi!`);
  };

  const handleDeleteStyle3Theme = (id: string) => {
    setStyle3Themes((prev) => prev.filter((t) => t.id !== id));
    showToast('Tema Gaya 3 berhasil dihapus');
  };

  const handleRestoreDefaultStyle3Themes = () => {
    setStyle3Themes(STYLE3_THEME_PRESETS);
    localStorage.removeItem(STYLE3_THEMES_STORAGE_KEY);
    showToast('Tema bawaan Gaya 3 berhasil dipulihkan');
  };

  // ============ TEMA WARNA UNIVERSAL ============
  const handleSelectUniversalTheme = (theme: UniversalThemeToken) => {
    applyThemeToAll(theme);
    showToast(`Tema "${theme.name}" diterapkan ke semua gaya!`);
  };

  const handleCreateUniversalTheme = (theme: UniversalThemeToken) => {
    const newTheme: UniversalThemeToken = {
      ...theme,
      id: `theme-universal-custom-${Date.now()}`,
      isCustom: true,
    };
    setUniversalThemes((prev) => [newTheme, ...prev]);
    showToast(`Tema "${newTheme.name}" berhasil dibuat!`);
  };

  const handleUpdateUniversalTheme = (updated: UniversalThemeToken) => {
    setUniversalThemes((prev) =>
      prev.map((t) => (t.id === updated.id ? updated : t))
    );
    showToast(`Tema "${updated.name}" berhasil diperbarui!`);
  };

  const handleDuplicateUniversalTheme = (theme: UniversalThemeToken) => {
    const copy: UniversalThemeToken = {
      ...theme,
      id: `theme-universal-copy-${Date.now()}`,
      name: `${theme.name} (Salinan)`,
      isCustom: true,
    };
    setUniversalThemes((prev) => [copy, ...prev]);
    showToast(`Tema "${copy.name}" berhasil diduplikasi!`);
  };

  const handleDeleteUniversalTheme = (id: string) => {
    setUniversalThemes((prev) => prev.filter((t) => t.id !== id));
    if (activeThemeId === id) {
      const remaining = universalThemes.filter((t) => t.id !== id);
      const fallback =
        remaining[0]?.id || UNIVERSAL_THEME_PRESETS[0].id;
      setActiveThemeId(fallback);
    }
    showToast('Tema universal berhasil dihapus');
  };

  const handleRestoreDefaultUniversalThemes = () => {
    setUniversalThemes(UNIVERSAL_THEME_PRESETS);
    setActiveThemeId(UNIVERSAL_THEME_PRESETS[0].id);
    localStorage.removeItem(UNIVERSAL_THEMES_STORAGE_KEY);
    localStorage.removeItem(ACTIVE_THEME_STORAGE_KEY);
    showToast('Tema universal bawaan berhasil dipulihkan');
  };

  const handleExportThemesJson = () => {
    try {
      const blob = new Blob([JSON.stringify(universalThemes, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'bagan-maker-tema-warna.json';
      a.click();
      URL.revokeObjectURL(url);
      showToast('Tema berhasil diekspor sebagai JSON!');
    } catch (e) {
      console.error(e);
      showToast('Gagal mengekspor tema.', 'error');
    }
  };

  const handleImportThemesJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const list = Array.isArray(parsed)
          ? parsed
          : Array.isArray(parsed.themes)
          ? parsed.themes
          : [];
        if (list.length === 0 || !list.some((t: UniversalThemeToken) => t.id && t.mainColor)) {
          throw new Error('Format JSON tema tidak dikenali');
        }
        setUniversalThemes((prev) => [
          ...list.filter((t: UniversalThemeToken) => !prev.some((p) => p.id === t.id)),
          ...prev,
        ]);
        showToast('Tema berhasil diimpor dari file JSON!');
      } catch (e) {
        console.error(e);
        showToast('File JSON tema tidak valid.', 'error');
      }
    };
    reader.readAsText(file);
  };

  // Terapkan tema universal aktif hanya ke warna Gaya 5
  const handleResetStyle5Colors = () => {
    const theme =
      universalThemes.find((t) => t.id === activeThemeId) ||
      universalThemes[0];
    if (!theme) {
      showToast('Tidak ada tema aktif untuk direset.', 'error');
      return;
    }
    setStyle5Colors(mapUniversalThemeToStyle5(theme));
    showToast('Warna Gaya 5 direset ke tema universal aktif!');
  };

  // ============ PROYEK ============
  const buildProjectSnapshot = (): Omit<SavedProject, 'id' | 'title' | 'createdAt' | 'updatedAt'> => ({
    diagramStyle,
    mainTitle,
    subBoxes,
    colors,
    layout,
    caseSettings,
    style3Data,
    style3Colors,
    style3Layout,
    style5Data,
    style5Artboards,
    activeStyle5ArtboardId,
    shapeProfile,
    style5Colors,
    style5Layout,
    canvasDimension,
  });

  const handleSaveCurrentAsNew = (title: string) => {
    const now = new Date().toISOString();
    const project: SavedProject = {
      id: `project-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: title.trim() || 'Proyek tanpa judul',
      createdAt: now,
      updatedAt: now,
      ...buildProjectSnapshot(),
    };
    setProjects((prev) => [project, ...prev]);
    setCurrentProjectId(project.id);
    showToast(`Proyek "${project.title}" berhasil disimpan!`);
  };

  const handleLoadProject = (project: SavedProject) => {
    setDiagramStyle(project.diagramStyle);
    setMainTitle(project.mainTitle);
    setSubBoxes(project.subBoxes);
    setColors(project.colors);
    setLayout(project.layout);
    setCaseSettings(project.caseSettings);
    if (project.style3Data) setStyle3Data(project.style3Data);
    if (project.style3Colors) setStyle3Colors(project.style3Colors);
    if (project.style3Layout) setStyle3Layout(project.style3Layout);
    {
      const migrated = normalizeArtboards(
        project.style5Artboards,
        project.style5Data,
        project.activeStyle5ArtboardId
      );
      setStyle5Artboards(migrated.artboards);
      setActiveStyle5ArtboardId(migrated.activeId);
    }
    if (project.shapeProfile) setShapeProfile(project.shapeProfile);
    if (project.style5Colors) setStyle5Colors(project.style5Colors);
    if (project.style5Layout) setStyle5Layout(project.style5Layout);
    if (project.canvasDimension) setCanvasDimension(project.canvasDimension);
    setCurrentProjectId(project.id);
    setSelectedStyle5ElementId(null);
    setSelectedStyle5Ids([]);
    showToast(`Proyek "${project.title}" berhasil dibuka!`);
  };

  const handleDuplicateProject = (project: SavedProject) => {
    const now = new Date().toISOString();
    const copy: SavedProject = {
      ...project,
      id: `project-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: `${project.title} (Salinan)`,
      createdAt: now,
      updatedAt: now,
    };
    setProjects((prev) => [copy, ...prev]);
    showToast(`Proyek "${copy.title}" berhasil diduplikasi!`);
  };

  const handleDeleteProject = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    if (currentProjectId === id) setCurrentProjectId(null);
    showToast('Proyek berhasil dihapus');
  };

  const handleRenameProject = (id: string, newTitle: string) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, title: newTitle.trim() || p.title, updatedAt: new Date().toISOString() }
          : p
      )
    );
    showToast('Nama proyek berhasil diubah!');
  };

  const handleExportProjectJson = (project?: SavedProject) => {
    try {
      const payload = project || {
        id: `project-${Date.now()}`,
        title: 'Proyek Bagan Maker',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...buildProjectSnapshot(),
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(payload.title || 'proyek')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-') || 'proyek-bagan-maker'}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Proyek berhasil diekspor sebagai JSON!');
    } catch (e) {
      console.error(e);
      showToast('Gagal mengekspor proyek.', 'error');
    }
  };

  const handleImportProjectJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!parsed || !parsed.diagramStyle || !Array.isArray(parsed.subBoxes)) {
          throw new Error('Format JSON proyek tidak dikenali');
        }
        const now = new Date().toISOString();
        const project: SavedProject = {
          id: parsed.id || `project-${Date.now()}`,
          title: parsed.title || 'Proyek yang diimpor',
          createdAt: parsed.createdAt || now,
          updatedAt: now,
          diagramStyle: parsed.diagramStyle,
          mainTitle: parsed.mainTitle || '',
          subBoxes: parsed.subBoxes,
          colors: parsed.colors || DEFAULT_COLORS,
          layout: parsed.layout || DEFAULT_LAYOUT,
          caseSettings: parsed.caseSettings || { ...caseSettings },
          style3Data: parsed.style3Data,
          style3Colors: parsed.style3Colors,
          style3Layout: parsed.style3Layout,
          style5Data: parsed.style5Data,
          style5Colors: parsed.style5Colors,
          style5Layout: parsed.style5Layout,
          canvasDimension: parsed.canvasDimension || DEFAULT_CANVAS_DIMENSION,
        } as SavedProject;
        setProjects((prev) => {
          if (prev.some((p) => p.id === project.id)) {
            return prev.map((p) => (p.id === project.id ? project : p));
          }
          return [project, ...prev];
        });
        showToast('Proyek berhasil diimpor dari file JSON!');
      } catch (e) {
        console.error(e);
        showToast('File JSON proyek tidak valid.', 'error');
      }
    };
    reader.readAsText(file);
  };

  /**
   * Hitung wilayah "konten saja": bounding box elemen konten di dalam
   * artboard (elemen pertama di dalam diagram-root), relatif terhadap
   * artboard, dalam px CSS. Mengembalikan undefined bila tak bisa diukur.
   */
  const computeContentCrop = (root: HTMLElement) => {
    const content = root.firstElementChild as HTMLElement | null;
    if (!content) return undefined;
    const rootRect = root.getBoundingClientRect();
    const contentRect = content.getBoundingClientRect();
    if (
      !rootRect.width ||
      !rootRect.height ||
      !contentRect.width ||
      !contentRect.height
    ) {
      return undefined;
    }
    // Koreksi bila ada transform (zoom) pada leluhur artboard.
    const sx = root.offsetWidth / rootRect.width;
    const sy = root.offsetHeight / rootRect.height;
    const rawX = (contentRect.left - rootRect.left) * sx;
    const rawY = (contentRect.top - rootRect.top) * sy;
    const x = Math.max(0, Math.min(rawX, root.offsetWidth));
    const y = Math.max(0, Math.min(rawY, root.offsetHeight));
    const width = Math.max(1, Math.min(contentRect.width * sx, root.offsetWidth - x));
    const height = Math.max(
      1,
      Math.min(contentRect.height * sy, root.offsetHeight - y)
    );
    return { x, y, width, height };
  };

  /**
   * Terjemahkan error penyimpanan berkas menjadi pesan singkat yang mudah
   * dipahami pengguna (pesan asli Chrome sangat teknis).
   */
  const describeSaveError = (err: unknown): string => {
    const name = (err as { name?: string })?.name || '';
    const message = err instanceof Error ? err.message : '';
    if (name === 'NotAllowedError' || /not allowed by the user agent/i.test(message)) {
      return 'izin tulis ditolak browser';
    }
    if (name === 'NoModificationAllowedError') {
      return 'berkas sedang dipakai program lain';
    }
    if (name === 'QuotaExceededError' || /quota/i.test(message)) {
      return 'ruang penyimpanan tidak cukup';
    }
    return message || name || 'penyebab tidak diketahui';
  };

  /**
   * Simpan rekaman diagnostik ekspor ke folder Unduhan secara otomatis.
   * Dipakai saat penyimpanan gagal / menghasilkan 0 byte, supaya bukti
   * penyebabnya bisa dikirim tanpa perlu menyalin Console secara manual.
   */
  const dumpExportDiagnostics = (label: string) => {
    try {
      const report = exportRecorder.dump();
      const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `diagnosa-ekspor-${label}.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch {
      /* diagnostik tidak boleh mengganggu ekspor */
    }
  };

  // Export handlers
  const handleDownloadPng = async (
    scale: number,
    transparent: boolean,
    area: 'artboard' | 'content' = 'artboard',
    saveAs = false
  ) => {
    const el = diagramRef.current;
    if (!el) return;
    try {
      const rawName =
        diagramStyle === 'style3'
          ? style3Data.questionPillLabel || 'question-explanation'
          : diagramStyle === 'style5'
          ? style5Data.header.title || 'slide-materi'
          : mainTitle || 'bagan';
      const sanitizedName = rawName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-');
      const cropArea =
        area === 'content' ? computeContentCrop(el) : undefined;
      const options = {
        scale,
        transparent,
        filename: sanitizedName,
        crop: cropArea,
      };

      // Opsi "pilih lokasi" (Save As): panggil dialog penyimpanan lebih dulu
      // agar masih dalam konteks gestur pengguna.
      let fileHandle: SaveFileHandle | null = null;
      let pickerSupported = true;
      /** Buat stream tulis langsung, selama transient activation masih hidup. */
      let preopenedWritable: Awaited<
        ReturnType<SaveFileHandle['createWritable']>
      > | null = null;
      if (saveAs) {
        const picker = (
          window as unknown as {
            showSaveFilePicker?: (opts: {
              suggestedName?: string;
              types?: {
                description: string;
                accept: Record<string, string[]>;
              }[];
            }) => Promise<SaveFileHandle>;
          }
        ).showSaveFilePicker;
        if (picker) {
          try {
            const pickedHandle = await picker({
              suggestedName: `${sanitizedName}-${scale}x.png`,
              types: [
                { description: 'Gambar PNG', accept: { 'image/png': ['.png'] } },
              ],
            });
            // `createWritable()` WAJIB dipanggil selama transient activation
            // masih aktif — bila ditunda sampai setelah render, Chrome menolak
            // dengan NotAllowedError ("not allowed by the user agent ... in the
            // current context"). Karena itu stream dibuka di sini juga, tepat
            // setelah dialog pemilih ditutup.
            preopenedWritable = await pickedHandle.createWritable();
            fileHandle = pickedHandle;
          } catch (pickErr) {
            if ((pickErr as { name?: string })?.name === 'AbortError') {
              return; // pengguna membatalkan dialog
            }
            // Bisa gagal karena createWritable (izin wajar ditolak) — biarkan
            // fallback unduhan mengambil alih.
            fileHandle = null;
          }
        } else {
          pickerSupported = false;
        }
      }

      if (saveAs && fileHandle && preopenedWritable) {
        try {
          await exportPngToFileHandle(
            el,
            options,
            fileHandle,
            preopenedWritable
          );
          showToast('PNG berhasil disimpan ke lokasi pilihan!');
        } catch (writeErr) {
          // Bila penyimpanan ke lokasi pilihan gagal, tetap unduh otomatis
          // agar gambar tidak hilang.
          console.error('Gagal menyimpan ke lokasi pilihan:', writeErr);
          dumpExportDiagnostics('png-gagal');
          await exportAsPng(el, options);
          showToast(
            `Gagal menyimpan ke lokasi pilihan (${describeSaveError(
              writeErr
            )}). PNG diunduh ke folder Unduhan. Laporan diagnosa juga diunduh.`,
            'error'
          );
        }
      } else {
        await exportAsPng(el, options);
        if (saveAs && !pickerSupported) {
          showToast(
            'Browser tidak mendukung pilih lokasi. PNG diunduh ke folder Unduhan.',
            'error'
          );
        } else {
          showToast(
            `Gambar PNG ${
              area === 'content' ? '(konten saja) ' : ''
            }(${scale}x) berhasil diunduh!`
          );
        }
      }
    } catch (err) {
      console.error(err);
      showToast('Gagal mengunduh gambar. Silakan coba lagi.', 'error');
    }
  };

  const handleCopyPng = async (transparent: boolean) => {
    if (!diagramRef.current) return;
    try {
      await copyToClipboardAsPng(diagramRef.current, {
        transparent,
        scale: 2,
      });
      showToast('Gambar berhasil disalin ke clipboard!');
    } catch (err) {
      console.error(err);
      showToast('Gagal menyalin gambar. Periksa izin clipboard Anda.', 'error');
      throw err;
    }
  };

  const handleDownloadSvg = async (saveAs = false) => {
    const rawName =
      diagramStyle === 'style3'
        ? style3Data.questionPillLabel || 'question-explanation'
        : diagramStyle === 'style5'
        ? style5Data.header.title || 'slide-materi'
        : mainTitle || 'bagan';
    const sanitizedName = rawName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-');

    // Dua langkah: bangun isi SVG, lalu simpan.
    const buildSvg = () =>
      exportAsSvg(
        mainTitle,
        subBoxes,
        colors,
        layout,
        sanitizedName,
        diagramStyle,
        caseSettings,
        style3Data,
        style3Colors,
        style3Layout,
        style3ExportScope,
        style5Data,
        style5Colors,
        style5Layout,
        canvasDimension,
        shapeProfile
      );

    // Opsi "pilih lokasi" (Save As): panggil dialog penyimpanan lebih dulu agar
    // masih dalam konteks gestur pengguna — sama seperti ekspor PNG.
    if (saveAs) {
      const picker = (
        window as unknown as {
          showSaveFilePicker?: (opts: {
            suggestedName?: string;
            types?: { description: string; accept: Record<string, string[]> }[];
          }) => Promise<SaveFileHandle>;
        }
      ).showSaveFilePicker;

      if (!picker) {
        downloadSvgString(buildSvg(), sanitizedName);
        showToast(
          'Browser tidak mendukung pilih lokasi. SVG diunduh ke folder Unduhan.',
          'error'
        );
        return;
      }

      let pickedHandle: SaveFileHandle | null = null;
      /** Stream tulis dibuka SEGERA, selama transient activation masih hidup. */
      let preopenedSvgWritable: Awaited<
        ReturnType<SaveFileHandle['createWritable']>
      > | null = null;
      try {
        pickedHandle = await picker({
          suggestedName: `${sanitizedName}.svg`,
          types: [SVG_FILE_TYPE],
        });
        console.info('[SVG] dialog lokasi selesai, berkas:', pickedHandle.name);
        // `createWritable()` WAJIB dipanggil selama transient activation masih
        // aktif. Bila ditunda sampai setelah buildSvg(), Chrome menolak dengan
        // NotAllowedError dan berkas pilihan tetap 0 byte.
        preopenedSvgWritable = await pickedHandle.createWritable();
        console.info('[SVG] createWritable() berhasil dibuka di dalam gestur');
      } catch (pickErr) {
        if ((pickErr as { name?: string })?.name === 'AbortError') {
          return; // pengguna membatalkan dialog
        }
        console.error('[SVG] createWritable() GAGAL:', pickErr);
        pickedHandle = null;
        preopenedSvgWritable = null;
      }

      if (pickedHandle && preopenedSvgWritable) {
        try {
          await saveSvgToFileHandle(
            buildSvg(),
            pickedHandle,
            preopenedSvgWritable
          );
          // Verifikasi akhir: pastikan berkas benar-benar terisi. Bila tidak,
          // anggap gagal (jangan tampilkan pesan "berhasil" yang menyesatkan).
          if (typeof pickedHandle.getFile === 'function') {
            const saved = await pickedHandle.getFile();
            if (saved && saved.size === 0) {
              throw new Error('berkas tetap 0 byte setelah penyimpanan');
            }
          }
          showToast('SVG berhasil disimpan ke lokasi pilihan!');
          return;
        } catch (writeErr) {
          console.error('Gagal menyimpan SVG ke lokasi pilihan:', writeErr);
          dumpExportDiagnostics('svg-gagal');
          downloadSvgString(buildSvg(), sanitizedName);
          showToast(
            `Gagal menyimpan ke lokasi pilihan (${describeSaveError(
              writeErr
            )}). SVG diunduh ke folder Unduhan. Laporan diagnosa juga diunduh.`,
            'error'
          );
          return;
        }
      }

      if (pickedHandle && !preopenedSvgWritable) {
        // Dialog memilih lokasi berhasil, tetapi stream tulisnya ditolak.
        // Jelaskan agar tidak tampak seperti "tidak terjadi apa-apa".
        console.error('[SVG] stream tulis tidak bisa dibuka — memakai unduhan');
        dumpExportDiagnostics('svg-izin-ditolak');
        downloadSvgString(buildSvg(), sanitizedName);
        showToast(
          'Tidak bisa menulis ke lokasi pilihan (izin ditolak browser). SVG diunduh ke folder Unduhan. Laporan diagnosa juga diunduh.',
          'error'
        );
        return;
      }
    }

    downloadSvgString(buildSvg(), sanitizedName);
    showToast('File vektor SVG berhasil diunduh!');
  };

  // Export satu elemen terpilih (Gaya 5) sebagai PNG transparan
  const elementIdToDomId = (id: string): string => {
    if (id === 'photo') return 'style5-photo-frame';
    if (id === 'name') return 'style5-sidebar-name';
    if (id === 'header') return 'style5-header';
    if (id.startsWith('point-')) return `style5-point-${id.slice(6)}`;
    if (id.startsWith('free-')) return `style5-free-${id.slice(5)}`;
    return id;
  };

  const handleExportSelectedElement = async () => {
    if (!selectedStyle5ElementId) return;
    const domId = elementIdToDomId(selectedStyle5ElementId);
    const source = document.getElementById(domId);
    if (!source) {
      showToast('Elemen tidak ditemukan di kanvas.', 'error');
      return;
    }
    try {
      // Klon elemen agar tidak menyertakan ring/seleksi & toolbar
      const clone = source.cloneNode(true) as HTMLElement;
      clone
        .querySelectorAll(
          '[class*="ring"], [class*="ring-"], .absolute.z-30, button, [role="toolbar"]'
        )
        .forEach((n) => n.remove());
      clone.className = String(clone.className || '')
        .split(' ')
        .filter((c) => !c.startsWith('ring') && c !== 'cursor-pointer')
        .join(' ');
      clone.style.position = 'absolute';
      clone.style.left = '0';
      clone.style.top = '0';
      clone.style.margin = '0';

      // Bungkus dalam kontainer sementara untuk mengukur kotak konten
      // (termasuk overflow).
      //
      // PENTING: kontainer TIDAK boleh `visibility: hidden` / diletakkan jauh
      // di luar layar. Saat html-to-image meraster kontainer yang disembunyikan
      // seperti itu, Chromium kadang menghasilkan PNG 0 byte (berkas kosong)
      // walaupun elemennya sendiri punya ukuran. Sebagai gantinya kontainer
      // diletakkan di dalam viewport dengan `opacity: 0` — tetap "tergambar"
      // oleh compositor, tetapi tidak terlihat dan tidak bisa diklik.
      const wrapper = document.createElement('div');
      wrapper.style.position = 'fixed';
      wrapper.style.left = '0px';
      wrapper.style.top = '0px';
      wrapper.style.opacity = '0';
      wrapper.style.pointerEvents = 'none';
      wrapper.style.zIndex = '-1';
      wrapper.style.background = 'transparent';
      wrapper.appendChild(clone);
      document.body.appendChild(wrapper);

      const els: HTMLElement[] = [clone, ...Array.from(clone.querySelectorAll('*'))] as HTMLElement[];
      const base = clone.getBoundingClientRect();
      let minX = 0;
      let minY = 0;
      let maxX = base.width;
      let maxY = base.height;
      els.forEach((el) => {
        const r = el.getBoundingClientRect();
        const rx = r.left - base.left;
        const ry = r.top - base.top;
        const right = r.right - base.left;
        const bottom = r.bottom - base.top;
        if (rx < minX) minX = rx;
        if (ry < minY) minY = ry;
        if (right > maxX) maxX = right;
        if (bottom > maxY) maxY = bottom;
      });

      wrapper.style.width = `${Math.max(1, Math.ceil(maxX - minX))}px`;
      wrapper.style.height = `${Math.max(1, Math.ceil(maxY - minY))}px`;
      clone.style.left = `${-minX}px`;
      clone.style.top = `${-minY}px`;
      // Biarkan kontainer "tergambar" (opacity 0) — jangan diubah ke visible
      // atau dipindah keluar layar, karena itu memicu PNG 0 byte.

      const rawName =
        selectedStyle5ElementId.startsWith('point-')
          ? `poin-${selectedStyle5ElementId.slice(6)}`
          : selectedStyle5ElementId.startsWith('free-')
          ? 'elemen-bebas'
          : selectedStyle5ElementId;
      const filename = `${rawName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.png`;

      await exportAsPng(wrapper, { scale: 2, transparent: true, filename });
      wrapper.remove();
      showToast('Elemen terpilih berhasil diekspor sebagai PNG transparan!');
    } catch (err) {
      console.error(err);
      showToast('Gagal mengekspor elemen terpilih.', 'error');
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && diagramStyle === 'style5') {
        setSelectedStyle5Ids([]);
        setSelectedStyle5ElementId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [diagramStyle]);

  return (
    <div className="nb-app flex flex-col h-screen w-screen overflow-hidden">
      {/* Top Header */}
      <Header
        previewBg={previewBg}
        onPreviewBgChange={setPreviewBg}
        onDownloadPng={handleDownloadPng}
        onCopyPng={handleCopyPng}
        onDownloadSvg={handleDownloadSvg}
        diagramStyle={diagramStyle}
        style3ExportScope={style3ExportScope}
        onStyle3ExportScopeChange={setStyle3ExportScope}
        onOpenThemes={() => setIsThemesOpen(true)}
        onOpenProjects={() => setIsProjectsOpen(true)}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canvasDimension={canvasDimension}
        onCanvasDimensionChange={setCanvasDimension}
        selectedElementId={selectedStyle5ElementId}
        onExportSelectedElement={handleExportSelectedElement}
        showGuides={showGuides}
        onShowGuidesChange={setShowGuides}
        uiTheme={uiTheme}
        onUiThemeChange={setUiTheme}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Left / Top: Editor Panel */}
        <EditorPanel
          diagramStyle={diagramStyle}
          onDiagramStyleChange={handleDiagramStyleChange}
          mainTitle={mainTitle}
          onMainTitleChange={setMainTitle}
          subBoxes={subBoxes}
          onSubBoxesChange={setSubBoxes}
          colors={colors}
          onColorsChange={setColors}
          layout={layout}
          onLayoutChange={setLayout}
          caseSettings={caseSettings}
          onCaseSettingsChange={setCaseSettings}
          onApplyCasePermanently={handleApplyCasePermanently}
          onOpenBulkPaste={() => setIsBulkPasteOpen(true)}
          onResetToDefault={handleResetToDefault}
          onLoadStyle2Default={handleLoadStyle2Default}
          themes={themes}
          onSaveCustomTheme={handleSaveCustomTheme}
          onEditTheme={handleEditTheme}
          onDuplicateTheme={handleDuplicateTheme}
          onDeleteTheme={handleDeleteTheme}
          onRestoreDefaultThemes={handleRestoreDefaultThemes}
          style3Themes={style3Themes}
          onSaveStyle3Theme={handleSaveCustomStyle3Theme}
          onEditStyle3Theme={handleEditStyle3Theme}
          onDuplicateStyle3Theme={handleDuplicateStyle3Theme}
          onDeleteStyle3Theme={handleDeleteStyle3Theme}
          onRestoreDefaultStyle3Themes={handleRestoreDefaultStyle3Themes}
          style3Data={style3Data}
          onStyle3DataChange={setStyle3Data}
          style3Colors={style3Colors}
          onStyle3ColorsChange={setStyle3Colors}
          style3Layout={style3Layout}
          onStyle3LayoutChange={setStyle3Layout}
          onLoadStyle3Default={handleLoadStyle3Default}
          onLoadStyle4Default={handleLoadStyle4Default}
          style5Data={style5Data}
          onStyle5DataChange={setStyle5Data}
          style5Colors={style5Colors}
          onStyle5ColorsChange={setStyle5Colors}
          style5Layout={style5Layout}
          onStyle5LayoutChange={setStyle5Layout}
          onLoadStyle5Default={handleLoadStyle5Default}
          selectedStyle5ElementId={selectedStyle5ElementId}
          onSelectStyle5Element={setSelectedStyle5ElementId}
          selectedStyle5Ids={selectedStyle5Ids}
          onSelectStyle5Ids={setSelectedStyle5Ids}
          canvasDimension={canvasDimension}
          onCanvasDimensionChange={setCanvasDimension}
          onOpenThemes={() => setIsThemesOpen(true)}
          onResetStyle5Colors={handleResetStyle5Colors}
          shapeProfile={shapeProfile}
          onShapeProfileChange={setShapeProfile}
          style5Artboards={style5Artboards}
          activeStyle5ArtboardId={activeStyle5ArtboardId}
          onSelectStyle5Artboard={handleSelectStyle5Artboard}
          onAddStyle5Artboard={handleAddStyle5Artboard}
          onDeleteStyle5Artboard={handleDeleteStyle5Artboard}
          onRenameStyle5Artboard={handleRenameStyle5Artboard}
          onDuplicateSelectionToArtboard={handleDuplicateSelectionToArtboard}
        />

        {/* Right / Center: Canvas Area with Pan & Drag Position */}
        <div
          ref={viewportRef}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
          onWheel={handleCanvasWheel}
          className={`flex-1 flex flex-col relative overflow-hidden bg-nb-beige-dark select-none ${
            isPanning ? 'cursor-grabbing' : 'cursor-grab'
          }`}
        >
          {/* Pan & Drag Instruction Tooltip Banner */}
          <div className="nb-skin nb-float absolute top-4 left-4 z-20 hidden md:flex items-center gap-2 px-3 py-1.5 text-[11px] pointer-events-none">
            <Hand className="w-3.5 h-3.5 text-nb-magenta" />
            <span>
              <strong>Tarik kanvas</strong> untuk menggeser posisi • Scroll / Ctrl+Scroll untuk zoom
            </span>
          </div>

          {/* Bar Artboard Gaya 5 (slide) */}
          {diagramStyle === 'style5' && (
            <div
              className="nb-skin nb-float absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 px-2 py-1.5 select-none"
              onMouseDown={(e) => e.stopPropagation()}
              onWheel={(e) => e.stopPropagation()}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-1 hidden sm:inline">
                Artboard
              </span>
              <div className="flex items-center gap-1 max-w-[50vw] overflow-x-auto">
                {style5Artboards.map((a) => {
                  const active = a.id === activeStyle5ArtboardId;
                  return (
                    <span
                      key={a.id}
                      className={`flex items-center gap-1 rounded-xl px-2 py-1 text-[11px] font-semibold cursor-pointer whitespace-nowrap ${
                        active
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                      title="Klik untuk pilih • Dobel klik untuk ganti nama"
                      onClick={() => handleSelectStyle5Artboard(a.id)}
                      onDoubleClick={() => {
                        const n = window.prompt('Nama artboard:', a.name);
                        if (n !== null) handleRenameStyle5Artboard(a.id, n);
                      }}
                    >
                      {a.name}
                      {style5Artboards.length > 1 && (
                        <button
                          type="button"
                          className={`nb-bare ml-0.5 leading-none ${
                            active
                              ? 'text-indigo-100 hover:text-white'
                              : 'text-slate-400 hover:text-rose-600'
                          }`}
                          title="Hapus artboard"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Hapus artboard "${a.name}"?`)) {
                              handleDeleteStyle5Artboard(a.id);
                            }
                          }}
                        >
                          ×
                        </button>
                      )}
                    </span>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={handleAddStyle5Artboard}
                className="flex items-center gap-1 rounded-xl bg-emerald-600 text-white px-2 py-1 text-[11px] font-semibold hover:bg-emerald-700 whitespace-nowrap"
                title="Tambah artboard baru"
              >
                <Plus className="w-3.5 h-3.5" /> Artboard
              </button>
            </div>
          )}

          {/* Canvas Viewport Transformed Container */}
          <div className="flex-1 w-full h-full flex items-center justify-center relative overflow-hidden">
            <div
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: 'center center',
                transition: isPanning ? 'none' : 'transform 0.08s ease-out',
              }}
            >
              <DiagramCanvas
                diagramStyle={diagramStyle}
                mainTitle={mainTitle}
                subBoxes={subBoxes}
                colors={colors}
                layout={layout}
                caseSettings={caseSettings}
                onLayoutChange={setLayout}
                onSubBoxesChange={setSubBoxes}
                diagramRef={diagramRef}
                previewBg={previewBg}
                style3Data={style3Data}
                style3Colors={style3Colors}
                style3Layout={style3Layout}
                style5Data={style5Data}
                onStyle5DataChange={setStyle5Data}
                style5Colors={style5Colors}
                style5Layout={style5Layout}
                canvasDimension={canvasDimension}
                selectedStyle5ElementId={selectedStyle5ElementId}
                onSelectStyle5Element={setSelectedStyle5ElementId}
                selectedStyle5Ids={selectedStyle5Ids}
                onSelectStyle5Ids={setSelectedStyle5Ids}
                shapeProfile={shapeProfile}
                artboardOptions={style5Artboards}
                onDuplicateSelectionToArtboard={handleDuplicateSelectionToArtboard}
                onToast={(msg) => showToast(msg)}
                viewScale={zoom}
                showGuides={showGuides}
              />
            </div>
          </div>

          {/* Floating Zoom & Canvas Controls */}
          <div className="nb-skin nb-float absolute bottom-5 right-5 z-20 flex items-center p-1 text-xs gap-1 select-none">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.4, Number((z - 0.1).toFixed(1))))}
              title="Perkecil Zoom"
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-2 font-mono font-medium text-slate-700 min-w-[48px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(2.5, Number((z + 0.1).toFixed(1))))}
              title="Perbesar Zoom"
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-slate-200 mx-0.5" />
            <button
              type="button"
              onClick={handleResetCanvasPosition}
              title="Tengahkan Posisi Kanvas"
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Maximize2 className="w-4 h-4" />
              <span className="hidden sm:inline text-[11px] font-medium pr-1">Tengah</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Paste Modal */}
      <BulkPasteModal
        isOpen={isBulkPasteOpen}
        onClose={() => setIsBulkPasteOpen(false)}
        onApply={handleApplyBulkPaste}
        diagramStyle={diagramStyle}
        style3Data={style3Data}
        onApplyStyle3={(data) => {
          setStyle3Data(data);
          showToast('Teks soal berhasil diterapkan ke bagan!');
        }}
        style5Data={style5Data}
        onApplyStyle5={(data) => {
          setStyle5Data(data);
          showToast('Teks singkat berhasil diterapkan ke bagan!');
        }}
      />

      {/* Modal Tema Warna Universal */}
      <UniversalThemesModal
        isOpen={isThemesOpen}
        onClose={() => setIsThemesOpen(false)}
        themes={universalThemes}
        activeThemeId={activeThemeId}
        onSelectTheme={handleSelectUniversalTheme}
        onUpdateTheme={handleUpdateUniversalTheme}
        onCreateTheme={handleCreateUniversalTheme}
        onDuplicateTheme={handleDuplicateUniversalTheme}
        onDeleteTheme={handleDeleteUniversalTheme}
        onRestoreDefaults={handleRestoreDefaultUniversalThemes}
        onExportThemesJson={handleExportThemesJson}
        onImportThemesJson={handleImportThemesJson}
      />

      {/* Modal Proyek Saya */}
      <ProjectModal
        isOpen={isProjectsOpen}
        onClose={() => setIsProjectsOpen(false)}
        projects={projects}
        currentProjectId={currentProjectId || undefined}
        onSaveCurrentAsNew={handleSaveCurrentAsNew}
        onLoadProject={handleLoadProject}
        onDuplicateProject={handleDuplicateProject}
        onDeleteProject={handleDeleteProject}
        onRenameProject={handleRenameProject}
        onExportProjectJson={handleExportProjectJson}
        onImportProjectJson={handleImportProjectJson}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div
            className={`nb-skin nb-toast flex items-center gap-2 px-4 py-2.5 text-xs ${
              toastMessage.type === 'success' ? 'nb-toast--success' : 'nb-toast--error'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <Check className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}
    </div>
  );
}
