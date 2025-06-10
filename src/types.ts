export interface Config {
    filePaths: string[];
    prompt?: string;
    outputFormat?: OutputFormat;
    includeHeaders?: boolean;
}

export interface FileContent {
    path: string;
    content: string;
    size: number;
    lastModified: Date;
}

export interface CopyResult {
    success: boolean;
    filesProcessed: number;
    totalSize: number;
    errors: FileError[];
}

export interface FileError {
    path: string;
    error: string;
    code: string;
}

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}

export interface ParsedRange {
    indices: number[];
    invalidInputs: string[];
}

export enum OutputFormat {
    PLAIN = 'plain',
    MARKDOWN = 'markdown',
    XML = 'xml',
}

export enum LogLevel {
    ERROR = 'error',
    WARN = 'warn',
    INFO = 'info',
    DEBUG = 'debug',
}

export interface LoggerOptions {
    level: LogLevel;
    enableConsole: boolean;
    enableFile: boolean;
    logFile?: string;
}

export interface CLIOptions {
    verbose?: boolean;
    quiet?: boolean;
    format?: OutputFormat;
    headers?: boolean;
}

export type ConfigKeys = keyof Config;

export interface FileStats {
    exists: boolean;
    isFile: boolean;
    isDirectory: boolean;
    size: number;
    lastModified: Date;
}
