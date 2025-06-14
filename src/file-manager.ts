import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { glob } from 'glob';
import {
    FileContent,
    FileError,
    CopyResult,
    OutputFormat,
    FileStats,
} from './types';
import { FileError as FileErrorClass, PathError } from './errors';
import { Validator } from './validator';
import { logger } from './logger';

export class FileManager {
    private readonly maxFileSize: number = 50 * 1024 * 1024;
    private readonly encoding: BufferEncoding = 'utf8';

    public async readFile(filePath: string): Promise<FileContent> {
        try {
            const normalizedPath: string = this.normalizePath(filePath);

            logger.debug(`Reading file: ${normalizedPath}`);

            Validator.validateFilePath(normalizedPath);

            const stats: FileStats =
                Validator.validateFileExists(normalizedPath);
            if (!stats.exists) {
                throw new PathError('File does not exist', normalizedPath);
            }

            if (!stats.isFile) {
                throw new PathError('Path is not a file', normalizedPath);
            }

            Validator.validateFileReadable(normalizedPath);
            Validator.validateFileSize(normalizedPath, this.maxFileSize);

            const content: string = fs.readFileSync(
                normalizedPath,
                this.encoding
            );

            logger.debug(
                `Successfully read file: ${normalizedPath} (${stats.size} bytes)`
            );

            return {
                path: normalizedPath,
                content,
                size: stats.size,
                lastModified: stats.lastModified,
            };
        } catch (error: unknown) {
            const errorMessage: string =
                error instanceof Error ? error.message : String(error);
            logger.error(`Failed to read file: ${filePath}`, error);
            throw new FileErrorClass(
                `Failed to read file: ${errorMessage}`,
                filePath,
                error
            );
        }
    }

    public async readMultipleFiles(filePaths: string[]): Promise<CopyResult> {
        const fileContents: FileContent[] = [];
        const errors: FileError[] = [];
        let totalSize: number = 0;

        logger.info(`Reading ${filePaths.length} files`);

        for (const filePath of filePaths) {
            try {
                const fileContent: FileContent = await this.readFile(filePath);
                fileContents.push(fileContent);
                totalSize += fileContent.size;
                logger.debug(`Successfully processed: ${filePath}`);
            } catch (error: unknown) {
                const errorMessage: string =
                    error instanceof Error ? error.message : String(error);
                const fileError: FileError = {
                    path: filePath,
                    error: errorMessage,
                    code:
                        error instanceof FileErrorClass
                            ? error.code
                            : 'UNKNOWN_ERROR',
                };
                errors.push(fileError);
                logger.error(`Failed to process file: ${filePath}`, error);
            }
        }

        logger.info(
            `Processed ${fileContents.length} files successfully, ${errors.length} errors`
        );

        return {
            success: errors.length === 0,
            filesProcessed: fileContents.length,
            totalSize,
            errors,
        };
    }

    public formatContent(
        fileContents: FileContent[],
        format: OutputFormat = OutputFormat.PLAIN,
        includeHeaders: boolean = true
    ): string {
        if (fileContents.length === 0) {
            return '';
        }

        logger.debug(`Formatting ${fileContents.length} files as ${format}`);

        switch (format) {
            case OutputFormat.MARKDOWN:
                return this.formatAsMarkdown(fileContents, includeHeaders);
            case OutputFormat.XML:
                return this.formatAsXML(fileContents, includeHeaders);
            case OutputFormat.PLAIN:
            default:
                return this.formatAsPlain(fileContents, includeHeaders);
        }
    }

    public async expandFilePaths(inputs: string[]): Promise<string[]> {
        const expandedPaths: string[] = [];

        for (const input of inputs) {
            try {
                const normalized: string = this.normalizePath(input);
                const stats: FileStats = this.getFileStats(normalized);

                if (stats.exists && stats.isDirectory) {
                    const directoryFiles: string[] =
                        await this.expandDirectory(normalized);
                    expandedPaths.push(...directoryFiles);
                } else if (this.isGlobPattern(input)) {
                    const patternFiles: string[] =
                        await this.expandPattern(input);
                    expandedPaths.push(...patternFiles);
                } else if (stats.exists && stats.isFile) {
                    expandedPaths.push(normalized);
                } else {
                    logger.warn(`Path does not exist: ${input}`);
                }
            } catch (error: unknown) {
                logger.error(`Failed to expand path: ${input}`, error);
            }
        }

        return [...new Set(expandedPaths)];
    }

