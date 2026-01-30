import { Plus } from "lucide-react";
import { LayoutGroup, Reorder, useDragControls } from "framer-motion";
import { useState } from "react";
import { useRules, useRulesDispatch } from "@/options/hooks/useRules";
import { Button } from "@/components/ui/button";
import RuleListRowCard from "./RuleListRowCard";
import type { Rule } from "@/schemas/rules";

const RuleList = () => {
  const { rules } = useRules();
  const { setRules, addRule } = useRulesDispatch();
  const [selectedRule, setSelectedRule] = useState<Rule | null>(null);
  const [draggingRuleId, setDraggingRuleId] = useState<string | null>(null);

  const handleReorder = (newRules: Rule[]) => {
    setRules(newRules);
  };

  const handleDragEnd = () => {
    setDraggingRuleId(null);
  };

  const handleRuleClick = (rule: Rule) => {
    if (selectedRule?.id === rule.id) {
      setSelectedRule(null);
    } else {
      setSelectedRule(rule);
    }
  };

  return (
    <section>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-stone-800 dark:text-zinc-100">
            Rules
          </h2>
          <p className="text-xs text-stone-500 dark:text-zinc-500 mt-1">
            Evaluated from top to bottom. First match wins.
          </p>
        </div>
      </div>

      {/* Rule List */}
      <LayoutGroup>
        <div className="space-y-4">
          <Reorder.Group
            axis="y"
            values={rules}
            onReorder={handleReorder}
            className="space-y-4"
          >
            {rules.map((rule) => (
              <RuleReorderItem
                key={rule.id}
                rule={rule}
                isOpen={selectedRule?.id === rule.id}
                onClick={() => handleRuleClick(rule)}
                isDragging={draggingRuleId === rule.id}
                onDragStart={() => setDraggingRuleId(rule.id)}
                onDragEnd={handleDragEnd}
                isDragDisabled={selectedRule !== null}
              />
            ))}
          </Reorder.Group>

          {/* Empty State */}
          {rules.length === 0 && (
            <div className="text-center py-12 border border-dashed border-stone-300 dark:border-zinc-800 rounded-xl bg-white dark:bg-transparent">
              <p className="text-stone-500 dark:text-zinc-500 mb-4">
                No rules configured yet
              </p>
              <Button
                size="sm"
                onClick={addRule}
                className="bg-teal-600 hover:bg-teal-500 text-white"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Create your first rule
              </Button>
            </div>
          )}
        </div>
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
  isDragDisabled: boolean;
}

const RuleReorderItem = ({
  rule,
  isOpen,
  isDragging,
  onClick,
  onDragStart,
  onDragEnd,
  isDragDisabled,
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
        isDragDisabled={isDragDisabled}
      />
    </Reorder.Item>
  );
};

export default RuleList;
