import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

type Config = {
    filePaths: string[];
};

export function expandTilde(p: string): string {
    if (!p) return '';
    return p.replace(/^~(?=$|\/|\\)/, os.homedir());
}

export function readConfig(configFile: string): Config {
    if (!fs.existsSync(configFile)) {
        return { filePaths: [] };
    }

    const raw: string = fs.readFileSync(configFile, 'utf8');
    try {
        const parsed = JSON.parse(raw);
        return { filePaths: parsed.filePaths ?? [] };
    } catch {
        return { filePaths: [] };
    }
}

export function writeConfig(configFile: string, config: Config): void {
    fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
}
