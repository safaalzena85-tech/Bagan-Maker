import {
  CanvasDimension,
  ColorSettings,
  LayoutSettings,
  Style3ColorSettings,
  Style3LayoutSettings,
  Style3QuestionData,
  Style3ThemePreset,
  Style5Artboard,
  Style5ColorSettings,
  Style5Data,
  Style5FontWeight,
  Style5LayoutSettings,
  SubBoxItem,
  ThemePreset,
  UniversalThemeToken,
} from '../types';

export const DEFAULT_SUB_BOXES: SubBoxItem[] = [
  {
    id: 'sub-1',
    title: 'Capital loss',
    content: 'kondisi dimana pemilik menjual saham lebih rendah dari harga beli, sehingga pemilik mengalami kerugian',
  },
  {
    id: 'sub-2',
    title: 'Risiko likuidasi',
    content: 'Jika perusahaan bangkrut, maka pemilik saham akan kehilangan hartanya atau mendapat hak klaim terakhir terhadap aset perusahaan',
  },
  {
    id: 'sub-3',
    title: 'Tidak mendapat dividen',
    content: 'Perusahaan tidak dapat membagikan dividen jika perusahaan tersebut mengalami kerugian',
  },
];

export const DEFAULT_STYLE2_MAIN_TITLE = 'Jenis-jenis reksa dana';

export const DEFAULT_STYLE2_SUB_BOXES: SubBoxItem[] = [
  {
    id: 's2-sub-1',
    title: 'Reksa dana pasar uang',
    content: 'Reksa dana pasar uang (Money market funds)',
  },
  {
    id: 's2-sub-2',
    title: 'Reksa dana pendapatan tetap',
    content: 'Reksa dana pendapatan tetap (Fixed Income funds)',
  },
  {
    id: 's2-sub-3',
    title: 'Reksa dana saham',
    content: 'Reksa dana saham (Equity funds)',
  },
  {
    id: 's2-sub-4',
    title: 'Reksa dana campuran',
    content: 'Reksa dana campuran (Discretionary funds)',
  },
];

export const DEFAULT_STYLE4_MAIN_TITLE = 'Jenis instrumen pasar modal';

export const DEFAULT_STYLE4_SUB_BOXES: SubBoxItem[] = [
  {
    id: 's4-sub-1',
    customNumber: '1',
    title: 'Saham',
    content: 'Saham',
    side: 'left',
  },
  {
    id: 's4-sub-2',
    customNumber: '2',
    title: 'Obligasi',
    content: 'Obligasi',
    side: 'left',
  },
  {
    id: 's4-sub-3',
    customNumber: '3',
    title: 'Sukuk',
    content: 'Sukuk',
    side: 'left',
  },
  {
    id: 's4-sub-4',
    customNumber: '4',
    title: 'Reksadana',
    content: 'Reksadana',
    side: 'right',
  },
  {
    id: 's4-sub-5',
    customNumber: '5',
    title: 'Exchange Traded Fund (ETF)',
    content: 'Exchange Traded Fund (ETF)',
    side: 'right',
  },
  {
    id: 's4-sub-6',
    customNumber: '6',
    title: 'Derivatif',
    content: 'Derivatif',
    side: 'right',
  },
];

export const DEFAULT_STYLE4_8_ITEMS: SubBoxItem[] = [
  { id: 's4-8-1', customNumber: '1', title: 'Saham', content: 'Saham', side: 'left' },
  { id: 's4-8-2', customNumber: '2', title: 'Obligasi', content: 'Obligasi', side: 'left' },
  { id: 's4-8-3', customNumber: '3', title: 'Reksadana', content: 'Reksadana', side: 'left' },
  { id: 's4-8-4', customNumber: '4', title: 'Saham', content: 'Saham', side: 'left' },
  { id: 's4-8-5', customNumber: '5', title: 'Warrant', content: 'Warrant', side: 'right' },
  { id: 's4-8-6', customNumber: '6', title: 'Right', content: 'Right', side: 'right' },
  { id: 's4-8-7', customNumber: '7', title: 'Opsi/Option', content: 'Opsi/Option', side: 'right' },
  { id: 's4-8-8', customNumber: '8', title: 'Warrant', content: 'Warrant', side: 'right' },
];

