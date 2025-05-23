#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { expandTilde, readConfig, writeConfig } from './utils';

const configFile: string = path.join(os.homedir(), '.q-copy.json');

function printUsage(): void {
    console.log(`Usage: q-copy config <command> [args]

Commands:
  ls                     List current file paths
  add <path> [...]       Add one or more file paths
  rm <path> [...]        Remove one or more file paths`);
}

function listPaths(): void {
    const config = readConfig(configFile);
    config.filePaths.forEach((filePath: string, index: number) => {
        console.log(`${index + 1}. ${filePath}`);
    });
}

function addPaths(paths: string[]): void {
    if (paths.length === 0) {
        console.error('No paths provided to add.');
        process.exit(1);
    }

    const config = readConfig(configFile);
    const existing = new Set(config.filePaths);
    paths.map(expandTilde).forEach((p) => existing.add(p));
    writeConfig(configFile, { filePaths: Array.from(existing) });
    console.log('Paths added.');
}

function removePaths(paths: string[]): void {
    if (paths.length === 0) {
        console.error('No paths provided to remove.');
        process.exit(1);
    }

    const config = readConfig(configFile);
    const toRemove = new Set(paths.map(expandTilde));
    const updated = config.filePaths.filter((p: string) => !toRemove.has(p));
    writeConfig(configFile, { filePaths: updated });
    console.log('Paths removed.');
}

function main(): void {
    const [, , , command, ...args] = process.argv;

    if (!command) {
        printUsage();
        process.exit(1);
    }

    switch (command) {
        case 'ls':
            listPaths();
            break;
        case 'add':
            addPaths(args);
            break;
        case 'rm':
            removePaths(args);
            break;
        default:
            printUsage();
            process.exit(1);
    }
}

main();
