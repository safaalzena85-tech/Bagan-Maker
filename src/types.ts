export type DiagramStyleType = 'style1' | 'style2' | 'style3' | 'style4' | 'style5';

export type NumberingType =
  | 'numbers'
  | 'letters-upper'
  | 'letters-lower'
  | 'roman'
  | 'none';

export type NumberingSeparator = '.' | ')' | 'none';

export type ChoiceNumberingType =
  | 'letters-upper'
  | 'letters-lower'
  | 'numbers'
  | 'roman'
  | 'dot'
  | 'none';

export type ChoiceSeparator = '.' | ')' | 'none';

export type FontWeightOption = 'regular' | 'medium' | 'bold';

export type ImageFitOption = 'contain' | 'cover';

export type Style3ExportScope = 'all' | 'question-only' | 'explanation-only';

/**
 * Tema tampilan (chrome aplikasi). Hanya memengaruhi UI, bukan kanvas/diagram.
 * Dipasang sebagai <html data-nb-theme="...">.
 */
export type UiTheme = 'putih' | 'abu' | 'hitam';

export type TextCaseType =
  | 'none'
  | 'upper'
  | 'lower'
  | 'title'
  | 'sentence'
  | 'toggle';

export interface CaseTransformSettings {
  mainTitleCase: TextCaseType;
  pillTitleCase: TextCaseType;
  bodyCase: TextCaseType;
  // Style 3 specific cases
  style3PillCase?: TextCaseType;
  style3QuestionCase?: TextCaseType;
  style3ChoiceCase?: TextCaseType;
  style3ExplanationCase?: TextCaseType;
  // Style 5 specific cases
  style5HeaderCase?: TextCaseType;
  style5NameCase?: TextCaseType;
  style5PillCase?: TextCaseType;
  style5DescCase?: TextCaseType;
}

export interface SubBoxItem {
  id: string;
  title: string;
  content: string;
  customPillColor?: string;
  hidePill?: boolean;
  customNumber?: string;
  side?: 'left' | 'right' | 'auto';
}

export interface ColorSettings {
  mainBoxBg: string;
  mainBoxText: string;
  mainBoxOuterBorder: string;
  mainBoxOuterBg: string;
  pillBg: string;
  pillText: string;
  pillBorder: string;
  subBoxBg: string;
  subBoxBorder: string;
  subBoxText: string;
  connectorColor: string;
  // Style 2: Number Circle Colors
  numberCircleBg: string;
  numberCircleBorder: string;
  numberCircleText: string;
}

export interface Style3QuestionData {
  id?: string;
  showQuestionBox?: boolean;
  questionPillLabel: string;
  questionText: string;
  choices: string[];
  choiceNumberingType: ChoiceNumberingType;
  choiceSeparator: ChoiceSeparator;
  showCorrectAnswer: boolean;
  correctAnswerIndex: number;
  showImageBox: boolean;
  imageUrl?: string;
  imageFit: ImageFitOption;
  showExplanation: boolean;
  explanationPillLabel: string;
  explanationText: string;
}

export interface Style3ColorSettings {
  questionBoxBg: string;
  questionBoxBorder: string;
  questionPillBg: string;
  questionPillText: string;
  questionTextColor: string;
  choiceTextColor: string;
  blankLineColor: string;
  correctAnswerHighlightBg: string;
  correctAnswerHighlightText: string;
  explanationBoxBg: string;
  explanationBoxBorder: string;
  explanationPillBg: string;
  explanationPillText: string;
  explanationTextColor: string;
}

export interface Style3LayoutSettings {
  totalWidth: number;
  borderRadius: number;
  fontSizePill: number;
  fontSizeQuestionPill?: number;
  fontSizeExplanationPill?: number;
  fontSizeQuestion: number;
  fontSizeChoice: number;
  fontSizeExplanation: number;
  questionFontWeight: FontWeightOption;
  choiceSpacing: number;
  boxesGap: number;
  imageBoxWidth: number;
  imageBoxHeight: number;
  matchExplanationWidth: boolean;
}

