'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { AudioCapture, float32ToInt16 } from '@/lib/audio/capture';
import { normalizeArabic } from '@/lib/quran/normalize';
import type { QuranSurah, MatchResult } from '@/lib/quran/types';
import { searchQuran } from '@/lib/quran/matcher';
import { loadSurah, getMetadata } from '@/lib/quran/dataset';
import Link from 'next/link';

export default function SearchPage() {
    const [isRecording, setIsRecording] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<MatchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const audioCapture = useRef<AudioCapture | null>(null);
    const loadedSurahs = useRef<QuranSurah[]>([]);

    // Pre-load common short surahs for search
    useEffect(() => {
        async function loadCommonSurahs() {
            const metadata = await getMetadata();
            // Load last 20 surahs (most commonly memorized)
            const surahNumbers = metadata.surahs
                .filter(s => s.number >= 95)
                .map(s => s.number);

            for (const num of surahNumbers) {
                try {
                    const surah = await loadSurah(num);
                    loadedSurahs.current.push(surah);
                } catch { /* Skip failed loads */ }
            }

            // Also load Al-Fatiha
            try {
                const fatiha = await loadSurah(1);
                if (!loadedSurahs.current.find(s => s.number === 1)) {
                    loadedSurahs.current.unshift(fatiha);
                }
            } catch { /* Skip */ }
        }
        loadCommonSurahs();
    }, []);

    const performSearch = useCallback((text: string) => {
        if (!text.trim()) {
            setResults([]);
            return;
        }

        setIsSearching(true);

        // Search across loaded surahs
        const matches = searchQuran(text, loadedSurahs.current, 5);
        setResults(matches);
        setIsSearching(false);
    }, []);

    const startVoiceSearch = useCallback(async () => {
        try {
            setIsRecording(true);
            setResults([]);

            audioCapture.current = new AudioCapture({
                sampleRate: 16000,
                chunkDurationMs: 3000, // Longer chunks for search
                onChunk: async (chunk) => {
                    const audioData = float32ToInt16(chunk);

                    try {
                        const response = await fetch('/api/stt', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/octet-stream' },
                            body: audioData,
                        });

                        if (response.ok) {
                            const result = await response.json();
                            if (result.text) {
                                setQuery(result.text);
                                performSearch(result.text);
                            }
                        }
                    } catch { /* Ignore errors */ }
                },
            });

            await audioCapture.current.start();

            // Auto-stop after 5 seconds
            setTimeout(() => {
                stopVoiceSearch();
            }, 5000);
        } catch {
            setIsRecording(false);
        }
    }, [performSearch]);

    const stopVoiceSearch = useCallback(() => {
        audioCapture.current?.stop();
        setIsRecording(false);
    }, []);

    return (
        <div className="page">
            <Navbar />
            <div className="page-content">
                <div className="container">
                    <div className="voice-search">
                        <h1 style={{
                            fontFamily: 'var(--font-arabic)',
                            fontSize: 'var(--text-3xl)',
                            color: 'var(--text-primary)',
                        }}>
                            🔍 البحث الصوتي
                        </h1>
                        <p className="voice-search-hint">
                            انطق أي مقطع من القرآن الكريم وسيبحث النظام عن الآيات المطابقة
                        </p>

                        {/* Voice Search Button */}
                        <button
                            className={`btn-record ${isRecording ? 'recording' : ''}`}
                            onClick={isRecording ? stopVoiceSearch : startVoiceSearch}
                            style={{ margin: 'var(--space-4) 0' }}
                        >
                            {isRecording ? '⏹' : '🎤'}
                        </button>

                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
                            {isRecording ? 'يستمع... انطق الآية' : 'اضغط للبحث الصوتي'}
                        </p>

                        {/* Text Search Fallback */}
                        <div style={{ width: '100%', maxWidth: '500px', marginTop: 'var(--space-6)' }}>
                            <input
                                type="text"
                                className="input"
                                placeholder="أو اكتب نص الآية هنا..."
                                value={query}
                                onChange={(e) => {
                                    setQuery(e.target.value);
                                    performSearch(e.target.value);
                                }}
                                style={{ fontFamily: 'var(--font-arabic)', fontSize: 'var(--text-lg)', textAlign: 'center' }}
                            />
                        </div>

                        {/* Results */}
                        {isSearching && (
                            <div className="spinner" style={{ marginTop: 'var(--space-6)' }} />
                        )}

                        {results.length > 0 && (
                            <div className="search-results" style={{ marginTop: 'var(--space-6)' }}>
                                <h3 style={{
                                    fontFamily: 'var(--font-arabic)',
                                    fontSize: 'var(--text-lg)',
                                    marginBottom: 'var(--space-4)',
                                    color: 'var(--text-secondary)',
                                }}>
                                    النتائج ({results.length})
                                </h3>

                                {results.map((result, i) => (
                                    <Link
                                        key={i}
                                        href={`/mushaf?surah=${result.surah}&ayah=${result.ayah}`}
                                        style={{ textDecoration: 'none' }}
                                    >
                                        <div className="search-result-item">
                                            <div className="search-result-ref">
                                                سورة {result.surah} — آية {result.ayah} (ثقة: {Math.round(result.confidence * 100)}%)
                                            </div>
                                            <div className="search-result-text">
                                                {result.matchedText}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}

                        {query && results.length === 0 && !isSearching && (
                            <p style={{
                                marginTop: 'var(--space-6)',
                                color: 'var(--text-muted)',
                                fontSize: 'var(--text-sm)',
                            }}>
                                لم يتم العثور على نتائج. حاول نطق مقطع أطول.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
