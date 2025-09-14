import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "./ThemeProvider.tsx";

export function ThemeToggle() {
  const { setTheme, actualTheme } = useTheme();

  const toggleTheme = () => {
    // Simple two-way toggle: light ↔ dark
    if (actualTheme === "light") {
      setTheme("dark");
    } else {
      setTheme("light");
    }
  };

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      className="shrink-0 h-9 w-9 p-1 cursor-pointer rounded border border-transparent transition-colors duration-200 ease-in-out text-gray-600 hover:bg-gray-100 hover:border-gray-200 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:border-gray-700 flex flex-col items-center justify-center overflow-hidden relative"
      onClick={toggleTheme}
    >
      <div className="relative w-5 h-5">
        {/* Show moon in light mode (what it will change TO) */}
        <MoonIcon
          className={`absolute inset-0 w-5 h-5 transition-transform duration-200 ${
            actualTheme === "light"
              ? "transform scale-100 rotate-0"
              : "transform scale-0 -rotate-90"
          }`}
        />
        {/* Show sun in dark mode (what it will change TO) */}
        <SunIcon
          className={`absolute inset-0 w-5 h-5 transition-transform duration-200 ${
            actualTheme === "dark"
              ? "transform scale-100 rotate-0"
              : "transform scale-0 rotate-90"
          }`}
        />
      </div>
      <span className="sr-only">
        {actualTheme === "light"
          ? "Switch to dark theme"
          : "Switch to light theme"}
      </span>
    </button>
  );
}
