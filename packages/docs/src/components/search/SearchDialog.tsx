import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { Dialog, DialogContent } from "../ui/dialog.tsx";
import { Input } from "../ui/input.tsx";
import { ScrollArea } from "../ui/scroll-area.tsx";
import { Badge } from "../ui/badge.tsx";
import { BookOpenIcon, FileTextIcon, HashIcon, SearchIcon } from "lucide-react";
import { searchContent, type SearchResult } from "./searchIndex.ts";
import { cn } from "../../lib/utils.ts";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const navigate = useNavigate();

  // Search when query changes
  React.useEffect(() => {
    if (query.trim()) {
      const searchResults = searchContent(query);
      setResults(searchResults);
      setSelectedIndex(0);
    } else {
      setResults([]);
      setSelectedIndex(0);
    }
  }, [query]);

  // Handle keyboard navigation
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter" && results[selectedIndex]) {
        e.preventDefault();
        handleResultClick(results[selectedIndex]);
      } else if (e.key === "Escape") {
        onOpenChange(false);
      }
    },
    [results, selectedIndex, onOpenChange],
  );

  const handleResultClick = (result: SearchResult) => {
    navigate({ to: result.path });
    onOpenChange(false);
    setQuery("");
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case "page":
        return <FileTextIcon className="h-4 w-4" />;
      case "section":
        return <HashIcon className="h-4 w-4" />;
      default:
        return <BookOpenIcon className="h-4 w-4" />;
    }
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;

    const regex = new RegExp(
      `(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
      "gi",
    );
    const parts = text.split(regex);

    return parts.map((part, i) =>
      regex.test(part)
        ? (
          <mark
            key={i}
            className="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5"
          >
            {part}
          </mark>
        )
        : part
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0" onKeyDown={handleKeyDown}>
        <div className="relative border-b">
          <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documentation..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border-0 focus-visible:ring-0 text-lg py-6 pl-12 pr-4"
            autoFocus
          />
        </div>

        <ScrollArea className="max-h-96">
          {results.length > 0
            ? (
              <div className="p-2">
                {results.map((result, index) => (
                  <button
                    key={`${result.path}-${index}`}
                    onClick={() => handleResultClick(result)}
                    className={cn(
                      "w-full p-3 rounded-md text-left hover:bg-muted transition-colors",
                      selectedIndex === index && "bg-muted",
                    )}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 text-muted-foreground">
                        {getResultIcon(result.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-medium truncate">
                            {highlightMatch(result.title, query)}
                          </h4>
                          <Badge variant="secondary" className="text-xs">
                            {result.category}
                          </Badge>
                        </div>
                        {result.content && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {highlightMatch(result.content, query)}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )
            : query.trim()
            ? (
              <div className="p-8 text-center text-muted-foreground">
                <SearchIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No results found for "{query}"</p>
                <p className="text-sm mt-1">
                  Try different keywords or check spelling
                </p>
              </div>
            )
            : (
              <div className="p-8 text-center text-muted-foreground">
                <SearchIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Start typing to search the documentation</p>
              </div>
            )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