export const DEFAULT_STYLE4_16_ITEMS: SubBoxItem[] = [
  { id: 's4-16-1', customNumber: '1', title: 'Saham', content: 'Saham', side: 'left' },
  { id: 's4-16-2', customNumber: '2', title: 'Obligasi', content: 'Obligasi', side: 'left' },
  { id: 's4-16-3', customNumber: '3', title: 'Reksadana', content: 'Reksadana', side: 'left' },
  { id: 's4-16-4', customNumber: '4', title: 'Sukuk Syariah', content: 'Sukuk Syariah', side: 'left' },
  { id: 's4-16-5', customNumber: '5', title: 'ETF Pasar Uang', content: 'ETF Pasar Uang', side: 'left' },
  { id: 's4-16-6', customNumber: '6', title: 'Derivatif Saham', content: 'Derivatif Saham', side: 'left' },
  { id: 's4-16-7', customNumber: '7', title: 'Kontrak Berjangka', content: 'Kontrak Berjangka', side: 'left' },
  { id: 's4-16-8', customNumber: '8', title: 'Waran Terstruktur', content: 'Waran Terstruktur', side: 'left' },
  { id: 's4-16-9', customNumber: '9', title: 'Right Issue', content: 'Right Issue', side: 'right' },
  { id: 's4-16-10', customNumber: '10', title: 'Opsi Call & Put', content: 'Opsi Call & Put', side: 'right' },
  { id: 's4-16-11', customNumber: '11', title: 'Sertifikat Deposito', content: 'Sertifikat Deposito', side: 'right' },
  { id: 's4-16-12', customNumber: '12', title: 'Surat Utang Negara', content: 'Surat Utang Negara', side: 'right' },
  { id: 's4-16-13', customNumber: '13', title: 'KIK-EBA', content: 'KIK-EBA', side: 'right' },
  { id: 's4-16-14', customNumber: '14', title: 'DIRE Properti', content: 'DIRE Properti', side: 'right' },
  { id: 's4-16-15', customNumber: '15', title: 'DINFRA Infrastruktur', content: 'DINFRA Infrastruktur', side: 'right' },
  { id: 's4-16-16', customNumber: '16', title: 'Efek Beragun Aset', content: 'Efek Beragun Aset', side: 'right' },
];

export const DEFAULT_COLORS: ColorSettings = {
  mainBoxBg: '#70548d',
  mainBoxText: '#ffffff',
  mainBoxOuterBorder: '#3a3a3a',
  mainBoxOuterBg: '#ffffff',
  pillBg: '#70548d',
  pillText: '#ffffff',
  pillBorder: '#3a3a3a',
  subBoxBg: '#f7e6cc',
  subBoxBorder: '#3a3a3a',
  subBoxText: '#2e2e2e',
  connectorColor: '#3a3a3a',
  numberCircleBg: '#ffffff',
  numberCircleBorder: '#3a3a3a',
  numberCircleText: '#2e2e2e',
};

