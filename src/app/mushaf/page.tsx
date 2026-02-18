'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import MushafViewer from '@/components/MushafViewer';
import type { QuranSurah, QuranMetadata } from '@/lib/quran/types';
import { loadSurah, getMetadata } from '@/lib/quran/dataset';

export default function MushafPage() {
    const [surah, setSurah] = useState<QuranSurah | null>(null);
    const [metadata, setMetadata] = useState<QuranMetadata | null>(null);
    const [currentAyah, setCurrentAyah] = useState(1);

    useEffect(() => {
        getMetadata().then(setMetadata);
        loadSurah(1).then(setSurah);
    }, []);

    const handleSurahChange = async (surahNumber: number) => {
        const s = await loadSurah(surahNumber);
        setSurah(s);
        setCurrentAyah(1);
    };

    return (
        <div className="page">
            <Navbar />
            <div className="page-content">
                <div className="container">
                    <MushafViewer
                        surah={surah ?? undefined}
                        metadata={metadata ?? undefined}
                        currentAyah={currentAyah}
                        onSurahChange={handleSurahChange}
                        onAyahChange={setCurrentAyah}
                    />
                </div>
            </div>
        </div>
    );
}
