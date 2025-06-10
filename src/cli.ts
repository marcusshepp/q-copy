import { Command } from 'commander';
import clipboard from 'clipboardy';
import { ConfigManager } from './config';
import { FileManager } from './file-manager';
import { logger } from './logger';
import { RangeParser } from './range-parser';
import {
    Config,
    OutputFormat,
    CopyResult,
    FileContent,
    CLIOptions,
} from './types';
import { QCopyError, ClipboardError } from './errors';
import { formatBytes, formatDuration } from './utils';

export class CLI {
    private readonly program: Command = new Command();
    private readonly configManager: ConfigManager = new ConfigManager();
    private readonly fileManager: FileManager = new FileManager();

    constructor() {
        this.setupCommands();
    }

    public async run(argv: string[]): Promise<void> {
        try {
            await this.program.parseAsync(argv);
        } catch (error: unknown) {
            this.handleError(error);
            process.exit(1);
        }
    }

    private setupCommands(): void {
        this.program
            .name('q-copy')
            .description(
                'Copy file contents to clipboard and manage file paths'
            )
            .version('1.0.0')
            .option('-v, --verbose', 'Enable verbose output')
            .option('-q, --quiet', 'Suppress non-error output')
            .option(
                '-f, --format <format>',
                'Output format (plain, markdown, xml)',
                'plain'
            )
            .option('--no-headers', 'Exclude file headers from output')
            .hook('preAction', this.setupLogging.bind(this));

        this.program
            .command('copy', { isDefault: true })
            .description('Copy configured file contents to clipboard')
            .action(this.copyAction.bind(this));

        this.program
            .command('ls')
            .alias('list')
            .description('List current file paths')
            .action(this.listAction.bind(this));

        this.program
            .command('add <paths...>')
            .alias('a')
            .description('Add file paths, glob patterns, or directories')
            .action(this.addAction.bind(this));

        this.program
            .command('rm <identifiers...>')
            .alias('remove')
            .description(
                'Remove file paths by indices (1-based), ranges (1-5), or full paths'
            )
            .action(this.removeAction.bind(this));

        this.program
            .command('validate')
            .description(
                'Validate current configuration and file accessibility'
            )
            .action(this.validateAction.bind(this));

        this.program
            .command('config')
            .description('Show configuration file path and status')
            .action(this.configAction.bind(this));

        this.program
            .command('reset')
            .description('Reset configuration to defaults')
            .action(this.resetAction.bind(this));
    }

    private setupLogging(thisCommand: Command): void {
        const options: CLIOptions = thisCommand.optsWithGlobals();

        if (options.verbose) {
            logger.info('Verbose mode enabled');
        }

        if (options.quiet) {
            logger.info('Quiet mode enabled');
        }
    }

    private async copyAction(): Promise<void> {
        const startTime: number = Date.now();
        const options: CLIOptions = this.program.optsWithGlobals();

        try {
            const config: Config = this.configManager.loadConfig();

            if (config.filePaths.length === 0) {
                this.logMessage(
                    'No file paths configured. Use `q-copy add <path>` to add files.',
                    options
                );
                process.exit(1);
            }

            const outputFormat: OutputFormat = this.parseOutputFormat(
                options.format || 'plain'
            );
            const includeHeaders: boolean = options.headers !== false;

            this.logMessage(
                `Copying ${config.filePaths.length} files...`,
                options,
                true
            );

            const copyResult: CopyResult =
                await this.fileManager.readMultipleFiles(config.filePaths);

            if (copyResult.errors.length > 0) {
                this.logMessage(
                    `Warning: ${copyResult.errors.length} files could not be read:`,
                    options
                );
                copyResult.errors.forEach((error) => {
                    this.logMessage(`  ${error.path}: ${error.error}`, options);
                });
            }

            if (copyResult.filesProcessed === 0) {
                this.logMessage('No files were successfully read.', options);
                process.exit(1);
            }

            const fileContents: FileContent[] = [];
            for (const filePath of config.filePaths) {
                try {
                    const content: FileContent =
                        await this.fileManager.readFile(filePath);
                    fileContents.push(content);
                } catch (error) {
                    continue;
                }
            }

            const formattedContent: string = this.fileManager.formatContent(
                fileContents,
                outputFormat,
                includeHeaders
            );

            try {
                await clipboard.write(formattedContent);
            } catch (error: unknown) {
                const errorMessage: string =
                    error instanceof Error ? error.message : String(error);
                throw new ClipboardError(
                    `Failed to write to clipboard: ${errorMessage}`,
                    error
                );
            }

            const duration: number = Date.now() - startTime;
            const totalSize: string = formatBytes(copyResult.totalSize);
            const durationFormatted: string = formatDuration(duration);

            this.logMessage(
                `✓ Copied ${copyResult.filesProcessed} files (${totalSize}) to clipboard in ${durationFormatted}`,
                options
            );
        } catch (error: unknown) {
            this.handleError(error);
            process.exit(1);
        }
    }

