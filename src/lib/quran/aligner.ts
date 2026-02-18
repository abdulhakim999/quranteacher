/**
 * Word Alignment using Dynamic Programming (Needleman-Wunsch variant).
 * 
 * Aligns spoken words against expected Quran words to identify:
 * - MATCH: Correct word
 * - SUBSTITUTION: Wrong word spoken
 * - INSERTION: Extra word spoken
 * - DELETION: Missing word (not recited)
 */

import { similarity } from './normalize';
import type { AlignmentPair, AlignmentType, QuranWord } from './types';

/** Scoring parameters for alignment */
const MATCH_SCORE = 2;
const MISMATCH_PENALTY = -1;
const GAP_PENALTY = -2;
const SIMILARITY_THRESHOLD = 0.75; // Above this, consider it a match

/**
 * Perform word-level alignment between spoken words and expected Quran words.
 */
export function alignWords(
    spokenWords: string[],
    expectedWords: QuranWord[]
): AlignmentPair[] {
    const m = spokenWords.length;
    const n = expectedWords.length;

    // Build score matrix
    const score: number[][] = Array(m + 1)
        .fill(null)
        .map(() => Array(n + 1).fill(0));

    // Traceback matrix: 0=diag, 1=up(insertion), 2=left(deletion)
    const trace: number[][] = Array(m + 1)
        .fill(null)
        .map(() => Array(n + 1).fill(0));

    // Initialize first row/column
    for (let i = 0; i <= m; i++) {
        score[i][0] = i * GAP_PENALTY;
        trace[i][0] = 1; // up
    }
    for (let j = 0; j <= n; j++) {
        score[0][j] = j * GAP_PENALTY;
        trace[0][j] = 2; // left
    }

    // Fill matrix
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            const sim = similarity(spokenWords[i - 1], expectedWords[j - 1].textNormalized);
            const diagScore = score[i - 1][j - 1] + (sim >= SIMILARITY_THRESHOLD ? MATCH_SCORE : MISMATCH_PENALTY);
            const upScore = score[i - 1][j] + GAP_PENALTY;
            const leftScore = score[i][j - 1] + GAP_PENALTY;

            if (diagScore >= upScore && diagScore >= leftScore) {
                score[i][j] = diagScore;
                trace[i][j] = 0; // diagonal
            } else if (upScore >= leftScore) {
                score[i][j] = upScore;
                trace[i][j] = 1; // up (insertion - extra spoken word)
            } else {
                score[i][j] = leftScore;
                trace[i][j] = 2; // left (deletion - missing word)
            }
        }
    }

    // Traceback
    const alignments: AlignmentPair[] = [];
    let i = m;
    let j = n;

    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && trace[i][j] === 0) {
            // Diagonal — match or substitution
            const sim = similarity(spokenWords[i - 1], expectedWords[j - 1].textNormalized);
            const type: AlignmentType = sim >= SIMILARITY_THRESHOLD ? 'MATCH' : 'SUBSTITUTION';
            alignments.unshift({
                type,
                expectedWord: expectedWords[j - 1],
                spokenWord: spokenWords[i - 1],
                expectedIndex: j - 1,
                spokenIndex: i - 1,
            });
            i--;
            j--;
        } else if (i > 0 && trace[i][j] === 1) {
            // Up — insertion (extra spoken word)
            alignments.unshift({
                type: 'INSERTION',
                spokenWord: spokenWords[i - 1],
                expectedIndex: j,
                spokenIndex: i - 1,
            });
            i--;
        } else {
            // Left — deletion (missing expected word)
            alignments.unshift({
                type: 'DELETION',
                expectedWord: expectedWords[j - 1],
                expectedIndex: j - 1,
                spokenIndex: i,
            });
            j--;
        }
    }

    return alignments;
}
