"use client";

import { useEditorStore } from "@/hooks/useEditorStore";
import { FrameSize } from "@/types/print";

/** Khung phổ biến */
const POPULAR_FRAMES: { size: FrameSize; label: string; iconClass: string }[] =
  [
    { size: "polaroid", label: "Polaroid cổ điển", iconClass: "w-6 h-4" },
    { size: "10x15", label: "Khung 10×15", iconClass: "w-5 h-7" },
    { size: "6x9", label: "Khung 6×9", iconClass: "w-5 h-5" },
  ];

const FrameSizeSelector = () => {
  const { layoutConfig, setFrameSize } = useEditorStore();

  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
        Khung phổ biến
      </h3>
      <div className="space-y-3">
        {POPULAR_FRAMES.map((frame) => (
          <button
            key={frame.size}
            onClick={() => setFrameSize(frame.size)}
            className={`w-full flex items-center gap-3 p-2 rounded-lg cursor-pointer border transition-all text-left ${
              layoutConfig.frameSize === frame.size
                ? "bg-brand-50 border-brand-300"
                : "border-transparent hover:bg-gray-50 hover:border-gray-200"
            }`}
            aria-label={`Chọn khung ${frame.label}`}
          >
            <div className="w-10 h-10 bg-white border border-gray-300 shadow-sm flex items-center justify-center rounded">
              <div className={`${frame.iconClass} bg-gray-200`} />
            </div>
            <span className="text-sm text-gray-700">{frame.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default FrameSizeSelector;
