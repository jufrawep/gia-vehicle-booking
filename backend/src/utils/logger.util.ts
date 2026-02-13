/**
 * @file   logger.util.ts
 * @desc   GIA Vehicle Booking — Centralized Structured Logging Utility
 *
 * @design  Strategy pattern: a single `log()` dispatcher routes output to the
 *          correct channel based on severity level. To migrate to Winston or
 *          Pino in the future, only this file needs to change — zero controller
 *          modifications required.
 *
 * @modes
 *   development  → Colorized, human-readable text with timestamps
 *   production   → Newline-delimited JSON (compatible with Datadog, Loki, etc.)
 *
 * @env   NODE_ENV   — 'development' | 'production' | 'test'
 * @env   LOG_LEVEL  — Minimum severity to output. Default: 'info'
 *                     Values: 'debug' | 'info' | 'warn' | 'error'
 */

import { Request, Response, NextFunction } from 'express';

// ─── Level Hierarchy ──────────────────────────────────────────────────────────

/** Numeric severity map. Higher = more critical. */
const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 } as const;
type Level  = keyof typeof LEVELS;

// ─── ANSI Color Palette (development only) ────────────────────────────────────
const C = {
  reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m',
  debug: '\x1b[36m',  // Cyan
  info:  '\x1b[32m',  // Green
  warn:  '\x1b[33m',  // Yellow
  error: '\x1b[31m',  // Red
  ctx:   '\x1b[35m',  // Magenta (context tag)
} as const;

// ─── Runtime Config ───────────────────────────────────────────────────────────
const IS_PROD    = process.env.NODE_ENV === 'production';
const MIN_LEVEL  = (process.env.LOG_LEVEL as Level | undefined) ?? 'info';
const MIN_NUM    = LEVELS[MIN_LEVEL] ?? LEVELS.info;

// ─── Core Dispatcher ─────────────────────────────────────────────────────────

type Meta = Record<string, unknown>;

/**
 * Formats and dispatches a single structured log entry.
 *
 * @param level    - Severity (debug | info | warn | error)
 * @param context  - Source identifier, e.g. 'BookingController', 'AuthMiddleware'
 * @param message  - Human-readable description of the event
 * @param meta     - Optional key/value metadata (IDs, durations, payloads)
 */
function emit(level: Level, context: string, message: string, meta?: Meta): void {
  if (LEVELS[level] < MIN_NUM) return; // respect threshold

  const ts = new Date().toISOString();

  if (IS_PROD) {
    // ── Production: Newline-delimited JSON ────────────────────────────────────
    const entry = { level, ts, context, message, ...(meta && { meta }) };
    const out   = level === 'error' ? process.stderr : process.stdout;
    out.write(JSON.stringify(entry) + '\n');
  } else {
    // ── Development: Colorized Text ───────────────────────────────────────────
    const tag      = `${C[level]}${C.bold}[${level.toUpperCase().padEnd(5)}]${C.reset}`;
    const timeTag  = `${C.dim}${ts}${C.reset}`;
    const ctxTag   = `${C.ctx}[${context}]${C.reset}`;
    const metaStr  = meta ? ` ${C.dim}${JSON.stringify(meta)}${C.reset}` : '';
    const line     = `${timeTag} ${tag} ${ctxTag} ${message}${metaStr}`;

    if (level === 'error') process.stderr.write(line + '\n');
    else                   process.stdout.write(line + '\n');
  }
}

// ─── Public Logger API ────────────────────────────────────────────────────────

export const logger = {
  /**
   * Fine-grained diagnostics. Never log PII or secrets here.
   * Only visible when LOG_LEVEL=debug.
   */
  debug: (ctx: string, msg: string, meta?: Meta) => emit('debug', ctx, msg, meta),

  /**
   * Standard operational events confirming expected behavior.
   * e.g. "Booking CONFIRMED", "User authenticated"
   */
  info:  (ctx: string, msg: string, meta?: Meta) => emit('info',  ctx, msg, meta),

  /**
   * Potential issues that don't halt execution but signal degradation.
   * e.g. "Email SMTP unavailable — skipping notification"
   */
  warn:  (ctx: string, msg: string, meta?: Meta) => emit('warn',  ctx, msg, meta),

  /**
   * Unrecoverable failures requiring immediate attention.
   * e.g. "Database connection refused"
   */
  error: (ctx: string, msg: string, meta?: Meta) => emit('error', ctx, msg, meta),
};

// ─── HTTP Request Logger (Express Middleware) ─────────────────────────────────

/**
 * Express middleware that logs every inbound HTTP request and its resolution.
 * Uses high-resolution monotonic clock (process.hrtime.bigint) for sub-ms accuracy.
 *
 * Logged fields: method, url, statusCode, durationMs, ip, userAgent
 *
 * Level heuristics:
 *   5xx → error
 *   4xx → warn
 *   2xx/3xx → info
 */
export const httpLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = process.hrtime.bigint();

  // Intercept res.end() to capture final status code AFTER the handler runs
  const originalEnd = res.end.bind(res);
  (res as any).end = (...args: unknown[]) => {
    const ms: number = Number(process.hrtime.bigint() - start) / 1_000_000;

    const lvl: Level = res.statusCode >= 500 ? 'error'
                     : res.statusCode >= 400 ? 'warn'
                     : 'info';

    emit(lvl, 'HTTP', `${req.method} ${req.originalUrl}`, {
      status:     res.statusCode,
      durationMs: parseFloat(ms.toFixed(2)),
      ip:         req.ip,
      userAgent:  (req.headers['user-agent'] ?? '').substring(0, 80),
    });

    return originalEnd(...(args as Parameters<typeof originalEnd>));
  };

  next();
};