    private listAction(): void {
        const options: CLIOptions = this.program.optsWithGlobals();

        try {
            const config: Config = this.configManager.loadConfig();

            if (config.filePaths.length === 0) {
                this.logMessage('No file paths configured.', options);
                return;
            }

            this.logMessage(
                `Found ${config.filePaths.length} configured file(s):`,
                options
            );

            config.filePaths.forEach((filePath: string, index: number) => {
                const stats = this.fileManager.getFileStats(filePath);
                const status: string = stats.exists
                    ? stats.isFile
                        ? '✓'
                        : '⚠ (not a file)'
                    : '✗ (not found)';
                const size: string =
                    stats.exists && stats.isFile
                        ? ` (${formatBytes(stats.size)})`
                        : '';

                this.logMessage(
                    `${index + 1}: ${filePath} ${status}${size}`,
                    options
                );
            });
        } catch (error: unknown) {
            this.handleError(error);
            process.exit(1);
        }
    }

    private async addAction(paths: string[]): Promise<void> {
        const options: CLIOptions = this.program.optsWithGlobals();

        try {
            const startTime: number = Date.now();

            this.logMessage(
                `Processing ${paths.length} input(s)...`,
                options,
                true
            );

            const initialConfig: Config = this.configManager.loadConfig();
            const initialCount: number = initialConfig.filePaths.length;

            await this.configManager.addFilePaths(paths);

            const finalConfig: Config = this.configManager.loadConfig();
            const finalCount: number = finalConfig.filePaths.length;
            const addedCount: number = finalCount - initialCount;

            const duration: number = Date.now() - startTime;
            const durationFormatted: string = formatDuration(duration);

            if (addedCount > 0) {
                this.logMessage(
                    `✓ Added ${addedCount} file(s) in ${durationFormatted}`,
                    options
                );

                if (options.verbose) {
                    this.logMessage('Processing summary:', options, true);
                    for (const input of paths) {
                        if (this.fileManager.isGlobPattern(input)) {
                            this.logMessage(
                                `  Pattern: ${input}`,
                                options,
                                true
                            );
                        } else {
                            const stats = this.fileManager.getFileStats(
                                this.fileManager.normalizePath(input)
                            );
                            if (stats.exists && stats.isDirectory) {
                                this.logMessage(
                                    `  Directory: ${input}`,
                                    options,
                                    true
                                );
                            } else {
                                this.logMessage(
                                    `  File: ${input}`,
                                    options,
                                    true
                                );
                            }
                        }
                    }
                }
            } else {
                this.logMessage(
                    'No new files were added (files may already exist or no matches found)',
                    options
                );
            }
        } catch (error: unknown) {
            this.handleError(error);
            process.exit(1);
        }
    }