export const DEFAULT_LAYOUT: LayoutSettings = {
  fontSizeMain: 24,
  fontSizePill: 15,
  fontSizeBody: 15,
  borderRadius: 22,
  showDoubleFrame: true,
  individualPillColor: false,
  subBoxMaxWidth: 440,
  connectorThickness: 2,
  connectorProfile: 'uniform',
  connectorDotSize: 8,
  subBoxGap: 24,
  diagramPadding: 32,
  diagramScale: 1,
  mainBoxOffsetY: 0,
  mainBoxWidth: 210,
  mainBoxMinHeight: 120,
  subBoxBorderWidth: 1,
  pillBorderWidth: 1.2,
  pillOffsetX: 24,
  showPillLabels: true,
  style2CircleSize: 42,
  style2PillPaddingY: 10,
  style2NumberingType: 'numbers',
  style2Separator: '.',
  style2StartFrom: '1',
  style2DotSpacing: 14,
  style2PillRadiusLeft: 15,
  style4CircleDiameter: 220,
  style4ArcDistance: 20,
  style4DotSize: 14,
  style4ConnectorLength: 46,
  style4CircleBoxSize: 42,
  style4PillPaddingY: 9,
  style4NumberingType: 'none',
  style4Separator: '.',
  style4StartFrom: '1',
};

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'radial-ungu',
    name: 'Ungu Radial (Gaya 4 Default)',
    colors: {
      mainBoxBg: '#7B5B9A',
      mainBoxText: '#ffffff',
      mainBoxOuterBorder: '#5a3e78',
      mainBoxOuterBg: '#ffffff',
      pillBg: '#7B5B9A',
      pillText: '#ffffff',
      pillBorder: '#5a3e78',
      subBoxBg: '#f5effa',
      subBoxBorder: '#5a3e78',
      subBoxText: '#2e2e2e',
      connectorColor: '#3a3a3a',
      numberCircleBg: '#ffffff',
      numberCircleBorder: '#3a3a3a',
      numberCircleText: '#2e2e2e',
    },
  },
  {
    id: 'ungu-krem',
    name: 'Ungu - Krem (Default)',
    colors: {
      mainBoxBg: '#70548d',
      mainBoxText: '#ffffff',
      mainBoxOuterBorder: '#3a3a3a',
      mainBoxOuterBg: '#ffffff',
      pillBg: '#70548d',
      pillText: '#ffffff',
      pillBorder: '#3a3a3a',
      subBoxBg: '#f7e6cc',
      subBoxBorder: '#3a3a3a',
      subBoxText: '#2e2e2e',
      connectorColor: '#3a3a3a',
      numberCircleBg: '#ffffff',
      numberCircleBorder: '#3a3a3a',
      numberCircleText: '#2e2e2e',
    },
  },
  {
    id: 'biru-putih',
    name: 'Biru Modern - Putih',
    colors: {
      mainBoxBg: '#2563eb',
      mainBoxText: '#ffffff',
      mainBoxOuterBorder: '#1e40af',
      mainBoxOuterBg: '#ffffff',
      pillBg: '#2563eb',
      pillText: '#ffffff',
      pillBorder: '#1e3a8a',
      subBoxBg: '#eff6ff',
      subBoxBorder: '#1e3a8a',
      subBoxText: '#1e293b',
      connectorColor: '#1e3a8a',
      numberCircleBg: '#ffffff',
      numberCircleBorder: '#1e3a8a',
      numberCircleText: '#1e3a8a',
    },
  },
  {
    id: 'hijau-krem',
    name: 'Hijau Sage - Krem',
    colors: {
      mainBoxBg: '#2e6f5e',
      mainBoxText: '#ffffff',
      mainBoxOuterBorder: '#1f4e41',
      mainBoxOuterBg: '#ffffff',
      pillBg: '#2e6f5e',
      pillText: '#ffffff',
      pillBorder: '#234439',
      subBoxBg: '#f6f7eb',
      subBoxBorder: '#234439',
      subBoxText: '#20322b',
      connectorColor: '#234439',
      numberCircleBg: '#ffffff',
      numberCircleBorder: '#234439',
      numberCircleText: '#234439',
    },
  },
  {
    id: 'terracotta-abu',
    name: 'Oranye Terracotta - Abu',
    colors: {
      mainBoxBg: '#c2410c',
      mainBoxText: '#ffffff',
      mainBoxOuterBorder: '#7c2d12',
      mainBoxOuterBg: '#ffffff',
      pillBg: '#c2410c',
      pillText: '#ffffff',
      pillBorder: '#431407',
      subBoxBg: '#fef2f2',
      subBoxBorder: '#431407',
      subBoxText: '#292524',
      connectorColor: '#431407',
      numberCircleBg: '#ffffff',
      numberCircleBorder: '#431407',
      numberCircleText: '#431407',
    },
  },
  {
    id: 'teal-peach',
    name: 'Teal & Peach',
    colors: {
      mainBoxBg: '#0f766e',
      mainBoxText: '#ffffff',
      mainBoxOuterBorder: '#115e59',
      mainBoxOuterBg: '#ffffff',
      pillBg: '#0f766e',
      pillText: '#ffffff',
      pillBorder: '#134e4a',
      subBoxBg: '#fff7ed',
      subBoxBorder: '#134e4a',
      subBoxText: '#292524',
      connectorColor: '#134e4a',
      numberCircleBg: '#ffffff',
      numberCircleBorder: '#134e4a',
      numberCircleText: '#134e4a',
    },
  },
  {
    id: 'dark-indigo',
    name: 'Dark Mode - Indigo',
    colors: {
      mainBoxBg: '#6366f1',
      mainBoxText: '#ffffff',
      mainBoxOuterBorder: '#818cf8',
      mainBoxOuterBg: '#0f172a',
      pillBg: '#6366f1',
      pillText: '#ffffff',
      pillBorder: '#475569',
      subBoxBg: '#1e293b',
      subBoxBorder: '#475569',
      subBoxText: '#f1f5f9',
      connectorColor: '#94a3b8',
      numberCircleBg: '#0f172a',
      numberCircleBorder: '#818cf8',
      numberCircleText: '#ffffff',
    },
  },
  {
    id: 'monokrom',
    name: 'Monokrom Elegan',
    colors: {
      mainBoxBg: '#18181b',
      mainBoxText: '#ffffff',
      mainBoxOuterBorder: '#52525b',
      mainBoxOuterBg: '#ffffff',
      pillBg: '#27272a',
      pillText: '#ffffff',
      pillBorder: '#27272a',
      subBoxBg: '#fafafa',
      subBoxBorder: '#27272a',
      subBoxText: '#18181b',
      connectorColor: '#18181b',
      numberCircleBg: '#ffffff',
      numberCircleBorder: '#18181b',
      numberCircleText: '#18181b',
    },
  },
];

