import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import { Settings, X } from "lucide-react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import RuleList from "./components/RuleList/RuleList";
import { RulePreviewCard } from "./components/Preview/Preview";
import { SettingsCard } from "./components/SettingsCard";
import { RulesProvider } from "./components/RulesContext";
import { useTheme } from "./hooks/useTheme";

const App: React.FC = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  useTheme(); // Initialize theme

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 dark:from-slate-950 dark:to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-stone-800 dark:text-stone-100 mb-2">
              Zen Downloads - Settings
            </h1>
            <p className="text-stone-600 dark:text-stone-400">
              Manage rules for automatically organizing download file
              destinations
            </p>
          </div>
          <Drawer
            open={isDrawerOpen}
            onOpenChange={setIsDrawerOpen}
            direction="right"
          >
            <DrawerTrigger asChild>
              <Button size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </DrawerTrigger>
            <DrawerContent className="h-full max-h-screen">
              <div className="mx-auto w-full max-w-md h-full flex flex-col">
                <DrawerHeader className="text-left">
                  <div className="flex items-center justify-between">
                    <DrawerTitle>Settings</DrawerTitle>
                    <DrawerClose asChild>
                      <Button variant="ghost" size="icon">
                        <X className="h-4 w-4" />
                      </Button>
                    </DrawerClose>
                  </div>
                  <DrawerDescription>
                    Configure application preferences
                  </DrawerDescription>
                </DrawerHeader>
                <div className="flex-1 overflow-y-auto px-4">
                  <SettingsCard />
                </div>
              </div>
            </DrawerContent>
          </Drawer>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

ReactDOM.createRoot(document.getElementById("root")!).render(
  <RulesProvider>
    <App />
  </RulesProvider>,
);
