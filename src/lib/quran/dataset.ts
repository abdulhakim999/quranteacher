/**
 * Quran Dataset Loader
 * 
 * Loads per-surah JSON data with word-level diacritized text.
 * Uses dynamic imports for lazy loading.
 */

import { normalizeArabic } from './normalize';
import type { QuranSurah, QuranAyah, QuranWord, QuranMetadata } from './types';

// Cache loaded surahs
const surahCache = new Map<number, QuranSurah>();

// Full metadata (always loaded)
let metadataCache: QuranMetadata | null = null;

/**
 * Get Quran metadata (surah names, ayah counts, etc.)
 */
export async function getMetadata(): Promise<QuranMetadata> {
    if (metadataCache) return metadataCache;

    const response = await fetch('/data/quran/metadata.json');
    metadataCache = await response.json();
    return metadataCache!;
}

/**
 * Load a single surah by number (1-114).
 */
export async function loadSurah(surahNumber: number): Promise<QuranSurah> {
    if (surahCache.has(surahNumber)) {
        return surahCache.get(surahNumber)!;
    }

    const paddedNum = String(surahNumber).padStart(3, '0');
    const response = await fetch(`/data/quran/surahs/${paddedNum}.json`);
    if (!response.ok) {
        throw new Error(`Failed to load surah ${surahNumber}: HTTP ${response.status}`);
    }
    const surah: QuranSurah = await response.json();

    // Pre-compute normalized text for all words
    for (const ayah of surah.ayahs) {
        ayah.textNormalized = normalizeArabic(ayah.text);
        let offset = 0;
        for (const word of ayah.words) {
            word.textNormalized = normalizeArabic(word.textUthmani);
            word.charOffset = offset;
            offset += word.textUthmani.length + 1;
        }
    }

    surahCache.set(surahNumber, surah);
    return surah;
}

/**
 * Load multiple surahs.
 */
export async function loadSurahs(numbers: number[]): Promise<QuranSurah[]> {
    return Promise.all(numbers.map(loadSurah));
}

/**
 * Get a specific ayah from a loaded surah.
 */
export function getAyah(surah: QuranSurah, ayahNumber: number): QuranAyah | undefined {
    return surah.ayahs.find(a => a.number === ayahNumber);
}

/**
 * Get words for a specific ayah.
 */
export function getAyahWords(surah: QuranSurah, ayahNumber: number): QuranWord[] {
    const ayah = getAyah(surah, ayahNumber);
    return ayah?.words || [];
}