export const DEFAULT_STYLE3_DATA: Style3QuestionData = {
  questionPillLabel: 'Question No. 2',
  questionText: 'She speaks as if she ___ the queen.',
  choices: ['is', 'was', 'were', 'had been'],
  choiceNumberingType: 'letters-upper',
  choiceSeparator: '.',
  showCorrectAnswer: false,
  correctAnswerIndex: 2,
  showImageBox: true,
  imageUrl: '',
  imageFit: 'contain',
  showExplanation: true,
  explanationPillLabel: 'Explanation :',
  explanationText:
    '"As if" digunakan untuk menunjukkan situasi yang tidak nyata atau imajiner. Karena subjeknya adalah "she", maka digunakan "were" sesuai aturan subjunctive. Ingat bahwa pada kalimat pengandaian dengan if conditional dan subjunctive, kita tidak menggunakan kata "was", melainkan "were".',
};

export const DEFAULT_STYLE3_COLORS: Style3ColorSettings = {
  questionBoxBg: '#F7E6CC',
  questionBoxBorder: '#3a3a3a',
  questionPillBg: '#5B5BA3',
  questionPillText: '#ffffff',
  questionTextColor: '#1e1e24',
  choiceTextColor: '#2d2d34',
  blankLineColor: '#1e1e24',
  correctAnswerHighlightBg: '#dcfce7',
  correctAnswerHighlightText: '#166534',
  explanationBoxBg: '#F7E6CC',
  explanationBoxBorder: '#3a3a3a',
  explanationPillBg: '#5B5BA3',
  explanationPillText: '#ffffff',
  explanationTextColor: '#2d2d34',
};

