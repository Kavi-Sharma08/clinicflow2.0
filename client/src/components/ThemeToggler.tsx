// src/components/ThemeToggle.tsx
import { type FC } from "react";
import { useTheme } from "../context/ThemeContext";

const ThemeToggle: FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      className="w-10 h-10 rounded-full grid place-items-center border border-[#D9E6F7] dark:border-white/15 bg-white dark:bg-white/5 text-[#0057A8] dark:text-cyan-300 hover:bg-blue-50 dark:hover:bg-white/10 transition-colors"
    >
      {theme === "light" ? "🌙" : "☀️"}
    </button>
  );
};

export default ThemeToggle;