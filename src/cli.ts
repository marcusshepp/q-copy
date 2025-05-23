import { Command } from 'commander';
import * as path from 'path';
import * as os from 'os';
import { readConfig, writeConfig, expandTilde } from './utils';

const program = new Command();
const configFile: string = path.join(os.homedir(), '.q-copy.json');

program
    .name('q-copy')
    .description('Copy file contents to clipboard and manage file paths')
    .version('1.0.0');

program
    .command('ls')
    .description('List current file paths')
    .action(() => {
        const { filePaths } = readConfig(configFile);
        if (filePaths.length === 0) {
            console.log('No file paths configured.');
        } else {
            filePaths.forEach((p, i) => {
                console.log(`${i + 1}: ${p}`);
            });
        }
    });

program
    .command('add <path...>')
    .description('Add one or more file paths')
    .action((paths: string[]) => {
        const config = readConfig(configFile);
        for (const p of paths) {
            const expanded = expandTilde(p);
            if (!config.filePaths.includes(expanded)) {
                config.filePaths.push(expanded);
            }
        }
        writeConfig(configFile, config);
        console.log('File paths added.');
    });

program
    .command('rm <index>')
    .description('Remove a file path by index')
    .action((index: string) => {
        const i = parseInt(index) - 1;
        const config = readConfig(configFile);
        if (i >= 0 && i < config.filePaths.length) {
            config.filePaths.splice(i, 1);
            writeConfig(configFile, config);
            console.log(`Removed path at index ${index}`);
        } else {
            console.log('Invalid index');
        }
    });

program.parse(process.argv);
