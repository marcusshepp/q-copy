import * as fs from 'fs';
import * as path from 'path';
import { Config, ValidationResult, OutputFormat, FileStats } from './types';
import { ValidationError, PathError } from './errors';

export class Validator {
    public static validateConfig(config: any): ValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        if (!config || typeof config !== 'object') {
            errors.push('Config must be an object');
            return { isValid: false, errors, warnings };
        }

        if (!Array.isArray(config.filePaths)) {
            errors.push('filePaths must be an array');
        } else {
            if (config.filePaths.length === 0) {
                warnings.push('No file paths configured');
            }

            config.filePaths.forEach((filePath: any, index: number) => {
                if (typeof filePath !== 'string') {
                    errors.push(`File path at index ${index} must be a string`);
                } else if (filePath.trim().length === 0) {
                    errors.push(`File path at index ${index} cannot be empty`);
                }
            });
        }

        if (config.prompt !== undefined && typeof config.prompt !== 'string') {
            errors.push('prompt must be a string');
        }

        if (config.outputFormat !== undefined) {
            if (!Object.values(OutputFormat).includes(config.outputFormat)) {
                errors.push(
                    `outputFormat must be one of: ${Object.values(OutputFormat).join(', ')}`
                );
            }
        }

        if (
            config.includeHeaders !== undefined &&
            typeof config.includeHeaders !== 'boolean'
        ) {
            errors.push('includeHeaders must be a boolean');
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
        };
    }

    public static validateFilePath(filePath: string): void {
        if (!filePath || typeof filePath !== 'string') {
            throw new ValidationError(
                'File path must be a non-empty string',
                'filePath'
            );
        }

        if (filePath.trim().length === 0) {
            throw new ValidationError('File path cannot be empty', 'filePath');
        }

        const invalidChars: string[] = ['<', '>', ':', '"', '|', '?', '*'];
        const hasInvalidChars: boolean = invalidChars.some((char) =>
            filePath.includes(char)
        );

        if (hasInvalidChars) {
            throw new PathError(
                `File path contains invalid characters: ${invalidChars.join(', ')}`,
                filePath
            );
        }
    }

    public static validateGlobPattern(pattern: string): void {
        if (!pattern || typeof pattern !== 'string') {
            throw new ValidationError(
                'Glob pattern must be a non-empty string',
                'pattern'
            );
        }

        if (pattern.trim().length === 0) {
            throw new ValidationError(
                'Glob pattern cannot be empty',
                'pattern'
            );
        }

        const invalidPatterns: string[] = ['**/**/**', '***'];
        if (invalidPatterns.some((invalid) => pattern.includes(invalid))) {
            throw new PathError('Invalid glob pattern syntax', pattern);
        }

        if (pattern.includes('..')) {
            throw new PathError(
                'Glob pattern cannot contain parent directory references',
                pattern
            );
        }
    }

    public static validatePathInput(input: string): void {
        if (!input || typeof input !== 'string') {
            throw new ValidationError(
                'Path input must be a non-empty string',
                'input'
            );
        }

        if (input.trim().length === 0) {
            throw new ValidationError('Path input cannot be empty', 'input');
        }

        const trimmed: string = input.trim();

        if (this.isGlobPattern(trimmed)) {
            this.validateGlobPattern(trimmed);
        } else {
            const invalidChars: string[] = ['<', '>', ':', '"', '|'];
            const hasInvalidChars: boolean = invalidChars.some((char) =>
                trimmed.includes(char)
            );

            if (hasInvalidChars) {
                throw new PathError(
                    `Path input contains invalid characters: ${invalidChars.join(', ')}`,
                    trimmed
                );
            }
        }
    }

    public static isGlobPattern(input: string): boolean {
        return (
            input.includes('*') ||
            input.includes('?') ||
            input.includes('[') ||
            input.includes('{')
        );
    }

    public static validateFileExists(filePath: string): FileStats {
        try {
            const stats: fs.Stats = fs.statSync(filePath);
            return {
                exists: true,
                isFile: stats.isFile(),
                isDirectory: stats.isDirectory(),
                size: stats.size,
                lastModified: stats.mtime,
            };
        } catch (error: any) {
            if (error.code === 'ENOENT') {
                return {
                    exists: false,
                    isFile: false,
                    isDirectory: false,
                    size: 0,
                    lastModified: new Date(0),
                };
            }
            throw new PathError(
                `Failed to check file stats: ${error.message}`,
                filePath,
                error
            );
        }
    }

    public static validateFileReadable(filePath: string): void {
        try {
            fs.accessSync(filePath, fs.constants.R_OK);
        } catch (error: any) {
            throw new PathError(
                `File is not readable: ${error.message}`,
                filePath,
                error
            );
        }
    }

    public static validateDirectory(dirPath: string): void {
        const stats: FileStats = this.validateFileExists(dirPath);

        if (!stats.exists) {
            throw new PathError('Directory does not exist', dirPath);
        }

        if (!stats.isDirectory) {
            throw new PathError('Path is not a directory', dirPath);
        }
    }

    public static validateDirectoryReadable(dirPath: string): void {
        try {
            fs.accessSync(dirPath, fs.constants.R_OK);
        } catch (error: any) {
            throw new PathError(
                `Directory is not readable: ${error.message}`,
                dirPath,
                error
            );
        }
    }

    public static validateFileSize(
        filePath: string,
        maxSizeBytes: number = 50 * 1024 * 1024
    ): void {
        const stats: FileStats = this.validateFileExists(filePath);

        if (!stats.exists) {
            throw new PathError('File does not exist', filePath);
        }

        if (stats.size > maxSizeBytes) {
            const maxSizeMB: number = Math.round(maxSizeBytes / (1024 * 1024));
            const fileSizeMB: number = Math.round(stats.size / (1024 * 1024));
            throw new PathError(
                `File size (${fileSizeMB}MB) exceeds maximum allowed size (${maxSizeMB}MB)`,
                filePath
            );
        }
    }

    public static sanitizeFilePath(filePath: string): string {
        if (!filePath || typeof filePath !== 'string') {
            return '';
        }

        return path.normalize(filePath.trim());
    }

    public static validateConfigStructure(config: Config): void {
        const validation: ValidationResult = this.validateConfig(config);

        if (!validation.isValid) {
            throw new ValidationError(
                `Invalid configuration: ${validation.errors.join(', ')}`,
                'config'
            );
        }
    }

    public static validateInputArray(inputs: string[]): void {
        if (!Array.isArray(inputs)) {
            throw new ValidationError('Inputs must be an array', 'inputs');
        }

        if (inputs.length === 0) {
            throw new ValidationError(
                'At least one input must be provided',
                'inputs'
            );
        }

        inputs.forEach((input: string, index: number) => {
            try {
                this.validatePathInput(input);
            } catch (error: unknown) {
                if (
                    error instanceof ValidationError ||
                    error instanceof PathError
                ) {
                    throw new ValidationError(
                        `Input at index ${index}: ${error.message}`,
                        'inputs'
                    );
                }
                throw error;
            }
        });
    }
}
