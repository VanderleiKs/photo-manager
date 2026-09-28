import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
}

export class LoggerService {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private logFile: string | null = null;

  constructor() {
    try {
      const logDir = path.join(app.getPath('userData'), 'logs');
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      this.logFile = path.join(logDir, `app-${new Date().toISOString().split('T')[0]}.log`);
    } catch {
      // Se não conseguir criar arquivo de log, continua com logs em memória
    }
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Escrever no arquivo de log
    if (this.logFile) {
      try {
        const line = `[${entry.timestamp}] [${level.toUpperCase()}] ${message}${context ? ' ' + JSON.stringify(context) : ''}\n`;
        fs.appendFileSync(this.logFile, line);
      } catch {
        // Ignorar erros de escrita
      }
    }

    // Log no console em desenvolvimento
    if (process.env['NODE_ENV'] === 'development') {
      console.log(`[${level.toUpperCase()}] ${message}`, context || '');
    }
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log('warn', message, context);
  }

  error(message: string, context?: Record<string, any>): void {
    this.log('error', message, context);
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clear(): void {
    this.logs = [];
  }
}
