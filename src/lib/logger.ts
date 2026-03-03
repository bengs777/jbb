/**
 * Lightweight structured logger untuk environment Next.js.
 * Di production: emit JSON lines (ingested by Vercel Log Drains / Logtail / Axiom).
 * Di development: pretty print ke console.
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogPayload {
  level: LogLevel;
  msg: string;
  ts: string;
  [key: string]: unknown;
}

function emit(level: LogLevel, msg: string, meta: Record<string, unknown> = {}) {
  const payload: LogPayload = {
    level,
    msg,
    ts: new Date().toISOString(),
    ...meta,
  };

  if (process.env.NODE_ENV === "production") {
    // JSON lines — structured, easy to parse by log aggregators
    process.stdout.write(JSON.stringify(payload) + "\n");
  } else {
    const prefix = {
      debug: "\x1b[36m[DEBUG]\x1b[0m",
      info: "\x1b[32m[INFO]\x1b[0m",
      warn: "\x1b[33m[WARN]\x1b[0m",
      error: "\x1b[31m[ERROR]\x1b[0m",
    }[level];

    const metaStr = Object.keys(meta).length
      ? " " + JSON.stringify(meta)
      : "";
    console.log(`${prefix} ${payload.ts} ${msg}${metaStr}`);
  }
}

export const logger = {
  debug: (msg: string, meta?: Record<string, unknown>) => emit("debug", msg, meta),
  info: (msg: string, meta?: Record<string, unknown>) => emit("info", msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => emit("warn", msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => emit("error", msg, meta),
};
