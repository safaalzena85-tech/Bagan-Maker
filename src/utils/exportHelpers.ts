import { toBlob } from 'html-to-image';
import {
  CanvasDimension,
  CaseTransformSettings,
  ColorSettings,
  DiagramStyleType,
  LayoutSettings,
  Style3ColorSettings,
  Style3ExportScope,
  Style3LayoutSettings,
  Style3QuestionData,
  Style5ColorSettings,
  Style5Data,
  Style5LayoutSettings,
  SubBoxItem,
} from '../types';
import {
  applyTextCaseTransform,
  getStyle2ItemNumberLabel,
  getStyle3ChoicePrefix,
  getStyle5ItemNumberLabel,
} from './textCase';
import { getStrokeProfile, outlineFromSvgPath, closedOutlineFromSvgPath, roundedRectPath, circlePath } from './strokeProfile';

/**
 * Bangun path bingkai ber-lebar variabel untuk bentuk tertutup saat ekspor SVG.
 * Mengembalikan string kosong bila profil uniform (agar output lama identik).
 */
function profileShapeSvg(
  kind: 'rect' | 'pill' | 'circle',
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
  strokeWidth: number,
  color: string,
  profileId: string | undefined
): string {
  if (!profileId || profileId === 'uniform') return '';
  const sw = Math.max(0.5, strokeWidth);
  let mid: string;
  if (kind === 'circle') {
    mid = circlePath(x + w / 2, y + h / 2, Math.max(0.1, Math.min(w, h) / 2 - sw / 2));
  } else if (kind === 'pill') {
    mid = roundedRectPath(x + sw / 2, y + sw / 2, w - sw, h - sw, Math.min(w, h) / 2);
  } else {
    mid = roundedRectPath(
      x + sw / 2,
      y + sw / 2,
      w - sw,
      h - sw,
      Math.max(0, radius - sw / 2)
    );
  }
  const outline = closedOutlineFromSvgPath(mid, sw, getStrokeProfile(profileId));
  return outline
    ? `<path d="${outline}" fill="${color}" fill-rule="evenodd" stroke="none" />`
    : '';
}

/** Warna stroke: transparan/none saat profil shape aktif (border diganti path). */
function spStr(color: string, profileId: string | undefined): string {
  return profileId && profileId !== 'uniform' ? 'none' : color;
}

/** Outline profil untuk path tertutup apa pun (mis. pill path Gaya 2). */
function profileClosedPathSvg(
  d: string,
  strokeWidth: number,
  color: string,
  profileId?: string
): string {
  if (!profileId || profileId === 'uniform') return '';
  const outline = closedOutlineFromSvgPath(
    d,
    Math.max(0.5, strokeWidth),
    getStrokeProfile(profileId)
  );
  return outline
    ? `<path d="${outline}" fill="${color}" fill-rule="evenodd" stroke="none" />`
    : '';
}

/**
 * Render elemen connector untuk ekspor SVG. Bila profil "uniform"
 * (default), string elemen asli dikembalikan apa adanya agar hasil ekspor
 * Gaya 1–4 tidak berubah. Bila profil aktif, path dikonversi menjadi
 * polygon outline ber-lebar variabel w(t) lalu di-fill dengan warna stroke.
 */
function connectorStrokeSvg(
  outlineD: string,
  uniformEl: string,
  color: string,
  thickness: number,
  profileId?: string
): string {
  if (!profileId || profileId === 'uniform') return uniformEl;
  const outline = outlineFromSvgPath(outlineD, thickness, getStrokeProfile(profileId));
  return outline ? `<path d="${outline}" fill="${color}" stroke="none" />` : uniformEl;
}

/** Wilayah potong (dalam px CSS relatif ke sudut kiri-atas elemen). */
export interface ExportCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ExportOptions {
  scale: number;
  transparent: boolean;
  filename?: string;
  /**
   * Jika diisi, hasil PNG dipotong (dipotong rapat) ke wilayah ini.
   * Dipakai untuk opsi "Konten saja" (tanpa ruang kosong artboard).
   */
  crop?: ExportCrop;
}

/** Potong Blob PNG ke wilayah tertentu menggunakan canvas. */
function cropBlob(blob: Blob, crop: ExportCrop, scale: number): Promise<Blob> {
  if (!blob || blob.size === 0) {
    return Promise.reject(new Error('gambar sumber kosong (0 byte)'));
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    let settled = false;
    // Beberapa lingkungan tidak pernah memanggil onload/onerror (mis. gambar
    // gagal didekode secara diam-diam). Jangan menggantung tanpa batas.
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error('pemotongan gambar melebihi batas waktu'));
    }, 15000);
    const cleanup = () => {
      clearTimeout(timer);
      URL.revokeObjectURL(url);
    };
    img.onload = () => {
      if (settled) return;
      try {
        const cw = Math.max(1, Math.round(crop.width * scale));
        const ch = Math.max(1, Math.round(crop.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = cw;
        canvas.height = ch;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          settled = true;
          cleanup();
          reject(new Error('Canvas 2D tidak tersedia'));
          return;
        }
        ctx.drawImage(
          img,
          Math.round(crop.x * scale),
          Math.round(crop.y * scale),
          cw,
          ch,
          0,
          0,
          cw,
          ch
        );
        canvas.toBlob(
          (out) => {
            if (settled) return;
            settled = true;
            cleanup();
            if (out && out.size > 0) resolve(out);
            else reject(new Error('Gagal memotong gambar'));
          },
          'image/png'
        );
      } catch (err) {
        if (settled) return;
        settled = true;
        cleanup();
        reject(err);
      }
    };
    img.onerror = () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error('Gagal memuat gambar untuk dipotong'));
    };
    img.src = url;
  });
}

/** Tipe minimal untuk FileSystemFileHandle (Save File System Access API). */
export type SaveFileHandle = {
  /** Nama berkas yang dipilih pengguna (mis. "bagan.svg"). */
  name?: string;
  createWritable: (opts?: { keepExistingData?: boolean }) => Promise<{
    write: (data: Blob) => Promise<void>;
    close: () => Promise<void>;
    abort: () => Promise<void>;
  }>;
  /** Dipakai untuk memverifikasi isi berkas setelah ditulis. */
  getFile?: () => Promise<Blob>;
};

/**
 * Batas waktu render. Sebelumnya `toBlob` bisa MENGgantung tanpa batas
 * (mis. saat html-to-image mencoba mengunduh font Google Fonts di jaringan
 * yang membatasi). Karena dulu stream tulis dibuka lebih dulu, berkas di
 * folder pilihan tertinggal 0 byte.
 */
const RENDER_TIMEOUT_MS = 18000;
const RENDER_TIMEOUT_FALLBACK_MS = 12000;

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

/**
 * Jalur cadangan: render elemen di iframe terisolasi lewat foreignObject +
 * canvas murni.
 *
 * Iframe penting: saat SVG ber-foreignObject dirender, stylesheet dokumen ikut
 * berlaku — termasuk `@font-face` Google Fonts yang cross-origin. Itu membuat
 * canvas "tainted" sehingga toBlob gagal dan berkas jadi 0 byte. Di iframe
 * bersih (tanpa stylesheet eksternal) canvas tidak tercemar.
 */
async function renderElementToBlobViaCanvas(
  element: HTMLElement,
  scale: number,
  transparent: boolean
): Promise<Blob> {
  const width = element.offsetWidth;
  const height = element.offsetHeight;
  if (width <= 0 || height <= 0) {
    throw new Error('area bagan kosong');
  }

  // Klon agar atribut exportIgnore bisa dibuang tanpa mengubah tampilan editor.
  const clone = element.cloneNode(true) as HTMLElement;
  clone
    .querySelectorAll('[data-export-ignore="true"]')
    .forEach((n) => n.parentNode && n.parentNode.removeChild(n));
  clone.style.transform = 'none';
  clone.style.width = `${width}px`;
  clone.style.height = `${height}px`;

  const xml = new XMLSerializer().serializeToString(clone);

  // Iframe kosong: tanpa <link rel=stylesheet>, tanpa @font-face luar.
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.cssText =
    'position:fixed;left:-10000px;top:0;width:10px;height:10px;border:0;';
  document.body.appendChild(iframe);

  let url = '';
  try {
    const frameDoc = iframe.contentDocument;
    if (!frameDoc) throw new Error('iframe tidak dapat diakses');
    frameDoc.open();
    frameDoc.write(
      '<!doctype html><html><head><meta charset="utf-8"><style>' +
        'html,body{margin:0;padding:0;background:transparent;}' +
        '*{font-family:Arial,Helvetica,sans-serif;}' +
        '</style></head><body></body></html>'
    );
    frameDoc.close();

    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">` +
      `<foreignObject width="100%" height="100%">${xml}</foreignObject></svg>`;
    url = URL.createObjectURL(
      new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
    );

    const img = new Image();
    await withTimeout(
      new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('kanvas gagal dimuat sebagai gambar'));
        img.src = url;
      }),
      15000,
      'pemuatan kanvas melebihi batas waktu'
    );

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D tidak tersedia');
    if (!transparent) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    return await withTimeout(
      new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) =>
            b && b.size > 0
              ? resolve(b)
              : reject(new Error('canvas menghasilkan gambar kosong')),
          'image/png'
        );
      }),
      15000,
      'penulisan PNG melebihi batas waktu'
    );
  } finally {
    if (url) URL.revokeObjectURL(url);
    iframe.remove();
  }
}

/**
 * Render elemen ke Blob PNG.
 * Percobaan pertama menyertakan embedding font (hasil paling akurat).
 * Bila menggantung/gagal (mis. tidak bisa mengunduh font), ulangi TANPA
 * embedding font, lalu terakhir lewat foreignObject + canvas murni — supaya
 * ekspor selalu menghasilkan gambar, bukan berkas kosong.
 */
async function renderElementToBlob(
  element: HTMLElement,
  scale: number,
  transparent: boolean
): Promise<Blob> {
  // Jangan menunggu font selamanya.
  if (document.fonts) {
    try {
      await withTimeout(document.fonts.ready, 5000, 'font timeout');
    } catch {
      /* lanjutkan dengan font yang sudah tersedia */
    }
  }

  const width = element.offsetWidth;
  const height = element.offsetHeight;

  if (width <= 0 || height <= 0) {
    throw new Error('area bagan kosong — tidak ada yang bisa diekspor');
  }

  // Jaring pengaman: bila elemen (atau leluhurnya) disembunyikan dengan
  // `visibility: hidden` / `display: none` atau diletakkan jauh di luar layar,
  // sebagian build Chromium menghasilkan PNG 0 byte. Paksa elemen "tergambar"
  // selama render, lalu kembalikan gaya aslinya.
  const restore = forceRenderable(element);

  try {
    return await renderElementToBlobInner(element, scale, transparent, width, height);
  } finally {
    restore();
  }
}

/**
 * Pastikan elemen benar-benar bisa digambar saat render: buka `visibility:
 * hidden` / `display: none` pada elemen dan leluhurnya yang membungkusnya, dan
 * tarik kembali dari posisi jauh di luar layar. Mengembalikan fungsi pemulih.
 */
