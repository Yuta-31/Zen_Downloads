import { Button } from "@/components/ui/button";

interface DownloadProps {
  icon: React.ReactNode;
  text: string;
}

const HoverExpandButton = ({ icon, text }: DownloadProps) => {
  return (
    <Button variant="outline" className="cursor-pointer group gap-0">
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
