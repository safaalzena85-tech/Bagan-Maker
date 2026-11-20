import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Check,
  FileText,
  AlertCircle,
  CaseSensitive,
} from 'lucide-react';
import { DiagramStyleType, Style3QuestionData, Style5Data, SubBoxItem } from '../types';
import {
  applyTextCase,
  CaseType,
  parseStyle3BulkText,
  stripPrefixNumbering,
} from '../utils/textCase';
import {
  serializeStyle1ToQuickText,
  serializeStyle2ToQuickText,
  serializeStyle3ToQuickPipeText,
  serializeStyle5ToQuickText,
  parseStyle5QuickText,
} from '../utils/singleBoxParser';
import { DEFAULT_STYLE5_DATA } from '../constants/presets';

interface BulkPasteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (mainTitle: string, subBoxes: SubBoxItem[]) => void;
  diagramStyle?: DiagramStyleType;
  mainTitle?: string;
  subBoxes?: SubBoxItem[];
  style3Data?: Style3QuestionData;
  onApplyStyle3?: (data: Style3QuestionData) => void;
  style5Data?: Style5Data;
  onApplyStyle5?: (data: Style5Data) => void;
}

const TEMPLATES_STYLE1 = [
  {
    name: 'Keuntungan Saham',
    text: `Keuntungan Saham
Capital loss | Kondisi dimana pemilik menjual saham lebih rendah dari harga beli, sehingga pemilik mengalami kerugian.
Risiko likuidasi | Jika perusahaan bangkrut, pemilik saham akan kehilangan hartanya atau mendapat klaim terakhir atas aset.
Tidak mendapat dividen | Perusahaan tidak dapat membagikan dividen jika sedang mengalami kerugian operasional.`,
  },
  {
    name: 'Strategi Marketing',
    text: `Strategi Pemasaran Digital
Search Engine Optimization | Meningkatkan visibilitas organik di Google agar mudah ditemukan calon pelanggan.
Social Media Marketing | Membangun komunitas dan keterlibatan merek melalui konten interaktif berkala.
Email Automation | Mengirimkan penawaran terpersonalisasi secara otomatis berdasarkan perilaku pelanggan.
Content Marketing | Edukasi audiens dengan artikel blog, video panduan, dan studi kasus inspiratif.`,
  },
  {
    name: 'Metode Belajar',
    text: `Teknik Belajar Efektif
Active Recall | Menguji ingatan diri sendiri tanpa melihat buku catatan secara langsung.
Spaced Repetition | Mengulang materi dalam interval waktu yang bertahap agar tersimpan di memori jangka panjang.
Feynman Technique | Menjelaskan konsep rumit dengan kata-kata sederhana seolah mengajari anak kecil.`,
  },
];

const TEMPLATES_STYLE2 = [
  {
    name: 'Jenis Reksa Dana (Default Gaya 2)',
    text: `Jenis-jenis reksa dana
1. Reksa dana pasar uang (Money market funds)
2. Reksa dana pendapatan tetap (Fixed Income funds)
3. Reksa dana saham (Equity funds)
4. Reksa dana campuran (Discretionary funds)`,
  },
  {
    name: 'Karakteristik Investasi',
    text: `Prinsip Dasar Berinvestasi
A. Tentukan tujuan keuangan yang spesifik dan terukur
B. Pahami profil risiko dan jangka waktu investasi
C. Diversifikasi portofolio ke beberapa instrumen
D. Lakukan evaluasi dan rebalancing berkala`,
  },
  {
    name: 'Tahapan Manajemen Proyek',
    text: `Siklus Manajemen Proyek
Inisiasi dan penetapan target proyek
Perencanaan jadwal, anggaran, dan sumber daya
Eksekusi dan koordinasi tim kerja
Pemantauan serta evaluasi hasil kerja`,
  },
];

