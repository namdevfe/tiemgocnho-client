"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getProjects,
  createProject,
  deleteProject,
  type ProjectListItem,
} from "@/lib/api";
import { useEditorStore } from "@/hooks/useEditorStore";

// Inline SVG icons (không cần react-icons dependency)
const IconFolder = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
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

const ProjectSelector = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(false);

  // Form tạo dự án
  const [newName, setNewName] = useState("");
  const [newCustomer, setNewCustomer] = useState("");
  const [newPhone, setNewPhone] = useState("");

  const {
    projectId,
    projectName,
    isDirty,
    isSaving,
    loadProject,
    resetEditor,
  } = useEditorStore();

  // Load danh sách dự án
  const handleLoadProjects = useCallback(async () => {
    setIsLoadingList(true);
    try {
      const list = await getProjects();
      setProjects(list);
    } catch (error) {
      console.error("Load danh sách dự án thất bại:", error);
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  // Mở dialog → load danh sách
  useEffect(() => {
    if (isOpen) {
      handleLoadProjects();
    }
  }, [isOpen, handleLoadProjects]);

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
      // Load ngay dự án vừa tạo
      await loadProject(project._id);
      setIsOpen(false);
      setNewName("");
      setNewCustomer("");
      setNewPhone("");
    } catch (error) {
      console.error("Tạo dự án thất bại:", error);
    } finally {
      setIsCreating(false);
    }
  }, [newName, newCustomer, newPhone, loadProject]);

  // Chọn dự án có sẵn
  const handleSelectProject = useCallback(
    async (id: string) => {
      await loadProject(id);
      setIsOpen(false);
    },
    [loadProject],
  );

  // Xóa dự án
  const handleDelete = useCallback(
    async (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!confirm("Bạn có chắc muốn xóa dự án này?")) return;

      try {
        await deleteProject(id);
        if (projectId === id) {
          resetEditor();
        }
        handleLoadProjects();
      } catch (error) {
        console.error("Xóa dự án thất bại:", error);
      }
    },
    [projectId, resetEditor, handleLoadProjects],
  );

  // Format thời gian
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Vừa xong";
    if (mins < 60) return `${mins} phút trước`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} giờ trước`;
    return date.toLocaleDateString("vi-VN");
  };

  // Handle keyboard cho Enter submit form
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && newName.trim()) {
        handleCreate();
      }
    },
    [handleCreate, newName],
  );

  return (
    <>
      {/* Nút mở dialog — hiển thị tên dự án hoặc "Chọn dự án" */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-sm"
        aria-label="Quản lý dự án"
      >
        <IconFolder className="w-4 h-4 text-brand-600" />
        <span className="font-medium text-gray-700 max-w-[180px] truncate">
          {projectName || "Chọn dự án"}
        </span>
        {/* Trạng thái lưu */}
        {projectId && (
          <span className="text-[10px] ml-1">
            {isSaving ? (
              <span className="text-amber-500">Đang lưu...</span>
            ) : isDirty ? (
              <span className="text-amber-500">●</span>
            ) : (
              <span className="text-green-500">✓</span>
            )}
          </span>
        )}
      </button>

      {/* Dialog overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setIsOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Quản lý dự án"
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <IconFolder className="w-5 h-5 text-brand-600" />
                Quản lý dự án
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded hover:bg-gray-100 transition-colors"
                aria-label="Đóng"
              >
                <IconX className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Form tạo mới */}
            <div className="px-6 py-4 bg-gray-50 border-b">
              <p className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wide">
                Tạo dự án mới
              </p>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Tên dự án *"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  autoFocus
                />
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <IconUser className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Tên khách hàng"
                      value={newCustomer}
                      onChange={(e) => setNewCustomer(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    />
                  </div>
                  <div className="relative flex-1">
                    <IconPhone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="SĐT"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <button
                  onClick={handleCreate}
                  disabled={!newName.trim() || isCreating}
                  className="w-full bg-brand-600 hover:bg-brand-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                  aria-label="Tạo dự án"
                >
                  <IconPlus className="w-4 h-4" />
                  {isCreating ? "Đang tạo..." : "Tạo dự án"}
                </button>
              </div>
            </div>

            {/* Danh sách dự án */}
            <div className="max-h-72 overflow-y-auto">
              {isLoadingList ? (
                <div className="p-6 text-center text-sm text-gray-400">
                  Đang tải...
                </div>
              ) : projects.length === 0 ? (
                <div className="p-6 text-center text-sm text-gray-400">
                  Chưa có dự án nào
                </div>
              ) : (
                <div className="divide-y">
                  {projects.map((p) => (
                    <button
                      key={p._id}
                      onClick={() => handleSelectProject(p._id)}
                      className={`w-full text-left px-6 py-3 hover:bg-gray-50 transition-colors flex items-center justify-between group ${
                        projectId === p._id ? "bg-brand-50" : ""
                      }`}
                      aria-label={`Mở dự án ${p.name}`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <IconFolder
                            className={`w-4 h-4 shrink-0 ${
                              projectId === p._id
                                ? "text-brand-600"
                                : "text-gray-400"
                            }`}
                          />
                          <span
                            className={`text-sm font-medium truncate ${
                              projectId === p._id
                                ? "text-brand-700"
                                : "text-gray-800"
                            }`}
                          >
                            {p.name}
                          </span>
                          {projectId === p._id && (
                            <span className="text-[10px] bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded-full font-medium">
                              Đang mở
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 ml-6 text-xs text-gray-400">
                          {p.customerName && (
                            <span className="flex items-center gap-1">
                              <IconUser className="w-3 h-3" />
                              {p.customerName}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <IconClock className="w-3 h-3" />
                            {formatTime(p.updatedAt)}
                          </span>
                        </div>
                      </div>

                      {/* Nút xóa */}
                      <button
                        onClick={(e) => handleDelete(p._id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-red-50 transition-all"
                        aria-label={`Xóa dự án ${p.name}`}
                      >
                        <IconTrash className="w-3.5 h-3.5 text-red-400 hover:text-red-600" />
                      </button>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProjectSelector;
