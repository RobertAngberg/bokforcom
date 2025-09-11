"use client";

import { useState, useEffect } from "react";
import {
  validateAdminSession,
  validateAdminAttempt,
  logAdminSecurityEvent,
  hamtaAdminStatistik,
} from "../_actions/sakerhetsActions";
import type { UseAdminSakerhetReturn } from "../_types/types";

/**
 * 🔥 Enterprise Hook for admin sakerhet
 * - Security validation
 * - Rate limiting
 * - Audit logging
 * - Admin metrics
 */
export function useAdminSakerhet(): UseAdminSakerhetReturn {
  const [adminAttempts] = useState(new Map<string, { attempts: number; lastAttempt: number }>());
  const [adminStats, setAdminStats] = useState<any>(null);
  const [securityLoading, setSecurityLoading] = useState(false);

  // 🚀 Fetch admin statistics on mount
  useEffect(() => {
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    try {
      setSecurityLoading(true);
      const stats = await hamtaAdminStatistik();
      setAdminStats(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
    } finally {
      setSecurityLoading(false);
    }
  };

  return {
    // Security state
    adminAttempts,

    // Actions (re-export for easy access)
    validateAdminSession,
    validateAdminAttempt,
    logAdminSecurityEvent,

    // Additional utilities
    adminStats,
    securityLoading,
    fetchAdminStats,
  };
}