const TEMPLATES_STYLE3 = [
  {
    name: 'Soal Subjunctive (Default Gaya 3)',
    text: `Question No. 2
She speaks as if she ___ the queen.
A. is
B. was
C. were
D. had been
Explanation:
"As if" digunakan untuk menunjukkan situasi yang tidak nyata atau imajiner. Karena subjeknya adalah "she", maka digunakan "were" sesuai aturan subjunctive. Ingat bahwa pada kalimat pengandaian dengan if conditional dan subjunctive, kita tidak menggunakan kata "was", melainkan "were".`,
  },
  {
    name: 'Soal Aljabar Matematika',
    text: `Question No. 5
Jika 2x + 7 = 19, maka nilai dari 3x - 4 adalah ___
A. 12
B. 14
C. 16
D. 18
Explanation:
Pertama cari nilai x: 2x = 19 - 7 = 12, maka x = 6.
Substitusikan nilai x = 6 ke dalam 3x - 4:
3(6) - 4 = 18 - 4 = 14.
Maka jawaban yang benar adalah B.`,
  },
  {
    name: 'Soal Biologi Fotosintesis',
    text: `Soal Latihan No. 1
Proses fotosintesis pada tumbuhan menghasilkan oksigen dan ___ sebagai sumber energi.
A. Nitrogen
B. Glukosa
C. Karbon monoksida
D. Asam klorida
Explanation:
Reaksi fotosintesis mengubah karbon dioksida dan air menjadi glukosa (C6H12O6) dan melepaskan oksigen (O2).`,
  },
];

const TEMPLATES_STYLE4 = [
  {
    name: 'Instrumen Pasar Modal (Default)',
    text: `Jenis instrumen pasar modal
1. Saham
2. Obligasi
3. Sukuk (Obligasi Syariah)
4. Reksa dana
5. Exchange Traded Fund (ETF)
6. Derivatif`,
  },
  {
    name: 'Faktor Produksi Ekonomi',
    text: `Faktor-faktor Produksi
1. Sumber Daya Alam
2. Tenaga Kerja
3. Modal Finansial
4. Kewirausahaan & Teknologi`,
  },
  {
    name: 'Fungsi Manajemen Bisnis',
    text: `Fungsi Pokok Manajemen
1. Perencanaan (Planning)
2. Pengorganisasian (Organizing)
3. Pengarahan (Actuating)
4. Pengawasan (Controlling)`,
  },
];

const TEMPLATES_STYLE5 = [
  {
    name: 'Sejarah & Tokoh (Default Gaya 5)',
    text: `03 | Hubungan antara Ilmu Sejarah dan Ilmu Sosial | Peter Burke
01 | Periode pertama : Sebelum abad ke-19 | Ketika abad pencerahan (age of enlightenment), hubungan antara sejarawan ilmuwan sosial saling mendukung.
02 | Periode kedua : Ketika abad ke-19 | Masing-masing disiplin ilmu memfokuskan dan mempertahankan disiplin ilmunya masing-masing, termasuk ilmu sejarah.`,
  },
  {
    name: 'Ekonomi Mikro & Tokoh',
    text: `01 | Teori Nilai dan Mekanisme Pasar | Adam Smith
01 | The Wealth of Nations (1776) | Pasar bebas memiliki tangan tak terlihat (invisible hand) yang mengalokasikan sumber daya secara efisien.
02 | Pembagian Kerja (Division of Labour) | Spesialisasi tenaga kerja meningkatkan produktivitas dan pertumbuhan ekonomi secara signifikan.`,
  },
];

