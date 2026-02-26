"use client";

import { useEditorStore } from "@/hooks/useEditorStore";
import { Ruler, Shield, Scissors } from "lucide-react";

const BleedControl = () => {
  const {
    layoutConfig,
    setBleed,
    setPadding,
    toggleCropMarks,
    toggleSafeZone,
  } = useEditorStore();

  return (
    <div className="space-y-4">
      {/* Bleed slider */}
      <div className="space-y-2">
        <label className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-medium text-slate-300">
            <Scissors className="w-4 h-4 text-rose-400" />
            Lề cắt (Bleed)
          </span>
          <span className="text-xs font-mono text-slate-400">
            {layoutConfig.bleed} mm
          </span>
        </label>
        <input
          type="range"
          min={0}
          max={10}
          step={0.5}
          value={layoutConfig.bleed}
          onChange={(e) => setBleed(parseFloat(e.target.value))}
          className="w-full h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer accent-rose-500 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-rose-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-rose-500/30"
          aria-label="Điều chỉnh lề cắt"
        />
      </div>

      {/* Padding slider */}
      <div className="space-y-2">
        <label className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-medium text-slate-300">
            <Ruler className="w-4 h-4 text-amber-400" />
            Khoảng cách (Padding)
          </span>
          <span className="text-xs font-mono text-slate-400">
            {layoutConfig.padding} mm
          </span>
        </label>
        <input
          type="range"
          min={0}
          max={15}
          step={0.5}
          value={layoutConfig.padding}
          onChange={(e) => setPadding(parseFloat(e.target.value))}
          className="w-full h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer accent-amber-500 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-amber-500/30"
          aria-label="Điều chỉnh khoảng cách"
        />
      </div>

      {/* Toggles */}
      <div className="space-y-2 pt-2 border-t border-slate-700/50">
        <label className="flex items-center justify-between cursor-pointer group">
          <span className="flex items-center gap-2 text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
            <Scissors className="w-3.5 h-3.5" />
            Đường cắt (Crop Marks)
          </span>
          <button
            onClick={toggleCropMarks}
            role="switch"
            aria-checked={layoutConfig.showCropMarks}
            aria-label="Bật/tắt đường cắt"
            tabIndex={0}
            className={`relative w-10 h-5 rounded-full transition-colors ${
              layoutConfig.showCropMarks ? "bg-rose-500" : "bg-slate-600"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                layoutConfig.showCropMarks ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </label>

        <label className="flex items-center justify-between cursor-pointer group">
          <span className="flex items-center gap-2 text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
            <Shield className="w-3.5 h-3.5" />
            Vùng an toàn (Safe Zone)
          </span>
          <button
            onClick={toggleSafeZone}
            role="switch"
            aria-checked={layoutConfig.showSafeZone}
            aria-label="Bật/tắt vùng an toàn"
            tabIndex={0}
            className={`relative w-10 h-5 rounded-full transition-colors ${
              layoutConfig.showSafeZone ? "bg-cyan-500" : "bg-slate-600"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                layoutConfig.showSafeZone ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </label>
      </div>
    </div>
  );
};

export default BleedControl;
