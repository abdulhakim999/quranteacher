// Quran data types

export interface QuranWord {
    index: number;
    textUthmani: string;     // Full diacritized text
    textNormalized: string;  // Without tashkeel
    charOffset: number;      // Character offset within ayah
}

export interface QuranAyah {
    number: number;
    text: string;            // Full diacritized ayah text
    textNormalized: string;  // Without tashkeel
    words: QuranWord[];
    juz: number;
    hizb: number;
    page: number;
}

export interface QuranSurah {
    number: number;
    name: string;
    nameEnglish: string;
    nameTransliteration: string;
    revelationType: 'Meccan' | 'Medinan';
    ayahCount: number;
    ayahs: QuranAyah[];
}

export interface QuranMetadata {
    surahs: {
        number: number;
        name: string;
        nameEnglish: string;
        nameTransliteration: string;
        revelationType: 'Meccan' | 'Medinan';
        ayahCount: number;
    }[];
}

// Match result from fuzzy matching
export interface MatchResult {
    surah: number;
    ayah: number;
    wordStart: number;
    wordEnd: number;
    confidence: number;
    matchedText: string;
}

// Alignment types
export type AlignmentType = 'MATCH' | 'SUBSTITUTION' | 'INSERTION' | 'DELETION';

export interface AlignmentPair {
    type: AlignmentType;
    expectedWord?: QuranWord;
    spokenWord?: string;
    expectedIndex: number;
    spokenIndex: number;
}

// Error types
export interface WordError {
    type: 'MISSING' | 'EXTRA' | 'SUBSTITUTION';
    wordIndex: number;
    expectedWord: string;
    spokenWord?: string;
    confidence: number;
}

export interface HarakatError {
    type: 'HARAKAT_MISMATCH';
    wordIndex: number;
    expectedWord: string;
    expectedHaraka: string;
    detectedHaraka?: string;
    confidence: number;
    isHighConfidence: boolean;
}

export type RecitationError = WordError | HarakatError;

// Recitation state
export interface RecitationState {
    isRecording: boolean;
    currentSurah: number;
    currentAyah: number;
    currentWordIndex: number;
    recognizedText: string;
    errors: RecitationError[];
    matchResult: MatchResult | null;
    alignments: AlignmentPair[];
}

// STT response from backend
export interface STTResponse {
    text: string;
    words: STTWord[];
    isFinal: boolean;
}

export interface STTWord {
    word: string;
    start: number;
    end: number;
}
