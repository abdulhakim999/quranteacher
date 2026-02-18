'use client';

import { useState, useEffect } from 'react';
import type { QuranSurah, QuranMetadata, RecitationError } from '@/lib/quran/types';
import AyahDisplay from './AyahDisplay';

interface MushafViewerProps {
    surah?: QuranSurah;
    metadata?: QuranMetadata;
    currentAyah?: number;
    currentWordIndex?: number;
    errors?: RecitationError[];
    mode?: 'normal' | 'memorize';
    revealedUpTo?: number;
    onSurahChange?: (surahNumber: number) => void;
    onAyahChange?: (ayahNumber: number) => void;
}

export default function MushafViewer({
    surah,
    metadata,
    currentAyah = 1,
    currentWordIndex = -1,
    errors = [],
    mode = 'normal',
    revealedUpTo = -1,
    onSurahChange,
    onAyahChange,
}: MushafViewerProps) {
    const [fontSize, setFontSize] = useState(28);
    const [showSelector, setShowSelector] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('quranFontSize');
        if (stored) setFontSize(parseInt(stored, 10));
    }, []);

    const handleFontSizeChange = (size: number) => {
        setFontSize(size);
        localStorage.setItem('quranFontSize', String(size));
    };

    if (!surah) {
        return (
            <div className="card text-center" style={{ padding: '4rem' }}>
                <div className="spinner" style={{ margin: '0 auto 1rem' }} />
                <p style={{ color: 'var(--text-muted)' }}>جارٍ تحميل السورة...</p>
            </div>
        );
    }

    return (
        <div className="mushaf-viewer">
            {/* Header Controls */}
            <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
                    {/* Surah Selector */}
                    <div className="selector">
                        <button
                            className="selector-trigger"
                            onClick={() => setShowSelector(!showSelector)}
                        >
                            <span style={{ fontFamily: 'var(--font-arabic)' }}>{surah.name}</span>
                            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>▼</span>
                        </button>

                        {showSelector && metadata && (
                            <div className="selector-dropdown">
                                {metadata.surahs.map((s) => (
                                    <div
                                        key={s.number}
                                        className={`selector-item ${s.number === surah.number ? 'selected' : ''}`}
                                        onClick={() => {
                                            onSurahChange?.(s.number);
                                            setShowSelector(false);
                                        }}
                                    >
                                        <span className="selector-number">{s.number}</span>
                                        <div>
                                            <div style={{ fontFamily: 'var(--font-arabic)', fontWeight: 600 }}>
                                                {s.name}
                                            </div>
                                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                                                {s.nameEnglish} • {s.ayahCount} آية
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Ayah Navigation */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <button
                            className="btn btn-ghost btn-icon"
                            onClick={() => onAyahChange?.(Math.max(1, currentAyah - 1))}
                            disabled={currentAyah <= 1}
                        >
                            ▶
                        </button>
                        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', minWidth: '60px', textAlign: 'center' }}>
                            آية {currentAyah}/{surah.ayahCount}
                        </span>
                        <button
                            className="btn btn-ghost btn-icon"
                            onClick={() => onAyahChange?.(Math.min(surah.ayahCount, currentAyah + 1))}
                            disabled={currentAyah >= surah.ayahCount}
                        >
                            ◀
                        </button>
                    </div>

                    {/* Font Size */}
                    <div className="font-slider">
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>أ</span>
                        <input
                            type="range"
                            min="18"
                            max="48"
                            value={fontSize}
                            onChange={(e) => handleFontSizeChange(parseInt(e.target.value, 10))}
                        />
                        <span style={{ fontSize: 'var(--text-lg)', color: 'var(--text-muted)' }}>أ</span>
                    </div>
                </div>
            </div>

            {/* Surah Header */}
            <div className="surah-header">
                <h1 className="surah-name">{surah.name}</h1>
                <p className="surah-info">
                    {surah.nameEnglish} • {surah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'} • {surah.ayahCount} آية
                </p>
            </div>

            {/* Bismillah (for all surahs except At-Tawbah) */}
            {surah.number !== 9 && (
                <p className="bismillah">بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ</p>
            )}

            {/* Ayahs */}
            <div className="card" style={{ padding: 'var(--space-8)' }}>
                {surah.ayahs.map((ayah) => {
                    const ayahErrors = errors.filter((e) => {
                        // Map error wordIndex to this ayah
                        return true; // Simplified — in production, errors carry ayah reference
                    });

                    return (
                        <AyahDisplay
                            key={ayah.number}
                            ayah={ayah}
                            currentWordIndex={ayah.number === currentAyah ? currentWordIndex : -1}
                            errors={ayah.number === currentAyah ? errors : []}
                            isCurrentAyah={ayah.number === currentAyah}
                            mode={mode}
                            revealedUpTo={ayah.number === currentAyah ? revealedUpTo : -1}
                            quranFontSize={fontSize}
                        />
                    );
                })}
            </div>
        </div>
    );
}
