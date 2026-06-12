"use strict";
// src/toon/v3/stemmer.ts — Porter Stemmer (simplified)
// Normalizes words: deployment→deploy, running→run, analysis→analysi
// Critical for keyword matching across word forms.
// O(n) per word. 0 external deps.
Object.defineProperty(exports, "__esModule", { value: true });
exports.stem = stem;
const STEP2_MAP = [
    [/ational$/, 'ate'], [/tional$/, 'tion'], [/enci$/, 'ence'],
    [/anci$/, 'ance'], [/izer$/, 'ize'], [/abli$/, 'able'],
    [/alli$/, 'al'], [/entli$/, 'ent'], [/eli$/, 'e'],
    [/ousli$/, 'ous'], [/ization$/, 'ize'], [/ation$/, 'ate'],
    [/ator$/, 'ate'], [/alism$/, 'al'], [/iveness$/, 'ive'],
    [/fulness$/, 'ful'], [/ousness$/, 'ous'], [/aliti$/, 'al'],
    [/iviti$/, 'ive'], [/biliti$/, 'ble'],
];
const STEP3_MAP = [
    [/icate$/, 'ic'], [/ative$/, ''], [/alize$/, 'al'],
    [/iciti$/, 'ic'], [/ical$/, 'ic'], [/ful$/, ''],
    [/ness$/, ''],
];
const STEP4_MAP = [
    [/al$/, ''], [/ance$/, ''], [/ence$/, ''], [/er$/, ''],
    [/ic$/, ''], [/able$/, ''], [/ible$/, ''], [/ant$/, ''],
    [/ement$/, ''], [/ment$/, ''], [/ent$/, ''], [/ou$/, ''],
    [/ism$/, ''], [/ate$/, ''], [/iti$/, ''], [/ous$/, ''],
    [/ive$/, ''], [/ize$/, ''],
];
function stem(w) {
    if (w.length < 3)
        return w;
    w = w.toLowerCase();
    // Step 1a
    if (w.endsWith('sses'))
        w = w.slice(0, -2);
    else if (w.endsWith('ies'))
        w = w.slice(0, -2);
    else if (w.endsWith('ss')) { }
    else if (w.endsWith('s') && w.length > 3)
        w = w.slice(0, -1);
    // Step 1b
    if (w.endsWith('eed')) {
        if (measure(w.slice(0, -3)) > 0)
            w = w.slice(0, -1);
    }
    else if (w.endsWith('ed') && hasVowel(w.slice(0, -2))) {
        w = w.slice(0, -2);
        w = step1bEnd(w);
    }
    else if (w.endsWith('ing') && hasVowel(w.slice(0, -3))) {
        w = w.slice(0, -3);
        w = step1bEnd(w);
    }
    // Step 1c: y → i if preceded by consonant
    if (w.endsWith('y') && w.length > 2 && !isVowel(w[w.length - 2])) {
        w = w.slice(0, -1) + 'i';
    }
    // Step 2
    for (const [re, repl] of STEP2_MAP) {
        if (re.test(w) && measure(w.replace(re, '')) > 0) {
            w = w.replace(re, repl);
            break;
        }
    }
    // Step 3
    for (const [re, repl] of STEP3_MAP) {
        if (re.test(w) && measure(w.replace(re, '')) > 0) {
            w = w.replace(re, repl);
            break;
        }
    }
    // Step 4
    for (const [re, repl] of STEP4_MAP) {
        if (re.test(w) && measure(w.replace(re, '')) > 1) {
            w = w.replace(re, repl);
            break;
        }
    }
    // Step 5a
    if (w.endsWith('e') && measure(w.slice(0, -1)) > 1)
        w = w.slice(0, -1);
    else if (w.endsWith('e') && measure(w.slice(0, -1)) === 1 && !endsWithCVCNoWXY(w.slice(0, -1)))
        w = w.slice(0, -1);
    // Step 5b
    if (measure(w) > 1 && endsWithDoubleConsonant(w) && w.endsWith('l')) {
        w = w.slice(0, -1);
    }
    return w;
}
function isVowel(c) { return 'aeiou'.includes(c); }
function hasVowel(s) { return /[aeiou]/.test(s); }
function measure(s) {
    let count = 0, inVowel = false;
    for (const c of s) {
        if (isVowel(c)) {
            if (!inVowel)
                count++;
            inVowel = true;
        }
        else
            inVowel = false;
    }
    return count;
}
function step1bEnd(w) {
    if (w.endsWith('at') || w.endsWith('bl') || w.endsWith('iz'))
        return w + 'e';
    if (endsWithDoubleConsonant(w) && !w.endsWith('l') && !w.endsWith('s') && !w.endsWith('z'))
        return w.slice(0, -1);
    if (measure(w) === 1 && endsWithCVCNoWXY(w))
        return w + 'e';
    return w;
}
function endsWithDoubleConsonant(s) {
    return s.length >= 2 && s[s.length - 1] === s[s.length - 2] && !isVowel(s[s.length - 1]);
}
function endsWithCVCNoWXY(s) {
    if (s.length < 3)
        return false;
    return !isVowel(s[s.length - 3]) && isVowel(s[s.length - 2]) && !isVowel(s[s.length - 1]) && !'wxy'.includes(s[s.length - 1]);
}
//# sourceMappingURL=stemmer.js.map