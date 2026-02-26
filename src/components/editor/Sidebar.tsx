"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import { useEditorStore } from "@/hooks/useEditorStore";
import { uploadPhotos, getAssetUrl } from "@/lib/api";
import FrameSizeSelector from "./FrameSizeSelector";

const Sidebar = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const {
    assets,
    projectId,
    addAssets,
    removeAsset,
    activeTab,
    setActiveTab,
    loadAssets,
  } = useEditorStore();

  /** Load ảnh từ server khi component mount */
  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  /** Xử lý upload files */
  const handleUpload = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files).filter((f) =>
        f.type.startsWith("image/"),
      );
      if (fileArray.length === 0) return;
      setIsUploading(true);
      try {
        const uploadedAssets = await uploadPhotos(
          fileArray,
          projectId || undefined,
        );
        addAssets(uploadedAssets);
      } catch (error) {
        console.error("Upload thất bại:", error);
      } finally {
        setIsUploading(false);
      }
    },
    [addAssets, projectId],
  );

  /** Xử lý chọn file từ input */
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) handleUpload(e.target.files);
    },
    [handleUpload],
  );

  /** Xử lý xóa ảnh */
  const handleDeleteAsset = useCallback(
    (id: string) => {
      removeAsset(id);
    },
    [removeAsset],
  );

  // ===== File Drag & Drop (từ desktop vào sidebar) =====
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Chỉ highlight khi kéo file (không phải thumbnail nội bộ)
    if (e.dataTransfer.types.includes("Files")) {
      setIsDraggingOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  }, []);

  const handleFileDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingOver(false);

      // Xử lý file kéo từ desktop
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleUpload(e.dataTransfer.files);
      }
    },
    [handleUpload],
  );

  // ===== Thumbnail Drag (kéo thumbnail vào canvas) =====
  const handleThumbnailDragStart = useCallback(
    (e: React.DragEvent, assetId: string) => {
      e.dataTransfer.setData("application/x-asset-id", assetId);
      e.dataTransfer.effectAllowed = "copyMove";
    },
    [],
  );

  return (
    <aside
      className={`w-72 bg-white border-r flex flex-col shrink-0 transition-colors ${
        isDraggingOver ? "bg-brand-50 border-brand-300" : ""
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleFileDrop}
    >
      {/* Nút Upload */}
      <div className="p-4 border-b">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className={`w-full py-3 px-4 border-2 border-dashed rounded-xl font-medium flex items-center justify-center gap-2 transition-colors ${
            isDraggingOver
              ? "bg-brand-100 text-brand-700 border-brand-500 scale-[1.02]"
              : "bg-brand-50 text-brand-700 border-brand-300 hover:bg-brand-100"
          }`}
          aria-label="Tải ảnh lên"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M12 4v16m8-8H4"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
          </svg>
          {isUploading
            ? "Đang tải..."
            : isDraggingOver
              ? "Thả ảnh vào đây!"
              : "Tải ảnh lên"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/tiff"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          aria-label="Chọn file ảnh"
        />
      </div>

      {/* Tabs */}
      <nav className="flex border-b text-sm font-medium">
        <button
          onClick={() => setActiveTab("uploads")}
          className={`flex-1 py-3 border-b-2 ${
            activeTab === "uploads"
              ? "border-brand-600 text-brand-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
          aria-label="Tab ảnh đã tải"
        >
          Ảnh đã tải
        </button>
        <button
          onClick={() => setActiveTab("frames")}
          className={`flex-1 py-3 border-b-2 ${
            activeTab === "frames"
              ? "border-brand-600 text-brand-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
          aria-label="Tab khung ảnh"
        >
          Khung ảnh
        </button>
      </nav>

      {/* Nội dung tab */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "uploads" ? (
          <>
            {/* Thumbnail Grid — mỗi thumbnail có draggable */}
            {assets.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {assets.map((asset) => (
                  <div
                    key={asset._id}
                    draggable
                    onDragStart={(e) => handleThumbnailDragStart(e, asset._id)}
                    className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-grab active:cursor-grabbing border-2 border-transparent hover:border-brand-500 transition-all group relative"
                  >
                    <img
                      src={getAssetUrl(asset.fileName, asset._id)}
                      alt={asset.originalName}
                      className="w-full h-full object-cover opacity-80 hover:opacity-100 pointer-events-none"
                    />
                    {/* Nút xóa */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAsset(asset._id);
                      }}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                      aria-label={`Xóa ảnh ${asset.originalName}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Khu vực trống nếu chưa có ảnh */}
            {assets.length === 0 && (
              <div
                className={`flex flex-col items-center justify-center py-12 text-center cursor-pointer border-2 border-dashed rounded-xl transition-colors ${
                  isDraggingOver
                    ? "border-brand-500 bg-brand-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ")
                    fileInputRef.current?.click();
                }}
                tabIndex={0}
                role="button"
                aria-label="Nhấn hoặc kéo thả để upload ảnh"
              >
                <svg
                  className="w-8 h-8 text-gray-300 mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                  />
                </svg>
                <p className="text-sm text-gray-400">Kéo thả ảnh vào đây</p>
                <p className="text-xs text-gray-300 mt-1">
                  hoặc nhấn để chọn file
                </p>
              </div>
            )}

            {/* Khung phổ biến */}
            <div className="mt-8">
              <FrameSizeSelector />
            </div>
          </>
        ) : (
          <FrameSizeSelector />
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
