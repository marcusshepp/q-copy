import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { Config, OutputFormat } from './types';
import { ConfigError } from './errors';
import { Validator } from './validator';
import { FileManager } from './file-manager';
import { logger } from './logger';

export class ConfigManager {
    private readonly configFile: string = path.join(
        os.homedir(),
        '.q-copy.json'
    );
    private readonly fileManager: FileManager = new FileManager();
    private config: Config | null = null;

    public loadConfig(): Config {
        try {
            logger.debug(`Loading configuration from: ${this.configFile}`);

            if (fs.existsSync(this.configFile)) {
                const config: Config = this.loadFromFile();
                this.validateAndCache(config);
                return config;
            }

            logger.info(
                'Config file not found, attempting to load from environment'
            );
            const config: Config = this.loadFromEnvironment();
            this.validateAndCache(config);
            return config;
        } catch (error: unknown) {
            const errorMessage: string =
                error instanceof Error ? error.message : String(error);
            logger.error('Failed to load configuration', error);
            throw new ConfigError(
                `Failed to load configuration: ${errorMessage}`,
                error
            );
        }
    }

    public saveConfig(config: Config): void {
        try {
            logger.debug(`Saving configuration to: ${this.configFile}`);

            Validator.validateConfigStructure(config);

            const normalizedConfig: Config = this.normalizeConfig(config);
            const configData: string = JSON.stringify(
                normalizedConfig,
                null,
                2
            );

            const configDir: string = path.dirname(this.configFile);
            if (!fs.existsSync(configDir)) {
                fs.mkdirSync(configDir, { recursive: true });
            }

            fs.writeFileSync(this.configFile, configData, 'utf8');
            this.config = normalizedConfig;

            logger.info('Configuration saved successfully');
        } catch (error: unknown) {
            const errorMessage: string =
                error instanceof Error ? error.message : String(error);
            logger.error('Failed to save configuration', error);
            throw new ConfigError(
                `Failed to save configuration: ${errorMessage}`,
                error
            );
        }
    }

    public async addFilePaths(inputs: string[]): Promise<void> {
        const config: Config = this.loadConfig();

        logger.debug(`Adding file paths from inputs: ${inputs.join(', ')}`);

        const expandedPaths: string[] =
            await this.fileManager.expandFilePaths(inputs);

        if (expandedPaths.length === 0) {
            logger.warn('No valid files found from inputs');
            return;
        }

        let addedCount: number = 0;

        for (const filePath of expandedPaths) {
            try {
                Validator.validateFilePath(filePath);

                if (!config.filePaths.includes(filePath)) {
                    config.filePaths.push(filePath);
                    addedCount++;
                    logger.debug(`Added file path: ${filePath}`);
                } else {
                    logger.debug(`File path already exists: ${filePath}`);
                }
            } catch (error: unknown) {
                logger.warn(`Skipping invalid file path: ${filePath}`, error);
            }
        }

        if (addedCount > 0) {
            this.saveConfig(config);
            logger.info(
                `Added ${addedCount} new file paths from ${inputs.length} inputs`
            );
        } else {
            logger.info('No new file paths added');
        }
    }

    public addFilePath(filePath: string): void {
        const config: Config = this.loadConfig();
        const normalizedPath: string = this.fileManager.normalizePath(filePath);

        logger.debug(`Adding file path: ${normalizedPath}`);

        Validator.validateFilePath(normalizedPath);

        if (!config.filePaths.includes(normalizedPath)) {
            config.filePaths.push(normalizedPath);
            this.saveConfig(config);
            logger.info(`Added file path: ${normalizedPath}`);
        } else {
            logger.warn(`File path already exists: ${normalizedPath}`);
        }
    }

    public removeFilePath(filePath: string): boolean {
        const config: Config = this.loadConfig();
        const normalizedPath: string = this.fileManager.normalizePath(filePath);

        logger.debug(`Removing file path: ${normalizedPath}`);

        const initialLength: number = config.filePaths.length;
        config.filePaths = config.filePaths.filter(
            (p: string) => p !== normalizedPath
        );

        if (config.filePaths.length < initialLength) {
            this.saveConfig(config);
            logger.info(`Removed file path: ${normalizedPath}`);
            return true;
        } else {
            logger.warn(`File path not found: ${normalizedPath}`);
            return false;
        }
    }

