'use client';

import Navbar from '@/components/Navbar';
import MushafViewer from '@/components/MushafViewer';
import ErrorFeedback from '@/components/ErrorFeedback';
import { useRecitation } from '@/hooks/useRecitation';

export default function RecitePage() {
    const {
        isRecording,
        currentAyah,
        currentWordIndex,
        recognizedText,
        errors,
        surah,
        metadata,
        status,
        statusMessage,
        startRecording,
        stopRecording,
        changeSurah,
        changeAyah,
    } = useRecitation({ initialSurah: 1, initialAyah: 1 });

    return (
        <div className="page">
            <Navbar />
            <div className="page-content">
                <div className="container">
                    {/* Recitation Controls */}
                    <div className="card" style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 'var(--space-4)',
                        marginBottom: 'var(--space-6)',
                        padding: 'var(--space-6)',
                    }}>
                        {/* Status */}
                        <div className="status-indicator">
                            <div className={`status-dot ${isRecording ? 'recording' : status === 'processing' ? 'active' : status === 'error' ? '' : ''}`} />
                            <span>
                                {status === 'idle' && 'جاهز للتلاوة'}
                                {status === 'listening' && 'يستمع... تحدث الآن'}
                                {status === 'processing' && 'يعالج...'}
                                {status === 'error' && 'خطأ'}
                            </span>
                        </div>

                        {/* Status Message */}
                        {statusMessage && (
                            <p style={{
                                fontSize: 'var(--text-sm)',
                                color: status === 'error' ? 'var(--color-error)' : 'var(--text-muted)',
                                textAlign: 'center',
                                margin: 0,
                            }}>
                                {statusMessage}
                            </p>
                        )}

                        {/* Record Button */}
                        <button
                            className={`btn-record ${isRecording ? 'recording' : ''}`}
                            onClick={isRecording ? stopRecording : startRecording}
                            title={isRecording ? 'إيقاف التسجيل' : 'بدء التسجيل'}
                        >
                            {isRecording ? '⏹' : '🎙️'}
                        </button>

                        {/* Error Count */}
                        <div style={{
                            display: 'flex',
                            gap: 'var(--space-4)',
                            fontSize: 'var(--text-sm)',
                            color: 'var(--text-muted)',
                        }}>
                            <span style={{ color: errors.filter(e => e.type !== 'HARAKAT_MISMATCH').length > 0 ? 'var(--color-error)' : undefined }}>
                                ⚠️ أخطاء كلمات: {errors.filter(e => e.type !== 'HARAKAT_MISMATCH').length}
                            </span>
                            <span style={{ color: errors.filter(e => e.type === 'HARAKAT_MISMATCH').length > 0 ? 'var(--color-warning)' : undefined }}>
                                🔤 أخطاء تشكيل: {errors.filter(e => e.type === 'HARAKAT_MISMATCH').length}
                            </span>
                        </div>
                    </div>

                    {/* Recognized Text */}
                    {recognizedText && (
                        <div className="card" style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-4)' }}>
                            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-2)' }}>
                                النص المعروف:
                            </p>
                            <p style={{ fontFamily: 'var(--font-arabic)', fontSize: 'var(--text-lg)', color: 'var(--text-secondary)' }}>
                                {recognizedText}
                            </p>
                        </div>
                    )}

                    {/* Mushaf Viewer */}
                    <MushafViewer
                        surah={surah ?? undefined}
                        metadata={metadata ?? undefined}
                        currentAyah={currentAyah}
                        currentWordIndex={currentWordIndex}
                        errors={errors}
                        onSurahChange={changeSurah}
                        onAyahChange={changeAyah}
                    />
                </div>
            </div>

            {/* Error Toast Feedback */}
            <ErrorFeedback errors={errors} />
        </div>
    );
}
