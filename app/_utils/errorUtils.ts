export interface AppError {
  message: string;
  code?: string;
  statusCode?: number;
  userId?: string | number;
  context?: Record<string, any>;
}

/**
 * Skapar ett strukturerat fel med context
 */
export function createError(
  message: string,
  options: {
    code?: string;
    statusCode?: number;
    userId?: string | number;
    context?: Record<string, any>;
  } = {}
): AppError {
  return {
    message,
    code: options.code || "GENERIC_ERROR",
    statusCode: options.statusCode || 500,
    userId: options.userId,
    context: options.context,
  };
}

/**
 * Loggar fel med konsistent format
 */
export function logError(error: AppError | Error, operation: string): void {
  const timestamp = new Date().toISOString();

  if ("code" in error) {
    // AppError med extra context
    console.error(`[${timestamp}] ERROR in ${operation}:`, {
      message: error.message,
      code: error.code,
      userId: error.userId,
      context: error.context,
    });
  } else {
    // Standard Error
    const standardError = error as Error;
    console.error(
      `[${timestamp}] ERROR in ${operation}:`,
      standardError.message,
      standardError.stack
    );
  }
}

/**
 * Wrapper för säker async operation med error handling
 */
export async function safeAsync<T>(
  operation: () => Promise<T>,
  context: {
    operationName: string;
    userId?: string | number;
    fallback?: T;
  }
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    const appError = createError(error instanceof Error ? error.message : "Unknown error", {
      code: "SAFE_ASYNC_ERROR",
      userId: context.userId,
      context: { operationName: context.operationName },
    });

    logError(appError, context.operationName);
    return context.fallback ?? null;
  }
}

/**
 * Validerar operation innan execution
 */
export async function withValidation<T>(
  validators: Array<() => boolean | Promise<boolean>>,
  operation: () => Promise<T>,
  errorMessage: string = "Validation failed"
): Promise<T> {
  for (const validator of validators) {
    const isValid = await validator();
    if (!isValid) {
      throw createError(errorMessage, { code: "VALIDATION_ERROR", statusCode: 400 });
    }
  }

  return await operation();
}

/**
 * Retry mechanism för instabila operationer
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown error");

      if (attempt === maxRetries) {
        logError(lastError, `withRetry (failed after ${maxRetries} attempts)`);
        throw lastError;
      }

      // Exponential backoff
      await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
    }
  }

  throw lastError!;
}

/**
 * Performance monitoring wrapper
 */
export async function withPerformanceLog<T>(
  operation: () => Promise<T>,
  operationName: string,
  warnThresholdMs: number = 1000
): Promise<T> {
  const startTime = Date.now();

  try {
    const result = await operation();
    const duration = Date.now() - startTime;

    if (duration > warnThresholdMs) {
      console.warn(`⚠️ Slow operation: ${operationName} took ${duration}ms`);
    } else {
      console.log(`✅ ${operationName} completed in ${duration}ms`);
    }

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ ${operationName} failed after ${duration}ms:`, error);
    throw error;
  }
}
