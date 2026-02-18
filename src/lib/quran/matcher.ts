/**
 * Quran Fuzzy Matching Engine
 * 
 * Takes normalized STT text and finds the best matching position
 * within the Quran using sliding window + token similarity.
 */

import { normalizeArabic, tokenize, similarity } from './normalize';
import type { MatchResult, QuranSurah } from './types';

/**
 * Configuration for the matching engine.
 */
interface MatchConfig {
    /** Minimum similarity threshold (0-1) for a match to be accepted */
    threshold: number;
    /** Maximum window sizes to try (in words) */
    maxWindowSize: number;
    /** Minimum window size (in words) */
    minWindowSize: number;
    /** If set, start search from this surah */
    startSurah?: number;
    /** If set, start search from this ayah within startSurah */
    startAyah?: number;
    /** How many surahs to search before/after start position */
    searchRadius: number;
}

const DEFAULT_CONFIG: MatchConfig = {
    threshold: 0.65,
    maxWindowSize: 15,
    minWindowSize: 3,
    searchRadius: 3,
};

/**
 * Find the best matching position in the Quran for the given spoken text.
 * 
 * @param spokenText - The recognized text from STT (may or may not have diacritics)
 * @param surahs - Array of loaded Quran surahs to search
 * @param config - Optional matching configuration
 */
export function findMatch(
    spokenText: string,
    surahs: QuranSurah[],
    config: Partial<MatchConfig> = {}
): MatchResult | null {
    const cfg = { ...DEFAULT_CONFIG, ...config };
    const normalizedSpoken = normalizeArabic(spokenText);
    const spokenTokens = tokenize(normalizedSpoken);

    if (spokenTokens.length === 0) return null;

    let bestMatch: MatchResult | null = null;
    let bestScore = 0;

    // Determine search order — prioritize area around last known position
    const surahOrder = getSurahSearchOrder(surahs, cfg.startSurah, cfg.searchRadius);

    for (const surah of surahOrder) {
        for (const ayah of surah.ayahs) {
            const ayahTokens = ayah.words.map(w => w.textNormalized);

            // Sliding window over ayah words
            const windowSize = Math.min(
                Math.max(spokenTokens.length, cfg.minWindowSize),
                cfg.maxWindowSize,
                ayahTokens.length
            );

            for (let start = 0; start <= ayahTokens.length - 1; start++) {
                const end = Math.min(start + windowSize, ayahTokens.length);
                const windowTokens = ayahTokens.slice(start, end);

                // Calculate token-level similarity
                const score = calculateTokenSimilarity(spokenTokens, windowTokens);

                if (score > bestScore && score >= cfg.threshold) {
                    bestScore = score;
                    bestMatch = {
                        surah: surah.number,
                        ayah: ayah.number,
                        wordStart: start,
                        wordEnd: end - 1,
                        confidence: score,
                        matchedText: windowTokens.join(' '),
                    };
                }
            }
        }

        // If we found a great match, stop early
        if (bestScore >= 0.90) break;
    }

    return bestMatch;
}

/**
 * Calculate token-level similarity between spoken and reference tokens.
 * Uses a combination of exact match ratio and fuzzy character similarity.
 */
function calculateTokenSimilarity(spoken: string[], reference: string[]): number {
    if (spoken.length === 0 || reference.length === 0) return 0;

    const minLen = Math.min(spoken.length, reference.length);
    const maxLen = Math.max(spoken.length, reference.length);

    let totalSim = 0;
    let matched = 0;

    // Match each spoken token to the best reference token
    for (let i = 0; i < spoken.length && i < reference.length; i++) {
        const sim = similarity(spoken[i], reference[i]);
        totalSim += sim;
        if (sim >= 0.8) matched++;
    }

    // Penalize length mismatch
    const lengthPenalty = minLen / maxLen;
    const avgSim = totalSim / Math.max(spoken.length, 1);

    return avgSim * lengthPenalty;
}

/**
 * Order surahs for search, prioritizing the area around the last known position.
 */
function getSurahSearchOrder(
    surahs: QuranSurah[],
    startSurah?: number,
    radius: number = 3
): QuranSurah[] {
    if (!startSurah) return surahs;

    const startIdx = surahs.findIndex(s => s.number === startSurah);
    if (startIdx === -1) return surahs;

    const result: QuranSurah[] = [];
    const added = new Set<number>();

    // Add surahs near start position first
    for (let offset = 0; offset <= radius; offset++) {
        for (const delta of [0, -offset, offset]) {
            const idx = startIdx + delta;
            if (idx >= 0 && idx < surahs.length && !added.has(idx)) {
                result.push(surahs[idx]);
                added.add(idx);
            }
        }
    }

    // Add remaining surahs
    for (let i = 0; i < surahs.length; i++) {
        if (!added.has(i)) {
            result.push(surahs[i]);
        }
    }

    return result;
}

/**
 * Search for a text passage across all surahs (for voice search).
 * Returns top N matches.
 */
export function searchQuran(
    query: string,
    surahs: QuranSurah[],
    topN: number = 5
): MatchResult[] {
    const normalizedQuery = normalizeArabic(query);
    const queryTokens = tokenize(normalizedQuery);

    if (queryTokens.length === 0) return [];

    const results: MatchResult[] = [];

    for (const surah of surahs) {
        for (const ayah of surah.ayahs) {
            const ayahNormalized = normalizeArabic(ayah.text);
            const sim = similarity(
                normalizedQuery,
                ayahNormalized.substring(0, normalizedQuery.length + 20)
            );

            if (sim >= 0.5) {
                results.push({
                    surah: surah.number,
                    ayah: ayah.number,
                    wordStart: 0,
                    wordEnd: ayah.words.length - 1,
                    confidence: sim,
                    matchedText: ayah.text,
                });
            }
        }
    }

    // Sort by confidence descending and return top N
    return results.sort((a, b) => b.confidence - a.confidence).slice(0, topN);
}
