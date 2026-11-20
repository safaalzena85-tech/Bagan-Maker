import React, { useEffect, useRef, useState } from 'react';
import {
  CaseTransformSettings,
  FontWeightOption,
  Style5ColorSettings,
  Style5Data,
  Style5FreeElement,
  Style5LayoutSettings,
  Style5PointItem,
} from '../types';
import {
  applyTextCaseTransform,
  getStyle5ItemNumberLabel,
} from '../utils/textCase';
import { style5WeightToNumber } from '../constants/presets';
import {
  Camera,
  Copy,
  Download,
  Eye,
  EyeOff,
  MoveDown,
  MoveUp,
  Pencil,
  Trash2,
  Upload,
  ZoomIn,
  Move,
  Plus,
} from 'lucide-react';
import { exportAsPng } from '../utils/exportHelpers';
import { ProfileBorder } from './ProfileBorder';

/** Overlay bingkai profil stroke untuk bentuk tertutup Gaya 5. */
function ShapeBorder(props: {
  shape?: 'rect' | 'pill' | 'circle';
  radius?: number | [number, number, number, number];
  color: string;
  strokeWidth: number;
  profile?: string;
}): React.ReactNode {
  if (!props.profile || props.profile === 'uniform') return null;
  return (
    <ProfileBorder
      shape={props.shape}
      radius={props.radius}
      strokeWidth={props.strokeWidth}
      color={props.color}
      profile={props.profile}
    />
  );
}

interface Style5CanvasProps {
  data: Style5Data;
  onChange: (updated: Style5Data) => void;
  colors: Style5ColorSettings;
  layout: Style5LayoutSettings;
  caseSettings: CaseTransformSettings;
  canvasWidth: number;
  canvasHeight: number;
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  selectedStyle5Ids?: string[];
  onSelectStyle5Ids?: (ids: string[]) => void;
  /** Profil stroke global untuk semua bingkai/shape (semua gaya). */
  shapeProfile?: string;
  /** Daftar artboard Gaya 5 lain (untuk duplikat elemen terpilih). */
  artboardOptions?: { id: string; name: string }[];
  onDuplicateSelectionToArtboard?: (targetId: string) => void;
  scaleFactor: number;
  onToast?: (msg: string) => void;
  canvasDimension?: any;
}

