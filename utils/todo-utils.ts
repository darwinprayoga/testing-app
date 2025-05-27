import {
  formatDistanceToNow,
  isPast,
  isToday,
  isTomorrow,
  format,
} from "date-fns";
import type { EtaFormat } from "@/types/todo";

/**
 * Format the ETA display
 */
export const formatEta = (
  timestamp: number | null | undefined,
  t: (key: string) => string,
): EtaFormat => {
  if (!timestamp) {
    return { text: t("clickToSetEta"), isUrgent: false };
  }

  const date = new Date(timestamp);
  const now = new Date();

  if (isPast(date) && !isToday(date)) {
    const timeAgo = formatDistanceToNow(date, { addSuffix: true });
    return { text: `${t("overdue")} ${timeAgo}`, isUrgent: true };
  }

  const timeRemaining = date.getTime() - now.getTime();
  const minutesRemaining = Math.floor(timeRemaining / (1000 * 60));
  const isUrgent = minutesRemaining <= 30 && minutesRemaining > 0;

  let etaText = "";

  if (isToday(date)) {
    if (minutesRemaining <= 0) {
      etaText = `${t("etaToday")} (now)`;
    } else if (minutesRemaining < 60) {
      etaText =
        minutesRemaining === 1
          ? `${t("etaToday")}, ${t("minutesLeft").replace(
              "{minutes}",
              minutesRemaining.toString(),
            )}`
          : `${t("etaToday")}, ${t("minutesLeftPlural").replace(
              "{minutes}",
              minutesRemaining.toString(),
            )}`;
    } else {
      const hours = Math.floor(minutesRemaining / 60);
      const mins = minutesRemaining % 60;
      etaText = mins
        ? `${t("etaToday")}, ${t("hoursMinutesLeft")
            .replace("{hours}", hours.toString())
            .replace("{minutes}", mins.toString())}`
        : `${t("etaToday")}, ${t("hoursLeft").replace(
            "{hours}",
            hours.toString(),
          )}`;
    }
  } else if (isTomorrow(date)) {
    etaText = `${t("etaTomorrow")}, ${format(date, "h:mm a")}`;
  } else {
    etaText = `ETA: ${format(date, "MMM d, h:mm a")}`;
  }

  return { text: etaText, isUrgent };
};

/**
 * Validate priority input to only allow numbers or "-"
 */
export const validatePriorityInput = (value: string): string => {
  // Remove any non-numeric characters
  const cleaned = value.replace(/[^0-9]/g, "");

  // If cleaned value is empty, return "-"
  return cleaned === "" ? "-" : cleaned;
};

/**
 * Auto-resize textarea based on content
 */
export const autoResizeTextarea = (element: HTMLTextAreaElement | null) => {
  if (!element) return;

  element.style.height = "auto";
  element.style.height = `${element.scrollHeight}px`;
};
