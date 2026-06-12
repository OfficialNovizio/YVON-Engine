export interface ToonEncodeResult {
    raw: string;
    compressed: string;
    records: string[];
    savingsPercent: number;
}
export interface ToonSection {
    type: string;
    header: string;
    records: string[];
}
/**
 * Encode a markdown document into TOON format.
 * Preserves structural hierarchy as typed TOON records.
 */
export declare function encodeDocument(content: string, title?: string): ToonEncodeResult;
/**
 * Encode agent MEMORY.md into TOON format.
 * Sections become keys, content becomes abbreviated values.
 */
export declare function encodeMemory(content: string, agentId: string): ToonEncodeResult;
/**
 * Encode a user prompt — detect structured patterns and TOON-encode them.
 * Falls back to abbreviation-only for freeform text.
 */
export declare function encodePrompt(prompt: string): ToonEncodeResult;
export declare const ABBREV_MAP: Record<string, string>;
export declare function abbreviate(text: string): string;
export declare function abbreviateText(text: string): string;
export declare function escapeRegex(s: string): string;
/**
 * Generate the full dictionary string for injection into system prompts.
 */
export declare function generateDictionaryString(): string;
//# sourceMappingURL=encoder.d.ts.map