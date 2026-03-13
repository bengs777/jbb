"use client";

import { useEffect, useState } from "react";
import { getRemainingSeconds } from "@/lib/utils";
import { Clock } from "lucide-react";

interface QRISTimerProps {
  expiredAt: string;
  onExpired?: () => void;
}

export function QRISTimer({ expiredAt, onExpired }: QRISTimerProps) {
  const [remaining, setRemaining] = useState(() => getRemainingSeconds(expiredAt));

  useEffect(() => {
    if (remaining <= 0) {
      onExpired?.();
      return;
    }

    const timer = setInterval(() => {
      const secs = getRemainingSeconds(expiredAt);
      setRemaining(secs);
      if (secs <= 0) {
        clearInterval(timer);
        onExpired?.();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiredAt, onExpired]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  const isUrgent = remaining <= 60;
  const isDone = remaining <= 0;

  if (isDone) {
    return (
      <div className="flex items-center gap-2 text-red-600 font-semibold text-sm">
        <Clock className="h-4 w-4" />
        <span>QR Code telah kedaluwarsa</span>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-2 text-sm font-semibold ${
        isUrgent ? "text-red-600" : "text-gray-700"
      }`}
    >
      <Clock className={`h-4 w-4 ${isUrgent ? "animate-pulse" : ""}`} />
      <span>
        Bayar dalam{" "}
        <span
          className={`tabular-nums text-base ${
            isUrgent ? "text-red-600" : "text-green-700"
          }`}
        >
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </span>
      </span>
    </div>
  );
}
