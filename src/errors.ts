export class QCopyError extends Error {
    public readonly code: string;
    public readonly details?: any;

    constructor(message: string, code: string, details?: any) {
        super(message);
        this.name = 'QCopyError';
        this.code = code;
        this.details = details;
        Error.captureStackTrace(this, QCopyError);
    }
}

export class ConfigError extends QCopyError {
    constructor(message: string, details?: any) {
        super(message, 'CONFIG_ERROR', details);
        this.name = 'ConfigError';
    }
}

export class FileError extends QCopyError {
    public readonly filePath: string;

    constructor(message: string, filePath: string, details?: any) {
        super(message, 'FILE_ERROR', details);
        this.name = 'FileError';
        this.filePath = filePath;
    }
}

export class ValidationError extends QCopyError {
    public readonly field: string;

    constructor(message: string, field: string, details?: any) {
        super(message, 'VALIDATION_ERROR', details);
        this.name = 'ValidationError';
        this.field = field;
    }
}

export class ClipboardError extends QCopyError {
    constructor(message: string, details?: any) {
        super(message, 'CLIPBOARD_ERROR', details);
        this.name = 'ClipboardError';
    }
}

export class PathError extends QCopyError {
    public readonly path: string;

    constructor(message: string, path: string, details?: any) {
        super(message, 'PATH_ERROR', details);
        this.name = 'PathError';
        this.path = path;
    }
}

export function isQCopyError(error: unknown): error is QCopyError {
    return error instanceof QCopyError;
}

export function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
}

export function getErrorCode(error: unknown): string {
    if (isQCopyError(error)) {
        return error.code;
    }
    return 'UNKNOWN_ERROR';
}
