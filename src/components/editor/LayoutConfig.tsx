"use client";

import { useEditorStore } from "@/hooks/useEditorStore";
import { LayoutGrid } from "lucide-react";

const LayoutConfig = () => {
  const { layoutConfig, nestingResult } = useEditorStore();

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
        <LayoutGrid className="w-4 h-4 text-emerald-400" />
        Layout
      </label>

      <div className="grid grid-cols-2 gap-3">
        {/* Số hàng */}
        <div className="space-y-1">
          <span className="text-xs text-slate-500">Hàng</span>
          <div className="px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700 text-sm text-slate-300 text-center">
            {layoutConfig.rows}
          </div>
        </div>

        {/* Số cột */}
        <div className="space-y-1">
          <span className="text-xs text-slate-500">Cột</span>
          <div className="px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700 text-sm text-slate-300 text-center">
            {layoutConfig.cols}
          </div>
        </div>
      </div>

      {/* Thống kê */}
      {nestingResult && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Ảnh/trang:</span>
            <span className="text-emerald-400 font-medium">
              {nestingResult.maxPhotosPerPage}
            </span>
          </div>
          <div className="flex justify-between text-xs mt-1">
            <span className="text-slate-400">Tổng trang:</span>
            <span className="text-emerald-400 font-medium">
              {nestingResult.totalPages}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LayoutConfig;
