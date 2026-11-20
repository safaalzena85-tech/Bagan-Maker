import React, { useLayoutEffect, useRef, useState } from 'react';
import {
  CanvasDimension,
  CaseTransformSettings,
  ColorSettings,
  DiagramStyleType,
  LayoutSettings,
  Style3ColorSettings,
  Style3LayoutSettings,
  Style3QuestionData,
  Style5ColorSettings,
  Style5Data,
  Style5LayoutSettings,
  SubBoxItem,
} from '../types';
import {
  GripVertical,
  MoveVertical,
  MoveHorizontal,
  X,
  Plus,
  Trash2,
  ImageIcon,
  Check,
} from 'lucide-react';
import {
  applyTextCaseTransform,
  getStyle2ItemNumberLabel,
  getStyle3ChoicePrefix,
} from '../utils/textCase';
import { Style5Canvas } from './Style5Canvas';
import { ProfileBorder } from './ProfileBorder';
import { getStrokeProfile, outlineFromSvgPath } from '../utils/strokeProfile';

/**
 * Render satu elemen connector. Bila profil stroke "uniform" (default),
 * elemen asli dipakai apa adanya agar tampilan Gaya 1–4 tidak berubah.
 * Bila profil aktif, path dikonversi menjadi polygon outline ber-lebar
 * variabel w(t) lalu diisi dengan warna stroke.
 */
function strokeConnector(
  key: string,
  outlineD: string,
  uniformEl: React.ReactNode,
  color: string,
  thickness: number,
  profileId?: string
): React.ReactNode {
  if (!profileId || profileId === 'uniform') return uniformEl;
  const outline = outlineFromSvgPath(outlineD, thickness, getStrokeProfile(profileId));
  return outline ? <path key={key} d={outline} fill={color} stroke="none" /> : uniformEl;
}

/** Overlay bingkai profil stroke untuk bentuk tertutup (kotak/pill/lingkaran).
 * Mengembalikan null bila profil uniform, sehingga render asli tidak berubah. */
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

interface DiagramCanvasProps {
  diagramStyle: DiagramStyleType;
  mainTitle: string;
  subBoxes: SubBoxItem[];
  colors: ColorSettings;
  layout: LayoutSettings;
  caseSettings: CaseTransformSettings;
  onLayoutChange?: (layout: LayoutSettings) => void;
  onSubBoxesChange?: (subBoxes: SubBoxItem[]) => void;
  diagramRef: React.RefObject<HTMLDivElement | null>;
  previewBg: 'transparent' | 'white' | 'dark';
  // Style 3 props
  style3Data: Style3QuestionData;
  style3Colors: Style3ColorSettings;
  style3Layout: Style3LayoutSettings;
  questionBoxRef?: React.RefObject<HTMLDivElement | null>;
  explanationBoxRef?: React.RefObject<HTMLDivElement | null>;
  // Style 5 props
  style5Data?: Style5Data;
  onStyle5DataChange?: (data: Style5Data) => void;
  style5Colors?: Style5ColorSettings;
  style5Layout?: Style5LayoutSettings;
  canvasDimension?: CanvasDimension;
  selectedStyle5ElementId?: string | null;
  onSelectStyle5Element?: (id: string | null) => void;
  selectedStyle5Ids?: string[];
  onSelectStyle5Ids?: (ids: string[]) => void;
  /** Profil stroke global untuk semua bingkai/shape (semua gaya). */
  shapeProfile?: string;
  /** Daftar artboard Gaya 5 (untuk duplikat elemen ke artboard lain). */
  artboardOptions?: { id: string; name: string }[];
  onDuplicateSelectionToArtboard?: (targetId: string) => void;
  onToast?: (msg: string) => void;
  /** Zoom visual dari viewport App (untuk drag elemen bebas Gaya 5) */
  viewScale?: number;
  /** Tampilkan panduan kanvas (crosshair + area aman video) di semua gaya */
  showGuides?: boolean;
}

interface TargetCoord {
  id: string;
  x: number;
  y: number;
  index: number;
}

interface Style2LineCoord {
  xStart: number;
  yStart: number;
  xEnd: number;
  yEnd: number;
  id: string;
}

interface ConnectorGeometry {
  xStart: number;
  yStart: number;
  trunkX: number;
  targets: TargetCoord[];
  style2Lines: Style2LineCoord[];
  svgWidth: number;
  svgHeight: number;
}

