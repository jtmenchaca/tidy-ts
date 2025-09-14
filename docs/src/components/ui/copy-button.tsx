import { useState, useCallback } from "react";
import { Copy, Check } from "lucide-react";

interface CopyButtonProps {
  text: string;
  className?: string;
  ariaLabel?: string;
}

export function CopyButton({ 
  text, 
  className = "absolute top-2 right-2 p-2 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors opacity-100 z-10 cursor-pointer",
  ariaLabel = "Copy code"
}: CopyButtonProps) {
  const [copySuccess, setCopySuccess] = useState(false);

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => {
        setCopySuccess(false);
      }, 1000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  }, [text]);

  return (
    <button
      onClick={copyToClipboard}
      className={className}
      aria-label={ariaLabel}
    >
      <div className="relative w-4 h-4">
        <Check 
          className={`h-4 w-4 text-green-600 dark:text-green-400 transition-all duration-200 ${
            copySuccess ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
          } absolute inset-0`} 
        />
        <Copy 
          className={`h-4 w-4 text-gray-600 dark:text-gray-400 transition-all duration-200 ${
            copySuccess ? 'opacity-0 scale-75' : 'opacity-100 scale-100'
          } absolute inset-0`} 
        />
      </div>
    </button>
  );
}
