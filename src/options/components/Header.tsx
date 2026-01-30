import { Download, Plus, Settings, Upload, Wind } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TooltipButton } from "@/components/ui/tooltip-button";

interface HeaderProps {
  onAddRule: () => void;
  onExport: () => void;
  onImport: () => void;
  onOpenSettings: () => void;
}

export const Header = ({
  onAddRule,
  onExport,
  onImport,
  onOpenSettings,
}: HeaderProps) => {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between py-4 px-6 backdrop-blur-md bg-white/80 dark:bg-zinc-950/80 border-b border-stone-200 dark:border-zinc-800">
      {/* Brand - Left Side */}
      <div className="flex items-center gap-3">
        <Wind
          className="w-6 h-6 text-teal-600 dark:text-teal-500"
          strokeWidth={2}
        />
        <h1 className="text-xl font-bold bg-gradient-to-r from-teal-500 to-teal-700 dark:from-teal-400 dark:to-teal-600 bg-clip-text text-transparent">
          Zen Downloads
        </h1>
      </div>

      {/* Action Area - Right Side */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Import Button */}
        <TooltipButton
          icon={Upload}
          tooltip="Import Settings"
          variant="ghost"
          size="icon"
          onClick={onImport}
          className="text-stone-500 dark:text-zinc-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-stone-100 dark:hover:bg-zinc-800 p-2 rounded-md transition-colors"
        />

        {/* Export Button */}
        <TooltipButton
          icon={Download}
          tooltip="Export Settings"
          variant="ghost"
          size="icon"
          onClick={onExport}
          className="text-stone-500 dark:text-zinc-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-stone-100 dark:hover:bg-zinc-800 p-2 rounded-md transition-colors"
        />

        {/* Add Rule - Primary CTA */}
        <Button
          onClick={onAddRule}
          className="bg-teal-600 hover:bg-teal-500 text-white shadow-lg shadow-teal-600/20 dark:shadow-teal-900/20 ml-1 sm:ml-2"
        >
          <Plus className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">Add Rule</span>
        </Button>

        {/* Settings Button */}
        <TooltipButton
          icon={Settings}
          tooltip="Settings"
          variant="ghost"
          size="icon"
          onClick={onOpenSettings}
          className="text-stone-500 dark:text-zinc-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-stone-100 dark:hover:bg-zinc-800 p-2 rounded-md transition-colors ml-1"
        />
      </div>
    </header>
  );
};

export default Header;