function renderQuestionWithBlanks(
  text: string,
  underlineColor: string,
  minWidth: number = 70
) {
  const parts = text.split(/(_{3,})/g);
  return (
    <span>
      {parts.map((part, index) => {
        if (/^_{3,}$/.test(part)) {
          const width = Math.max(minWidth, part.length * 12);
          return (
            <span
              key={index}
              className="inline-block border-b-2 mx-1.5 align-baseline text-transparent select-none"
              style={{
                borderColor: underlineColor,
                minWidth: `${width}px`,
                height: '0.9em',
              }}
            >
              ___
            </span>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
}

/** Panduan kanvas: crosshair tengah + area aman video (dapat disembunyikan) */
function CanvasGuidesOverlay({
  width,
  height,
  show,
}: {
  width: number;
  height: number;
  show: boolean;
}) {
  if (!show || width <= 0 || height <= 0) return null;
  const vSafe = height * 0.05;
  const hSafe = width * 0.05;
  return (
    <div
      aria-hidden="true"
      data-export-ignore="true"
      className="absolute inset-0 pointer-events-none select-none z-50"
      style={{ width, height }}
    >
      {/* Garis crosshair tengah */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: height / 2,
          borderTop: '1px dashed rgba(244,63,94,0.75)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: width / 2,
          borderLeft: '1px dashed rgba(244,63,94,0.75)',
        }}
      />
      {/* Titik tengah */}
      <div
        style={{
          position: 'absolute',
          left: width / 2 - 3,
          top: height / 2 - 3,
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: 'rgba(244,63,94,0.9)',
        }}
      />
      {/* Area aman video */}
      <div
        style={{
          position: 'absolute',
          left: hSafe,
          top: vSafe,
          width: width - hSafe * 2,
          height: height - vSafe * 2,
          border: '1.5px dashed rgba(37,99,235,0.8)',
          borderRadius: 10,
        }}
      />
      <span
        style={{
          position: 'absolute',
          left: hSafe + 8,
          top: vSafe + 6,
          fontSize: 11,
          color: '#2563eb',
          fontWeight: 700,
          letterSpacing: 1,
          textShadow: '0 0 4px rgba(255,255,255,0.9)',
        }}
      >
        AREA AMAN VIDEO
      </span>
    </div>
  );
}

export const DiagramCanvas: React.FC<DiagramCanvasProps> = ({
  diagramStyle,
  mainTitle,
  subBoxes,
  colors,
  layout,
  caseSettings,
  onLayoutChange,
  onSubBoxesChange,
  diagramRef,
  previewBg,
  style3Data,
  style3Colors,
  style3Layout,
  questionBoxRef,
  explanationBoxRef,
  style5Data,
  onStyle5DataChange,
  style5Colors,
  style5Layout,
  canvasDimension,
  selectedStyle5ElementId,
  onSelectStyle5Element,
  selectedStyle5Ids,
  onSelectStyle5Ids,
  shapeProfile,
  artboardOptions,
  onDuplicateSelectionToArtboard,
  onToast,
  viewScale,
  showGuides = true,
}) => {
  // Profil stroke shape aktif → border asli dibuat transparan, overlay
  // ShapeBorder menggambar bingkai ber-lebar variabel di atasnya.
  const profActive = !!shapeProfile && shapeProfile !== 'uniform';
  const shapeBorderColor = (c: string) => (profActive ? 'transparent' : c);

  const mainTargetRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const subBoxRefs = useRef<(HTMLDivElement | null)[]>([]);
  const circleRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [geometry, setGeometry] = useState<ConnectorGeometry | null>(null);

  // Dragging states
  const [isResizingSubWidth, setIsResizingSubWidth] = useState(false);
  const [isResizingMainBox, setIsResizingMainBox] = useState(false);
  const [isDraggingMainY, setIsDraggingMainY] = useState(false);
  const [isDraggingPills, setIsDraggingPills] = useState(false);
  const [draggedSubIndex, setDraggedSubIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Inline editing state on canvas for sub boxes
  const [inlineEditSubId, setInlineEditSubId] = useState<string | null>(null);
  const [inlineEditField, setInlineEditField] = useState<'text' | 'number' | null>(null);
  const [inlineEditText, setInlineEditText] = useState('');

  // Recalculate connector geometry on change or resize with scale-invariant mathematics
  useLayoutEffect(() => {
    if (diagramStyle === 'style3' || diagramStyle === 'style5') return;

    const updateGeometry = () => {
      if (!contentRef.current || !mainTargetRef.current) return;

      const containerRect = contentRef.current.getBoundingClientRect();
      const mainRect = mainTargetRef.current.getBoundingClientRect();

      const scale =
        (contentRef.current.offsetWidth > 0
          ? containerRect.width / contentRef.current.offsetWidth
          : 1) || 1;

      const xStart = (mainRect.right - containerRect.left) / scale;
      const yCenter =
        (mainRect.top + mainRect.height / 2 - containerRect.top) / scale;

      // STYLE 1: Orthogonal tree connectors
      const targets: TargetCoord[] = [];
      for (let i = 0; i < subBoxes.length; i++) {
        const el = subBoxRefs.current[i];
        if (el) {
          const rect = el.getBoundingClientRect();
          targets.push({
            id: subBoxes[i].id,
            x: (rect.left - containerRect.left) / scale,
            y: (rect.top + rect.height / 2 - containerRect.top) / scale,
            index: i,
          });
        }
      }

      const minTargetX =
        targets.length > 0
          ? Math.min(...targets.map((t) => t.x))
          : xStart + 80;
      const trunkX = xStart + (minTargetX - xStart) / 2;

      // STYLE 2: Straight oblique lines with symmetrical stacked dots on main box right edge
      const style2Lines: Style2LineCoord[] = [];
      const dotSpacing = layout.style2DotSpacing || 14;
      const totalDotSpan = (subBoxes.length - 1) * dotSpacing;
      const dotStartY = yCenter - totalDotSpan / 2;

      for (let i = 0; i < subBoxes.length; i++) {
        const yDot = dotStartY + i * dotSpacing;
        const subEl = subBoxRefs.current[i];
        const circleEl = circleRefs.current[i];

        if (subEl) {
          let xEnd = 0;
          let yEnd = 0;

          if (circleEl && (layout.style2NumberingType !== 'none' || Boolean(subBoxes[i]?.customNumber))) {
            const cRect = circleEl.getBoundingClientRect();
            const cx = (cRect.left + cRect.width / 2 - containerRect.left) / scale;
            const cy = (cRect.top + cRect.height / 2 - containerRect.top) / scale;
            const radius = (cRect.width / 2) / scale;

            // Connect to perimeter of circle
            const vx = cx - xStart;
            const vy = cy - yDot;
            const dist = Math.hypot(vx, vy) || 1;

            xEnd = cx - radius * (vx / dist);
            yEnd = cy - radius * (vy / dist);
          } else {
            // No circle: connect directly to left edge of pill
            const sRect = subEl.getBoundingClientRect();
            xEnd = (sRect.left - containerRect.left) / scale;
            yEnd = (sRect.top + sRect.height / 2 - containerRect.top) / scale;
          }

          style2Lines.push({
            xStart,
            yStart: yDot,
            xEnd,
            yEnd,
            id: subBoxes[i].id,
          });
        }
      }

      setGeometry({
        xStart,
        yStart: yCenter,
        trunkX,
        targets,
        style2Lines,
        svgWidth: contentRef.current.offsetWidth || containerRect.width,
        svgHeight: contentRef.current.offsetHeight || containerRect.height,
      });
    };

    updateGeometry();

    const ro = new ResizeObserver(() => {
      updateGeometry();
    });

    if (contentRef.current) ro.observe(contentRef.current);
    if (mainTargetRef.current) ro.observe(mainTargetRef.current);
    subBoxRefs.current.forEach((el) => {
      if (el) ro.observe(el);
    });
    circleRefs.current.forEach((el) => {
      if (el) ro.observe(el);
    });

    window.addEventListener('resize', updateGeometry);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateGeometry);
    };
  }, [mainTitle, subBoxes, colors, layout, diagramStyle, contentRef]);

  // Handle Drag to Resize Sub Box Width
  const handleWidthResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizingSubWidth(true);

    const startX = e.clientX;
    const startWidth = layout.subBoxMaxWidth;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const newWidth = Math.max(280, Math.min(650, Math.round(startWidth + deltaX)));
      if (onLayoutChange) {
        onLayoutChange({ ...layout, subBoxMaxWidth: newWidth });
      }
    };

    const onMouseUp = () => {
      setIsResizingSubWidth(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Handle Drag to Resize Main Box
  const handleMainBoxResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizingMainBox(true);

    const startX = e.clientX;
    const startY = e.clientY;
    const startW = layout.mainBoxWidth || 210;
    const startH = layout.mainBoxMinHeight || 120;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      const newW = Math.max(150, Math.min(360, Math.round(startW + deltaX)));
      const newH = Math.max(80, Math.min(260, Math.round(startH + deltaY)));
      if (onLayoutChange) {
        onLayoutChange({
          ...layout,
          mainBoxWidth: newW,
          mainBoxMinHeight: newH,
        });
      }
    };

    const onMouseUp = () => {
      setIsResizingMainBox(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Handle Vertical Drag for Main Box Position
  const handleMainYDragMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingMainY(true);

    const startY = e.clientY;
    const startOffsetY = layout.mainBoxOffsetY || 0;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const newOffsetY = Math.max(-180, Math.min(180, Math.round(startOffsetY + deltaY)));
      if (onLayoutChange) {
        onLayoutChange({ ...layout, mainBoxOffsetY: newOffsetY });
      }
    };

    const onMouseUp = () => {
      setIsDraggingMainY(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Handle Drag to Shift ALL Pill Labels Horizontally (Gaya 1)
  const handlePillDragMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;

    e.preventDefault();
    e.stopPropagation();
    setIsDraggingPills(true);

    const startX = e.clientX;
    const startOffset = layout.pillOffsetX !== undefined ? layout.pillOffsetX : 24;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const maxOffset = Math.max(80, (layout.subBoxMaxWidth || 440) - 130);
      const newOffset = Math.max(8, Math.min(maxOffset, Math.round(startOffset + deltaX)));
      if (onLayoutChange) {
        onLayoutChange({
          ...layout,
          pillOffsetX: newOffset,
        });
      }
    };

    const onMouseUp = () => {
      setIsDraggingPills(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // HTML5 Drag and Drop for Sub Box Reordering
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedSubIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedSubIndex === null || draggedSubIndex === index) return;
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedSubIndex === null || draggedSubIndex === targetIndex || !onSubBoxesChange) {
      setDraggedSubIndex(null);
      setDragOverIndex(null);
      return;
    }

    const items = [...subBoxes];
    const [moved] = items.splice(draggedSubIndex, 1);
    items.splice(targetIndex, 0, moved);
    onSubBoxesChange(items);

    setDraggedSubIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedSubIndex(null);
    setDragOverIndex(null);
  };

  // Render Gaya 1: Tree connectors with curves & trunk
  const renderStyle1Connectors = () => {
    if (!geometry || geometry.targets.length === 0) return null;

    const { xStart, yStart, trunkX, targets, svgWidth, svgHeight } = geometry;
    const paths: React.ReactNode[] = [];
    const dots: { x: number; y: number; key: string }[] = [];

    const connectorThickness = layout.connectorThickness || 2;
    const dotRadius = (layout.connectorDotSize || 8) / 2;

    dots.push({ x: xStart, y: yStart, key: 'dot-start' });

    paths.push(
      strokeConnector(
        'main-stem',
        `M ${xStart} ${yStart} L ${trunkX} ${yStart}`,
        <line
          key="main-stem"
          x1={xStart}
          y1={yStart}
          x2={trunkX}
          y2={yStart}
          stroke={colors.connectorColor}
          strokeWidth={connectorThickness}
          strokeLinecap="round"
        />,
        colors.connectorColor,
        connectorThickness,
        layout.connectorProfile
      )
    );

    dots.push({ x: trunkX, y: yStart, key: 'dot-trunk-main' });

    const sortedTargets = [...targets].sort((a, b) => a.y - b.y);
    const topTarget = sortedTargets[0];
    const bottomTarget = sortedTargets[sortedTargets.length - 1];

    targets.forEach((target) => {
      const isTopMost = target.id === topTarget.id && target.y < yStart - 5;
      const isBottomMost = target.id === bottomTarget.id && target.y > yStart + 5;
      const isCenter = Math.abs(target.y - yStart) <= 5;

      const r = Math.min(18, Math.max(8, Math.abs(target.y - yStart) / 2));

      if (isCenter) {
        paths.push(
          strokeConnector(
            `line-${target.id}`,
            `M ${trunkX} ${target.y} L ${target.x} ${target.y}`,
            <line
              key={`line-${target.id}`}
              x1={trunkX}
              y1={target.y}
              x2={target.x}
              y2={target.y}
              stroke={colors.connectorColor}
              strokeWidth={connectorThickness}
              strokeLinecap="round"
            />,
            colors.connectorColor,
            connectorThickness,
            layout.connectorProfile
          )
        );
      } else if (isTopMost) {
        const d = `M ${trunkX} ${yStart} L ${trunkX} ${target.y + r} Q ${trunkX} ${target.y} ${trunkX + r} ${target.y} L ${target.x} ${target.y}`;
        paths.push(
          strokeConnector(
            `curve-${target.id}`,
            d,
            <path
              key={`curve-${target.id}`}
              d={d}
              fill="none"
              stroke={colors.connectorColor}
              strokeWidth={connectorThickness}
              strokeLinecap="round"
              strokeLinejoin="round"
            />,
            colors.connectorColor,
            connectorThickness,
            layout.connectorProfile
          )
        );
      } else if (isBottomMost) {
        const d = `M ${trunkX} ${yStart} L ${trunkX} ${target.y - r} Q ${trunkX} ${target.y} ${trunkX + r} ${target.y} L ${target.x} ${target.y}`;
        paths.push(
          strokeConnector(
            `curve-${target.id}`,
            d,
            <path
              key={`curve-${target.id}`}
              d={d}
              fill="none"
              stroke={colors.connectorColor}
              strokeWidth={connectorThickness}
              strokeLinecap="round"
              strokeLinejoin="round"
            />,
            colors.connectorColor,
            connectorThickness,
            layout.connectorProfile
          )
        );
      } else {
        const dVertical = `M ${trunkX} ${yStart} L ${trunkX} ${target.y}`;
        paths.push(
          strokeConnector(
            `vert-${target.id}`,
            dVertical,
            <path
              key={`vert-${target.id}`}
              d={dVertical}
              fill="none"
              stroke={colors.connectorColor}
              strokeWidth={connectorThickness}
              strokeLinecap="round"
            />,
            colors.connectorColor,
            connectorThickness,
            layout.connectorProfile
          )
        );
        paths.push(
          strokeConnector(
            `branch-${target.id}`,
            `M ${trunkX} ${target.y} L ${target.x} ${target.y}`,
            <line
              key={`branch-${target.id}`}
              x1={trunkX}
              y1={target.y}
              x2={target.x}
              y2={target.y}
              stroke={colors.connectorColor}
              strokeWidth={connectorThickness}
              strokeLinecap="round"
            />,
            colors.connectorColor,
            connectorThickness,
            layout.connectorProfile
          )
        );
        dots.push({ x: trunkX, y: target.y, key: `dot-trunk-${target.id}` });
      }

      dots.push({ x: target.x, y: target.y, key: `dot-target-${target.id}` });
    });

    return (
      <svg
        className="absolute inset-0 pointer-events-none"
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        style={{ zIndex: 10 }}
      >
        {paths}
        {dots.map((dot) => (
          <circle
            key={dot.key}
            cx={dot.x}
            cy={dot.y}
            r={dotRadius}
            fill={colors.connectorColor}
          />
        ))}
      </svg>
    );
  };

  // Render Gaya 2: Straight oblique lines connecting from stacked dots to number circles
  const renderStyle2Connectors = () => {
    if (!geometry || geometry.style2Lines.length === 0) return null;

    const { svgWidth, svgHeight, style2Lines } = geometry;
    const connectorThickness = layout.connectorThickness || 2;
    const dotRadius = (layout.connectorDotSize || 8) / 2;

    return (
      <svg
        className="absolute inset-0 pointer-events-none"
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        style={{ zIndex: 10 }}
      >
        {style2Lines.map((line) => (
          <React.Fragment key={`s2-line-${line.id}`}>
            {/* Dot at right edge of main box */}
            <circle
              cx={line.xStart}
              cy={line.yStart}
              r={dotRadius}
              fill={colors.connectorColor}
            />
            {/* Straight oblique line from dot to number circle / pill */}
            {strokeConnector(
              `s2-line-${line.id}`,
              `M ${line.xStart} ${line.yStart} L ${line.xEnd} ${line.yEnd}`,
              <line
                x1={line.xStart}
                y1={line.yStart}
                x2={line.xEnd}
                y2={line.yEnd}
                stroke={colors.connectorColor}
                strokeWidth={connectorThickness}
                strokeLinecap="round"
              />,
              colors.connectorColor,
              connectorThickness,
              layout.connectorProfile
            )}
          </React.Fragment>
        ))}
      </svg>
    );
  };

  const scaleFactor = layout.diagramScale || 1;
  const pillOffset = layout.pillOffsetX !== undefined ? layout.pillOffsetX : 24;

  // Text transformations (non-destructive) for Style 1 & Style 2
  const displayMainTitle = applyTextCaseTransform(
    mainTitle || 'Judul Utama',
    caseSettings.mainTitleCase
  );

  const circleSize = layout.style2CircleSize || 42;
  const numberingType = layout.style2NumberingType || 'numbers';
  const hasNumbers = numberingType !== 'none';

  // ==========================================
  // RENDER GAYA 4: RADIAL (LINGKARAN TENGAH)
  // ==========================================
  if (diagramStyle === 'style4') {
    const displayRadialTitle = applyTextCaseTransform(
      mainTitle || 'Jenis instrumen pasar modal',
      caseSettings.mainTitleCase
    );

    // Partition left & right
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
    const pillPaddingY = layout.style4PillPaddingY || 9;
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

    const totalContentHeight = Math.max(
      mainDiameter + 60,
      2 * rOuter * maxS + circleBoxSize + 70
    );
    const padding = layout.diagramPadding || 36;
    const canvasHeight = totalContentHeight + padding * 2;
    const cy = canvasHeight / 2;

    const sideDistance = rOuter + maxPillWidth + 30;
    const canvasWidth = sideDistance * 2 + padding * 2;
    const cx = canvasWidth / 2;

    // Left Arc Bracket and Connectors (All lines have EXACTLY equal length = connectorLength)
    const leftConnectorElements: React.ReactNode[] = [];
    const leftPositions: { circleCenterX: number; circleCenterY: number }[] = [];

    if (leftSubs.length > 0) {
      const nLeft = leftSubs.length;
      const { sMax, sBracket } = leftGeo;
      const cBracket = Math.sqrt(Math.max(0, 1 - sBracket * sBracket));
      const xTop = cx - rArc * cBracket;
      const yTop = cy - rArc * sBracket;
      const xBottom = cx - rArc * cBracket;
      const yBottom = cy + rArc * sBracket;

      leftConnectorElements.push(
        strokeConnector(
          'left-arc-bracket',
          `M ${xTop} ${yTop} A ${rArc} ${rArc} 0 0 0 ${xBottom} ${yBottom}`,
          <path
            key="left-arc-bracket"
            d={`M ${xTop} ${yTop} A ${rArc} ${rArc} 0 0 0 ${xBottom} ${yBottom}`}
            stroke={colors.connectorColor}
            strokeWidth={connectorThickness}
            fill="none"
            strokeLinecap="round"
          />,
          colors.connectorColor,
          connectorThickness,
          layout.connectorProfile
        )
      );

      leftSubs.forEach(({ item, globalIdx }, i) => {
        const s_i = nLeft === 1 ? 0 : -sMax + (i / (nLeft - 1)) * (2 * sMax);
        const cosPhi = Math.sqrt(Math.max(0, 1 - s_i * s_i));
        const dotX = cx - rArc * cosPhi;
        const dotY = cy + rArc * s_i;

        // Line has EXACT length = connectorLength
        const targetX = dotX - connectorLength * cosPhi;
        const targetY = dotY + connectorLength * s_i;

        const circleCenterX = dotX - (connectorLength + circleRadius) * cosPhi;
        const circleCenterY = dotY + (connectorLength + circleRadius) * s_i;
        leftPositions.push({ circleCenterX, circleCenterY });

        leftConnectorElements.push(
          <g key={`left-connector-${item.id}`}>
            {strokeConnector(
              `left-line-${item.id}`,
              `M ${dotX} ${dotY} L ${targetX} ${targetY}`,
              <line
                x1={dotX}
                y1={dotY}
                x2={targetX}
                y2={targetY}
                stroke={colors.connectorColor}
                strokeWidth={connectorThickness}
                strokeLinecap="round"
              />,
              colors.connectorColor,
              connectorThickness,
              layout.connectorProfile
            )}
            <circle
              cx={dotX}
              cy={dotY}
              r={dotRadius}
              fill={colors.connectorColor}
            />
          </g>
        );
      });
    }

    // Right Arc Bracket and Connectors (All lines have EXACTLY equal length = connectorLength)
    const rightConnectorElements: React.ReactNode[] = [];
    const rightPositions: { circleCenterX: number; circleCenterY: number }[] = [];

    if (rightSubs.length > 0) {
      const nRight = rightSubs.length;
      const { sMax, sBracket } = rightGeo;
      const cBracket = Math.sqrt(Math.max(0, 1 - sBracket * sBracket));
      const xTop = cx + rArc * cBracket;
      const yTop = cy - rArc * sBracket;
      const xBottom = cx + rArc * cBracket;
      const yBottom = cy + rArc * sBracket;

      rightConnectorElements.push(
        strokeConnector(
          'right-arc-bracket',
          `M ${xTop} ${yTop} A ${rArc} ${rArc} 0 0 1 ${xBottom} ${yBottom}`,
          <path
            key="right-arc-bracket"
            d={`M ${xTop} ${yTop} A ${rArc} ${rArc} 0 0 1 ${xBottom} ${yBottom}`}
            stroke={colors.connectorColor}
            strokeWidth={connectorThickness}
            fill="none"
            strokeLinecap="round"
          />,
          colors.connectorColor,
          connectorThickness,
          layout.connectorProfile
        )
      );

      rightSubs.forEach(({ item, globalIdx }, i) => {
        const s_i = nRight === 1 ? 0 : -sMax + (i / (nRight - 1)) * (2 * sMax);
        const cosPhi = Math.sqrt(Math.max(0, 1 - s_i * s_i));
        const dotX = cx + rArc * cosPhi;
        const dotY = cy + rArc * s_i;

        // Line has EXACT length = connectorLength
        const targetX = dotX + connectorLength * cosPhi;
        const targetY = dotY + connectorLength * s_i;

        const circleCenterX = dotX + (connectorLength + circleRadius) * cosPhi;
        const circleCenterY = dotY + (connectorLength + circleRadius) * s_i;
        rightPositions.push({ circleCenterX, circleCenterY });

        rightConnectorElements.push(
          <g key={`right-connector-${item.id}`}>
            {strokeConnector(
              `right-line-${item.id}`,
              `M ${dotX} ${dotY} L ${targetX} ${targetY}`,
              <line
                x1={dotX}
                y1={dotY}
                x2={targetX}
                y2={targetY}
                stroke={colors.connectorColor}
                strokeWidth={connectorThickness}
                strokeLinecap="round"
              />,
              colors.connectorColor,
              connectorThickness,
              layout.connectorProfile
            )}
            <circle
              cx={dotX}
              cy={dotY}
              r={dotRadius}
              fill={colors.connectorColor}
            />
          </g>
        );
      });
    }

    return (
      <div className="min-h-full flex items-center justify-center p-6">
        <div
          ref={diagramRef}
          id="diagram-canvas-root"
          className={`relative flex items-center justify-center overflow-hidden transition-colors duration-200 ${
            previewBg === 'transparent'
              ? 'transparency-grid'
              : previewBg === 'dark'
              ? 'bg-slate-900'
              : 'bg-white'
          }`}
          style={{
            width: canvasDimension ? `${canvasDimension.width}px` : undefined,
            height: canvasDimension ? `${canvasDimension.height}px` : undefined,
          }}
        >
          <div
            className="relative select-none transition-transform duration-75 origin-center shrink-0"
            style={{
              width: `${canvasWidth}px`,
              height: `${canvasHeight}px`,
              fontFamily: "'Rubik', sans-serif",
              transform: `scale(${scaleFactor})`,
            }}
          >
          {/* SVG Overlay: Connectors, Arc Brackets & Dots */}
          <svg
            className="absolute inset-0 pointer-events-none z-10"
            width={canvasWidth}
            height={canvasHeight}
            viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
          >
            {leftConnectorElements}
            {rightConnectorElements}
          </svg>

          {/* CENTER: Main Circle (Lingkaran Utama) */}
          <div
            className="absolute rounded-full shadow-lg flex items-center justify-center text-center p-6 select-none transition-all z-20 group"
            style={{
              left: `${cx - mainRadius}px`,
              top: `${cy - mainRadius}px`,
              width: `${mainDiameter}px`,
              height: `${mainDiameter}px`,
              backgroundColor: colors.mainBoxBg,
              color: colors.mainBoxText,
              borderColor: shapeBorderColor(colors.connectorColor || '#3a3a3a'),
              borderWidth: '2px',
              borderStyle: 'solid',
            }}
          >
            <h1
              className="font-bold tracking-tight leading-snug break-words"
              style={{
                fontSize: `${layout.fontSizeMain || 22}px`,
                maxWidth: `${mainDiameter - 36}px`,
              }}
            >
              {displayRadialTitle}
            </h1>
            <ShapeBorder
              shape="circle"
              color={colors.connectorColor || '#3a3a3a'}
              strokeWidth={2}
              profile={shapeProfile}
            />
          </div>

          {/* LEFT SUB BOXES: Pill memanjang ke kiri, circle box di kanan pill */}
          {leftSubs.map(({ item, globalIdx }, i) => {
            const pos = leftPositions[i];
            const circleCenterX = pos ? pos.circleCenterX : (cx - rArc - connectorLength - circleRadius);
            const circleCenterY = pos ? pos.circleCenterY : cy;
            const rawPillText = item.content || item.title || `Sub ${globalIdx + 1}`;
            const displayPillContent = applyTextCaseTransform(
              rawPillText,
              caseSettings.bodyCase !== 'none'
                ? caseSettings.bodyCase
                : caseSettings.pillTitleCase
            );
            const pillBgColor =
              layout.individualPillColor && item.customPillColor
                ? item.customPillColor
                : colors.pillBg;
            const numberLabel = getStyle2ItemNumberLabel(
              globalIdx,
              numberingType,
              layout.style4Separator || '.',
              layout.style4StartFrom || '1',
              item.customNumber
            );

            return (
              <div
                key={item.id}
                className="absolute flex items-center justify-end select-none group z-20"
                style={{
                  right: `${canvasWidth - (circleCenterX + circleRadius)}px`,
                  top: `${circleCenterY - circleRadius}px`,
                  height: `${circleBoxSize}px`,
                }}
              >
                {/* Badan Pill Panjang (Sisi Kiri memanjang ke kiri, rounded penuh) */}
                <div
                  className="relative rounded-full shadow-xs flex items-center justify-center transition-all select-none"
                  style={{
                    backgroundColor: pillBgColor,
                    color: colors.pillText,
                    paddingTop: `${pillPaddingY}px`,
                    paddingBottom: `${pillPaddingY}px`,
                    paddingLeft: '22px',
                    paddingRight: `${Math.round(circleBoxSize * 0.35) + 14}px`,
                    marginRight: `-${Math.round(circleBoxSize * 0.35)}px`,
                    minHeight: `${pillHeight}px`,
                    maxWidth: `${maxPillWidth}px`,
                    borderColor: shapeBorderColor(colors.pillBorder || '#5a3e78'),
                    borderWidth: `${layout.pillBorderWidth || 1.2}px`,
                    borderStyle: 'solid',
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    if (!onSubBoxesChange) return;
                    setInlineEditSubId(item.id);
                    setInlineEditField('text');
                    setInlineEditText(item.content || item.title || '');
                  }}
                >
                  <ShapeBorder
                    shape="pill"
                    color={colors.pillBorder || '#5a3e78'}
                    strokeWidth={layout.pillBorderWidth || 1.2}
                    profile={shapeProfile}
                  />
                  {inlineEditSubId === item.id && inlineEditField === 'text' ? (
                    <input
                      type="text"
                      value={inlineEditText}
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => setInlineEditText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (onSubBoxesChange) {
                            onSubBoxesChange(
                              subBoxes.map((s) =>
                                s.id === item.id
                                  ? { ...s, content: inlineEditText, title: inlineEditText }
                                  : s
                              )
                            );
                          }
                          setInlineEditSubId(null);
                        } else if (e.key === 'Escape') {
                          setInlineEditSubId(null);
                        }
                      }}
                      onBlur={() => {
                        if (onSubBoxesChange) {
                          onSubBoxesChange(
                            subBoxes.map((s) =>
                              s.id === item.id
                                ? { ...s, content: inlineEditText, title: inlineEditText }
                                : s
                            )
                          );
                        }
                        setInlineEditSubId(null);
                      }}
                      className="bg-white text-slate-900 px-2 py-0.5 rounded text-xs border border-purple-400 focus:outline-none shadow-xs font-normal"
                      style={{ fontSize: `${layout.fontSizeBody || 15}px`, minWidth: '100px' }}
                    />
                  ) : (
                    <span
                      className="font-normal text-right whitespace-pre-wrap leading-snug cursor-text"
                      title="Klik 2x untuk edit teks langsung"
                      style={{ fontSize: `${layout.fontSizeBody || 15}px` }}
                    >
                      {displayPillContent}
                    </span>
                  )}
                </div>

                {/* Circle Box Putih (Menempel di ujung KANAN pill, menghadap tengah) */}
                <div
                  className="relative z-20 rounded-full flex items-center justify-center font-bold shadow-xs shrink-0 select-none transition-transform group-hover:scale-105 cursor-pointer"
                  style={{
                    width: `${circleBoxSize}px`,
                    height: `${circleBoxSize}px`,
                    backgroundColor: colors.numberCircleBg || '#ffffff',
                    borderColor: shapeBorderColor(colors.numberCircleBorder || '#3a3a3a'),
                    borderWidth: '2.5px',
                    borderStyle: 'solid',
                    color: colors.numberCircleText || '#2e2e2e',
                    fontSize: `${Math.round(circleBoxSize * 0.38)}px`,
                  }}
                  title="Klik 2x untuk edit isi lingkaran putih"
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    if (!onSubBoxesChange) return;
                    setInlineEditSubId(item.id);
                    setInlineEditField('number');
                    setInlineEditText(item.customNumber || numberLabel || '');
                  }}
                >
                  <ShapeBorder
                    shape="circle"
                    color={colors.numberCircleBorder || '#3a3a3a'}
                    strokeWidth={2.5}
                    profile={shapeProfile}
                  />
                  {inlineEditSubId === item.id && inlineEditField === 'number' ? (
                    <input
                      type="text"
                      value={inlineEditText}
                      autoFocus
                      maxLength={6}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => setInlineEditText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (onSubBoxesChange) {
                            onSubBoxesChange(
                              subBoxes.map((s) =>
                                s.id === item.id ? { ...s, customNumber: inlineEditText } : s
                              )
                            );
                          }
                          setInlineEditSubId(null);
                        } else if (e.key === 'Escape') {
                          setInlineEditSubId(null);
                        }
                      }}
                      onBlur={() => {
                        if (onSubBoxesChange) {
                          onSubBoxesChange(
                            subBoxes.map((s) =>
                              s.id === item.id ? { ...s, customNumber: inlineEditText } : s
                            )
                          );
                        }
                        setInlineEditSubId(null);
                      }}
                      className="w-8 text-center bg-white text-slate-900 rounded font-bold border border-purple-500 focus:outline-none shadow-xs"
                      style={{ fontSize: `${Math.round(circleBoxSize * 0.38)}px` }}
                    />
                  ) : (
                    Boolean(numberLabel) && <span>{numberLabel}</span>
                  )}
                </div>
              </div>
            );
          })}

          {/* RIGHT SUB BOXES: Circle box di kiri pill, pill memanjang ke kanan */}
          {rightSubs.map(({ item, globalIdx }, i) => {
            const pos = rightPositions[i];
            const circleCenterX = pos ? pos.circleCenterX : (cx + rArc + connectorLength + circleRadius);
            const circleCenterY = pos ? pos.circleCenterY : cy;
            const rawPillText = item.content || item.title || `Sub ${globalIdx + 1}`;
            const displayPillContent = applyTextCaseTransform(
              rawPillText,
              caseSettings.bodyCase !== 'none'
                ? caseSettings.bodyCase
                : caseSettings.pillTitleCase
            );
            const pillBgColor =
              layout.individualPillColor && item.customPillColor
                ? item.customPillColor
                : colors.pillBg;
            const numberLabel = getStyle2ItemNumberLabel(
              globalIdx,
              numberingType,
              layout.style4Separator || '.',
              layout.style4StartFrom || '1',
              item.customNumber
            );

            return (
              <div
                key={item.id}
                className="absolute flex items-center justify-start select-none group z-20"
                style={{
                  left: `${circleCenterX - circleRadius}px`,
                  top: `${circleCenterY - circleRadius}px`,
                  height: `${circleBoxSize}px`,
                }}
              >
                {/* Circle Box Putih (Menempel di ujung KIRI pill, menghadap tengah) */}
                <div
                  className="relative z-20 rounded-full flex items-center justify-center font-bold shadow-xs shrink-0 select-none transition-transform group-hover:scale-105 cursor-pointer"
                  style={{
                    width: `${circleBoxSize}px`,
                    height: `${circleBoxSize}px`,
                    backgroundColor: colors.numberCircleBg || '#ffffff',
                    borderColor: shapeBorderColor(colors.numberCircleBorder || '#3a3a3a'),
                    borderWidth: '2.5px',
                    borderStyle: 'solid',
                    color: colors.numberCircleText || '#2e2e2e',
                    fontSize: `${Math.round(circleBoxSize * 0.38)}px`,
                  }}
                  title="Klik 2x untuk edit isi lingkaran putih"
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    if (!onSubBoxesChange) return;
                    setInlineEditSubId(item.id);
                    setInlineEditField('number');
                    setInlineEditText(item.customNumber || numberLabel || '');
                  }}
                >
                  <ShapeBorder
                    shape="circle"
                    color={colors.numberCircleBorder || '#3a3a3a'}
                    strokeWidth={2.5}
                    profile={shapeProfile}
                  />
                  {inlineEditSubId === item.id && inlineEditField === 'number' ? (
                    <input
                      type="text"
                      value={inlineEditText}
                      autoFocus
                      maxLength={6}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => setInlineEditText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (onSubBoxesChange) {
                            onSubBoxesChange(
                              subBoxes.map((s) =>
                                s.id === item.id ? { ...s, customNumber: inlineEditText } : s
                              )
                            );
                          }
                          setInlineEditSubId(null);
                        } else if (e.key === 'Escape') {
                          setInlineEditSubId(null);
                        }
                      }}
                      onBlur={() => {
                        if (onSubBoxesChange) {
                          onSubBoxesChange(
                            subBoxes.map((s) =>
                              s.id === item.id ? { ...s, customNumber: inlineEditText } : s
                            )
                          );
                        }
                        setInlineEditSubId(null);
                      }}
                      className="w-8 text-center bg-white text-slate-900 rounded font-bold border border-purple-500 focus:outline-none shadow-xs"
                      style={{ fontSize: `${Math.round(circleBoxSize * 0.38)}px` }}
                    />
                  ) : (
                    Boolean(numberLabel) && <span>{numberLabel}</span>
                  )}
                </div>

                {/* Badan Pill Panjang (Sisi Kanan memanjang ke kanan, rounded penuh) */}
                <div
                  className="relative rounded-full shadow-xs flex items-center justify-center transition-all select-none"
                  style={{
                    backgroundColor: pillBgColor,
                    color: colors.pillText,
                    paddingTop: `${pillPaddingY}px`,
                    paddingBottom: `${pillPaddingY}px`,
                    paddingRight: '22px',
                    paddingLeft: `${Math.round(circleBoxSize * 0.35) + 14}px`,
                    marginLeft: `-${Math.round(circleBoxSize * 0.35)}px`,
                    minHeight: `${pillHeight}px`,
                    maxWidth: `${maxPillWidth}px`,
                    borderColor: shapeBorderColor(colors.pillBorder || '#5a3e78'),
                    borderWidth: `${layout.pillBorderWidth || 1.2}px`,
                    borderStyle: 'solid',
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    if (!onSubBoxesChange) return;
                    setInlineEditSubId(item.id);
                    setInlineEditField('text');
                    setInlineEditText(item.content || item.title || '');
                  }}
                >
                  <ShapeBorder
                    shape="pill"
                    color={colors.pillBorder || '#5a3e78'}
                    strokeWidth={layout.pillBorderWidth || 1.2}
                    profile={shapeProfile}
                  />
                  {inlineEditSubId === item.id && inlineEditField === 'text' ? (
                    <input
                      type="text"
                      value={inlineEditText}
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => setInlineEditText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (onSubBoxesChange) {
                            onSubBoxesChange(
                              subBoxes.map((s) =>
                                s.id === item.id
                                  ? { ...s, content: inlineEditText, title: inlineEditText }
                                  : s
                              )
                            );
                          }
                          setInlineEditSubId(null);
                        } else if (e.key === 'Escape') {
                          setInlineEditSubId(null);
                        }
                      }}
                      onBlur={() => {
                        if (onSubBoxesChange) {
                          onSubBoxesChange(
                            subBoxes.map((s) =>
                              s.id === item.id
                                ? { ...s, content: inlineEditText, title: inlineEditText }
                                : s
                            )
                          );
                        }
                        setInlineEditSubId(null);
                      }}
                      className="bg-white text-slate-900 px-2 py-0.5 rounded text-xs border border-purple-400 focus:outline-none shadow-xs font-normal"
                      style={{ fontSize: `${layout.fontSizeBody || 15}px`, minWidth: '100px' }}
                    />
                  ) : (
                    <span
                      className="font-normal text-left whitespace-pre-wrap leading-snug cursor-text"
                      title="Klik 2x untuk edit teks langsung"
                      style={{ fontSize: `${layout.fontSizeBody || 15}px` }}
                    >
                      {displayPillContent}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <CanvasGuidesOverlay
          width={canvasDimension?.width || 1920}
          height={canvasDimension?.height || 1080}
          show={showGuides}
        />
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER GAYA 5: SLIDE MATERI (SIDEBAR + FOTO)
  // ==========================================
  if (diagramStyle === 'style5' && style5Data && style5Colors && style5Layout) {
    const width = canvasDimension?.width || 1920;
    const height = canvasDimension?.height || 1080;
    return (
      <div
        ref={diagramRef}
        id="diagram-canvas-root"
        className="inline-block relative shadow-2xl transition-all select-none rounded-2xl overflow-hidden"
        style={{
          width: `${width}px`,
          height: `${height}px`,
          backgroundColor:
            previewBg === 'transparent'
              ? 'transparent'
              : style5Colors.canvasBg && style5Colors.canvasBg !== 'transparent'
              ? style5Colors.canvasBg
              : previewBg === 'dark'
              ? '#090d16'
              : '#ffffff',
        }}
      >
        <Style5Canvas
          data={style5Data}
          onChange={onStyle5DataChange || (() => {})}
          colors={style5Colors}
          layout={style5Layout}
          caseSettings={caseSettings}
          canvasWidth={width}
          canvasHeight={height}
          selectedElementId={selectedStyle5ElementId || null}
          onSelectElement={onSelectStyle5Element || (() => {})}
          selectedStyle5Ids={selectedStyle5Ids || []}
          onSelectStyle5Ids={onSelectStyle5Ids || (() => {})}
          shapeProfile={shapeProfile}
          artboardOptions={artboardOptions || []}
          onDuplicateSelectionToArtboard={onDuplicateSelectionToArtboard || (() => {})}
          scaleFactor={viewScale || 1}
          onToast={onToast}
          canvasDimension={canvasDimension}
        />
        <CanvasGuidesOverlay width={width} height={height} show={showGuides} />
      </div>
    );
  }

  // ==========================================
  // RENDER GAYA 3: QUESTION & EXPLANATION
  // ==========================================
  if (diagramStyle === 'style3') {
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

    const questionWeightClass =
      style3Layout.questionFontWeight === 'bold'
        ? 'font-bold'
        : style3Layout.questionFontWeight === 'medium'
        ? 'font-medium'
        : 'font-normal';

    return (
      <div className="min-h-full flex items-center justify-center p-6">
        <div
          ref={diagramRef}
          id="diagram-canvas-root"
          className={`relative flex items-center justify-center overflow-hidden transition-colors duration-200 ${
            previewBg === 'transparent'
              ? 'transparency-grid'
              : previewBg === 'dark'
              ? 'bg-slate-900'
              : 'bg-white'
          }`}
          style={{
            width: canvasDimension ? `${canvasDimension.width}px` : undefined,
            height: canvasDimension ? `${canvasDimension.height}px` : undefined,
          }}
        >
          <div
            className="relative flex flex-col items-center select-none transition-transform duration-75 origin-center"
            style={{
              width: `${style3Layout.totalWidth}px`,
              maxWidth: canvasDimension ? 'none' : '96vw',
              padding: `${layout.diagramPadding}px`,
              gap: `${style3Layout.boxesGap}px`,
              fontFamily: "'Rubik', sans-serif",
              transform: `scale(${scaleFactor})`,
            }}
          >
          {/* ================= BOX 1: QUESTION ================= */}
          <div
            ref={questionBoxRef}
            id="style3-question-box"
            className="relative w-full shadow-sm text-left transition-all"
            style={{
              backgroundColor: style3Colors.questionBoxBg,
              borderColor: shapeBorderColor(style3Colors.questionBoxBorder),
              borderWidth: '1.5px',
              borderStyle: 'solid',
              borderRadius: `${style3Layout.borderRadius}px`,
              paddingTop: '28px',
              paddingBottom: '24px',
              paddingLeft: '28px',
              paddingRight: '28px',
            }}
          >
            <ShapeBorder
              shape="rect"
              radius={style3Layout.borderRadius}
              color={style3Colors.questionBoxBorder}
              strokeWidth={1.5}
              profile={shapeProfile}
            />
            {/* Pill Label Overlapping Top-Left Edge */}
            <div
              className="absolute left-6 px-4 py-1 rounded-full shadow-xs flex items-center gap-1 font-semibold tracking-normal transition-all"
              style={{
                top: 0,
                transform: 'translateY(-50%)',
                backgroundColor: style3Colors.questionPillBg,
                color: style3Colors.questionPillText,
                fontSize: `${style3Layout.fontSizeQuestionPill || style3Layout.fontSizePill || 15}px`,
                borderColor: shapeBorderColor(style3Colors.questionBoxBorder),
                borderWidth: '1.2px',
                borderStyle: 'solid',
              }}
            >
              <span>{questionPill}</span>
              <ShapeBorder
                shape="pill"
                color={style3Colors.questionBoxBorder}
                strokeWidth={1.2}
                profile={shapeProfile}
              />
            </div>

            {/* Inner Content: Left (Question + Choices), Right (Image Box) */}
            <div className="flex flex-col md:flex-row gap-6 items-start justify-between">
              {/* Left Column: Text & Choices */}
              <div className="flex-1 min-w-0 pr-2">
                {/* Question Text with blank underline support */}
                <div
                  className={`leading-relaxed break-words whitespace-pre-wrap ${questionWeightClass}`}
                  style={{
                    color: style3Colors.questionTextColor,
                    fontSize: `${style3Layout.fontSizeQuestion}px`,
                  }}
                >
                  {renderQuestionWithBlanks(
                    questionText,
                    style3Colors.blankLineColor
                  )}
                </div>

                {/* Choices List - flex flex-col with dynamic gap */}
                <div
                  className="mt-5 flex flex-col"
                  style={{
                    gap: `${style3Layout.choiceSpacing}px`,
                  }}
                >
                  {style3Data.choices.map((choice, idx) => {
                    const prefix = getStyle3ChoicePrefix(
                      idx,
                      style3Data.choiceNumberingType,
                      style3Data.choiceSeparator
                    );
                    const transformedChoice = applyTextCaseTransform(
                      choice,
                      caseSettings.style3ChoiceCase || 'none'
                    );
                    const isCorrect =
                      style3Data.showCorrectAnswer &&
                      idx === style3Data.correctAnswerIndex;

                    return (
                      <div
                        key={idx}
                        className={`flex items-start gap-1.5 py-1 px-2.5 rounded-lg transition-all ${
                          isCorrect
                            ? 'font-semibold ring-1 ring-emerald-500/40'
                            : 'font-normal'
                        }`}
                        style={{
                          backgroundColor: isCorrect
                            ? style3Colors.correctAnswerHighlightBg
                            : 'transparent',
                          color: isCorrect
                            ? style3Colors.correctAnswerHighlightText
                            : style3Colors.choiceTextColor,
                          fontSize: `${style3Layout.fontSizeChoice}px`,
                        }}
                      >
                        <span className="font-semibold shrink-0 select-none">
                          {prefix}
                        </span>
                        <span className="break-words leading-relaxed">
                          {transformedChoice}
                        </span>
                        {isCorrect && (
                          <Check className="w-4 h-4 ml-1.5 text-emerald-600 shrink-0 self-center" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Image Box (if active) */}
              {style3Data.showImageBox && (
                <div
                  className="shrink-0 flex items-center justify-center rounded-xl shadow-2xs relative bg-white"
                  style={{
                    width: `${style3Layout.imageBoxWidth}px`,
                    height: `${style3Layout.imageBoxHeight}px`,
                    borderColor: shapeBorderColor(style3Colors.questionBoxBorder),
                    borderWidth: '1.2px',
                    borderStyle: 'solid',
                  }}
                >
                  <ShapeBorder
                    shape="rect"
                    radius={12}
                    color={style3Colors.questionBoxBorder}
                    strokeWidth={1.2}
                    profile={shapeProfile}
                  />
                  <div
                    className="absolute inset-0 overflow-hidden"
                    style={{ borderRadius: '11px' }}
                  >
                  {style3Data.imageUrl ? (
                    <img
                      src={style3Data.imageUrl}
                      alt="Ilustrasi Soal"
                      className="w-full h-full"
                      style={{
                        objectFit: style3Data.imageFit,
                      }}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400 p-4 text-center select-none">
                      <ImageIcon className="w-8 h-8 mb-1.5 opacity-60" />
                      <span className="text-[11px] font-medium text-slate-500">
                        Kotak Gambar
                      </span>
                      <span className="text-[10px] text-slate-400">
                        (Placeholder)
                      </span>
                    </div>
                  )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ================= BOX 2: EXPLANATION (Optional) ================= */}
          {style3Data.showExplanation && (
            <div
              ref={explanationBoxRef}
              id="style3-explanation-box"
              className="relative shadow-sm text-left transition-all"
              style={{
                width: style3Layout.matchExplanationWidth ? '100%' : '96%',
                backgroundColor: style3Colors.explanationBoxBg,
                borderColor: shapeBorderColor(style3Colors.explanationBoxBorder),
                borderWidth: '1.5px',
                borderStyle: 'solid',
                borderRadius: `${style3Layout.borderRadius}px`,
                paddingTop: '28px',
                paddingBottom: '24px',
                paddingLeft: '28px',
                paddingRight: '28px',
              }}
            >
              <ShapeBorder
                shape="rect"
                radius={style3Layout.borderRadius}
                color={style3Colors.explanationBoxBorder}
                strokeWidth={1.5}
                profile={shapeProfile}
              />
              {/* Pill Label Overlapping Top-Left Edge */}
              <div
                className="absolute left-6 px-4 py-1 rounded-full shadow-xs flex items-center gap-1 font-semibold tracking-normal transition-all"
                style={{
                  top: 0,
                  transform: 'translateY(-50%)',
                  backgroundColor: style3Colors.explanationPillBg,
                  color: style3Colors.explanationPillText,
                  fontSize: `${style3Layout.fontSizeExplanationPill || style3Layout.fontSizePill || 15}px`,
                  borderColor: shapeBorderColor(style3Colors.explanationBoxBorder),
                  borderWidth: '1.2px',
                  borderStyle: 'solid',
                }}
              >
                <span>{explanationPill}</span>
                <ShapeBorder
                  shape="pill"
                  color={style3Colors.explanationBoxBorder}
                  strokeWidth={1.2}
                  profile={shapeProfile}
                />
              </div>

              {/* Explanation Paragraph */}
              <p
                className="font-normal leading-relaxed break-words whitespace-pre-wrap"
                style={{
                  color: style3Colors.explanationTextColor,
                  fontSize: `${style3Layout.fontSizeExplanation}px`,
                }}
              >
                {explanationText || 'Tulis pembahasan atau penjelasan jawaban di sini...'}
              </p>
            </div>
          )}
        </div>

        <CanvasGuidesOverlay
          width={canvasDimension?.width || 1920}
          height={canvasDimension?.height || 1080}
          show={showGuides}
        />
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER GAYA 1 & GAYA 2
  // ==========================================
  return (
    <div className="min-h-full flex items-center justify-center p-6">
      <div
        ref={diagramRef}
        id="diagram-canvas-root"
        className={`relative flex items-center justify-center overflow-hidden transition-colors duration-200 ${
          previewBg === 'transparent'
            ? 'transparency-grid'
            : previewBg === 'dark'
            ? 'bg-slate-900'
            : 'bg-white'
        }`}
        style={{
          width: canvasDimension ? `${canvasDimension.width}px` : undefined,
          height: canvasDimension ? `${canvasDimension.height}px` : undefined,
        }}
      >
        <div
          ref={contentRef}
          className="relative inline-flex items-center gap-16 md:gap-24 select-none transition-transform duration-75 origin-center"
          style={{
            padding: `${layout.diagramPadding}px`,
            backgroundColor: 'transparent',
            fontFamily: "'Rubik', sans-serif",
            transform: `scale(${scaleFactor})`,
          }}
        >
        {/* SVG Connectors overlay */}
        {diagramStyle === 'style2'
          ? renderStyle2Connectors()
          : renderStyle1Connectors()}

        {/* LEFT: Main Box Container (Identical in both Style 1 and Style 2) */}
        <div
          className="relative z-20 flex-shrink-0 flex items-center justify-center group"
          style={{
            transform: `translateY(${layout.mainBoxOffsetY || 0}px)`,
            transition: isDraggingMainY ? 'none' : 'transform 0.15s ease-out',
          }}
        >
          {/* Main Box Vertical Drag Position Handle */}
          {onLayoutChange && (
            <div
              onMouseDown={handleMainYDragMouseDown}
              title="Tahan & geser untuk atur posisi vertikal kotak utama"
              className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white rounded-md px-2 py-0.5 text-[10px] flex items-center gap-1 cursor-ns-resize shadow-md z-30 select-none"
            >
              <MoveVertical className="w-3 h-3" />
              <span>Geser Posisi</span>
            </div>
          )}

          {/* Outer Double Frame with WHITE FILL (or customizable fill) */}
          <div
            ref={mainTargetRef}
            className={`transition-all duration-150 relative group ${
              layout.showDoubleFrame
                ? 'p-[12px] border-[1.2px] shadow-sm'
                : ''
            }`}
            style={{
              borderColor: layout.showDoubleFrame
                ? shapeBorderColor(colors.mainBoxOuterBorder)
                : 'transparent',
              borderRadius: `${layout.borderRadius + 8}px`,
              backgroundColor: layout.showDoubleFrame
                ? (colors.mainBoxOuterBg || '#ffffff')
                : 'transparent',
            }}
          >
            {layout.showDoubleFrame && (
              <ShapeBorder
                shape="rect"
                radius={layout.borderRadius + 8}
                color={colors.mainBoxOuterBorder}
                strokeWidth={1.2}
                profile={shapeProfile}
              />
            )}
            {/* Scalable Inner Main Box */}
            <div
              className="flex items-center justify-center text-center shadow-md px-6 py-6 transition-all"
              style={{
                width: `${layout.mainBoxWidth || 210}px`,
                minHeight: `${layout.mainBoxMinHeight || 120}px`,
                backgroundColor: colors.mainBoxBg,
                color: colors.mainBoxText,
                borderRadius: `${layout.borderRadius}px`,
              }}
            >
              <h1
                className="font-semibold tracking-tight leading-snug break-words"
                style={{
                  fontSize: `${layout.fontSizeMain}px`,
                }}
              >
                {displayMainTitle}
              </h1>
            </div>

            {/* Scalable Main Box Resize Handle */}
            {onLayoutChange && (
              <div
                onMouseDown={handleMainBoxResizeMouseDown}
                title="Tahan & geser untuk mengubah ukuran kotak utama (bingkai luar otomatis mengikuti)"
                className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-10 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity flex items-center justify-center cursor-ew-resize z-30"
              >
                <div className="w-1.5 h-7 rounded-full bg-indigo-600 shadow-md ring-2 ring-white" />
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Sub Boxes Column */}
        {diagramStyle === 'style2' ? (
          /* ================= GAYA 2: PILL BERNOMOR ================= */
          <div
            className="relative z-20 flex flex-col flex-shrink-0 items-start"
            style={{
              gap: `${layout.subBoxGap || 20}px`,
            }}
          >
            {subBoxes.map((sub, index) => {
              const pillBgColor =
                layout.individualPillColor && sub.customPillColor
                  ? sub.customPillColor
                  : colors.pillBg;

              const isBeingDragged = draggedSubIndex === index;
              const isDropTarget = dragOverIndex === index;

              // Text transformation for content / pill in Style 2
              const rawPillText = sub.content || sub.title || `Sub Box ${index + 1}`;
              const displayPillContent = applyTextCaseTransform(
                rawPillText,
                caseSettings.bodyCase !== 'none'
                  ? caseSettings.bodyCase
                  : caseSettings.pillTitleCase
              );

              const numberLabel = getStyle2ItemNumberLabel(
                index,
                numberingType,
                layout.style2Separator || '.',
                layout.style2StartFrom || '1',
                sub.customNumber
              );

              return (
                <div
                  key={sub.id}
                  ref={(el) => {
                    subBoxRefs.current[index] = el;
                  }}
                  draggable={Boolean(onSubBoxesChange)}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`relative flex items-center group transition-all select-none ${
                    isBeingDragged ? 'opacity-40 scale-98' : ''
                  } ${
                    isDropTarget ? 'ring-2 ring-indigo-500 ring-offset-2' : ''
                  }`}
                  style={{
                    cursor: onSubBoxesChange ? 'grab' : 'default',
                  }}
                >
                  {/* Lingkaran Nomor di Sisi Kiri Pill (menimpa tepi kiri pill) */}
                  {(hasNumbers || Boolean(sub.customNumber)) && (
                    <div
                      ref={(el) => {
                        circleRefs.current[index] = el;
                      }}
                      className="relative z-20 rounded-full flex items-center justify-center font-bold shadow-xs shrink-0 select-none transition-transform group-hover:scale-105"
                      style={{
                        width: `${circleSize}px`,
                        height: `${circleSize}px`,
                        backgroundColor: colors.numberCircleBg || '#ffffff',
                        borderColor: shapeBorderColor(colors.numberCircleBorder || '#3a3a3a'),
                        borderWidth: '2.5px',
                        borderStyle: 'solid',
                        color: colors.numberCircleText || '#2e2e2e',
                        fontSize: `${Math.round(circleSize * 0.4)}px`,
                      }}
                    >
                      <span>{numberLabel}</span>
                      <ShapeBorder
                        shape="circle"
                        color={colors.numberCircleBorder || '#3a3a3a'}
                        strokeWidth={2.5}
                        profile={shapeProfile}
                      />
                    </div>
                  )}

                  {/* Badan Pill Panjang (Sisi kanan membulat penuh, sisi kiri rounded 15px) */}
                  <div
                    className={`relative z-10 shadow-xs flex items-center transition-all ${
                      hasNumbers || Boolean(sub.customNumber)
                        ? '-ml-[22px] pl-[34px] pr-6'
                        : 'px-6'
                    }`}
                    style={{
                      backgroundColor: pillBgColor,
                      color: colors.pillText,
                      paddingTop: `${layout.style2PillPaddingY || 10}px`,
                      paddingBottom: `${layout.style2PillPaddingY || 10}px`,
                      minHeight: `${circleSize}px`,
                      maxWidth: `${layout.subBoxMaxWidth || 520}px`,
                      borderColor: shapeBorderColor(colors.pillBorder || '#3a3a3a'),
                      borderWidth: `${layout.pillBorderWidth || 1.2}px`,
                      borderStyle: 'solid',
                      borderTopLeftRadius: `${layout.style2PillRadiusLeft !== undefined ? layout.style2PillRadiusLeft : 15}px`,
                      borderBottomLeftRadius: `${layout.style2PillRadiusLeft !== undefined ? layout.style2PillRadiusLeft : 15}px`,
                      borderTopRightRadius: '9999px',
                      borderBottomRightRadius: '9999px',
                    }}
                  >
                    <p
                      className="font-medium leading-relaxed break-words whitespace-pre-wrap select-text text-left"
                      style={{
                        fontSize: `${layout.fontSizeBody}px`,
                      }}
                    >
                      {displayPillContent}
                    </p>
                    <ShapeBorder
                      shape="rect"
                      radius={[
                        layout.style2PillRadiusLeft !== undefined ? layout.style2PillRadiusLeft : 15,
                        9999,
                        9999,
                        layout.style2PillRadiusLeft !== undefined ? layout.style2PillRadiusLeft : 15,
                      ]}
                      color={colors.pillBorder || '#3a3a3a'}
                      strokeWidth={layout.pillBorderWidth || 1.2}
                      profile={shapeProfile}
                    />

                    {/* Drag Reorder Handle inside Pill */}
                    {onSubBoxesChange && (
                      <div
                        title="Tarik untuk memindahkan urutan"
                        className="ml-2.5 opacity-0 group-hover:opacity-70 hover:!opacity-100 transition-opacity p-0.5 text-white/80 cursor-grab shrink-0"
                      >
                        <GripVertical className="w-3.5 h-3.5" />
                      </div>
                    )}

                    {/* Direct Delete Sub Box in Style 2 */}
                    {onSubBoxesChange && subBoxes.length > 2 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSubBoxesChange(
                            subBoxes.filter((s) => s.id !== sub.id)
                          );
                        }}
                        title="Hapus sub box ini"
                        className="ml-1 opacity-0 group-hover:opacity-70 hover:!opacity-100 transition-opacity p-1 text-white/80 hover:text-white hover:bg-black/20 rounded-full cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ================= GAYA 1: KOTAK JUDUL PILL ================= */
          <div
            className="relative z-20 flex flex-col flex-shrink-0"
            style={{
              gap: `${layout.subBoxGap}px`,
            }}
          >
            {subBoxes.map((sub, index) => {
              const pillBgColor =
                layout.individualPillColor && sub.customPillColor
                  ? sub.customPillColor
                  : colors.pillBg;

              const isBeingDragged = draggedSubIndex === index;
              const isDropTarget = dragOverIndex === index;
              const isPillVisible =
                layout.showPillLabels !== false && !sub.hidePill;

              // Text transformation for Style 1
              const displayPillTitle = applyTextCaseTransform(
                sub.title || `Sub Box ${index + 1}`,
                caseSettings.pillTitleCase
              );
              const displayContent = applyTextCaseTransform(
                sub.content || 'Isi deskripsi sub box...',
                caseSettings.bodyCase
              );

              return (
                <div
                  key={sub.id}
                  ref={(el) => {
                    subBoxRefs.current[index] = el;
                  }}
                  draggable={Boolean(onSubBoxesChange)}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`relative shadow-sm transition-all text-left group ${
                    isBeingDragged ? 'opacity-40 scale-98' : ''
                  } ${
                    isDropTarget
                      ? 'ring-2 ring-indigo-500 ring-offset-2'
                      : ''
                  }`}
                  style={{
                    width: `${layout.subBoxMaxWidth}px`,
                    maxWidth: '90vw',
                    backgroundColor: colors.subBoxBg,
                    borderColor: shapeBorderColor(colors.subBoxBorder),
                    borderWidth: `${layout.subBoxBorderWidth || 1}px`,
                    borderStyle: 'solid',
                    borderRadius: `${layout.borderRadius}px`,
                    paddingTop: isPillVisible ? '22px' : '18px',
                    paddingBottom: '18px',
                    paddingLeft: '22px',
                    paddingRight: '26px',
                    cursor: onSubBoxesChange ? 'grab' : 'default',
                  }}
                >
                  <ShapeBorder
                    shape="rect"
                    radius={layout.borderRadius}
                    color={colors.subBoxBorder}
                    strokeWidth={layout.subBoxBorderWidth || 1}
                    profile={shapeProfile}
                  />
                  {/* Drag to Reorder Icon */}
                  {onSubBoxesChange && (
                    <div
                      title="Tarik untuk memindahkan urutan sub box"
                      className="absolute right-7 top-2.5 opacity-0 group-hover:opacity-60 hover:opacity-100 transition-opacity p-1 text-slate-500 cursor-grab"
                    >
                      <GripVertical className="w-3.5 h-3.5" />
                    </div>
                  )}

                  {/* Direct Delete Entire Sub Box Button (Top-Right) */}
                  {onSubBoxesChange && subBoxes.length > 2 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSubBoxesChange(
                          subBoxes.filter((s) => s.id !== sub.id)
                        );
                      }}
                      title="Hapus seluruh sub box ini"
                      className="absolute right-2 top-2.5 opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Scalable Width Resize Handle on Right Edge */}
                  {onLayoutChange && (
                    <div
                      onMouseDown={handleWidthResizeMouseDown}
                      title="Tahan & geser untuk mengatur lebar sub box (Scalable)"
                      className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-10 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity flex items-center justify-center cursor-ew-resize z-30"
                    >
                      <div className="w-1.5 h-7 rounded-full bg-indigo-600 shadow-md ring-2 ring-white" />
                    </div>
                  )}

                  {/* Pill Title Badge */}
                  {isPillVisible ? (
                    <div
                      onMouseDown={handlePillDragMouseDown}
                      title="Tahan & geser horizontal untuk mengatur posisi semua label pill"
                      className="absolute -top-[15px] px-3.5 py-1 rounded-full shadow-xs flex items-center gap-1 font-semibold tracking-normal transition-all cursor-ew-resize group/pill select-none hover:shadow-md"
                      style={{
                        left: `${pillOffset}px`,
                        backgroundColor: pillBgColor,
                        color: colors.pillText,
                        fontSize: `${layout.fontSizePill}px`,
                        borderColor: shapeBorderColor(colors.pillBorder || '#3a3a3a'),
                        borderWidth: `${layout.pillBorderWidth || 1.2}px`,
                        borderStyle: 'solid',
                      }}
                    >
                      <ShapeBorder
                        shape="pill"
                        color={colors.pillBorder || '#3a3a3a'}
                        strokeWidth={layout.pillBorderWidth || 1.2}
                        profile={shapeProfile}
                      />
                      <MoveHorizontal className="w-3 h-3 opacity-60 group-hover/pill:opacity-100 transition-opacity" />
                      <span>{displayPillTitle}</span>

                      {/* Delete Pill Label Box ONLY */}
                      {onSubBoxesChange && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSubBoxesChange(
                              subBoxes.map((s) =>
                                s.id === sub.id ? { ...s, hidePill: true } : s
                              )
                            );
                          }}
                          title="Hapus box label pill ini (box teks deskripsi tetap ada)"
                          className="ml-1 p-0.5 rounded-full hover:bg-black/30 text-white/80 hover:text-white transition-colors cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ) : (
                    onSubBoxesChange &&
                    layout.showPillLabels !== false && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSubBoxesChange(
                            subBoxes.map((s) =>
                              s.id === sub.id ? { ...s, hidePill: false } : s
                            )
                          );
                        }}
                        title="Tampilkan kembali box label pill untuk sub box ini"
                        className="absolute -top-[13px] opacity-0 group-hover:opacity-90 hover:!opacity-100 transition-opacity px-2.5 py-0.5 rounded-full border border-dashed border-indigo-400 bg-indigo-50/95 text-indigo-700 text-[11px] font-medium flex items-center gap-1 shadow-xs hover:bg-indigo-100 cursor-pointer z-20"
                        style={{ left: `${pillOffset}px` }}
                      >
                        <Plus className="w-3 h-3" />
                        <span>+ Label Pill</span>
                      </button>
                    )
                  )}

                  {/* Sub Box Body Text */}
                  <p
                    className="font-normal leading-relaxed break-words whitespace-pre-wrap transition-all"
                    style={{
                      color: colors.subBoxText,
                      fontSize: `${layout.fontSizeBody}px`,
                    }}
                  >
                    {displayContent}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        </div>

        <CanvasGuidesOverlay
          width={canvasDimension?.width || 1920}
          height={canvasDimension?.height || 1080}
          show={showGuides}
        />
      </div>
    </div>
  );
};
