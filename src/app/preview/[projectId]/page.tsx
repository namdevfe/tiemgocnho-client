"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useEditorStore } from "@/hooks/useEditorStore";
import { getAssetUrl } from "@/lib/api";
import {
  A4_WIDTH_MM,
  A4_HEIGHT_MM,
  PRINT_DPI,
  mmToPixel,
  FRAME_LABELS,
  FRAME_DIMENSIONS,
  type PhotoPlacement,
  type PrintPage,
} from "@/types/print";

// ===== Inline SVG Icons =====
const IconClose = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IconDownload = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const IconZoomIn = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
    <line x1="11" y1="8" x2="11" y2="14" />
    <line x1="8" y1="11" x2="14" y2="11" />
  </svg>
);

const IconZoomOut = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
    <line x1="8" y1="11" x2="14" y2="11" />
  </svg>
);

const IconMaximize = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" />
  </svg>
);

const IconCheck = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path
      fillRule="evenodd"
      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
      clipRule="evenodd"
    />
  </svg>
);

const IconWarning = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path
      fillRule="evenodd"
      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
      clipRule="evenodd"
    />
  </svg>
);

const IconArrowLeft = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const IconArrowRight = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const IconEdit = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const IconPrinter = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="6 9 6 2 18 2 18 9" />
    <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
    <rect x="6" y="14" width="12" height="8" />
  </svg>
);

const IconSettings = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
  </svg>
);

// ===== Print-accurate Constants =====
/**
 * Chiều rộng hiển thị trang A4 tại 100% zoom (display pixels).
 * Đây là hằng số UI duy nhất — mọi tỉ lệ khác được suy ra từ PPI=300.
 */
const PREVIEW_BASE_WIDTH_PX = 630;
const ZOOM_LEVELS = [50, 75, 100, 125, 150];

/**
 * Pipeline chuyển đổi đơn vị:
 * mm → printPx (via mmToPixel @ 300 DPI) → displayPx (via displayScale)
 *
 * displayScale = (PREVIEW_BASE_WIDTH_PX / pagePrintWidthPx) * (zoom / 100)
 * Đảm bảo renderPreview() và exportPDF() dùng chung mmToPixel().
 */
const toDisplayPx = (
  mm: number,
  pagePrintWidthPx: number,
  zoom: number,
): number => {
  const printPx = mmToPixel(mm, PRINT_DPI);
  const displayScale =
    (PREVIEW_BASE_WIDTH_PX / pagePrintWidthPx) * (zoom / 100);
  return printPx * displayScale;
};