export const DEFAULT_STYLE3_LAYOUT: Style3LayoutSettings = {
  totalWidth: 860,
  borderRadius: 18,
  fontSizePill: 15,
  fontSizeQuestionPill: 15,
  fontSizeExplanationPill: 15,
  fontSizeQuestion: 19,
  fontSizeChoice: 16,
  fontSizeExplanation: 15,
  questionFontWeight: 'bold',
  choiceSpacing: 10,
  boxesGap: 30,
  imageBoxWidth: 240,
  imageBoxHeight: 180,
  matchExplanationWidth: true,
};

export const STYLE3_THEME_PRESETS: Style3ThemePreset[] = [
  {
    id: 's3-biru-ungu-krem',
    name: 'Biru-Ungu + Krem (Default)',
    colors: {
      questionBoxBg: '#F7E6CC',
      questionBoxBorder: '#3a3a3a',
      questionPillBg: '#5B5BA3',
      questionPillText: '#ffffff',
      questionTextColor: '#1e1e24',
      choiceTextColor: '#2d2d34',
      blankLineColor: '#1e1e24',
      correctAnswerHighlightBg: '#dcfce7',
      correctAnswerHighlightText: '#166534',
      explanationBoxBg: '#F7E6CC',
      explanationBoxBorder: '#3a3a3a',
      explanationPillBg: '#5B5BA3',
      explanationPillText: '#ffffff',
      explanationTextColor: '#2d2d34',
    },
  },
  {
    id: 's3-ungu-krem',
    name: 'Ungu + Krem',
    colors: {
      questionBoxBg: '#F7E6CC',
      questionBoxBorder: '#3a3a3a',
      questionPillBg: '#70548d',
      questionPillText: '#ffffff',
      questionTextColor: '#2e2e2e',
      choiceTextColor: '#2e2e2e',
      blankLineColor: '#2e2e2e',
      correctAnswerHighlightBg: '#fef3c7',
      correctAnswerHighlightText: '#92400e',
      explanationBoxBg: '#F7E6CC',
      explanationBoxBorder: '#3a3a3a',
      explanationPillBg: '#70548d',
      explanationPillText: '#ffffff',
      explanationTextColor: '#2e2e2e',
    },
  },
  {
    id: 's3-hijau-krem',
    name: 'Hijau Sage + Krem',
    colors: {
      questionBoxBg: '#f6f7eb',
      questionBoxBorder: '#234439',
      questionPillBg: '#2e6f5e',
      questionPillText: '#ffffff',
      questionTextColor: '#20322b',
      choiceTextColor: '#20322b',
      blankLineColor: '#20322b',
      correctAnswerHighlightBg: '#d1fae5',
      correctAnswerHighlightText: '#065f46',
      explanationBoxBg: '#f6f7eb',
      explanationBoxBorder: '#234439',
      explanationPillBg: '#2e6f5e',
      explanationPillText: '#ffffff',
      explanationTextColor: '#20322b',
    },
  },
  {
    id: 's3-biru-putih',
    name: 'Biru Modern + Putih',
    colors: {
      questionBoxBg: '#eff6ff',
      questionBoxBorder: '#1e3a8a',
      questionPillBg: '#2563eb',
      questionPillText: '#ffffff',
      questionTextColor: '#1e293b',
      choiceTextColor: '#1e293b',
      blankLineColor: '#1e293b',
      correctAnswerHighlightBg: '#dbeafe',
      correctAnswerHighlightText: '#1e40af',
      explanationBoxBg: '#eff6ff',
      explanationBoxBorder: '#1e3a8a',
      explanationPillBg: '#2563eb',
      explanationPillText: '#ffffff',
      explanationTextColor: '#1e293b',
    },
  },
  {
    id: 's3-oranye-abu',
    name: 'Oranye Terracotta + Abu',
    colors: {
      questionBoxBg: '#fef2f2',
      questionBoxBorder: '#431407',
      questionPillBg: '#c2410c',
      questionPillText: '#ffffff',
      questionTextColor: '#292524',
      choiceTextColor: '#292524',
      blankLineColor: '#292524',
      correctAnswerHighlightBg: '#ffedd5',
      correctAnswerHighlightText: '#9a3412',
      explanationBoxBg: '#fef2f2',
      explanationBoxBorder: '#431407',
      explanationPillBg: '#c2410c',
      explanationPillText: '#ffffff',
      explanationTextColor: '#292524',
    },
  },
];

