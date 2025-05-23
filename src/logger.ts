import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { LogLevel, LoggerOptions } from './types';

export class Logger {
    private readonly options: LoggerOptions;
    private readonly logFile: string;

    constructor(options: Partial<LoggerOptions> = {}) {
        this.options = {
            level: LogLevel.INFO,
            enableConsole: true,
            enableFile: false,
            ...options
        };
        
        this.logFile = this.options.logFile || path.join(os.homedir(), '.q-copy.log');
    }

    public error(message: string, error?: unknown): void {
        this.log(LogLevel.ERROR, message, error);
    }

    public warn(message: string, data?: any): void {
        this.log(LogLevel.WARN, message, data);
    }

    public info(message: string, data?: any): void {
        this.log(LogLevel.INFO, message, data);
    }

    public debug(message: string, data?: any): void {
        this.log(LogLevel.DEBUG, message, data);
    }

    private log(level: LogLevel, message: string, data?: any): void {
        if (!this.shouldLog(level)) {
            return;
        }

        const timestamp: string = new Date().toISOString();
        const logMessage: string = this.formatMessage(timestamp, level, message, data);

        if (this.options.enableConsole) {
            this.logToConsole(level, logMessage);
        }

        if (this.options.enableFile) {
            this.logToFile(logMessage);
        }
    }

    private shouldLog(level: LogLevel): boolean {
        const levels: LogLevel[] = [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG];
        const currentIndex: number = levels.indexOf(this.options.level);
        const messageIndex: number = levels.indexOf(level);
        return messageIndex <= currentIndex;
    }

    private formatMessage(timestamp: string, level: LogLevel, message: string, data?: any): string {
        let formatted: string = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
        
        if (data !== undefined) {
            if (data instanceof Error) {
                formatted += `\n  Error: ${data.message}`;
                if (data.stack) {
                    formatted += `\n  Stack: ${data.stack}`;
                }
            } else if (typeof data === 'object') {
                formatted += `\n  Data: ${JSON.stringify(data, null, 2)}`;
            } else {
                formatted += `\n  Data: ${String(data)}`;
            }
        }

        return formatted;
    }

    private logToConsole(level: LogLevel, message: string): void {
        switch (level) {
            case LogLevel.ERROR:
                console.error(message);
                break;
            case LogLevel.WARN:
                console.warn(message);
                break;
            case LogLevel.DEBUG:
                console.debug(message);
                break;
            default:
                console.log(message);
        }
    }

    private logToFile(message: string): void {
        try {
            fs.appendFileSync(this.logFile, message + '\n', 'utf8');
        } catch (error) {
            console.error('Failed to write to log file:', error);
        }
    }

    public clearLogFile(): void {
        try {
            if (fs.existsSync(this.logFile)) {
                fs.unlinkSync(this.logFile);
            }
        } catch (error) {
            console.error('Failed to clear log file:', error);
        }
    }

    public getLogFilePath(): string {
        return this.logFile;
    }
}

export const logger: Logger = new Logger();
