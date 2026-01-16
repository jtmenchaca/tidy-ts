import * as React from "react";
import { Button } from "../ui/button.tsx";
import { SearchIcon } from "lucide-react";
import { cn } from "../../lib/utils.ts";

interface SearchTriggerProps {
  onClick: () => void;
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
}

export function SearchTrigger({
  onClick,
  className,
  variant = "outline",
  size = "default",
}: SearchTriggerProps) {
  // Detect if user is on Mac for Cmd vs Ctrl
  const [isMac, setIsMac] = React.useState(false);

  React.useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf("MAC") >= 0);
  }, []);

  const shortcut = isMac ? "⌘K" : "Ctrl K";

  return (
    <Button
      variant={variant}
      size={size}
      onClick={onClick}
      className={cn(
        "justify-start text-muted-foreground min-w-0",
        size === "sm" && "h-8 px-2",
        className,
      )}
    >
      <SearchIcon className="h-4 w-4 mr-2 flex-shrink-0" />
      <span className="hidden sm:inline">Search docs...</span>
      <span className="sm:hidden">Search</span>
      <kbd className="hidden sm:inline-flex ml-auto pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
        {shortcut}
      </kbd>
    </Button>
  );
}
