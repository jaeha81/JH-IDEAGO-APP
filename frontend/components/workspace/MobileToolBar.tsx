"use client";

import { useState, useRef, useEffect } from "react";
import type { DrawingTool, ToolbarState } from "@/types";

interface MobileToolBarProps {
  state: ToolbarState;
  onChange: (patch: Partial<ToolbarState>) => void;
}

interface ToolDef {
  tool: DrawingTool;
  label: string;
  icon: React.ReactNode;
}

const MAIN_TOOLS: ToolDef[] = [
  {
    tool: "select",
    label: "Select",
    icon: (
      <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 2l10 7-5.5 1.5L6 15 3 2z" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    tool: "pen",
    label: "Pen",
    icon: (
      <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M2 14l1-4L11 2l3 3-8 8-4 1z" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    tool: "brush",
    label: "Brush",
    icon: (
      <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M13 2l1 1-8 8-2 .5.5-2L13 2zM5 11c0 1-1 2-3 3 1-2 1-3 3-3z" />
      </svg>
    ),
  },
  {
    tool: "eraser",
    label: "Eraser",
    icon: (
      <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="1" y="9" width="14" height="5" rx="1" />
        <path d="M4 9l4-7 4 7" strokeLinejoin="round" />
        <path d="M4 9h8" />
      </svg>
    ),
  },
  {
    tool: "text",
    label: "Text",
    icon: (
      <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M2 3h12M8 3v10M5 13h6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    tool: "rect",
    label: "Rectangle",
    icon: (
      <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="4" width="12" height="8" rx="1" />
      </svg>
    ),
  },
];

const PRESET_COLORS = [
  "#000000", "#FFFFFF", "#EF4444", "#F97316",
  "#22C55E", "#3B82F6", "#6366F1", "#A855F7",
];

export function MobileToolBar({ state, onChange }: MobileToolBarProps) {
  const [colorOpen, setColorOpen] = useState(false);
  const colorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!colorOpen) return;
    const handler = (e: MouseEvent) => {
      if (colorRef.current && !colorRef.current.contains(e.target as Node)) {
        setColorOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [colorOpen]);

  return (
    <div className="absolute bottom-4 left-4 right-16 z-20">
      {/* Color picker popup */}
      {colorOpen && (
        <div
          ref={colorRef}
          className="mb-2 bg-[#1A1A1A] border border-border rounded-2xl p-3 shadow-xl"
        >
          <div className="grid grid-cols-8 gap-2">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                aria-label={color}
                onClick={() => { onChange({ activeColor: color }); setColorOpen(false); }}
                className={[
                  "h-8 w-8 rounded-lg border-2 transition-transform active:scale-95",
                  state.activeColor === color ? "border-white" : "border-transparent",
                ].join(" ")}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Main toolbar */}
      <div
        className="flex items-center gap-1 px-2 py-1.5 bg-[#1A1A1A]/95 backdrop-blur-sm border border-border rounded-2xl shadow-lg overflow-x-auto scrollbar-none"
        role="toolbar"
        aria-label="Drawing tools"
      >
        {MAIN_TOOLS.map((toolDef) => {
          const isActive = state.activeTool === toolDef.tool;
          return (
            <button
              key={toolDef.tool}
              aria-label={toolDef.label}
              aria-pressed={isActive}
              onClick={() => onChange({ activeTool: toolDef.tool })}
              className={[
                "h-9 w-9 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                isActive
                  ? "bg-white text-[#0F0F0F]"
                  : "text-text-secondary active:bg-white/10",
              ].join(" ")}
            >
              {toolDef.icon}
            </button>
          );
        })}

        {/* Divider */}
        <div className="w-px h-6 bg-border shrink-0 mx-0.5" />

        {/* Color swatch */}
        <button
          aria-label={`Color: ${state.activeColor}`}
          onClick={() => setColorOpen((o) => !o)}
          className="h-7 w-7 rounded-lg border-2 border-border shrink-0 active:scale-95 transition-transform"
          style={{ backgroundColor: state.activeColor }}
        />

        {/* Zoom reset */}
        <button
          onClick={() => onChange({ zoom: 1 })}
          className="text-[10px] text-text-muted shrink-0 px-1"
          title="Reset zoom"
        >
          {Math.round(state.zoom * 100)}%
        </button>
      </div>
    </div>
  );
}
