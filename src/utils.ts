import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Config, FileStats } from './types';
import { PathError, FileError } from './errors';
import { logger } from './logger';

export function expandTilde(filePath: string): string {
    if (!filePath || typeof filePath !== 'string') {
        return '';
    }
    
    return filePath.replace(/^~(?=$|\/|\\)/, os.homedir());
}

export function normalizePath(filePath: string): string {
    if (!filePath || typeof filePath !== 'string') {
        throw new PathError('Invalid file path provided', filePath);
    }
    
    const expanded: string = expandTilde(filePath.trim());
    return path.resolve(expanded);
}

export function readConfig(configFile: string): Config {
    logger.warn('Deprecated: readConfig function is deprecated, use ConfigManager instead');
    
    if (!fs.existsSync(configFile)) {
        return { filePaths: [] };
    }

    try {
        const rawData: string = fs.readFileSync(configFile, 'utf8');
        const parsedData: any = JSON.parse(rawData);
        
        return {
            filePaths: Array.isArray(parsedData.filePaths) ? parsedData.filePaths : [],
            prompt: parsedData.prompt || '',
            outputFormat: parsedData.outputFormat,
            includeHeaders: parsedData.includeHeaders
        };
    } catch (error: unknown) {
        logger.error(`Failed to read config file: ${configFile}`, error);
        return { filePaths: [] };
    }
}

export function writeConfig(configFile: string, config: Config): void {
    logger.warn('Deprecated: writeConfig function is deprecated, use ConfigManager instead');
    
    try {
        const configData: string = JSON.stringify(config, null, 2);
        fs.writeFileSync(configFile, configData, 'utf8');
    } catch (error: unknown) {
        const errorMessage: string = error instanceof Error ? error.message : String(error);
        throw new FileError(`Failed to write config file: ${errorMessage}`, configFile, error);
    }
}

export function getFileSize(filePath: string): number {
    try {
        const stats: fs.Stats = fs.statSync(filePath);
        return stats.size;
    } catch (error: unknown) {
        const errorMessage: string = error instanceof Error ? error.message : String(error);
        throw new FileError(`Failed to get file size: ${errorMessage}`, filePath, error);
    }
}

export function getFileStats(filePath: string): FileStats {
    try {
        const normalizedPath: string = normalizePath(filePath);
        const stats: fs.Stats = fs.statSync(normalizedPath);
        
        return {
            exists: true,
            isFile: stats.isFile(),
            isDirectory: stats.isDirectory(),
            size: stats.size,
            lastModified: stats.mtime
        };
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            return {
                exists: false,
                isFile: false,
                isDirectory: false,
                size: 0,
                lastModified: new Date(0)
            };
        }
        
        const errorMessage: string = error instanceof Error ? error.message : String(error);
        throw new FileError(`Failed to get file stats: ${errorMessage}`, filePath, error);
    }
}

export function formatBytes(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return '0 Bytes';

    const k: number = 1024;
    const dm: number = decimals < 0 ? 0 : decimals;
    const sizes: string[] = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

    const i: number = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function formatDuration(milliseconds: number): string {
    if (milliseconds < 1000) {
        return `${milliseconds}ms`;
    }
    
    const seconds: number = Math.floor(milliseconds / 1000);
    const remainingMs: number = milliseconds % 1000;
    
    if (seconds < 60) {
        return remainingMs > 0 ? `${seconds}.${Math.floor(remainingMs / 100)}s` : `${seconds}s`;
    }
    
    const minutes: number = Math.floor(seconds / 60);
    const remainingSeconds: number = seconds % 60;
    
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
}

export function isValidPath(filePath: string): boolean {
    try {
        normalizePath(filePath);
        return true;
    } catch {
        return false;
    }
}

export function ensureDirectoryExists(dirPath: string): void {
    try {
        const normalizedPath: string = normalizePath(dirPath);
        
        if (!fs.existsSync(normalizedPath)) {
            fs.mkdirSync(normalizedPath, { recursive: true });
            logger.debug(`Created directory: ${normalizedPath}`);
        }
    } catch (error: unknown) {
        const errorMessage: string = error instanceof Error ? error.message : String(error);
        throw new FileError(`Failed to ensure directory exists: ${errorMessage}`, dirPath, error);
    }
}

export function getRelativePath(from: string, to: string): string {
    try {
        const normalizedFrom: string = normalizePath(from);
        const normalizedTo: string = normalizePath(to);
        return path.relative(normalizedFrom, normalizedTo);
    } catch (error: unknown) {
        const errorMessage: string = error instanceof Error ? error.message : String(error);
        throw new PathError(`Failed to get relative path: ${errorMessage}`, `${from} -> ${to}`, error);
    }
}

export function sanitizeFileName(fileName: string): string {
    if (!fileName || typeof fileName !== 'string') {
        return 'untitled';
    }
    
    return fileName
        .replace(/[<>:"/\\|?*]/g, '_')
        .replace(/\s+/g, '_')
        .toLowerCase()
        .substring(0, 255);
}
