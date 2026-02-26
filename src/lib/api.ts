import axios from "axios";
import { AssetInfo, NestingResult, FrameSize, Millimeter } from "@/types/print";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
});

// ===== Upload =====

/** Upload nhiều ảnh lên server (gắn vào project nếu có) */
export const uploadPhotos = async (
  files: File[],
  projectId?: string,
): Promise<AssetInfo[]> => {
  const formData = new FormData();
  files.forEach((file) => formData.append("photos", file));
  // Gắn projectId để asset thuộc về project
  if (projectId) {
    formData.append("projectId", projectId);
  }

  try {
    const { data } = await api.post<{ success: boolean; data: AssetInfo[] }>(
      "/upload",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return data.data;
  } catch (error) {
    console.error("Upload API error, tạo asset local fallback:", error);

    // Fallback: tạo AssetInfo local từ file (dùng Object URL)
    return files.map((file) => ({
      _id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      originalName: file.name,
      fileName: file.name,
      filePath: "",
      mimeType: file.type,
      fileSize: file.size,
      uploadedAt: new Date().toISOString(),
      _localUrl: URL.createObjectURL(file),
    }));
  }
};

/** Lấy danh sách ảnh đã upload từ server (filter theo project nếu có) */
export const getAssets = async (projectId?: string): Promise<AssetInfo[]> => {
  try {
    const params = projectId ? { projectId } : {};
    const { data } = await api.get<{ success: boolean; data: AssetInfo[] }>(
      "/upload/assets",
      { params },
    );
    return data.data;
  } catch (error) {
    console.error("Không thể tải danh sách ảnh từ server:", error);
    return [];
  }
};

/** Xóa ảnh */
export const deleteAsset = async (id: string): Promise<void> => {
  // Nếu là asset local thì không gọi API
  if (id.startsWith("local-")) return;

  try {
    await api.delete(`/upload/assets/${id}`);
  } catch (error) {
    console.error("Xóa ảnh thất bại:", error);
  }
};

// ===== Render =====

/** Tính toán nesting */
export const calculateNesting = async (
  assetIds: string[],
  frameSize: FrameSize,
  bleed: Millimeter,
  padding: Millimeter,
): Promise<NestingResult> => {
  const { data } = await api.post<{ success: boolean; data: NestingResult }>(
    "/render/nesting",
    {
      assetIds,
      frameSize,
      bleed,
      padding,
    },
  );

  return data.data;
};

/** Map lưu trữ Object URL cho ảnh local */
const localUrlMap = new Map<string, string>();

/** Đăng ký URL local cho asset */
export const registerLocalUrl = (assetId: string, url: string): void => {
  localUrlMap.set(assetId, url);
};

/** Lấy URL cho ảnh đã upload (hỗ trợ cả server và local) */
export const getAssetUrl = (fileNameOrId: string, assetId?: string): string => {
  // Kiểm tra local URL trước
  if (assetId && localUrlMap.has(assetId)) {
    return localUrlMap.get(assetId)!;
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") ||
    "http://localhost:5000";
  return `${baseUrl}/uploads/${fileNameOrId}`;
};

// ===== Projects =====

/** Thông tin dự án trong danh sách */
export interface ProjectListItem {
  _id: string;
  name: string;
  customerName?: string;
  customerPhone?: string;
  status: "draft" | "printing" | "completed";
  createdAt: string;
  updatedAt: string;
}

/** Thông tin chi tiết dự án (đầy đủ editor state) */
export interface ProjectDetail {
  _id: string;
  name: string;
  customerName?: string;
  customerPhone?: string;
  note?: string;
  assetIds: string[];
  pages: import("@/types/print").PrintPage[];
  layoutConfig: import("@/types/print").LayoutConfig;
  orientation: "portrait" | "landscape";
  currentPage: number;
  status: "draft" | "printing" | "completed";
  createdAt: string;
  updatedAt: string;
}

/** Tạo dự án mới */
export const createProject = async (data: {
  name: string;
  customerName?: string;
  customerPhone?: string;
  note?: string;
}): Promise<ProjectDetail> => {
  const { data: res } = await api.post<{
    success: boolean;
    data: ProjectDetail;
  }>("/projects", data);
  return res.data;
};

/** Lấy danh sách dự án */
export const getProjects = async (): Promise<ProjectListItem[]> => {
  const { data: res } = await api.get<{
    success: boolean;
    data: ProjectListItem[];
  }>("/projects");
  return res.data;
};

/** Lấy chi tiết dự án */
export const getProject = async (id: string): Promise<ProjectDetail> => {
  const { data: res } = await api.get<{
    success: boolean;
    data: ProjectDetail;
  }>(`/projects/${id}`);
  return res.data;
};

/** Lưu editor state vào dự án */
export const saveProject = async (
  id: string,
  state: Partial<ProjectDetail>,
): Promise<ProjectDetail> => {
  const { data: res } = await api.put<{
    success: boolean;
    data: ProjectDetail;
  }>(`/projects/${id}`, state);
  return res.data;
};

/** Xóa dự án */
export const deleteProject = async (id: string): Promise<void> => {
  await api.delete(`/projects/${id}`);
};

export default api;
