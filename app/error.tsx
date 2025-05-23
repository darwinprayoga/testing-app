"use client";

import { useEffect, useState } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    console.error(error);

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          location.reload(); // Auto reload after countdown
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [error]);

  const discordURL = `https://discord.com/invite/nRzwh5vQTf`;
  const whatsappURL = `https://api.whatsapp.com/send?phone=628978600340&text=${encodeURIComponent(
    `🚨 I encountered an error:\n\n${error.message}\n\nDigest: ${
      error.digest ?? "N/A"
    }`,
  )}`;

  return (
    <div className="p-6 text-center">
      <h2 className="text-2xl font-bold text-red-600 mb-4">
        Something went wrong!
      </h2>
      <p className="mb-4">Auto reloading in {countdown} seconds...</p>

      <div className="flex justify-center gap-4 flex-wrap mb-4">
        <button
          onClick={reset}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Try Again
        </button>
        <a
          href={discordURL}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-purple-600 text-white rounded"
        >
          Report via Discord
        </a>
        <a
          href={whatsappURL}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-green-600 text-white rounded"
        >
          Report via WhatsApp
        </a>
      </div>
    </div>
  );
}
