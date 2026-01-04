import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";

import { RulesConfigSchema, type RulesConfig } from "@/schemas/rules";
import { DEFAULT_RULES } from "@/lib/rules/type";
import { readRules, writeRules, importRules } from "@/lib/rules/storage";

import { sendMessage } from "@/lib/message";
import RuleList from "./components/RuleList/RuleList";
import { RulePreviewCard } from "./components/Preview/Preview";

/** ユーティリティ */
const clone = <T,>(x: T) => JSON.parse(JSON.stringify(x)) as T;

const App: React.FC = () => {
  // 設定
  const [cfg, setCfg] = useState<RulesConfig>(DEFAULT_RULES);
  const [jsonText, setJsonText] = useState<string>(
    JSON.stringify(DEFAULT_RULES, null, 2)
  );
  const [jsonError, setJsonError] = useState<string>("");

  // 初期ロード
  useEffect(() => {
    (async () => {
      const loaded = await readRules();
      setCfg(loaded);
      setJsonText(JSON.stringify(loaded, null, 2));
      setJsonError("");
    })();
  }, []);

  // JSONエディタ → スキーマ検証
  const onJsonChange = (t: string) => {
    setJsonText(t);
    try {
      const parsed = RulesConfigSchema.parse(JSON.parse(t));
      setCfg(parsed);
      setJsonError("");
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setJsonError(message);
    }
  };

  // 保存
  const save = async () => {
    try {
      const parsed = RulesConfigSchema.parse(JSON.parse(jsonText));
      await writeRules(parsed);
      alert("保存しました");
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      alert("保存できません（JSON or スキーマ不正）\n" + message);
    }
  };

  // 有効/無効トグル & 並べ替え
  const toggleEnable = (id: string) => {
    const next = clone(cfg);
    const r = next.rules.find((x) => x.id === id)!;
    r.enabled = !r.enabled;
    setCfg(next);
    setJsonText(JSON.stringify(next, null, 2));
  };
  const move = (id: string, dir: -1 | 1) => {
    const next = clone(cfg);
    const i = next.rules.findIndex((x) => x.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= next.rules.length) return;
    const [r] = next.rules.splice(i, 1);
    next.rules.splice(j, 0, r);
    setCfg(next);
    setJsonText(JSON.stringify(next, null, 2));
  };
  const addRule = () => {
    const next = clone(cfg);
    next.rules.unshift({
      id: `r-${Date.now()}`,
      name: "新しいルール",
      enabled: true,
      domains: ["*"],
      conditions: [],
      actions: { pathTemplate: "{host}/{file}", conflict: "uniquify" },
    });
    setCfg(next);
    setJsonText(JSON.stringify(next, null, 2));
  };
  const removeRule = (id: string) => {
    const next = clone(cfg);
    next.rules = next.rules.filter((r) => r.id !== id);
    setCfg(next);
    setJsonText(JSON.stringify(next, null, 2));
  };

  // インポート/エクスポート
  const onExport = async () => {
    const text = JSON.stringify(cfg, null, 2);
    const res = await sendMessage<{ id: number }>({
      command: "export-rules",
      payload: {
        filename: "download-helper-rules.json",
        json: text,
      },
    });
    if (!res.ok) {
      alert("Export failed: " + res.error);
      return;
    }
  };
  const onImportFile = async (file: File) => {
    try {
      const text = await file.text();
      await importRules(text); // Zod検証を通して保存
      const reloaded = await readRules();
      setCfg(reloaded);
      setJsonText(JSON.stringify(reloaded, null, 2));
      setJsonError("");
      alert("インポート完了");
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      alert("インポート失敗: " + message);
    }
  };

  return (
    <div className="container">
      {/* 左：JSONエディタ */}
      <section>
        <RuleList cfg={cfg} />
      </section>

      {/* 右：プレビュー */}
      <section>
        <RulePreviewCard cfg={cfg} />
      </section>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
