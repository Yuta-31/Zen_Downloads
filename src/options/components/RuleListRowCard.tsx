import { Card } from "@/components/ui/card";
import type { RuleSchemaType } from "@/schemas/rules";
import { Switch } from "@/components/ui/switch";
import { ChevronRight } from "lucide-react";

interface RuleListRowCardProps {
  rule: RuleSchemaType;
}

const RuleListRowCard = (props: RuleListRowCardProps) => {
  return (
    <Card className="w-full px-4 flex flex-row justify-between items-center">
      <div className="font-bold">{props.rule.name}</div>
      <div className="flex gap-4 items-center">
        <Switch className="cursor-pointer" checked={props.rule.enabled} />
        <ChevronRight />
      </div>
    </Card>
  );
};

export default RuleListRowCard;
