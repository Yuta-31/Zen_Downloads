import type { RulesConfig } from "@/schemas/rules";
import RuleListRowCard from "./RuleListRowCard";
import { DEFAULT_RULES } from "@/lib/rules/type";
import { Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RuleListProps {
  cfg: RulesConfig;
}

const mockCfg: RulesConfig = DEFAULT_RULES;

const RuleList = (props: RuleListProps) => {
  return (
    <section>
      <div className="flex items-center justify-between px-2 h-12">
        <div className="text-2xl font-bold">Rule List</div>
        <div className="flex gap-3">
          <Button variant="outline" className="cursor-pointer">
            <Download />
            Download
          </Button>

          <Button variant="outline" className="cursor-pointer">
            <Upload />
            Upload
          </Button>
        </div>
      </div>

      <div className="p-4 rounded-md shadow-inner bg-stone-200 grid grid-cols-1 gap-1">
        {mockCfg.rules.map((rule) => (
          <RuleListRowCard key={rule.id} rule={rule} />
        ))}
      </div>
    </section>
  );
};

export default RuleList;
