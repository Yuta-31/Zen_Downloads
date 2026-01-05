import { useContext } from "react";
import { RulesContext, RulesDispatchContext } from "../components/RulesContext";

export const useRules = () => {
  const context = useContext(RulesContext);
  if (!context) {
    throw new Error("useRules must be used within RulesProvider");
  }
  return context;
};

export const useRulesDispatch = () => {
  const context = useContext(RulesDispatchContext);
  if (!context) {
    throw new Error("useRulesDispatch must be used within RulesProvider");
  }
  return context;
};
