import {
  ChoiceNumberingType,
  ChoiceSeparator,
  NumberingSeparator,
  NumberingType,
  Style3QuestionData,
  Style5NumberingType,
  TextCaseType,
} from '../types';

export type CaseType = 'sentence' | 'title' | 'upper' | 'lower';

/**
 * Mengubah teks menjadi Sentence case:
 * Huruf pertama kalimat menjadi kapital, sisanya huruf kecil.
 * Mendukung beberapa kalimat yang dipisahkan oleh tanda titik (.), tanda seru (!), tanda tanya (?), atau baris baru (\n).
 */
export function toSentenceCase(text: string): string {
  if (!text) return '';
  const lower = text.toLowerCase();
  return lower.replace(/(^\s*|[.!?\n]\s+)([a-z\u00E0-\u00FC])/gi, (_match, prefix, char) => {
    return prefix + char.toUpperCase();
  });
}

/**
 * Mengubah teks menjadi Title Case:
 * Huruf pertama tiap kata menjadi kapital.
 */
export function toTitleCase(text: string): string {
  if (!text) return '';
  return text.toLowerCase().replace(/(?:^|\s|-|\/)[a-z\u00E0-\u00FC]/gi, (match) => match.toUpperCase());
}

/**
 * Mengubah teks menjadi UPPERCASE:
 * Semua huruf menjadi kapital.
 */
export function toUpperCase(text: string): string {
  if (!text) return '';
  return text.toUpperCase();
}

/**
 * Mengubah teks menjadi lowercase:
 * Semua huruf menjadi kecil.
 */
export function toLowerCase(text: string): string {
  if (!text) return '';
  return text.toLowerCase();
}

/**
 * Mengubah teks menjadi tOGGLE cASE:
 * Huruf besar menjadi kecil, huruf kecil menjadi besar.
 */
export function toToggleCase(text: string): string {
  if (!text) return '';
  return text
    .split('')
    .map((char) => {
      if (char === char.toUpperCase()) {
        return char.toLowerCase();
      }
      return char.toUpperCase();
    })
    .join('');
}

/**
 * Menerapkan jenis format huruf sesuai pilihan (termasuk 'none' dan 'toggle')
 */
export function applyTextCaseTransform(text: string, caseType: TextCaseType): string {
  switch (caseType) {
    case 'upper':
      return toUpperCase(text);
    case 'lower':
      return toLowerCase(text);
    case 'title':
      return toTitleCase(text);
    case 'sentence':
      return toSentenceCase(text);
    case 'toggle':
      return toToggleCase(text);
    case 'none':
    default:
      return text;
  }
}

/**
 * Alias untuk backward compatibility
 */
export function applyTextCase(text: string, caseType: CaseType): string {
  return applyTextCaseTransform(text, caseType);
}

/**
 * Konversi angka ke Angka Romawi (I, II, III, IV, ...)
 */
export function toRoman(num: number): string {
  if (num < 1) return 'I';
  const lookup: [number, string][] = [
    [1000, 'M'],
    [900, 'CM'],
    [500, 'D'],
    [400, 'CD'],
    [100, 'C'],
    [90, 'XC'],
    [50, 'L'],
    [40, 'XL'],
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
  ];
  let roman = '';
  let n = num;
  for (const [val, str] of lookup) {
    while (n >= val) {
      roman += str;
      n -= val;
    }
  }
  return roman || 'I';
}

/**
 * Menghasilkan label penomoran untuk Gaya 2 berdasarkan tipe, separator, dan indeks
 */
