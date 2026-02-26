// ===== Đơn vị đo =====
/** Đơn vị milimet */
export type Millimeter = number;
/** Đơn vị pixel */
export type Pixel = number;
/** Mật độ điểm ảnh trên inch */
export type DPIValue = number;

// ===== Hằng số =====
export const PRINT_DPI: DPIValue = 300;
export const A4_WIDTH_MM: Millimeter = 210;
export const A4_HEIGHT_MM: Millimeter = 297;
export const A4_WIDTH_PX: Pixel = 2480;
export const A4_HEIGHT_PX: Pixel = 3508;

// ===== Frame Sizes =====
export type FrameSize = "6x9" | "10x15" | "polaroid";

export const FRAME_DIMENSIONS: Record<FrameSize, FrameDimension> = {
  "6x9": { width: 60, height: 90 },
  "10x15": { width: 100, height: 150 },
  polaroid: { width: 79, height: 108 },
};

/** Nhãn hiển thị cho từng loại khung */
export const FRAME_LABELS: Record<FrameSize, string> = {
  "6x9": "6×9 cm",
  "10x15": "10×15 cm",
  polaroid: "Polaroid",
};

export interface FrameDimension {
  width: Millimeter;
  height: Millimeter;
}

// ===== Layout Config =====
export interface LayoutConfig {
  rows: number;
  cols: number;
  frameSize: FrameSize;
  bleed: Millimeter;
  padding: Millimeter;
  showCropMarks: boolean;
  showSafeZone: boolean;
}

// ===== Photo Placement =====
export interface PhotoPlacement {
  assetId: string;
  x: Millimeter;
  y: Millimeter;
  width: Millimeter;
  height: Millimeter;
  rotation: number;
}

// ===== Print Page =====
export interface PrintPage {
  pageIndex: number;
  placements: PhotoPlacement[];
}

// ===== Nesting Result =====
export interface NestingResult {
  pages: PrintPage[];
  totalPages: number;
  maxPhotosPerPage: number;
  frameSize: FrameDimension;
  layout: LayoutConfig;
}

// ===== Asset Info =====
export interface AssetInfo {
  _id: string;
  originalName: string;
  fileName: string;
  filePath: string;
  mimeType: string;
  fileSize: number;
  width?: Pixel;
  height?: Pixel;
  uploadedAt: string;
}

// ===== Utilities =====
export const mmToPixel = (mm: Millimeter, dpi: DPIValue = PRINT_DPI): Pixel => {
  return Math.round((mm * dpi) / 25.4);
};

export const pixelToMm = (px: Pixel, dpi: DPIValue = PRINT_DPI): Millimeter => {
  return (px * 25.4) / dpi;
};
