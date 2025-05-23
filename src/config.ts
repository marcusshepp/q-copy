import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as dotenv from 'dotenv';

export interface Config {
    filePaths: string[];
    prompt?: string;
}

export class ConfigManager {
    private readonly configFile: string = path.join(os.homedir(), '.q-copy.json');

    public loadConfig(): Config {
        try {
            if (fs.existsSync(this.configFile)) {
                const configData: string = fs.readFileSync(this.configFile, 'utf8');
                const config: Config = JSON.parse(configData);

                if (config.filePaths && config.filePaths.length > 0) {
                    return {
                        filePaths: config.filePaths.map((filePath: string) => this.expandTilde(filePath)),
                        prompt: config.prompt || ''
                    };
                }
            }

            return this.loadFromEnvironment();
        } catch (error: unknown) {
            const errorMessage: string = error instanceof Error
                ? error.message
                : String(error);
            throw new Error(`Failed to load configuration: ${errorMessage}`);
        }
    }

    public saveConfig(config: Config): void {
        try {
            const configData: string = JSON.stringify(config, null, 2);
            fs.writeFileSync(this.configFile, configData, 'utf8');
        } catch (error: unknown) {
            const errorMessage: string = error instanceof Error
                ? error.message
                : String(error);
            throw new Error(`Failed to save configuration: ${errorMessage}`);
        }
    }

    private loadFromEnvironment(): Config {
        dotenv.config();

        const filePathsString: string | undefined = process.env.FILE_PATHS;

        if (!filePathsString) {
            return { filePaths: [] };
        }

        const filePaths: string[] = filePathsString.split(',')
            .map((filePath: string) => this.expandTilde(filePath.trim()))
            .filter((filePath: string) => filePath.length > 0);

        const config: Config = { filePaths };

        if (filePaths.length > 0) {
            this.saveConfig(config);
            console.log(`Configuration migrated from .env to ${this.configFile}`);
        }

        return config;
    }

    private expandTilde(filePath: string): string {
        if (filePath.startsWith('~')) {
            return filePath.replace('~', os.homedir());
        }
        return filePath;
    }

    public getConfigPath(): string {
        return this.configFile;
    }
}
