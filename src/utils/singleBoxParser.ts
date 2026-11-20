import {
  Style3QuestionData,
  Style5Data,
  Style5PointItem,
  SubBoxItem,
} from '../types';

/**
 * ========================================================
 * GAYA 2 & 4: SERIALIZER & PARSER
 * ========================================================
 */

/**
 * Serializes an array of SubBoxItem into a single string formatted like:
 * "1. Saham | 2. Obligasi | 3. Reksadana | 4. Saham | 5. Warrant | 6. Right | 7. Opsi/Option | 8. Warrant"
 */
export function serializeSubBoxesToSingleString(subBoxes: SubBoxItem[]): string {
  if (!subBoxes || subBoxes.length === 0) return '';
  return subBoxes
    .map((item, idx) => {
      const num =
        item.customNumber !== undefined && item.customNumber !== ''
          ? item.customNumber
          : `${idx + 1}`;
      const text =
        item.content !== undefined && item.content !== ''
          ? item.content
          : item.title || '';
      return num ? `${num}. ${text}` : text;
    })
    .join(' | ');
}

/**
 * Parses a single string containing multiple pill sub-box items and white circle numbers.
 * Supports:
 * - Separated by "|" or newlines (\n)
 * - Numbering prefix: "1. Teks", "1) Teks", "1 - Teks", "1: Teks", "[1] Teks", "A. Teks", "I. Teks"
 * - Plain items: "Teks" (will have blank or auto number)
 * - Up to maxCount (default 16)
 * - Automatically balances left and right sides
 */
export function parseSingleStringToSubBoxes(
  raw: string,
  existingSubs: SubBoxItem[] = [],
  maxCount: number = 16
): SubBoxItem[] {
  if (!raw || !raw.trim()) return [];

  // Split by newlines first, then by pipe "|"
  const rawSegments: string[] = [];
  const lines = raw.split(/\r?\n/);
  for (const line of lines) {
    if (line.includes('|')) {
      const parts = line.split('|');
      for (const p of parts) {
        if (p.trim()) rawSegments.push(p.trim());
      }
    } else if (line.trim()) {
      rawSegments.push(line.trim());
    }
  }

  // Cap at maxCount (up to 16)
  const sliced = rawSegments.slice(0, maxCount);
  if (sliced.length === 0) return [];

  const total = sliced.length;
  const half = Math.ceil(total / 2);

  const parsedItems: SubBoxItem[] = sliced.map((seg, idx) => {
    // Regex for: "1. Teks", "1) Teks", "1 - Teks", "1: Teks", "[1] Teks", "A. Teks"
    const bracketMatch = seg.match(/^\[([0-9a-zA-Z]+)\]\s*(.*)$/);
    const standardMatch = seg.match(
      /^([0-9]{1,4}|[a-zA-Z]{1,3}|[ivxlcdmIVXLCDM]{1,6})[\.\)\:\-\]]\s*(.*)$/
    );

    let num = '';
    let text = seg;

    if (bracketMatch) {
      num = bracketMatch[1].trim();
      text = bracketMatch[2].trim();
    } else if (standardMatch) {
      num = standardMatch[1].trim();
      text = standardMatch[2].trim();
    } else {
      // Check if user separated with simple space after digits e.g. "1 Saham"
      const simpleNumMatch = seg.match(/^([0-9]{1,3})\s+(.+)$/);
      if (simpleNumMatch) {
        num = simpleNumMatch[1].trim();
        text = simpleNumMatch[2].trim();
      } else {
        num = '';
        text = seg.trim();
      }
    }

    const existing = existingSubs[idx];
    const id =
      existing?.id ||
      `sub-${Date.now()}-${idx + 1}-${Math.random().toString(36).substr(2, 4)}`;
    const side = idx < half ? 'left' : 'right';

    return {
      id,
      title: text,
      content: text,
      customNumber: num,
      side,
      customPillColor: existing?.customPillColor,
    };
  });

  return parsedItems;
}

export const SAMPLE_8_INSTRUMEN =
  '1. Saham | 2. Obligasi | 3. Reksadana | 4. Saham | 5. Warrant | 6. Right | 7. Opsi/Option | 8. Warrant';

export const SAMPLE_16_INSTRUMEN =
  '1. Saham | 2. Obligasi Korporasi | 3. Reksa Dana Pasar Uang | 4. Sukuk Negara | 5. Surat Berharga Negara | 6. Waran Terstruktur | 7. Right Issue | 8. Opsi / Option | 9. DIRE Properti | 10. DINFRA Infrastruktur | 11. Efek Beragun Aset | 12. Obligasi Ritel ORI | 13. Sukuk Tabungan | 14. Deposito Berjangka | 15. Emas Digital | 16. Unit Link';

