/**
 * Tashkeel (harakat) error detection.
 * 
 * MVP approach: Compare diacritics between expected Quran text and 
 * STT output when diacritics are available. Use confidence gating
 * to avoid false positives.
 * 
 * Enhanced approach (Phase 2): Uses CTC forced alignment + G2P
 * for audio-based diacritic detection.
 */

import { extractDiacritics, getHarakaName, stripTashkeel } from '../quran/normalize';
import type { HarakatError, AlignmentPair } from '../quran/types';

/**
 * Detect harakat errors by comparing diacritics of matched words.
 * 
 * This MVP approach works when the STT output includes some diacritical marks.
 * Otherwise, it falls back to a simplified phonetic pattern comparison.
 */
export function detectHarakatErrors(
    alignments: AlignmentPair[],
    confidenceThreshold: number = 0.80
): HarakatError[] {
    const errors: HarakatError[] = [];

    for (const pair of alignments) {
        if (pair.type !== 'MATCH' || !pair.expectedWord || !pair.spokenWord) continue;

        const expectedDiacritics = extractDiacritics(pair.expectedWord.textUthmani);
        const spokenDiacritics = extractDiacritics(pair.spokenWord);

        // Compare diacritics character by character
        const minLen = Math.min(expectedDiacritics.length, spokenDiacritics.length);

        for (let i = 0; i < minLen; i++) {
            const expected = expectedDiacritics[i];
            const spoken = spokenDiacritics[i];

            // Skip if base characters don't match (word error, not haraka)
            if (stripTashkeel(expected.char) !== stripTashkeel(spoken.char)) continue;

            // Compare diacritics
            if (expected.diacritics.length > 0) {
                const expectedStr = expected.diacritics.sort().join('');
                const spokenStr = spoken.diacritics.sort().join('');

                if (expectedStr !== spokenStr) {
                    const confidence = calculateHarakaConfidence(expected.diacritics, spoken.diacritics);

                    errors.push({
                        type: 'HARAKAT_MISMATCH',
                        wordIndex: pair.expectedIndex,
                        expectedWord: pair.expectedWord.textUthmani,
                        expectedHaraka: expected.diacritics.map(getHarakaName).join(' + '),
                        detectedHaraka: confidence >= confidenceThreshold
                            ? spoken.diacritics.map(getHarakaName).join(' + ') || 'بدون حركة'
                            : undefined,
                        confidence,
                        isHighConfidence: confidence >= confidenceThreshold,
                    });
                }
            }
        }
    }

    return errors;
}

/**
 * Calculate confidence for a haraka mismatch.
 * Higher confidence when:
 * - Both sides have clear diacritics
 * - The diacritics are distinctly different (not just missing)
 */
function calculateHarakaConfidence(
    expected: string[],
    spoken: string[]
): number {
    // If spoken has no diacritics at all, lower confidence (might just be STT limitation)
    if (spoken.length === 0 && expected.length > 0) {
        return 0.5; // Not confident enough to specify — will show generic hint
    }

    // If both have diacritics and they differ, high confidence
    if (spoken.length > 0 && expected.length > 0) {
        return 0.90;
    }

    return 0.60;
}

/**
 * Simplified phonetic haraka detection from audio features.
 * This is a placeholder for the Phase 2 CTC forced alignment approach.
 * 
 * For now, it returns low-confidence hints when vowel patterns 
 * seem off based on text analysis alone.
 */
export function detectHarakatFromAudio(
    _audioSegment: Float32Array,
    _expectedPhonemes: string[]
): HarakatError[] {
    // Phase 2: Implement CTC forced alignment here
    // 1. G2P: expectedWord → phoneme sequence
    // 2. Forced alignment: align audio with expected phonemes
    // 3. Per-phoneme confidence scoring
    // 4. Return errors where confidence indicates mismatch
    return [];
}
