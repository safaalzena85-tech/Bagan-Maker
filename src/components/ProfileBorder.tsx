import React, { useEffect, useRef, useState } from 'react';
import {
  circlePath,
  closedOutlineFromSvgPath,
  getStrokeProfile,
  isUniformProfile,
  roundedRectPath,
  roundedRectPath4,
} from '../utils/strokeProfile';

interface ProfileBorderProps {
  /** Bentuk dasar bingkai. */
  shape?: 'rect' | 'pill' | 'circle';
  /**
   * Radius sudut pada border-box (px). Angka tunggal untuk semua sudut,
   * atau array [tl, tr, br, bl]. Diabaikan untuk pill/circle.
   */
  radius?: number | [number, number, number, number];
  /** Ketebalan stroke dasar (px). */
  strokeWidth: number;
  /** Warna bingkai. */
  color: string;
  /** id profil stroke (lihat STROKE_PROFILES). 'uniform' → tidak render. */
  profile: string;
  /** Urutan tumpukan overlay. */
  zIndex?: number;
}

/**
 * Menggambar bingkai dengan lebar variabel (profil stroke) di atas elemen.
 * Elemen induk harus memiliki `border` dengan ketebalan sama (boleh warna
 * transparan) dan posisi `relative`/`absolute`. Ukuran induk diukur otomatis
 * menggunakan ResizeObserver sehingga cocok untuk layout apa pun.
 */
export const ProfileBorder: React.FC<ProfileBorderProps> = ({
  shape = 'rect',
  radius = 0,
  strokeWidth,
  color,
  profile,
  zIndex = 5,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  // Wrapper harus SELALU dirender agar ref tersedia untuk pengukuran
  // (kalau tidak, tidak akan pernah terukur → deadlock).
  useEffect(() => {
    const el = ref.current?.parentElement;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      setBox((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
    };
    measure();
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(measure);
      ro.observe(el);
      return () => ro.disconnect();
    }
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const sw = Math.max(0.5, strokeWidth);
  const bw = box.w + sw * 2; // lebar border-box
  const bh = box.h + sw * 2;

  const active = !isUniformProfile(profile) && box.w > 0 && box.h > 0;

  let outline = '';
  if (active) {
    let path: string;
    if (shape === 'circle') {
      const r = Math.min(bw, bh) / 2 - sw / 2;
      path = circlePath(bw / 2, bh / 2, Math.max(0.1, r));
    } else if (shape === 'pill') {
      const r = Math.min(bw / 2, bh / 2);
      path = roundedRectPath4(sw / 2, sw / 2, bw - sw, bh - sw, r, r, r, r);
    } else if (Array.isArray(radius)) {
      const inset = sw / 2;
      const rInset = radius.map((v) => Math.max(0, (v || 0) - inset));
      path = roundedRectPath4(
        inset,
        inset,
        bw - sw,
        bh - sw,
        rInset[0],
        rInset[1],
        rInset[2],
        rInset[3]
      );
    } else {
      path = roundedRectPath(
        sw / 2,
        sw / 2,
        bw - sw,
        bh - sw,
        Math.max(0, radius - sw / 2)
      );
    }
    outline = closedOutlineFromSvgPath(path, sw, getStrokeProfile(profile)) || '';
  }

  return (
    <div
      ref={ref}
      aria-hidden
      style={{
        position: 'absolute',
        left: -sw,
        top: -sw,
        width: Math.max(0, bw),
        height: Math.max(0, bh),
        pointerEvents: 'none',
        zIndex,
        overflow: 'visible',
      }}
    >
      {outline && (
        <svg
          width={bw}
          height={bh}
          viewBox={`0 0 ${bw} ${bh}`}
          style={{ overflow: 'visible' }}
        >
          <path d={outline} fill={color} fillRule="evenodd" stroke="none" />
        </svg>
      )}
    </div>
  );
};