export interface LayoutSettings {
  fontSizeMain: number;
  fontSizePill: number;
  fontSizeBody: number;
  borderRadius: number;
  showDoubleFrame: boolean;
  individualPillColor: boolean;
  subBoxMaxWidth: number;
  connectorThickness: number;
  /** Profil stroke (lebar variabel) untuk garis connector, lihat src/utils/strokeProfile.ts */
  connectorProfile?: string;
  connectorDotSize: number;
  subBoxGap: number;
  diagramPadding: number;
  diagramScale: number;
  mainBoxOffsetY: number;
  mainBoxWidth: number;
  mainBoxMinHeight: number;
  subBoxBorderWidth: number;
  pillBorderWidth: number;
  pillOffsetX: number;
  showPillLabels: boolean;
  // Style 2 Specific Layout
  style2CircleSize: number;
  style2PillPaddingY: number;
  style2NumberingType: NumberingType;
  style2Separator: NumberingSeparator;
  style2StartFrom: string;
  style2DotSpacing: number;
  style2PillRadiusLeft: number;
  // Style 4 Specific Layout
  style4CircleDiameter?: number;
  style4ArcDistance?: number;
  style4DotSize?: number;
  style4ConnectorLength?: number;
  style4CircleBoxSize?: number;
  style4SubBoxGap?: number;
  style4PillPaddingY?: number;
  style4NumberingType?: NumberingType;
  style4Separator?: NumberingSeparator;
  style4StartFrom?: string;
}

export interface ThemePreset {
  id: string;
  name: string;
  colors: ColorSettings;
  isCustom?: boolean;
}

export interface Style3ThemePreset {
  id: string;
  name: string;
  colors: Style3ColorSettings;
  isCustom?: boolean;
}

export type TextCaseOption = 'sentence' | 'title' | 'upper' | 'lower';

// ========================================================
// CANVAS DIMENSION & PRESET TYPES
// ========================================================
export type CanvasSizePreset = '16:9' | '1:1' | '9:16' | 'custom';

export interface CanvasDimension {
  preset: CanvasSizePreset;
  width: number;
  height: number;
  label?: string;
}

// ========================================================
// GAYA 5: SLIDE MATERI (SIDEBAR + FOTO) DATA TYPES
// ========================================================
export type Style5NumberingType =
  | '01'
  | '1'
  | '1.'
  | 'letters-upper'
  | 'letters-lower'
  | 'roman'
  | 'none';

export type Style5PointMode = 'both' | 'pill-only' | 'desc-only';

export interface Style5PointItem {
  id: string;
  number?: string;
  pillText: string;
  descriptionText: string;
  mode: Style5PointMode;
  hideNumberBox?: boolean;
  customPillColor?: string;
  customDescBg?: string;
  customTextColor?: string;
  customBorderColor?: string;
  customFontSizePill?: number;
  customFontSizeDesc?: number;
  // Overrides posisi/ukuran bebas (opsional)
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  // Offset terpisah: geser pill saja / deskripsi saja (relatif terhadap grup)
  pillX?: number;
  pillY?: number;
  descX?: number;
  descY?: number;
  // Ukuran terpisah: skala pill / deskripsi masing-masing (opsional)
  pillWidth?: number;
  pillHeight?: number;
  descWidth?: number;
  descHeight?: number;
}

export interface Style5FreeElement {
  id: string;
  type: 'text' | 'image';
  x: number;
  y: number;
  width: number;
  height: number;
  content: string; // text content or base64 image URL
  fontSize?: number;
  fontWeight?: FontWeightOption;
  color?: string;
  bgColor?: string;
  borderColor?: string;
  borderRadius?: number;
  zIndex?: number;
}

export interface Style5Data {
  sidebar: {
    show: boolean;
    widthPercent: number; // e.g. 16
    showPhoto: boolean;
    photoUrl?: string;
    photoPanX: number; // -100 to 100
    photoPanY: number; // -100 to 100
    photoZoom: number; // 1 to 3
    showName: boolean;
    name: string;
    // Overrides posisi/ukuran bebas (opsional)
    photoX?: number;
    photoY?: number;
    photoWidth?: number;
    photoHeight?: number;
    nameX?: number;
    nameY?: number;
    nameWidth?: number;
    nameHeight?: number;
  };
  header: {
    show: boolean;
    number: string;
    title: string;
    showNumberBox: boolean;
    // Overrides posisi/ukuran bebas (opsional)
    width?: number;
    height?: number;
    x?: number;
    y?: number;
  };
  points: Style5PointItem[];
  freeElements: Style5FreeElement[];
  numberingType: Style5NumberingType;
  startFrom: string;
}

