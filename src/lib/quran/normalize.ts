/**
 * Arabic text normalization utilities for Quran matching.
 * 
 * We maintain TWO versions of Quran text:
 * 1. Full diacritized (Uthmani) — for display and tashkeel checking
 * 2. Normalized (no diacritics) — for position matching with STT output
 */

// Unicode ranges for Arabic diacritics (tashkeel)
const TASHKEEL_REGEX = /[\u0610-\u061A\u064B-\u065F\u06D6-\u06DC\u06DF-\u06E8\u06EA-\u06ED\u08D3-\u08E1\u08E3-\u08FF]/g;

// Tatweel (kashida)
const TATWEEL_REGEX = /\u0640/g;

// Hamzat normalization map
const HAMZAT_MAP: Record<string, string> = {
    '\u0623': '\u0627', // أ → ا
    '\u0625': '\u0627', // إ → ا
    '\u0622': '\u0627', // آ → ا
    '\u0671': '\u0627', // ٱ → ا (alef wasla)
    '\u0624': '\u0648', // ؤ → و
    '\u0626': '\u064A', // ئ → ي
};

// Ya / Alef Maqsura normalization
const YA_MAQSURA_MAP: Record<string, string> = {
    '\u0649': '\u064A', // ى → ي
};

// Teh marbuta → heh
const TEH_MARBUTA_MAP: Record<string, string> = {
    '\u0629': '\u0647', // ة → ه
};

/**
 * Remove all tashkeel (diacritical marks) from Arabic text.
 */
export function stripTashkeel(text: string): string {
    return text.replace(TASHKEEL_REGEX, '');
}

/**
 * Remove tatweel (kashida) characters.
 */
export function removeTatweel(text: string): string {
    return text.replace(TATWEEL_REGEX, '');
}

/**
 * Normalize hamzat forms to base letters.
 */
export function normalizeHamzat(text: string): string {
    let result = '';
    for (const char of text) {
        result += HAMZAT_MAP[char] || char;
    }
    return result;
}

/**
 * Normalize ya and alef maqsura.
 */
export function normalizeYa(text: string): string {
    let result = '';
    for (const char of text) {
        result += YA_MAQSURA_MAP[char] || char;
    }
    return result;
}

/**
 * Normalize teh marbuta.
 */
export function normalizeTehMarbuta(text: string): string {
    let result = '';
    for (const char of text) {
        result += TEH_MARBUTA_MAP[char] || char;
    }
    return result;
}

/**
 * Full normalization pipeline for Arabic text matching.
 * Strips tashkeel, normalizes hamzat, ya, teh marbuta, and removes tatweel.
 */
export function normalizeArabic(text: string): string {
    let normalized = text;
    normalized = stripTashkeel(normalized);
    normalized = removeTatweel(normalized);
    normalized = normalizeHamzat(normalized);
    normalized = normalizeYa(normalized);
    normalized = normalizeTehMarbuta(normalized);
    // Collapse whitespace
    normalized = normalized.replace(/\s+/g, ' ').trim();
    return normalized;
}

/**
 * Tokenize Arabic text into words.
 */
export function tokenize(text: string): string[] {
    return text.split(/\s+/).filter(w => w.length > 0);
}

/**
 * Calculate Levenshtein distance between two strings.
 */
export function levenshteinDistance(a: string, b: string): number {
    const m = a.length;
    const n = b.length;
    const dp: number[][] = Array(m + 1)
        .fill(null)
        .map(() => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            dp[i][j] = Math.min(
                dp[i - 1][j] + 1,      // deletion
                dp[i][j - 1] + 1,      // insertion
                dp[i - 1][j - 1] + cost // substitution
            );
        }
    }

    return dp[m][n];
}

/**
 * Calculate similarity ratio between two strings (0-1).
 */
export function similarity(a: string, b: string): number {
    if (a.length === 0 && b.length === 0) return 1;
    const maxLen = Math.max(a.length, b.length);
    if (maxLen === 0) return 1;
    return 1 - levenshteinDistance(a, b) / maxLen;
}

/**
 * Extract diacritics from a word, returning array of diacritic info per character.
 */
export interface CharDiacritic {
    char: string;
    diacritics: string[];
}

export function extractDiacritics(word: string): CharDiacritic[] {
    const result: CharDiacritic[] = [];
    let current: CharDiacritic | null = null;

    for (const char of word) {
        if (TASHKEEL_REGEX.test(char)) {
            // Reset regex lastIndex
            TASHKEEL_REGEX.lastIndex = 0;
            if (current) {
                current.diacritics.push(char);
            }
        } else {
            if (current) {
                result.push(current);
            }
            current = { char, diacritics: [] };
        }
    }
    if (current) {
        result.push(current);
    }

    return result;
}

/**
 * Get the haraka name for a Unicode diacritic.
 */
export function getHarakaName(diacritic: string): string {
    const names: Record<string, string> = {
        '\u064E': 'فتحة',     // fatha
        '\u064F': 'ضمة',      // damma
        '\u0650': 'كسرة',     // kasra
        '\u0651': 'شدّة',     // shadda
        '\u0652': 'سكون',     // sukun
        '\u064B': 'تنوين فتح',  // tanwin fath
        '\u064C': 'تنوين ضم',   // tanwin damm
        '\u064D': 'تنوين كسر',  // tanwin kasr
        '\u0653': 'مدّة',     // madda
        '\u0654': 'همزة فوق',  // hamza above
        '\u0655': 'همزة تحت',  // hamza below
    };
    return names[diacritic] || 'حركة غير معروفة';
}
