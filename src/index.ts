import clipboard from 'clipboardy';
import { readConfig } from './utils';

const configFile: string = `${process.env.HOME}/.q-copy.json`;
const { filePaths } = readConfig(configFile);

if (filePaths.length === 0) {
    console.error('No file paths found. Use `q-copy add <path>` to add some.');
    process.exit(1);
}

const fs = require('fs');
let content = '';

for (const filePath of filePaths) {
    try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        content += fileContent + '\n';
    } catch (err) {
        console.error(`Error reading ${filePath}:`, err.message);
    }
}

clipboard.writeSync(content.trim());
console.log('Copied contents of all files to clipboard.');
