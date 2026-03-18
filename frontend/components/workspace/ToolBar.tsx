"use client";

import { useState, useRef, useEffect } from "react";
import type { DrawingTool, ToolbarState } from "@/types";

interface ToolBarProps {
  state: ToolbarState;
  onChange: (patch: Partial<ToolbarState>) => void;
}

interface ToolDef {
  tool: DrawingTool;
  label: string;
  icon: React.ReactNode;
  group: "select" | "draw" | "shape" | "view";
}

const tools: ToolDef[] = [
  {
    tool: "select",
    label: "Select",
    group: "select",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 2l10 7-5.5 1.5L6 15 3 2z" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    tool: "move",
    label: "Move",
    group: "select",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M8 2v12M2 8h12M5 5l-3 3 3 3M11 5l3 3-3 3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    tool: "pen",
    label: "Pen",
    group: "draw",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M2 14l1-4L11 2l3 3-8 8-4 1z" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    tool: "brush",
    label: "Brush",
    group: "draw",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M13 2l1 1-8 8-2 .5.5-2L13 2zM5 11c0 1-1 2-3 3 1-2 1-3 3-3z" />
      </svg>
    ),
  },
  {
    tool: "eraser",
    label: "Eraser",
    group: "draw",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="1" y="9" width="14" height="5" rx="1" />
        <path d="M4 9l4-7 4 7" strokeLinejoin="round" />
        <path d="M4 9h8" />
      </svg>
    ),
  },
  {
    tool: "text",
    label: "Text",
    group: "draw",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M2 3h12M8 3v10M5 13h6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    tool: "rect",
    label: "Rectangle",
    group: "shape",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="4" width="12" height="8" rx="1" />
      </svg>
    ),
  },
  {
    tool: "circle",
    label: "Circle",
    group: "shape",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="8" cy="8" r="6" />
      </svg>
    ),
  },
  {
    tool: "arrow",
    label: "Arrow",
    group: "shape",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    tool: "line",
    label: "Line",
    group: "shape",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M2 14L14 2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    tool: "zoom_in",
    label: "Zoom In",
    group: "view",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="7" cy="7" r="5" />
        <path d="M5 7h4M7 5v4M11 11l3 3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    tool: "zoom_out",
    label: "Zoom Out",
    group: "view",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="7" cy="7" r="5" />
        <path d="M5 7h4M11 11l3 3" strokeLinecap="round" />
      </svg>
    ),
  },
];

const TOOL_GROUPS: Array<{ key: ToolDef["group"]; label: string }> = [
  { key: "select", label: "Select" },
  { key: "draw", label: "Draw" },
  { key: "shape", label: "Shapes" },
  { key: "view", label: "View" },
];

const PRESET_COLORS = [
  "#000000", "#FFFFFF", "#6B7280", "#D1D5DB",
  "#EF4444", "#F97316", "#F59E0B", "#EAB308",
  "#22C55E", "#10B981", "#06B6D4", "#3B82F6",
  "#6366F1", "#A855F7", "#EC4899", "#F43F5E",
  "#7C3AED", "#1D4ED8", "#047857", "#92400E",
];

const STROKE_WIDTHS = [1, 2, 4, 8];

export function ToolBar({ state, onChange }: ToolBarProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const swatchRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!pickerOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        pickerRef.current && !pickerRef.current.contains(e.target as Node) &&
        swatchRef.current && !swatchRef.current.contains(e.target as Node)
      ) {
        setPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [pickerOpen]);

  return (
    <div
      className="flex flex-col gap-4 w-12 shrink-0 py-3 items-center"
      role="toolbar"
      aria-label="Drawing tools"
    >
      {TOOL_GROUPS.map(({ key, label }) => {
        const groupTools = tools.filter((t) => t.group === key);
        return (
          <div key={key} className="flex flex-col gap-1" role="group" aria-label={label}>
            {groupTools.map((toolDef) => {
              const isActive = state.activeTool === toolDef.tool;
              return (
                <button
                  key={toolDef.tool}
                  aria-label={toolDef.label}
                  aria-pressed={isActive}
                  title={toolDef.label}
                  onClick={() => onChange({ activeTool: toolDef.tool })}
                  className={[
                    "h-9 w-9 rounded-xl flex items-center justify-center transition-colors duration-100",
                    "focus:outline-none focus:ring-2 focus:ring-white/20",
                    isActive
                      ? "bg-white text-[#0F0F0F]"
                      : "text-text-secondary hover:text-white hover:bg-white/5",
                  ].join(" ")}
                >
                  {toolDef.icon}
                </button>
              );
            })}
            <hr className="border-border w-6 mx-auto my-1" />
          </div>
        );
      })}

      <div className="relative flex flex-col gap-1 items-center">
        <p className="section-label text-center" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", fontSize: 9 }}>Color</p>
        <button
          ref={swatchRef}
          aria-label={`Color: ${state.activeColor}. Click to change.`}
          title={`Color: ${state.activeColor}`}
          onClick={() => setPickerOpen((o) => !o)}
          className="h-6 w-6 rounded-lg border-2 border-border hover:border-white/40 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/20"
          style={{ backgroundColor: state.activeColor }}
        />

        {pickerOpen && (
          <div
            ref={pickerRef}
            className="absolute left-full ml-2 bottom-0 z-50 bg-[#1A1A1A] border border-border rounded-2xl p-3 shadow-xl"
            style={{ width: 160 }}
          >
            <div className="grid grid-cols-4 gap-1.5 mb-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  aria-label={color}
                  title={color}
                  onClick={() => { onChange({ activeColor: color }); setPickerOpen(false); }}
                  className={[
                    "h-7 w-7 rounded-lg border-2 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/30",
                    state.activeColor === color ? "border-white" : "border-transparent",
                  ].join(" ")}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] text-text-muted uppercase tracking-wider">Custom</span>
              <input
                type="color"
                value={state.activeColor}
                onChange={(e) => onChange({ activeColor: e.target.value })}
                className="w-full h-8 rounded-lg cursor-pointer border-0 bg-transparent"
              />
            </label>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1 items-center">
        {STROKE_WIDTHS.map((w) => (
          <button
            key={w}
            aria-label={`Stroke width ${w}px`}
            title={`${w}px`}
            onClick={() => onChange({ strokeWidth: w })}
            className={[
              "h-7 w-9 rounded-lg flex items-center justify-center transition-colors duration-100",
              "focus:outline-none focus:ring-2 focus:ring-white/20",
              state.strokeWidth === w ? "bg-white/10" : "hover:bg-white/5",
            ].join(" ")}
          >
            <div
              className="rounded-full bg-current"
              style={{ height: Math.min(w, 6), width: 20 }}
            />
          </button>
        ))}
      </div>

      <div className="mt-auto">
        <button
          onClick={() => onChange({ zoom: 1 })}
          className="text-[10px] text-text-muted hover:text-white transition-colors"
          title="Reset zoom"
        >
          {Math.round(state.zoom * 100)}%
        </button>
      </div>
    </div>
  );
}
