"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Sidebar from "@/components/editor/Sidebar";
import ConfigPanel from "@/components/editor/ConfigPanel";
import { useEditorStore } from "@/hooks/useEditorStore";
import { useCallback } from "react";

// Dynamic import Canvas (tránh SSR)
const EditorCanvas = dynamic(() => import("@/components/editor/Canvas"), {
  ssr: false,
  loading: () => (
    <section className="flex-1 flex items-center justify-center canvas-grid">
      <div className="text-gray-400 animate-pulse text-sm">
        Đang tải Canvas...
      </div>
    </section>
  ),
});

// Inline SVG icon
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
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const EditorPage = () => {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const {
    assets,
    pages,
    projectName,
    projectId: storeProjectId,
    isDirty,
    isSaving,
  } = useEditorStore();

  // Load dự án khi mount hoặc đổi projectId
  useEffect(() => {
    if (projectId) {
      useEditorStore.getState().loadProject(projectId);
    }
    // Cleanup khi unmount hoặc đổi project
    return () => {
      useEditorStore.getState().resetEditor();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  /** Quay lại danh sách */
  const handleBack = useCallback(() => {
    router.push("/");
  }, [router]);

  // Chỉ loading khi project chưa load xong (store chưa match URL)
  if (!storeProjectId || storeProjectId !== projectId) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Đang tải dự án...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-workspace font-sans text-gray-900">
      {/* ===== Header ===== */}
      <header className="flex h-14 items-center justify-between border-b bg-white px-4 shrink-0 z-20">
        <div className="flex items-center gap-3">
          {/* Nút quay lại */}
          <button
            onClick={handleBack}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Quay lại danh sách dự án"
          >
            <IconArrowLeft className="w-5 h-5 text-gray-500" />
          </button>

          <div className="h-6 w-px bg-gray-200" />

          {/* Logo */}
          <div className="bg-indigo-600 p-1.5 rounded-lg">
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
          </div>

          {/* Tên dự án + trạng thái lưu */}
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold text-gray-800 max-w-[250px] truncate">
              {projectName || "Dự án"}
            </h1>
            <span className="text-[10px]">
              {isSaving ? (
                <span className="text-amber-500 font-medium">Đang lưu...</span>
              ) : isDirty ? (
                <span className="text-amber-500">●</span>
              ) : (
                <span className="text-green-500">✓ Đã lưu</span>
              )}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Thống kê */}
          <div className="hidden md:flex items-center gap-3 text-xs text-gray-500">
            <span>{assets.length} ảnh</span>
            <span className="text-gray-300">•</span>
            <span>{pages.length} trang</span>
          </div>

          {/* Nút xem trước bản in */}
          <button
            onClick={() => router.push(`/preview/${projectId}`)}
            disabled={pages.length === 0}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm"
            aria-label="Xem trước bản in"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            Xem trước & In
          </button>
        </div>
      </header>

      {/* ===== Main Content ===== */}
      <main className="flex flex-1 overflow-hidden">
        <Sidebar />
        <EditorCanvas />
        <ConfigPanel />
      </main>
    </div>
  );
};

export default EditorPage;
