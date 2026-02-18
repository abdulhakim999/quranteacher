'use client';

import type { QuranAyah, RecitationError } from '@/lib/quran/types';

interface AyahDisplayProps {
    ayah: QuranAyah;
    currentWordIndex?: number;
    errors?: RecitationError[];
    isCurrentAyah?: boolean;
    mode?: 'normal' | 'memorize';
    revealedUpTo?: number;
    quranFontSize?: number;
}

export default function AyahDisplay({
    ayah,
    currentWordIndex = -1,
    errors = [],
    isCurrentAyah = false,
    mode = 'normal',
    revealedUpTo = -1,
    quranFontSize,
}: AyahDisplayProps) {
    const getWordClass = (wordIndex: number): string => {
        const classes = ['quran-word'];

        // Memorization mode
        if (mode === 'memorize') {
            if (revealedUpTo >= 0 && wordIndex <= revealedUpTo) {
                classes.push('word-revealed');
            } else if (revealedUpTo >= 0) {
                classes.push('word-hidden');
            } else {
                classes.push('word-hidden');
            }
        }

        // Current word highlight
        if (isCurrentAyah && wordIndex === currentWordIndex) {
            classes.push('word-current');
        }

        // Error highlighting
        const wordErrors = errors.filter(
            (e) => e.wordIndex === wordIndex
        );

        for (const error of wordErrors) {
            if (error.type === 'MISSING') {
                classes.push('word-error-missing');
            } else if (error.type === 'SUBSTITUTION') {
                classes.push('word-error-substitution');
            } else if (error.type === 'EXTRA') {
                classes.push('word-error-extra');
            } else if (error.type === 'HARAKAT_MISMATCH') {
                classes.push('word-error-haraka');
            }
        }

        // Mark correct words
        if (
            isCurrentAyah &&
            wordIndex < currentWordIndex &&
            wordErrors.length === 0
        ) {
            classes.push('word-correct');
        }

        return classes.join(' ');
    };

    return (
        <div
            className="ayah-container"
            style={{
                opacity: isCurrentAyah ? 1 : 0.6,
                fontSize: quranFontSize ? `${quranFontSize}px` : undefined,
            }}
        >
            <span className="quran-text">
                {ayah.words.map((word) => (
                    <span
                        key={word.index}
                        className={getWordClass(word.index)}
                        data-word-index={word.index}
                        title={mode === 'normal' ? word.textUthmani : undefined}
                    >
                        {word.textUthmani}
                    </span>
                ))}
                <span className="ayah-number">{ayah.number}</span>
            </span>
        </div>
    );
}