/**
 * ========================================================
 * GAYA 1: QUICK INPUT DENGAN PEMISAH |
 * Format:
 * Baris 1: Judul Utama
 * Baris berikutnya: Judul Pill | Isi Teks
 * ========================================================
 */
export function serializeStyle1ToQuickText(
  mainTitle: string,
  subBoxes: SubBoxItem[]
): string {
  const lines: string[] = [mainTitle || 'Keuntungan saham'];
  subBoxes.forEach((s) => {
    const pill = s.title || '';
    const body = s.content || '';
    lines.push(`${pill} | ${body}`);
  });
  return lines.join('\n');
}

export function parseStyle1QuickText(
  rawText: string,
  existingSubs: SubBoxItem[] = [],
  mode: 'replace' | 'append' = 'replace'
): { mainTitle: string; subBoxes: SubBoxItem[] } {
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) {
    return { mainTitle: '', subBoxes: existingSubs };
  }

  const mainTitle = lines[0];
  const newSubs: SubBoxItem[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const parts = line.split('|').map((p) => p.trim());
    const title = parts[0] || `Sub Box ${i}`;
    const content = parts[1] || title;
    newSubs.push({
      id: `s1-sub-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
      title,
      content,
    });
  }

  if (mode === 'append') {
    return {
      mainTitle: mainTitle || undefined as any,
      subBoxes: [...existingSubs, ...newSubs].slice(0, 8),
    };
  }

  return {
    mainTitle,
    subBoxes: newSubs.length > 0 ? newSubs.slice(0, 8) : existingSubs,
  };
}

/**
 * ========================================================
 * GAYA 3: QUICK INPUT DENGAN PEMISAH |
 * Format:
 * Label Pill | Teks Soal | Pilihan A ; B ; C ; D | Penjelasan
 * ========================================================
 */
export function serializeStyle3ToQuickPipeText(data: Style3QuestionData): string {
  const pill = data.questionPillLabel || 'Question No. 2';
  const question = data.questionText || '';
  const choices = (data.choices || []).join(' ; ');
  const explanation = data.explanationText || '';
  return `${pill} | ${question} | ${choices} | ${explanation}`;
}

export function parseStyle3QuickPipeText(
  rawText: string,
  existingData: Style3QuestionData
): Style3QuestionData {
  const trimmed = rawText.trim();
  if (!trimmed) return existingData;

  const parts = trimmed.split('|').map((p) => p.trim());
  const pill = parts[0] || existingData.questionPillLabel;
  const question = parts[1] || existingData.questionText;

  let choices = existingData.choices;
  if (parts[2]) {
    // split by ';' or ','
    const rawChoices = parts[2].split(/[;]/).map((c) => c.trim()).filter(Boolean);
    if (rawChoices.length > 0) {
      choices = rawChoices.map((c) =>
        c.replace(/^([a-zA-Z0-9ivxlcdmIVXLCDM]+[\.\)]|[-*•])\s*/, '').trim()
      );
    }
  }

  const explanation = parts[3] !== undefined ? parts[3] : existingData.explanationText;

  return {
    ...existingData,
    questionPillLabel: pill,
    questionText: question,
    choices,
    explanationText: explanation,
  };
}

/**
 * ========================================================
 * GAYA 5: QUICK INPUT DENGAN PEMISAH |
 * Format:
 * Baris 1: Nomor Header | Judul Header | Nama Tokoh (opsional)
 * Baris berikutnya: Nomor | Teks Pill | Teks Deskripsi
 * (Atau jika nomor dilewati: Teks Pill | Teks Deskripsi)
 * (Atau jika hanya 1 bagian: Teks Pill)
 * ========================================================
 */
export function serializeStyle5ToQuickText(data: Style5Data): string {
  const lines: string[] = [];
  // Line 1: Header Number | Header Title | Name
  const hNum = data.header.number || '03';
  const hTitle = data.header.title || '';
  const name = data.sidebar.name || '';
  if (name) {
    lines.push(`${hNum} | ${hTitle} | ${name}`);
  } else {
    lines.push(`${hNum} | ${hTitle}`);
  }

  // Next lines: Points
  data.points.forEach((pt, idx) => {
    const num = pt.number || (idx + 1 < 10 ? `0${idx + 1}` : `${idx + 1}`);
    const pill = pt.pillText || '';
    const desc = pt.descriptionText || '';
    if (pt.mode === 'pill-only' || !desc) {
      lines.push(`${num} | ${pill}`);
    } else {
      lines.push(`${num} | ${pill} | ${desc}`);
    }
  });

  return lines.join('\n');
}

export function parseStyle5QuickText(
  rawText: string,
  existingData: Style5Data,
  mode: 'replace' | 'append' = 'replace'
): Style5Data {
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return existingData;

  // Line 1: Header / Name
  const line1Parts = lines[0].split('|').map((p) => p.trim());
  let newHeaderNumber = existingData.header.number;
  let newHeaderTitle = existingData.header.title;
  let newSidebarName = existingData.sidebar.name;

  if (line1Parts.length === 1) {
    newHeaderTitle = line1Parts[0];
  } else if (line1Parts.length === 2) {
    // Bisa Nomor | Judul atau Judul | Nama
    if (/^\d+$/.test(line1Parts[0]) || line1Parts[0].length <= 4) {
      newHeaderNumber = line1Parts[0];
      newHeaderTitle = line1Parts[1];
    } else {
      newHeaderTitle = line1Parts[0];
      newSidebarName = line1Parts[1];
    }
  } else if (line1Parts.length >= 3) {
    newHeaderNumber = line1Parts[0];
    newHeaderTitle = line1Parts[1];
    newSidebarName = line1Parts[2];
  }

  const parsedPoints: Style5PointItem[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const parts = line.split('|').map((p) => p.trim());
    let ptNum = '';
    let pillText = '';
    let descText = '';
    let ptMode: 'both' | 'pill-only' | 'desc-only' = 'both';

    if (parts.length === 1) {
      // Hanya 1 bagian: Pill saja
      pillText = parts[0];
      ptMode = 'pill-only';
      ptNum = i < 10 ? `0${i}` : `${i}`;
    } else if (parts.length === 2) {
      // 2 bagian: bisa [Nomor | Pill] ATAU [Pill | Deskripsi]
      if (/^\d{1,3}$/.test(parts[0]) || /^[a-zA-Z]$/.test(parts[0])) {
        ptNum = parts[0];
        pillText = parts[1];
        ptMode = 'pill-only';
      } else {
        ptNum = i < 10 ? `0${i}` : `${i}`;
        pillText = parts[0];
        descText = parts[1];
        ptMode = 'both';
      }
    } else if (parts.length >= 3) {
      // 3 bagian: [Nomor | Pill | Deskripsi]
      ptNum = parts[0];
      pillText = parts[1];
      descText = parts[2];
      ptMode = 'both';
    }

    parsedPoints.push({
      id: `s5-p-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
      number: ptNum,
      pillText,
      descriptionText: descText,
      mode: ptMode,
      hideNumberBox: false,
    });
  }

  // Batasi hingga 8 poin
  let finalPoints = parsedPoints.slice(0, 8);
  if (mode === 'append') {
    finalPoints = [...existingData.points, ...parsedPoints].slice(0, 8);
  } else if (finalPoints.length === 0) {
    finalPoints = existingData.points;
  }

  return {
    ...existingData,
    header: {
      ...existingData.header,
      number: newHeaderNumber,
      title: newHeaderTitle,
    },
    sidebar: {
      ...existingData.sidebar,
      name: newSidebarName,
    },
    points: finalPoints,
  };
}