    public removeFilePathByIndex(index: number): boolean {
        const config: Config = this.loadConfig();

        logger.debug(`Removing file path by index: ${index}`);

        if (index < 0 || index >= config.filePaths.length) {
            logger.warn(`Invalid index: ${index}`);
            return false;
        }

        const removedPath: string | undefined = config.filePaths[index];
        if (!removedPath) {
            logger.warn(`No path found at index: ${index}`);
            return false;
        }

        config.filePaths.splice(index, 1);
        this.saveConfig(config);

        logger.info(`Removed file path at index ${index}: ${removedPath}`);
        return true;
    }

    public removeFilePathsByIndices(indices: number[]): string[] {
        const config: Config = this.loadConfig();

        logger.debug(`Removing file paths by indices: ${indices.join(', ')}`);

        const sortedIndices: number[] = indices
            .map((index) => index - 1)
            .sort((a, b) => b - a);

        const removedPaths: string[] = [];

        for (const index of sortedIndices) {
            if (index >= 0 && index < config.filePaths.length) {
                const removedPath: string | undefined = config.filePaths[index];
                if (removedPath) {
                    config.filePaths.splice(index, 1);
                    removedPaths.unshift(removedPath);
                    logger.debug(
                        `Removed file path at index ${index}: ${removedPath}`
                    );
                }
            }
        }

        if (removedPaths.length > 0) {
            this.saveConfig(config);
            logger.info(`Removed ${removedPaths.length} file paths by indices`);
        }

        return removedPaths;
    }

    public getConfig(): Config {
        if (!this.config) {
            return this.loadConfig();
        }
        return { ...this.config };
    }

    public getConfigPath(): string {
        return this.configFile;
    }

    public configExists(): boolean {
        return fs.existsSync(this.configFile);
    }

    public resetConfig(): void {
        logger.info('Resetting configuration to defaults');

        const defaultConfig: Config = this.getDefaultConfig();
        this.saveConfig(defaultConfig);
    }

    public validateCurrentConfig(): void {
        const config: Config = this.loadConfig();
        Validator.validateConfigStructure(config);

        const invalidPaths: string[] = [];

        for (const filePath of config.filePaths) {
            try {
                Validator.validateFilePath(filePath);
                if (!this.fileManager.checkFileAccess(filePath)) {
                    invalidPaths.push(filePath);
                }
            } catch {
                invalidPaths.push(filePath);
            }
        }

        if (invalidPaths.length > 0) {
            logger.warn(
                `Found ${invalidPaths.length} invalid file paths`,
                invalidPaths
            );
        }
    }

    private loadFromFile(): Config {
        try {
            const configData: string = fs.readFileSync(this.configFile, 'utf8');
            const parsedConfig: any = JSON.parse(configData);

            const config: Config = {
                filePaths: parsedConfig.filePaths || [],
                prompt: parsedConfig.prompt || '',
                outputFormat: parsedConfig.outputFormat || OutputFormat.PLAIN,
                includeHeaders:
                    parsedConfig.includeHeaders !== undefined
                        ? parsedConfig.includeHeaders
                        : true,
            };

            return this.normalizeConfig(config);
        } catch (error: unknown) {
            if (error instanceof SyntaxError) {
                throw new ConfigError(
                    'Invalid JSON in configuration file',
                    error
                );
            }
            throw error;
        }
    }

    private loadFromEnvironment(): Config {
        dotenv.config();

        const filePathsString: string | undefined = process.env['FILE_PATHS'];
        const config: Config = this.getDefaultConfig();

        if (filePathsString) {
            config.filePaths = filePathsString
                .split(',')
                .map((filePath: string) =>
                    this.fileManager.normalizePath(filePath.trim())
                )
                .filter((filePath: string) => filePath.length > 0);

            if (config.filePaths.length > 0) {
                this.saveConfig(config);
                logger.info(
                    `Configuration migrated from environment to ${this.configFile}`
                );
            }
        }

        return config;
    }

    private normalizeConfig(config: Config): Config {
        return {
            filePaths: config.filePaths.map((filePath: string) =>
                this.fileManager.normalizePath(filePath)
            ),
            prompt: config.prompt || '',
            outputFormat: config.outputFormat || OutputFormat.PLAIN,
            includeHeaders:
                config.includeHeaders !== undefined
                    ? config.includeHeaders
                    : true,
        };
    }

    private validateAndCache(config: Config): void {
        Validator.validateConfigStructure(config);
        this.config = config;
    }

    private getDefaultConfig(): Config {
        return {
            filePaths: [],
            prompt: '',
            outputFormat: OutputFormat.PLAIN,
            includeHeaders: true,
        };
    }
}