export const Style5Canvas: React.FC<Style5CanvasProps> = ({
  data,
  onChange,
  colors,
  layout,
  caseSettings,
  canvasWidth,
  canvasHeight,
  selectedElementId,
  onSelectElement,
  selectedStyle5Ids = [],
  onSelectStyle5Ids,
  shapeProfile,
  artboardOptions,
  onDuplicateSelectionToArtboard,
  scaleFactor,
  onToast,
  canvasDimension,
}) => {
  const profActive = !!shapeProfile && shapeProfile !== 'uniform';
  const shapeBorderColor = (c: string) => (profActive ? 'transparent' : c);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const photoInputRef = useRef<HTMLInputElement>(null);
  const selectedElementRef = useRef<HTMLDivElement>(null);

  // ---- Drag & Resize bebas untuk SEMUA elemen (Gaya 5) ----
  type MoveTarget = 'photo' | 'name' | 'header' | 'point' | 'free' | 'pill' | 'desc';
  interface DragState {
    kind: 'move' | 'resize' | 'group-resize';
    target: MoveTarget | 'group';
    id?: string; // id poin / elemen bebas
    dir?: string; // arah resize: n,s,e,w,ne,nw,se,sw
    startX: number;
    startY: number;
    init: { x: number; y: number; w: number; h: number };
    minW: number;
    minH: number;
    groupInitials?: Array<{
      id: string;
      target: MoveTarget;
      dataId?: string;
      x: number;
      y: number;
      w: number;
      h: number;
    }>;
  }

  const [dragState, setDragState] = useState<DragState | null>(null);
  // Menandai apakah drag benar-benar menggerakkan elemen (agar klik setelah
  // drag grup tidak menciutkan pilihan menjadi satu elemen).
  const movedRef = useRef(false);
  const [photoPanDrag, setPhotoPanDrag] = useState<{
    startX: number;
    startY: number;
    panX: number;
    panY: number;
  } | null>(null);

  // ---- Penggaris (ruler) saat menggeser/mengubah ukuran ----
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragElRef = useRef<HTMLElement | null>(null);
  const [dragRect, setDragRect] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
    mx: number;
    my: number;
  } | null>(null);

  const selectedCount = selectedStyle5Ids.length;

  // Mode skala poin: grup keseluruhan | pill saja | deskripsi saja
  const [pointResizeMode, setPointResizeMode] = useState<'group' | 'pill' | 'desc'>('group');
  useEffect(() => {
    setPointResizeMode('group');
  }, [selectedElementId]);

  const clampNum = (v: number, min: number, max: number) =>
    Math.max(min, Math.min(max, v));

  const isInteractiveTarget = (e: React.MouseEvent) =>
    !!(e.target as HTMLElement).closest(
      'textarea, input, button, select, [data-resize-handle], [data-photo-placeholder]'
    );

  // Ukur posisi/ukuran elemen yang digeser (dalam koordinat kanvas) utk penggaris
  const updateDragRect = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    const el = dragElRef.current;
    if (!canvas || !el) return;
    const cr = canvas.getBoundingClientRect();
    const er = el.getBoundingClientRect();
    const sf = scaleFactor || 1;
    setDragRect({
      x: Math.round((er.left - cr.left) / sf),
      y: Math.round((er.top - cr.top) / sf),
      w: Math.round(er.width / sf),
      h: Math.round(er.height / sf),
      mx: Math.round((clientX - cr.left) / sf),
      my: Math.round((clientY - cr.top) / sf),
    });
  };

  // Ukuran & posisi default (sebelum handler dipakai)
  const sidebarWidthPercent = data.sidebar.show
    ? layout.sidebarWidthPercent || 16
    : 0;
  const sidebarPixelWidth = (canvasWidth * sidebarWidthPercent) / 100;
  const contentAreaWidth = Math.max(
    240,
    canvasWidth -
      sidebarPixelWidth -
      Math.round(canvasWidth * 0.038) -
      Math.round(canvasWidth * 0.045)
  );
  const photoW = data.sidebar.photoWidth ||
    Math.min(Math.max(0, sidebarPixelWidth - 48), (layout.photoSize || 180) * 1.15);
  const photoH = data.sidebar.photoHeight ||
    Math.min(Math.max(0, (sidebarPixelWidth - 48) * 1.3), (layout.photoSize || 180) * 1.45);
  const photoTX = data.sidebar.photoX || 0;
  const photoTY = data.sidebar.photoY || 0;
  const nameX = data.sidebar.nameX || 0;
  const nameY = data.sidebar.nameY || 0;

  const boundsForId = (sid: string) => {
    if (sid === 'header') {
      return {
        id: sid,
        target: 'header' as MoveTarget,
        dataId: 'header',
        x: data.header.x || 0,
        y: data.header.y || 0,
        w: data.header.width || contentAreaWidth,
        h: data.header.height || Math.max(68, layout.fontSizeHeader * 2.3),
      };
    } else if (sid === 'photo') {
      return {
        id: sid,
        target: 'photo' as MoveTarget,
        dataId: 'photo',
        x: data.sidebar.photoX || 0,
        y: data.sidebar.photoY || 0,
        w: data.sidebar.photoWidth || photoW,
        h: data.sidebar.photoHeight || photoH,
      };
    } else if (sid === 'name') {
      return {
        id: sid,
        target: 'name' as MoveTarget,
        dataId: 'name',
        x: data.sidebar.nameX || 0,
        y: data.sidebar.nameY || 0,
        w: data.sidebar.nameWidth || 200,
        h: data.sidebar.nameHeight || Math.max(32, layout.fontSizeName * 2 + 20),
      };
    } else if (sid.startsWith('point-')) {
      const pid = sid.slice('point-'.length);
      const p = data.points.find((pt) => pt.id === pid);
      if (p) {
        return {
          id: sid,
          target: 'point' as MoveTarget,
          dataId: pid,
          x: p.x || 0,
          y: p.y || 0,
          w: p.width || contentAreaWidth * 0.96,
          h: p.height || 96,
        };
      }
    } else if (sid.startsWith('free-')) {
      const fid = sid.slice('free-'.length);
      const f = data.freeElements.find((fe) => fe.id === fid);
      if (f) {
        return {
          id: sid,
          target: 'free' as MoveTarget,
          dataId: f.id,
          x: f.x,
          y: f.y,
          w: f.width,
          h: f.height || 60,
        };
      }
    }
    return null;
  };

  const buildGroupInitials = (ids: string[]) => {
    const initials: Array<{
      id: string;
      target: MoveTarget;
      dataId?: string;
      x: number;
      y: number;
      w: number;
      h: number;
    }> = [];
    ids.forEach((sid) => {
      const b = boundsForId(sid);
      if (b) initials.push(b);
    });
    return initials;
  };

  const startMove = (
    target: MoveTarget,
    selId: string,
    dataId: string,
    initX: number,
    initY: number,
    e: React.MouseEvent,
    minW = 80,
    minH = 40
  ) => {
    if (isInteractiveTarget(e)) return;
    e.preventDefault();
    e.stopPropagation();
    dragElRef.current = e.currentTarget as HTMLElement;
    movedRef.current = false;
    const isShift = e.shiftKey;
    const hasInSelection = selectedStyle5Ids.includes(selId);
    let nextIds = selectedStyle5Ids;
    if (isShift && hasInSelection) {
      nextIds = selectedStyle5Ids;
    } else if (isShift && !hasInSelection) {
      nextIds = [...selectedStyle5Ids, selId];
    } else if (hasInSelection) {
      // Elemen sudah terpilih: pertahankan seluruh pilihan agar bisa digeser
      // bersama (drag grup). Penciutan ke satu elemen dilakukan saat klik murni.
      nextIds = selectedStyle5Ids;
    } else {
      nextIds = [selId];
    }
    onSelectElement(selId);
    onSelectStyle5Ids?.(nextIds);
    const initials = buildGroupInitials(nextIds);
    setDragState({
      kind: 'move',
      target: nextIds.length >= 2 ? 'group' : target,
      id: dataId,
      startX: e.clientX,
      startY: e.clientY,
      init: { x: initX, y: initY, w: 0, h: 0 },
      minW,
      minH,
      groupInitials: nextIds.length >= 2 ? initials : undefined,
    });
    updateDragRect(e.clientX, e.clientY);
  };

  // ---- Resize (scale) untuk pilihan grup (>=2 elemen) ----
  const startGroupResize = (
    dir: string,
    bounds: { x: number; y: number; w: number; h: number },
    e: React.MouseEvent
  ) => {
    e.preventDefault();
    e.stopPropagation();
    movedRef.current = false;
    const initials = buildGroupInitials(selectedStyle5Ids);
    if (initials.length === 0) return;
    setDragState({
      kind: 'group-resize',
      target: 'group',
      dir,
      startX: e.clientX,
      startY: e.clientY,
      init: bounds,
      minW: 24,
      minH: 24,
      groupInitials: initials,
    });
    updateDragRect(e.clientX, e.clientY);
  };

  const applyGroupResize = (
    ds: DragState,
    rect: { x: number; y: number; w: number; h: number }
  ) => {
    if (!ds.groupInitials || ds.groupInitials.length === 0) return;
    const sx = ds.init.w > 0 ? rect.w / ds.init.w : 1;
    const sy = ds.init.h > 0 ? rect.h / ds.init.h : 1;
    let nextData: Style5Data = { ...data };
    ds.groupInitials.forEach((gi) => {
      const nx = Math.round(rect.x + (gi.x - ds.init.x) * sx);
      const ny = Math.round(rect.y + (gi.y - ds.init.y) * sy);
      const nw = Math.max(20, Math.round(gi.w * sx));
      const nh = Math.max(16, Math.round(gi.h * sy));
      if (gi.target === 'header') {
        nextData = {
          ...nextData,
          header: { ...nextData.header, x: nx, y: ny, width: nw, height: nh },
        };
      } else if (gi.target === 'photo') {
        nextData = {
          ...nextData,
          sidebar: {
            ...nextData.sidebar,
            photoX: nx,
            photoY: ny,
            photoWidth: nw,
            photoHeight: nh,
          },
        };
      } else if (gi.target === 'name') {
        nextData = {
          ...nextData,
          sidebar: {
            ...nextData.sidebar,
            nameX: nx,
            nameY: ny,
            nameWidth: nw,
            nameHeight: nh,
          },
        };
      } else if (gi.target === 'point' && gi.dataId) {
        nextData = {
          ...nextData,
          points: nextData.points.map((p) =>
            p.id === gi.dataId ? { ...p, x: nx, y: ny, width: nw, height: nh } : p
          ),
        };
      } else if (gi.target === 'free' && gi.dataId) {
        nextData = {
          ...nextData,
          freeElements: nextData.freeElements.map((f) =>
            f.id === gi.dataId ? { ...f, x: nx, y: ny, width: nw, height: nh } : f
          ),
        };
      }
    });
    onChange(nextData);
  };

  const startResize = (
    target: MoveTarget,
    id: string | undefined,
    dir: string,
    init: { x: number; y: number; w: number; h: number },
    minW: number,
    minH: number,
    e: React.MouseEvent
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const handleEl = e.currentTarget as HTMLElement;
    const boxEl =
      (handleEl.closest('[id^="style5-"]') as HTMLElement) || handleEl;
    dragElRef.current = boxEl;
    // Ukur ukuran asli elemen (border-box, koordinat kanvas) agar resize 1:1
    const initMeasured = {
      x: init.x,
      y: init.y,
      w: boxEl.offsetWidth || init.w,
      h: boxEl.offsetHeight || init.h,
    };
    setDragState({
      kind: 'resize',
      target,
      id,
      dir,
      startX: e.clientX,
      startY: e.clientY,
      init: initMeasured,
      minW,
      minH,
    });
    updateDragRect(e.clientX, e.clientY);
  };

  const computeResizedRect = (
    init: { x: number; y: number; w: number; h: number },
    dir: string,
    dx: number,
    dy: number,
    minW: number,
    minH: number
  ) => {
    let x = init.x;
    let y = init.y;
    let w = init.w;
    let h = init.h;
    if (dir.includes('e')) w = Math.max(minW, init.w + dx);
    if (dir.includes('s')) h = Math.max(minH, init.h + dy);
    if (dir.includes('w')) {
      const nw = Math.max(minW, init.w - dx);
      x = init.x + (init.w - nw);
      w = nw;
    }
    if (dir.includes('n')) {
      const nh = Math.max(minH, init.h - dy);
      y = init.y + (init.h - nh);
      h = nh;
    }
    return { x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) };
  };

  const applyMove = (ds: DragState, nx: number, ny: number) => {
    if (ds.target === 'group' && ds.groupInitials && ds.groupInitials.length > 0) {
      const dx = nx - ds.init.x;
      const dy = ny - ds.init.y;
      let nextData: Style5Data = { ...data };
      ds.groupInitials.forEach((gi) => {
        if (gi.target === 'header') {
          nextData = {
            ...nextData,
            header: {
              ...nextData.header,
              x: Math.round(gi.x + dx),
              y: Math.round(gi.y + dy),
            },
          };
        } else if (gi.target === 'photo') {
          nextData = {
            ...nextData,
            sidebar: {
              ...nextData.sidebar,
              photoX: Math.round(gi.x + dx),
              photoY: Math.round(gi.y + dy),
            },
          };
        } else if (gi.target === 'name') {
          nextData = {
            ...nextData,
            sidebar: {
              ...nextData.sidebar,
              nameX: Math.round(gi.x + dx),
              nameY: Math.round(gi.y + dy),
            },
          };
        } else if (gi.target === 'point' && gi.dataId) {
          nextData = {
            ...nextData,
            points: nextData.points.map((p) =>
              p.id === gi.dataId
                ? { ...p, x: Math.round(gi.x + dx), y: Math.round(gi.y + dy) }
                : p
            ),
          };
        } else if (gi.target === 'free' && gi.dataId) {
          nextData = {
            ...nextData,
            freeElements: nextData.freeElements.map((f) =>
              f.id === gi.dataId
                ? { ...f, x: Math.max(0, Math.round(gi.x + dx)), y: Math.max(0, Math.round(gi.y + dy)) }
                : f
            ),
          };
        } else if (gi.target === 'pill' && gi.dataId) {
          nextData = {
            ...nextData,
            points: nextData.points.map((p) =>
              p.id === gi.dataId
                ? { ...p, pillX: Math.round(gi.x + dx), pillY: Math.round(gi.y + dy) }
                : p
            ),
          };
        } else if (gi.target === 'desc' && gi.dataId) {
          nextData = {
            ...nextData,
            points: nextData.points.map((p) =>
              p.id === gi.dataId
                ? { ...p, descX: Math.round(gi.x + dx), descY: Math.round(gi.y + dy) }
                : p
            ),
          };
        }
      });
      onChange(nextData);
      return;
    }
    if (ds.target === 'header') {
      onChange({ ...data, header: { ...data.header, x: nx, y: ny } });
    } else if (ds.target === 'photo') {
      onChange({
        ...data,
        sidebar: { ...data.sidebar, photoX: nx, photoY: ny },
      });
    } else if (ds.target === 'name') {
      onChange({
        ...data,
        sidebar: { ...data.sidebar, nameX: nx, nameY: ny },
      });
    } else if (ds.target === 'point' && ds.id) {
      onChange({
        ...data,
        points: data.points.map((p) =>
          p.id === ds.id ? { ...p, x: nx, y: ny } : p
        ),
      });
    } else if (ds.target === 'pill' && ds.id) {
      // Geser PILL saja (deskripsi tetap di tempatnya)
      onChange({
        ...data,
        points: data.points.map((p) =>
          p.id === ds.id ? { ...p, pillX: nx, pillY: ny } : p
        ),
      });
    } else if (ds.target === 'desc' && ds.id) {
      // Geser BOX DESKRIPSI saja (pill tetap di tempatnya)
      onChange({
        ...data,
        points: data.points.map((p) =>
          p.id === ds.id ? { ...p, descX: nx, descY: ny } : p
        ),
      });
    } else if (ds.target === 'free' && ds.id) {
      onChange({
        ...data,
        freeElements: data.freeElements.map((f) =>
          f.id === ds.id
            ? { ...f, x: Math.max(0, nx), y: Math.max(0, ny) }
            : f
        ),
      });
    }
  };

  const applyResize = (ds: DragState, x: number, y: number, w: number, h: number) => {
    // Hanya tulis dimensi yang benar-benar berubah, agar dimensi lain tetap mengikuti tata letak
    const wChanged = Math.round(w) !== Math.round(ds.init.w);
    const hChanged = Math.round(h) !== Math.round(ds.init.h);
    if (ds.target === 'header') {
      onChange({
        ...data,
        header: {
          ...data.header,
          x,
          y,
          width: wChanged ? Math.max(220, w) : data.header.width,
          height: hChanged ? Math.max(48, h) : data.header.height,
        },
      });
    } else if (ds.target === 'photo') {
      onChange({
        ...data,
        sidebar: {
          ...data.sidebar,
          photoX: x,
          photoY: y,
          photoWidth: wChanged ? Math.max(80, w) : data.sidebar.photoWidth,
          photoHeight: hChanged ? Math.max(90, h) : data.sidebar.photoHeight,
        },
      });
    } else if (ds.target === 'name') {
      onChange({
        ...data,
        sidebar: {
          ...data.sidebar,
          nameX: x,
          nameY: y,
          nameWidth: wChanged ? Math.max(80, w) : data.sidebar.nameWidth,
          nameHeight: hChanged ? Math.max(24, h) : data.sidebar.nameHeight,
        },
      });
    } else if (ds.target === 'point' && ds.id) {
      onChange({
        ...data,
        points: data.points.map((p) =>
          p.id === ds.id
            ? {
                ...p,
                x,
                y,
                width: wChanged ? Math.max(200, w) : p.width,
                height: hChanged ? Math.max(40, h) : p.height,
              }
            : p
        ),
      });
    } else if (ds.target === 'pill' && ds.id) {
      // Skala PILL saja
      onChange({
        ...data,
        points: data.points.map((p) =>
          p.id === ds.id
            ? {
                ...p,
                pillX: x,
                pillY: y,
                pillWidth: wChanged ? Math.max(80, w) : p.pillWidth,
                pillHeight: hChanged ? Math.max(40, h) : p.pillHeight,
              }
            : p
        ),
      });
    } else if (ds.target === 'desc' && ds.id) {
      // Skala BOX DESKRIPSI saja
      onChange({
        ...data,
        points: data.points.map((p) =>
          p.id === ds.id
            ? {
                ...p,
                descX: x,
                descY: y,
                descWidth: wChanged ? Math.max(80, w) : p.descWidth,
                descHeight: hChanged ? Math.max(40, h) : p.descHeight,
              }
            : p
        ),
      });
    } else if (ds.target === 'free' && ds.id) {
      onChange({
        ...data,
        freeElements: data.freeElements.map((f) =>
          f.id === ds.id
            ? {
                ...f,
                x,
                y,
                width: wChanged ? Math.max(80, w) : f.width,
                height: hChanged ? Math.max(40, h) : f.height,
              }
            : f
        ),
      });
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    // Drag foto di dalam bingkai (pan)
    if (photoPanDrag && !dragState) {
      const fw = photoW;
      const fh = photoH;
      const dx = ((e.clientX - photoPanDrag.startX) / (fw || 1)) * 100;
      const dy = ((e.clientY - photoPanDrag.startY) / (fh || 1)) * 100;
      onChange({
        ...data,
        sidebar: {
          ...data.sidebar,
          photoPanX: Math.round(clampNum(photoPanDrag.panX + dx, -50, 50)),
          photoPanY: Math.round(clampNum(photoPanDrag.panY + dy, -50, 50)),
        },
      });
      return;
    }

    if (!dragState) return;
    const sf = scaleFactor || 1;
    const dx = (e.clientX - dragState.startX) / sf;
    const dy = (e.clientY - dragState.startY) / sf;
    const dragW = dragState.init.w || dragState.minW || 80;
    const dragH = dragState.init.h || dragState.minH || 40;

    if (dragState.kind === 'group-resize') {
      movedRef.current = true;
      const r = computeResizedRect(
        dragState.init,
        dragState.dir || 'se',
        dx,
        dy,
        dragState.minW,
        dragState.minH
      );
      applyGroupResize(dragState, r);
      updateDragRect(e.clientX, e.clientY);
      return;
    }

    if (dragState.kind === 'move') {
      movedRef.current = true;
      const nx = Math.round(dragState.init.x + dx);
      const ny = Math.round(dragState.init.y + dy);
      applyMove(
        dragState,
        clampNum(nx, -dragW, canvasWidth + dragW),
        clampNum(ny, -dragH, canvasHeight + dragH)
      );
    } else {
      const r = computeResizedRect(
        dragState.init,
        dragState.dir || 'se',
        dx,
        dy,
        dragState.minW,
        dragState.minH
      );
      applyResize(dragState, r.x, r.y, r.w, r.h);
    }
    updateDragRect(e.clientX, e.clientY);
  };

  const handleCanvasMouseUp = () => {
    setDragState(null);
    setPhotoPanDrag(null);
    setDragRect(null);
    // Bersihkan flag setelah event click (yang menyusul mouseup) diproses.
    setTimeout(() => {
      movedRef.current = false;
    }, 0);
  };

  // ---- Panah keyboard: geser elemen terpilih (Shift = langkah 10px) ----
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const inField =
        t && typeof t.closest === 'function' &&
        t.closest('input, textarea, select, [contenteditable="true"]');

      // Multi-select (Gaya 5): Hapus / duplikat di tempat via keyboard
      if (selectedStyle5Ids.length >= 2 && !inField) {
        if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault();
          const ids = selectedStyle5Ids;
          const pts = ids.filter((x) => x.startsWith('point-')).map((x) => x.slice(6));
          const frees = ids.filter((x) => x.startsWith('free-')).map((x) => x.slice(5));
          onChange({
            ...data,
            points: data.points.filter((p) => !pts.includes(p.id)),
            freeElements: data.freeElements.filter((f) => !frees.includes(f.id)),
          });
          onSelectStyle5Ids?.([]);
          onSelectElement(null);
          return;
        }
        if ((e.ctrlKey || e.metaKey) && (e.key === 'd' || e.key === 'D')) {
          e.preventDefault();
          const ids = selectedStyle5Ids;
          const newIds: string[] = [];
          const offset = 24;
          const nextPoints = [...data.points];
          const nextFrees = [...data.freeElements];
          ids.forEach((id) => {
            if (id.startsWith('point-')) {
              const pid = id.slice(6);
              const src = data.points.find((p) => p.id === pid);
              if (!src) return;
              const nid = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
              newIds.push(`point-${nid}`);
              nextPoints.push({
                ...src,
                id: nid,
                x: (src.x || 0) + offset,
                y: (src.y || 0) + offset,
                pillX: (src.pillX || 0) + offset,
                pillY: (src.pillY || 0) + offset,
                descX: (src.descX || 0) + offset,
                descY: (src.descY || 0) + offset,
              });
            } else if (id.startsWith('free-')) {
              const fid = id.slice(5);
              const src = data.freeElements.find((f) => f.id === fid);
              if (!src) return;
              const nid = `free-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
              newIds.push(`free-${nid}`);
              nextFrees.push({ ...src, id: nid, x: src.x + offset, y: src.y + offset });
            }
          });
          onChange({ ...data, points: nextPoints, freeElements: nextFrees });
          onSelectStyle5Ids?.(newIds);
          return;
        }
      }

      if (!e.key.startsWith('Arrow')) return;
      const sel = selectedElementId;
      if (!sel) return;
      if (inField) {
        return;
      }
      const step = e.shiftKey ? 10 : 1;
      const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
      const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;
      if (!dx && !dy) return;
      e.preventDefault();
      if (sel === 'header') {
        onChange({
          ...data,
          header: { ...data.header, x: (data.header.x || 0) + dx, y: (data.header.y || 0) + dy },
        });
      } else if (sel === 'photo') {
        onChange({
          ...data,
          sidebar: {
            ...data.sidebar,
            photoX: (data.sidebar.photoX || 0) + dx,
            photoY: (data.sidebar.photoY || 0) + dy,
          },
        });
      } else if (sel === 'name') {
        onChange({
          ...data,
          sidebar: {
            ...data.sidebar,
            nameX: (data.sidebar.nameX || 0) + dx,
            nameY: (data.sidebar.nameY || 0) + dy,
          },
        });
      } else if (sel.startsWith('point-')) {
        const pid = sel.slice('point-'.length);
        const mode = pointResizeMode;
        onChange({
          ...data,
          points: data.points.map((p) => {
            if (p.id !== pid) return p;
            if (mode === 'pill') {
              return {
                ...p,
                pillX: (p.pillX || 0) + dx,
                pillY: (p.pillY || 0) + dy,
              };
            }
            if (mode === 'desc') {
              return {
                ...p,
                descX: (p.descX || 0) + dx,
                descY: (p.descY || 0) + dy,
              };
            }
            return { ...p, x: (p.x || 0) + dx, y: (p.y || 0) + dy };
          }),
        });
      } else if (sel.startsWith('free-')) {
        const fid = sel.slice('free-'.length);
        onChange({
          ...data,
          freeElements: data.freeElements.map((f) =>
            f.id === fid ? { ...f, x: f.x + dx, y: f.y + dy } : f
          ),
        });
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  // Gagang resize 8 arah untuk elemen terpilih
  const renderResizeHandles = (
    target: MoveTarget,
    id: string | undefined,
    init: { x: number; y: number; w: number; h: number },
    minW: number,
    minH: number
  ) => {
    const dirs = [
      { d: 'nw', cls: 'left-0 top-0 cursor-nwse-resize' },
      { d: 'n', cls: 'left-1/2 -translate-x-1/2 top-0 cursor-ns-resize' },
      { d: 'ne', cls: 'right-0 top-0 cursor-nesw-resize' },
      { d: 'e', cls: 'right-0 top-1/2 -translate-y-1/2 cursor-ew-resize' },
      { d: 'se', cls: 'right-0 bottom-0 cursor-nwse-resize' },
      { d: 's', cls: 'left-1/2 -translate-x-1/2 bottom-0 cursor-ns-resize' },
      { d: 'sw', cls: 'left-0 bottom-0 cursor-nesw-resize' },
      { d: 'w', cls: 'left-0 top-1/2 -translate-y-1/2 cursor-ew-resize' },
    ];
    return (
      <>
        {dirs.map((h) => (
          <div
            key={h.d}
            data-resize-handle="true"
            onMouseDown={(e) => startResize(target, id, h.d, init, minW, minH, e)}
            className={`absolute w-3 h-3 bg-indigo-600 rounded-full border border-white shadow-md z-40 opacity-90 hover:opacity-100 hover:scale-125 transition-all ${h.cls}`}
            title="Tarik untuk mengubah ukuran"
          />
        ))}
      </>
    );
  };

  const handleDuplicateFreeElement = (el: Style5FreeElement) => {
    const newEl: Style5FreeElement = {
      ...el,
      id: `free-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      x: el.x + 30,
      y: el.y + 30,
    };
    onChange({
      ...data,
      freeElements: [...data.freeElements, newEl],
    });
    if (onToast) onToast('Elemen bebas diduplikasi');
  };

  const handleDeleteFreeElement = (id: string) => {
    if (!window.confirm('Hapus elemen ini dari slide?')) return;
    onChange({
      ...data,
      freeElements: data.freeElements.filter((f) => f.id !== id),
    });
    if (selectedElementId === `free-${id}`) onSelectElement(null);
    if (onToast) onToast('Elemen bebas dihapus');
  };

  // Photo upload handler
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      onChange({
        ...data,
        sidebar: {
          ...data.sidebar,
          photoUrl: url,
        },
      });
      if (onToast) onToast('Foto berhasil diunggah!');
    };
    reader.readAsDataURL(file);
  };

  // Export selected element as transparent PNG
  const handleExportSelected = async (elementId: string, filename: string) => {
    const el = document.getElementById(elementId);
    if (!el) return;
    try {
      await exportAsPng(el, {
        scale: 2,
        transparent: true,
        filename: `elemen-${filename}`,
      });
      if (onToast) onToast('Elemen berhasil diekspor sebagai PNG transparan!');
    } catch (err) {
      console.error(err);
      if (onToast) onToast('Gagal mengekspor elemen');
    }
  };

  // Start inline editing
  const startInlineEdit = (id: string, initialText: string) => {
    setEditingId(id);
    setEditText(initialText);
  };

  // Save inline edit
  const finishInlineEdit = (save: boolean = true) => {
    if (!editingId || !save) {
      setEditingId(null);
      return;
    }

    if (editingId === 'header-title') {
      onChange({
        ...data,
        header: { ...data.header, title: editText },
      });
    } else if (editingId === 'header-number') {
      onChange({
        ...data,
        header: { ...data.header, number: editText },
      });
    } else if (editingId === 'sidebar-name') {
      onChange({
        ...data,
        sidebar: { ...data.sidebar, name: editText },
      });
    } else if (editingId.startsWith('point-pill-')) {
      const ptId = editingId.replace('point-pill-', '');
      onChange({
        ...data,
        points: data.points.map((p) =>
          p.id === ptId ? { ...p, pillText: editText } : p
        ),
      });
    } else if (editingId.startsWith('point-desc-')) {
      const ptId = editingId.replace('point-desc-', '');
      onChange({
        ...data,
        points: data.points.map((p) =>
          p.id === ptId ? { ...p, descriptionText: editText } : p
        ),
      });
    } else if (editingId.startsWith('point-num-')) {
      const ptId = editingId.replace('point-num-', '');
      onChange({
        ...data,
        points: data.points.map((p) =>
          p.id === ptId ? { ...p, number: editText } : p
        ),
      });
    } else if (editingId.startsWith('free-')) {
      const fId = editingId.replace('free-', '');
      onChange({
        ...data,
        freeElements: data.freeElements.map((f) =>
          f.id === fId ? { ...f, content: editText } : f
        ),
      });
    }

    setEditingId(null);
  };

  // Points manipulation
  const handleDuplicatePoint = (pt: Style5PointItem) => {
    if (data.points.length >= 8) {
      if (onToast) onToast('Maksimal 8 poin');
      return;
    }
    const newIdx = data.points.length + 1;
    const copy: Style5PointItem = {
      ...pt,
      id: `s5-p-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      number: newIdx < 10 ? `0${newIdx}` : `${newIdx}`,
    };
    onChange({
      ...data,
      points: [...data.points, copy],
    });
    if (onToast) onToast('Poin diduplikasi');
  };

  const handleDeletePoint = (id: string) => {
    if (data.points.length <= 1) {
      if (onToast) onToast('Minimal 1 poin');
      return;
    }
    if (!window.confirm('Hapus poin ini beserta isinya?')) return;
    onChange({
      ...data,
      points: data.points.filter((p) => p.id !== id),
    });
    if (selectedElementId === `point-${id}`) onSelectElement(null);
    if (onToast) onToast('Poin dihapus');
  };

  const handleMovePoint = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= data.points.length) return;
    const pts = [...data.points];
    const temp = pts[index];
    pts[index] = pts[targetIdx];
    pts[targetIdx] = temp;
    onChange({ ...data, points: pts });
  };

  // Transformed Texts
  const displayHeaderTitle = applyTextCaseTransform(
    data.header.title || 'Hubungan antara Ilmu Sejarah dan Ilmu Sosial',
    caseSettings.style5HeaderCase || 'none'
  );

  const displaySidebarName = applyTextCaseTransform(
    data.sidebar.name || 'Peter Burke',
    caseSettings.style5NameCase || 'none'
  );

  return (
    <div
      id="style5-canvas-root"
      ref={canvasRef}
      className="relative flex flex-row w-full h-full select-none overflow-hidden"
      style={{
        width: `${canvasWidth}px`,
        height: `${canvasHeight}px`,
        backgroundColor:
          colors.canvasBg === 'transparent' ||
          colors.canvasBg === 'rgba(0,0,0,0)'
            ? 'transparent'
            : colors.canvasBg || '#ffffff',
        fontFamily: "'Rubik', sans-serif",
      }}
      onClick={(e) => {
        if (e.shiftKey) return;
        if (movedRef.current) return;
        onSelectElement(null);
        onSelectStyle5Ids?.([]);
      }}
      onMouseMove={handleCanvasMouseMove}
      onMouseUp={handleCanvasMouseUp}
      onMouseLeave={handleCanvasMouseUp}
    >
      <input
        type="file"
        ref={photoInputRef}
        onChange={handlePhotoUpload}
        accept="image/png, image/jpeg, image/webp"
        className="hidden"
      />

      {/* ========================================================
          1. SIDEBAR KIRI
          ======================================================== */}
      {data.sidebar.show && (
        <div
          id="style5-sidebar"
          className="relative h-full flex flex-col items-center justify-start shrink-0 z-10 transition-all border-r"
          style={{
            width: `${sidebarPixelWidth}px`,
            backgroundColor: colors.mainColor,
            borderColor: colors.borderColor,
            paddingTop: `${Math.round(canvasHeight * 0.055)}px`,
            paddingBottom: `${Math.round(canvasHeight * 0.04)}px`,
            paddingLeft: '24px',
            paddingRight: '24px',
            gap: `${Math.round(canvasHeight * 0.03)}px`,
          }}
          onClick={(e) => {
            e.stopPropagation();
            onSelectElement('sidebar');
          }}
        >
          {/* FOTO TOKOH */}
          {data.sidebar.showPhoto && (
            <div
              id="style5-photo-frame"
              className={`relative group transition-all flex items-center justify-center ${
                selectedElementId === 'photo' ? 'ring-4 ring-amber-400 ring-offset-2' : selectedStyle5Ids.includes('photo') ? 'ring-2 ring-amber-400 ring-offset-2' : 'cursor-pointer'
              }`}
              style={{
                width: `${photoW}px`,
                height: `${photoH}px`,
                borderRadius: `${Math.round(layout.borderRadius * 1.5)}px`,
                backgroundColor: '#ffffff15',
                borderWidth: '4px',
                borderStyle: 'solid',
                borderColor: shapeBorderColor(colors.mainColorDark || '#3E4078'),
                transform: `translate(${photoTX}px, ${photoTY}px)`,
                cursor: selectedElementId === 'photo' ? 'move' : 'pointer',
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (e.shiftKey) {
                  const id = 'photo';
                  const has = selectedStyle5Ids.includes(id);
                  onSelectStyle5Ids?.(has ? selectedStyle5Ids.filter(x=>x!==id) : [...selectedStyle5Ids, id]);
                } else {
                  onSelectElement('photo');
                  onSelectStyle5Ids?.(['photo']);
                }
              }}
              onMouseDown={(e) => {
                if (isInteractiveTarget(e)) return;
                e.stopPropagation();
                onSelectElement('photo');
                if ((e.target as HTMLElement).closest('img')) {
                  // Drag foto DI DALAM bingkai (pan)
                  setPhotoPanDrag({
                    startX: e.clientX,
                    startY: e.clientY,
                    panX: data.sidebar.photoPanX || 0,
                    panY: data.sidebar.photoPanY || 0,
                  });
                } else {
                  // Drag tepi bingkai = geser bingkai
                  dragElRef.current = e.currentTarget as HTMLElement;
                  setDragState({
                    kind: 'move',
                    target: 'photo',
                    id: 'photo',
                    startX: e.clientX,
                    startY: e.clientY,
                    init: { x: photoTX, y: photoTY, w: 0, h: 0 },
                    minW: 80,
                    minH: 90,
                  });
                  updateDragRect(e.clientX, e.clientY);
                }
              }}
              onWheel={(e) => {
                e.stopPropagation();
                const next = clampNum(
                  Math.round(((data.sidebar.photoZoom || 1) - e.deltaY * 0.002) * 100) / 100,
                  1,
                  3
                );
                onChange({
                  ...data,
                  sidebar: { ...data.sidebar, photoZoom: next },
                });
              }}
              title="Seret foto untuk pan, scroll untuk zoom, seret tepi bingkai untuk memindah"
            >
              <ShapeBorder
                shape="rect"
                radius={Math.round(layout.borderRadius * 1.5)}
                color={colors.mainColorDark || '#3E4078'}
                strokeWidth={4}
                profile={shapeProfile}
              />
              <div
                className="absolute inset-0 overflow-hidden"
                style={{
                  borderRadius: `${Math.max(
                    0,
                    Math.round(layout.borderRadius * 1.5) - 4
                  )}px`,
                }}
              >
              {data.sidebar.photoUrl ? (
                <img
                  src={data.sidebar.photoUrl}
                  alt={data.sidebar.name || 'Foto Tokoh'}
                  className="w-full h-full object-cover transition-transform"
                  draggable={false}
                  style={{
                    transform: `scale(${data.sidebar.photoZoom || 1}) translate(${
                      data.sidebar.photoPanX || 0
                    }%, ${data.sidebar.photoPanY || 0}%)`,
                    cursor: selectedElementId === 'photo' ? 'grab' : 'pointer',
                  }}
                />
              ) : (
                <div
                  data-photo-placeholder="true"
                  className="w-full h-full flex flex-col items-center justify-center text-white/80 p-4 text-center cursor-pointer hover:bg-white/10 transition-colors"
                  onClick={() => photoInputRef.current?.click()}
                >
                  <Camera className="w-8 h-8 mb-2 opacity-70" />
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Upload Foto
                  </span>
                  <span className="text-[10px] text-white/60 mt-1">PNG atau JPG</span>
                </div>
              )}

              {/* Hover overlay for changing photo */}
              <button
                type="button"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  photoInputRef.current?.click();
                }}
                className="absolute inset-0 bg-black/40 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <Upload className="w-6 h-6 mb-1" />
                <span className="text-[11px] font-semibold">Ganti Foto</span>
              </button>

              </div>

              {/* Gagang resize bingkai foto */}
              {selectedElementId === 'photo' &&
                renderResizeHandles(
                  'photo',
                  'photo',
                  { x: photoTX, y: photoTY, w: photoW, h: photoH },
                  80,
                  90
                )}
            </div>
          )}

          {/* NAMA TOKOH */}
          {data.sidebar.showName && (
            <div
              id="style5-sidebar-name"
              className={`relative px-6 py-2.5 rounded-full flex items-center justify-center shadow-xs transition-all ${
                selectedElementId === 'name' ? 'ring-4 ring-amber-400 ring-offset-2 cursor-move' : selectedStyle5Ids.includes('name') ? 'ring-2 ring-amber-400 ring-offset-2 cursor-move' : 'cursor-pointer'
              }`}
              style={{
                backgroundColor: colors.accentPillBg,
                color: colors.accentPillText,
                borderColor: shapeBorderColor(colors.borderColor),
                borderWidth: '2px',
                borderStyle: 'solid',
                fontSize: `${layout.fontSizeName}px`,
                maxWidth: data.sidebar.nameWidth ? 'none' : '92%',
                width: data.sidebar.nameWidth ? `${data.sidebar.nameWidth}px` : undefined,
                height: data.sidebar.nameHeight ? `${data.sidebar.nameHeight}px` : undefined,
                transform: `translate(${nameX}px, ${nameY}px)`,
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (e.shiftKey) {
                  const id = 'name';
                  const has = selectedStyle5Ids.includes(id);
                  onSelectStyle5Ids?.(has ? selectedStyle5Ids.filter(x=>x!==id) : [...selectedStyle5Ids, id]);
                } else {
                  onSelectElement('name');
                  onSelectStyle5Ids?.(['name']);
                }
              }}
              onMouseDown={(e) =>
                startMove('name', 'name', 'name', nameX, nameY, e, 80, 24)
              }
              onDoubleClick={(e) => {
                e.stopPropagation();
                startInlineEdit('sidebar-name', data.sidebar.name);
              }}
              title="Seret untuk memindah, klik 2x untuk edit nama langsung"
            >
              <ShapeBorder
                shape="pill"
                color={colors.borderColor}
                strokeWidth={2}
                profile={shapeProfile}
              />
              {editingId === 'sidebar-name' ? (
                <input
                  type="text"
                  value={editText}
                  autoFocus
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') finishInlineEdit(true);
                    if (e.key === 'Escape') finishInlineEdit(false);
                  }}
                  onBlur={() => finishInlineEdit(true)}
                  className="bg-white text-slate-900 px-2 py-0.5 rounded text-center font-bold border border-indigo-400 focus:outline-none w-full"
                />
              ) : (
                <span
                  className="text-center truncate tracking-wide"
                  style={{ fontWeight: style5WeightToNumber(layout.fontWeightName, 600) }}
                >
                  {displaySidebarName}
                </span>
              )}

              {selectedElementId === 'name' &&
                renderResizeHandles(
                  'name',
                  'name',
                  {
                    x: nameX,
                    y: nameY,
                    w: data.sidebar.nameWidth || 200,
                    h: data.sidebar.nameHeight || Math.max(32, layout.fontSizeName * 2 + 20),
                  },
                  80,
                  24
                )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          2. AREA KONTEN UTAMA
          ======================================================== */}
      <div
        className="flex-1 h-full flex flex-col justify-start overflow-hidden relative"
        style={{
          paddingTop: `${Math.round(canvasHeight * 0.055)}px`,
          paddingBottom: `${Math.round(canvasHeight * 0.055)}px`,
          paddingLeft: `${Math.round(canvasWidth * 0.038)}px`,
          paddingRight: `${Math.round(canvasWidth * 0.045)}px`,
          gap: `${Math.round(canvasHeight * 0.032)}px`,
        }}
      >
        {/* HEADER JUDUL BERNOMOR */}
        {data.header.show && (
          <div
            id="style5-header"
            className={`relative flex items-center shadow-xs transition-all ${
              selectedElementId === 'header' ? 'ring-4 ring-amber-400 ring-offset-2 cursor-move' : selectedStyle5Ids.includes('header') ? 'ring-2 ring-amber-400 ring-offset-2 cursor-move' : 'cursor-pointer'
            }`}
            style={{
              minHeight: `${Math.max(68, layout.fontSizeHeader * 2.3)}px`,
              backgroundColor: colors.mainColor,
              borderRadius: `${layout.borderRadius}px`,
              borderColor: shapeBorderColor(colors.borderColor),
              borderWidth: '2px',
              borderStyle: 'solid',
              paddingLeft: data.header.showNumberBox
                ? `${Math.max(72, layout.fontSizeHeader * 2.9)}px`
                : '32px',
              paddingRight: '32px',
              paddingTop: '16px',
              paddingBottom: '16px',
              width: data.header.width ? `${data.header.width}px` : undefined,
              height: data.header.height ? `${data.header.height}px` : undefined,
              transform: `translate(${data.header.x || 0}px, ${data.header.y || 0}px)`,
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (e.shiftKey) {
                const id = 'header';
                const has = selectedStyle5Ids.includes(id);
                onSelectStyle5Ids?.(has ? selectedStyle5Ids.filter(x=>x!==id) : [...selectedStyle5Ids, id]);
              } else {
                onSelectElement('header');
                onSelectStyle5Ids?.(['header']);
              }
            }}
            onMouseDown={(e) =>
              startMove(
                'header',
                'header',
                'header',
                data.header.x || 0,
                data.header.y || 0,
                e,
                220,
                48
              )
            }
          >
            {/* KOTAK NOMOR HEADER (Menimpa tepi kiri bar) */}
            <ShapeBorder
              shape="rect"
              radius={layout.borderRadius}
              color={colors.borderColor}
              strokeWidth={2}
              profile={shapeProfile}
            />
            {data.header.showNumberBox && (
              <div
                id="style5-header-number-box"
                className="absolute flex items-center justify-center font-bold shadow-md select-none transition-transform"
                style={{
                  left: `${-Math.round(layout.fontSizeHeader * 0.35)}px`,
                  width: `${Math.max(68, layout.fontSizeHeader * 2.5)}px`,
                  height: `${Math.max(68, layout.fontSizeHeader * 2.5)}px`,
                  backgroundColor: colors.numberBoxBg,
                  color: colors.headerNumberText,
                  borderColor: shapeBorderColor(colors.borderColor),
                  borderWidth: '2px',
                  borderStyle: 'solid',
                  borderRadius: `${Math.round(layout.borderRadius * 0.85)}px`,
                  fontSize: `${Math.round(layout.fontSizeHeader * 1.35)}px`,
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  startInlineEdit('header-number', data.header.number);
                }}
                title="Klik 2x untuk edit nomor header"
              >
                <ShapeBorder
                  shape="rect"
                  radius={Math.round(layout.borderRadius * 0.85)}
                  color={colors.borderColor}
                  strokeWidth={2}
                  profile={shapeProfile}
                />
                {editingId === 'header-number' ? (
                  <input
                    type="text"
                    value={editText}
                    autoFocus
                    maxLength={4}
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') finishInlineEdit(true);
                      if (e.key === 'Escape') finishInlineEdit(false);
                    }}
                    onBlur={() => finishInlineEdit(true)}
                    className="w-12 text-center bg-white text-slate-900 rounded font-bold border border-indigo-400 focus:outline-none"
                  />
                ) : (
                  <span>{data.header.number}</span>
                )}
              </div>
            )}

            {/* TEKS JUDUL HEADER */}
            <div
              className="flex-1 text-white tracking-tight leading-snug break-words"
              style={{
                fontSize: `${layout.fontSizeHeader}px`,
                fontWeight: style5WeightToNumber(layout.fontWeightHeader, 700),
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                startInlineEdit('header-title', data.header.title);
              }}
              title="Klik 2x untuk edit judul langsung"
            >
              {editingId === 'header-title' ? (
                <input
                  type="text"
                  value={editText}
                  autoFocus
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') finishInlineEdit(true);
                    if (e.key === 'Escape') finishInlineEdit(false);
                  }}
                  onBlur={() => finishInlineEdit(true)}
                  className="bg-white text-slate-900 px-3 py-1 rounded font-bold border border-indigo-400 focus:outline-none w-full"
                />
              ) : (
                <span>{displayHeaderTitle}</span>
              )}
            </div>

            {/* Floating Quick Action when selected */}
            {selectedElementId === 'header' && (
              <div
                className="absolute right-4 -top-10 flex items-center gap-1 bg-white border border-slate-200 px-2 py-1 rounded-xl shadow-lg z-30 text-xs"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => handleExportSelected('style5-header', 'header')}
                  className="p-1 hover:bg-slate-100 rounded text-slate-700"
                  title="Ekspor Header sebagai PNG Transparan"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => startInlineEdit('header-title', data.header.title)}
                  className="p-1 hover:bg-slate-100 rounded text-slate-700"
                  title="Edit Judul"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ ...data, header: { ...data.header, show: false } })}
                  className="p-1 hover:bg-rose-50 text-rose-600 rounded"
                  title="Sembunyikan Header"
                >
                  <EyeOff className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Gagang resize header */}
            {selectedElementId === 'header' &&
              renderResizeHandles(
                'header',
                'header',
                {
                  x: data.header.x || 0,
                  y: data.header.y || 0,
                  w: data.header.width || contentAreaWidth,
                  h: data.header.height || Math.max(68, layout.fontSizeHeader * 2.3),
                },
                220,
                48
              )}
          </div>
        )}

        {/* ========================================================
            3. DAFTAR POIN (1 SAMPAI 8)
            ======================================================== */}
        <div
          className="flex-1 flex flex-col justify-start overflow-hidden"
          style={{
            gap: `${layout.pointsGap}px`,
          }}
        >
          {data.points.map((pt, idx) => {
            const isSelected = selectedElementId === `point-${pt.id}`;
            const inMulti = selectedStyle5Ids.includes(`point-${pt.id}`);
            const numberLabel = pt.number || getStyle5ItemNumberLabel(idx, data.numberingType, data.startFrom);
            const pillText = applyTextCaseTransform(
              pt.pillText || `Poin ${idx + 1}`,
              caseSettings.style5PillCase || 'none'
            );
            const descText = applyTextCaseTransform(
              pt.descriptionText || '',
              caseSettings.style5DescCase || 'none'
            );

            const pillBg = pt.customPillColor || colors.accentPillBg;
            const descBg = pt.customDescBg || colors.descriptionBoxBg;
            const borderCol = pt.customBorderColor || colors.borderColor;
            const textCol = pt.customTextColor || colors.accentPillText;
            const descTextCol = pt.customTextColor || colors.descriptionBoxText;

            return (
              <div
                key={pt.id}
                id={`style5-point-${pt.id}`}
                className={`relative flex flex-col gap-2.5 transition-all select-none group ${
                  isSelected ? 'ring-2 ring-amber-400 ring-offset-4 rounded-2xl p-1 cursor-move' : inMulti ? 'ring-2 ring-amber-400 ring-offset-2 rounded-2xl p-0.5 cursor-move' : 'cursor-pointer'
                }`}
                style={{
                  transform: `translate(${pt.x || 0}px, ${pt.y || 0}px)`,
                  width: pt.width ? `${pt.width}px` : undefined,
                  height: pt.height ? `${pt.height}px` : undefined,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (movedRef.current) return;
                  const id = `point-${pt.id}`;
                  if (e.shiftKey) {
                    const has = selectedStyle5Ids.includes(id);
                    onSelectStyle5Ids?.(has ? selectedStyle5Ids.filter(x=>x!==id) : [...selectedStyle5Ids, id]);
                  } else {
                    onSelectElement(id);
                    onSelectStyle5Ids?.([id]);
                  }
                }}
                onMouseDown={(e) =>
                  startMove('point', `point-${pt.id}`, pt.id, pt.x || 0, pt.y || 0, e, 200, 40)
                }
              >
                {/* Floating Toolbar when point is selected */}
                {isSelected && (
                  <div
                    className="absolute right-2 -top-9 flex items-center gap-1 bg-white border border-slate-200 px-2 py-1 rounded-xl shadow-lg z-30 text-xs"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => handleExportSelected(`style5-point-${pt.id}`, `poin-${idx + 1}`)}
                      className="p-1 hover:bg-slate-100 rounded text-slate-700"
                      title="Ekspor Poin ini sebagai PNG Transparan"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMovePoint(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1 hover:bg-slate-100 disabled:opacity-30 rounded text-slate-700"
                      title="Geser Naik"
                    >
                      <MoveUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMovePoint(idx, 'down')}
                      disabled={idx === data.points.length - 1}
                      className="p-1 hover:bg-slate-100 disabled:opacity-30 rounded text-slate-700"
                      title="Geser Turun"
                    >
                      <MoveDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDuplicatePoint(pt)}
                      className="p-1 hover:bg-slate-100 rounded text-slate-700"
                      title="Duplikat Poin"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePoint(pt.id)}
                      className="p-1 hover:bg-rose-50 text-rose-600 rounded"
                      title="Hapus Poin"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <div className="w-px h-4 bg-slate-200 mx-0.5" />

                    {/* Pilih objek yang di-skala: Grup / Pill / Deskripsi */}
                    {([
                      { m: 'group' as const, label: 'Grup', show: true },
                      { m: 'pill' as const, label: 'Pill', show: pt.mode !== 'desc-only' },
                      {
                        m: 'desc' as const,
                        label: 'Desc',
                        show: pt.mode !== 'pill-only' && !!pt.descriptionText,
                      },
                    ])
                      .filter((o) => o.show)
                      .map((o) => (
                        <button
                          key={o.m}
                          type="button"
                          onClick={() => setPointResizeMode(o.m)}
                          className={`px-1.5 py-0.5 rounded-md text-[10px] font-semibold transition-colors ${
                            pointResizeMode === o.m
                              ? 'bg-indigo-600 text-white'
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                          title={`Skala: ${o.label}`}
                        >
                          {o.label}
                        </button>
                      ))}
                  </div>
                )}

                {/* Gagang resize poin (hanya mode Grup) */}
                {isSelected && pointResizeMode === 'group' &&
                  renderResizeHandles(
                    'point',
                    pt.id,
                    {
                      x: pt.x || 0,
                      y: pt.y || 0,
                      w: pt.width || contentAreaWidth * 0.96,
                      h: pt.height || 96,
                    },
                    200,
                    40
                  )}

                {/* a. PILL POIN */}
                {pt.mode !== 'desc-only' && (
                  <div
                    id={`style5-pill-${pt.id}`}
                    className="relative flex items-center shadow-xs transition-all rounded-full"
                    style={{
                      minHeight: `${pt.pillHeight || Math.max(50, layout.fontSizePill * 2.3)}px`,
                      height: pt.pillHeight ? `${pt.pillHeight}px` : undefined,
                      backgroundColor: pillBg,
                      borderColor: shapeBorderColor(borderCol),
                      borderWidth: '2px',
                      borderStyle: 'solid',
                      paddingLeft: pt.hideNumberBox
                        ? '24px'
                        : `${Math.max(58, layout.fontSizePill * 2.55)}px`,
                      paddingRight: '28px',
                      paddingTop: '8px',
                      paddingBottom: '8px',
                      maxWidth: pt.pillWidth ? 'none' : pt.width ? '100%' : '96%',
                      width: pt.pillWidth
                        ? `${pt.pillWidth}px`
                        : pt.width
                        ? '100%'
                        : undefined,
                      transform: `translate(${pt.pillX || 0}px, ${pt.pillY || 0}px)`,
                      transition: dragState?.target === 'pill' ? 'none' : undefined,
                    }}
                    onMouseDown={(e) =>
                      startMove(
                        'pill',
                        `point-${pt.id}`,
                        pt.id,
                        pt.pillX || 0,
                        pt.pillY || 0,
                        e,
                        80,
                        40
                      )
                    }
                    title="Seret untuk memindah pill saja (deskripsi tetap)"
                  >
                    <ShapeBorder
                      shape="pill"
                      color={borderCol}
                      strokeWidth={2}
                      profile={shapeProfile}
                    />
                    {/* Gagang resize khusus PILL */}
                    {isSelected && pointResizeMode === 'pill' &&
                      renderResizeHandles(
                        'pill',
                        pt.id,
                        { x: pt.pillX || 0, y: pt.pillY || 0, w: 0, h: 0 },
                        80,
                        40
                      )}

                    {/* Kotak Nomor Pill (Menimpa tepi kiri pill) */}
                    {!pt.hideNumberBox && (
                      <div
                        id={`style5-point-num-${pt.id}`}
                        className="absolute flex items-center justify-center font-bold shadow-md select-none transition-transform"
                        style={{
                          left: `${-Math.round(layout.fontSizePill * 0.25)}px`,
                          width: `${Math.max(50, layout.fontSizePill * 2.4)}px`,
                          height: `${Math.max(50, layout.fontSizePill * 2.4)}px`,
                          backgroundColor: colors.numberBoxBg,
                          color: colors.pointNumberText,
                          borderColor: shapeBorderColor(borderCol),
                          borderWidth: '2px',
                          borderStyle: 'solid',
                          borderRadius: `${Math.round(layout.borderRadius * 0.7)}px`,
                          fontSize: `${Math.round(layout.fontSizePill * 1.25)}px`,
                        }}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          startInlineEdit(`point-num-${pt.id}`, pt.number || numberLabel);
                        }}
                        title="Klik 2x untuk edit nomor poin"
                      >
                        <ShapeBorder
                          shape="rect"
                          radius={Math.round(layout.borderRadius * 0.7)}
                          color={borderCol}
                          strokeWidth={2}
                          profile={shapeProfile}
                        />
                        {editingId === `point-num-${pt.id}` ? (
                          <input
                            type="text"
                            value={editText}
                            autoFocus
                            maxLength={4}
                            onChange={(e) => setEditText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') finishInlineEdit(true);
                              if (e.key === 'Escape') finishInlineEdit(false);
                            }}
                            onBlur={() => finishInlineEdit(true)}
                            className="w-10 text-center bg-white text-slate-900 rounded font-bold border border-indigo-400 focus:outline-none"
                          />
                        ) : (
                          <span>{numberLabel}</span>
                        )}
                      </div>
                    )}

                    {/* Teks Pill Poin */}
                    <div
                      className="flex-1 tracking-normal leading-snug break-words"
                      style={{
                        fontSize: `${pt.customFontSizePill || layout.fontSizePill}px`,
                        color: textCol,
                        fontWeight: style5WeightToNumber(layout.fontWeightPill, 400),
                      }}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        startInlineEdit(`point-pill-${pt.id}`, pt.pillText);
                      }}
                      title="Klik 2x untuk edit teks pill langsung"
                    >
                      {editingId === `point-pill-${pt.id}` ? (
                        <input
                          type="text"
                          value={editText}
                          autoFocus
                          onChange={(e) => setEditText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') finishInlineEdit(true);
                            if (e.key === 'Escape') finishInlineEdit(false);
                          }}
                          onBlur={() => finishInlineEdit(true)}
                          className="bg-white text-slate-900 px-3 py-1 rounded font-medium border border-indigo-400 focus:outline-none w-full"
                        />
                      ) : (
                        <span>{pillText}</span>
                      )}
                    </div>
                  </div>
                )}

                {/* b. BOX DESKRIPSI (Menjorok ke kanan / indent) */}
                {pt.mode !== 'pill-only' && pt.descriptionText && (
                  <div
                    id={`style5-desc-${pt.id}`}
                    className="relative shadow-xs transition-all leading-relaxed whitespace-pre-wrap break-words"
                    style={{
                      marginLeft: `${Math.round(canvasWidth * 0.024)}px`,
                      backgroundColor: descBg,
                      borderColor: shapeBorderColor(borderCol),
                      borderWidth: '2px',
                      borderStyle: 'solid',
                      borderRadius: `${Math.round(layout.borderRadius * 0.85)}px`,
                      color: descTextCol,
                      padding: '16px 24px',
                      fontSize: `${pt.customFontSizeDesc || layout.fontSizeDesc}px`,
                      fontWeight: style5WeightToNumber(layout.fontWeightDesc, 400),
                      maxWidth: pt.descWidth ? 'none' : pt.width ? '100%' : '92%',
                      width: pt.descWidth
                        ? `${pt.descWidth}px`
                        : pt.width
                        ? '100%'
                        : undefined,
                      height: pt.descHeight ? `${pt.descHeight}px` : undefined,
                      flex: pt.descHeight ? undefined : pt.height ? '1 1 auto' : undefined,
                      minHeight: pt.descHeight ? 40 : pt.height ? 24 : undefined,
                      transform: `translate(${pt.descX || 0}px, ${pt.descY || 0}px)`,
                      transition: dragState?.target === 'desc' ? 'none' : undefined,
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      startInlineEdit(`point-desc-${pt.id}`, pt.descriptionText);
                    }}
                    onMouseDown={(e) =>
                      startMove(
                        'desc',
                        `point-${pt.id}`,
                        pt.id,
                        pt.descX || 0,
                        pt.descY || 0,
                        e,
                        80,
                        40
                      )
                    }
                    title="Seret untuk memindah box deskripsi saja, klik 2x untuk edit teks"
                  >
                    <ShapeBorder
                      shape="rect"
                      radius={Math.round(layout.borderRadius * 0.85)}
                      color={borderCol}
                      strokeWidth={2}
                      profile={shapeProfile}
                    />
                    {/* Gagang resize khusus BOX DESKRIPSI */}
                    {isSelected && pointResizeMode === 'desc' &&
                      renderResizeHandles(
                        'desc',
                        pt.id,
                        { x: pt.descX || 0, y: pt.descY || 0, w: 0, h: 0 },
                        80,
                        40
                      )}

                    {editingId === `point-desc-${pt.id}` ? (
                      <textarea
                        rows={3}
                        value={editText}
                        autoFocus
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                            finishInlineEdit(true);
                          }
                          if (e.key === 'Escape') finishInlineEdit(false);
                        }}
                        onBlur={() => finishInlineEdit(true)}
                        className="bg-white text-slate-900 p-2 rounded border border-indigo-400 focus:outline-none w-full"
                      />
                    ) : (
                      <span>{descText}</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* BBOX overlay untuk multi-select (>=2) */}
      {selectedStyle5Ids.length >= 2 && (() => {
        let minX = Infinity,
          minY = Infinity,
          maxX = -Infinity,
          maxY = -Infinity;
        for (const sid of selectedStyle5Ids) {
          const b = boundsForId(sid);
          if (b) {
            minX = Math.min(minX, b.x);
            minY = Math.min(minY, b.y);
            maxX = Math.max(maxX, b.x + b.w);
            maxY = Math.max(maxY, b.y + b.h);
          }
        }
        if (minX === Infinity) return null;
        const bx = minX;
        const by = minY;
        const bw = maxX - minX;
        const bh = maxY - minY;
        const handleDirs: Array<{ dir: string; x: number; y: number; cursor: string }> = [
          { dir: 'nw', x: 0, y: 0, cursor: 'nwse-resize' },
          { dir: 'n', x: 0.5, y: 0, cursor: 'ns-resize' },
          { dir: 'ne', x: 1, y: 0, cursor: 'nesw-resize' },
          { dir: 'e', x: 1, y: 0.5, cursor: 'ew-resize' },
          { dir: 'se', x: 1, y: 1, cursor: 'nwse-resize' },
          { dir: 's', x: 0.5, y: 1, cursor: 'ns-resize' },
          { dir: 'sw', x: 0, y: 1, cursor: 'nesw-resize' },
          { dir: 'w', x: 0, y: 0.5, cursor: 'ew-resize' },
        ];
        return (
          <div
            className="absolute pointer-events-none"
            style={{
              left: bx,
              top: by,
              width: bw,
              height: bh,
              border: '2px dashed #f59e0b',
              backgroundColor: 'rgba(245, 158, 11, 0.08)',
              zIndex: 40,
            }}
          >
            <div
              className="absolute bg-amber-500 border border-white rounded-full"
              style={{
                left: 0,
                top: -6,
                transform: 'translateX(-50%)',
                padding: '2px 6px',
                fontSize: 9,
                lineHeight: 1,
                fontWeight: 700,
                color: '#fff',
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
              }}
            >
              {selectedStyle5Ids.length} elemen
            </div>
            {handleDirs.map((h) => (
              <div
                key={h.dir}
                onMouseDown={(e) => startGroupResize(h.dir, { x: bx, y: by, w: bw, h: bh }, e)}
                onClick={(e) => e.stopPropagation()}
                title="Tarik untuk ubah ukuran grup"
                className="absolute bg-white border-2 border-amber-500 rounded-sm shadow-sm"
                style={{
                  left: `${h.x * 100}%`,
                  top: `${h.y * 100}%`,
                  transform: 'translate(-50%, -50%)',
                  width: 9,
                  height: 9,
                  cursor: h.cursor,
                  pointerEvents: 'auto',
                  zIndex: 41,
                }}
              />
            ))}
          </div>
        );
      })()}

      {/* ========================================================
          4. FREE FLOATING ELEMENTS (TEXT & IMAGES)
          ======================================================== */}
      {data.freeElements.map((el) => {
        const isSelected = selectedElementId === `free-${el.id}`;
        const inMulti = selectedStyle5Ids.includes(`free-${el.id}`);
        return (
          <div
            key={el.id}
            id={`style5-free-${el.id}`}
            className={`absolute select-none transition-shadow ${
              isSelected ? 'ring-2 ring-indigo-500 ring-offset-2 z-30' : ''
            } ${inMulti && !isSelected ? 'ring-2 ring-amber-400 ring-offset-1 z-20' : ''}`}
            style={{
              left: `${el.x}px`,
              top: `${el.y}px`,
              width: `${el.width}px`,
              height: el.height ? `${el.height}px` : 'auto',
              backgroundColor: el.bgColor || 'transparent',
              borderColor: shapeBorderColor(el.borderColor || 'transparent'),
              borderWidth: el.borderColor ? '2px' : '0px',
              borderStyle: 'solid',
              borderRadius: `${el.borderRadius || 12}px`,
              color: el.color || '#2E2E2E',
              fontSize: `${el.fontSize || 16}px`,
              zIndex: isSelected ? 30 : el.zIndex || 25,
              cursor: isSelected || inMulti ? 'move' : 'pointer',
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (movedRef.current) return;
              const id = `free-${el.id}`;
              if (e.shiftKey) {
                const has = selectedStyle5Ids.includes(id);
                onSelectStyle5Ids?.(has ? selectedStyle5Ids.filter((x) => x !== id) : [...selectedStyle5Ids, id]);
                onSelectElement(id);
              } else {
                onSelectElement(id);
                onSelectStyle5Ids?.([id]);
              }
            }}
            onMouseDown={(e) =>
              startMove('free', `free-${el.id}`, el.id, el.x, el.y, e, 80, 40)
            }
          >
            {/* Floating toolbar for free element */}
            {el.borderColor && (
              <ShapeBorder
                shape="rect"
                radius={el.borderRadius || 12}
                color={el.borderColor}
                strokeWidth={2}
                profile={shapeProfile}
              />
            )}
            {isSelected && (
              <div
                className="absolute right-0 -top-10 flex items-center gap-1 bg-white border border-slate-200 px-2 py-1 rounded-xl shadow-lg z-40 text-xs"
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => handleExportSelected(`style5-free-${el.id}`, `elemen-${el.type}`)}
                  className="p-1 hover:bg-slate-100 rounded text-slate-700"
                  title="Ekspor sebagai PNG Transparan"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                {el.type === 'text' && (
                  <button
                    type="button"
                    onClick={() => startInlineEdit(`free-${el.id}`, el.content)}
                    className="p-1 hover:bg-slate-100 rounded text-slate-700"
                    title="Edit Teks Langsung"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDuplicateFreeElement(el)}
                  className="p-1 hover:bg-slate-100 rounded text-slate-700"
                  title="Duplikat Elemen"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteFreeElement(el.id)}
                  className="p-1 hover:bg-rose-50 text-rose-600 rounded"
                  title="Hapus Elemen"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {el.type === 'image' ? (
              <img
                src={el.content}
                alt="Free element"
                className="w-full h-full object-contain rounded-xl pointer-events-none"
              />
            ) : (
              <div
                className="p-3 leading-relaxed break-words"
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  startInlineEdit(`free-${el.id}`, el.content);
                }}
              >
                {editingId === `free-${el.id}` ? (
                  <textarea
                    rows={2}
                    value={editText}
                    autoFocus
                    onChange={(e) => setEditText(e.target.value)}
                    onBlur={() => finishInlineEdit(true)}
                    className="w-full bg-white text-slate-900 p-1 border rounded"
                  />
                ) : (
                  <span>{el.content}</span>
                )}
              </div>
            )}

            {/* Gagang resize elemen bebas (8 arah) */}
            {isSelected &&
              renderResizeHandles(
                'free',
                el.id,
                { x: el.x, y: el.y, w: el.width, h: el.height || 60 },
                80,
                40
              )}
          </div>
        );
      })}

      {/* ========================================================
          PENGARIS (RULER) SAAT MENGGESER / MENGUBAH UKURAN
      ======================================================== */}
      {dragState && dragRect && (
        <div
          className="absolute inset-0 pointer-events-none select-none"
          style={{ zIndex: 45 }}
        >
          {/* Garis bantu horizontal & vertikal melalui pusat objek */}
          <div
            className="absolute border-t border-dashed"
            style={{
              left: 0,
              right: 0,
              top: `${dragRect.y + dragRect.h / 2}px`,
              borderColor: 'rgba(6, 182, 212, 0.9)',
            }}
          />
          <div
            className="absolute border-l border-dashed"
            style={{
              top: 0,
              bottom: 0,
              left: `${dragRect.x + dragRect.w / 2}px`,
              borderColor: 'rgba(6, 182, 212, 0.9)',
            }}
          />

          {/* Penggaris tepi kanvas: atas, bawah, kiri, kanan */}
          {(() => {
            const STEP = 100;
            const MINOR = 50;
            const THICK = 20;
            const TICK = 'rgba(226, 232, 240, 0.5)';
            const MARK = 'rgba(6, 182, 212, 1)';
            const BG = 'rgba(15, 23, 42, 0.72)';
            const hTicks: number[] = [];
            for (let x = 0; x <= canvasWidth; x += MINOR) hTicks.push(x);
            const vTicks: number[] = [];
            for (let y = 0; y <= canvasHeight; y += MINOR) vTicks.push(y);
            return (
              <>
                {/* Atas */}
                <div
                  className="absolute overflow-hidden"
                  style={{ left: 0, top: 0, width: `${canvasWidth}px`, height: THICK, backgroundColor: BG }}
                >
                  {hTicks.map((x) => (
                    <div
                      key={`t${x}`}
                      className="absolute"
                      style={{ left: `${x}px`, top: 0, width: 1, height: x % STEP === 0 ? 12 : 6, backgroundColor: TICK }}
                    />
                  ))}
                  {hTicks.filter((x) => x % STEP === 0).map((x) => (
                    <span
                      key={`tl${x}`}
                      className="absolute text-[9px] font-mono"
                      style={{ left: `${x + 3}px`, top: 2, color: '#e2e8f0' }}
                    >
                      {x}
                    </span>
                  ))}
                  <div className="absolute" style={{ left: `${dragRect.x}px`, top: 0, width: 2, height: THICK, backgroundColor: MARK }} />
                  <div className="absolute" style={{ left: `${dragRect.x + dragRect.w}px`, top: 0, width: 2, height: THICK, backgroundColor: MARK }} />
                </div>

                {/* Bawah */}
                <div
                  className="absolute overflow-hidden"
                  style={{ left: 0, top: `${canvasHeight - THICK}px`, width: `${canvasWidth}px`, height: THICK, backgroundColor: BG }}
                >
                  {hTicks.map((x) => (
                    <div
                      key={`b${x}`}
                      className="absolute"
                      style={{ left: `${x}px`, bottom: 0, width: 1, height: x % STEP === 0 ? 12 : 6, backgroundColor: TICK }}
                    />
                  ))}
                  {hTicks.filter((x) => x % STEP === 0).map((x) => (
                    <span
                      key={`bl${x}`}
                      className="absolute text-[9px] font-mono"
                      style={{ left: `${x + 3}px`, bottom: 2, color: '#e2e8f0' }}
                    >
                      {x}
                    </span>
                  ))}
                  <div className="absolute" style={{ left: `${dragRect.x}px`, bottom: 0, width: 2, height: THICK, backgroundColor: MARK }} />
                  <div className="absolute" style={{ left: `${dragRect.x + dragRect.w}px`, bottom: 0, width: 2, height: THICK, backgroundColor: MARK }} />
                </div>

                {/* Kiri */}
                <div
                  className="absolute overflow-hidden"
                  style={{ left: 0, top: 0, width: THICK, height: `${canvasHeight}px`, backgroundColor: BG }}
                >
                  {vTicks.map((y) => (
                    <div
                      key={`l${y}`}
                      className="absolute"
                      style={{ top: `${y}px`, right: 0, height: 1, width: y % STEP === 0 ? 12 : 6, backgroundColor: TICK }}
                    />
                  ))}
                  {vTicks.filter((y) => y % STEP === 0).map((y) => (
                    <span
                      key={`ll${y}`}
                      className="absolute text-[9px] font-mono"
                      style={{ top: `${y + 2}px`, left: 2, color: '#e2e8f0' }}
                    >
                      {y}
                    </span>
                  ))}
                  <div className="absolute" style={{ top: `${dragRect.y}px`, left: 0, height: 2, width: THICK, backgroundColor: MARK }} />
                  <div className="absolute" style={{ top: `${dragRect.y + dragRect.h}px`, left: 0, height: 2, width: THICK, backgroundColor: MARK }} />
                </div>

                {/* Kanan */}
                <div
                  className="absolute overflow-hidden"
                  style={{ left: `${canvasWidth - THICK}px`, top: 0, width: THICK, height: `${canvasHeight}px`, backgroundColor: BG }}
                >
                  {vTicks.map((y) => (
                    <div
                      key={`r${y}`}
                      className="absolute"
                      style={{ top: `${y}px`, left: 0, height: 1, width: y % STEP === 0 ? 12 : 6, backgroundColor: TICK }}
                    />
                  ))}
                  {vTicks.filter((y) => y % STEP === 0).map((y) => (
                    <span
                      key={`rl${y}`}
                      className="absolute text-[9px] font-mono"
                      style={{ top: `${y + 2}px`, right: 2, color: '#e2e8f0' }}
                    >
                      {y}
                    </span>
                  ))}
                  <div className="absolute" style={{ top: `${dragRect.y}px`, right: 0, height: 2, width: THICK, backgroundColor: MARK }} />
                  <div className="absolute" style={{ top: `${dragRect.y + dragRect.h}px`, right: 0, height: 2, width: THICK, backgroundColor: MARK }} />
                </div>
              </>
            );
          })()}

          {/* Label jarak ke tepi kanvas (kiri/kanan/atas/bawah) */}
          {(() => {
            const cy = dragRect.y + dragRect.h / 2;
            const cx = dragRect.x + dragRect.w / 2;
            const rightEdge = dragRect.x + dragRect.w;
            const bottomEdge = dragRect.y + dragRect.h;
            const gaps = [
              { side: 'l', size: dragRect.x, style: { left: 0, width: `${dragRect.x}px`, top: `${cy - 8}px`, height: 16 } as React.CSSProperties },
              { side: 'r', size: canvasWidth - rightEdge, style: { left: `${rightEdge}px`, width: `${canvasWidth - rightEdge}px`, top: `${cy - 8}px`, height: 16 } as React.CSSProperties },
              { side: 't', size: dragRect.y, style: { top: 0, height: `${dragRect.y}px`, left: `${cx - 26}px`, width: 52 } as React.CSSProperties },
              { side: 'b', size: canvasHeight - bottomEdge, style: { top: `${bottomEdge}px`, height: `${canvasHeight - bottomEdge}px`, left: `${cx - 26}px`, width: 52 } as React.CSSProperties },
            ];
            return (
              <>
                {gaps.map((g) =>
                  g.size >= 44 ? (
                    <div
                      key={g.side}
                      className="absolute flex items-center justify-center"
                      style={g.style}
                    >
                      <span
                        className="px-1 py-0.5 text-[10px] font-bold rounded text-white whitespace-nowrap shadow-xs"
                        style={{ backgroundColor: '#0e7490' }}
                      >
                        {Math.round(g.size)}px
                      </span>
                    </div>
                  ) : null
                )}
              </>
            );
          })()}

          {/* Badge posisi & ukuran dekat kursor */}
          <div
            className="absolute flex items-center gap-2 px-2 py-1 text-[10px] font-mono rounded shadow-md whitespace-nowrap"
            style={{
              left: `${clampNum(dragRect.mx + 14, 0, Math.max(0, canvasWidth - 170))}px`,
              top: `${clampNum(dragRect.my + 14, 0, Math.max(0, canvasHeight - 30))}px`,
              backgroundColor: 'rgba(15, 23, 42, 0.92)',
              color: '#ffffff',
            }}
          >
            <span>X {dragRect.x}</span>
            <span>Y {dragRect.y}</span>
            <span style={{ color: '#67e8f9' }}>
              {dragRect.w}×{dragRect.h}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