// ========================================================
// PRESET UKURAN KANVAS
// ========================================================
export const CANVAS_PRESETS: { [key: string]: CanvasDimension } = {
  '16:9': {
    preset: '16:9',
    width: 1920,
    height: 1080,
    label: '16:9 Slide / YouTube (1920 × 1080)',
  },
  '1:1': {
    preset: '1:1',
    width: 1080,
    height: 1080,
    label: '1:1 Persegi / Instagram Feed (1080 × 1080)',
  },
  '9:16': {
    preset: '9:16',
    width: 1080,
    height: 1920,
    label: '9:16 Story / Reels / TikTok (1080 × 1920)',
  },
  custom: {
    preset: 'custom',
    width: 1920,
    height: 1080,
    label: 'Ukuran Kustom',
  },
};

export const DEFAULT_CANVAS_DIMENSION: CanvasDimension = CANVAS_PRESETS['16:9'];

// ========================================================
// DATA & PRESETS GAYA 5: SLIDE MATERI (SIDEBAR + FOTO)
// ========================================================
export const DEFAULT_STYLE5_DATA: Style5Data = {
  sidebar: {
    show: true,
    widthPercent: 16,
    showPhoto: true,
    photoUrl: '',
    photoPanX: 0,
    photoPanY: 0,
    photoZoom: 1,
    showName: true,
    name: 'Peter Burke',
  },
  header: {
    show: true,
    number: '03',
    title: 'Hubungan antara Ilmu Sejarah dan Ilmu Sosial',
    showNumberBox: true,
  },
  points: [
    {
      id: 's5-p1',
      number: '01',
      pillText: 'Periode pertama : Sebelum abad ke-19',
      descriptionText:
        'Ketika abad pencerahan (age of enlightenment), hubungan antara sejarawan ilmuwan sosial saling mendukung.',
      mode: 'both',
      hideNumberBox: false,
    },
    {
      id: 's5-p2',
      number: '02',
      pillText: 'Periode kedua : Ketika abad ke-19',
      descriptionText:
        'Masing-masing disiplin ilmu memfokuskan dan mempertahankan disiplin ilmunya masing-masing, termasuk ilmu sejarah.',
      mode: 'both',
      hideNumberBox: false,
    },
  ],
  freeElements: [],
  numberingType: '01',
  startFrom: '1',
};

export const DEFAULT_STYLE5_COLORS: Style5ColorSettings = {
  mainColor: '#5558A0',
  mainColorDark: '#3E4078',
  accentPillBg: '#F7E6CC',
  accentPillText: '#2E2E2E',
  descriptionBoxBg: '#FFFFFF',
  descriptionBoxText: '#2E2E2E',
  borderColor: '#3A3A3A',
  numberBoxBg: '#FFFFFF',
  headerNumberText: '#2E2E2E',
  pointNumberText: '#5558A0',
  canvasBg: 'transparent',
};

