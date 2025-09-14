import React from "react";
import { cn } from "../../lib/utils";

interface NoteProps {
  children: React.ReactNode;
  className?: string;
}

export function Note({ children, className }: NoteProps) {
  return (
    <div
      className={cn(
        "mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md",
        className,
      )}
    >
      <p className="text-sm text-blue-800 dark:text-blue-200">
        <strong>Note:</strong> {children}
      </p>
    </div>
  );
}
