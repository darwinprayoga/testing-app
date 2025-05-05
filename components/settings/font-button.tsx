"use client";

import { useEffect } from "react";
import { Star } from "lucide-react";

interface FontButtonProps {
  font: {
    name: string;
    value: string;
  };
  isActive: boolean;
  isFavorite: boolean;
  onSelect: () => void;
  onFavorite: () => void;
}

export function FontButton({
  font,
  isActive,
  isFavorite,
  onSelect,
  onFavorite,
}: FontButtonProps) {
  const fontId = `font-${font.name.replace(/\s+/g, "-").toLowerCase()}`;

  useEffect(() => {
    const styleEl = document.createElement("style");
    styleEl.id = fontId;
    styleEl.innerHTML = `
      .${fontId} {
        font-family: ${font.value} !important;
      }
    `;
    document.head.appendChild(styleEl);

    return () => {
      const existingStyle = document.getElementById(fontId);
      if (existingStyle) {
        document.head.removeChild(existingStyle);
      }
    };
  }, [font.value, fontId]);

  return (
    <div
      className={`relative flex items-center justify-between p-3 rounded-md border transition-all w-full ${
        isActive
          ? "border-[var(--main-color)] ring-1 ring-[var(--main-color)]"
          : "border-[var(--app-border)] hover:border-[var(--main-color)]"
      }`}
      onClick={onSelect}
    >
      <div className="flex flex-col gap-1 items-start w-full">
        <span className={`${fontId} text-sm font-semibold`}>{font.name}</span>
        <div className={`${fontId} text-xs`}>
          The quick brown fox jumps over the lazy dog
        </div>
      </div>
      <button
        className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 ml-2 flex-shrink-0"
        onClick={(e) => {
          e.stopPropagation();
          onFavorite();
        }}
      >
        <Star
          className={`h-3.5 w-3.5 ${
            isFavorite ? "fill-yellow-400 text-yellow-400" : "text-gray-400"
          }`}
        />
      </button>
    </div>
  );
}
