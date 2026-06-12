export interface DecodedResult {
    human: string;
    wasToon: boolean;
    recordCount: number;
}
/**
 * Parse a TOON string back to human-readable text.
 * Auto-detects TOON format. Safe to call on non-TOON text (returns as-is).
 */
export declare function decodeToonResponse(text: string): DecodedResult;
/**
 * Parse a [TOON DICTIONARY ...] block into a lookup table.
 */
export declare function parseDictionaryBlock(text: string): Map<string, string>;
/**
 * Expand a TOON-compressed string back using the dictionary.
 * Simple word-level expansion for text that was abbreviated.
 */
export declare function expandWithDictionary(text: string, dictMap: Map<string, string>): string;
//# sourceMappingURL=decoder.d.ts.map