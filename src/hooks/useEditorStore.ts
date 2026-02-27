import { create } from "zustand";
import {
  AssetInfo,
  LayoutConfig,
  PrintPage,
  PhotoPlacement,
  FrameSize,
  Millimeter,
  NestingResult,
  FRAME_DIMENSIONS,
  PaperSize,
  getPaperDimensions,
  calculateMaxGrid,
} from "@/types/print";
import {
  getAssets,
  registerLocalUrl,
  saveProject as apiSaveProject,
  getProject as apiGetProject,
} from "@/lib/api";

export type PaperOrientation = "portrait" | "landscape";

/** Mở rộng AssetInfo để hỗ trợ local URL */
export interface AssetInfoExtended extends AssetInfo {
  _localUrl?: string;
}

interface EditorState {
  // Dự án hiện tại
  projectId: string | null;
  projectName: string;
  // Danh sách ảnh đã upload
  assets: AssetInfoExtended[];
  // Cấu hình layout hiện tại
  layoutConfig: LayoutConfig;
  // Hướng giấy
  orientation: PaperOrientation;
  // Danh sách trang A4 với vị trí ảnh
  pages: PrintPage[];
  // Kết quả nesting đầy đủ
  nestingResult: NestingResult | null;
  // Ảnh đang được chọn
  selectedAssetId: string | null;
  // Trang hiện tại
  currentPage: number;
  // Tab hiện tại trên sidebar trái
  activeTab: "uploads" | "frames";
  // Trạng thái loading
  isLoading: boolean;
  // Trạng thái saving
  isSaving: boolean;
  // Có thay đổi chưa lưu
  isDirty: boolean;
  // Timer cho auto-save debounce
  _saveTimer: ReturnType<typeof setTimeout> | null;

  // Actions
  loadAssets: () => Promise<void>;
  addAssets: (newAssets: AssetInfoExtended[]) => void;
  removeAsset: (id: string) => void;
  placeAssetInSlot: (pageIdx: number, slotIdx: number, assetId: string) => void;
  updatePlacementTransform: (
    pageIdx: number,
    slotIdx: number,
    transform: {
      imageScale?: number;
      imageOffsetX?: number;
      imageOffsetY?: number;
      imageRotation?: number;
    },
  ) => void;
  setPaperSize: (size: PaperSize) => void;
  setFrameSize: (size: FrameSize) => void;
  setBleed: (bleed: Millimeter) => void;
  setPadding: (padding: Millimeter) => void;
  setGutter: (gutter: Millimeter) => void;
  setRows: (rows: number) => void;
  setCols: (cols: number) => void;
  setOrientation: (orientation: PaperOrientation) => void;
  toggleCropMarks: () => void;
  toggleSafeZone: () => void;
  setSelectedAsset: (id: string | null) => void;
  setCurrentPage: (page: number) => void;
  setActiveTab: (tab: "uploads" | "frames") => void;
  recalculatePages: () => void;

  // Project actions
  /** Load dự án từ DB theo ID */
  loadProject: (projectId: string) => Promise<void>;
  /** Lưu state hiện tại vào DB */
  saveToProject: () => Promise<void>;
  /** Đánh dấu dirty + trigger auto-save debounce */
  markDirty: () => void;
  /** Reset editor về trạng thái trống */
  resetEditor: () => void;
}

/** Auto-save sau khi user ngừng thao tác 2 giây */
const AUTO_SAVE_DELAY = 2000;

const constrainGrid = (
  config: LayoutConfig,
  orientation: PaperOrientation,
): LayoutConfig => {
  const paperDim = getPaperDimensions(config.paperSize, orientation);
  const frameDim = FRAME_DIMENSIONS[config.frameSize];
  const { maxCols, maxRows } = calculateMaxGrid(
    paperDim.width,
    paperDim.height,
    frameDim.width,
    frameDim.height,
    config.padding,
    config.bleed,
  );
  return {
    ...config,
    cols: Math.min(Math.max(1, config.cols), maxCols),
    rows: Math.min(Math.max(1, config.rows), maxRows),
  };
};

