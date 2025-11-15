import React, { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom/client";

import {
  RulesConfigSchema,
  type RulesConfig,
  type Rule,
} from "@/schemas/rules";
import { DEFAULT_RULES } from "@/lib/rules/type";
import { readRules, writeRules, importRules } from "@/lib/rules/storage";
import { buildCtx, inDomain, matchAll } from "@/lib/rules/engine";
import { expandTemplate } from "@/lib/template";
import { sanitizePath } from "@/lib/sanitize";

import { sendMessage } from "@/lib/message";

/** ユーティリティ */
const clone = <T,>(x: T) => JSON.parse(JSON.stringify(x)) as T;

const App: React.FC = () => {
  // 設定
  const [cfg, setCfg] = useState<RulesConfig>(DEFAULT_RULES);
  const [jsonText, setJsonText] = useState<string>(
    JSON.stringify(DEFAULT_RULES, null, 2)
  );
  const [jsonError, setJsonError] = useState<string>("");

  // プレビュー
  const [testUrl, setTestUrl] = useState<string>(
    "https://file-examples.com/storage/fe8f4c5/file-example_DOCX_500kB.docx"
  );
  const [testFile, setTestFile] = useState<string>("file-example_500kB.docx");

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
    } catch (e: any) {
      setJsonError(String(e.message ?? e));
    }
  };

  // 保存
  const save = async () => {
    try {
      const parsed = RulesConfigSchema.parse(JSON.parse(jsonText));
      await writeRules(parsed);
      alert("保存しました");
    } catch (e: any) {
      alert("保存できません（JSON or スキーマ不正）\n" + (e.message ?? e));
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

  // プレビュー
  const preview = useMemo(() => {
    try {
      const ctx = buildCtx(testUrl, testFile);
      const enabled = cfg.rules.filter((r) => r.enabled);
      const matched = enabled.find(
        (r) => inDomain(r.domains, ctx.host) && matchAll(r.conditions, ctx)
      );
      if (!matched)
        return { match: undefined as Rule | undefined, path: "(既定の保存先)" };

      const out = expandTemplate(
        matched.actions.pathTemplate ?? "{host}/{file}",
        ctx
      );
      return { match: matched, path: sanitizePath(out) };
    } catch {
      return { match: undefined, path: "(URLが不正)" };
    }
  }, [cfg, testUrl, testFile]);

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
    } catch (e: any) {
      alert("インポート失敗: " + (e.message ?? e));
    }
  };

  return (
    <div className="container">
      {/* 左：JSONエディタ */}
      <section>
        <h1>Rules (JSON)</h1>
        <p className="muted">
          上から順に評価し、最初にマッチしたルールを適用します。保存時に Zod
          で検証されます。
        </p>

        <textarea
          value={jsonText}
          onChange={(e) => onJsonChange(e.target.value)}
        />

        {jsonError ? (
          <pre className="err">{jsonError}</pre>
        ) : (
          <div className="ok">✓ スキーマ検証 OK</div>
        )}

        <div className="row" style={{ marginTop: 8 }}>
          <button onClick={save}>保存</button>
          <button
            onClick={() => {
              setCfg(DEFAULT_RULES);
              setJsonText(JSON.stringify(DEFAULT_RULES, null, 2));
              setJsonError("");
            }}
          >
            デフォルトに戻す
          </button>
          <span className="right" />
          <button onClick={onExport}>エクスポート</button>
          <label className="row" style={{ gap: 6 }}>
            <input
              type="file"
              accept="application/json"
              onChange={(e) =>
                e.currentTarget.files?.[0] &&
                onImportFile(e.currentTarget.files[0])
              }
            />
          </label>
        </div>

        {/* ルール軽操作 */}
        <h2 style={{ marginTop: 24, fontSize: 16 }}>
          ルール一覧（有効化・並べ替え）
        </h2>
        <div className="row" style={{ marginBottom: 8 }}>
          <button onClick={addRule}>+ ルールを追加</button>
        </div>
        <ul className="list">
          {cfg.rules.map((r, i) => (
            <li key={r.id} className="row" style={{ marginBottom: 6 }}>
              <code className="pill">{r.id}</code>
              <span>{r.name}</span>
              <span className="muted">{r.domains.join(", ")}</span>
              <span className="right muted">{r.enabled ? "有効" : "無効"}</span>
              <button onClick={() => toggleEnable(r.id)}>
                {r.enabled ? "無効化" : "有効化"}
              </button>
              <button disabled={i === 0} onClick={() => move(r.id, -1)}>
                ↑
              </button>
              <button
                disabled={i === cfg.rules.length - 1}
                onClick={() => move(r.id, +1)}
              >
                ↓
              </button>
              <button
                onClick={() => removeRule(r.id)}
                style={{ color: "#b00020" }}
              >
                削除
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* 右：プレビュー */}
      <section>
        <h2>プレビュー</h2>
        <div className="grid" style={{ marginTop: 8 }}>
          <label>
            テストURL
            <input
              value={testUrl}
              onChange={(e) => setTestUrl(e.target.value)}
              style={{ width: "100%" }}
            />
          </label>
          <label>
            推定ファイル名（空ならURL末尾）
            <input
              value={testFile}
              onChange={(e) => setTestFile(e.target.value)}
              style={{ width: "100%" }}
            />
          </label>
        </div>

        <div className="card" style={{ marginTop: 12 }}>
          <div className="muted">マッチしたルール</div>
          {preview.match ? (
            <>
              <div>
                <b>{preview.match.name}</b>
              </div>
              <div className="muted" style={{ fontSize: 12 }}>
                {preview.match.actions.pathTemplate}
              </div>
            </>
          ) : (
            <div className="muted">（マッチなし → 既定の保存ルールが適用）</div>
          )}

          <div style={{ marginTop: 12 }} className="muted">
            最終パス
          </div>
          <code className="code">{preview.path}</code>

          <div style={{ marginTop: 8, fontSize: 12 }} className="muted">
            使えるトークン例:{" "}
            {
              "{host} {file} {basename} {ext} {yyyy-mm-dd} {path[0]} {path[1..3]} {lower:ext} {sanitize:file}"
            }{" "}
            / {"query.foo"}
          </div>
        </div>
      </section>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
