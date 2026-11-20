/**
 * Perekam diagnostik ekspor.
 *
 * Tujuan: mengumpulkan bukti dari browser PENGGUNA tanpa perlu menyalin log
 * Console secara manual. Semua pesan `[PNG]` / `[SVG]` dan error ditangkap,
 * lalu bisa diunduh sebagai satu berkas teks.
 *
 * Cara pakai:
 *   const rec = createExportRecorder();
 *   rec.start();          // mulai menangkap
 *   const text = rec.dump();  // ambil hasil sebagai teks
 *   rec.save();           // unduh sebagai berkas .txt
 */

type RecordedLine = { at: number; kind: string; text: string };

export type ExportRecorder = {
  start: () => void;
  stop: () => void;
  dump: () => string;
  save: () => void;
  count: () => number;
};

export function createExportRecorder(): ExportRecorder {
  const lines: RecordedLine[] = [];
  const startedAt = Date.now();
  let active = false;

  const original = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
  };

  const capture = (kind: string, args: unknown[]) => {
    const text = args
      .map((a) => {
        if (a instanceof Error) return `${a.name}: ${a.message}`;
        if (typeof a === 'string') return a;
        try {
          return JSON.stringify(a);
        } catch {
          return String(a);
        }
      })
      .join(' ');
    lines.push({ at: Date.now() - startedAt, kind, text: text.slice(0, 400) });
  };

  const off = () => {
    console.log = original.log;
    console.info = original.info;
    console.warn = original.warn;
    console.error = original.error;
  };

  return {
    start() {
      if (active) return;
      active = true;
      lines.length = 0;
      console.log = (...a) => {
        capture('LOG', a);
        original.log(...a);
      };
      console.info = (...a) => {
        capture('INFO', a);
        original.info(...a);
      };
      console.warn = (...a) => {
        capture('WARN', a);
        original.warn(...a);
      };
      console.error = (...a) => {
        capture('ERROR', a);
        original.error(...a);
      };
    },
    stop() {
      if (!active) return;
      active = false;
      off();
    },
    count: () => lines.length,
    dump() {
      const head = [
        '=== DIAGNOSA EKSPOR BAGAN MAKER ===',
        'waktu      : ' + new Date().toString(),
        'browser    : ' + navigator.userAgent,
        'platform   : ' + navigator.platform,
        'secure ctx : ' + window.isSecureContext,
        'savePicker : ' + typeof (window as { showSaveFilePicker?: unknown }).showSaveFilePicker,
        'tercatat   : ' + lines.length + ' baris',
        '',
      ];
      const body = lines.map(
        (l) => `[+${l.at}ms] ${l.kind.padEnd(5)} ${l.text}`
      );
      return [...head, ...body].join('\r\n');
    },
    save() {
      const blob = new Blob([this.dump()], {
        type: 'text/plain;charset=utf-8',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'diagnosa-ekspor-bagan-maker.txt';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    },
  };
}