    private removeAction(identifiers: string[]): void {
        const options: CLIOptions = this.program.optsWithGlobals();

        try {
            const config: Config = this.configManager.loadConfig();

            if (config.filePaths.length === 0) {
                this.logMessage('No file paths configured to remove.', options);
                return;
            }

            const { numbers, paths } =
                RangeParser.separateNumbersAndPaths(identifiers);
            let totalRemoved: number = 0;
            const removedItems: string[] = [];

            if (numbers.length > 0) {
                const parseResult = RangeParser.parseNumberRanges(numbers);

                if (parseResult.invalidInputs.length > 0) {
                    this.logMessage(
                        `Invalid number inputs: ${parseResult.invalidInputs.join(', ')}`,
                        options
                    );
                }

                if (parseResult.indices.length > 0) {
                    const validIndices: number[] = parseResult.indices.filter(
                        (index) => index > 0 && index <= config.filePaths.length
                    );

                    const invalidIndices: number[] = parseResult.indices.filter(
                        (index) => index <= 0 || index > config.filePaths.length
                    );

                    if (invalidIndices.length > 0) {
                        this.logMessage(
                            `Invalid indices (out of range): ${invalidIndices.join(', ')}`,
                            options
                        );
                    }

                    if (validIndices.length > 0) {
                        const removedByIndices: string[] =
                            this.configManager.removeFilePathsByIndices(
                                validIndices
                            );
                        totalRemoved += removedByIndices.length;
                        removedByIndices.forEach((path: string, i: number) => {
                            removedItems.push(`${validIndices[i]}: ${path}`);
                        });
                    }
                }
            }

            for (const path of paths) {
                const success: boolean =
                    this.configManager.removeFilePath(path);
                if (success) {
                    removedItems.push(path);
                    totalRemoved++;
                } else {
                    this.logMessage(`File path not found: ${path}`, options);
                }
            }

            if (totalRemoved > 0) {
                this.logMessage(
                    `Removed ${totalRemoved} file path(s):`,
                    options
                );
                removedItems.forEach((item: string) => {
                    this.logMessage(`  ${item}`, options);
                });
            } else {
                this.logMessage('No file paths were removed.', options);
            }
        } catch (error: unknown) {
            this.handleError(error);
            process.exit(1);
        }
    }

    private validateAction(): void {
        const options: CLIOptions = this.program.optsWithGlobals();

        try {
            this.logMessage('Validating configuration...', options, true);
            this.configManager.validateCurrentConfig();
            this.logMessage('✓ Configuration is valid.', options);
        } catch (error: unknown) {
            this.handleError(error);
            process.exit(1);
        }
    }

    private configAction(): void {
        const options: CLIOptions = this.program.optsWithGlobals();

        try {
            const configPath: string = this.configManager.getConfigPath();
            const exists: boolean = this.configManager.configExists();
            const config: Config = this.configManager.getConfig();

            this.logMessage(`Configuration file: ${configPath}`, options);
            this.logMessage(
                `Status: ${exists ? 'exists' : 'not found'}`,
                options
            );
            this.logMessage(`File paths: ${config.filePaths.length}`, options);
            this.logMessage(
                `Output format: ${config.outputFormat || 'plain'}`,
                options
            );
            this.logMessage(
                `Include headers: ${config.includeHeaders !== false}`,
                options
            );
        } catch (error: unknown) {
            this.handleError(error);
            process.exit(1);
        }
    }

    private resetAction(): void {
        const options: CLIOptions = this.program.optsWithGlobals();

        try {
            this.configManager.resetConfig();
            this.logMessage('Configuration reset to defaults.', options);
        } catch (error: unknown) {
            this.handleError(error);
            process.exit(1);
        }
    }

    private parseOutputFormat(format: string): OutputFormat {
        const normalizedFormat: string = format.toLowerCase();

        switch (normalizedFormat) {
            case 'markdown':
            case 'md':
                return OutputFormat.MARKDOWN;
            case 'xml':
                return OutputFormat.XML;
            case 'plain':
            case 'text':
            default:
                return OutputFormat.PLAIN;
        }
    }

    private logMessage(
        message: string,
        options: CLIOptions,
        isVerbose: boolean = false
    ): void {
        if (options.quiet) {
            return;
        }

        if (isVerbose && !options.verbose) {
            return;
        }

        console.log(message);
    }

    private handleError(error: unknown): void {
        if (error instanceof QCopyError) {
            console.error(`Error: ${error.message}`);
            if (error.details) {
                logger.error('Error details', error.details);
            }
        } else if (error instanceof Error) {
            console.error(`Unexpected error: ${error.message}`);
            logger.error('Unexpected error', error);
        } else {
            console.error(`Unknown error: ${String(error)}`);
            logger.error('Unknown error', error);
        }
    }
}
