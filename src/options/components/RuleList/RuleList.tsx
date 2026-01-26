import { Download, Plus, Upload } from "lucide-react";
import { LayoutGroup, Reorder, useDragControls } from "framer-motion";
import { useState } from "react";
import { downloadJson, pickFileAsJson } from "@/options/lib/file";
import { useRules, useRulesDispatch } from "@/options/hooks/useRules";
import RuleListRowCard from "./RuleListRowCard";
import HoverExpandButton from "./HoverExpandButton";
import type { Rule } from "@/schemas/rules";
import { createLogger } from "@/options/lib/logger";

const logger = createLogger("[RuleList]");

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

  const handleRuleClick = (rule: Rule) => {
    if (selectedRule?.id === rule.id) {
      setSelectedRule(null);
    } else {
      setSelectedRule(rule);
    }
  };

  const handleDownload = async () => {
    logger.info("Exporting rules to file...");
    const cfg = await exportToJson();
    downloadJson(cfg, "download-helper-rules.json");
    logger.info("Rules exported successfully");
  };

  const handleUpload = async () => {
    try {
      logger.info("Importing rules from file...");
      const file = await pickFileAsJson();
      if (!file) {
        logger.info("File selection cancelled");
        return;
      }
      logger.info(`Reading file: ${file.name}`);
      const text = await file.text();
      const rules = JSON.parse(text);
      importFromJson(rules);
    } catch (e) {
      logger.error("Failed to import rules from file:", e);
      alert("Failed to import rules. Please check the file format.");
    }
  };

  return (
    <section>
      <div className="w-full flex items-center justify-between px-2 h-12">
        <div>
          <div className="text-2xl font-bold dark:text-stone-100">
            Rule List
          </div>
          <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Rules are evaluated from top to bottom
          </div>
        </div>
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
          className="p-4 rounded-md shadow-inner bg-stone-200 dark:bg-slate-800 grid grid-cols-1 gap-1"
          // transition={{ layout: { duration: 0.3, ease: "easeInOut" } }}
        >
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
                onClick={() => handleRuleClick(rule)}
                isDragging={draggingRuleId === rule.id}
                onDragStart={() => setDraggingRuleId(rule.id)}
                onDragEnd={handleDragEnd}
                isDragDisabled={selectedRule !== null}
              />
            ))}
          </Reorder.Group>
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
