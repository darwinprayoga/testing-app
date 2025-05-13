"use client";

import { useEffect } from "react";

export function CleanupHash() {
  useEffect(() => {
    if (typeof window !== "undefined" && location.hash === "#") {
      const cleanUrl = location.href.replace(/#$/, "");
      history.replaceState(null, "", cleanUrl);
    }
  }, []);

  return null;
}
