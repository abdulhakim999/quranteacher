'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { QuranSurah, QuranMetadata, RecitationError, MatchResult } from '@/lib/quran/types';
import { loadSurah, getMetadata } from '@/lib/quran/dataset';
import { normalizeArabic, tokenize } from '@/lib/quran/normalize';
import { findMatch } from '@/lib/quran/matcher';
import { alignWords } from '@/lib/quran/aligner';
import { detectWordErrors } from '@/lib/errors/wordErrors';
import { detectHarakatErrors } from '@/lib/errors/harakatErrors';
import { AudioCapture, float32ToInt16 } from '@/lib/audio/capture';

interface UseRecitationOptions {
    initialSurah?: number;
    initialAyah?: number;
}

type RecitationStatus = 'idle' | 'listening' | 'processing' | 'error';

export function useRecitation(options: UseRecitationOptions = {}) {
    const { initialSurah = 1, initialAyah = 1 } = options;

    const [isRecording, setIsRecording] = useState(false);
    const [currentSurah, setCurrentSurah] = useState(initialSurah);
    const [currentAyah, setCurrentAyah] = useState(initialAyah);
    const [currentWordIndex, setCurrentWordIndex] = useState(-1);
    const [recognizedText, setRecognizedText] = useState('');
    const [errors, setErrors] = useState<RecitationError[]>([]);
    const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
    const [surah, setSurah] = useState<QuranSurah | null>(null);
    const [metadata, setMetadata] = useState<QuranMetadata | null>(null);
    const [status, setStatus] = useState<RecitationStatus>('idle');
    const [statusMessage, setStatusMessage] = useState('');

    const audioCapture = useRef<AudioCapture | null>(null);
    const accumulatedText = useRef('');

    // Load metadata on mount
    useEffect(() => {
        getMetadata().then(setMetadata).catch(err => {
            console.error('Failed to load metadata:', err);
        });
    }, []);

    // Load surah when currentSurah changes
    useEffect(() => {
        loadSurah(currentSurah).then(setSurah).catch(err => {
            console.error('Failed to load surah:', err);
            setStatusMessage(`فشل تحميل السورة ${currentSurah}`);
        });
    }, [currentSurah]);

    const processRecognizedText = useCallback(
        (text: string) => {
            if (!surah) return;

            accumulatedText.current += ' ' + text;
            const fullText = accumulatedText.current.trim();
            setRecognizedText(fullText);

            const normalizedSpoken = normalizeArabic(fullText);
            const spokenTokens = tokenize(normalizedSpoken);

            if (spokenTokens.length === 0) return;

            // Find match position
            const match = findMatch(fullText, [surah], {
                startSurah: currentSurah,
                startAyah: currentAyah,
            });

            if (match) {
                setMatchResult(match);
                setCurrentAyah(match.ayah);
                setCurrentWordIndex(match.wordEnd);

                // Get expected words for the matched ayah
                const ayahData = surah.ayahs.find((a) => a.number === match.ayah);
                if (ayahData) {
                    const expectedWords = ayahData.words.slice(match.wordStart, match.wordEnd + 1);
                    const spokenWordsForAlignment = spokenTokens.slice(-expectedWords.length);

                    // Align words
                    const alignments = alignWords(spokenWordsForAlignment, expectedWords);

                    // Detect word errors
                    const wordErrors = detectWordErrors(alignments);

                    // Detect harakat errors
                    const harakatErrors = detectHarakatErrors(alignments);

                    setErrors([...wordErrors, ...harakatErrors]);
                }
            }
        },
        [surah, currentSurah, currentAyah]
    );

    const startRecording = useCallback(async () => {
        try {
            setStatus('listening');
            setIsRecording(true);
            setErrors([]);
            setCurrentWordIndex(-1);
            setStatusMessage('');
            accumulatedText.current = '';
            setRecognizedText('');

            audioCapture.current = new AudioCapture({
                sampleRate: 16000,
                chunkDurationMs: 2000,
                onChunk: async (chunk) => {
                    setStatus('processing');

                    const audioData = float32ToInt16(chunk);
                    const result = await sendToSTT(audioData);

                    if (result?.text) {
                        processRecognizedText(result.text);
                        setStatusMessage('');
                    } else if (result?.error) {
                        console.error('STT error:', result.error);
                        setStatusMessage(result.error);
                    }

                    setStatus('listening');
                },
                onError: (error) => {
                    console.error('Audio capture error:', error);
                    setIsRecording(false);
                    setStatus('error');
                    setStatusMessage('خطأ في التقاط الصوت: ' + error.message);
                },
            });

            await audioCapture.current.start();
        } catch (error) {
            console.error('Failed to start recording:', error);
            setIsRecording(false);
            setStatus('error');
            setStatusMessage('فشل بدء التسجيل. تأكد من السماح بالوصول إلى الميكروفون.');
        }
    }, [processRecognizedText]);

    const stopRecording = useCallback(() => {
        audioCapture.current?.stop();
        setIsRecording(false);
        setStatus('idle');
    }, []);

    const changeSurah = useCallback((surahNumber: number) => {
        setCurrentSurah(surahNumber);
        setCurrentAyah(1);
        setCurrentWordIndex(-1);
        setErrors([]);
        setRecognizedText('');
        setStatusMessage('');
        accumulatedText.current = '';
    }, []);

    const changeAyah = useCallback((ayahNumber: number) => {
        setCurrentAyah(ayahNumber);
        setCurrentWordIndex(-1);
        setErrors([]);
        setRecognizedText('');
        setStatusMessage('');
        accumulatedText.current = '';
    }, []);

    return {
        isRecording,
        currentSurah,
        currentAyah,
        currentWordIndex,
        recognizedText,
        errors,
        matchResult,
        surah,
        metadata,
        status,
        statusMessage,
        startRecording,
        stopRecording,
        changeSurah,
        changeAyah,
    };
}

/**
 * Send audio to STT REST API endpoint (OpenAI Whisper).
 */
async function sendToSTT(audioData: ArrayBuffer): Promise<{ text: string; error?: string } | null> {
    try {
        const response = await fetch('/api/stt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/octet-stream' },
            body: audioData,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('STT API error:', response.status, errorData);
            return { text: '', error: errorData?.error || `خطأ في API: ${response.status}` };
        }

        return response.json();
    } catch (err) {
        console.error('STT network error:', err);
        return { text: '', error: 'خطأ في الاتصال بالخادم' };
    }
}
