import { Button } from "@/components/ui/button";

interface DownloadProps {
  icon: React.ReactNode;
  text: string;
  onClick?: () => void;
  variant?:
    | "default"
    | "link"
    | "outline"
    | "destructive"
    | "secondary"
    | "ghost";
}

const HoverExpandButton = ({
  icon,
  text,
  onClick,
  variant = "outline",
}: DownloadProps) => {
  return (
    <Button
      variant={variant}
      onClick={onClick}
      className="cursor-pointer group gap-0"
    >
      {icon}
      <span
        className="
                ml-0
                max-w-0
                opacity-0
                whitespace-nowrap
                transition-all duration-300 ease-in
                overflow-hidden
                group-hover:ml-2
                group-hover:max-w-[80px]
                group-hover:opacity-100"
      >
        {text}
      </span>
    </Button>
  );
};

export default HoverExpandButton;
