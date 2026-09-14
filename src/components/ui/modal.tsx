"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

export function Modal({
  open,
  onClose,
  title,
  children,
  className,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  footer?: React.ReactNode;
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative z-10 w-full sm:max-w-lg max-h-[92vh] overflow-y-auto scrollbar-thin rounded-t-3xl sm:rounded-2xl border border-border bg-surface p-5 shadow-2xl animate-in",
          className
        )}
      >
        {title && (
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-lg font-bold">{title}</h3>
            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-text-muted hover:bg-surface-2 hover:text-text cursor-pointer"
              aria-label="close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        {children}
        {footer && <div className="mt-5 flex items-center justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}
