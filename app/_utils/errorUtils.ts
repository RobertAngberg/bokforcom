export interface AppError {
  message: string;
  code?: string;
  statusCode?: number;
  userId?: string | number;
  context?: Record<string, unknown>;
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
    context?: Record<string, unknown>;
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
