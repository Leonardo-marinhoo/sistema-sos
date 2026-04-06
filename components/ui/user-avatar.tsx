"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  src?: string | null;
  fallbackSrc?: string | null;
  alt: string;
  initials: string;
  className?: string;
  imgClassName?: string;
  fallbackClassName?: string;
  /** Use square shape with rounded corners instead of circular */
  variant?: "circle" | "square";
}

function normalizeImageSrc(value?: string | null): string | null {
  const normalized = value?.trim();
  if (!normalized || normalized === "null" || normalized === "undefined") {
    return null;
  }

  return normalized;
}

export function UserAvatar({
  src,
  fallbackSrc,
  alt,
  initials,
  className,
  imgClassName,
  fallbackClassName,
  variant = "circle",
}: UserAvatarProps) {
  const normalizedSrc = normalizeImageSrc(src);
  const normalizedFallbackSrc = normalizeImageSrc(fallbackSrc);
  const sourceKey = `${normalizedSrc ?? ""}|${normalizedFallbackSrc ?? ""}`;

  const [failedKey, setFailedKey] = useState<string | null>(null);
  const [fallbackAppliedKey, setFallbackAppliedKey] = useState<string | null>(null);

  const currentSrc =
    fallbackAppliedKey === sourceKey
      ? normalizedFallbackSrc
      : (normalizedSrc ?? normalizedFallbackSrc);
  const imageFailed = failedKey === sourceKey;

  const handleImageError = () => {
    if (
      normalizedFallbackSrc &&
      normalizedSrc &&
      normalizedSrc !== normalizedFallbackSrc &&
      fallbackAppliedKey !== sourceKey
    ) {
      setFallbackAppliedKey(sourceKey);
      return;
    }

    setFailedKey(sourceKey);
  };

  const shouldShowImage = Boolean(currentSrc) && !imageFailed;
  const isSquare = variant === "square";

  return (
    <span
      className={cn(
        "relative inline-flex h-10 w-10 shrink-0 overflow-hidden",
        isSquare ? "rounded-xl" : "rounded-full",
        className
      )}
      aria-label={alt}
      title={alt}
    >
      {shouldShowImage ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={currentSrc ?? undefined}
          alt={alt}
          className={cn("h-full w-full object-cover", imgClassName)}
          onError={handleImageError}
        />
      ) : (
        <span
          className={cn(
            "flex h-full w-full items-center justify-center bg-primary/10 text-primary",
            isSquare ? "rounded-xl" : "rounded-full",
            fallbackClassName
          )}
        >
          {initials}
        </span>
      )}
    </span>
  );
}