export function getStyle2ItemNumberLabel(
  index: number,
  numberingType: NumberingType,
  separator: NumberingSeparator,
  startFrom: string = '1',
  customNumber?: string
): string {
  // If user provided a manual override per item (misal "★", "✓", "01"), use it!
  if (customNumber && customNumber.trim()) {
    return customNumber.trim();
  }

  if (numberingType === 'none') {
    return '';
  }

  const sep = separator === '.' ? '.' : separator === ')' ? ')' : '';

  let baseRaw = '';
  const trimmedStart = (startFrom || '1').trim();

  if (numberingType === 'numbers') {
    const startNum = parseInt(trimmedStart, 10);
    const num = isNaN(startNum) ? index + 1 : startNum + index;
    baseRaw = `${num}`;
  } else if (numberingType === 'letters-upper') {
    let startOffset = 0;
    if (/^[A-Za-z]$/.test(trimmedStart)) {
      startOffset = trimmedStart.toUpperCase().charCodeAt(0) - 65;
    } else {
      const parsed = parseInt(trimmedStart, 10);
      if (!isNaN(parsed) && parsed > 0) startOffset = parsed - 1;
    }
    const charCode = 65 + ((startOffset + index) % 26);
    baseRaw = String.fromCharCode(charCode);
  } else if (numberingType === 'letters-lower') {
    let startOffset = 0;
    if (/^[A-Za-z]$/.test(trimmedStart)) {
      startOffset = trimmedStart.toLowerCase().charCodeAt(0) - 97;
    } else {
      const parsed = parseInt(trimmedStart, 10);
      if (!isNaN(parsed) && parsed > 0) startOffset = parsed - 1;
    }
    const charCode = 97 + ((startOffset + index) % 26);
    baseRaw = String.fromCharCode(charCode);
  } else if (numberingType === 'roman') {
    const startNum = parseInt(trimmedStart, 10);
    const num = isNaN(startNum) ? index + 1 : Math.max(1, startNum + index);
    baseRaw = toRoman(num);
  }

  return `${baseRaw}${sep}`;
}

/**
 * Menghapus prefix penomoran manual (seperti "1.", "1)", "A.", "a)", "I.", "- ", "• ")
 * agar tidak terjadi penomoran ganda saat bulk paste.
 */
export function stripPrefixNumbering(text: string): string {
  if (!text) return '';
  return text
    .replace(/^(\d+[\.\)]|[a-zA-Z][\.\)]|[ivxlcdmIVXLCDM]+[\.\)]|[-*•])\s*/, '')
    .trim();
}

/**
 * Menghasilkan awalan penomoran untuk pilihan jawaban Style 3 (misal: "A. ", "B) ", "1. ")
 */
export function getStyle3ChoicePrefix(
  index: number,
  numberingType: ChoiceNumberingType,
  separator: ChoiceSeparator
): string {
  if (numberingType === 'none') return '';
  if (numberingType === 'dot') return '• ';
  const sep = separator === '.' ? '.' : separator === ')' ? ')' : '';
  let label = '';
  if (numberingType === 'letters-upper') {
    label = String.fromCharCode(65 + (index % 26));
  } else if (numberingType === 'letters-lower') {
    label = String.fromCharCode(97 + (index % 26));
  } else if (numberingType === 'numbers') {
    label = `${index + 1}`;
  } else if (numberingType === 'roman') {
    label = toRoman(index + 1);
  }
  return `${label}${sep} `;
}

/**
 * Serializes an array of choices into a single line string like:
 * "A. is | B. was | C. were | D. had been"
 */
export function serializeChoicesToSingleString(
  choices: string[],
  numberingType: ChoiceNumberingType = 'letters-upper',
  separator: ChoiceSeparator = '.'
): string {
  if (!choices || choices.length === 0) return '';
  return choices
    .map((choice, idx) => {
      const prefix = getStyle3ChoicePrefix(idx, numberingType, separator);
      return `${prefix}${choice.trim()}`;
    })
    .join(' | ');
}

/**
 * Parses a single string containing multiple choices separated by "|" or newlines.
 * Automatically removes prefixes like "A. ", "B) ", "1. ", "• ", "- " etc.
 */
export function parseSingleStringToChoices(rawText: string): string[] {
  if (!rawText || !rawText.trim()) return [];
  const rawSegments: string[] = [];
  const lines = rawText.split(/\r?\n/);
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

  // Strip prefixes from each choice
  return rawSegments.map((seg) => {
    // Remove "A. ", "B) ", "1. ", "1) ", "• ", "- ", "[A] "
    const cleaned = seg
      .replace(/^(\[?[a-zA-Z0-9ivxlcdmIVXLCDM]+[\.\)\]]|[-*•])\s*/, '')
      .trim();
    return cleaned || seg.trim();
  });
}

