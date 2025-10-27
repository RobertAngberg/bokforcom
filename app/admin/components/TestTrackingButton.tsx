"use client";

import { Analytics } from "../lib/analyticsClient";
import { useState } from "react";

export default function TestTrackingButton() {
  const [loading, setLoading] = useState(false);

  const testEvents = [
    () => Analytics.pageView("/test-page"),
    () => Analytics.transactionCreated(1500, "test-förval"),
    () => Analytics.invoiceCreated(2500, "test-customer"),
    () => Analytics.featureUsed("admin-panel", { section: "testing" }),
    () => Analytics.loginSuccess(),
  ];

  const handleTest = async () => {
    setLoading(true);
    try {
      // Send a few test events
      await Promise.all([
        Analytics.pageView("/admin/test"),
        Analytics.featureUsed("test-button", { timestamp: Date.now() }),
        Analytics.transactionCreated(Math.floor(Math.random() * 5000), "test-transaction"),
      ]);

      alert("Test events sent! Check the analytics dashboard.");
    } catch (error) {
      alert("Error sending test events");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRandomTest = async () => {
    setLoading(true);
    try {
      const randomEvent = testEvents[Math.floor(Math.random() * testEvents.length)];
      await randomEvent();
      alert("Random test event sent!");
    } catch (error) {
      alert("Error sending random test event");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={handleTest}
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded text-sm"
      >
        {loading ? "..." : "Send Test Events"}
      </button>
      <button
        onClick={handleRandomTest}
        disabled={loading}
        className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded text-sm"
      >
        Random Event
      </button>
    </div>
  );
}
