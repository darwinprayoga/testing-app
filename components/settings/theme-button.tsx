"use client";

import { Star, Edit2, Trash2 } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

interface ThemeButtonProps {
  preset: {
    name: string;
    background: string;
    main: string;
  };
  isActive: boolean;
  isFavorite: boolean;
  isCustom: boolean;
  onSelect: () => void;
  onFavorite: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ThemeButton({
  preset,
  isActive,
  isFavorite,
  isCustom,
  onSelect,
  onFavorite,
  onEdit,
  onDelete,
}: ThemeButtonProps) {
  const { t } = useLanguage();

  return (
    <div
      tabIndex={0}
      className={`relative flex items-center justify-between p-3 rounded-md border transition-all w-full ${
        isActive
          ? "border-[var(--main-color)] ring-1 ring-[var(--main-color)]"
          : "border-[var(--app-border)] hover:border-[var(--main-color)]"
      }`}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onSelect();
      }}
      style={{
        backgroundColor: preset.background,
      }}
    >
      <span
        className="text-sm font-medium truncate"
        style={{ color: preset.main }}
      >
        {preset.name}
        {isCustom && (
          <span className="ml-2 text-xs opacity-70">({t("custom")})</span>
        )}
      </span>
      <div className="flex items-center gap-1">
        {isCustom && onEdit && (
          <button
            className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
          >
            <Edit2 className="h-3.5 w-3.5 text-gray-400" />
          </button>
        )}
        {isCustom && onDelete && (
          <button
            className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="h-3.5 w-3.5 text-gray-400" />
          </button>
        )}
        <button
          className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10"
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
    </div>
  );
}