/**
 * Menghasilkan label penomoran untuk item Gaya 5 (misal: "01", "1", "1.", "A", "I")
 */
export function getStyle5ItemNumberLabel(
  index: number,
  numberingType: Style5NumberingType,
  startFrom: string = '1',
  customNumber?: string
): string {
  if (customNumber && customNumber.trim()) {
    return customNumber.trim();
  }
  if (numberingType === 'none') {
    return '';
  }

  const startNum = parseInt((startFrom || '1').trim(), 10);
  const currentNum = isNaN(startNum) ? index + 1 : Math.max(1, startNum + index);

  switch (numberingType) {
    case '01':
      return currentNum < 10 ? `0${currentNum}` : `${currentNum}`;
    case '1':
      return `${currentNum}`;
    case '1.':
      return `${currentNum}.`;
    case 'letters-upper':
      return String.fromCharCode(65 + ((currentNum - 1) % 26));
    case 'letters-lower':
      return String.fromCharCode(97 + ((currentNum - 1) % 26));
    case 'roman':
      return toRoman(currentNum);
    default:
      return currentNum < 10 ? `0${currentNum}` : `${currentNum}`;
  }
}

/**
 * Parser otomatis untuk bulk paste Style 3 (Soal & Penjelasan)
 */
export function parseStyle3BulkText(
  rawText: string,
  existingData: Style3QuestionData
): Style3QuestionData {
  const lines = rawText.split('\n').map((l) => l.trim());
  const nonEmptyLines = lines.filter((l) => l.length > 0);

  if (nonEmptyLines.length === 0) {
    return existingData;
  }

  // 1. Line 1 = question pill label
  const questionPillLabel = nonEmptyLines[0];

  // Choice detection regex: starts with A. / B) / 1. / a. / etc.
  const choicePattern = /^([A-Fa-f0-9ivxlcdmIVXLCDM]+[\.\)]|[-*•])\s+/;
  // Explanation detection regex: starts with "Explanation" (with or without colon)
  const explanationPattern = /^Explanation\s*:?/i;

  const questionLines: string[] = [];
  const choices: string[] = [];
  const explanationLines: string[] = [];
  let currentSection: 'question' | 'choices' | 'explanation' = 'question';
  let explanationPillLabel = existingData.explanationPillLabel || 'Explanation :';

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    if (explanationPattern.test(line)) {
      currentSection = 'explanation';
      // If line has explanation header plus content like "Explanation: "As if" digunakan..."
      const colonIdx = line.indexOf(':');
      if (colonIdx !== -1) {
        explanationPillLabel = line.slice(0, colonIdx + 1).trim();
        const remainder = line.slice(colonIdx + 1).trim();
        if (remainder) {
          explanationLines.push(remainder);
        }
      } else {
        explanationPillLabel = line.trim();
      }
      continue;
    }

    if (currentSection === 'question') {
      if (choicePattern.test(line)) {
        currentSection = 'choices';
        choices.push(stripPrefixNumbering(line));
      } else {
        questionLines.push(line);
      }
    } else if (currentSection === 'choices') {
      if (choicePattern.test(line)) {
        choices.push(stripPrefixNumbering(line));
      } else {
        // If it looks like next choice without prefix or explanation
        choices.push(line);
      }
    } else if (currentSection === 'explanation') {
      explanationLines.push(line);
    }
  }

  const questionText = questionLines.join(' ').trim() || existingData.questionText;
  const finalChoices =
    choices.length >= 2
      ? choices.slice(0, 6)
      : existingData.choices;
  const hasExplanation = explanationLines.length > 0;
  const explanationText = hasExplanation
    ? explanationLines.join('\n\n').trim()
    : existingData.explanationText;

  return {
    ...existingData,
    questionPillLabel,
    questionText,
    choices: finalChoices,
    showExplanation: hasExplanation,
    explanationPillLabel: explanationPillLabel || 'Explanation :',
    explanationText,
  };
}
