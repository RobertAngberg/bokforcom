"use client";

import { AGIGeneratorProps } from "../../../types/types";

// Minimal wrapper: delegating till hooken, ingen affärslogik här.
export default function AGIGenerator(props: AGIGeneratorProps) {
  const hanteraAGI = async () => {
    // This component seems to be a placeholder - the actual AGI generation
    // is handled by the wizard or parent component
    console.log("AGI Generator called with props:", props);
    if (props.onAGIComplete) {
      props.onAGIComplete();
    }
  };

  return { hanteraAGI };
}
