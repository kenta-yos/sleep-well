"use client";

import { useRef, useEffect, useCallback } from "react";

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;
const SPACER_COUNT = Math.floor(VISIBLE_ITEMS / 2);

interface WheelPickerProps {
  items: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
  label?: string;
}

function WheelColumn({
  items,
  selectedIndex,
  onChange,
}: Omit<WheelPickerProps, "label">) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  // Scroll to selected index on mount and when selectedIndex changes externally
  useEffect(() => {
    const el = containerRef.current;
    if (!el || isScrollingRef.current) return;
    el.scrollTop = selectedIndex * ITEM_HEIGHT;
  }, [selectedIndex]);

  const handleScroll = useCallback(() => {
    isScrollingRef.current = true;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      const el = containerRef.current;
      if (!el) return;
      const index = Math.round(el.scrollTop / ITEM_HEIGHT);
      const clamped = Math.min(items.length - 1, Math.max(0, index));
      if (clamped !== selectedIndex) {
        onChange(clamped);
      }
      isScrollingRef.current = false;
    }, 80);
  }, [items.length, selectedIndex, onChange]);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="scrollbar-hide relative overflow-y-auto"
      style={{
        height: ITEM_HEIGHT * VISIBLE_ITEMS,
        scrollSnapType: "y mandatory",
      }}
    >
      {/* Top spacer */}
      <div style={{ height: ITEM_HEIGHT * SPACER_COUNT }} />

      {items.map((item, i) => {
        const isSelected = i === selectedIndex;
        return (
          <div
            key={i}
            style={{
              height: ITEM_HEIGHT,
              scrollSnapAlign: "center",
            }}
            className={`flex items-center justify-center text-xl transition-all ${
              isSelected
                ? "font-bold text-text scale-110"
                : "text-text-muted/40"
            }`}
            onClick={() => {
              onChange(i);
              containerRef.current?.scrollTo({
                top: i * ITEM_HEIGHT,
                behavior: "smooth",
              });
            }}
          >
            {item}
          </div>
        );
      })}

      {/* Bottom spacer */}
      <div style={{ height: ITEM_HEIGHT * SPACER_COUNT }} />
    </div>
  );
}

export function WheelPicker({
  items,
  selectedIndex,
  onChange,
  label,
}: WheelPickerProps) {
  return (
    <div className="flex flex-col items-center">
      {label && (
        <span className="mb-1 text-xs text-text-muted">{label}</span>
      )}
      <div className="relative w-20">
        {/* Selection highlight */}
        <div
          className="pointer-events-none absolute left-0 right-0 rounded-xl border border-primary/30 bg-primary/10"
          style={{
            top: ITEM_HEIGHT * SPACER_COUNT,
            height: ITEM_HEIGHT,
          }}
        />
        <WheelColumn
          items={items}
          selectedIndex={selectedIndex}
          onChange={onChange}
        />
      </div>
    </div>
  );
}

export function TimeWheelPicker({
  hours,
  minutes,
  onChangeHours,
  onChangeMinutes,
  label,
}: {
  hours: number;
  minutes: number;
  onChangeHours: (h: number) => void;
  onChangeMinutes: (m: number) => void;
  label?: string;
}) {
  const hourItems = Array.from({ length: 24 }, (_, i) =>
    String(i).padStart(2, "0")
  );
  const minuteItems = Array.from({ length: 12 }, (_, i) =>
    String(i * 5).padStart(2, "0")
  );

  return (
    <div className="flex flex-col items-center">
      {label && (
        <span className="mb-2 text-sm font-medium text-text-muted">
          {label}
        </span>
      )}
      <div className="flex items-center gap-1">
        <WheelPicker
          items={hourItems}
          selectedIndex={hours}
          onChange={onChangeHours}
        />
        <span className="text-2xl font-bold text-text-muted">:</span>
        <WheelPicker
          items={minuteItems}
          selectedIndex={Math.round(minutes / 5)}
          onChange={(i) => onChangeMinutes(i * 5)}
        />
      </div>
    </div>
  );
}
