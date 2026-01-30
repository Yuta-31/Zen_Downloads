import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { LucideIcon } from "lucide-react";
import type { ComponentProps } from "react";

interface TooltipButtonProps extends Omit<
  ComponentProps<typeof Button>,
  "children"
> {
  icon: LucideIcon;
  tooltip: string;
  iconClassName?: string;
}

export const TooltipButton = ({
  icon: Icon,
  tooltip,
  iconClassName = "w-5 h-5",
  ...buttonProps
}: TooltipButtonProps) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button {...buttonProps}>
          <Icon className={iconClassName} />
          <span className="sr-only">{tooltip}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        className="bg-white dark:bg-zinc-800 text-stone-700 dark:text-zinc-200 border border-stone-200 dark:border-zinc-700"
      >
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
};

export default TooltipButton;
