import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import {
  STROKE_PROFILES,
  getStrokeProfile,
  profilePreviewPath,
} from '../utils/strokeProfile';

/** Siluet profil digambar dengan fungsi w(t) yang sama pada garis lurus horizontal. */
function ProfileSilhouette({ profileId }: { profileId: string }) {
  const d = profilePreviewPath(profileId);
  return (
    <span
      className="shrink-0 inline-flex items-center justify-center rounded-md border border-slate-200 bg-slate-50 overflow-hidden"
      style={{ width: 70, height: 25 }}
      aria-hidden="true"
    >
      <svg width={70} height={25} viewBox="0 0 70 25" style={{ display: 'block' }}>
        <path d={d} fill="#000000" />
      </svg>
    </span>
  );
}

interface StrokeProfileDropdownProps {
  value?: string;
  onChange: (id: string) => void;
  /** kelas warna aksen opsional (mis. 'indigo' / 'purple') */
  accent?: string;
}

export function StrokeProfileDropdown({
  value,
  onChange,
  accent = 'indigo',
}: StrokeProfileDropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDocMouseDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onDocKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocMouseDown);
    document.addEventListener('keydown', onDocKey);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      document.removeEventListener('keydown', onDocKey);
    };
  }, [open]);

  const current = getStrokeProfile(value);
  const accentBtn =
    accent === 'purple'
      ? 'border-purple-300 ring-1 ring-purple-200'
      : 'border-indigo-300 ring-1 ring-indigo-200';

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 text-xs hover:bg-slate-50 transition-all cursor-pointer ${open ? accentBtn : ''}`}
      >
        <ProfileSilhouette profileId={current.id} />
        <span className="flex-1 text-left text-[11px] font-medium truncate leading-tight">
          {current.nama}
        </span>
        <ChevronDown
          size={14}
          className={`text-slate-400 transition-transform shrink-0 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-full mt-1 z-50 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg py-1"
        >
          {STROKE_PROFILES.map((p) => {
            const selected = p.id === current.id;
            return (
              <button
                key={p.id}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  onChange(p.id);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-2 py-1.5 text-left transition-colors cursor-pointer ${
                  selected ? 'bg-indigo-50' : 'hover:bg-slate-50'
                }`}
              >
                <ProfileSilhouette profileId={p.id} />
                <span
                  className={`flex-1 text-[11px] truncate ${
                    selected ? 'font-semibold text-indigo-700' : 'text-slate-700'
                  }`}
                >
                  {p.nama}
                </span>
                {selected && <Check size={13} className="text-indigo-600 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