export const DEFAULT_STYLE5_LAYOUT: Style5LayoutSettings = {
  fontSizeHeader: 26,
  fontSizeName: 16,
  fontSizePill: 18,
  fontSizeDesc: 16,
  borderRadius: 18,
  pointsGap: 24,
  photoSize: 180,
  sidebarWidthPercent: 16,
  fontWeightHeader: 'bold',
  fontWeightName: 'semibold',
  fontWeightPill: 'regular',
  fontWeightDesc: 'regular',
};

export function createStyle5Artboard(
  name?: string,
  data?: Style5Data
): Style5Artboard {
  artboardSeq += 1;
  return {
    id: `artboard-${Date.now().toString(36)}-${artboardSeq}`,
    name: name || `Artboard ${artboardSeq}`,
    data: JSON.parse(JSON.stringify(data || DEFAULT_STYLE5_DATA)),
  };
}

let artboardSeq = 0;

export const STYLE5_FONT_WEIGHT_OPTIONS: {
  value: Style5FontWeight;
  label: string;
  value4: number;
}[] = [
  { value: 'regular', label: 'Regular (400)', value4: 400 },
  { value: 'medium', label: 'Medium (500)', value4: 500 },
  { value: 'semibold', label: 'SemiBold (600)', value4: 600 },
  { value: 'bold', label: 'Bold (700)', value4: 700 },
];

export function style5WeightToNumber(
  weight: Style5FontWeight | undefined,
  fallback: number = 400
): number {
  const found = STYLE5_FONT_WEIGHT_OPTIONS.find((w) => w.value === weight);
  return found ? found.value4 : fallback;
}

// ========================================================
// SISTEM TEMA WARNA UNIVERSAL (UNTUK SEMUA GAYA)
// ========================================================
export const UNIVERSAL_THEME_PRESETS: UniversalThemeToken[] = [
  {
    id: 'theme-biru-ungu-krem',
    name: 'Biru-Ungu + Krem (Default Gaya 5)',
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
  },
  {
    id: 'theme-ungu-krem',
    name: 'Ungu + Krem (Default Gaya 1 & 4)',
    mainColor: '#70548d',
    mainColorDark: '#503868',
    accentColor: '#F7E6CC',
    subBoxBg: '#F7E6CC',
    descriptionBoxBg: '#FFFFFF',
    borderColor: '#3A3A3A',
    lightTextColor: '#FFFFFF',
    darkTextColor: '#2E2E2E',
    numberColor: '#70548d',
    connectorColor: '#3A3A3A',
    canvasBg: 'transparent',
  },
  {
    id: 'theme-biru-putih',
    name: 'Biru Modern + Putih',
    mainColor: '#2563eb',
    mainColorDark: '#1e40af',
    accentColor: '#dbeafe',
    subBoxBg: '#eff6ff',
    descriptionBoxBg: '#FFFFFF',
    borderColor: '#1e3a8a',
    lightTextColor: '#FFFFFF',
    darkTextColor: '#1e293b',
    numberColor: '#2563eb',
    connectorColor: '#1e3a8a',
    canvasBg: 'transparent',
  },
  {
    id: 'theme-hijau-krem',
    name: 'Hijau Sage + Krem',
    mainColor: '#2e6f5e',
    mainColorDark: '#1d483d',
    accentColor: '#f6f7eb',
    subBoxBg: '#f6f7eb',
    descriptionBoxBg: '#FFFFFF',
    borderColor: '#234439',
    lightTextColor: '#FFFFFF',
    darkTextColor: '#20322b',
    numberColor: '#2e6f5e',
    connectorColor: '#234439',
    canvasBg: 'transparent',
  },
  {
    id: 'theme-oranye-abu',
    name: 'Oranye Terracotta + Abu',
    mainColor: '#c2410c',
    mainColorDark: '#7c2d12',
    accentColor: '#ffedd5',
    subBoxBg: '#fef2f2',
    descriptionBoxBg: '#FFFFFF',
    borderColor: '#431407',
    lightTextColor: '#FFFFFF',
    darkTextColor: '#292524',
    numberColor: '#c2410c',
    connectorColor: '#431407',
    canvasBg: 'transparent',
  },
  {
    id: 'theme-merah-marun',
    name: 'Merah Marun Mewah',
    mainColor: '#881337',
    mainColorDark: '#4c0519',
    accentColor: '#ffe4e6',
    subBoxBg: '#fff1f2',
    descriptionBoxBg: '#FFFFFF',
    borderColor: '#4c0519',
    lightTextColor: '#FFFFFF',
    darkTextColor: '#1f2937',
    numberColor: '#881337',
    connectorColor: '#4c0519',
    canvasBg: 'transparent',
  },
  {
    id: 'theme-dark-indigo',
    name: 'Dark Mode - Indigo',
    mainColor: '#6366f1',
    mainColorDark: '#4338ca',
    accentColor: '#312e81',
    subBoxBg: '#1e293b',
    descriptionBoxBg: '#0f172a',
    borderColor: '#818cf8',
    lightTextColor: '#FFFFFF',
    darkTextColor: '#f1f5f9',
    numberColor: '#818cf8',
    connectorColor: '#94a3b8',
    canvasBg: '#090d16',
  },
  {
    id: 'theme-monokrom',
    name: 'Monokrom Elegan',
    mainColor: '#18181b',
    mainColorDark: '#09090b',
    accentColor: '#e4e4e7',
    subBoxBg: '#f4f4f5',
    descriptionBoxBg: '#FFFFFF',
    borderColor: '#27272a',
    lightTextColor: '#FFFFFF',
    darkTextColor: '#18181b',
    numberColor: '#18181b',
    connectorColor: '#18181b',
    canvasBg: 'transparent',
  },
];

