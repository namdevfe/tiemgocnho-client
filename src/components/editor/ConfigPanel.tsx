"use client";

import { useEditorStore } from "@/hooks/useEditorStore";
import {
  FRAME_DIMENSIONS,
  getPaperDimensions,
  calculateMaxGrid,
} from "@/types/print";

/**
 * ConfigPanel (Right Sidebar) - w-80
 * Cấu hình: Khổ giấy, Lưới bố cục, Cài đặt, Đường cắt
 */
const ConfigPanel = () => {
  const {
    layoutConfig,
    orientation,
    setPaperSize,
    setOrientation,
    setRows,
    setCols,
    setGutter,
    setBleed,
    toggleSafeZone,
    toggleCropMarks,
  } = useEditorStore();

  // Helper types cho select
  type PaperSizeOption = import("@/types/print").PaperSize;

  const paperDim = getPaperDimensions(layoutConfig.paperSize, orientation);
  const frameDim = FRAME_DIMENSIONS[layoutConfig.frameSize];
  const { maxCols, maxRows } = calculateMaxGrid(
    paperDim.width,
    paperDim.height,
    frameDim.width,
    frameDim.height,
    layoutConfig.padding,
    layoutConfig.bleed,
  );

  return (
    <aside className="w-80 bg-white border-l flex flex-col shrink-0 overflow-y-auto">
      <div className="p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Cấu hình</h2>

        {/* Section 1: Khổ giấy */}
        <section className="mb-8">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Khổ giấy
          </label>
          <div className="space-y-4">
            <select
              className="w-full rounded-lg border-gray-200 text-sm focus:border-brand-500 focus:ring-brand-500 py-2.5 px-3 border"
              value={layoutConfig.paperSize}
              onChange={(e) => setPaperSize(e.target.value as PaperSizeOption)}
              aria-label="Chọn khổ giấy"
            >
              <option value="a4">Giấy A4 (210 x 297mm)</option>
              <option value="a3">Giấy A3 (297 x 420mm)</option>
              <option value="letter">Letter (8.5 x 11in)</option>
            </select>

            {/* Dọc / Ngang */}
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setOrientation("portrait")}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
                  orientation === "portrait"
                    ? "bg-white shadow-sm text-gray-900"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                aria-label="Hướng dọc"
              >
                Dọc
              </button>
              <button
                onClick={() => setOrientation("landscape")}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
                  orientation === "landscape"
                    ? "bg-white shadow-sm text-gray-900"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                aria-label="Hướng ngang"
              >
                Ngang
              </button>
            </div>
          </div>
        </section>

        {/* Section 2: Lưới bố cục */}
        <section className="mb-8">
          <label className="block text-sm font-semibold text-brand-600 mb-3">
            Lưới bố cục
          </label>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <span className="text-[10px] uppercase text-gray-400 block mb-1">
                Hàng
              </span>
              <input
                type="number"
                min={1}
                max={maxRows}
                value={layoutConfig.rows}
                onChange={(e) => setRows(parseInt(e.target.value) || 1)}
                className="w-full rounded-lg border-gray-200 text-sm py-2 px-3 border focus:border-brand-500 focus:ring-brand-500 focus:outline-none"
                aria-label="Số hàng"
              />
            </div>
            <div>
              <span className="text-[10px] uppercase text-gray-400 block mb-1">
                Cột
              </span>
              <input
                type="number"
                min={1}
                max={maxCols}
                value={layoutConfig.cols}
                onChange={(e) => setCols(parseInt(e.target.value) || 1)}
                className="w-full rounded-lg border-gray-200 text-sm py-2 px-3 border focus:border-brand-500 focus:ring-brand-500 focus:outline-none"
                aria-label="Số cột"
              />
            </div>
          </div>

          {/* Khoảng cách slider */}
          <div>
            <span className="text-[10px] uppercase text-gray-400 block mb-1">
              Khoảng cách (mm)
            </span>
            <input
              type="range"
              min={0}
              max={20}
              step={1}
              value={layoutConfig.padding}
              onChange={(e) => setGutter(parseFloat(e.target.value))}
              className="w-full accent-brand-600"
              aria-label="Khoảng cách giữa các ảnh"
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
              <span>0mm</span>
              <span>20mm</span>
            </div>
          </div>
        </section>

        {/* Section 3: Cài đặt */}
        <section className="mb-8">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Cài đặt
          </label>
          <div className="space-y-4">
            {/* Vùng an toàn toggle */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                Vùng an toàn (Bleed)
              </span>
              <button
                onClick={toggleSafeZone}
                role="switch"
                aria-checked={layoutConfig.showSafeZone}
                aria-label="Bật/tắt vùng an toàn"
                className={`w-10 h-5 rounded-full relative transition-colors ${
                  layoutConfig.showSafeZone ? "bg-brand-600" : "bg-gray-300"
                }`}
              >
                <div
                  className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${
                    layoutConfig.showSafeZone ? "right-0.5" : "left-0.5"
                  }`}
                />
              </button>
            </div>

            {/* Lề trong slider */}
            <div>
              <span className="text-[10px] uppercase text-gray-400 block mb-1">
                Lề trong
              </span>
              <input
                type="range"
                min={0}
                max={50}
                step={1}
                value={layoutConfig.bleed}
                onChange={(e) => setBleed(parseFloat(e.target.value))}
                className="w-full accent-brand-600"
                aria-label="Lề trong an toàn"
              />
            </div>
          </div>
        </section>

        {/* Section 4: Đường cắt */}
        <section>
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={layoutConfig.showCropMarks}
                onChange={toggleCropMarks}
                className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Hiển thị đường cắt
              </span>
            </label>
            <p className="mt-2 text-xs text-gray-400">
              Thêm dấu cắt nhỏ ở các góc để cắt chuyên nghiệp.
            </p>
          </div>
        </section>
      </div>
    </aside>
  );
};

export default ConfigPanel;
