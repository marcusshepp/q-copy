export interface ParsedRange {
    indices: number[];
    invalidInputs: string[];
}

export class RangeParser {
    public static parseNumberRanges(identifiers: string[]): ParsedRange {
        const indices: Set<number> = new Set();
        const invalidInputs: string[] = [];

        for (const identifier of identifiers) {
            const trimmed: string = identifier.trim();

            if (this.isRange(trimmed)) {
                const rangeIndices: number[] = this.parseRange(trimmed);
                if (rangeIndices.length > 0) {
                    rangeIndices.forEach((index) => indices.add(index));
                } else {
                    invalidInputs.push(trimmed);
                }
            } else if (this.isNumber(trimmed)) {
                const num: number = parseInt(trimmed);
                if (num > 0) {
                    indices.add(num);
                } else {
                    invalidInputs.push(trimmed);
                }
            } else {
                invalidInputs.push(trimmed);
            }
        }

        return {
            indices: Array.from(indices).sort((a, b) => a - b),
            invalidInputs,
        };
    }

    private static isRange(input: string): boolean {
        return input.includes('-') && /^\d+-\d+$/.test(input);
    }

    private static isNumber(input: string): boolean {
        return /^\d+$/.test(input);
    }

    private static parseRange(range: string): number[] {
        const parts: string[] = range.split('-');
        if (parts.length !== 2) {
            return [];
        }

        const startStr: string | undefined = parts[0];
        const endStr: string | undefined = parts[1];

        if (!startStr || !endStr) {
            return [];
        }

        const start: number = parseInt(startStr);
        const end: number = parseInt(endStr);

        if (
            isNaN(start) ||
            isNaN(end) ||
            start <= 0 ||
            end <= 0 ||
            start > end
        ) {
            return [];
        }

        const result: number[] = [];
        for (let i = start; i <= end; i++) {
            result.push(i);
        }

        return result;
    }

    public static separateNumbersAndPaths(identifiers: string[]): {
        numbers: string[];
        paths: string[];
    } {
        const numbers: string[] = [];
        const paths: string[] = [];

        for (const identifier of identifiers) {
            const trimmed: string = identifier.trim();

            if (this.isRange(trimmed) || this.isNumber(trimmed)) {
                numbers.push(trimmed);
            } else {
                paths.push(trimmed);
            }
        }

        return { numbers, paths };
    }
}