export const useEditorStore = create<EditorState>((set, get) => ({
  projectId: null,
  projectName: "",
  assets: [],
  layoutConfig: {
    paperSize: "a4",
    rows: 2,
    cols: 2,
    frameSize: "10x15",
    bleed: 3,
    padding: 5,
    showCropMarks: true,
    showSafeZone: true,
  },
  orientation: "portrait",
  pages: [],
  nestingResult: null,
  selectedAssetId: null,
  currentPage: 0,
  activeTab: "uploads",
  isLoading: false,
  isSaving: false,
  isDirty: false,
  _saveTimer: null,

  // ===== Load dự án từ DB =====
  loadProject: async (projectId: string) => {
    set({ isLoading: true });
    try {
      const project = await apiGetProject(projectId);

      // Load assets thuộc project này từ server
      let projectAssets: AssetInfoExtended[] = [];
      if (project.assetIds && project.assetIds.length > 0) {
        projectAssets = await getAssets(projectId);
      }

      set({
        projectId: project._id,
        projectName: project.name,
        assets: projectAssets,
        pages: project.pages || [],
        layoutConfig: project.layoutConfig
          ? {
              ...project.layoutConfig,
              paperSize: project.layoutConfig.paperSize || "a4",
            }
          : {
              paperSize: "a4",
              rows: 2,
              cols: 2,
              frameSize: "10x15",
              bleed: 3,
              padding: 5,
              showCropMarks: true,
              showSafeZone: true,
            },
        orientation: project.orientation || "portrait",
        currentPage: project.currentPage || 0,
        isDirty: false,
      });
    } catch (error) {
      console.error("Load dự án thất bại:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  // ===== Lưu state hiện tại vào DB =====
  saveToProject: async () => {
    const { projectId, assets, pages, layoutConfig, orientation, currentPage } =
      get();
    if (!projectId) return;

    set({ isSaving: true });
    try {
      await apiSaveProject(projectId, {
        assetIds: assets.map((a) => a._id),
        pages,
        layoutConfig,
        orientation,
        currentPage,
      });
      set({ isDirty: false });
    } catch (error) {
      console.error("Lưu dự án thất bại:", error);
    } finally {
      set({ isSaving: false });
    }
  },

  // ===== Đánh dấu thay đổi + auto-save =====
  markDirty: () => {
    const { _saveTimer, projectId } = get();
    if (!projectId) return;

    // Hủy timer cũ
    if (_saveTimer) clearTimeout(_saveTimer);

    // Tạo timer mới
    const timer = setTimeout(() => {
      get().saveToProject();
    }, AUTO_SAVE_DELAY);

    set({ isDirty: true, _saveTimer: timer });
  },

  // ===== Reset editor =====
  resetEditor: () => {
    const { _saveTimer } = get();
    if (_saveTimer) clearTimeout(_saveTimer);

    set({
      projectId: null,
      projectName: "",
      assets: [],
      pages: [],
      nestingResult: null,
      selectedAssetId: null,
      currentPage: 0,
      isDirty: false,
      isSaving: false,
      _saveTimer: null,
      layoutConfig: {
        paperSize: "a4",
        rows: 2,
        cols: 2,
        frameSize: "10x15",
        bleed: 3,
        padding: 5,
        showCropMarks: true,
        showSafeZone: true,
      },
      orientation: "portrait",
      activeTab: "uploads",
    });
  },

  /** Load ảnh đã upload từ server (chỉ lấy ảnh thuộc project hiện tại) */
  loadAssets: async () => {
    const { projectId } = get();
    set({ isLoading: true });
    try {
      const serverAssets = await getAssets(projectId || undefined);
      if (serverAssets.length > 0) {
        const { assets: currentAssets } = get();
        const existingIds = new Set(currentAssets.map((a) => a._id));
        const newFromServer = serverAssets.filter(
          (a) => !existingIds.has(a._id),
        );
        if (newFromServer.length > 0) {
          set((state) => ({
            assets: [...state.assets, ...newFromServer],
          }));
        }
      }
    } catch (error) {
      console.error("Load assets failed:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  addAssets: (newAssets) => {
    for (const asset of newAssets) {
      if (asset._localUrl) {
        registerLocalUrl(asset._id, asset._localUrl);
      }
    }
    set((state) => ({ assets: [...state.assets, ...newAssets] }));
    get().recalculatePages();
    get().markDirty();
  },

  removeAsset: (id) => {
    set((state) => ({
      assets: state.assets.filter((a) => a._id !== id),
      selectedAssetId:
        state.selectedAssetId === id ? null : state.selectedAssetId,
    }));
    const { pages } = get();
    const updatedPages = pages.map((page) => ({
      ...page,
      placements: page.placements.map((p) =>
        p && p.assetId === id ? (undefined as unknown as PhotoPlacement) : p,
      ),
    }));
    set({ pages: updatedPages });
    get().markDirty();
  },

  placeAssetInSlot: (pageIdx, slotIdx, assetId) => {
    const { pages, layoutConfig, orientation } = get();
    const paperDim = getPaperDimensions(layoutConfig.paperSize, orientation);
    const frame = FRAME_DIMENSIONS[layoutConfig.frameSize];
    const { bleed, padding, cols, rows } = layoutConfig;

    const gridW = cols * frame.width + Math.max(0, cols - 1) * padding;
    const gridH = rows * frame.height + Math.max(0, rows - 1) * padding;
    const startX =
      bleed + Math.max(0, (paperDim.width - 2 * bleed - gridW) / 2);
    const startY =
      bleed + Math.max(0, (paperDim.height - 2 * bleed - gridH) / 2);

    const col = slotIdx % cols;
    const row = Math.floor(slotIdx / cols);
    const x = startX + col * (frame.width + padding);
    const y = startY + row * (frame.height + padding);

    const placement: PhotoPlacement = {
      assetId,
      x,
      y,
      width: frame.width,
      height: frame.height,
      rotation: 0,
    };

    const updatedPages = [...pages];
    while (updatedPages.length <= pageIdx) {
      updatedPages.push({ pageIndex: updatedPages.length, placements: [] });
    }
    const placements = [...updatedPages[pageIdx].placements];
    placements[slotIdx] = placement;
    updatedPages[pageIdx] = { ...updatedPages[pageIdx], placements };
    set({ pages: updatedPages });
    get().markDirty();
  },

  updatePlacementTransform: (pageIdx, slotIdx, transform) => {
    const { pages } = get();
    if (!pages[pageIdx] || !pages[pageIdx].placements[slotIdx]) return;

    const updatedPages = [...pages];
    const pageObj = { ...updatedPages[pageIdx] };
    const placements = [...pageObj.placements];

    const currentPlacement = placements[slotIdx];
    if (currentPlacement) {
      placements[slotIdx] = {
        ...currentPlacement,
        ...transform,
      };
      pageObj.placements = placements;
      updatedPages[pageIdx] = pageObj;
      set({ pages: updatedPages });
      get().markDirty();
    }
  },

  setPaperSize: (size) => {
    set((state) => ({
      layoutConfig: constrainGrid(
        { ...state.layoutConfig, paperSize: size },
        state.orientation,
      ),
    }));
    get().recalculatePages();
    get().markDirty();
  },

  setFrameSize: (size) => {
    set((state) => ({
      layoutConfig: constrainGrid(
        { ...state.layoutConfig, frameSize: size },
        state.orientation,
      ),
    }));
    get().recalculatePages();
    get().markDirty();
  },

  setBleed: (bleed) => {
    set((state) => ({
      layoutConfig: constrainGrid(
        { ...state.layoutConfig, bleed },
        state.orientation,
      ),
    }));
    get().recalculatePages();
    get().markDirty();
  },

  setPadding: (padding) => {
    set((state) => ({
      layoutConfig: constrainGrid(
        { ...state.layoutConfig, padding },
        state.orientation,
      ),
    }));
    get().recalculatePages();
    get().markDirty();
  },

  setGutter: (gutter) => {
    set((state) => ({
      layoutConfig: constrainGrid(
        { ...state.layoutConfig, padding: gutter },
        state.orientation,
      ),
    }));
    get().recalculatePages();
    get().markDirty();
  },

  setRows: (rows) => {
    set((state) => ({
      layoutConfig: constrainGrid(
        { ...state.layoutConfig, rows },
        state.orientation,
      ),
    }));
    get().recalculatePages();
    get().markDirty();
  },

  setCols: (cols) => {
    set((state) => ({
      layoutConfig: constrainGrid(
        { ...state.layoutConfig, cols },
        state.orientation,
      ),
    }));
    get().recalculatePages();
    get().markDirty();
  },

  setOrientation: (orientation) => {
    set((state) => ({
      orientation,
      layoutConfig: constrainGrid(state.layoutConfig, orientation),
    }));
    get().recalculatePages();
    get().markDirty();
  },

  toggleCropMarks: () => {
    set((state) => ({
      layoutConfig: {
        ...state.layoutConfig,
        showCropMarks: !state.layoutConfig.showCropMarks,
      },
    }));
    get().markDirty();
  },

  toggleSafeZone: () => {
    set((state) => ({
      layoutConfig: {
        ...state.layoutConfig,
        showSafeZone: !state.layoutConfig.showSafeZone,
      },
    }));
    get().markDirty();
  },

  setSelectedAsset: (id) => set({ selectedAssetId: id }),
  setCurrentPage: (page) => {
    set({ currentPage: page });
    get().markDirty();
  },
  setActiveTab: (tab) => set({ activeTab: tab }),

  recalculatePages: () => {
    const { assets, pages, layoutConfig, orientation } = get();

    if (assets.length === 0) {
      set({ pages: [], nestingResult: null });
      return;
    }

    const paperDim = getPaperDimensions(layoutConfig.paperSize, orientation);
    const frame = FRAME_DIMENSIONS[layoutConfig.frameSize];
    const { rows, cols, bleed, padding } = layoutConfig;
    const totalSlots = rows * cols;

    const gridW = cols * frame.width + Math.max(0, cols - 1) * padding;
    const gridH = rows * frame.height + Math.max(0, rows - 1) * padding;
    const startX =
      bleed + Math.max(0, (paperDim.width - 2 * bleed - gridW) / 2);
    const startY =
      bleed + Math.max(0, (paperDim.height - 2 * bleed - gridH) / 2);

    // 1. Phẳng hóa (flatten) danh sách assetId hiện đang được xếp trên các trang theo đúng thứ tự hiển thị
    // Cách này sẽ giúp dàn lại toàn bộ ảnh khi user đổi số hàng, rớt trang đúng chuẩn.
    const orderedAssetIds: string[] = [];
    for (const page of pages) {
      for (const p of page.placements) {
        if (p && p.assetId) {
          if (assets.some((a) => a._id === p.assetId)) {
            orderedAssetIds.push(p.assetId);
          }
        }
      }
    }

    // 2. Tính số trang cần thiết tối thiểu cho lượng ảnh đang xếp.
    // Dựa trên số lượng ảnh thực sự đã được đưa vào luồng (orderedAssetIds).
    const totalPagesNeeded = Math.max(
      1,
      Math.ceil(orderedAssetIds.length / totalSlots),
    );

    // 3. Build pages
    const newPages: PrintPage[] = [];
    let placedCount = 0;

    for (let pageIdx = 0; pageIdx < totalPagesNeeded; pageIdx++) {
      const placements: (typeof pages)[0]["placements"] = [];

      for (let slotIdx = 0; slotIdx < totalSlots; slotIdx++) {
        // Tọa độ luôn được tính dù có ảnh hay không để vẽ khung trống (nếu sau này cần layout tĩnh)
        const col = slotIdx % cols;
        const row = Math.floor(slotIdx / cols);
        const x = startX + col * (frame.width + padding);
        const y = startY + row * (frame.height + padding);

        // Lấy asset tiếp theo từ thứ tự cũ
        if (placedCount < orderedAssetIds.length) {
          const assetId = orderedAssetIds[placedCount];
          // Kế thừa transform data nếu nó đã được lưu cùng với orderedAssetIds
          // Lưu ý: với thuật toán hiện tại flatten orderedAssetIds chỉ lưu mảng string id,
          // nên khi resize Hàng/Cột, các setting scale/offset cũ thuộc về slot cũ sẽ bị reset.
          // Đây là hành vi chấp nhận được để layout lưới mới được cleanly fit.
          placements[slotIdx] = {
            assetId,
            x,
            y,
            width: frame.width,
            height: frame.height,
            rotation: 0,
            imageScale: undefined,
            imageOffsetX: undefined,
            imageOffsetY: undefined,
            imageRotation: 0,
          };
          placedCount++;
        }
      }

      newPages.push({ pageIndex: pageIdx, placements });
    }

    const result: NestingResult = {
      pages: newPages,
      totalPages: newPages.length,
      maxPhotosPerPage: totalSlots,
      frameSize: frame,
      layout: layoutConfig,
    };

    // Khi thu hẹp lưới, số trang có thể ít hơn so với vị trí user đang đứng
    // => Cần đẩy currentPage ngược lại về trang cuối cùng có sẵn
    const { currentPage } = get();
    const clampedPage = Math.min(currentPage, Math.max(0, newPages.length - 1));

    set({
      pages: result.pages,
      nestingResult: result,
      currentPage: clampedPage,
    });
  },
}));
