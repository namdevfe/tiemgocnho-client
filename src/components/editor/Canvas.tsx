"use client";

import { useEffect, useRef, useCallback, useState, useMemo } from "react";
import {
  Canvas as FabricCanvas,
  Rect,
  Line,
  FabricImage,
  FabricText,
} from "fabric";
import { useEditorStore } from "@/hooks/useEditorStore";
import { A4_WIDTH_MM, A4_HEIGHT_MM, FRAME_DIMENSIONS } from "@/types/print";
import { getAssetUrl, uploadPhotos } from "@/lib/api";

/** Tỉ lệ scale: 1mm → pixel trên canvas preview */
const SCALE = 2;
const CANVAS_WIDTH = A4_WIDTH_MM * SCALE; // 420
const CANVAS_HEIGHT = A4_HEIGHT_MM * SCALE; // 594

const EditorCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<FabricCanvas | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [hoverSlotIdx, setHoverSlotIdx] = useState<number | null>(null);

  const { pages, currentPage, layoutConfig, assets, addAssets } =
    useEditorStore();

  // ===== Helper: tính slot index từ tọa độ pixel trên canvas =====
  const getSlotFromPosition = useCallback(
    (pixelX: number, pixelY: number): number | null => {
      const { rows, cols, frameSize, bleed, padding } = layoutConfig;
      const frame = FRAME_DIMENSIONS[frameSize];
      const slotW = frame.width * SCALE;
      const slotH = frame.height * SCALE;

      for (let slotIdx = 0; slotIdx < rows * cols; slotIdx++) {
        const col = slotIdx % cols;
        const row = Math.floor(slotIdx / cols);
        const x = (bleed + col * (frame.width + padding)) * SCALE;
        const y = (bleed + row * (frame.height + padding)) * SCALE;

        if (
          pixelX >= x &&
          pixelX <= x + slotW &&
          pixelY >= y &&
          pixelY <= y + slotH
        ) {
          return slotIdx;
        }
      }
      return null;
    },
    [layoutConfig],
  );

  // ===== Helper: lấy tọa độ pixel trên canvas từ mouse event =====
  const getCanvasCoords = useCallback(
    (e: React.DragEvent): { x: number; y: number } | null => {
      if (!canvasContainerRef.current) return null;
      const rect = canvasContainerRef.current.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    },
    [],
  );

  /** Vẽ Crop Marks ở 4 góc */
  const drawCropMarks = useCallback(
    (canvas: FabricCanvas, x: number, y: number, w: number, h: number) => {
      const markLen = 8;
      const gap = 2;
      const lineProps = {
        stroke: "#000000",
        strokeWidth: 0.5,
        selectable: false,
        evented: false,
      };

      const marks: [number, number, number, number][] = [
        [Math.max(0, x - gap - markLen), y, x - gap, y],
        [x, Math.max(0, y - gap - markLen), x, y - gap],
        [x + w + gap, y, Math.min(CANVAS_WIDTH, x + w + gap + markLen), y],
        [x + w, Math.max(0, y - gap - markLen), x + w, y - gap],
        [Math.max(0, x - gap - markLen), y + h, x - gap, y + h],
        [x, y + h + gap, x, Math.min(CANVAS_HEIGHT, y + h + gap + markLen)],
        [
          x + w + gap,
          y + h,
          Math.min(CANVAS_WIDTH, x + w + gap + markLen),
          y + h,
        ],
        [
          x + w,
          y + h + gap,
          x + w,
          Math.min(CANVAS_HEIGHT, y + h + gap + markLen),
        ],
      ];

      for (const [x1, y1, x2, y2] of marks) {
        canvas.add(new Line([x1, y1, x2, y2], lineProps));
      }
    },
    [],
  );

  /** Render toàn bộ canvas */
  const renderCanvas = useCallback(async () => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    canvas.clear();
    canvas.backgroundColor = "#ffffff";

    const {
      bleed,
      padding,
      rows,
      cols,
      frameSize,
      showCropMarks,
      showSafeZone,
    } = layoutConfig;
    const frame = FRAME_DIMENSIONS[frameSize];
    const totalSlots = rows * cols;

    // Tính kích thước canvas thực tế dựa trên grid (không cố định A4)
    const contentW = cols * frame.width + (cols - 1) * padding + 2 * bleed;
    const contentH = rows * frame.height + (rows - 1) * padding + 2 * bleed;

    // Giới hạn: không nhỏ hơn A4 để có đủ không gian hiển thị
    const canvasW = Math.max(A4_WIDTH_MM, contentW) * SCALE;
    const canvasH = Math.max(A4_HEIGHT_MM, contentH) * SCALE;

    // Resize canvas cho vừa nội dung
    canvas.setDimensions({ width: canvasW, height: canvasH });

    // Cập nhật container wrapper để khớp
    if (canvasContainerRef.current) {
      canvasContainerRef.current.style.width = `${canvasW}px`;
      canvasContainerRef.current.style.height = `${canvasH}px`;
    }

    const bleedPx = bleed * SCALE;
    const slotW = frame.width * SCALE;
    const slotH = frame.height * SCALE;

    // Grid nền căn chỉnh
    const cellW = canvasW / cols;
    const cellH = canvasH / rows;

    for (let i = 1; i < cols; i++) {
      canvas.add(
        new Line([cellW * i, 0, cellW * i, canvasH], {
          stroke: "#eeeeee",
          strokeWidth: 0.5,
          selectable: false,
          evented: false,
        }),
      );
    }
    for (let j = 1; j < rows; j++) {
      canvas.add(
        new Line([0, cellH * j, canvasW, cellH * j], {
          stroke: "#eeeeee",
          strokeWidth: 0.5,
          selectable: false,
          evented: false,
        }),
      );
    }

    // Vùng safe zone viền dashed
    if (showSafeZone && bleedPx > 0) {
      canvas.add(
        new Rect({
          left: bleedPx,
          top: bleedPx,
          width: canvasW - 2 * bleedPx,
          height: canvasH - 2 * bleedPx,
          fill: "transparent",
          stroke: "#818cf8",
          strokeWidth: 0.8,
          strokeDashArray: [6, 4],
          selectable: false,
          evented: false,
        }),
      );
    }

    const page = pages[currentPage];
    const selectedAssetId = useEditorStore.getState().selectedAssetId;

    // Vẽ tất cả slot (không skip overflow)
    for (let slotIdx = 0; slotIdx < totalSlots; slotIdx++) {
      const col = slotIdx % cols;
      const row = Math.floor(slotIdx / cols);
      const x = (bleed + col * (frame.width + padding)) * SCALE;
      const y = (bleed + row * (frame.height + padding)) * SCALE;

      const placement = page?.placements[slotIdx];
      const asset = placement
        ? assets.find((a) => a._id === placement.assetId)
        : null;

      // Hover highlight giờ render qua HTML overlay, không trong canvas

      if (asset) {
        // Slot có ảnh
        canvas.add(
          new Rect({
            left: x,
            top: y,
            width: slotW,
            height: slotH,
            fill: "#f9fafb",
            stroke: "#e5e7eb",
            strokeWidth: 0.5,
            selectable: false,
            evented: false,
          }),
        );

        try {
          const imgUrl = getAssetUrl(asset.fileName, asset._id);
          const img = await FabricImage.fromURL(imgUrl, {
            crossOrigin: "anonymous",
          });

          const imgW = img.width || 1;
          const imgH = img.height || 1;
          const scaleX = slotW / imgW;
          const scaleY = slotH / imgH;
          const scale = Math.max(scaleX, scaleY);

          const scaledW = imgW * scale;
          const scaledH = imgH * scale;
          const offsetX = (scaledW - slotW) / 2;
          const offsetY = (scaledH - slotH) / 2;

          img.set({
            left: x - offsetX,
            top: y - offsetY,
            scaleX: scale,
            scaleY: scale,
            selectable: false,
            evented: false,
            clipPath: new Rect({
              left: x,
              top: y,
              width: slotW,
              height: slotH,
              absolutePositioned: true,
            }),
          });
          canvas.add(img);

          // Highlight khi chọn
          if (asset._id === selectedAssetId) {
            canvas.add(
              new Rect({
                left: x - 3,
                top: y - 3,
                width: slotW + 6,
                height: slotH + 6,
                fill: "transparent",
                stroke: "rgba(99, 102, 241, 0.15)",
                strokeWidth: 4,
                selectable: false,
                evented: false,
              }),
            );
            canvas.add(
              new Rect({
                left: x - 1,
                top: y - 1,
                width: slotW + 2,
                height: slotH + 2,
                fill: "transparent",
                stroke: "#6366f1",
                strokeWidth: 2,
                selectable: false,
                evented: false,
              }),
            );

            const hs = 6;
            const hp = {
              width: hs,
              height: hs,
              fill: "#fff",
              stroke: "#4f46e5",
              strokeWidth: 2,
              rx: hs,
              ry: hs,
              selectable: false,
              evented: false,
            };
            for (const pos of [
              { left: x - hs / 2, top: y - hs / 2 },
              { left: x + slotW - hs / 2, top: y - hs / 2 },
              { left: x - hs / 2, top: y + slotH - hs / 2 },
              { left: x + slotW - hs / 2, top: y + slotH - hs / 2 },
            ]) {
              canvas.add(new Rect({ ...hp, ...pos }));
            }
          }
        } catch {
          canvas.add(
            new FabricText("⚠", {
              left: x + slotW / 2,
              top: y + slotH / 2,
              fontSize: 18,
              fill: "#d1d5db",
              originX: "center",
              originY: "center",
              selectable: false,
              evented: false,
            }),
          );
        }
      } else {
        // Slot trống — highlight nếu đang hover
        canvas.add(
          new Rect({
            left: x,
            top: y,
            width: slotW,
            height: slotH,
            fill: "#f9fafb",
            stroke: "#d1d5db",
            strokeWidth: 0.8,
            strokeDashArray: [5, 4],
            selectable: false,
            evented: false,
          }),
        );
        canvas.add(
          new FabricText("Kéo ảnh vào đây", {
            left: x + slotW / 2,
            top: y + slotH / 2,
            fontSize: 9,
            fill: "#9ca3af",
            fontFamily: "Inter, system-ui, sans-serif",
            originX: "center",
            originY: "center",
            selectable: false,
            evented: false,
          }),
        );
      }

      if (showCropMarks) drawCropMarks(canvas, x, y, slotW, slotH);
    }

    // Guide text khi chưa có ảnh nào trên trang
    if (!page || page.placements.length === 0) {
      canvas.add(
        new FabricText("Kéo ảnh từ sidebar thả vào ô", {
          left: CANVAS_WIDTH / 2,
          top: CANVAS_HEIGHT / 2,
          fontSize: 14,
          fill: "#9ca3af",
          fontFamily: "Inter, system-ui, sans-serif",
          originX: "center",
          originY: "center",
          selectable: false,
          evented: false,
        }),
      );
    }

    canvas.renderAll();
  }, [pages, currentPage, layoutConfig, assets, drawCropMarks]);

  // ===== Tính vị trí slot cho hover overlay (không trigger re-render canvas) =====
  const slotPositions = useMemo(() => {
    const { rows, cols, frameSize, bleed, padding } = layoutConfig;
    const frame = FRAME_DIMENSIONS[frameSize];
    const positions: { x: number; y: number; w: number; h: number }[] = [];
    for (let slotIdx = 0; slotIdx < rows * cols; slotIdx++) {
      const col = slotIdx % cols;
      const row = Math.floor(slotIdx / cols);
      positions.push({
        x: (bleed + col * (frame.width + padding)) * SCALE,
        y: (bleed + row * (frame.height + padding)) * SCALE,
        w: frame.width * SCALE,
        h: frame.height * SCALE,
      });
    }
    return positions;
  }, [layoutConfig]);

  // ===== Drag & Drop handlers =====

  /** DragOver — xác định slot đang hover để highlight */
  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = "copy";
      setIsDragOver(true);

      // Tính slot đang hover
      const coords = getCanvasCoords(e);
      if (coords) {
        const slot = getSlotFromPosition(coords.x, coords.y);
        setHoverSlotIdx(slot);
      }
    },
    [getCanvasCoords, getSlotFromPosition],
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setHoverSlotIdx(null);
  }, []);

  /** Drop — đặt ảnh vào đúng slot */
  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      setHoverSlotIdx(null);

      // Trường hợp 1: Kéo thumbnail từ sidebar → đặt vào slot
      const assetId = e.dataTransfer.getData("application/x-asset-id");
      if (assetId) {
        const coords = getCanvasCoords(e);
        if (!coords) return;

        const slotIdx = getSlotFromPosition(coords.x, coords.y);
        if (slotIdx !== null) {
          useEditorStore
            .getState()
            .placeAssetInSlot(currentPage, slotIdx, assetId);
        }
        return;
      }

      // Trường hợp 2: Kéo file ảnh từ desktop → upload + đặt vào slot
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const files = Array.from(e.dataTransfer.files).filter((f) =>
          f.type.startsWith("image/"),
        );
        if (files.length === 0) return;

        // Tính slot mà user thả vào
        const coords = getCanvasCoords(e);
        const targetSlot = coords
          ? getSlotFromPosition(coords.x, coords.y)
          : null;

        try {
          const projectId = useEditorStore.getState().projectId;
          const uploadedAssets = await uploadPhotos(
            files,
            projectId || undefined,
          );

          // Thêm asset vào store (không auto-fill)
          const store = useEditorStore.getState();
          for (const asset of uploadedAssets) {
            // Đăng ký local URL nếu là fallback asset
            if ("_localUrl" in asset && typeof asset._localUrl === "string") {
              const { registerLocalUrl } = await import("@/lib/api");
              registerLocalUrl(asset._id, asset._localUrl);
            }
          }
          // Thêm vào danh sách assets nhưng KHÔNG recalculate
          useEditorStore.setState((state) => ({
            assets: [...state.assets, ...uploadedAssets],
          }));

          // Đặt file đầu tiên vào slot được thả
          if (targetSlot !== null && uploadedAssets.length > 0) {
            store.placeAssetInSlot(
              currentPage,
              targetSlot,
              uploadedAssets[0]._id,
            );
          }

          // Nếu có nhiều file, đặt lần lượt vào các slot trống tiếp theo
          if (uploadedAssets.length > 1) {
            const { rows, cols } = layoutConfig;
            const totalSlots = rows * cols;
            const page = store.pages[currentPage];
            let nextSlotSearch = (targetSlot ?? -1) + 1;

            for (
              let i = 1;
              i < uploadedAssets.length && nextSlotSearch < totalSlots;
              i++
            ) {
              // Tìm slot trống tiếp theo
              while (
                nextSlotSearch < totalSlots &&
                page?.placements[nextSlotSearch]
              ) {
                nextSlotSearch++;
              }
              if (nextSlotSearch < totalSlots) {
                useEditorStore
                  .getState()
                  .placeAssetInSlot(
                    currentPage,
                    nextSlotSearch,
                    uploadedAssets[i]._id,
                  );
                nextSlotSearch++;
              }
            }
          }
        } catch (error) {
          console.error("Upload từ canvas thất bại:", error);
        }
      }
    },
    [
      addAssets,
      currentPage,
      getCanvasCoords,
      getSlotFromPosition,
      layoutConfig,
    ],
  );

  // Khởi tạo Fabric.js canvas
  useEffect(() => {
    if (!canvasRef.current || fabricRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: A4_WIDTH_MM * SCALE,
      height: A4_HEIGHT_MM * SCALE,
      backgroundColor: "#ffffff",
      selection: false,
    });

    fabricRef.current = canvas;

    return () => {
      canvas.dispose();
      fabricRef.current = null;
    };
  }, []);

  // Re-render khi state thay đổi
  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  return (
    <section
      className={`flex-1 relative overflow-auto p-12 canvas-grid flex justify-center items-start min-h-0 transition-colors ${
        isDragOver ? "bg-brand-50/30" : ""
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center gap-4">
        {/* Canvas wrapper — ref dùng để tính tọa độ drop */}
        <div
          ref={canvasContainerRef}
          className="relative shadow-2xl border border-gray-200 overflow-hidden transition-all"
        >
          <canvas ref={canvasRef} />

          {/* HTML overlay cho hover highlight — không trigger canvas re-render */}
          {isDragOver &&
            hoverSlotIdx !== null &&
            slotPositions[hoverSlotIdx] && (
              <div
                className="absolute pointer-events-none z-10 border-2 border-indigo-500 rounded-sm"
                style={{
                  left: `${slotPositions[hoverSlotIdx].x}px`,
                  top: `${slotPositions[hoverSlotIdx].y}px`,
                  width: `${slotPositions[hoverSlotIdx].w}px`,
                  height: `${slotPositions[hoverSlotIdx].h}px`,
                  backgroundColor: "rgba(238, 242, 255, 0.5)",
                }}
              >
                <span className="absolute inset-0 flex items-center justify-center text-indigo-600 text-[10px] font-bold">
                  Thả vào đây ✓
                </span>
              </div>
            )}
        </div>

        {/* Phân trang */}
        {pages.length > 1 && (
          <div className="flex items-center gap-2">
            {pages.map((_, idx) => (
              <button
                key={idx}
                onClick={() => useEditorStore.getState().setCurrentPage(idx)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                  idx === currentPage
                    ? "bg-brand-600 text-white shadow-md"
                    : "bg-white text-gray-500 border border-gray-200 hover:border-brand-500"
                }`}
                aria-label={`Trang ${idx + 1}`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default EditorCanvas;