/**
 * Artboard Gaya 5 = satu slide materi lengkap. Setiap artboard menyimpan
 * datanya sendiri (sidebar/foto/header/poin/elemen bebas).
 */
export interface Style5Artboard {
  id: string;
  name: string;
  data: Style5Data;
}

export interface Style5ColorSettings {
  mainColor: string; // Sidebar & Header (#5558A0 default)
  mainColorDark: string; // Photo border (#3E4078 default)
  accentPillBg: string; // Pill Poin & Nama (#F7E6CC default)
  accentPillText: string; // Pill Text (#2E2E2E default)
  descriptionBoxBg: string; // Box Deskripsi (#FFFFFF default)
  descriptionBoxText: string; // Teks Deskripsi (#2E2E2E default)
  borderColor: string; // Garis Tepi (#3A3A3A default)
  numberBoxBg: string; // Kotak Nomor (#FFFFFF default)
  headerNumberText: string; // Angka Header (#2E2E2E default)
  pointNumberText: string; // Angka Poin (#5558A0 default)
  canvasBg: string; // Background kanvas (#FFFFFF default, or transparent)
}

export type Style5FontWeight = 'regular' | 'medium' | 'semibold' | 'bold';

export interface Style5LayoutSettings {
  fontSizeHeader: number;
  fontSizeName: number;
  fontSizePill: number;
  fontSizeDesc: number;
  borderRadius: number;
  pointsGap: number;
  photoSize: number;
  sidebarWidthPercent: number;
  fontWeightHeader?: Style5FontWeight;
  fontWeightName?: Style5FontWeight;
  fontWeightPill?: Style5FontWeight;
  fontWeightDesc?: Style5FontWeight;
}

// ========================================================
// SISTEM TEMA WARNA UNIVERSAL (UNTUK SEMUA GAYA)
// ========================================================
export interface UniversalThemeToken {
  id: string;
  name: string;
  isCustom?: boolean;
  mainColor: string; // Sidebar / Kotak Utama / Header / Lingkaran Tengah
  mainColorDark?: string; // Border foto / Border lebih gelap
  accentColor: string; // Pill / Aksen
  subBoxBg: string; // Latar Sub Box / Krem
  descriptionBoxBg: string; // Latar Box Deskripsi / Putih
  borderColor: string; // Garis Tepi
  lightTextColor: string; // Teks Terang (putih di Header/Main Box)
  darkTextColor: string; // Teks Gelap (di dalam box/pill)
  numberColor: string; // Warna Nomor
  connectorColor: string; // Warna Garis Konektor & Dot
  canvasBg: string; // Latar Kanvas
}

// ========================================================
// SISTEM SIMPAN & EDIT DOKUMEN PROYEK
// ========================================================
export interface SavedProject {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  diagramStyle: DiagramStyleType;
  canvasDimension: CanvasDimension;
  mainTitle: string;
  subBoxes: SubBoxItem[];
  colors: ColorSettings;
  layout: LayoutSettings;
  caseSettings: CaseTransformSettings;
  style3Data?: Style3QuestionData;
  style3Colors?: Style3ColorSettings;
  style3Layout?: Style3LayoutSettings;
  style5Data?: Style5Data;
  style5Colors?: Style5ColorSettings;
  style5Layout?: Style5LayoutSettings;
  /** Daftar artboard (slide) Gaya 5. Bila kosong, style5Data diperlakukan
   * sebagai satu artboard tunggal (migrasi proyek lama). */
  style5Artboards?: Style5Artboard[];
  activeStyle5ArtboardId?: string;
  /** Profil stroke global untuk semua bingkai/shape (semua gaya). */
  shapeProfile?: string;
  activeThemeId?: string;
  previewBg?: 'transparent' | 'white' | 'dark';
}