export function mapUniversalThemeToColors(theme: UniversalThemeToken): ColorSettings {
  return {
    mainBoxBg: theme.mainColor,
    mainBoxText: theme.lightTextColor,
    mainBoxOuterBorder: theme.borderColor,
    mainBoxOuterBg: theme.canvasBg,
    pillBg: theme.mainColor,
    pillText: theme.lightTextColor,
    pillBorder: theme.borderColor,
    subBoxBg: theme.subBoxBg,
    subBoxBorder: theme.borderColor,
    subBoxText: theme.darkTextColor,
    connectorColor: theme.connectorColor,
    numberCircleBg: theme.descriptionBoxBg,
    numberCircleBorder: theme.borderColor,
    numberCircleText: theme.numberColor,
  };
}

export function mapUniversalThemeToStyle3(theme: UniversalThemeToken): Style3ColorSettings {
  return {
    questionBoxBg: theme.subBoxBg,
    questionBoxBorder: theme.borderColor,
    questionPillBg: theme.mainColor,
    questionPillText: theme.lightTextColor,
    questionTextColor: theme.darkTextColor,
    choiceTextColor: theme.darkTextColor,
    blankLineColor: theme.darkTextColor,
    correctAnswerHighlightBg: '#dcfce7',
    correctAnswerHighlightText: '#166534',
    explanationBoxBg: theme.subBoxBg,
    explanationBoxBorder: theme.borderColor,
    explanationPillBg: theme.mainColor,
    explanationPillText: theme.lightTextColor,
    explanationTextColor: theme.darkTextColor,
  };
}

export function mapUniversalThemeToStyle5(theme: UniversalThemeToken): Style5ColorSettings {
  return {
    mainColor: theme.mainColor,
    mainColorDark: theme.mainColorDark || theme.mainColor,
    accentPillBg: theme.accentColor,
    accentPillText: theme.darkTextColor,
    descriptionBoxBg: theme.descriptionBoxBg,
    descriptionBoxText: theme.darkTextColor,
    borderColor: theme.borderColor,
    numberBoxBg: theme.descriptionBoxBg,
    headerNumberText: theme.darkTextColor,
    pointNumberText: theme.mainColor,
    canvasBg: theme.canvasBg,
  };
}

