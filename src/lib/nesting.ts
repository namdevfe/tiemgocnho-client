import {
  A4_WIDTH_MM,
  A4_HEIGHT_MM,
  FRAME_DIMENSIONS,
  FrameSize,
  Millimeter,
  PhotoPlacement,
  PrintPage,
  NestingResult,
  LayoutConfig,
} from "@/types/print";

/**
 * Thuật toán Nesting client-side (chạy realtime để preview).
 * Cùng logic với backend để đảm bảo nhất quán.
 */

/** Tính số hàng/cột tối đa trên A4 */
export const calculateMaxGrid = (
  frameSize: FrameSize,
  bleed: Millimeter,
  padding: Millimeter,
): { maxCols: number; maxRows: number } => {
  const frame = FRAME_DIMENSIONS[frameSize];

  const printableWidth = A4_WIDTH_MM - 2 * bleed;
  const printableHeight = A4_HEIGHT_MM - 2 * bleed;

  const maxCols = Math.floor(
    (printableWidth + padding) / (frame.width + padding),
  );
  const maxRows = Math.floor(
    (printableHeight + padding) / (frame.height + padding),
  );

  return {
    maxCols: Math.max(1, maxCols),
    maxRows: Math.max(1, maxRows),
  };
};

/** Tính toán vị trí placement cho từng ảnh trên các trang A4 */
export const calculatePlacements = (
  assetIds: string[],
  frameSize: FrameSize,
  rows: number,
  cols: number,
  bleed: Millimeter,
  padding: Millimeter,
): PrintPage[] => {
  const frame = FRAME_DIMENSIONS[frameSize];
  const photosPerPage = rows * cols;
  const totalPages = Math.ceil(assetIds.length / photosPerPage);
  const pages: PrintPage[] = [];

  for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
    const placements: PhotoPlacement[] = [];
    const startIdx = pageIdx * photosPerPage;
    const endIdx = Math.min(startIdx + photosPerPage, assetIds.length);

    for (let i = startIdx; i < endIdx; i++) {
      const posInPage = i - startIdx;
      const col = posInPage % cols;
      const row = Math.floor(posInPage / cols);

      const x = bleed + col * (frame.width + padding);
      const y = bleed + row * (frame.height + padding);

      placements.push({
        assetId: assetIds[i],
        x,
        y,
        width: frame.width,
        height: frame.height,
        rotation: 0,
      });
    }

    pages.push({ pageIndex: pageIdx, placements });
  }

  return pages;
};

/** Thực hiện nesting đầy đủ: tính grid tối ưu + phân phối ảnh */
export const performNesting = (
  assetIds: string[],
  config: Pick<LayoutConfig, "frameSize" | "bleed" | "padding">,
): NestingResult => {
  const { frameSize, bleed, padding } = config;
  const frame = FRAME_DIMENSIONS[frameSize];
  const { maxCols, maxRows } = calculateMaxGrid(frameSize, bleed, padding);
  const maxPhotosPerPage = maxCols * maxRows;
  const pages = calculatePlacements(
    assetIds,
    frameSize,
    maxRows,
    maxCols,
    bleed,
    padding,
  );

  const layout: LayoutConfig = {
    paperSize: "a4",
    rows: maxRows,
    cols: maxCols,
    frameSize,
    bleed,
    padding,
    showCropMarks: false,
    showSafeZone: false,
  };

  return {
    pages,
    totalPages: pages.length,
    maxPhotosPerPage,
    frameSize: frame,
    layout,
  };
};

/** Xuất JSON cấu trúc tờ in để gửi cho backend */
export const exportPrintJson = (result: NestingResult): string => {
  return JSON.stringify(result, null, 2);
};
