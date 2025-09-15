// Globala konstanter för hela applikationen
// Flytta hit från scattered constants i olika filer

// API routes
export const API_ROUTES = {
  AUTH: "/api/auth",
  FEEDBACK: "/api/feedback",
  IMAGE_PROXY: "/api/image-proxy",
  SEND: "/api/send",
  SEND_LONESPEC: "/api/send-lonespec",
} as const;

// Session konfiguration
export const SESSION_CONFIG = {
  DEFAULT_MAX_AGE: 30 * 24 * 60 * 60, // 30 dagar
  REMEMBER_ME_MAX_AGE: 30 * 24 * 60 * 60, // 30 dagar
  NORMAL_SESSION_MAX_AGE: 24 * 60 * 60, // 24 timmar
} as const;

// Databas konfiguration
export const DB_CONFIG = {
  POOL_ERROR_EVENT: "error",
} as const;

// UI konstanter
export const UI_CONSTANTS = {
  LOADING_SPINNER_DELAY: 100, // ms
  DEBOUNCE_DELAY: 300, // ms för sökningar
  TOAST_DURATION: 3000, // ms
} as const;

// Bokföring konstanter
export const BOKFOR_CONSTANTS = {
  DEFAULT_DATUM: new Date().toISOString().split("T")[0],
  MAX_BELOPP: 999999999,
  MIN_BELOPP: 0.01,
} as const;

// Faktura konstanter
export const FAKTURA_CONSTANTS = {
  DEFAULT_FORFALLODAGAR: 30,
  MAX_PRODUKTER: 50,
  DEFAULT_MOMS: 25, // procent
} as const;