export const BulkPasteModal: React.FC<BulkPasteModalProps> = ({
  isOpen,
  onClose,
  onApply,
  diagramStyle = 'style1',
  mainTitle,
  subBoxes,
  style3Data,
  onApplyStyle3,
  style5Data,
  onApplyStyle5,
}) => {
  const isStyle5 = diagramStyle === 'style5';
  const isStyle3 = diagramStyle === 'style3';
  const isStyle2 = diagramStyle === 'style2';
  const isStyle4 = diagramStyle === 'style4';
  const templates = isStyle5
    ? TEMPLATES_STYLE5
    : isStyle3
    ? TEMPLATES_STYLE3
    : isStyle4
    ? TEMPLATES_STYLE4
    : isStyle2
    ? TEMPLATES_STYLE2
    : TEMPLATES_STYLE1;

  const [rawText, setRawText] = useState(templates[0].text);
  const [caseMode, setCaseMode] = useState<CaseType | 'as-is'>('sentence');
  const [insertMode, setInsertMode] = useState<'replace' | 'append'>('replace');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync template if diagramStyle switches
  useEffect(() => {
    setRawText(templates[0].text);
  }, [diagramStyle]);

  // Export current diagram state to text format with pipe "|"
  const handleExportCurrentToText = () => {
    if (isStyle5 && style5Data) {
      setRawText(serializeStyle5ToQuickText(style5Data));
    } else if (isStyle3 && style3Data) {
      setRawText(serializeStyle3ToQuickPipeText(style3Data));
    } else if (isStyle2 || isStyle4) {
      setRawText(serializeStyle2ToQuickText(mainTitle || '', subBoxes || []));
    } else {
      setRawText(serializeStyle1ToQuickText(mainTitle || '', subBoxes || []));
    }
  };

  if (!isOpen) return null;

  // Intercept paste event
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text/plain');
    if (!pastedText) return;

    const processed =
      caseMode === 'as-is' || isStyle3
        ? pastedText
        : applyTextCase(pastedText, caseMode);

    const textarea = e.currentTarget;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentVal = textarea.value;

    const nextVal =
      currentVal.substring(0, start) + processed + currentVal.substring(end);
    setRawText(nextVal);
    setErrorMsg(null);
  };

  // Convert currently loaded text directly
  const convertCurrentText = (mode: CaseType) => {
    setCaseMode(mode);
    setRawText((prev) => applyTextCase(prev, mode));
  };

  // Parse lines for Style 1 & Style 2
  const parseLines = (text: string) => {
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) {
      return { mainTitle: '', subBoxes: [] };
    }

    let mainTitle = lines[0];
    if (caseMode !== 'as-is' && !isStyle3) {
      mainTitle = applyTextCase(mainTitle, caseMode);
    }

    const subBoxes: SubBoxItem[] = [];
    const maxItems = isStyle4 ? 10 : 5;
    const totalLinesToProcess = Math.min(lines.length - 1, maxItems);
    const half = Math.ceil(totalLinesToProcess / 2);

    for (let i = 1; i < lines.length; i++) {
      if (subBoxes.length >= maxItems) break;
      const line = lines[i];

      let pill = `Sub ${i}`;
      let content = line;
      let side: 'left' | 'right' | 'auto' = 'auto';

      if (isStyle4) {
        content = stripPrefixNumbering(line);
        pill = content;
        side = i <= half ? 'left' : 'right';
      } else if (isStyle2) {
        content = stripPrefixNumbering(line);
        pill = content.length > 30 ? content.slice(0, 30) + '...' : content;
      } else {
        if (line.includes('|')) {
          const parts = line.split('|');
          pill = parts[0].trim();
          content = parts.slice(1).join('|').trim();
        } else if (line.includes(':')) {
          const parts = line.split(':');
          pill = parts[0].trim();
          content = parts.slice(1).join(':').trim();
        } else {
          content = stripPrefixNumbering(line);
          pill = `Sub ${i}`;
        }
      }

      if (caseMode !== 'as-is' && !isStyle3) {
        pill = applyTextCase(pill, caseMode);
        content = applyTextCase(content, caseMode);
      }

      subBoxes.push({
        id: `bulk-${Date.now()}-${i}`,
        title: pill,
        content: content,
        side: isStyle4 ? side : undefined,
      });
    }

    return { mainTitle, subBoxes };
  };

  const parsed = parseLines(rawText);
  const parsedStyle3 =
    isStyle3 && style3Data ? parseStyle3BulkText(rawText, style3Data) : null;
  const parsedStyle5 = isStyle5
    ? parseStyle5QuickText(rawText, style5Data || DEFAULT_STYLE5_DATA, insertMode)
    : null;

  const handleApply = () => {
    if (isStyle5 && onApplyStyle5 && parsedStyle5) {
      if (parsedStyle5.points.length === 0) {
        setErrorMsg('Harap masukkan setidaknya satu baris poin!');
        return;
      }
      onApplyStyle5(parsedStyle5);
      onClose();
      return;
    }

    if (isStyle3 && onApplyStyle3 && parsedStyle3) {
      if (!parsedStyle3.questionPillLabel || !parsedStyle3.questionText) {
        setErrorMsg('Harap masukkan Label Pill dan Teks Soal!');
        return;
      }
      if (parsedStyle3.choices.length < 2) {
        setErrorMsg('Harap sediakan minimal 2 pilihan jawaban (A dan B)!');
        return;
      }
      onApplyStyle3(parsedStyle3);
      onClose();
      return;
    }

    if (!parsed.mainTitle) {
      setErrorMsg('Harap masukkan setidaknya satu baris untuk Judul Utama!');
      return;
    }

    if (insertMode === 'append') {
      const existing = subBoxes || [];
      const maxCount = isStyle4 ? 16 : 8;
      const combined = [...existing, ...parsed.subBoxes].slice(0, maxCount);
      onApply(parsed.mainTitle || mainTitle || '', combined);
      onClose();
      return;
    }

    if (parsed.subBoxes.length < 2) {
      setErrorMsg('Bagan membutuhkan minimal 2 sub box (baris ke-2 dan ke-3).');
      return;
    }

    onApply(parsed.mainTitle, parsed.subBoxes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="nb-skin nb-modal relative w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Tempel Teks Cepat (
                {isStyle5
                  ? 'Gaya 5: Slide Materi'
                  : isStyle3
                  ? 'Gaya 3: Soal & Penjelasan'
                  : isStyle4
                  ? 'Gaya 4: Radial'
                  : isStyle2
                  ? 'Gaya 2: Pill Bernomor'
                  : 'Gaya 1: Kotak Judul Pill'}
                )
              </h2>
              <p className="text-xs text-slate-500">
                Tulis atau tempel teks berformat untuk membuat bagan instan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-sm">
          {/* Format instructions */}
          <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-amber-900 text-xs flex items-start gap-2">
            <FileText className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
            <div>
              <p className="font-semibold mb-0.5">
                Format Teks{' '}
                {isStyle5
                  ? 'Gaya 5 (Slide Materi)'
                  : isStyle3
                  ? 'Gaya 3'
                  : isStyle4
                  ? 'Gaya 4'
                  : isStyle2
                  ? 'Gaya 2'
                  : 'Gaya 1'}:
              </p>
              {isStyle5 ? (
                <div className="text-amber-800 leading-relaxed space-y-1">
                  <p>
                    • Baris 1: <strong>Nomor Header | Judul Header | Nama Tokoh (opsional)</strong>
                    <br />
                    Contoh: <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">03 | Hubungan antara Ilmu Sejarah dan Ilmu Sosial | Peter Burke</code>
                  </p>
                  <p>
                    • Baris berikutnya: <strong>Nomor | Teks Pill | Teks Deskripsi</strong>
                    <br />
                    Contoh: <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">01 | Periode pertama : Sebelum abad ke-19 | Ketika abad pencerahan...</code>
                  </p>
                  <p className="text-[11px] text-amber-700">
                    * Jika nomor dilewati (2 bagian: Pill | Deskripsi), nomor akan otomatis berurutan (01, 02, ...).
                    <br />
                    * Jika 1 bagian, dianggap sebagai Pill saja tanpa deskripsi.
                  </p>
                </div>
              ) : isStyle3 ? (
                <p className="text-amber-800 leading-relaxed">
                  • Baris 1: <strong>Label Pill Soal</strong> (misal: "Question No. 2")
                  <br />
                  • Baris berikutnya: <strong>Teks Soal</strong> (gunakan "___" untuk blank underline)
                  <br />
                  • Baris pilihan: diawali huruf seperti <strong>A.</strong>, <strong>B.</strong>, <strong>C.</strong>, <strong>D.</strong>
                  <br />
                  • Baris penjelasan: diawali kata <strong>Explanation:</strong> diikuti teks penjelasan
                </p>
              ) : isStyle2 ? (
                <p className="text-amber-800 leading-relaxed">
                  • Baris 1: <strong>Judul Utama</strong>
                  <br />
                  • Baris berikutnya: <strong>Satu sub box per baris (atau "Nomor | Teks")</strong>
                  <br />
                  • <em>Catatan:</em> Awalan nomor manual seperti "1." otomatis dirapikan.
                </p>
              ) : isStyle4 ? (
                <p className="text-amber-800 leading-relaxed">
                  • Baris 1: <strong>Judul Lingkaran Tengah</strong>
                  <br />
                  • Baris berikutnya: <strong>Satu instrumen per baris (atau "Nomor | Teks")</strong>
                </p>
              ) : (
                <p className="text-amber-800 leading-relaxed">
                  • Baris 1: <strong>Judul Utama</strong>
                  <br />
                  • Baris berikutnya: <strong>Judul Pill | Isi deskripsi</strong> (pemisah <code className="px-1 py-0.5 bg-amber-100 rounded">|</code>)
                  <br />• Minimal 2 sub box, maksimal 8 sub box.
                </p>
              )}
            </div>
          </div>

          {/* Mode switch & Export Text Button Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-600">Mode:</span>
              <button
                type="button"
                onClick={() => setInsertMode('replace')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  insertMode === 'replace'
                    ? 'bg-indigo-600 text-white font-semibold shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Ganti Semua
              </button>
              <button
                type="button"
                onClick={() => setInsertMode('append')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  insertMode === 'append'
                    ? 'bg-indigo-600 text-white font-semibold shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Tambahkan ke yang Ada
              </button>
            </div>

            <button
              type="button"
              onClick={handleExportCurrentToText}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-slate-200 text-indigo-700 hover:bg-indigo-50 font-medium transition-colors shadow-2xs cursor-pointer"
              title="Ubah kondisi bagan saat ini ke format teks | agar bisa disalin dan diedit ulang"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Ekspor ke Teks</span>
            </button>
          </div>

          {/* Change Case Control Bar for Style 1 & 2 */}
          {!isStyle3 && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <CaseSensitive className="w-4 h-4 text-indigo-600" />
                  <span>Format Huruf (Change Case):</span>
                  <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">
                    Default: Sentence case saat paste
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => convertCurrentText('sentence')}
                  className={`px-2.5 py-1.5 rounded-lg font-medium transition-all text-center flex items-center justify-center gap-1 ${
                    caseMode === 'sentence'
                      ? 'bg-indigo-600 text-white shadow-2xs font-semibold'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>Sentence case</span>
                </button>

                <button
                  type="button"
                  onClick={() => convertCurrentText('title')}
                  className={`px-2.5 py-1.5 rounded-lg font-medium transition-all text-center flex items-center justify-center gap-1 ${
                    caseMode === 'title'
                      ? 'bg-indigo-600 text-white shadow-2xs font-semibold'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>Title Case</span>
                </button>

                <button
                  type="button"
                  onClick={() => convertCurrentText('upper')}
                  className={`px-2.5 py-1.5 rounded-lg font-medium transition-all text-center flex items-center justify-center gap-1 ${
                    caseMode === 'upper'
                      ? 'bg-indigo-600 text-white shadow-2xs font-semibold'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>UPPERCASE</span>
                </button>

                <button
                  type="button"
                  onClick={() => convertCurrentText('lower')}
                  className={`px-2.5 py-1.5 rounded-lg font-medium transition-all text-center flex items-center justify-center gap-1 ${
                    caseMode === 'lower'
                      ? 'bg-indigo-600 text-white shadow-2xs font-semibold'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>lowercase</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCaseMode('as-is')}
                  className={`px-2.5 py-1.5 rounded-lg font-medium transition-all text-center flex items-center justify-center gap-1 ${
                    caseMode === 'as-is'
                      ? 'bg-indigo-600 text-white shadow-2xs font-semibold'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>As-is (Asli)</span>
                </button>
              </div>
            </div>
          )}

          {/* Template buttons */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs text-slate-500 shrink-0 font-medium">
              Gunakan Contoh:
            </span>
            {templates.map((tpl) => (
              <button
                key={tpl.name}
                type="button"
                onClick={() => {
                  setRawText(tpl.text);
                  setErrorMsg(null);
                }}
                className="px-2.5 py-1 text-xs bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors shrink-0 cursor-pointer"
              >
                {tpl.name}
              </button>
            ))}
          </div>

          {/* Textarea */}
          <div className="space-y-1">
            <textarea
              rows={9}
              value={rawText}
              onPaste={handlePaste}
              onChange={(e) => {
                setRawText(e.target.value);
                setErrorMsg(null);
              }}
              placeholder={
                isStyle3
                  ? `Question No. 2\nShe speaks as if she ___ the queen.\nA. is\nB. was\nC. were\nD. had been\nExplanation:\n"As if" digunakan untuk...`
                  : isStyle2
                  ? `Judul Utama\n1. Sub box satu\n2. Sub box dua\n3. Sub box tiga`
                  : `Judul Utama\nJudul Pill 1 | Isi deskripsi 1\nJudul Pill 2 | Isi deskripsi 2`
              }
              className="w-full p-3 font-mono text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50/50"
            />
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="flex items-center gap-2 text-rose-600 text-xs bg-rose-50 p-2.5 rounded-lg border border-rose-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Live Preview of parsed structure */}
          <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/40 space-y-2">
            <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Pratinjau Hasil Parser:
            </h4>
            {isStyle5 && parsedStyle5 ? (
              <div className="text-xs space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Header:</span>
                  <span className="font-bold text-slate-800">
                    [{parsedStyle5.header.number}] {parsedStyle5.header.title || '(Tanpa Judul)'}
                  </span>
                  {parsedStyle5.sidebar.name && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-semibold">
                      Tokoh: {parsedStyle5.sidebar.name}
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400">
                    Poin Terdeteksi ({parsedStyle5.points.length}):
                  </span>
                  <div className="space-y-1 pl-2">
                    {parsedStyle5.points.map((pt, idx) => (
                      <div key={idx} className="p-1.5 bg-white border border-slate-200 rounded-lg">
                        <div className="font-semibold text-indigo-700">
                          {pt.number}. {pt.pillText}
                        </div>
                        {pt.descriptionText && (
                          <div className="text-slate-600 text-[11px] mt-0.5">
                            {pt.descriptionText}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : isStyle3 && parsedStyle3 ? (
              <div className="text-xs space-y-1.5">
                <div>
                  <span className="text-slate-400">Pill Soal: </span>
                  <span className="font-semibold text-slate-800">
                    {parsedStyle3.questionPillLabel || '(Belum terisi)'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Teks Soal: </span>
                  <span className="text-slate-800 font-medium">
                    {parsedStyle3.questionText || '(Belum terisi)'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">
                    Pilihan ({parsedStyle3.choices.length}):{' '}
                  </span>
                  <div className="pl-2 mt-1 space-y-0.5 text-slate-700">
                    {parsedStyle3.choices.map((c, i) => (
                      <div key={i}>
                        <strong className="text-indigo-600">
                          {String.fromCharCode(65 + i)}.
                        </strong>{' '}
                        {c}
                      </div>
                    ))}
                  </div>
                </div>
                {parsedStyle3.showExplanation && (
                  <div>
                    <span className="text-slate-400">Penjelasan: </span>
                    <p className="text-slate-700 italic mt-0.5 line-clamp-2">
                      {parsedStyle3.explanationText}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs space-y-1.5">
                <div>
                  <span className="text-slate-400">Judul Utama: </span>
                  <span className="font-semibold text-slate-800">
                    {parsed.mainTitle || '(Belum terisi)'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">
                    Sub Box ({parsed.subBoxes.length} terdeteksi):
                  </span>
                  <ul className="list-disc list-inside pl-2 space-y-1 mt-1 text-slate-700">
                    {parsed.subBoxes.map((sub, idx) => (
                      <li key={idx}>
                        <strong className="text-indigo-600">
                          {isStyle2 ? `Item ${idx + 1}` : sub.title}
                        </strong>
                        : {sub.content}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer"
          >
            <Check className="w-4 h-4" />
            Terapkan ke Bagan
          </button>
        </div>
      </div>
    </div>
  );
};
