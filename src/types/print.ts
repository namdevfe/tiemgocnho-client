// ===== Đơn vị đo =====
export type Millimeter = number;
export type Pixel = number;
export type DPIValue = number;

export const PRINT_DPI: DPIValue = 300;

// ===== Kích thước giấy =====
export type PaperSize = "a4" | "a3" | "letter";

export const A4_WIDTH_MM: Millimeter = 210;
export const A4_HEIGHT_MM: Millimeter = 297;

export interface PaperDimension {
  width: Millimeter;
  height: Millimeter;
}

export type PaperOrientation = "portrait" | "landscape";

export const getPaperDimensions = (
  size: PaperSize,
  orientation: PaperOrientation,
): PaperDimension => {
  let w: number, h: number;
  switch (size) {
    case "a3":
      w = 297;
      h = 420;
      break;
    case "letter":
      w = 215.9; // 8.5 in
      h = 279.4; // 11 in
      break;
    case "a4":
    default:
      w = 210;
      h = 297;
      break;
  }
  return orientation === "landscape"
    ? { width: h, height: w }
    : { width: w, height: h };
};

// ===== Kích thước ảnh (Frame) =====
export type FrameSize = "6x9" | "10x15" | "polaroid";

export interface FrameDimension {
  width: Millimeter;
  height: Millimeter;
}

export const FRAME_DIMENSIONS: Record<FrameSize, FrameDimension> = {
  "6x9": { width: 60, height: 90 },
  "10x15": { width: 100, height: 150 },
  polaroid: { width: 79, height: 108 },
};

export const FRAME_LABELS: Record<FrameSize, string> = {
  "6x9": "Khung 6x9",
  "10x15": "Khung 10x15",
  polaroid: "Polaroid cổ điển",
};

// ===== Cấu hình Layout =====
export interface LayoutConfig {
  paperSize: PaperSize;
  rows: number;
  cols: number;
  frameSize: FrameSize;
  bleed: Millimeter;
  padding: Millimeter;
  showCropMarks: boolean;
  showSafeZone: boolean;
}

// ===== Vị trí ảnh =====
export interface PhotoPlacement {
  assetId: string;
  x: Millimeter;
  y: Millimeter;
  width: Millimeter;
  height: Millimeter;
  rotation: number;
  // Các thông số transform ảnh bên trong khung
  imageScale?: number;
  imageOffsetX?: number;
  imageOffsetY?: number;
  imageRotation?: number;
}

// ===== Trang in =====
export interface PrintPage {
  pageIndex: number;
  placements: PhotoPlacement[];
}

// ===== Kết quả Nesting =====
export interface NestingResult {
  pages: PrintPage[];
  totalPages: number;
  maxPhotosPerPage: number;
  frameSize: FrameDimension;
  layout: LayoutConfig;
}

// ===== Thông tin ảnh upload =====
export interface AssetInfo {
  _id: string;
  originalName: string;
  fileName: string;
  filePath: string;
  mimeType: string;
  fileSize: number;
  width?: Pixel;
  height?: Pixel;
  uploadedAt: Date | string; // Có thể lưu dạng string khi fetch API
}

// ===== Thuật toán grid tối đa =====
/** Tính số hàng/cột tối đa trên giấy đã chọn (cho phép tràn lề một chút để in sát mép) */
export const calculateMaxGrid = (
  paperWidth: Millimeter,
  paperHeight: Millimeter,
  frameWidth: Millimeter,
  frameHeight: Millimeter,
  padding: Millimeter,
  bleed: Millimeter,
): { maxCols: number; maxRows: number } => {
  // Thêm khoảng dung sai 15mm để hỗ trợ in tràn viền (borderless) hoặc lố một tí vẫn set được
  const printableWidth = paperWidth - 2 * bleed + 15;
  const printableHeight = paperHeight - 2 * bleed + 15;

  const maxCols = Math.floor(
    (printableWidth + padding) / (frameWidth + padding),
  );
  const maxRows = Math.floor(
    (printableHeight + padding) / (frameHeight + padding),
  );

  return {
    maxCols: Math.max(1, maxCols),
    maxRows: Math.max(1, maxRows),
  };
};

// ===== Utility: chuyển đổi đơn vị =====
/** Chuyển mm sang pixel theo DPI */
export const mmToPixel = (mm: Millimeter, dpi: DPIValue = PRINT_DPI): Pixel => {
  return Math.round((mm * dpi) / 25.4);
};

/** Chuyển pixel sang mm theo DPI */
export const pixelToMm = (px: Pixel, dpi: DPIValue = PRINT_DPI): Millimeter => {
  return (px * 25.4) / dpi;
};
