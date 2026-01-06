import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import RuleList from "./components/RuleList/RuleList";
import { RulePreviewCard } from "./components/Preview/Preview";
import { RulesProvider } from "./components/RulesContext";

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-stone-800 mb-2">
            Download Helper - Settings
          </h1>
          <p className="text-stone-600">
            Manage rules for automatically organizing download file destinations
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Rule List */}
          <section>
            <RuleList />
          </section>

          {/* Right: Preview */}
          <section>
            <RulePreviewCard />
          </section>
        </div>
      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <RulesProvider>
    <App />
  </RulesProvider>
);
