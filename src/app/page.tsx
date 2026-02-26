"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  getProjects,
  createProject,
  deleteProject,
  type ProjectListItem,
} from "@/lib/api";

// ===== Inline SVG Icons =====
const IconFolder = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    viewBox="0 0 24 24"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
  </svg>
);

const IconFolderFilled = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M10 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V8a2 2 0 00-2-2h-8l-2-2z" />
  </svg>
);

const IconPlus = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IconX = ({ className = "" }: { className?: string }) => (
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

const IconGrid = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
  </svg>
);

const IconList = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" />
    <line x1="3" y1="12" x2="3.01" y2="12" />
    <line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
);

const IconTrash = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
  </svg>
);

const IconUser = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const IconPhone = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
  </svg>
);

const IconClock = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

// ===== Helpers =====
const formatTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;
  return date.toLocaleDateString("vi-VN");
};

const statusLabels: Record<string, { text: string; color: string }> = {
  draft: { text: "Nháp", color: "bg-gray-100 text-gray-600" },
  printing: { text: "Đang in", color: "bg-blue-100 text-blue-700" },
  completed: { text: "Hoàn thành", color: "bg-green-100 text-green-700" },
};

// ===== Main Page =====
const ProjectsPage = () => {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form tạo dự án
  const [newName, setNewName] = useState("");
  const [newCustomer, setNewCustomer] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Load danh sách
  const handleLoadProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await getProjects();
      setProjects(list);
    } catch (error) {
      console.error("Load danh sách dự án thất bại:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    handleLoadProjects();
  }, [handleLoadProjects]);

  // Tạo dự án mới
  const handleCreate = useCallback(async () => {
    if (!newName.trim()) return;
    setIsCreating(true);
    try {
      const project = await createProject({
        name: newName.trim(),
        customerName: newCustomer.trim() || undefined,
        customerPhone: newPhone.trim() || undefined,
      });
      // Navigate thẳng vào editor
      router.push(`/editor/${project._id}`);
    } catch (error) {
      console.error("Tạo dự án thất bại:", error);
    } finally {
      setIsCreating(false);
    }
  }, [newName, newCustomer, newPhone, router]);

  // Xóa dự án
  const handleDelete = useCallback(async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Bạn có chắc muốn xóa dự án này?")) return;
    try {
      await deleteProject(id);
      setProjects((prev) => prev.filter((p) => p._id !== id));
    } catch (error) {
      console.error("Xóa dự án thất bại:", error);
    }
  }, []);

  // Mở dự án
  const handleOpenProject = useCallback(
    (id: string) => {
      router.push(`/editor/${id}`);
    },
    [router],
  );

  // Enter submit
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && newName.trim()) handleCreate();
    },
    [handleCreate, newName],
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <svg
                className="w-5 h-5 text-white"
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
            <h1 className="text-xl font-bold text-gray-800">
              In Ảnh <span className="text-indigo-600">Pro</span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Toggle Grid / List */}
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-white shadow-sm text-indigo-600" : "text-gray-400 hover:text-gray-600"}`}
                aria-label="Xem dạng lưới"
              >
                <IconGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-white shadow-sm text-indigo-600" : "text-gray-400 hover:text-gray-600"}`}
                aria-label="Xem dạng danh sách"
              >
                <IconList className="w-4 h-4" />
              </button>
            </div>

            {/* Nút tạo mới */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm"
              aria-label="Tạo dự án mới"
            >
              <IconPlus className="w-4 h-4" />
              Tạo dự án mới
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-700">Dự án của tôi</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {projects.length} dự án
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-gray-400 animate-pulse">Đang tải...</div>
          </div>
        ) : projects.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-20">
            <IconFolder className="w-20 h-20 text-gray-200 mb-4" />
            <h3 className="text-lg font-medium text-gray-500 mb-1">
              Chưa có dự án nào
            </h3>
            <p className="text-sm text-gray-400 mb-6">
              Tạo dự án mới để bắt đầu in ảnh
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors"
              aria-label="Tạo dự án đầu tiên"
            >
              <IconPlus className="w-4 h-4" />
              Tạo dự án đầu tiên
            </button>
          </div>
        ) : viewMode === "grid" ? (
          /* ===== Grid View ===== */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {projects.map((p) => (
              <div
                key={p._id}
                onClick={() => handleOpenProject(p._id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ")
                    handleOpenProject(p._id);
                }}
                role="button"
                tabIndex={0}
                className="group bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg hover:border-indigo-200 transition-all text-left relative cursor-pointer"
                aria-label={`Mở dự án ${p.name}`}
              >
                {/* Nút xóa */}
                <button
                  onClick={(e) => handleDelete(p._id, e)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-white shadow-sm hover:bg-red-50 transition-all z-10"
                  aria-label={`Xóa dự án ${p.name}`}
                >
                  <IconTrash className="w-3.5 h-3.5 text-red-400" />
                </button>

                {/* Icon folder */}
                <div className="flex justify-center mb-3 pt-2">
                  <IconFolderFilled className="w-16 h-16 text-indigo-400 group-hover:text-indigo-500 transition-colors drop-shadow-sm" />
                </div>

                {/* Tên dự án */}
                <p
                  className="text-sm font-medium text-gray-800 truncate"
                  title={p.name}
                >
                  {p.name}
                </p>

                {/* Thông tin phụ */}
                <div className="mt-1.5 space-y-0.5">
                  {p.customerName && (
                    <p className="text-xs text-gray-400 truncate flex items-center gap-1">
                      <IconUser className="w-3 h-3 shrink-0" />
                      {p.customerName}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <IconClock className="w-3 h-3 shrink-0" />
                    {formatTime(p.updatedAt)}
                  </p>
                </div>

                {/* Badge trạng thái */}
                <div className="mt-2">
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${statusLabels[p.status]?.color || ""}`}
                  >
                    {statusLabels[p.status]?.text || p.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* ===== List View ===== */
          <div className="bg-white rounded-xl border border-gray-200 divide-y overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide bg-gray-50">
              <div className="col-span-5">Tên dự án</div>
              <div className="col-span-2">Khách hàng</div>
              <div className="col-span-2">Trạng thái</div>
              <div className="col-span-2">Cập nhật</div>
              <div className="col-span-1"></div>
            </div>

            {projects.map((p) => (
              <div
                key={p._id}
                onClick={() => handleOpenProject(p._id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ")
                    handleOpenProject(p._id);
                }}
                role="button"
                tabIndex={0}
                className="grid grid-cols-12 gap-4 px-6 py-3.5 hover:bg-gray-50 transition-colors w-full text-left group items-center cursor-pointer"
                aria-label={`Mở dự án ${p.name}`}
              >
                <div className="col-span-5 flex items-center gap-3 min-w-0">
                  <IconFolderFilled className="w-8 h-8 text-indigo-400 shrink-0" />
                  <span className="text-sm font-medium text-gray-800 truncate">
                    {p.name}
                  </span>
                </div>
                <div className="col-span-2 text-sm text-gray-500 truncate">
                  {p.customerName || "—"}
                </div>
                <div className="col-span-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusLabels[p.status]?.color || ""}`}
                  >
                    {statusLabels[p.status]?.text || p.status}
                  </span>
                </div>
                <div className="col-span-2 text-sm text-gray-400">
                  {formatTime(p.updatedAt)}
                </div>
                <div className="col-span-1 flex justify-end">
                  <button
                    onClick={(e) => handleDelete(p._id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 transition-all"
                    aria-label={`Xóa dự án ${p.name}`}
                  >
                    <IconTrash className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ===== Modal tạo dự án mới ===== */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowCreateModal(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Tạo dự án mới"
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b">
              <h2 className="text-lg font-bold text-gray-800">Tạo dự án mới</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Đóng"
              >
                <IconX className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Tên dự án <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="VD: In ảnh cưới Minh & Lan"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Khách hàng
                  </label>
                  <div className="relative">
                    <IconUser className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Tên khách"
                      value={newCustomer}
                      onChange={(e) => setNewCustomer(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Số điện thoại
                  </label>
                  <div className="relative">
                    <IconPhone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="SĐT"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-200 transition-colors"
                aria-label="Hủy"
              >
                Hủy
              </button>
              <button
                onClick={handleCreate}
                disabled={!newName.trim() || isCreating}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors"
                aria-label="Tạo dự án"
              >
                <IconPlus className="w-4 h-4" />
                {isCreating ? "Đang tạo..." : "Tạo dự án"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