function forceRenderable(element: HTMLElement): () => void {
  /** Gaya asli tiap elemen (disimpan sekali per elemen, bukan per perubahan). */
  const originals = new Map<
    HTMLElement,
    { visibility: string; display: string; left: string }
  >();

  const remember = (el: HTMLElement) => {
    if (!originals.has(el)) {
      originals.set(el, {
        visibility: el.style.visibility,
        display: el.style.display,
        left: el.style.left,
      });
    }
  };

  let node: HTMLElement | null = element;
  while (node && node !== document.body) {
    const computed = getComputedStyle(node);
    const hiddenByVisibility = computed.visibility === 'hidden';
    const hiddenByDisplay = computed.display === 'none';
    // Posisi offscreen ekstrem (mis. left: -10000px) juga mencegah compositor
    // melukis elemen.
    const offscreen =
      !!node.style.left && /^-\d{4,}px$/.test(node.style.left);

    if (hiddenByVisibility || hiddenByDisplay || offscreen) {
      remember(node);
      if (hiddenByVisibility) node.style.visibility = 'visible';
      if (hiddenByDisplay) node.style.display = 'block';
      if (offscreen) node.style.left = '0px';
    }
    node = node.parentElement;
  }

  return () => {
    originals.forEach(({ visibility, display, left }, el) => {
      el.style.visibility = visibility;
      el.style.display = display;
      el.style.left = left;
    });
  };
}

async function renderElementToBlobInner(
  element: HTMLElement,
  scale: number,
  transparent: boolean,
  width: number,
  height: number
): Promise<Blob> {

  const baseOptions = {
    pixelRatio: scale,
    backgroundColor: transparent ? 'transparent' : '#ffffff',
    cacheBust: true,
    skipAutoScale: true,
    width,
    height,
    // Jangan sertakan latar pratinjau editor (grid transparansi / warna
    // pratinjau). Latar PNG murni mengikuti opsi Transparan / Putih.
    style: {
      transform: 'none',
      backgroundImage: 'none',
      backgroundColor: transparent ? 'transparent' : '#ffffff',
    },
    // Abaikan elemen panduan (mis. "area aman video") saat ekspor.
    filter: (domNode: HTMLElement) =>
      !(domNode && domNode.dataset && domNode.dataset.exportIgnore === 'true'),
  };

  const hasImage = (b: Blob | null | undefined): b is Blob => !!b && b.size > 0;

  // PENTING: `skipFonts: true` dipakai SEBAGAI DEFAULT, bukan hanya fallback.
  // Bila html-to-image menarik font dari fonts.gstatic.com (cross-origin tanpa
  // CORS), canvas bisa menjadi "tainted" dan toBlob/toDataURL gagal atau
  // menghasilkan berkas 0 byte. Font Google hanya dibutuhkan saat tipografi
  // ekspor harus persis sama; itu tidak sebanding dengan ekspor yang gagal.
  const withFonts = { ...baseOptions };
  const withoutFonts = { ...baseOptions, skipFonts: true };

  // Catat hasil tiap jalur agar penyebab kegagalan ekspor bisa dilihat di
  // Console, bukan ditebak.
  const attempts: string[] = [];

  try {
    const blob = await withTimeout(
      toBlob(element, withoutFonts),
      RENDER_TIMEOUT_MS,
      'render gambar melebihi batas waktu'
    );
    if (hasImage(blob)) {
      console.info(`[PNG] render utama berhasil: ${blob.size} byte`);
      return blob;
    }
    throw new Error('hasil render kosong (0 byte)');
  } catch (firstError) {
    attempts.push(`utama: ${describeRenderError(firstError)}`);
    console.warn(
      '[PNG] render utama gagal, mencoba jalur cadangan canvas…',
      firstError
    );

    // Cadangan 1: canvas murni tanpa html-to-image (tidak menyentuh jaringan).
    try {
      const canvasBlob = await renderElementToBlobViaCanvas(element, scale, transparent);
      if (hasImage(canvasBlob)) {
        console.info(`[PNG] jalur canvas berhasil: ${canvasBlob.size} byte`);
        return canvasBlob;
      }
      attempts.push('canvas: hasil kosong');
    } catch (canvasError) {
      attempts.push(`canvas: ${describeRenderError(canvasError)}`);
      console.warn('[PNG] jalur canvas gagal:', canvasError);
    }

    // Cadangan 2: html-to-image dengan embedding font (paling akurat, tetapi
    // berisiko mencemari canvas).
    try {
      const fontBlob = await withTimeout(
        toBlob(element, withFonts),
        RENDER_TIMEOUT_FALLBACK_MS,
        'render gambar melebihi batas waktu'
      );
      if (hasImage(fontBlob)) {
        console.info(`[PNG] jalur font berhasil: ${fontBlob.size} byte`);
        return fontBlob;
      }
      attempts.push('font: hasil kosong');
    } catch (fontError) {
      attempts.push(`font: ${describeRenderError(fontError)}`);
    }

    console.error('[PNG] semua jalur render gagal →', attempts.join(' | '));
    throw new Error(`gagal merender gambar (${attempts.join('; ')})`);
  }
}

/** Ringkas pesan error render agar enak dibaca di Console. */
function describeRenderError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (/tainted/i.test(message)) return 'canvas tercemar (konten lintas-domain)';
  if (/melebihi batas waktu/i.test(message)) return 'timeout';
  if (/kosong/i.test(message)) return 'hasil kosong';
  return message.slice(0, 80);
}

/** Render PNG (opsional dipotong) menjadi Blob. */
async function renderPngBlob(
  element: HTMLElement,
  options: ExportOptions
): Promise<Blob> {
  const blob = await renderElementToBlob(element, options.scale, options.transparent);

  return options.crop && options.crop.width > 0 && options.crop.height > 0
    ? await cropBlob(blob, options.crop, options.scale)
    : blob;
}

