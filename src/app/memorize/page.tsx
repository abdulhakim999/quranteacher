'use client';

import { useState, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import MushafViewer from '@/components/MushafViewer';
import { useRecitation } from '@/hooks/useRecitation';

export default function MemorizePage() {
    const {
        isRecording,
        currentAyah,
        currentWordIndex,
        errors,
        surah,
        metadata,
        status,
        startRecording,
        stopRecording,
        changeSurah,
        changeAyah,
    } = useRecitation({ initialSurah: 1, initialAyah: 1 });

    const [revealedUpTo, setRevealedUpTo] = useState(-1);
    const [score, setScore] = useState(0);

    // When word index advances correctly, reveal next word
    const handleReveal = useCallback(() => {
        if (surah) {
            const ayahData = surah.ayahs.find(a => a.number === currentAyah);
            if (ayahData) {
                const nextReveal = revealedUpTo + 1;
                if (nextReveal < ayahData.words.length) {
                    setRevealedUpTo(nextReveal);

                    // Update score
                    const totalWords = ayahData.words.length;
                    const errorsForWord = errors.filter(e => e.wordIndex === nextReveal);
                    if (errorsForWord.length === 0) {
                        setScore(prev => Math.round(((nextReveal + 1) / totalWords) * 100));
                    }
                }
            }
        }
    }, [surah, currentAyah, revealedUpTo, errors]);

    return (
        <div className="page">
            <Navbar />
            <div className="page-content">
                <div className="container">
                    {/* Header */}
                    <div style={{
                        textAlign: 'center',
                        marginBottom: 'var(--space-8)',
                    }}>
                        <h1 style={{
                            fontFamily: 'var(--font-arabic)',
                            fontSize: 'var(--text-3xl)',
                            color: 'var(--text-primary)',
                            marginBottom: 'var(--space-2)',
                        }}>
                            🧠 وضع الحفظ
                        </h1>
                        <p style={{ color: 'var(--text-muted)' }}>
                            النص مخفي — اقرأ من حفظك وسيتم كشف الكلمات تدريجياً
                        </p>
                    </div>

                    {/* Controls */}
                    <div className="card" style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 'var(--space-6)',
                        marginBottom: 'var(--space-6)',
                        padding: 'var(--space-6)',
                        flexWrap: 'wrap',
                    }}>
                        <button
                            className={`btn-record ${isRecording ? 'recording' : ''}`}
                            onClick={isRecording ? stopRecording : startRecording}
                        >
                            {isRecording ? '⏹' : '🎙️'}
                        </button>

                        <div className="score-display">
                            <div>
                                <div className="score-value">{score}%</div>
                                <div className="score-label">النتيجة</div>
                            </div>
                        </div>

                        <button
                            className="btn btn-secondary"
                            onClick={handleReveal}
                        >
                            👁️ كشف الكلمة التالية
                        </button>

                        <button
                            className="btn btn-ghost"
                            onClick={() => {
                                setRevealedUpTo(-1);
                                setScore(0);
                            }}
                        >
                            🔄 إعادة
                        </button>
                    </div>

                    {/* Mushaf with hidden text */}
                    <MushafViewer
                        surah={surah ?? undefined}
                        metadata={metadata ?? undefined}
                        currentAyah={currentAyah}
                        currentWordIndex={currentWordIndex}
                        errors={errors}
                        mode="memorize"
                        revealedUpTo={revealedUpTo}
                        onSurahChange={changeSurah}
                        onAyahChange={(ayah) => {
                            changeAyah(ayah);
                            setRevealedUpTo(-1);
                            setScore(0);
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
