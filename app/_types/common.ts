// === GEMENSAMMA TYPES FÖR HELA APPLIKATIONEN ===

// === AUTH TYPES ===
export interface AnvandarInfo {
  id: string;
  email: string;
  name: string;
  skapad?: string;
  uppdaterad?: string;
  provider?: string;
}

export interface AktionsResultat<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  user?: AnvandarInfo;
}

// === COMMON API TYPES ===
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// === DATABASE TYPES ===
export type UserId = string; // Better Auth använder UUID strings

// === ERROR HANDLING ===
export interface ErrorResult {
  success: false;
  error: string;
}

export interface SuccessResult<T = unknown> {
  success: true;
  data?: T;
}

export type ActionResult<T = unknown> = ErrorResult | SuccessResult<T>;
