/**
 * @file  utils/logger.ts
 * @desc  Frontend structured logger.
 *
 * - development : colorized console output avec contexte
 * - production  : silencieux sauf erreurs (pour ne pas exposer d'infos)
 *
 * Usage:
 *   import { logger } from '../utils/logger';
 *   logger.info('AuthContext', 'Login successful', { userId });
 */

const IS_DEV = import.meta.env.DEV;

type Level = 'debug' | 'info' | 'warn' | 'error';
type Meta  = Record<string, unknown>;

const COLORS: Record<Level, string> = {
  debug: 'color:#0ea5e9;font-weight:bold',
  info:  'color:#22c55e;font-weight:bold',
  warn:  'color:#f59e0b;font-weight:bold',
  error: 'color:#ef4444;font-weight:bold',
};

function emit(level: Level, context: string, message: string, meta?: Meta) {
  // In production, only log errors
  if (!IS_DEV && level !== 'error') return;

  const ts      = new Date().toLocaleTimeString();
  const label   = `%c[${level.toUpperCase()}]%c [${context}] ${message}`;
  const style   = COLORS[level];
  const reset   = 'color:inherit;font-weight:normal';

  if (meta) {
    console[level === 'debug' ? 'log' : level](label, style, reset, meta);
  } else {
    console[level === 'debug' ? 'log' : level](label, style, reset, `(${ts})`);
  }
}

export const logger = {
  debug: (ctx: string, msg: string, meta?: Meta) => emit('debug', ctx, msg, meta),
  info:  (ctx: string, msg: string, meta?: Meta) => emit('info',  ctx, msg, meta),
  warn:  (ctx: string, msg: string, meta?: Meta) => emit('warn',  ctx, msg, meta),
  error: (ctx: string, msg: string, meta?: Meta) => emit('error', ctx, msg, meta),
};