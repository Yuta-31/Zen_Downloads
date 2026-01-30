import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import { X } from "lucide-react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import RuleList from "./components/RuleList/RuleList";
import { RulePreviewCard } from "./components/Preview/Preview";
import { SettingsCard } from "./components/SettingsCard";
import { RulesProvider } from "./components/RulesContext";
import { useTheme } from "./hooks/useTheme";
import { Header } from "./components/Header";
import { useRulesDispatch } from "./hooks/useRules";
import { downloadJson, pickFileAsJson } from "./lib/file";
import { createLogger } from "./lib/logger";

const logger = createLogger("[App]");

const AppContent: React.FC = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { addRule, exportToJson, importFromJson } = useRulesDispatch();
  useTheme(); // Initialize theme

  const handleExport = async () => {
    logger.info("Exporting rules to file...");
    const cfg = await exportToJson();
    downloadJson(cfg, "zen-downloads-rules.json");
    logger.info("Rules exported successfully");
  };

  const handleImport = async () => {
    try {
      logger.info("Importing rules from file...");
      const file = await pickFileAsJson();
      if (!file) {
        logger.info("File selection cancelled");
        return;
      }
      logger.info(`Reading file: ${file.name}`);
      const text = await file.text();
      const rules = JSON.parse(text);
      importFromJson(rules);
    } catch (e) {
      logger.error("Failed to import rules from file:", e);
      alert("Failed to import rules. Please check the file format.");
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-zinc-950">
      {/* Header */}
      <Header
        onAddRule={addRule}
        onExport={handleExport}
        onImport={handleImport}
        onOpenSettings={() => setIsDrawerOpen(true)}
      />

      {/* Settings Drawer */}
      <Drawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        direction="right"
      >
        <DrawerContent className="h-full max-h-screen bg-white dark:bg-zinc-900 border-stone-200 dark:border-zinc-800">
          <div className="mx-auto w-full max-w-md h-full flex flex-col">
            <DrawerHeader className="text-left border-b border-stone-200 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <DrawerTitle className="text-stone-800 dark:text-zinc-100">
                  Settings
                </DrawerTitle>
                <DrawerClose asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-stone-500 dark:text-zinc-400 hover:text-stone-700 dark:hover:text-zinc-200"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </DrawerClose>
              </div>
              <DrawerDescription className="text-stone-500 dark:text-zinc-500">
                Configure application preferences
              </DrawerDescription>
            </DrawerHeader>
            <div className="flex-1 overflow-y-auto px-4">
              <SettingsCard />
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-8">
        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Rule List */}
          <section>
            <RuleList />
          </section>

          {/* Right: Preview */}
          <section>
            <RulePreviewCard />
          </section>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <RulesProvider>
      <AppContent />
    </RulesProvider>
  );
};

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
