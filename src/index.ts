#!/usr/bin/env node

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as child_process from 'child_process';
import * as dotenv from 'dotenv';

class ClipboardManager {
    private filePaths: string[] = [];
    private readonly platform: string = os.platform();
    private readonly configFile: string = path.join(os.homedir(), '.q-copy.json');

    constructor() {
        this.loadConfiguration();
    }

    private loadConfiguration(): void {
        try {
            
            if (fs.existsSync(this.configFile)) {
                const config = JSON.parse(fs.readFileSync(this.configFile, 'utf8'));
                this.filePaths = config.filePaths || [];
                
                if (this.filePaths.length > 0) {
                    return;
                }
            }
            
            
            this.loadEnvironmentVariables();
            
        } catch (error: unknown) {
            const errorMessage: string = error instanceof Error 
                ? error.message 
                : String(error);
            throw new Error(`Failed to load configuration: ${errorMessage}`);
        }
    }

    private loadEnvironmentVariables(): void {
        
        dotenv.config();
        
        
        const filePathsString: string | undefined = process.env.FILE_PATHS;
        
        if (!filePathsString) {
            throw new Error('No configuration found. Please create a .q-copy.json file in your home directory or define FILE_PATHS in a .env file');
        }
        
        
        this.filePaths = filePathsString.split(',')
            .map((path: string) => this.expandTilde(path.trim()))
            .filter((path: string) => path.length > 0);
            
        if (this.filePaths.length === 0) {
            throw new Error('No file paths found in configuration');
        }
        
        
        this.saveConfiguration();
    }
    
    private saveConfiguration(): void {
        try {
            const config = {
                filePaths: this.filePaths
            };
            fs.writeFileSync(this.configFile, JSON.stringify(config, null, 2), 'utf8');
            console.log(`Configuration saved to ${this.configFile}`);
        } catch (error: unknown) {
            const errorMessage: string = error instanceof Error 
                ? error.message 
                : String(error);
            console.error(`Warning: Failed to save configuration: ${errorMessage}`);
        }
    }
    
    private expandTilde(filePath: string): string {
        
        if (filePath.startsWith('~')) {
            return filePath.replace('~', os.homedir());
        }
        return filePath;
    }

    public async run(): Promise<void> {
        try {
            const concatenatedContent: string = this.concatenateFileContents();
            this.copyToClipboard(concatenatedContent);
            console.log('All file contents concatenated and copied to clipboard.');
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error(`Error: ${error.message}`);
            } else {
                console.error(`Unknown error occurred: ${error}`);
            }
            process.exit(1);
        }
    }

    private concatenateFileContents(): string {
        const contents: string[] = [];
        
        for (const filePath of this.filePaths) {
            try {
                const fileContent: string = fs.readFileSync(filePath, 'utf8');
                contents.push(`${filePath}\n${fileContent}\n`);
            } catch (error: unknown) {
                const errorMessage: string = error instanceof Error 
                    ? error.message 
                    : String(error);
                throw new Error(`Failed to read file ${filePath}: ${errorMessage}`);
            }
        }
        
        return contents.join('\n');
    }

    private copyToClipboard(content: string): void {
        try {
            if (this.platform === 'win32') {
                const tempFilePath: string = path.join(os.tmpdir(), `qcopy-temp-${Date.now()}.txt`);
                
                fs.writeFileSync(tempFilePath, content, 'utf8');
                
                child_process.execSync(`type "${tempFilePath}" | clip`);
                
                try {
                    fs.unlinkSync(tempFilePath);
                } catch (err) {
                    console.error(`Warning: Failed to delete temporary file: ${tempFilePath}`);
                }
            } else if (this.platform === 'linux') {
                try {
                    child_process.execSync('which xclip');
                    const tempFilePath: string = path.join(os.tmpdir(), `qcopy-temp-${Date.now()}.txt`);
                    fs.writeFileSync(tempFilePath, content, 'utf8');
                    child_process.execSync(`cat "${tempFilePath}" | xclip -selection clipboard`);
                    fs.unlinkSync(tempFilePath);
                } catch (error) {
                    throw new Error('xclip is not installed. Please install it using your package manager.');
                }
            } else if (this.platform === 'darwin') {
                const tempFilePath: string = path.join(os.tmpdir(), `qcopy-temp-${Date.now()}.txt`);
                fs.writeFileSync(tempFilePath, content, 'utf8');
                child_process.execSync(`cat "${tempFilePath}" | pbcopy`);
                fs.unlinkSync(tempFilePath);
            } else {
                throw new Error(`Unsupported platform: ${this.platform}`);
            }
        } catch (error: unknown) {
            const errorMessage: string = error instanceof Error 
                ? error.message 
                : String(error);
            throw new Error(`Failed to copy to clipboard: ${errorMessage}`);
        }
    }
}

const clipboardManager: ClipboardManager = new ClipboardManager();
clipboardManager.run();