/**
 * ========================================================
 * GAYA 2 & 4: QUICK INPUT DENGAN PEMISAH |
 * Format:
 * Baris 1: Judul Utama
 * Baris berikutnya: Teks Sub Box ATAU Nomor | Teks
 * ========================================================
 */
export function serializeStyle2ToQuickText(
  mainTitle: string,
  subBoxes: SubBoxItem[]
): string {
  const lines: string[] = [mainTitle || 'Jenis-jenis reksa dana'];
  subBoxes.forEach((s, idx) => {
    const num = s.customNumber || `${idx + 1}`;
    const text = s.content || s.title || '';
    lines.push(`${num} | ${text}`);
  });
  return lines.join('\n');
}

export function parseStyle2QuickText(
  rawText: string,
  existingSubs: SubBoxItem[] = [],
  mode: 'replace' | 'append' = 'replace',
  maxCount: number = 8
): { mainTitle: string; subBoxes: SubBoxItem[] } {
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) {
    return { mainTitle: '', subBoxes: existingSubs };
  }

  const mainTitle = lines[0];
  const newSubs: SubBoxItem[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    let num = '';
    let text = line;
    if (line.includes('|')) {
      const parts = line.split('|').map((p) => p.trim());
      num = parts[0];
      text = parts.slice(1).join(' | ');
    } else {
      const match = line.match(/^(\d+[\.\)]|[a-zA-Z][\.\)])\s*(.*)$/);
      if (match) {
        num = match[1].replace(/[\.\)]/, '');
        text = match[2];
      }
    }
    const idx = newSubs.length;
    newSubs.push({
      id: `s2-sub-${Date.now()}-${idx + 1}-${Math.random().toString(36).substr(2, 4)}`,
      title: text,
      content: text,
      customNumber: num || `${idx + 1}`,
    });
  }

  if (mode === 'append') {
    return {
      mainTitle: mainTitle || '',
      subBoxes: [...existingSubs, ...newSubs].slice(0, maxCount),
    };
  }

  return {
    mainTitle,
    subBoxes: newSubs.length > 0 ? newSubs.slice(0, maxCount) : existingSubs,
  };
}

