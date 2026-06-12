"use strict";
// src/toon/v3/bpe.ts — Byte-Pair Encoding Tokenizer
// Trained on project corpus. Learns frequent subword merges.
// Example: "deployment" → tokens [deploy, ment] → codes [a7, 3f].
// Encoded output is base64 text — LLM-readable with codebook header.
Object.defineProperty(exports, "__esModule", { value: true });
exports.trainBPE = trainBPE;
exports.encode = encode;
exports.decode = decode;
// ─── Training ─────────────────────────────────────────────────────────────────
function trainBPE(text, numMerges = 128) {
    // Sample corpus if too large (BPE training is O(n×m))
    const sample = text.length > 100000 ? text.slice(0, 100000) : text;
    // Start with word-level tokens (split on whitespace) — much faster than character-level
    const words = sample.split(/\s+/).filter(w => w.length >= 2);
    // Count word frequencies
    const wordFreq = new Map();
    for (const w of words) {
        wordFreq.set(w, (wordFreq.get(w) || 0) + 1);
    }
    // Only keep frequent words for BPE training
    const frequentWords = [...wordFreq.entries()]
        .filter(([, count]) => count >= 3)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2000);
    // Build character-level representation for each frequent word
    const splits = new Map();
    for (const [word] of frequentWords) {
        splits.set(word, word.split('').map((c, i, arr) => i < arr.length - 1 ? c + '</w>' : c));
        // Actually simpler: just split into characters
        splits.set(word, word.split(''));
    }
    // BPE merge iterations
    const merges = [];
    for (let iter = 0; iter < numMerges; iter++) {
        const pairFreq = new Map();
        for (const [word, chars] of splits) {
            for (let i = 0; i < chars.length - 1; i++) {
                const pair = chars[i] + chars[i + 1];
                pairFreq.set(pair, (pairFreq.get(pair) || 0) + (wordFreq.get(word) || 1));
            }
        }
        // Find best pair
        let best = '', bestCount = 0;
        for (const [pair, count] of pairFreq) {
            if (count > bestCount) {
                best = pair;
                bestCount = count;
            }
        }
        if (bestCount < 3)
            break;
        // Record merge
        const first = best.slice(0, Math.floor(best.length / 2));
        const second = best.slice(Math.floor(best.length / 2));
        merges.push([first, second, best]);
        // Apply merge to all words
        for (const [word, chars] of splits) {
            const merged = [];
            for (let i = 0; i < chars.length; i++) {
                if (i < chars.length - 1 && chars[i] + chars[i + 1] === best) {
                    merged.push(best);
                    i++;
                }
                else {
                    merged.push(chars[i]);
                }
            }
            splits.set(word, merged);
        }
    }
    // Build vocabulary from merged tokens
    const tokenFreq = new Map();
    for (const [word, chars] of splits) {
        for (const t of chars) {
            if (t.length >= 2) {
                tokenFreq.set(t, (tokenFreq.get(t) || 0) + (wordFreq.get(word) || 1));
            }
        }
    }
    const sorted = [...tokenFreq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 512);
    const vocab = new Map();
    const reverse = new Map();
    const base64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    let codeIdx = 0;
    for (const [token] of sorted) {
        const code = codeIdx < 64 ? base64[codeIdx] : base64[Math.floor(codeIdx / 64)] + base64[codeIdx % 64];
        vocab.set(token, code);
        reverse.set(code, token);
        codeIdx++;
    }
    return { merges, vocab, reverse };
}
// ─── Encoding ─────────────────────────────────────────────────────────────────
function encode(text, bpe) {
    const map = bpe.vocab instanceof Map ? bpe.vocab : new Map(Object.entries(bpe.vocab));
    const entries = [...map.entries()].sort((a, b) => b[0].length - a[0].length);
    const tokens = [];
    let i = 0;
    while (i < text.length) {
        let matched = false;
        for (const [token, code] of entries) {
            if (text.startsWith(token, i)) {
                tokens.push(code);
                i += token.length;
                matched = true;
                break;
            }
        }
        if (!matched) {
            tokens.push(text[i]);
            i++;
        }
    }
    return tokens.join('');
}
function decode(encoded, bpe) {
    const rev = bpe.reverse instanceof Map ? bpe.reverse : new Map(Object.entries(bpe.reverse));
    let result = '';
    let i = 0;
    while (i < encoded.length) {
        let matched = false;
        if (i + 1 < encoded.length) {
            const pair = encoded[i] + encoded[i + 1];
            if (rev.has(pair)) {
                result += rev.get(pair);
                i += 2;
                matched = true;
            }
        }
        if (!matched) {
            result += rev.get(encoded[i]) || encoded[i];
            i++;
        }
    }
    return result;
}
//# sourceMappingURL=bpe.js.map