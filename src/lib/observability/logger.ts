import "server-only";

type LogLevel = "debug" | "info" | "warn" | "error";

type LogContext = Record<string, unknown>;

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const resolveMinLevel = (): LogLevel => {
  const configured = (process.env.LOG_LEVEL || "").toLowerCase();
  if (configured in LEVEL_ORDER) return configured as LogLevel;
  return process.env.NODE_ENV === "production" ? "info" : "debug";
};

const minLevel = resolveMinLevel();

const serializeError = (error: unknown): LogContext => {
  if (error instanceof Error) {
    return {
      errorName: error.name,
      errorMessage: error.message,
      ...(process.env.NODE_ENV !== "production" && error.stack
        ? { errorStack: error.stack }
        : {}),
    };
  }
  return { errorMessage: String(error) };
};

// Emite una línea JSON por evento: formato que Azure App Service / Container Apps
// y Application Insights ingieren directamente desde stdout/stderr.
const emit = (level: LogLevel, message: string, context?: LogContext): void => {
  if (LEVEL_ORDER[level] < LEVEL_ORDER[minLevel]) return;

  const entry = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    app: "argos-portal",
    ...context,
  });

  if (level === "error") {
    console.error(entry);
  } else if (level === "warn") {
    console.warn(entry);
  } else {
    console.log(entry);
  }
};

export const logger = {
  debug: (message: string, context?: LogContext) => emit("debug", message, context),
  info: (message: string, context?: LogContext) => emit("info", message, context),
  warn: (message: string, context?: LogContext) => emit("warn", message, context),
  error: (message: string, errorOrContext?: unknown, context?: LogContext) => {
    if (errorOrContext instanceof Error || typeof errorOrContext === "string") {
      emit("error", message, { ...serializeError(errorOrContext), ...context });
    } else {
      emit("error", message, { ...(errorOrContext as LogContext | undefined), ...context });
    }
  },
};