const PrintPreviewPage = () => {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const { projectName, assets, pages, layoutConfig, orientation } =
    useEditorStore();

  // State
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [zoom, setZoom] = useState(75);
  const [isReady, setIsReady] = useState(false);

  // Luôn load project khi mount (editor cleanup có thể xóa store)
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsReady(false);
      await useEditorStore.getState().loadProject(projectId);
      if (!cancelled) setIsReady(true);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  // ===== Kích thước trang (mm) =====
  const pageWidthMm = orientation === "portrait" ? A4_WIDTH_MM : A4_HEIGHT_MM;
  const pageHeightMm = orientation === "portrait" ? A4_HEIGHT_MM : A4_WIDTH_MM;

  // ===== Print pixels (300 DPI) — dùng chung cho preview & export =====
  const pagePrintW = mmToPixel(pageWidthMm, PRINT_DPI);
  const pagePrintH = mmToPixel(pageHeightMm, PRINT_DPI);

  // ===== Display scale: print px → display px =====
  const displayScale = (PREVIEW_BASE_WIDTH_PX / pagePrintW) * (zoom / 100);

  // Kích thước trang trên màn hình
  const pageDisplayW = pagePrintW * displayScale;
  const pageDisplayH = pagePrintH * displayScale;

  // Helper: mm → display px (dùng cho tọa độ placement, bleed, padding)
  const mmToDisplay = useCallback(
    (mm: number) => toDisplayPx(mm, pagePrintW, zoom),
    [pagePrintW, zoom],
  );

  // Printable area (vùng in thực, trừ bleed)
  const printableArea = useMemo(
    () => ({
      x: layoutConfig.bleed,
      y: layoutConfig.bleed,
      width: pageWidthMm - 2 * layoutConfig.bleed,
      height: pageHeightMm - 2 * layoutConfig.bleed,
    }),
    [pageWidthMm, pageHeightMm, layoutConfig.bleed],
  );

  // Trang hiện tại
  const currentPage: PrintPage | undefined = pages[currentPageIndex];
  const totalPages = pages.length || 1;

  // Map assetId → asset info
  const assetMap = useMemo(() => {
    const map = new Map<string, (typeof assets)[0]>();
    for (const a of assets) map.set(a._id, a);
    return map;
  }, [assets]);

  // Tính DPI thực tế cho mỗi placement
  const getImageDpi = useCallback(
    (placement: PhotoPlacement | null | undefined) => {
      if (!placement) return null;
      const asset = assetMap.get(placement.assetId);
      if (!asset?.width || !asset?.height) return null;
      // DPI = (pixel gốc × 25.4) / kích thước in (mm)
      const dpiX = (asset.width * 25.4) / placement.width;
      const dpiY = (asset.height * 25.4) / placement.height;
      return Math.round(Math.min(dpiX, dpiY));
    },
    [assetMap],
  );

  // Helper render image với transform (Tính theo %)
  // Không phụ thuộc vào displayPx hay mm, % luôn hiển thị chính xác ở mọi scale
  const renderImageWithTransform = useCallback(
    (pl: PhotoPlacement, asset: any) => {
      const SCALE = 2; // Tỉ lệ gốc của Canvas Editor
      const frame = FRAME_DIMENSIONS[layoutConfig.frameSize];
      const slotW = frame.width * SCALE;
      const slotH = frame.height * SCALE;

      const imgW = asset.width || 1;
      const imgH = asset.height || 1;

      // Tính toán defaultScale (CenterCrop) như hệ thống Editor
      const defaultScale = Math.max(slotW / imgW, slotH / imgH);
      const customScale = pl.imageScale ?? defaultScale;

      const scaledW = imgW * customScale;
      const scaledH = imgH * customScale;

      const defaultOffsetX = (scaledW - slotW) / 2;
      const defaultOffsetY = (scaledH - slotH) / 2;

      const offsetXPx =
        pl.imageOffsetX !== undefined ? pl.imageOffsetX : -defaultOffsetX;
      const offsetYPx =
        pl.imageOffsetY !== undefined ? pl.imageOffsetY : -defaultOffsetY;

      const leftPercent = (offsetXPx / slotW) * 100;
      const topPercent = (offsetYPx / slotH) * 100;
      const widthPercent = (scaledW / slotW) * 100;
      const heightPercent = (scaledH / slotH) * 100;

      return (
        <img
          src={getAssetUrl(asset.fileName, asset._id)}
          alt={asset.originalName}
          style={{
            position: "absolute",
            left: `${leftPercent}%`,
            top: `${topPercent}%`,
            width: `${widthPercent}%`,
            height: `${heightPercent}%`,
            transform: pl.imageRotation
              ? `rotate(${pl.imageRotation}deg)`
              : "none",
            transformOrigin: "center center",
            maxWidth: "none",
            objectFit: "fill",
          }}
          draggable={false}
        />
      );
    },
    [layoutConfig.frameSize],
  );

  // Navigation
  const handlePrevPage = useCallback(() => {
    setCurrentPageIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setCurrentPageIndex((prev) => Math.min(totalPages - 1, prev + 1));
  }, [totalPages]);

  // Zoom
  const handleZoomIn = useCallback(() => {
    setZoom((prev) => {
      const idx = ZOOM_LEVELS.indexOf(prev);
      return idx < ZOOM_LEVELS.length - 1 ? ZOOM_LEVELS[idx + 1] : prev;
    });
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => {
      const idx = ZOOM_LEVELS.indexOf(prev);
      return idx > 0 ? ZOOM_LEVELS[idx - 1] : prev;
    });
  }, []);

  const handleFitScreen = useCallback(() => {
    setZoom(75);
  }, []);

  // Quay lại editor
  const handleBackToEditor = useCallback(() => {
    router.push(`/editor/${projectId}`);
  }, [router, projectId]);

  const handleClose = useCallback(() => {
    router.push(`/editor/${projectId}`);
  }, [router, projectId]);

  // Native Browser Print (PDF)
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // Kiểm tra technical checks
  const checks = useMemo(() => {
    if (!currentPage) return [];

    const allPlacements = pages
      .flatMap((p) => p.placements || [])
      .filter(Boolean);

    // 1. Resolution check
    let allHighRes = true;
    let lowResCount = 0;
    for (const pl of allPlacements) {
      const dpi = getImageDpi(pl);
      if (dpi !== null && dpi < 300) {
        allHighRes = false;
        lowResCount++;
      }
    }

    // 2. Bleed
    const hasBleed = layoutConfig.bleed > 0;

    // 3. Crop marks
    const hasCropMarks = layoutConfig.showCropMarks;

    return [
      {
        label: "Kiểm tra độ phân giải",
        desc: allHighRes
          ? "Tất cả ảnh đạt 300+ DPI"
          : `${lowResCount} ảnh dưới 300 DPI`,
        ok: allHighRes,
      },
      {
        label: "Color Space: sRGB",
        desc: "Hồ sơ màu web chuẩn",
        ok: true,
      },
      {
        label: "Bleed (tràn viền)",
        desc: hasBleed
          ? `${layoutConfig.bleed}mm bleed đã thiết lập`
          : "Chưa thiết lập bleed",
        ok: hasBleed,
      },
      {
        label: "Crop Marks",
        desc: hasCropMarks ? "Đã bật dấu cắt tự động" : "Dấu cắt đang tắt",
        ok: hasCropMarks,
      },
    ];
  }, [currentPage, pages, getImageDpi, layoutConfig]);

  // Loading state
  if (!isReady) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500">Đang tải bản xem trước...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ===== Native Print Layer (Chỉ xuất hiện khi Gọi in - PDF) ===== */}
      <div className="hidden print:block w-full bg-white">
        {pages.map((p, pageIdx) => (
          <div
            key={`print-page-${pageIdx}`}
            className="relative bg-white mx-auto print-page"
            style={{
              width: `${pageWidthMm}mm`,
              height: `${pageHeightMm}mm`,
              pageBreakAfter: "always",
              overflow: "hidden",
            }}
          >
            {/* Crop marks in print */}
            {layoutConfig.showCropMarks && (
              <>
                <div className="absolute top-0 left-0 w-[5mm] h-[5mm] border-t-[0.5mm] border-l-[0.5mm] border-black" />
                <div className="absolute top-0 right-0 w-[5mm] h-[5mm] border-t-[0.5mm] border-r-[0.5mm] border-black" />
                <div className="absolute bottom-0 left-0 w-[5mm] h-[5mm] border-b-[0.5mm] border-l-[0.5mm] border-black" />
                <div className="absolute bottom-0 right-0 w-[5mm] h-[5mm] border-b-[0.5mm] border-r-[0.5mm] border-black" />
              </>
            )}

            {/* Placements for Print */}
            {p.placements.map((pl, idx) => {
              if (!pl) return null;
              const asset = assetMap.get(pl.assetId);
              if (!asset) return null;

              // Visual clamping for print: inside printable area
              const clampedX = Math.max(pl.x, printableArea.x);
              const clampedY = Math.max(pl.y, printableArea.y);
              const clampedRight = Math.min(
                pl.x + pl.width,
                printableArea.x + printableArea.width,
              );
              const clampedBottom = Math.min(
                pl.y + pl.height,
                printableArea.y + printableArea.height,
              );
              const clampedW = Math.max(0, clampedRight - clampedX);
              const clampedH = Math.max(0, clampedBottom - clampedY);

              if (clampedW <= 0 || clampedH <= 0) return null;

              return (
                <div
                  key={`print-${pl.assetId}-${idx}`}
                  style={{
                    position: "absolute",
                    left: `${clampedX}mm`,
                    top: `${clampedY}mm`,
                    width: `${clampedW}mm`,
                    height: `${clampedH}mm`,
                    overflow: "hidden",
                    transform: pl.rotation
                      ? `rotate(${pl.rotation}deg)`
                      : undefined,
                  }}
                >
                  {renderImageWithTransform(pl, asset)}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* ===== Screen Layout ===== */}
      <div className="fixed inset-0 z-50 flex flex-col bg-slate-50 print:hidden">
        {/* ===== Top Bar ===== */}
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3 shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center size-10 rounded-lg bg-orange-50 text-orange-500">
              <IconPrinter className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-slate-900 text-lg font-bold leading-tight">
                Xem trước bản in
              </h1>
              <p className="text-slate-500 text-xs">
                A4 Layout • 300 DPI High Fidelity
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Color profile info */}
            <div className="hidden md:flex items-center gap-6 mr-6 border-r border-slate-200 pr-6">
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                  Color Profile
                </p>
                <p className="text-sm font-medium text-slate-700">
                  sRGB IEC61966-2.1
                </p>
              </div>
            </div>

            {/* Download */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-bold hover:bg-slate-200 transition-colors"
              aria-label="Tải PDF"
            >
              <IconDownload className="w-4 h-4" />
              <span>Tải PDF / In</span>
            </button>

            {/* Close */}
            <button
              onClick={handleClose}
              className="ml-2 p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-lg hover:bg-slate-100"
              aria-label="Đóng"
            >
              <IconClose className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* ===== Main Viewer ===== */}
          <main className="flex-1 overflow-auto bg-slate-100 p-8 flex flex-col items-center">
            {/* Pagination phía trên */}
            {totalPages > 1 && (
              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPageIndex === 0}
                  className="p-1.5 rounded-lg hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Trang trước"
                >
                  <IconArrowLeft className="w-5 h-5 text-slate-600" />
                </button>
                <span className="text-sm font-semibold text-slate-600">
                  Trang {currentPageIndex + 1} / {totalPages}
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={currentPageIndex >= totalPages - 1}
                  className="p-1.5 rounded-lg hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Trang sau"
                >
                  <IconArrowRight className="w-5 h-5 text-slate-600" />
                </button>
              </div>
            )}

            {/* Trang A4 — kích thước tính từ PPI=300 + displayScale */}
            <div
              className="relative bg-white shadow-[0_10px_30px_rgba(0,0,0,0.1)] flex-shrink-0"
              style={{
                width: `${pageDisplayW}px`,
                height: `${pageDisplayH}px`,
                overflow: "hidden",
              }}
            >
              {/* Crop marks - 4 góc (kích thước cố định 20px display) */}
              {layoutConfig.showCropMarks && (
                <>
                  <div className="absolute top-0 left-0 w-[20px] h-[20px] border-t-[1.5px] border-l-[1.5px] border-slate-400" />
                  <div className="absolute top-0 right-0 w-[20px] h-[20px] border-t-[1.5px] border-r-[1.5px] border-slate-400" />
                  <div className="absolute bottom-0 left-0 w-[20px] h-[20px] border-b-[1.5px] border-l-[1.5px] border-slate-400" />
                  <div className="absolute bottom-0 right-0 w-[20px] h-[20px] border-b-[1.5px] border-r-[1.5px] border-slate-400" />
                </>
              )}

              {/* Bleed line — đường viền vùng an toàn (printable area) */}
              {layoutConfig.bleed > 0 && (
                <div
                  className="absolute border-[1.5px] border-dashed border-orange-400 pointer-events-none opacity-60"
                  style={{
                    inset: `${mmToDisplay(layoutConfig.bleed)}px`,
                  }}
                />
              )}

              {/* Placements (ảnh) — tọa độ mm → display px via PPI pipeline */}
              {currentPage?.placements?.map((pl, idx) => {
                if (!pl) return null;
                const asset = assetMap.get(pl.assetId);
                if (!asset) return null;

                const dpi = getImageDpi(pl);
                const isLowRes = dpi !== null && dpi < 300;

                // Visual clamping: giới hạn placement trong printable area
                const clampedX = Math.max(pl.x, printableArea.x);
                const clampedY = Math.max(pl.y, printableArea.y);
                const clampedRight = Math.min(
                  pl.x + pl.width,
                  printableArea.x + printableArea.width,
                );
                const clampedBottom = Math.min(
                  pl.y + pl.height,
                  printableArea.y + printableArea.height,
                );
                const clampedW = Math.max(0, clampedRight - clampedX);
                const clampedH = Math.max(0, clampedBottom - clampedY);

                // Chuyển mm → display px
                const displayLeft = mmToDisplay(clampedX);
                const displayTop = mmToDisplay(clampedY);
                const displayWidth = mmToDisplay(clampedW);
                const displayHeight = mmToDisplay(clampedH);

                if (displayWidth <= 0 || displayHeight <= 0) return null;

                return (
                  <div
                    key={`${pl.assetId}-${idx}`}
                    className="absolute bg-slate-50"
                    style={{
                      left: `${displayLeft}px`,
                      top: `${displayTop}px`,
                      width: `${displayWidth}px`,
                      height: `${displayHeight}px`,
                      overflow: "hidden",
                      transform: pl.rotation
                        ? `rotate(${pl.rotation}deg)` // Xoay khung (layout object xoay)
                        : undefined,
                    }}
                  >
                    {/* Photo tự render theo % */}
                    {renderImageWithTransform(pl, asset)}

                    {/* Badge DPI */}
                    <div
                      className={`absolute top-1.5 left-1.5 text-white text-[9px] px-1.5 py-0.5 rounded font-bold ${
                        isLowRes ? "bg-red-500/80" : "bg-black/50"
                      }`}
                    >
                      {dpi ? `${dpi} DPI` : "N/A"}
                    </div>

                    {/* Cảnh báo nếu thiếu độ phân giải */}
                    {isLowRes && (
                      <div className="absolute inset-0 border-2 border-red-400 pointer-events-none" />
                    )}
                  </div>
                );
              })}

              {/* Empty state nếu không có placement */}
              {(!currentPage || currentPage.placements?.length === 0) && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-slate-400">
                    <p className="text-sm font-medium">Trang trống</p>
                    <p className="text-xs mt-1">Chưa có ảnh nào được đặt</p>
                  </div>
                </div>
              )}

              {/* Footer label */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[9px] text-slate-400 font-medium uppercase tracking-widest whitespace-nowrap">
                {projectName} • Trang {currentPageIndex + 1} / {totalPages}
              </div>
            </div>
          </main>

          {/* ===== Sidebar ===== */}
          <aside className="w-80 border-l border-slate-200 bg-white p-6 flex flex-col gap-6 overflow-y-auto shrink-0">
            <div className="space-y-8">
              {/* Print Specifications */}
              <div>
                <h3 className="text-slate-900 font-bold mb-4 flex items-center gap-2">
                  <IconSettings className="w-5 h-5 text-orange-500" />
                  Thông số in
                </h3>
                <div className="space-y-3">
                  {/* Page info */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-2">
                      Thông tin trang
                    </p>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Khổ giấy</span>
                        <span className="text-sm font-semibold text-slate-900">
                          A4 ({A4_WIDTH_MM} × {A4_HEIGHT_MM} mm)
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">
                          Hướng giấy
                        </span>
                        <span className="text-sm font-semibold text-slate-900">
                          {orientation === "portrait" ? "Dọc" : "Ngang"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">
                          Độ phân giải
                        </span>
                        <span className="text-sm font-semibold text-slate-900">
                          300 DPI
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Số trang</span>
                        <span className="text-sm font-semibold text-slate-900">
                          {totalPages}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Layout details */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-2">
                      Chi tiết layout
                    </p>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Số ảnh</span>
                        <span className="text-sm font-semibold text-slate-900">
                          {assets.length} ảnh
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Lưới</span>
                        <span className="text-sm font-semibold text-slate-900">
                          {layoutConfig.rows}×{layoutConfig.cols}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">
                          Khung ảnh
                        </span>
                        <span className="text-sm font-semibold text-slate-900">
                          {FRAME_LABELS[layoutConfig.frameSize]}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Bleed</span>
                        <span className="text-sm font-semibold text-slate-900">
                          {layoutConfig.bleed}mm
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Padding</span>
                        <span className="text-sm font-semibold text-slate-900">
                          {layoutConfig.padding}mm
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Technical Checklist */}
              <div>
                <h3 className="text-slate-900 font-bold mb-4 flex items-center gap-2">
                  <IconCheck className="w-5 h-5 text-green-500" />
                  Kiểm tra kỹ thuật
                </h3>
                <ul className="space-y-2">
                  {checks.map((check, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3 p-2.5 rounded-lg"
                    >
                      {check.ok ? (
                        <IconCheck className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                      ) : (
                        <IconWarning className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-slate-700">
                          {check.label}
                        </p>
                        <p className="text-xs text-slate-500">{check.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-auto space-y-3 pt-6 border-t border-slate-200">
              <button
                onClick={handlePrint}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-orange-500 text-white font-bold hover:bg-orange-600 shadow-lg shadow-orange-500/20 transition-all"
                aria-label="Tải bản in PDF"
              >
                <IconDownload className="w-5 h-5" />
                Tải bản in PDF
              </button>
              <button
                onClick={handleBackToEditor}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-all"
                aria-label="Quay lại chỉnh sửa"
              >
                <IconEdit className="w-5 h-5" />
                Quay lại chỉnh sửa
              </button>
            </div>
          </aside>
        </div>

        {/* ===== Zoom Controls Overlay ===== */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/90 backdrop-blur-md border border-slate-200 p-2 rounded-full shadow-2xl z-10">
          <button
            onClick={handleZoomOut}
            disabled={zoom <= ZOOM_LEVELS[0]}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600 disabled:opacity-30"
            aria-label="Thu nhỏ"
          >
            <IconZoomOut className="w-5 h-5" />
          </button>
          <span className="px-4 text-sm font-bold text-slate-700 min-w-[50px] text-center">
            {zoom}%
          </span>
          <button
            onClick={handleZoomIn}
            disabled={zoom >= ZOOM_LEVELS[ZOOM_LEVELS.length - 1]}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600 disabled:opacity-30"
            aria-label="Phóng to"
          >
            <IconZoomIn className="w-5 h-5" />
          </button>
          <div className="w-px h-6 bg-slate-200 mx-1" />
          <button
            onClick={handleFitScreen}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600"
            aria-label="Vừa màn hình"
          >
            <IconMaximize className="w-5 h-5" />
          </button>
        </div>
      </div>
    </>
  );
};

export default PrintPreviewPage;
