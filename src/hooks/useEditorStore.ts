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

export const useEditorStore = create<EditorState>((set, get) => ({
  projectId: null,
  projectName: "",
  assets: [],
  layoutConfig: {
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
        layoutConfig: project.layoutConfig || {
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
    const { pages, layoutConfig } = get();
    const frame = FRAME_DIMENSIONS[layoutConfig.frameSize];
    const { bleed, padding, cols } = layoutConfig;

    const col = slotIdx % cols;
    const row = Math.floor(slotIdx / cols);
    const x = bleed + col * (frame.width + padding);
    const y = bleed + row * (frame.height + padding);

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

  setFrameSize: (size) => {
    set((state) => ({
      layoutConfig: { ...state.layoutConfig, frameSize: size },
    }));
    get().recalculatePages();
    get().markDirty();
  },

  setBleed: (bleed) => {
    set((state) => ({ layoutConfig: { ...state.layoutConfig, bleed } }));
    get().recalculatePages();
    get().markDirty();
  },

  setPadding: (padding) => {
    set((state) => ({ layoutConfig: { ...state.layoutConfig, padding } }));
    get().recalculatePages();
    get().markDirty();
  },

  setGutter: (gutter) => {
    set((state) => ({
      layoutConfig: { ...state.layoutConfig, padding: gutter },
    }));
    get().recalculatePages();
    get().markDirty();
  },

  setRows: (rows) => {
    set((state) => ({
      layoutConfig: { ...state.layoutConfig, rows: Math.max(1, rows) },
    }));
    get().recalculatePages();
    get().markDirty();
  },

  setCols: (cols) => {
    set((state) => ({
      layoutConfig: { ...state.layoutConfig, cols: Math.max(1, cols) },
    }));
    get().recalculatePages();
    get().markDirty();
  },

  setOrientation: (orientation) => {
    set({ orientation });
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
    const { assets, pages, layoutConfig } = get();

    if (assets.length === 0) {
      set({ pages: [], nestingResult: null });
      return;
    }

    const frame = FRAME_DIMENSIONS[layoutConfig.frameSize];
    const { rows, cols, bleed, padding } = layoutConfig;
    const totalSlots = rows * cols;

    // 1. Thu thập slot→assetId từ pages hiện tại (giữ manual placements)
    const currentSlotMap = new Map<string, string>();
    for (const page of pages) {
      for (let i = 0; i < page.placements.length; i++) {
        const p = page.placements[i];
        if (p && p.assetId) {
          // Chỉ giữ placement nếu asset vẫn còn tồn tại
          if (assets.some((a) => a._id === p.assetId)) {
            currentSlotMap.set(`${page.pageIndex}-${i}`, p.assetId);
          }
        }
      }
    }

    // 2. Tính số trang cần thiết (dựa trên tổng ảnh, đảm bảo đủ slot)
    const totalPagesNeeded = Math.max(1, Math.ceil(assets.length / totalSlots));

    // 3. Build pages — chỉ giữ slot đã có placement, slot trống để trống
    //    KHÔNG auto-fill: user phải kéo thả thủ công
    const newPages: PrintPage[] = [];

    for (let pageIdx = 0; pageIdx < totalPagesNeeded; pageIdx++) {
      const placements: (typeof pages)[0]["placements"] = [];

      for (let slotIdx = 0; slotIdx < totalSlots; slotIdx++) {
        const key = `${pageIdx}-${slotIdx}`;
        const existingAssetId = currentSlotMap.get(key);

        const col = slotIdx % cols;
        const row = Math.floor(slotIdx / cols);
        const x = bleed + col * (frame.width + padding);
        const y = bleed + row * (frame.height + padding);

        if (existingAssetId) {
          // Giữ nguyên placement đã kéo thả trước đó
          placements[slotIdx] = {
            assetId: existingAssetId,
            x,
            y,
            width: frame.width,
            height: frame.height,
            rotation: 0,
          };
        }
        // Slot trống: không push gì → placements[slotIdx] = undefined
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

    set({
      pages: result.pages,
      nestingResult: result,
    });
  },
}));