    public async expandPattern(pattern: string): Promise<string[]> {
        try {
            logger.debug(`Expanding glob pattern: ${pattern}`);

            const matches: string[] = await glob(pattern, {
                absolute: true,
                nodir: true,
                dot: false,
            });

            const validFiles: string[] = [];

            for (const match of matches) {
                try {
                    const stats: FileStats = this.getFileStats(match);
                    if (stats.exists && stats.isFile) {
                        validFiles.push(match);
                    }
                } catch (error: unknown) {
                    logger.warn(`Skipping invalid file from pattern: ${match}`);
                }
            }

            logger.debug(
                `Pattern ${pattern} matched ${validFiles.length} files`
            );
            return validFiles;
        } catch (error: unknown) {
            const errorMessage: string =
                error instanceof Error ? error.message : String(error);
            logger.error(`Failed to expand pattern: ${pattern}`, error);
            throw new PathError(
                `Failed to expand pattern: ${errorMessage}`,
                pattern,
                error
            );
        }
    }

    public async expandDirectory(dirPath: string): Promise<string[]> {
        try {
            logger.debug(`Expanding directory: ${dirPath}`);

            Validator.validateDirectory(dirPath);

            const pattern: string = path.join(dirPath, '**', '*');
            const matches: string[] = await glob(pattern, {
                absolute: true,
                nodir: true,
                dot: false,
            });

            const validFiles: string[] = [];

            for (const match of matches) {
                try {
                    const stats: FileStats = this.getFileStats(match);
                    if (stats.exists && stats.isFile) {
                        validFiles.push(match);
                    }
                } catch (error: unknown) {
                    logger.warn(
                        `Skipping invalid file from directory: ${match}`
                    );
                }
            }

            logger.debug(
                `Directory ${dirPath} contains ${validFiles.length} files`
            );
            return validFiles;
        } catch (error: unknown) {
            const errorMessage: string =
                error instanceof Error ? error.message : String(error);
            logger.error(`Failed to expand directory: ${dirPath}`, error);
            throw new PathError(
                `Failed to expand directory: ${errorMessage}`,
                dirPath,
                error
            );
        }
    }

    public isGlobPattern(input: string): boolean {
        return (
            input.includes('*') ||
            input.includes('?') ||
            input.includes('[') ||
            input.includes('{')
        );
    }

    private formatAsPlain(
        fileContents: FileContent[],
        includeHeaders: boolean
    ): string {
        return fileContents
            .map((file: FileContent) => {
                if (includeHeaders) {
                    const separator: string = '='.repeat(80);
                    return `${separator}\nFile: ${file.path}\nSize: ${file.size} bytes\nLast Modified: ${file.lastModified.toISOString()}\n${separator}\n\n${file.content}`;
                }
                return file.content;
            })
            .join('\n\n');
    }

    private formatAsMarkdown(
        fileContents: FileContent[],
        includeHeaders: boolean
    ): string {
        return fileContents
            .map((file: FileContent) => {
                if (includeHeaders) {
                    const fileName: string = path.basename(file.path);
                    const extension: string = path.extname(file.path).slice(1);
                    return `## ${fileName}\n\n**Path:** \`${file.path}\`  \n**Size:** ${file.size} bytes  \n**Last Modified:** ${file.lastModified.toISOString()}\n\n\`\`\`${extension}\n${file.content}\n\`\`\``;
                }
                return file.content;
            })
            .join('\n\n');
    }

    private formatAsXML(
        fileContents: FileContent[],
        includeHeaders: boolean
    ): string {
        const files: string = fileContents
            .map((file: FileContent) => {
                const escapedPath: string = this.escapeXML(file.path);

                if (includeHeaders) {
                    return `  <file path="${escapedPath}" size="${file.size}" lastModified="${file.lastModified.toISOString()}">\n    <content><![CDATA[${file.content}]]></content>\n  </file>`;
                }
                return `  <file>\n    <content><![CDATA[${file.content}]]></content>\n  </file>`;
            })
            .join('\n');

        return `<?xml version="1.0" encoding="UTF-8"?>\n<files>\n${files}\n</files>`;
    }

    private escapeXML(text: string): string {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

    public normalizePath(filePath: string): string {
        if (!filePath || typeof filePath !== 'string') {
            throw new PathError('Invalid file path', filePath);
        }

        let normalized: string = filePath.trim();

        if (normalized.startsWith('~')) {
            normalized = normalized.replace(/^~(?=$|\/|\\)/, os.homedir());
        }

        return path.resolve(normalized);
    }

    public checkFileAccess(filePath: string): boolean {
        try {
            const normalizedPath: string = this.normalizePath(filePath);
            fs.accessSync(normalizedPath, fs.constants.R_OK);
            return true;
        } catch {
            return false;
        }
    }

    public getFileStats(filePath: string): FileStats {
        return Validator.validateFileExists(this.normalizePath(filePath));
    }
}
