export interface ToonField {
    name: string;
    abbr: string;
    type: 'string' | 'number' | 'boolean' | 'null' | 'date';
}
export interface ToonSchema {
    type: string;
    fields: ToonField[];
}
export declare const SCHEMAS: Record<string, ToonSchema>;
export declare const toon: {
    /**
     * Claude-optimized format: natural language key=value with · delimiters.
     * Exploits Claude's tokenizer advantage for prose (20% fewer tokens)
     * while avoiding Claude's JSON penalty (35-40% more tokens).
     *
     * Expected savings: 80-87% vs JSON on Claude models.
     *
     * Format: `decision d1 · venture=novizio · by=henry · task=Approve post · when=today · status=none`
     */
    claude(items: Record<string, unknown>[], schemaOrType: ToonSchema | string): string;
    /**
     * Dense pipe-delimited format for LLM system prompts.
     * Minimal structural overhead — type prefix + pipe-separated values.
     * Best for injecting large datasets into context windows.
     *
     * Expected savings: 27% vs JSON (OpenAI), 40% vs JSON (Claude).
     *
     * Format: `D|d1|novizio|henry|Approve post|today|-`
     */
    dense(items: Record<string, unknown>[], schemaOrType: ToonSchema | string): string;
    /**
     * Self-describing API format with schema header.
     * Human-readable, machine-parseable, good for HTTP responses.
     *
     * Expected savings: 25% vs JSON.
     *
     * Format: `#id|venture|agent|text|urgency|action\n d1|novizio|henry|Approve|today|-`
     */
    api(items: Record<string, unknown>[], schemaOrType: ToonSchema | string): string;
    /**
     * JSON-parseable compact format for browser consumption.
     * Zero custom parser needed — just JSON.parse().
     *
     * Expected savings: 18% vs standard JSON.
     *
     * Format: {"h":["id","venture",...],"d":[["d1","novizio",...],...]}
     */
    js(items: Record<string, unknown>[], schemaOrType: ToonSchema | string): string;
    /**
     * Parse any TOON format back to objects.
     * Auto-detects format from content.
     */
    parse(text: string, schemaOrType?: ToonSchema | string): Record<string, unknown>[];
    /** Get schema by name */
    schema(name: string): ToonSchema | undefined;
};
export default toon;
//# sourceMappingURL=toon.d.ts.map