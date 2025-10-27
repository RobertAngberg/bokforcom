"use client";

import { trackEvent } from "../actions/analyticsActions";

/**
 * Client-side analytics helpers
 */
export const Analytics = {
  // Navigation tracking
  pageView: async (page: string, referrer?: string) => {
    return trackEvent("page_view", { page, referrer }, page);
  },

  // Business events
  transactionCreated: async (amount: number, forvalType?: string) => {
    return trackEvent("transaction_created", { amount, forvalType });
  },

  invoiceCreated: async (amount: number, customerType?: string) => {
    return trackEvent("invoice_created", { amount, customerType });
  },

  salaryProcessed: async (employeeCount: number, totalAmount: number) => {
    return trackEvent("salary_processed", { employeeCount, totalAmount });
  },

  // User actions
  loginSuccess: async () => {
    return trackEvent("login_success");
  },

  featureUsed: async (feature: string, details?: Record<string, unknown>) => {
    return trackEvent("feature_used", { feature, ...details });
  },

  // Navigation helpers
  navigationClick: async (from: string, to: string) => {
    return trackEvent("navigation", { from, to });
  },
};
