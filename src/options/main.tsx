import React, { useState } from "react";
import ReactDOM from "react-dom/client";
// import { saveRules } from "@/lib/storage";
// import type { RulesConfig } from "@/schemas/rules";

type RuleMode = "domain" | "domain-path";

const App: React.FC = () => {
  const [mode, setMode] = useState<RuleMode>("domain");

  const handleChange = (value: RuleMode) => {
    setMode(value);
    // TODO: 後で chrome.storage.sync に保存する処理を書く
  };

  // const handleSaveRules = async (editedRulesConfig: RulesConfig) => {
  //   await saveRules(editedRulesConfig)
  // }

  return (
    <div style={{ padding: 16, maxWidth: 480 }}>
      <h1 style={{ fontSize: 20, marginBottom: 12 }}>Download Helper 設定</h1>
      <p style={{ fontSize: 13, marginBottom: 16 }}>
        ダウンロード時のフォルダ構成ルールを選択してください。
      </p>

      <label style={{ display: "block", marginBottom: 8 }}>
        <input
          type="radio"
          name="mode"
          value="domain"
          checked={mode === "domain"}
          onChange={() => handleChange("domain")}
        />
        <span style={{ marginLeft: 8 }}>
          ドメインごとにフォルダ分け (example.com/xxx.pdf)
        </span>
      </label>

      <label style={{ display: "block", marginBottom: 8 }}>
        <input
          type="radio"
          name="mode"
          value="domain-path"
          checked={mode === "domain-path"}
          onChange={() => handleChange("domain-path")}
        />
        <span style={{ marginLeft: 8 }}>
          ドメイン＋パス階層で分ける (example.com/path/to/xxx.pdf)
        </span>
      </label>

      <p style={{ fontSize: 12, color: "#666", marginTop: 16 }}>
        ※ 実際の保存先は Edge/Chrome の「ダウンロード」フォルダ配下になります。
      </p>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
