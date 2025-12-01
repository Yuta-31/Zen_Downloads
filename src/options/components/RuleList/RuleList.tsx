import { Download, Upload } from "lucide-react";
import {
  LayoutGroup,
  AnimatePresence,
  motion,
  Reorder,
  useDragControls,
} from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DEFAULT_RULES } from "@/lib/rules/type";
import RuleListRowCard from "./RuleListRowCard";
import type { Rule, RulesConfig } from "@/schemas/rules";

// TODO: Props の階層が深くなってきているので、Context 化を検討する

interface RuleListProps {
  cfg: RulesConfig;
}

const mockCfg: RulesConfig = DEFAULT_RULES;

const RuleList = ({ cfg }: RuleListProps) => {
  const [selectedRule, setSelectedRule] = useState<Rule | null>(null);
  const [rules, setRules] = useState<Rule[]>(mockCfg.rules);
  const [draggingRuleId, setDraggingRuleId] = useState<string | null>(null);

  return (
    <section>
      <div className="w-full flex items-center justify-between px-2 h-12">
        <div className="text-2xl font-bold">Rule List</div>
        <div className="flex">
          <Button variant="outline" className="cursor-pointer group gap-0">
            <Download />
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
              Download
            </span>
          </Button>

          <Button variant="outline" className="cursor-pointer group gap-0 ml-2">
            <Upload />
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
              Upload
            </span>
          </Button>
        </div>
      </div>
      <LayoutGroup>
        <div
          // layout
          className="pt-4 pb-4 pr-4 pl-0 rounded-md shadow-inner bg-stone-200 grid grid-cols-[35px_1fr] gap-1"
          // transition={{ layout: { duration: 0.3, ease: "easeInOut" } }}
        >
          <div className="grid grid-cols-1 gap-1">
            {rules.map((rule, idx) => (
              <div
                key={rule.id}
                className="
                  flex items-center justify-center 
                  text-[25px] font-bold 
                  text-transparent bg-stone-600 bg-clip-text [text-shadow:1px_1px_2px_rgba(231,229,228,0.95)]"
                style={{ minHeight: "74px" }}
              >
                {idx + 1}
              </div>
            ))}
          </div>
          <Reorder.Group
            axis="y"
            values={rules}
            onReorder={setRules}
            className="grid grid-cols-1 gap-1"
          >
            {rules.map((rule) => (
              <RuleReorderItem
                key={rule.id}
                rule={rule}
                isOpen={selectedRule?.id === rule.id}
                onClick={() => setSelectedRule(rule)}
                isDragging={draggingRuleId === rule.id}
                onDragStart={() => setDraggingRuleId(rule.id)}
                onDragEnd={() => {
                  setDraggingRuleId(null);
                  // TODO: Save order to config
                }}
              />
            ))}
          </Reorder.Group>
        </div>

        <AnimatePresence>
          {selectedRule && (
            <motion.div
              className="fixed inset-0 z-40 bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              onClick={() => setSelectedRule(null)}
            />
          )}
        </AnimatePresence>
      </LayoutGroup>
    </section>
  );
};

interface RuleReorderItemProps {
  rule: Rule;
  isOpen: boolean;
  onClick: () => void;
  isDragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
}

const RuleReorderItem = ({
  rule,
  isOpen,
  isDragging,
  onClick,
  onDragStart,
  onDragEnd,
}: RuleReorderItemProps) => {
  const controls = useDragControls();

  return (
    <Reorder.Item
      value={rule}
      dragListener={false}
      dragControls={controls}
      style={{ minHeight: "74px" }}
      onDragEnd={onDragEnd}
    >
      <RuleListRowCard
        rule={rule}
        onClick={onClick}
        onDrag={controls}
        isOpen={isOpen}
        isDragging={isDragging}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      />
    </Reorder.Item>
  );
};

export default RuleList;
