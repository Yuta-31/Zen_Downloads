import { Download, Plus, Upload } from "lucide-react";
import {
  LayoutGroup,
  AnimatePresence,
  motion,
  Reorder,
  useDragControls,
} from "framer-motion";
import { useState } from "react";
import { downloadJson, pickFileAsJson } from "@/options/lib/file";
import { useRules, useRulesDispatch } from "@/options/hooks/useRules";
import RuleListRowCard from "./RuleListRowCard";
import HoverExpandButton from "./HoverExpandButton";
import type { Rule } from "@/schemas/rules";

const RuleList = () => {
  const { rules } = useRules();
  const { exportToJson, importFromJson, setRules, addRule } =
    useRulesDispatch();
  const [selectedRule, setSelectedRule] = useState<Rule | null>(null);
  const [draggingRuleId, setDraggingRuleId] = useState<string | null>(null);

  const handleReorder = (newRules: Rule[]) => {
    setRules(newRules);
  };

  const handleDragEnd = () => {
    setDraggingRuleId(null);
  };

  const handleDownload = async () => {
    const cfg = await exportToJson();
    downloadJson(cfg, "download-helper-rules.json");
  };

  const handleUpload = async () => {
    const file = await pickFileAsJson();
    if (!file) return;
    const text = await file.text();
    const json = JSON.parse(text);
    await importFromJson(json);
  };

  return (
    <section>
      <div className="w-full flex items-center justify-between px-2 h-12">
        <div className="text-2xl font-bold">Rule List</div>
        <div className="flex gap-2">
          <HoverExpandButton
            icon={<Plus />}
            onClick={addRule}
            text="Add"
            variant="default"
          />
          <HoverExpandButton
            icon={<Download />}
            onClick={handleDownload}
            text="Download"
          />
          <HoverExpandButton
            icon={<Upload />}
            onClick={handleUpload}
            text="Upload"
          />
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
            onReorder={handleReorder}
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
                onDragEnd={handleDragEnd}
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
