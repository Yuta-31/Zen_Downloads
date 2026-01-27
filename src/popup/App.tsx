import { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { motion, AnimatePresence } from "framer-motion";
import { Pause, Play, Download } from "lucide-react";
import { getSettings, updateSettings, type Theme } from "@/lib/settings";
import "@/index.css";

const App = () => {
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Apply theme
  useEffect(() => {
    const applyTheme = (theme: Theme) => {
      const root = document.documentElement;

      if (theme === "system") {
        const prefersDark = window.matchMedia(
          "(prefers-color-scheme: dark)",
        ).matches;
        root.classList.toggle("dark", prefersDark);
      } else {
        root.classList.toggle("dark", theme === "dark");
      }
    };

    // Load and apply theme
    getSettings().then((settings) => {
      applyTheme(settings.theme);
    });

    // Listen for theme changes
    const listener = (changes: {
      [k: string]: chrome.storage.StorageChange;
    }) => {
      if (changes.theme) {
        const newTheme = changes.theme.newValue as Theme;
        applyTheme(newTheme);
      }
    };
    chrome.storage.onChanged.addListener(listener);

    // Listen for system theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleMediaChange = () => {
      getSettings().then((settings) => {
        if (settings.theme === "system") {
          applyTheme("system");
        }
      });
    };
    mediaQuery.addEventListener("change", handleMediaChange);

    return () => {
      chrome.storage.onChanged.removeListener(listener);
      mediaQuery.removeEventListener("change", handleMediaChange);
    };
  }, []);

  // Load initial state from storage
  useEffect(() => {
    getSettings().then((settings) => {
      setIsPaused(settings.isPaused);
      setIsLoading(false);
    });
  }, []);

  // Update storage when state changes
  const handleToggle = async (checked: boolean) => {
    setIsPaused(checked);
    await updateSettings({ isPaused: checked });
  };

  const isActive = !isPaused;

  if (isLoading) {
    return (
      <div className="w-72 h-80 flex items-center justify-center bg-background">
        <div className="text-center text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="w-72 h-80 bg-background flex flex-col items-center p-6">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="flex items-center justify-center gap-2 mb-3"
      >
        <Download className="w-5 h-5 text-primary" strokeWidth={2} />
        <h1 className="text-lg font-medium tracking-tight text-foreground">
          Zen Downloads
        </h1>
      </motion.header>

      {/* Main toggle area */}
      <div className="relative flex flex-col items-center justify-center gap-6 flex-1">
        {/* Breathing glow rings - only visible when active */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <AnimatePresence>
            {isActive && (
              <>
                {/* Outer breathing ring */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.15, 0.3, 0.15],
                  }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute w-40 h-40 rounded-full"
                  style={{
                    background: `radial-gradient(circle, var(--teal-glow) 0%, transparent 70%)`,
                  }}
                />
                {/* Middle breathing ring */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.2, 0.4, 0.2],
                  }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.5,
                  }}
                  className="absolute w-32 h-32 rounded-full"
                  style={{
                    background: `radial-gradient(circle, var(--teal-glow) 0%, transparent 70%)`,
                  }}
                />
                {/* Inner glow ring */}
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.3, 0.5, 0.3],
                  }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1,
                  }}
                  className="absolute w-24 h-24 rounded-full"
                  style={{
                    background: `radial-gradient(circle, var(--teal-dim) 0%, transparent 70%)`,
                  }}
                />
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Main toggle button */}
        <motion.button
          onClick={() => handleToggle(!isPaused)}
          whileTap={{ scale: 0.92 }}
          whileHover={{ scale: 1.02 }}
          className="relative z-10 w-20 h-20 rounded-full flex items-center justify-center cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-colors duration-500"
          style={{
            background: isActive
              ? "linear-gradient(145deg, #14b8a6, #0d9488)"
              : "linear-gradient(145deg, var(--paused-bg-start), var(--paused-bg-end))",
            boxShadow: isActive
              ? "0 0 40px rgba(20, 184, 166, 0.4), inset 0 1px 0 rgba(255,255,255,0.1)"
              : "0 4px 20px var(--paused-shadow), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
          aria-label={isActive ? "Pause Zen Mode" : "Activate Zen Mode"}
          aria-pressed={isActive}
        >
          {/* Button inner ring */}
          <motion.div
            className="absolute inset-1.5 rounded-full border"
            style={{
              borderColor: isActive
                ? "rgba(255,255,255,0.15)"
                : "rgba(255,255,255,0.05)",
            }}
            animate={{
              borderColor: isActive
                ? "rgba(255,255,255,0.15)"
                : "rgba(255,255,255,0.05)",
            }}
            transition={{ duration: 0.5 }}
          />

          {/* Icon with smooth transition */}
          <AnimatePresence mode="wait">
            <motion.div
              key={isActive ? "play" : "pause"}
              initial={{ scale: 0.5, opacity: 0, rotate: -90 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.5, opacity: 0, rotate: 90 }}
              transition={{
                duration: 0.3,
                ease: [0.4, 0, 0.2, 1],
              }}
            >
              {isActive ? (
                <Play
                  className="w-8 h-8 ml-0.5"
                  style={{ color: "rgba(255,255,255,0.95)" }}
                  strokeWidth={2.5}
                />
              ) : (
                <Pause
                  className="w-8 h-8"
                  style={{ color: "var(--paused-icon-color)" }}
                  strokeWidth={2.5}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </motion.button>

        {/* Status text */}
        <div className="relative z-10 text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={isActive ? "active" : "paused"}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <motion.p
                className="text-sm font-medium tracking-wide uppercase"
                style={{
                  color: isActive ? "#14b8a6" : "var(--muted-foreground)",
                }}
              >
                {isActive ? "Zen Mode Active" : "Paused"}
              </motion.p>
              <motion.p className="mt-1 text-xs text-muted-foreground">
                {isActive
                  ? "Downloads are organized by rules"
                  : "Using default browser behavior"}
              </motion.p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Settings link */}
      <div className="pt-3 border-t border-border w-full text-center">
        <button
          className="text-xs text-primary hover:underline"
          onClick={() => chrome.runtime.openOptionsPage()}
        >
          Open Settings
        </button>
      </div>
    </div>
  );
};

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<App />);
}
