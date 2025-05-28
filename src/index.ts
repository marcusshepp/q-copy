#!/usr/bin/env node

import { CLI } from './cli';
import { logger } from './logger';
import { QCopyError } from './errors';

async function main(): Promise<void> {
    try {
        const cli: CLI = new CLI();
        await cli.run(process.argv);
    } catch (error: unknown) {
        if (error instanceof QCopyError) {
            console.error(`Error: ${error.message}`);
            logger.error('Application error', error);
            process.exit(1);
        } else if (error instanceof Error) {
            console.error(`Unexpected error: ${error.message}`);
            logger.error('Unexpected error', error);
            process.exit(1);
        } else {
            console.error(`Unknown error: ${String(error)}`);
            logger.error('Unknown error', { error });
            process.exit(1);
        }
    }
}

process.on('uncaughtException', (error: Error) => {
    console.error('Uncaught Exception:', error.message);
    logger.error('Uncaught Exception', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason: unknown, promise: Promise<any>) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    logger.error('Unhandled Rejection', { reason, promise });
    process.exit(1);
});

process.on('SIGINT', () => {
    console.log('\nReceived SIGINT. Gracefully shutting down...');
    logger.info('Application interrupted by user');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\nReceived SIGTERM. Gracefully shutting down...');
    logger.info('Application terminated');
    process.exit(0);
});

if (require.main === module) {
    main();
}

export { CLI } from './cli';
export { ConfigManager } from './config';
export { FileManager } from './file-manager';
export { Logger, logger } from './logger';
export { Validator } from './validator';
export * from './types';
export {
    QCopyError,
    ConfigError,
    FileError as FileErrorClass,
    ValidationError,
    ClipboardError,
    PathError,
    isQCopyError,
    getErrorMessage,
    getErrorCode
} from './errors';
export * from './utils';
