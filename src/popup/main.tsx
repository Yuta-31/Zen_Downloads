import React from "react";
import ReactDOM from "react-dom/client";

const App: React.FC = () => {
  return (
    <div style={{ padding: 12, width: 260 }}>
      <h1 style={{ fontSize: 18, marginBottom: 8 }}>Download Helper</h1>
      <p style={{ fontSize: 13, marginBottom: 8 }}>
        Automatically organize downloads into folders based on URL.
      </p>
      <p style={{ fontSize: 12, color: "#555" }}>
        Configure detailed rules in the Settings page.
      </p>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