export async function exportAsPng(
  element: HTMLElement,
  options: ExportOptions
): Promise<void> {
  try {
    const blob = await renderPngBlob(element, options);

    if (!blob || blob.size === 0) {
      throw new Error('hasil ekspor kosong (0 byte)');
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `${options.filename || 'bagan-maker'}-${options.scale}x.png`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    link.remove();
    // Beri waktu browser memulai unduhan sebelum URL dilepas.
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  } catch (error) {
    console.error('Gagal mengekspor PNG:', error);
    throw error;
  }
}

/** Tipe stream tulis yang dipakai ekspor. */
type FileWritable = Awaited<ReturnType<SaveFileHandle['createWritable']>>;

/** Simpan PNG ke file handle pilihan pengguna (Save As). */
export async function exportPngToFileHandle(
  element: HTMLElement,
  options: ExportOptions,
  handle: SaveFileHandle,
  /**
   * Stream tulis yang SUDAH dibuka pemanggil tepat setelah dialog pemilih
   * ditutup. `createWritable()` mensyaratkan transient user activation, jadi
   * membukanya di sini (setelah render yang memakan waktu) akan ditolak Chrome
   * dengan NotAllowedError.
   */
  preopenedWritable?: FileWritable
): Promise<void> {
  const writable = preopenedWritable ?? (await handle.createWritable());

  let blob: Blob;
  try {
    blob = await renderPngBlob(element, options);
    if (!blob || blob.size === 0) {
      throw new Error('gambar PNG kosong (0 byte)');
    }
  } catch (renderError) {
    // Jangan tinggalkan berkas kosong: batalkan perubahan.
    try {
      await writable.abort();
    } catch {
      /* diabaikan */
    }
    throw renderError;
  }

  if (typeof console !== 'undefined') {
    console.info('[PNG] ukuran berkas yang akan disimpan:', blob.size, 'byte');
  }

  const writeAndClose = async (target: FileWritable) => {
    try {
      await target.write(blob);
      await target.close();
    } catch (writeError) {
      try {
        await target.abort();
      } catch {
        /* diabaikan */
      }
      throw writeError;
    }
  };

  /** Ukuran berkas di disk; null bila tidak bisa dibaca. */
  const readBackSize = async (): Promise<number | null> => {
    if (typeof handle.getFile !== 'function') return null;
    try {
      const saved = await handle.getFile();
      return saved ? saved.size : null;
    } catch {
      return null;
    }
  };

  await writeAndClose(writable);

  // Verifikasi WAJIB: sebagian lingkungan melaporkan "sukses" tetapi berkas
  // tetap 0 byte. Kalau begitu, tulis ulang sekali lewat stream baru.
  let size = await readBackSize();
  if (size === 0) {
    console.warn('[PNG] berkas terdeteksi 0 byte setelah disimpan — menulis ulang…');
    try {
      const retry = await handle.createWritable();
      await writeAndClose(retry);
      size = await readBackSize();
    } catch (retryError) {
      console.error('[PNG] penulisan ulang gagal:', retryError);
    }
  }

  if (size === 0) {
    throw new Error('berkas tersimpan tetapi tetap kosong (0 byte)');
  }
  if (size === null && !blob.size) {
    throw new Error('berkas tersimpan tetapi isinya kosong');
  }
}

export async function copyToClipboardAsPng(
  element: HTMLElement,
  options: { transparent: boolean; scale?: number }
): Promise<boolean> {
  try {
    const blob = await renderElementToBlob(
      element,
      options.scale || 2,
      options.transparent
    );

    if (navigator.clipboard && window.ClipboardItem) {
      const item = new ClipboardItem({ 'image/png': blob });
      await navigator.clipboard.write([item]);
      return true;
    } else {
      throw new Error('Fitur clipboard tidak didukung pada browser ini');
    }
  } catch (error) {
    console.error('Gagal menyalin gambar ke clipboard:', error);
    throw error;
  }
}

/**
 * Native SVG text wrapper that splits text into multiple <tspan> elements.
 * This guarantees 100% compatibility with Figma, Adobe Illustrator, Inkscape,
 * browsers, and all vector renderers that do not support <foreignObject>.
 */
function renderSvgWrappedText(
  text: string,
  maxWidth: number,
  fontSize: number,
  startX: number,
  startY: number,
  lineHeight: number,
  fillColor: string,
  fontWeight: string | number = 400,
  textAnchor: 'start' | 'middle' = 'start'
): string {
  const charWidthRatio = Number(fontWeight) >= 600 ? 0.6 : 0.52;
  const maxCharsPerLine = Math.max(
    10,
    Math.floor(maxWidth / (fontSize * charWidthRatio))
  );

  const paragraphs = text.split('\n');
  const lines: string[] = [];

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) {
      lines.push('');
      continue;
    }

    const words = trimmed.split(/\s+/);
    let currentLine = '';

    for (const word of words) {
      if (!word) continue;
      if (!currentLine) {
        currentLine = word;
      } else if ((currentLine + ' ' + word).length <= maxCharsPerLine) {
        currentLine += ' ' + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
  }

  if (lines.length === 0) lines.push('');

  const tspans = lines
    .map((line, i) => {
      const yAttr = i === 0 ? `y="${startY}"` : '';
      const dyAttr = i === 0 ? '' : `dy="${lineHeight}px"`;
      return `<tspan x="${startX}" ${yAttr} ${dyAttr}>${escapeXml(line)}</tspan>`;
    })
    .join('\n        ');

  return `<text x="${startX}" y="${startY}" font-family="'Rubik', system-ui, -apple-system, BlinkMacSystemFont, sans-serif" font-size="${fontSize}px" font-weight="${fontWeight}" fill="${fillColor}" text-anchor="${textAnchor}">
        ${tspans}
      </text>`;
}

export function exportAsSvg(
  mainTitle: string,
  subBoxes: SubBoxItem[],
  colors: ColorSettings,
  layout: LayoutSettings,
  filename?: string,
  diagramStyle: DiagramStyleType = 'style1',
  caseSettings: CaseTransformSettings = {
    mainTitleCase: 'none',
    pillTitleCase: 'none',
    bodyCase: 'none',
  },
  style3Data?: Style3QuestionData,
  style3Colors?: Style3ColorSettings,
  style3Layout?: Style3LayoutSettings,
  style3Scope: Style3ExportScope = 'all',
  style5Data?: Style5Data,
  style5Colors?: Style5ColorSettings,
  style5Layout?: Style5LayoutSettings,
  canvasDimension?: CanvasDimension,
  shapeProfile?: string
): string {
  let svgContent = '';

  // ==========================================
  // STYLE 5: SLIDE MATERI (SIDEBAR + FOTO) SVG
  // ==========================================
  if (diagramStyle === 'style5' && style5Data && style5Colors && style5Layout) {
    const svgWidth = canvasDimension?.width || 1920;
    const svgHeight = canvasDimension?.height || 1080;
    const sidebarWidthPercent = style5Data.sidebar.show ? style5Layout.sidebarWidthPercent || 16 : 0;
    const sidebarWidth = (svgWidth * sidebarWidthPercent) / 100;
    const contentX = sidebarWidth + svgWidth * 0.038;
    const contentWidth = svgWidth - contentX - svgWidth * 0.045;

    // Profil bingkai (lebar variabel) untuk SVG ekspor
    const spOn = !!shapeProfile && shapeProfile !== 'uniform';
    const spStroke = (c: string) => (spOn ? 'none' : c);

    const displayHeader = applyTextCaseTransform(
      style5Data.header.title || 'Hubungan antara Ilmu Sejarah dan Ilmu Sosial',
      caseSettings.style5HeaderCase || 'none'
    );
    const displaySidebarName = applyTextCaseTransform(
      style5Data.sidebar.name || 'Peter Burke',
      caseSettings.style5NameCase || 'none'
    );

    // 1. Sidebar SVG
    let sidebarSvg = '';
    if (style5Data.sidebar.show) {
      let photoSvg = '';
      const basePhotoSize = Math.min(sidebarWidth - 48, style5Layout.photoSize * 1.15);
      const basePhotoHeight = Math.min((sidebarWidth - 48) * 1.3, style5Layout.photoSize * 1.45);
      const photoSize = style5Data.sidebar.photoWidth || basePhotoSize;
      const photoHeight = style5Data.sidebar.photoHeight || basePhotoHeight;
      const photoX = (sidebarWidth - photoSize) / 2;
      const photoY = svgHeight * 0.055;
      const photoTX = style5Data.sidebar.photoX || 0;
      const photoTY = style5Data.sidebar.photoY || 0;

      if (style5Data.sidebar.showPhoto) {
        const photoStroke = spStroke(style5Colors.mainColorDark || '#3E4078');
        const photoR = style5Layout.borderRadius * 1.5;
        const photoOutline = profileShapeSvg(
          'rect',
          photoX,
          photoY,
          photoSize,
          photoHeight,
          photoR,
          4,
          style5Colors.mainColorDark || '#3E4078',
          shapeProfile
        );
        if (style5Data.sidebar.photoUrl) {
          photoSvg = `
          <g id="style5-photo" transform="translate(${photoTX} ${photoTY})">
            <clipPath id="photo-clip">
              <rect x="${photoX}" y="${photoY}" width="${photoSize}" height="${photoHeight}" rx="${photoR}" />
            </clipPath>
            <rect x="${photoX}" y="${photoY}" width="${photoSize}" height="${photoHeight}" rx="${photoR}" fill="#ffffff" stroke="${photoStroke}" stroke-width="4" />
            <image href="${style5Data.sidebar.photoUrl}" x="${photoX}" y="${photoY}" width="${photoSize}" height="${photoHeight}" preserveAspectRatio="xMidYMid slice" clip-path="url(#photo-clip)" />
            ${photoOutline}
          </g>`;
        } else {
          photoSvg = `
          <g id="style5-photo" transform="translate(${photoTX} ${photoTY})">
            <rect x="${photoX}" y="${photoY}" width="${photoSize}" height="${photoHeight}" rx="${photoR}" fill="#3E4078" stroke="${photoStroke}" stroke-width="4" />
            <text x="${photoX + photoSize / 2}" y="${photoY + photoHeight / 2}" text-anchor="middle" fill="#ffffff" font-size="14px" font-weight="600">FOTO TOKOH</text>
            ${photoOutline}
          </g>`;
        }
      }

      let nameSvg = '';
      if (style5Data.sidebar.showName) {
        const namePillY = photoY + photoHeight + 24;
        const namePillW = style5Data.sidebar.nameWidth || Math.min(sidebarWidth - 32, 220);
        const namePillH = style5Data.sidebar.nameHeight || style5Layout.fontSizeName + 22;
        const namePillX = (sidebarWidth - namePillW) / 2;
        const nameTX = style5Data.sidebar.nameX || 0;
        const nameTY = style5Data.sidebar.nameY || 0;
        nameSvg = `
        <g id="style5-name" transform="translate(${nameTX} ${nameTY})">
          <rect x="${namePillX}" y="${namePillY}" width="${namePillW}" height="${namePillH}" rx="${namePillH / 2}" fill="${style5Colors.accentPillBg}" stroke="${spStroke(style5Colors.borderColor)}" stroke-width="2" />
          ${profileShapeSvg('pill', namePillX, namePillY, namePillW, namePillH, namePillH / 2, 2, style5Colors.borderColor, shapeProfile)}
          <text x="${namePillX + namePillW / 2}" y="${namePillY + namePillH / 2 + 5}" text-anchor="middle" fill="${style5Colors.accentPillText}" font-size="${style5Layout.fontSizeName}px" font-weight="600">
            ${escapeXml(displaySidebarName)}
          </text>
        </g>`;
      }

      sidebarSvg = `
      <g id="style5-sidebar">
        <rect x="0" y="0" width="${sidebarWidth}" height="${svgHeight}" fill="${style5Colors.mainColor}" stroke="${style5Colors.borderColor}" stroke-width="1" />
        ${photoSvg}
        ${nameSvg}
      </g>`;
    }

    // 2. Header SVG
    let headerSvg = '';
    let currentY = svgHeight * 0.055;
    const headerHeight = style5Data.header.height || Math.max(68, style5Layout.fontSizeHeader * 2.3);
    const headerTX = style5Data.header.x || 0;
    const headerTY = style5Data.header.y || 0;

    if (style5Data.header.show) {
      const headerBoxX = contentX;
      const headerBoxW = style5Data.header.width || contentWidth;
      const numBoxSize = Math.max(68, style5Layout.fontSizeHeader * 2.5);
      const numBoxX = headerBoxX - style5Layout.fontSizeHeader * 0.35;
      const numBoxY = currentY + (headerHeight - numBoxSize) / 2;

      let numBoxSvg = '';
      if (style5Data.header.showNumberBox) {
        numBoxSvg = `
        <g id="style5-header-number">
          <rect x="${numBoxX}" y="${numBoxY}" width="${numBoxSize}" height="${numBoxSize}" rx="${style5Layout.borderRadius * 0.85}" fill="${style5Colors.numberBoxBg}" stroke="${spStroke(style5Colors.borderColor)}" stroke-width="2" />
          ${profileShapeSvg('rect', numBoxX, numBoxY, numBoxSize, numBoxSize, style5Layout.borderRadius * 0.85, 2, style5Colors.borderColor, shapeProfile)}
          <text x="${numBoxX + numBoxSize / 2}" y="${numBoxY + numBoxSize / 2 + (style5Layout.fontSizeHeader * 0.45)}" text-anchor="middle" fill="${style5Colors.headerNumberText}" font-size="${Math.round(style5Layout.fontSizeHeader * 1.35)}px" font-weight="700">
            ${escapeXml(style5Data.header.number || '01')}
          </text>
        </g>`;
      }

      const titleX = style5Data.header.showNumberBox
        ? headerBoxX + numBoxSize + 20
        : headerBoxX + 28;

      headerSvg = `
      <g id="style5-header" transform="translate(${headerTX} ${headerTY})">
        <rect x="${headerBoxX}" y="${currentY}" width="${headerBoxW}" height="${headerHeight}" rx="${style5Layout.borderRadius}" fill="${style5Colors.mainColor}" stroke="${spStroke(style5Colors.borderColor)}" stroke-width="2" />
        ${profileShapeSvg('rect', headerBoxX, currentY, headerBoxW, headerHeight, style5Layout.borderRadius, 2, style5Colors.borderColor, shapeProfile)}
        <text x="${titleX}" y="${currentY + headerHeight / 2 + (style5Layout.fontSizeHeader * 0.35)}" fill="#ffffff" font-size="${style5Layout.fontSizeHeader}px" font-weight="700">
          ${escapeXml(displayHeader)}
        </text>
        ${numBoxSvg}
      </g>`;

      currentY += headerHeight + svgHeight * 0.032;
    }

    // 3. Points SVG
    let pointsSvg = '';
    style5Data.points.forEach((pt, idx) => {
      const numberLabel = pt.number || getStyle5ItemNumberLabel(idx, style5Data.numberingType, style5Data.startFrom);
      const pillText = applyTextCaseTransform(pt.pillText || `Poin ${idx + 1}`, caseSettings.style5PillCase || 'none');
      const descText = applyTextCaseTransform(pt.descriptionText || '', caseSettings.style5DescCase || 'none');
      const pillBg = pt.customPillColor || style5Colors.accentPillBg;
      const descBg = pt.customDescBg || style5Colors.descriptionBoxBg;
      const borderCol = pt.customBorderColor || style5Colors.borderColor;
      const textCol = pt.customTextColor || style5Colors.accentPillText;
      const descTextCol = pt.customTextColor || style5Colors.descriptionBoxText;

      const pillH = pt.pillHeight || Math.max(50, style5Layout.fontSizePill * 2.3);
      const numBoxSize = Math.max(50, style5Layout.fontSizePill * 2.4);
      const pillW = pt.pillWidth || (pt.width || contentWidth) * (pt.width ? 1 : 0.95);

      let pillSvg = '';
      if (pt.mode !== 'desc-only') {
        const pillX = contentX;
        const pillY = currentY;
        const numX = pillX - style5Layout.fontSizePill * 0.25;
        const numY = pillY + (pillH - numBoxSize) / 2;

        let numBox = '';
        if (!pt.hideNumberBox) {
          numBox = `
          <rect x="${numX}" y="${numY}" width="${numBoxSize}" height="${numBoxSize}" rx="${style5Layout.borderRadius * 0.7}" fill="${style5Colors.numberBoxBg}" stroke="${spStroke(borderCol)}" stroke-width="2" />
          ${profileShapeSvg('rect', numX, numY, numBoxSize, numBoxSize, style5Layout.borderRadius * 0.7, 2, borderCol, shapeProfile)}
          <text x="${numX + numBoxSize / 2}" y="${numY + numBoxSize / 2 + (style5Layout.fontSizePill * 0.42)}" text-anchor="middle" fill="${style5Colors.pointNumberText}" font-size="${Math.round(style5Layout.fontSizePill * 1.25)}px" font-weight="700">
            ${escapeXml(numberLabel)}
          </text>`;
        }

        const textStartX = !pt.hideNumberBox ? pillX + numBoxSize + 18 : pillX + 24;

        pillSvg = `
        <g id="style5-pill-${pt.id}" transform="translate(${pt.pillX || 0} ${pt.pillY || 0})">
          <rect x="${pillX}" y="${pillY}" width="${pillW}" height="${pillH}" rx="${pillH / 2}" fill="${pillBg}" stroke="${spStroke(borderCol)}" stroke-width="2" />
          ${profileShapeSvg('pill', pillX, pillY, pillW, pillH, pillH / 2, 2, borderCol, shapeProfile)}
          <text x="${textStartX}" y="${pillY + pillH / 2 + (style5Layout.fontSizePill * 0.35)}" fill="${textCol}" font-size="${pt.customFontSizePill || style5Layout.fontSizePill}px" font-weight="500">
            ${escapeXml(pillText)}
          </text>
          ${numBox}
        </g>`;

        currentY += pillH + 10;
      }

      let descSvg = '';
      if (pt.mode !== 'pill-only' && descText) {
        const descX = contentX + (svgWidth * 0.024);
        const descW = pt.descWidth || (pt.width || contentWidth) * 0.92;
        const descLines = splitTextIntoLines(descText, descW - 48, pt.customFontSizeDesc || style5Layout.fontSizeDesc, 400);
        const lineHeight = (pt.customFontSizeDesc || style5Layout.fontSizeDesc) * 1.6;
        const descBoxH = pt.descHeight || Math.max(54, descLines.length * lineHeight + 28);

        const descTspans = descLines.map((line, lIdx) =>
          `<tspan x="${descX + 24}" y="${currentY + 24 + lIdx * lineHeight}">${escapeXml(line)}</tspan>`
        ).join('');

        descSvg = `
        <g id="style5-desc-${pt.id}" transform="translate(${pt.descX || 0} ${pt.descY || 0})">
          <rect x="${descX}" y="${currentY}" width="${descW}" height="${descBoxH}" rx="${style5Layout.borderRadius * 0.85}" fill="${descBg}" stroke="${spStroke(borderCol)}" stroke-width="2" />
          ${profileShapeSvg('rect', descX, currentY, descW, descBoxH, style5Layout.borderRadius * 0.85, 2, borderCol, shapeProfile)}
          <text font-size="${pt.customFontSizeDesc || style5Layout.fontSizeDesc}px" fill="${descTextCol}" font-weight="400">
            ${descTspans}
          </text>
        </g>`;

        currentY += descBoxH + style5Layout.pointsGap;
      } else {
        currentY += style5Layout.pointsGap;
      }

      pointsSvg += `
      <g id="style5-point-group-${pt.id}" transform="translate(${pt.x || 0} ${pt.y || 0})">
        ${pillSvg}
        ${descSvg}
      </g>`;
    });

    // 4. Free elements SVG
    let freeElementsSvg = '';
    style5Data.freeElements.forEach((el) => {
      if (el.type === 'image' && el.content) {
        freeElementsSvg += `
        <image href="${el.content}" x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height || el.width}" preserveAspectRatio="xMidYMid meet" />`;
      } else if (el.content) {
        freeElementsSvg += `
        <g>
          ${el.bgColor ? `<rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height || 60}" rx="${el.borderRadius || 12}" fill="${el.bgColor}" stroke="${spStroke(el.borderColor || 'none')}" stroke-width="2" />` : ''}
          ${el.borderColor ? profileShapeSvg('rect', el.x, el.y, el.width, el.height || 60, el.borderRadius || 12, 2, el.borderColor, shapeProfile) : ''}
          <text x="${el.x + 16}" y="${el.y + 28}" fill="${el.color || '#2E2E2E'}" font-size="${el.fontSize || 16}px" font-weight="${el.fontWeight === 'bold' ? 700 : 400}">
            ${escapeXml(el.content)}
          </text>
        </g>`;
      }
    });

    const s5BgColor = style5Colors.canvasBg || 'transparent';
    const bgRect =
      s5BgColor === 'transparent' || s5BgColor === 'rgba(0,0,0,0)'
        ? ''
        : `<rect width="${svgWidth}" height="${svgHeight}" fill="${s5BgColor}" />`;

    svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgWidth} ${svgHeight}" width="${svgWidth}" height="${svgHeight}">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;600;700&amp;display=swap');
      text {
        font-family: 'Rubik', system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
    </style>
  </defs>
  ${bgRect}
  ${sidebarSvg}
  ${headerSvg}
  ${pointsSvg}
  ${freeElementsSvg}
</svg>`;

    return svgContent;
  }


  const subWidth = layout.subBoxMaxWidth || 440;
  const mainWidth = layout.mainBoxWidth || 210;
  const mainHeight = layout.mainBoxMinHeight || 120;
  const gap = layout.subBoxGap || 24;
  const dotRadius = (layout.connectorDotSize || 8) / 2;
  const connectorThickness = layout.connectorThickness || 2;
  const pillBorderWidth = layout.pillBorderWidth || 1.2;
  const subBoxBorderWidth = layout.subBoxBorderWidth || 1;
  const transformedMainTitle = applyTextCaseTransform(
    mainTitle || 'Judul Utama',
    caseSettings.mainTitleCase
  );

  if (diagramStyle === 'style3' && style3Data && style3Colors && style3Layout) {
    // ==========================================
    // STYLE 3: QUESTION & EXPLANATION SVG EXPORT
    // ==========================================
    const includeQuestion = style3Scope === 'all' || style3Scope === 'question-only';
    const includeExplanation =
      (style3Scope === 'all' || style3Scope === 'explanation-only') &&
      style3Data.showExplanation;

    const totalWidth = style3Layout.totalWidth;
    const padding = layout.diagramPadding || 32;
    const svgWidth = totalWidth + padding * 2;
    const boxInnerWidth = totalWidth - 56;

    const questionPill = applyTextCaseTransform(
      style3Data.questionPillLabel || 'Question No. 1',
      caseSettings.style3PillCase || 'none'
    );
    const questionText = applyTextCaseTransform(
      style3Data.questionText || '',
      caseSettings.style3QuestionCase || 'none'
    );
    const explanationPill = applyTextCaseTransform(
      style3Data.explanationPillLabel || 'Explanation :',
      caseSettings.style3PillCase || 'none'
    );
    const explanationText = applyTextCaseTransform(
      style3Data.explanationText || '',
      caseSettings.style3ExplanationCase || 'none'
    );

    const hasImage = style3Data.showImageBox;
    const imageBoxW = style3Layout.imageBoxWidth || 240;
    const imageBoxH = style3Layout.imageBoxHeight || 180;
    const questionColWidth = hasImage ? boxInnerWidth - imageBoxW - 32 : boxInnerWidth;

    // Approximate Question lines
    const questionCharsPerLine = Math.floor(
      questionColWidth / (style3Layout.fontSizeQuestion * 0.58)
    );
    const qLines = Math.ceil(questionText.length / questionCharsPerLine) || 1;
    const qTextHeight = qLines * (style3Layout.fontSizeQuestion * 1.5);
    const choicesHeight = style3Data.choices.length * (style3Layout.fontSizeChoice * 1.5 + style3Layout.choiceSpacing);
    const questionContentHeight = qTextHeight + 20 + choicesHeight;
    const questionBoxHeight = Math.max(
      hasImage ? imageBoxH + 56 : 140,
      questionContentHeight + 56
    );

    // Approximate Explanation height
    const expCharsPerLine = Math.floor(
      boxInnerWidth / (style3Layout.fontSizeExplanation * 0.52)
    );
    const expLines = Math.ceil(explanationText.length / expCharsPerLine) || 1;
    const expTextHeight = expLines * (style3Layout.fontSizeExplanation * 1.5);
    const explanationBoxHeight = Math.max(100, expTextHeight + 56);

    let contentHeight = 0;
    if (includeQuestion && includeExplanation) {
      contentHeight = questionBoxHeight + style3Layout.boxesGap + explanationBoxHeight;
    } else if (includeQuestion) {
      contentHeight = questionBoxHeight;
    } else {
      contentHeight = explanationBoxHeight;
    }

    const svgHeight = contentHeight + padding * 2 + 20;
    let currentY = padding + 15;

    let questionBoxSvg = '';
    if (includeQuestion) {
      const qBoxY = currentY;
      const qBoxX = padding;

      // Question Pill
      const pillFontSize =
        style3Layout.fontSizeQuestionPill || style3Layout.fontSizePill || 15;
      const pillWidth = Math.max(120, questionPill.length * (pillFontSize * 0.65) + 32);
      const pillHeight = pillFontSize + 16;
      const pillX = qBoxX + 24;
      const pillY = qBoxY - pillHeight / 2;

      // Question Text Wrapped
      const bodyQTextSvg = renderSvgWrappedText(
        questionText,
        questionColWidth,
        style3Layout.fontSizeQuestion,
        qBoxX + 28,
        qBoxY + 36,
        style3Layout.fontSizeQuestion * 1.5,
        style3Colors.questionTextColor,
        style3Layout.questionFontWeight === 'bold' ? 700 : style3Layout.questionFontWeight === 'medium' ? 500 : 400,
        'start'
      );

      // Choices SVG
      let choicesSvg = '';
      let choiceStartY = qBoxY + 36 + qTextHeight + 20;

      for (let i = 0; i < style3Data.choices.length; i++) {
        const choice = style3Data.choices[i];
        const prefix = getStyle3ChoicePrefix(
          i,
          style3Data.choiceNumberingType,
          style3Data.choiceSeparator
        );
        const transformedChoice = applyTextCaseTransform(
          choice,
          caseSettings.style3ChoiceCase || 'none'
        );
        const isCorrect =
          style3Data.showCorrectAnswer && i === style3Data.correctAnswerIndex;
        const fullChoiceText = `${prefix}${transformedChoice}`;

        let highlightRect = '';
        if (isCorrect) {
          const hlWidth = Math.min(questionColWidth, fullChoiceText.length * (style3Layout.fontSizeChoice * 0.6) + 30);
          highlightRect = `<rect x="${qBoxX + 24}" y="${choiceStartY - 16}" width="${hlWidth}" height="${style3Layout.fontSizeChoice + 12}" rx="6" fill="${style3Colors.correctAnswerHighlightBg}" />`;
        }

        choicesSvg += `
        ${highlightRect}
        <text x="${qBoxX + 28}" y="${choiceStartY}" font-family="'Rubik', sans-serif" font-size="${style3Layout.fontSizeChoice}px" font-weight="${isCorrect ? '600' : '400'}" fill="${isCorrect ? style3Colors.correctAnswerHighlightText : style3Colors.choiceTextColor}">
          <tspan font-weight="600">${escapeXml(prefix)}</tspan>${escapeXml(transformedChoice)}${isCorrect ? ' ✓' : ''}
        </text>
        `;
        choiceStartY += style3Layout.fontSizeChoice * 1.5 + style3Layout.choiceSpacing;
      }

      // Image Box SVG
      let imageBoxSvg = '';
      if (hasImage) {
        const imgX = qBoxX + totalWidth - imageBoxW - 28;
        const imgY = qBoxY + 28;

        let imgContent = '';
        if (style3Data.imageUrl) {
          imgContent = `<image href="${style3Data.imageUrl}" x="${imgX}" y="${imgY}" width="${imageBoxW}" height="${imageBoxH}" preserveAspectRatio="${style3Data.imageFit === 'contain' ? 'xMidYMid meet' : 'xMidYMid slice'}" />`;
        } else {
          imgContent = `<text x="${imgX + imageBoxW / 2}" y="${imgY + imageBoxH / 2}" text-anchor="middle" font-family="'Rubik', sans-serif" font-size="12px" fill="#94a3b8">Kotak Gambar</text>`;
        }

        imageBoxSvg = `
        <rect x="${imgX}" y="${imgY}" width="${imageBoxW}" height="${imageBoxH}" rx="12" fill="#ffffff" stroke="${spStr(style3Colors.questionBoxBorder, shapeProfile)}" stroke-width="1.2" />
        ${profileShapeSvg('rect', imgX, imgY, imageBoxW, imageBoxH, 12, 1.2, style3Colors.questionBoxBorder, shapeProfile)}
        ${imgContent}
        `;
      }

      questionBoxSvg = `
      <g id="style3-question">
        <!-- Question Box Container -->
        <rect x="${qBoxX}" y="${qBoxY}" width="${totalWidth}" height="${questionBoxHeight}" rx="${style3Layout.borderRadius}" fill="${style3Colors.questionBoxBg}" stroke="${spStr(style3Colors.questionBoxBorder, shapeProfile)}" stroke-width="1.5" />
        ${profileShapeSvg('rect', qBoxX, qBoxY, totalWidth, questionBoxHeight, style3Layout.borderRadius, 1.5, style3Colors.questionBoxBorder, shapeProfile)}
        <!-- Question Text & Choices -->
        ${bodyQTextSvg}
        ${choicesSvg}
        <!-- Image Box -->
        ${imageBoxSvg}
        <!-- Pill Label Overlapping Top-Left -->
        <rect x="${pillX}" y="${pillY}" width="${pillWidth}" height="${pillHeight}" rx="${pillHeight / 2}" fill="${style3Colors.questionPillBg}" stroke="${spStr(style3Colors.questionBoxBorder, shapeProfile)}" stroke-width="1.2" />
        ${profileShapeSvg('pill', pillX, pillY, pillWidth, pillHeight, pillHeight / 2, 1.2, style3Colors.questionBoxBorder, shapeProfile)}
        <text x="${pillX + pillWidth / 2}" y="${pillY + pillHeight / 2 + 5}" text-anchor="middle" fill="${style3Colors.questionPillText}" font-family="'Rubik', sans-serif" font-size="${pillFontSize}px" font-weight="600">
          ${escapeXml(questionPill)}
        </text>
      </g>
      `;

      currentY += questionBoxHeight + style3Layout.boxesGap;
    }

    let explanationBoxSvg = '';
    if (includeExplanation) {
      const expBoxY = currentY;
      const expBoxX = padding;
      const expBoxW = style3Layout.matchExplanationWidth ? totalWidth : totalWidth * 0.96;

      // Explanation Pill
      const pillFontSize =
        style3Layout.fontSizeExplanationPill || style3Layout.fontSizePill || 15;
      const pillWidth = Math.max(120, explanationPill.length * (pillFontSize * 0.65) + 32);
      const pillHeight = pillFontSize + 16;
      const pillX = expBoxX + 24;
      const pillY = expBoxY - pillHeight / 2;

      // Explanation Wrapped Text
      const bodyExpTextSvg = renderSvgWrappedText(
        explanationText,
        expBoxW - 56,
        style3Layout.fontSizeExplanation,
        expBoxX + 28,
        expBoxY + 36,
        style3Layout.fontSizeExplanation * 1.5,
        style3Colors.explanationTextColor,
        400,
        'start'
      );

      explanationBoxSvg = `
      <g id="style3-explanation">
        <!-- Explanation Box Container -->
        <rect x="${expBoxX}" y="${expBoxY}" width="${expBoxW}" height="${explanationBoxHeight}" rx="${style3Layout.borderRadius}" fill="${style3Colors.explanationBoxBg}" stroke="${spStr(style3Colors.explanationBoxBorder, shapeProfile)}" stroke-width="1.5" />
        ${profileShapeSvg('rect', expBoxX, expBoxY, expBoxW, explanationBoxHeight, style3Layout.borderRadius, 1.5, style3Colors.explanationBoxBorder, shapeProfile)}
        <!-- Explanation Text -->
        ${bodyExpTextSvg}
        <!-- Pill Label Overlapping Top-Left -->
        <rect x="${pillX}" y="${pillY}" width="${pillWidth}" height="${pillHeight}" rx="${pillHeight / 2}" fill="${style3Colors.explanationPillBg}" stroke="${spStr(style3Colors.explanationBoxBorder, shapeProfile)}" stroke-width="1.2" />
        ${profileShapeSvg('pill', pillX, pillY, pillWidth, pillHeight, pillHeight / 2, 1.2, style3Colors.explanationBoxBorder, shapeProfile)}
        <text x="${pillX + pillWidth / 2}" y="${pillY + pillHeight / 2 + 5}" text-anchor="middle" fill="${style3Colors.explanationPillText}" font-family="'Rubik', sans-serif" font-size="${pillFontSize}px" font-weight="600">
          ${escapeXml(explanationPill)}
        </text>
      </g>
      `;
    }

    svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgWidth} ${svgHeight}" width="${svgWidth}" height="${svgHeight}">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;600;700&amp;display=swap');
      text {
        font-family: 'Rubik', system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
    </style>
  </defs>
  ${questionBoxSvg}
  ${explanationBoxSvg}
</svg>`;
  } else if (diagramStyle === 'style4') {
    // ==========================================
    // STYLE 4: RADIAL (LINGKARAN TENGAH) SVG EXPORT
    // ==========================================

    // Split left and right items
    const leftSubs: { item: SubBoxItem; globalIdx: number }[] = [];
    const rightSubs: { item: SubBoxItem; globalIdx: number }[] = [];
    const half = Math.ceil(subBoxes.length / 2);
    subBoxes.forEach((item, idx) => {
      if (item.side === 'left') {
        leftSubs.push({ item, globalIdx: idx });
      } else if (item.side === 'right') {
        rightSubs.push({ item, globalIdx: idx });
      } else {
        if (idx < half) leftSubs.push({ item, globalIdx: idx });
        else rightSubs.push({ item, globalIdx: idx });
      }
    });

    const maxItemsOneSide = Math.max(1, leftSubs.length, rightSubs.length);

    // Dynamic central circle diameter adapting smoothly to chart scale
    const baseDiameter = layout.style4CircleDiameter || 220;
    const mainDiameter = Math.max(
      baseDiameter,
      Math.min(420, 200 + (maxItemsOneSide - 1) * 28)
    );
    const mainRadius = mainDiameter / 2;
    const arcDist = layout.style4ArcDistance !== undefined ? layout.style4ArcDistance : 20;
    const rArc = mainRadius + arcDist;
    const connectorLength = layout.style4ConnectorLength || 46;
    const circleBoxSize = layout.style4CircleBoxSize || 42;
    const circleRadius = circleBoxSize / 2;
    const dotRadius = (layout.style4DotSize || 14) / 2;
    const numberingType = layout.style4NumberingType || 'none';
    const subGap = layout.style4SubBoxGap !== undefined ? layout.style4SubBoxGap : 18;
    const pillHeight = Math.max(circleBoxSize - 4, 38);
    const connectorThickness = layout.connectorThickness || 2;
    const maxPillWidth = layout.subBoxMaxWidth || 420;

    const rOuter = rArc + connectorLength + circleRadius;

    // Calculate vertical spread for each side to guarantee equal connector length
    const desiredPitch = Math.max(48, Math.min(68, circleBoxSize + subGap));
    const computeSideGeometry = (subsCount: number) => {
      if (subsCount <= 1) {
        return { sMax: 0, sBracket: 0.28 };
      }
      const spanNeeded = (subsCount - 1) * desiredPitch;
      const sMax = Math.min(0.86, Math.max(0.3, spanNeeded / (2 * rOuter)));
      const sBracket = Math.min(0.92, sMax + 0.08);
      return { sMax, sBracket };
    };

    const leftGeo = computeSideGeometry(leftSubs.length);
    const rightGeo = computeSideGeometry(rightSubs.length);
    const maxS = Math.max(leftGeo.sMax, rightGeo.sMax, 0.4);

    const contentHeight = Math.max(
      mainDiameter + 60,
      2 * rOuter * maxS + circleBoxSize + 70
    );
    const padding = layout.diagramPadding || 36;
    const svgHeight = contentHeight + padding * 2;
    const cy = svgHeight / 2;

    const sideDistance = rOuter + maxPillWidth + 30;
    const svgWidth = sideDistance * 2 + padding * 2;
    const cx = svgWidth / 2;

    let elementsSvg = '';

    // Center Circle (Ungu / mainBoxBg)
    elementsSvg += `
    <!-- Center Main Circle -->
    <circle cx="${cx}" cy="${cy}" r="${mainRadius}" fill="${colors.mainBoxBg}" stroke="${spStr(colors.connectorColor, shapeProfile)}" stroke-width="2" />
    ${profileShapeSvg('circle', cx - mainRadius, cy - mainRadius, mainDiameter, mainDiameter, mainRadius, 2, colors.connectorColor, shapeProfile)}
    `;

    // Center Main Title Text
    const mainFontSize = layout.fontSizeMain || 22;
    const mainTitleLines = splitTextIntoLines(
      transformedMainTitle,
      mainDiameter - 36,
      mainFontSize,
      700
    );
    const mainLineHeight = mainFontSize * 1.3;
    const totalMainTextHeight = (mainTitleLines.length - 1) * mainLineHeight;
    const mainTextStartY = cy - totalMainTextHeight / 2 + mainFontSize * 0.35;
    const mainTspans = mainTitleLines
      .map((line, idx) => {
        const yAttr = idx === 0 ? `y="${mainTextStartY}"` : '';
        const dyAttr = idx > 0 ? `dy="${mainLineHeight}"` : '';
        return `<tspan x="${cx}" ${yAttr} ${dyAttr}>${escapeXml(line)}</tspan>`;
      })
      .join('\n      ');

    elementsSvg += `
    <text x="${cx}" y="${mainTextStartY}" text-anchor="middle" font-family="'Rubik', sans-serif" font-size="${mainFontSize}px" font-weight="700" fill="${colors.mainBoxText}">
      ${mainTspans}
    </text>
    `;

    // Left Arc & Connectors & Pills (All lines have EXACTLY equal length = connectorLength)
    if (leftSubs.length > 0) {
      const nLeft = leftSubs.length;
      const { sMax, sBracket } = leftGeo;
      const cBracket = Math.sqrt(Math.max(0, 1 - sBracket * sBracket));
      const xTop = cx - rArc * cBracket;
      const yTop = cy - rArc * sBracket;
      const xBottom = cx - rArc * cBracket;
      const yBottom = cy + rArc * sBracket;

      // Arc bracket
      elementsSvg += `
      <!-- Left Arc Bracket -->
      ${connectorStrokeSvg(
        `M ${xTop} ${yTop} A ${rArc} ${rArc} 0 0 0 ${xBottom} ${yBottom}`,
        `<path d="M ${xTop} ${yTop} A ${rArc} ${rArc} 0 0 0 ${xBottom} ${yBottom}" stroke="${colors.connectorColor}" stroke-width="${connectorThickness}" fill="none" stroke-linecap="round" />`,
        colors.connectorColor,
        connectorThickness,
        layout.connectorProfile
      )}
      `;

      leftSubs.forEach(({ item, globalIdx }, i) => {
        const s_i = nLeft === 1 ? 0 : -sMax + (i / (nLeft - 1)) * (2 * sMax);
        const cosPhi = Math.sqrt(Math.max(0, 1 - s_i * s_i));
        const dotX = cx - rArc * cosPhi;
        const dotY = cy + rArc * s_i;

        // Dot
        elementsSvg += `<circle cx="${dotX}" cy="${dotY}" r="${dotRadius}" fill="${colors.connectorColor}" />\n`;

        // Exact line length = connectorLength
        const targetX = dotX - connectorLength * cosPhi;
        const targetY = dotY + connectorLength * s_i;

        const circleCenterX = dotX - (connectorLength + circleRadius) * cosPhi;
        const circleCenterY = dotY + (connectorLength + circleRadius) * s_i;

        elementsSvg += connectorStrokeSvg(
          `M ${dotX} ${dotY} L ${targetX} ${targetY}`,
          `<line x1="${dotX}" y1="${dotY}" x2="${targetX}" y2="${targetY}" stroke="${colors.connectorColor}" stroke-width="${connectorThickness}" stroke-linecap="round" />\n`,
          colors.connectorColor,
          connectorThickness,
          layout.connectorProfile
        );

        // Text & Pill
        const rawText = item.content || item.title || '';
        const displayText = applyTextCaseTransform(
          rawText,
          caseSettings.bodyCase !== 'none' ? caseSettings.bodyCase : caseSettings.pillTitleCase
        );
        const fontSize = layout.fontSizeBody || 15;
        const approxTextWidth = Math.round(displayText.length * fontSize * 0.58);
        const pillW = Math.min(maxPillWidth, Math.max(90, approxTextWidth + 36));
        const pillX = circleCenterX + circleRadius - Math.round(circleBoxSize * 0.35) - pillW;
        const pillY = circleCenterY - pillHeight / 2;
        const pillBg = layout.individualPillColor && item.customPillColor ? item.customPillColor : colors.pillBg;

        // Pill rect
        elementsSvg += `<rect x="${pillX}" y="${pillY}" width="${pillW}" height="${pillHeight}" rx="${pillHeight / 2}" fill="${pillBg}" stroke="${spStr(colors.pillBorder || '#5a3e78', shapeProfile)}" stroke-width="${pillBorderWidth}" />\n`;
        elementsSvg += `${profileShapeSvg('pill', pillX, pillY, pillW, pillHeight, pillHeight / 2, pillBorderWidth, colors.pillBorder || '#5a3e78', shapeProfile)}\n`;

        // Pill text
        elementsSvg += `<text x="${pillX + (pillW - Math.round(circleBoxSize * 0.35)) / 2}" y="${circleCenterY + 5}" text-anchor="middle" font-family="'Rubik', sans-serif" font-size="${fontSize}px" fill="${colors.pillText}">${escapeXml(displayText)}</text>\n`;

        // Circle box
        elementsSvg += `<circle cx="${circleCenterX}" cy="${circleCenterY}" r="${circleRadius}" fill="${colors.numberCircleBg}" stroke="${spStr(colors.numberCircleBorder, shapeProfile)}" stroke-width="2.5" />\n`;
        elementsSvg += `${profileShapeSvg('circle', circleCenterX - circleRadius, circleCenterY - circleRadius, circleRadius * 2, circleRadius * 2, circleRadius, 2.5, colors.numberCircleBorder, shapeProfile)}\n`;

        // Number label if any
        const numberLabel = getStyle2ItemNumberLabel(
          globalIdx,
          numberingType,
          layout.style4Separator || '.',
          layout.style4StartFrom || '1',
          item.customNumber
        );
        if (numberLabel) {
          elementsSvg += `<text x="${circleCenterX}" y="${circleCenterY + 5}" text-anchor="middle" font-family="'Rubik', sans-serif" font-size="${Math.round(circleBoxSize * 0.38)}px" font-weight="700" fill="${colors.numberCircleText}">${escapeXml(numberLabel)}</text>\n`;
        }
      });
    }

    // Right Arc & Connectors & Pills (All lines have EXACTLY equal length = connectorLength)
    if (rightSubs.length > 0) {
      const nRight = rightSubs.length;
      const { sMax, sBracket } = rightGeo;
      const cBracket = Math.sqrt(Math.max(0, 1 - sBracket * sBracket));
      const xTop = cx + rArc * cBracket;
      const yTop = cy - rArc * sBracket;
      const xBottom = cx + rArc * cBracket;
      const yBottom = cy + rArc * sBracket;

      // Arc bracket
      elementsSvg += `
      <!-- Right Arc Bracket -->
      ${connectorStrokeSvg(
        `M ${xTop} ${yTop} A ${rArc} ${rArc} 0 0 1 ${xBottom} ${yBottom}`,
        `<path d="M ${xTop} ${yTop} A ${rArc} ${rArc} 0 0 1 ${xBottom} ${yBottom}" stroke="${colors.connectorColor}" stroke-width="${connectorThickness}" fill="none" stroke-linecap="round" />`,
        colors.connectorColor,
        connectorThickness,
        layout.connectorProfile
      )}
      `;

      rightSubs.forEach(({ item, globalIdx }, i) => {
        const s_i = nRight === 1 ? 0 : -sMax + (i / (nRight - 1)) * (2 * sMax);
        const cosPhi = Math.sqrt(Math.max(0, 1 - s_i * s_i));
        const dotX = cx + rArc * cosPhi;
        const dotY = cy + rArc * s_i;

        // Dot
        elementsSvg += `<circle cx="${dotX}" cy="${dotY}" r="${dotRadius}" fill="${colors.connectorColor}" />\n`;

        // Exact line length = connectorLength
        const targetX = dotX + connectorLength * cosPhi;
        const targetY = dotY + connectorLength * s_i;

        const circleCenterX = dotX + (connectorLength + circleRadius) * cosPhi;
        const circleCenterY = dotY + (connectorLength + circleRadius) * s_i;

        elementsSvg += connectorStrokeSvg(
          `M ${dotX} ${dotY} L ${targetX} ${targetY}`,
          `<line x1="${dotX}" y1="${dotY}" x2="${targetX}" y2="${targetY}" stroke="${colors.connectorColor}" stroke-width="${connectorThickness}" stroke-linecap="round" />\n`,
          colors.connectorColor,
          connectorThickness,
          layout.connectorProfile
        );

        // Text & Pill
        const rawText = item.content || item.title || '';
        const displayText = applyTextCaseTransform(
          rawText,
          caseSettings.bodyCase !== 'none' ? caseSettings.bodyCase : caseSettings.pillTitleCase
        );
        const fontSize = layout.fontSizeBody || 15;
        const approxTextWidth = Math.round(displayText.length * fontSize * 0.58);
        const pillW = Math.min(maxPillWidth, Math.max(90, approxTextWidth + 36));
        const pillX = circleCenterX - circleRadius + Math.round(circleBoxSize * 0.35);
        const pillY = circleCenterY - pillHeight / 2;
        const pillBg = layout.individualPillColor && item.customPillColor ? item.customPillColor : colors.pillBg;

        // Pill rect
        elementsSvg += `<rect x="${pillX}" y="${pillY}" width="${pillW}" height="${pillHeight}" rx="${pillHeight / 2}" fill="${pillBg}" stroke="${spStr(colors.pillBorder || '#5a3e78', shapeProfile)}" stroke-width="${pillBorderWidth}" />\n`;
        elementsSvg += `${profileShapeSvg('pill', pillX, pillY, pillW, pillHeight, pillHeight / 2, pillBorderWidth, colors.pillBorder || '#5a3e78', shapeProfile)}\n`;

        // Pill text
        elementsSvg += `<text x="${pillX + (pillW + Math.round(circleBoxSize * 0.35)) / 2}" y="${circleCenterY + 5}" text-anchor="middle" font-family="'Rubik', sans-serif" font-size="${fontSize}px" fill="${colors.pillText}">${escapeXml(displayText)}</text>\n`;

        // Circle box
        elementsSvg += `<circle cx="${circleCenterX}" cy="${circleCenterY}" r="${circleRadius}" fill="${colors.numberCircleBg}" stroke="${spStr(colors.numberCircleBorder, shapeProfile)}" stroke-width="2.5" />\n`;
        elementsSvg += `${profileShapeSvg('circle', circleCenterX - circleRadius, circleCenterY - circleRadius, circleRadius * 2, circleRadius * 2, circleRadius, 2.5, colors.numberCircleBorder, shapeProfile)}\n`;

        // Number label if any
        const numberLabelRight = getStyle2ItemNumberLabel(
          globalIdx,
          numberingType,
          layout.style4Separator || '.',
          layout.style4StartFrom || '1',
          item.customNumber
        );
        if (numberLabelRight) {
          elementsSvg += `<text x="${circleCenterX}" y="${circleCenterY + 5}" text-anchor="middle" font-family="'Rubik', sans-serif" font-size="${Math.round(circleBoxSize * 0.38)}px" font-weight="700" fill="${colors.numberCircleText}">${escapeXml(numberLabelRight)}</text>\n`;
        }
      });
    }

    svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgWidth} ${svgHeight}" width="${svgWidth}" height="${svgHeight}">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;600;700&amp;display=swap');
      text {
        font-family: 'Rubik', system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
    </style>
  </defs>
  ${elementsSvg}
</svg>`;
  } else if (diagramStyle === 'style2') {
    // ==========================================
    // STYLE 2: PILL BERNOMOR SVG EXPORT
    // ==========================================
    const circleSize = layout.style2CircleSize || 42;
    const circleRadius = circleSize / 2;
    const numberingType = layout.style2NumberingType || 'numbers';
    const hasNumbers = numberingType !== 'none';
    const dotSpacing = layout.style2DotSpacing || 14;

    const subHeights = subBoxes.map((item) => {
      const rawText = item.content || item.title || '';
      const text = applyTextCaseTransform(
        rawText,
        caseSettings.bodyCase !== 'none'
          ? caseSettings.bodyCase
          : caseSettings.pillTitleCase
      );
      const charsPerLine = Math.floor(
        (subWidth - (hasNumbers ? 54 : 32)) / (layout.fontSizeBody * 0.52)
      );
      const lines = Math.ceil(text.length / charsPerLine) || 1;
      const textHeight = lines * (layout.fontSizeBody * 1.45);
      return Math.max(
        circleSize,
        textHeight + (layout.style2PillPaddingY || 10) * 2 + 10
      );
    });

    const totalSubHeight =
      subHeights.reduce((acc, h) => acc + h, 0) +
      (subBoxes.length - 1) * gap;
    const svgHeight = Math.max(totalSubHeight + 120, mainHeight + 140);
    const svgWidth = layout.diagramPadding * 2 + mainWidth + 100 + subWidth + 80;

    const startX = layout.diagramPadding + (layout.showDoubleFrame ? 14 : 0);
    const mainY = (svgHeight - mainHeight) / 2 + (layout.mainBoxOffsetY || 0);
    const mainCenterY = mainY + mainHeight / 2;
    const mainEdgeX =
      startX + mainWidth + (layout.showDoubleFrame ? 24 : 0);

    const subStartX = mainEdgeX + 80;
    let currentSubY = (svgHeight - totalSubHeight) / 2;

    const totalDotSpan = (subBoxes.length - 1) * dotSpacing;
    const dotStartY = mainCenterY - totalDotSpan / 2;

    let connectorSvg = '';
    let subBoxesSvg = '';

    for (let i = 0; i < subBoxes.length; i++) {
      const h = subHeights[i];
      const pillY = currentSubY;
      const pillCenterY = pillY + h / 2;
      const yDot = dotStartY + i * dotSpacing;

      const item = subBoxes[i];
      const pillBgColor =
        (layout.individualPillColor && item.customPillColor) ||
        colors.pillBg;
      const rawPillText = item.content || item.title || '';
      const displayContent = applyTextCaseTransform(
        rawPillText,
        caseSettings.bodyCase !== 'none'
          ? caseSettings.bodyCase
          : caseSettings.pillTitleCase
      );

      const numberLabel = getStyle2ItemNumberLabel(
        i,
        numberingType,
        layout.style2Separator || '.',
        layout.style2StartFrom || '1',
        item.customNumber
      );

      // Target coordinate for connector line
      let xTarget = subStartX;
      let yTarget = pillCenterY;

      if (hasNumbers) {
        const circleCenterX = subStartX + circleRadius;
        const circleCenterY = pillCenterY;
        xTarget = circleCenterX - circleRadius;
        yTarget = circleCenterY;
      }

      // Connector dot on right edge of main box
      connectorSvg += `<circle cx="${mainEdgeX}" cy="${yDot}" r="${dotRadius}" fill="${colors.connectorColor}" />\n  `;
      // Straight oblique line
      connectorSvg += connectorStrokeSvg(
        `M ${mainEdgeX} ${yDot} L ${xTarget} ${yTarget}`,
        `<line x1="${mainEdgeX}" y1="${yDot}" x2="${xTarget}" y2="${yTarget}" stroke="${colors.connectorColor}" stroke-width="${connectorThickness}" stroke-linecap="round" />\n  `,
        colors.connectorColor,
        connectorThickness,
        layout.connectorProfile
      );

      // Sub box item SVG
      const pillLeft = hasNumbers ? subStartX + circleRadius * 0.9 : subStartX;
      const pillWidth = subWidth;
      const pillHeight = h;
      const textX = hasNumbers ? subStartX + circleSize + 14 : subStartX + 20;

      const bodyTextSvg = renderSvgWrappedText(
        displayContent,
        pillWidth - (hasNumbers ? circleSize + 28 : 40),
        layout.fontSizeBody,
        textX,
        pillCenterY - ((displayContent.length > 50 ? 1 : 0) * 8) + 5,
        layout.fontSizeBody * 1.45,
        colors.pillText,
        500,
        'start'
      );

      let circleSvg = '';
      if (hasNumbers) {
        const circleCenterX = subStartX + circleRadius;
        const circleCenterY = pillCenterY;
        const circleFontSize = Math.round(circleSize * 0.4);

        circleSvg = `
        <!-- Lingkaran Nomor di Depan Pill -->
        <circle cx="${circleCenterX}" cy="${circleCenterY}" r="${circleRadius}" fill="${colors.numberCircleBg || '#ffffff'}" stroke="${spStr(colors.numberCircleBorder || '#3a3a3a', shapeProfile)}" stroke-width="2.5" />
        ${profileShapeSvg('circle', circleCenterX - circleRadius, circleCenterY - circleRadius, circleRadius * 2, circleRadius * 2, circleRadius, 2.5, colors.numberCircleBorder || '#3a3a3a', shapeProfile)}
        <text x="${circleCenterX}" y="${circleCenterY + circleFontSize * 0.35}" text-anchor="middle" font-family="'Rubik', sans-serif" font-size="${circleFontSize}px" font-weight="700" fill="${colors.numberCircleText || '#2e2e2e'}">
          ${escapeXml(numberLabel)}
        </text>`;
      }

      const rLeft = Math.min(
        layout.style2PillRadiusLeft !== undefined
          ? layout.style2PillRadiusLeft
          : 15,
        pillHeight / 2
      );
      const rRight = pillHeight / 2;
      const pillPath = `M ${pillLeft + rLeft} ${pillY} L ${pillLeft + pillWidth - rRight} ${pillY} A ${rRight} ${rRight} 0 0 1 ${pillLeft + pillWidth} ${pillY + rRight} L ${pillLeft + pillWidth} ${pillY + pillHeight - rRight} A ${rRight} ${rRight} 0 0 1 ${pillLeft + pillWidth - rRight} ${pillY + pillHeight} L ${pillLeft + rLeft} ${pillY + pillHeight} A ${rLeft} ${rLeft} 0 0 1 ${pillLeft} ${pillY + pillHeight - rLeft} L ${pillLeft} ${pillY + rLeft} A ${rLeft} ${rLeft} 0 0 1 ${pillLeft + rLeft} ${pillY} Z`;

      subBoxesSvg += `
      <g id="s2-sub-${i + 1}">
        <!-- Pill Background Path (Rounded 15px on left, fully rounded on right) -->
        <path d="${pillPath}" fill="${pillBgColor}" stroke="${spStr(colors.pillBorder || '#3a3a3a', shapeProfile)}" stroke-width="${pillBorderWidth}" />
        ${profileClosedPathSvg(pillPath, pillBorderWidth, colors.pillBorder || '#3a3a3a', shapeProfile)}
        <!-- Pill Text -->
        ${bodyTextSvg}
        ${circleSvg}
      </g>
      `;

      currentSubY += h + gap;
    }

    // Main Box Native SVG
    let mainBoxSvg = '';
    if (layout.showDoubleFrame) {
      mainBoxSvg += `
      <!-- Outer Double Frame with WHITE fill and border -->
      <rect x="${startX - 12}" y="${mainY - 12}" width="${mainWidth + 24}" height="${mainHeight + 24}" rx="${layout.borderRadius + 8}" fill="${colors.mainBoxOuterBg || '#ffffff'}" stroke="${spStr(colors.mainBoxOuterBorder, shapeProfile)}" stroke-width="1.2" />
      ${profileShapeSvg('rect', startX - 12, mainY - 12, mainWidth + 24, mainHeight + 24, layout.borderRadius + 8, 1.2, colors.mainBoxOuterBorder, shapeProfile)}
      `;
    }

    const mainFontSize = layout.fontSizeMain || 24;
    const mainLineHeight = mainFontSize * 1.3;
    const mainTextLines = splitTextIntoLines(
      transformedMainTitle,
      mainWidth - 36,
      mainFontSize,
      600
    );
    const totalMainTextHeight = (mainTextLines.length - 1) * mainLineHeight;
    const mainTextStartY =
      mainCenterY - totalMainTextHeight / 2 + mainFontSize * 0.35;

    const mainTspans = mainTextLines
      .map((line, idx) => {
        const yAttr = idx === 0 ? `y="${mainTextStartY}"` : '';
        const dyAttr = idx === 0 ? '' : `dy="${mainLineHeight}px"`;
        return `<tspan x="${startX + mainWidth / 2}" ${yAttr} ${dyAttr}>${escapeXml(line)}</tspan>`;
      })
      .join('\n        ');

    mainBoxSvg += `
      <!-- Main Box Container -->
      <rect x="${startX}" y="${mainY}" width="${mainWidth}" height="${mainHeight}" rx="${layout.borderRadius}" fill="${colors.mainBoxBg}" />
      
      <!-- Native Vector Text inside Main Box -->
      <text x="${startX + mainWidth / 2}" y="${mainTextStartY}" text-anchor="middle" font-family="'Rubik', system-ui, -apple-system, sans-serif" font-size="${mainFontSize}px" font-weight="600" fill="${colors.mainBoxText}">
        ${mainTspans}
      </text>
    `;

    svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgWidth} ${svgHeight}" width="${svgWidth}" height="${svgHeight}">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;600;700&amp;display=swap');
      text {
        font-family: 'Rubik', system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
    </style>
  </defs>
  <!-- Oblique Connectors -->
  ${connectorSvg}
  <!-- Main Box -->
  ${mainBoxSvg}
  <!-- Style 2 Sub Boxes (Pills & Numbers) -->
  ${subBoxesSvg}
</svg>`;
  } else {
    // ==========================================
    // STYLE 1: KOTAK JUDUL PILL SVG EXPORT
    // ==========================================
    const subHeights = subBoxes.map((item) => {
      const charsPerLine = Math.floor(
        subWidth / (layout.fontSizeBody * 0.52)
      );
      const content = applyTextCaseTransform(
        item.content,
        caseSettings.bodyCase
      );
      const lines = Math.ceil(content.length / charsPerLine) || 1;
      return Math.max(90, 48 + lines * (layout.fontSizeBody * 1.45));
    });

    const totalSubHeight =
      subHeights.reduce((acc, h) => acc + h, 0) +
      (subBoxes.length - 1) * gap;
    const svgHeight = Math.max(totalSubHeight + 100, mainHeight + 120);
    const svgWidth = layout.diagramPadding * 2 + mainWidth + 60 + subWidth + 80;

    const startX = layout.diagramPadding + (layout.showDoubleFrame ? 14 : 0);
    const mainY = (svgHeight - mainHeight) / 2 + (layout.mainBoxOffsetY || 0);

    const trunkX =
      startX + mainWidth + (layout.showDoubleFrame ? 26 : 10) + 40;
    const subStartX = trunkX + 44;

    let currentSubY = (svgHeight - totalSubHeight) / 2;
    const targets: {
      y: number;
      height: number;
      title: string;
      content: string;
      pillColor: string;
      hidePill?: boolean;
    }[] = [];

    for (let i = 0; i < subBoxes.length; i++) {
      const h = subHeights[i];
      targets.push({
        y: currentSubY,
        height: h,
        title: applyTextCaseTransform(
          subBoxes[i].title,
          caseSettings.pillTitleCase
        ),
        content: applyTextCaseTransform(
          subBoxes[i].content,
          caseSettings.bodyCase
        ),
        pillColor:
          (layout.individualPillColor && subBoxes[i].customPillColor) ||
          colors.pillBg,
        hidePill: subBoxes[i].hidePill,
      });
      currentSubY += h + gap;
    }

    const mainCenterY = mainY + mainHeight / 2;
    const mainEdgeX =
      startX + mainWidth + (layout.showDoubleFrame ? 24 : 0);

    // SVG Paths
    let connectorPaths = '';
    connectorPaths += `<circle cx="${mainEdgeX}" cy="${mainCenterY}" r="${dotRadius}" fill="${colors.connectorColor}" />\n  `;
    connectorPaths += connectorStrokeSvg(
      `M ${mainEdgeX} ${mainCenterY} L ${trunkX} ${mainCenterY}`,
      `<line x1="${mainEdgeX}" y1="${mainCenterY}" x2="${trunkX}" y2="${mainCenterY}" stroke="${colors.connectorColor}" stroke-width="${connectorThickness}" stroke-linecap="round" />\n  `,
      colors.connectorColor,
      connectorThickness,
      layout.connectorProfile
    );
    connectorPaths += `<circle cx="${trunkX}" cy="${mainCenterY}" r="${dotRadius}" fill="${colors.connectorColor}" />\n  `;

    const r = 16;
    for (let i = 0; i < targets.length; i++) {
      const t = targets[i];
      const targetCenterY = t.y + t.height / 2;
      const targetX = subStartX;

      if (Math.abs(targetCenterY - mainCenterY) < 3) {
        connectorPaths += connectorStrokeSvg(
          `M ${trunkX} ${targetCenterY} L ${targetX} ${targetCenterY}`,
          `<line x1="${trunkX}" y1="${targetCenterY}" x2="${targetX}" y2="${targetCenterY}" stroke="${colors.connectorColor}" stroke-width="${connectorThickness}" stroke-linecap="round" />\n  `,
          colors.connectorColor,
          connectorThickness,
          layout.connectorProfile
        );
      } else if (targetCenterY < mainCenterY) {
        connectorPaths += connectorStrokeSvg(
          `M ${trunkX} ${mainCenterY} L ${trunkX} ${targetCenterY + r} Q ${trunkX} ${targetCenterY} ${trunkX + r} ${targetCenterY} L ${targetX} ${targetCenterY}`,
          `<path d="M ${trunkX} ${mainCenterY} L ${trunkX} ${targetCenterY + r} Q ${trunkX} ${targetCenterY} ${trunkX + r} ${targetCenterY} L ${targetX} ${targetCenterY}" fill="none" stroke="${colors.connectorColor}" stroke-width="${connectorThickness}" stroke-linecap="round" />\n  `,
          colors.connectorColor,
          connectorThickness,
          layout.connectorProfile
        );
      } else {
        connectorPaths += connectorStrokeSvg(
          `M ${trunkX} ${mainCenterY} L ${trunkX} ${targetCenterY - r} Q ${trunkX} ${targetCenterY} ${trunkX + r} ${targetCenterY} L ${targetX} ${targetCenterY}`,
          `<path d="M ${trunkX} ${mainCenterY} L ${trunkX} ${targetCenterY - r} Q ${trunkX} ${targetCenterY} ${trunkX + r} ${targetCenterY} L ${targetX} ${targetCenterY}" fill="none" stroke="${colors.connectorColor}" stroke-width="${connectorThickness}" stroke-linecap="round" />\n  `,
          colors.connectorColor,
          connectorThickness,
          layout.connectorProfile
        );
      }

      connectorPaths += `<circle cx="${targetX}" cy="${targetCenterY}" r="${dotRadius}" fill="${colors.connectorColor}" />\n  `;
    }

    // Sub boxes
    let subBoxesSvg = '';
    for (let i = 0; i < targets.length; i++) {
      const t = targets[i];
      const pillFontSize = layout.fontSizePill || 15;
      const pillWidth = Math.max(
        90,
        t.title.length * (pillFontSize * 0.65) + 32
      );
      const pillHeight = pillFontSize + 16;
      const pillY = t.y - pillHeight / 2;
      const pillOffset =
        layout.pillOffsetX !== undefined ? layout.pillOffsetX : 24;
      const pillX = subStartX + pillOffset;
      const isPillVisible =
        layout.showPillLabels !== false && !t.hidePill;

      const bodyTextSvg = renderSvgWrappedText(
        t.content,
        subWidth - 44,
        layout.fontSizeBody,
        subStartX + 22,
        isPillVisible ? t.y + 36 : t.y + 26,
        layout.fontSizeBody * 1.45,
        colors.subBoxText,
        400,
        'start'
      );

      const pillSvg = isPillVisible
        ? `
        <!-- Pill Title Badge with Border Line -->
        <rect x="${pillX}" y="${pillY}" width="${pillWidth}" height="${pillHeight}" rx="${pillHeight / 2}" fill="${t.pillColor}" stroke="${spStr(colors.pillBorder || '#3a3a3a', shapeProfile)}" stroke-width="${pillBorderWidth}" />
        ${profileShapeSvg('pill', pillX, pillY, pillWidth, pillHeight, pillHeight / 2, pillBorderWidth, colors.pillBorder || '#3a3a3a', shapeProfile)}
        
        <!-- Native Pill Title Text -->
        <text x="${pillX + pillWidth / 2}" y="${pillY + pillHeight / 2 + 5}" text-anchor="middle" fill="${colors.pillText}" font-family="'Rubik', system-ui, -apple-system, sans-serif" font-size="${pillFontSize}px" font-weight="600">
          ${escapeXml(t.title)}
        </text>`
        : '';

      subBoxesSvg += `
      <g id="sub-box-${i + 1}">
        <!-- Sub Box Rect -->
        <rect x="${subStartX}" y="${t.y}" width="${subWidth}" height="${t.height}" rx="${layout.borderRadius}" fill="${colors.subBoxBg}" stroke="${spStr(colors.subBoxBorder, shapeProfile)}" stroke-width="${subBoxBorderWidth}" />
        ${profileShapeSvg('rect', subStartX, t.y, subWidth, t.height, layout.borderRadius, subBoxBorderWidth, colors.subBoxBorder, shapeProfile)}
        
        <!-- Native Vector Text inside Sub Box -->
        ${bodyTextSvg}
        ${pillSvg}
      </g>
      `;
    }

    // Main Box Native SVG
    let mainBoxSvg = '';
    if (layout.showDoubleFrame) {
      mainBoxSvg += `
      <!-- Outer Double Frame with WHITE fill and border -->
      <rect x="${startX - 12}" y="${mainY - 12}" width="${mainWidth + 24}" height="${mainHeight + 24}" rx="${layout.borderRadius + 8}" fill="${colors.mainBoxOuterBg || '#ffffff'}" stroke="${spStr(colors.mainBoxOuterBorder, shapeProfile)}" stroke-width="1.2" />
      ${profileShapeSvg('rect', startX - 12, mainY - 12, mainWidth + 24, mainHeight + 24, layout.borderRadius + 8, 1.2, colors.mainBoxOuterBorder, shapeProfile)}
      `;
    }

    const mainFontSize = layout.fontSizeMain || 24;
    const mainLineHeight = mainFontSize * 1.3;
    const mainTextLines = splitTextIntoLines(
      transformedMainTitle,
      mainWidth - 36,
      mainFontSize,
      600
    );
    const totalMainTextHeight = (mainTextLines.length - 1) * mainLineHeight;
    const mainTextStartY =
      mainCenterY - totalMainTextHeight / 2 + mainFontSize * 0.35;

    const mainTspans = mainTextLines
      .map((line, idx) => {
        const yAttr = idx === 0 ? `y="${mainTextStartY}"` : '';
        const dyAttr = idx === 0 ? '' : `dy="${mainLineHeight}px"`;
        return `<tspan x="${startX + mainWidth / 2}" ${yAttr} ${dyAttr}>${escapeXml(line)}</tspan>`;
      })
      .join('\n        ');

    mainBoxSvg += `
      <!-- Main Box Container -->
      <rect x="${startX}" y="${mainY}" width="${mainWidth}" height="${mainHeight}" rx="${layout.borderRadius}" fill="${colors.mainBoxBg}" />
      
      <!-- Native Vector Text inside Main Box -->
      <text x="${startX + mainWidth / 2}" y="${mainTextStartY}" text-anchor="middle" font-family="'Rubik', system-ui, -apple-system, sans-serif" font-size="${mainFontSize}px" font-weight="600" fill="${colors.mainBoxText}">
        ${mainTspans}
      </text>
    `;

    svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgWidth} ${svgHeight}" width="${svgWidth}" height="${svgHeight}">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;600;700&amp;display=swap');
      text {
        font-family: 'Rubik', system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
    </style>
  </defs>
  <!-- Connectors -->
  ${connectorPaths}
  <!-- Main Box -->
  ${mainBoxSvg}
  <!-- Sub Boxes -->
  ${subBoxesSvg}
</svg>`;
  }

  return svgContent;
}

/** Bangun isi SVG sebagai teks (tanpa menyimpan berkas). */
export function buildSvgString(
  args: Parameters<typeof exportAsSvg>
): string {
  return exportAsSvg(...args);
}

/** Unduh teks SVG lewat unduhan biasa (folder Unduhan browser). */
export function downloadSvgString(svg: string, filename?: string): void {
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = `${filename || 'bagan-maker'}.svg`;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

/** Simpan teks SVG ke file handle pilihan pengguna (Save As). */
export async function saveSvgToFileHandle(
  svg: string,
  handle: SaveFileHandle,
  /**
   * Stream tulis yang SUDAH dibuka pemanggil tepat setelah dialog pemilih
   * ditutup. `createWritable()` mensyaratkan transient user activation, jadi
   * membukanya di sini (setelah `buildSvg()` yang memakan waktu) akan ditolak
   * Chrome dengan NotAllowedError dan meninggalkan berkas 0 byte.
   */
  preopenedWritable?: FileWritable
): Promise<void> {
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  console.info('[SVG] panjang teks:', svg.length, '| ukuran blob:', blob.size);
  if (!blob.size) throw new Error('isi SVG kosong');

  const writable = preopenedWritable ?? (await handle.createWritable());
  console.info('[SVG] stream tulis:', preopenedWritable ? 'dari pemanggil' : 'baru dibuat');

  try {
    const written = await writable.write(blob);
    console.info('[SVG] write() selesai:', written === undefined ? '(void)' : String(written));
    await writable.close();
    console.info('[SVG] close() selesai — perubahan seharusnya sudah tersimpan');
  } catch (error) {
    console.error('[SVG] write/close GAGAL:', error);
    try {
      await writable.abort();
      console.warn('[SVG] abort() dipanggil — berkas tidak jadi ditulis');
    } catch {
      /* diabaikan */
    }
    throw error;
  }

  // Verifikasi: sebagian lingkungan melaporkan "sukses" tetapi berkas kosong.
  if (typeof handle.getFile === 'function') {
    const saved = await handle.getFile();
    console.info('[SVG] ukuran berkas di disk setelah simpan:', saved.size, 'byte');
    if (saved && saved.size === 0) {
      // Coba sekali lagi dengan stream baru sebelum menyerah.
      console.warn('[SVG] berkas 0 byte — mencoba tulis ulang dengan stream baru…');
      const retry = await handle.createWritable();
      try {
        await retry.write(blob);
        await retry.close();
      } catch (retryError) {
        try {
          await retry.abort();
        } catch {
          /* diabaikan */
        }
        throw retryError;
      }
      const again = await handle.getFile();
      console.info('[SVG] ukuran setelah tulis ulang:', again.size, 'byte');
      if (!again || again.size === 0) {
        throw new Error('berkas tersimpan tetapi kosong (0 byte)');
      }
    }
  }
}

/** Jenis berkas SVG untuk dialog pemilih lokasi. */
export const SVG_FILE_TYPE: {
  description: string;
  accept: Record<string, string[]>;
} = {
  description: 'Gambar vektor SVG',
  accept: { 'image/svg+xml': ['.svg'] },
};

function splitTextIntoLines(
  text: string,
  maxWidth: number,
  fontSize: number,
  weight: number
): string[] {
  const charWidthRatio = weight >= 600 ? 0.6 : 0.52;
  const maxChars = Math.max(
    6,
    Math.floor(maxWidth / (fontSize * charWidthRatio))
  );
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const w of words) {
    if (!w) continue;
    if (!current) {
      current = w;
    } else if ((current + ' ' + w).length <= maxChars) {
      current += ' ' + w;
    } else {
      lines.push(current);
      current = w;
    }
  }
  if (current) lines.push(current);
  return lines.length > 0 ? lines : [text];
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
