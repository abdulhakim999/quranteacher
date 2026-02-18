/**
 * Word-level error detection.
 * 
 * Takes alignment pairs and generates actionable error objects
 * for the UI to display.
 */

import type { AlignmentPair, WordError } from '../quran/types';
import { similarity } from '../quran/normalize';

/**
 * Detect word-level errors from alignment results.
 */
export function detectWordErrors(alignments: AlignmentPair[]): WordError[] {
    const errors: WordError[] = [];

    for (const pair of alignments) {
        switch (pair.type) {
            case 'DELETION':
                errors.push({
                    type: 'MISSING',
                    wordIndex: pair.expectedIndex,
                    expectedWord: pair.expectedWord?.textUthmani || '',
                    confidence: 0.95,
                });
                break;

            case 'INSERTION':
                errors.push({
                    type: 'EXTRA',
                    wordIndex: pair.expectedIndex,
                    expectedWord: '',
                    spokenWord: pair.spokenWord,
                    confidence: 0.90,
                });
                break;

            case 'SUBSTITUTION':
                if (pair.expectedWord && pair.spokenWord) {
                    const sim = similarity(
                        pair.spokenWord,
                        pair.expectedWord.textNormalized
                    );
                    errors.push({
                        type: 'SUBSTITUTION',
                        wordIndex: pair.expectedIndex,
                        expectedWord: pair.expectedWord.textUthmani,
                        spokenWord: pair.spokenWord,
                        confidence: 1 - sim, // Higher confidence = more different
                    });
                }
                break;
        }
    }

    return errors;
}
